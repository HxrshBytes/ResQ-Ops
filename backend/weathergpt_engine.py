"""
weathergpt_engine.py - makes WeatherGPT answer NEW queries instead of replaying old ones.
"""
from __future__ import annotations

import json
import math
import re
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Optional, Protocol

IST = timezone(timedelta(hours=5, minutes=30))

SIM_THRESHOLD = 0.94        
CACHE_TTL_S = {"forecast": 1800, "alert": 300, "advisory": 3600, "general": 86400}
NOWCAST_MAX_AGE_S = 3600    
FORECAST_MAX_AGE_S = 6 * 3600

BREAKER_FAIL_LIMIT = 5
BREAKER_COOLDOWN_S = 30

@dataclass(frozen=True)
class Place:
    name: str
    district: str
    state: str
    lat: float
    lon: float

    @property
    def key(self) -> str:
        return f"{self.name}|{self.district}|{self.state}".lower()

    @property
    def label(self) -> str:
        return f"{self.name}, {self.district}"

@dataclass
class ToolResult:
    tool: str
    source: str                      
    observed_at: datetime
    values: dict[str, float] = field(default_factory=dict)
    text: dict[str, str] = field(default_factory=dict)
    ok: bool = True
    error: str = ""

    def age_s(self, now: datetime) -> float:
        return (now - self.observed_at).total_seconds()

@dataclass
class Answer:
    text: str
    intent: str
    place: Optional[Place]
    sources: list[dict]              
    confidence: str                  
    cached: bool = False
    degraded: bool = False
    needs_clarification: bool = False
    options: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

class LLM(Protocol):
    def complete(self, system: str, user: str) -> str: ...

class Embedder(Protocol):
    def embed(self, text: str) -> list[float]: ...

@dataclass
class EngineDeps:
    llm: LLM
    embedder: Embedder
    geocode: Callable[[str], list[Place]]
    tools: dict[str, Callable[[Place, dict], ToolResult]]
    cache_get: Callable[[str], Optional[dict]]
    cache_set: Callable[[str, dict, int], None]
    cache_scan: Callable[[str], list[dict]]      
    now: Callable[[], datetime] = lambda: datetime.now(IST)

FILLERS = r"\b(please|pls|kya|hai|bata|do|tell|me|give|the|a|an|is|are|of|in|at|for|to|what|whats|now|today|plz)\b"

def normalize(q: str) -> str:
    q = unicodedata.normalize("NFKC", q).lower().strip()
    q = re.sub(r"[^\w\s]", " ", q)
    q = re.sub(FILLERS, " ", q)
    return re.sub(r"\s+", " ", q).strip()

def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

INTENT_PATTERNS = [
    ("alert", r"\b(alert|warning|cyclone|chetavani|red alert|orange alert)\b"),
    ("route", r"\b(route|road|travel|drive|reach|kaise jau|safe way|jaana)\b"),
    ("forecast", r"\b(rain|barish|forecast|temperature|humidity|wind|weather|mausam|heat)\b"),
    ("advisory", r"\b(spray|pesticide|crop|fishing|boat|sea|launch|sow|harvest)\b"),
]

def classify(nq: str) -> str:
    for intent, pattern in INTENT_PATTERNS:
        if re.search(pattern, nq):
            return intent
    return "general"

INTENT_TOOLS = {
    "forecast": ["weather_now", "weather_forecast"],
    "alert": ["imd_alerts"],
    "advisory": ["weather_now", "agro_rules"],
    "route": ["weather_forecast", "route_safety"],
    "general": [],
}

def time_bucket(intent: str, now: datetime) -> str:
    if intent in ("alert", "route"):
        return now.strftime("%Y-%m-%dT%H")     
    return now.strftime("%Y-%m-%d")            

def cache_key(place: Optional[Place], intent: str, nq: str, now: datetime) -> str:
    return f"wgpt:{place.key if place else 'noplace'}:{intent}:{time_bucket(intent, now)}:{nq}"

def cache_prefix(place: Optional[Place], intent: str, now: datetime) -> str:
    return f"wgpt:{place.key if place else 'noplace'}:{intent}:{time_bucket(intent, now)}:"

def cache_lookup(deps: EngineDeps, place: Optional[Place], intent: str,
                 nq: str, vec: list[float], now: datetime) -> Optional[dict]:
    exact = deps.cache_get(cache_key(place, intent, nq, now))
    if exact and (now.timestamp() - exact.get("stored_at", 0)) < CACHE_TTL_S.get(intent, 600):
        return exact

    best, best_score = None, 0.0
    for entry in deps.cache_scan(cache_prefix(place, intent, now)):
        if (now.timestamp() - entry.get("stored_at", 0)) >= CACHE_TTL_S.get(intent, 600):
            continue
        score = cosine(vec, entry.get("vec", []))
        if score > best_score:
            best, best_score = entry, score
    return best if best_score >= SIM_THRESHOLD else None

class CircuitBreaker:
    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self.clock = clock
        self.failures = 0
        self.opened_at: Optional[float] = None

    @property
    def state(self) -> str:
        if self.opened_at is None:
            return "closed"
        return "half_open" if self.clock() - self.opened_at >= BREAKER_COOLDOWN_S else "open"

    def allows(self) -> bool:
        return self.state != "open"

    def record_success(self) -> None:
        self.failures = 0
        self.opened_at = None

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= BREAKER_FAIL_LIMIT:
            self.opened_at = self.clock()

NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")

def allowed_numbers(results: list[ToolResult]) -> set[str]:
    ok: set[str] = set()
    for r in results:
        for v in r.values.values():
            for form in (v, round(v), round(v, 1), math.floor(v), math.ceil(v)):
                ok.add(f"{float(form):g}")
    ok.update({str(n) for n in range(0, 25)})        
    ok.update({"2026", "112", "100", "101", "108"})   
    return ok

def ungrounded_numbers(text: str, results: list[ToolResult]) -> list[str]:
    ok = allowed_numbers(results)
    bad = []
    for m in NUMBER_RE.findall(text):
        if f"{float(m):g}" not in ok and m not in bad:
            bad.append(m)
    return bad

def age_label(seconds: float) -> str:
    minutes = int(seconds // 60)
    if minutes < 1:
        return "just now"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    return f"{hours} hr ago" if hours < 24 else f"{hours // 24} d ago"

SYSTEM_PROMPT = """You are WeatherGPT for ResQ-Ops, an Indian disaster response system.

Rules, in order:
1. Use ONLY the numbers in TOOL DATA. Never estimate, average or invent a number.
   If the data does not contain what was asked, say exactly what is missing.
2. Answer in 2-4 short sentences, plain language, no jargon.
3. State the time window for any forecast ("between 4 and 6 PM"), not just a value.
4. If data is marked STALE, say so in the answer.
5. If there is a life-safety risk, put the action first: what the person should do now.
6. Never tell anyone a route or activity is safe when TOOL DATA does not cover it.
7. Reply in the language of the question."""

def build_user_prompt(query: str, place: Optional[Place], results: list[ToolResult],
                      now: datetime) -> str:
    lines = [f"QUESTION: {query}",
             f"PLACE: {place.label if place else 'not specified'}",
             f"TIME NOW: {now.strftime('%d %b %Y, %I:%M %p IST')}", "", "TOOL DATA:"]
    for r in results:
        if not r.ok:
            lines.append(f"- {r.tool} ({r.source}): UNAVAILABLE ({r.error})")
            continue
        stale = " STALE" if r.age_s(now) > NOWCAST_MAX_AGE_S else ""
        payload = {**r.values, **r.text}
        lines.append(f"- {r.tool} ({r.source}, {age_label(r.age_s(now))}{stale}): "
                     f"{json.dumps(payload, ensure_ascii=False)}")
    if not results:
        lines.append("- none")
    return "\n".join(lines)

class WeatherGPTEngine:
    def __init__(self, deps: EngineDeps, breaker: Optional[CircuitBreaker] = None):
        self.deps = deps
        self.breaker = breaker or CircuitBreaker()

    def _resolve_place(self, query: str) -> tuple[Optional[Place], list[str]]:
        matches = self.deps.geocode(query)
        if len(matches) == 1:
            return matches[0], []
        if len(matches) > 1:
            return None, [p.label for p in matches[:4]]   
        return None, []

    def _run_tools(self, intent: str, place: Place, now: datetime) -> list[ToolResult]:
        results = []
        for name in INTENT_TOOLS.get(intent, []):
            fn = self.deps.tools.get(name)
            if fn is None:
                continue
            try:
                results.append(fn(place, {"now": now}))
            except Exception as exc:
                results.append(ToolResult(name, "unknown", now, ok=False,
                                          error=f"{type(exc).__name__}"))
        return results

    @staticmethod
    def _confidence(results: list[ToolResult], now: datetime) -> tuple[str, list[str]]:
        live = [r for r in results if r.ok]
        if not live:
            return "low", []
        warnings = []
        oldest = max(r.age_s(now) for r in live)
        if oldest > FORECAST_MAX_AGE_S:
            warnings.append(f"Latest reading is {age_label(oldest)}. Conditions may have changed.")
        if any(not r.ok for r in results):
            warnings.append("Some data sources did not respond, so this answer is partial.")
        official = any(r.source.upper() in {"IMD", "INCOIS", "NDMA", "CWC"} for r in live)
        if warnings or not official:
            return "medium", warnings
        return "high", warnings

    def ask(self, query: str, place_override: Optional[Place] = None) -> Answer:
        now = self.deps.now()
        nq = normalize(query)
        if not nq:
            return Answer("Ask me about weather, alerts, travel routes or farm advisories.",
                          "general", None, [], "high")

        intent = classify(nq)
        place, options = (place_override, []) if place_override else self._resolve_place(query)

        if options:
            return Answer(f"There's more than one place called that. Which one do you mean?",
                          intent, None, [], "high", needs_clarification=True, options=options)

        if place is None and intent != "general":
            return Answer("Which place should I check? Tell me the town or district.",
                          intent, None, [], "high", needs_clarification=True)

        vec = self.deps.embedder.embed(nq)
        hit = cache_lookup(self.deps, place, intent, nq, vec, now)
        if hit:
            return Answer(hit["text"], intent, place, hit.get("sources", []),
                          hit.get("confidence", "medium"), cached=True,
                          warnings=hit.get("warnings", []))

        results = self._run_tools(intent, place, now) if place else []
        if place and results and not any(r.ok for r in results):
            return Answer(
                f"I can't reach the weather services for {place.label} right now, so I won't guess. "
                "Try again in a few minutes, or check mausam.imd.gov.in.",
                intent, place, [], "low", degraded=True)

        if not self.breaker.allows():
            return self._deterministic(intent, place, results, now)

        try:
            text = self.deps.llm.complete(SYSTEM_PROMPT,
                                          build_user_prompt(query, place, results, now)).strip()
            if not text:
                raise ValueError("empty completion")
            self.breaker.record_success()
        except Exception:
            self.breaker.record_failure()
            return self._deterministic(intent, place, results, now)

        bad = ungrounded_numbers(text, results)
        if bad:
            retry = build_user_prompt(query, place, results, now) + (
                f"\n\nYour previous answer used numbers not present in TOOL DATA: "
                f"{', '.join(bad)}. Rewrite using only the numbers above.")
            try:
                text2 = self.deps.llm.complete(SYSTEM_PROMPT, retry).strip()
                if text2 and not ungrounded_numbers(text2, results):
                    text = text2
                else:
                    return self._deterministic(intent, place, results, now)
            except Exception:
                self.breaker.record_failure()
                return self._deterministic(intent, place, results, now)

        confidence, warnings = self._confidence(results, now)
        sources = [{"source": r.source, "observed_at": r.observed_at.isoformat(),
                    "age_label": age_label(r.age_s(now))} for r in results if r.ok]
        answer = Answer(text, intent, place, sources, confidence, warnings=warnings)

        self.deps.cache_set(
            cache_key(place, intent, nq, now),
            {"text": text, "vec": vec, "sources": sources, "confidence": confidence,
             "warnings": warnings, "stored_at": now.timestamp()},
            CACHE_TTL_S.get(intent, 600))
        return answer

    def _deterministic(self, intent: str, place: Optional[Place],
                       results: list[ToolResult], now: datetime) -> Answer:
        live = [r for r in results if r.ok]
        if not live:
            return Answer("The AI service is unavailable and I have no live readings, "
                          "so I can't answer this yet. For emergencies call 112.",
                          intent, place, [], "low", degraded=True)
        parts = []
        for r in live:
            for k, v in r.values.items():
                parts.append(f"{k.replace('_', ' ')}: {v:g}")
        where = f" for {place.label}" if place else ""
        sources = [{"source": r.source, "observed_at": r.observed_at.isoformat(),
                    "age_label": age_label(r.age_s(now))} for r in live]
        return Answer(f"Latest readings{where} — " + "; ".join(parts) +
                      ". (Plain data mode: the AI service is down.)",
                      intent, place, sources, "medium", degraded=True)
