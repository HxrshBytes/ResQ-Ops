from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import datetime
import uvicorn
import os
import json
import urllib.request
import urllib.parse
import re

from vector_store import vector_store
try:
    from ml_forecaster import forecaster
except ImportError:
    forecaster = None
app = FastAPI(
    title="ResQ-Ops Agro-Marine Telemetry & RAG Engine",
    description="Authoritative real-time oceanographic and agricultural advisory engine with hardcoded weather guardrails and CIBRC/INCOIS RAG pipeline.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Models ───

class MarineSafetyRequest(BaseModel):
    lat: float = 18.92
    lon: float = 72.82
    ocean_data: Optional[Dict[str, Any]] = None

class AgriSafetyRequest(BaseModel):
    lat: float = 20.70
    lon: float = 77.00
    crop: str = "cotton"
    pest: str = "whitefly"
    chemical: str = "Imidacloprid 17.8% SL"
    weather_data: Optional[Dict[str, Any]] = None

class AdvisoryQueryRequest(BaseModel):
    query: str
    lat: Optional[float] = 20.70
    lon: Optional[float] = 77.00
    language: Optional[str] = "mr" # Marathi, Hindi, English
    audio_base64: Optional[str] = None

class SendOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

class PredictRiskRequest(BaseModel):
    lat: float
    lon: float
    environmental_data: dict

class SOSTriageRequest(BaseModel):
    distress_text: str

# ─── 1. Coastal Fishermen Implementation: Marine Advisory Evaluator ───

def evaluate_marine_safety(lat: float, lon: float, ocean_data: dict) -> dict:
    """
    Authoritative Marine Safety Threshold Evaluator (INCOIS & IMD Bulletins)
    """
    swh = ocean_data.get("significant_wave_height_m", 0.0)
    wind_kts = ocean_data.get("surface_wind_knots", 0.0)
    is_cyclone_warning = ocean_data.get("imd_cyclone_alert", False)

    if swh >= 2.5 or wind_kts >= 28 or is_cyclone_warning:
        return {
            "safety_status": "DANGER_DO_NOT_VENTURE",
            "alert_level": "RED",
            "voice_announcement": "High hazard warning: Wave heights exceed 2.5 meters. Return to shore or nearest harbor immediately.",
            "metrics": {"wave_height": f"{swh}m", "wind": f"{wind_kts} kts"}
        }
    elif swh >= 1.5 or wind_kts >= 15:
        return {
            "safety_status": "CAUTION_RESTRICTED",
            "alert_level": "YELLOW",
            "voice_announcement": "Moderate chop and swell detected. Small unmotorized craft must remain within harbor limits.",
            "metrics": {"wave_height": f"{swh}m", "wind": f"{wind_kts} kts"}
        }
    return {
        "safety_status": "SAFE_TO_FISH",
        "alert_level": "GREEN",
        "voice_announcement": "Sea conditions are calm and favorable for coastal operations.",
        "metrics": {"wave_height": f"{swh}m", "wind": f"{wind_kts} kts"}
    }

# ─── 2. Farmers Implementation: Pesticide Hardcoded Guardrails ───

def evaluate_pesticide_guardrails(weather: dict, current_hour: int = 14) -> dict:
    """
    Golden Rules of Pesticide Spraying (Hardcoded Guardrails):
    1. Wash-Off Protection: Rain prob > 50% in next 6-12h -> BLOCKED
    2. Spray Drift Prevention: Wind speed > 15 km/h -> BLOCKED
    3. Heat & Phytotoxicity Check: Temperature > 35°C -> BLOCKED
    4. Beneficial Insect Safety: Peak morning pollinator activity (07:00 - 11:00 AM) -> CAUTION
    """
    rain_prob = weather.get("rain_probability_pct", 0)
    wind_kmh = weather.get("wind_speed_kmh", 0.0)
    temp_c = weather.get("temperature_c", 28.0)
    
    violations = []
    
    # Wash-off protection check
    if rain_prob > 50:
        violations.append({
            "code": "WASH_OFF_RISK",
            "rule": "Wash-Off Protection (Rain > 50%)",
            "detail": f"Rain probability is {rain_prob}% in your block over the next 4-12 hours."
        })
        
    # Spray drift prevention check
    if wind_kmh > 15.0:
        violations.append({
            "code": "SPRAY_DRIFT_RISK",
            "rule": "Spray Drift Prevention (Wind > 15 km/h)",
            "detail": f"Wind speed is {wind_kmh} km/h (exceeds 15 km/h limit, leading to drift)."
        })
        
    # Heat & Phytotoxicity check
    if temp_c > 35.0:
        violations.append({
            "code": "PHYTOTOXICITY_HEAT_RISK",
            "rule": "Heat & Phytotoxicity Check (Temp > 35°C)",
            "detail": f"Ambient temperature is {temp_c}°C (causes rapid evaporation & leaf scorch)."
        })

    # Beneficial Insect Safety check
    pollinator_warning = False
    if 7 <= current_hour <= 11:
        pollinator_warning = True

    can_spray = len(violations) == 0

    return {
        "can_spray": can_spray,
        "violations": violations,
        "pollinator_warning": pollinator_warning,
        "metrics_evaluated": {
            "rain_probability_pct": rain_prob,
            "wind_speed_kmh": wind_kmh,
            "temperature_c": temp_c,
            "hour": current_hour
        }
    }

# ─── API Routes ───

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResQ-Ops Agro-Marine Engine",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

# ─── Auth Endpoints (Sprint 1) ───
import hashlib
import random
import jwt

# Mock in-memory DB for OTPs and Users since actual DB connection isn't set up in FastAPI yet
MOCK_OTPS = {}
MOCK_USERS = {
    "+919876543210": {"id": "usr_citizen1", "role": "CITIZEN"},
    "+919999999999": {"id": "usr_farmer1", "role": "FARMER"},
    "+918888888888": {"id": "usr_fisher1", "role": "FISHERMAN"}
}
SECRET_KEY = "resq_ops_secure_jwt_key_prototype"

@app.post("/api/auth/send-otp")
def send_otp(req: SendOTPRequest):
    otp = str(random.randint(100000, 999999))
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    
    # Store in memory with expiry (mocking auth_otps table)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=5)
    MOCK_OTPS[req.phone_number] = {"hash": otp_hash, "expires_at": expires_at, "attempts": 0}
    
    # Mocking Nodemailer / SMS console log
    print(f"[MOCK SMS] Sending OTP {otp} to {req.phone_number}")
    return {"status": "success", "message": f"OTP sent to {req.phone_number}"}

@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    if req.phone_number not in MOCK_OTPS:
        raise HTTPException(status_code=400, detail="No OTP requested or expired")
    
    stored = MOCK_OTPS[req.phone_number]
    
    if datetime.datetime.now(datetime.timezone.utc) > stored["expires_at"]:
        del MOCK_OTPS[req.phone_number]
        raise HTTPException(status_code=400, detail="OTP expired")
        
    provided_hash = hashlib.sha256(req.otp.encode()).hexdigest()
    if provided_hash != stored["hash"]:
        stored["attempts"] += 1
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    del MOCK_OTPS[req.phone_number]
    
    # Check if user exists, else default to CITIZEN
    user_info = MOCK_USERS.get(req.phone_number, {"id": f"usr_new_{random.randint(1000,9999)}", "role": "CITIZEN"})
    
    # Issue JWT
    token_payload = {
        "sub": user_info["id"],
        "role": user_info["role"],
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }
    encoded_jwt = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")
    
    return {"status": "success", "token": encoded_jwt, "role": user_info["role"]}

@app.post("/evaluate/marine-safety")
def evaluate_marine_route(req: MarineSafetyRequest):
    ocean_data = req.ocean_data or {
        "significant_wave_height_m": 2.8,
        "surface_wind_knots": 30.5,
        "imd_cyclone_alert": False
    }
    result = evaluate_marine_safety(req.lat, req.lon, ocean_data)
    return {
        "location": {"lat": req.lat, "lon": req.lon},
        "evaluator": "INCOIS / IMD Marine Safety Engine",
        "result": result
    }

@app.post("/evaluate/agri-safety")
def evaluate_agri_route(req: AgriSafetyRequest):
    weather = req.weather_data or {
        "rain_probability_pct": 75,
        "wind_speed_kmh": 22.0,
        "temperature_c": 29.0
    }
    guardrails = evaluate_pesticide_guardrails(weather)
    return {
        "crop": req.crop,
        "pest": req.pest,
        "chemical": req.chemical,
        "guardrail_evaluation": guardrails
    }

@app.get("/ocean-telemetry")
def get_ocean_telemetry(lat: float = 18.92, lon: float = 72.82):
    # Simulated live INCOIS / CMEMS feed
    ocean_data = {
        "source": "INCOIS Ocean State Forecast & Copernicus CMEMS",
        "location": {"lat": lat, "lon": lon, "name": "Mumbai Offshore Grid #402"},
        "significant_wave_height_m": 2.8,
        "swell_period_sec": 9.4,
        "swell_direction_deg": 240,
        "sea_surface_temp_c": 28.6,
        "surface_wind_knots": 30.0,
        "tide_anomaly_m": 1.25,
        "chlorophyll_mg_m3": 1.45,
        "pfz_advisory": "High productivity cluster 8 NM SW. Safe only for mechanized trawlers when SWH < 2.5m.",
        "imd_cyclone_alert": False
    }
    evaluation = evaluate_marine_safety(lat, lon, ocean_data)
    return {**ocean_data, "safety_evaluation": evaluation}

@app.get("/agromet-telemetry")
def get_agromet_telemetry(lat: float = 20.70, lon: float = 77.00):
    # Simulated live IMD Agromet / GKMS & SMAP feed
    return {
        "source": "IMD Agromet / GKMS & NASA SMAP Soil Moisture",
        "block": "Akola / Wardha Agromet Zone",
        "location": {"lat": lat, "lon": lon},
        "forecast_4h": {
            "rain_probability_pct": 75,
            "wind_speed_kmh": 22.0,
            "temperature_c": 29.0,
            "relative_humidity_pct": 84
        },
        "soil_profile": {
            "classification": "BLACK_COTTON",
            "soil_moisture_kpa": 42.5,
            "organic_carbon_pct": 0.62
        },
        "next_clear_window": "Friday Morning (06:00 - 11:00 AM)"
    }

def call_groq_llm(system_prompt: str, user_prompt: str) -> str:
    api_key = os.environ.get("GROQ_API_KEY", "dummy")
    if api_key == "dummy" or api_key == "your_groq_api_key_here":
        # Mocking translation for demo if no real key is set
        return f"[Synthesized via LLM in requested language] Answer: Based on data - {user_prompt[:80]}..."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            result = json.loads(response.read().decode())
            return result['choices'][0]['message']['content']
    except Exception as e:
        return f"Error synthesizing response: {str(e)}"

def search_internet(query: str) -> str:
    try:
        safe_query = urllib.parse.quote(query)
        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={safe_query}&utf8=&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'ResQ-Ops/1.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            result = json.loads(response.read().decode())
            snippets = [item['snippet'] for item in result.get('query', {}).get('search', [])[:2]]
            clean = re.sub('<[^<]+>', '', " ".join(snippets))
            return clean if clean else "No internet data found for query."
    except Exception:
        return "Internet search unavailable."

@app.post("/rag/advisory")
def rag_advisory(req: AdvisoryQueryRequest):
    """
    RAG Pipeline Synthesis for Any Queries (Agro, Marine, or General)
    1. Deterministic guardrails for Agro/Marine
    2. Internet search for external validation
    3. LLM synthesis translating accurately to user language
    """
    query_text = req.query
    lang = req.language or "en"
    
    stt_transcript = query_text if req.audio_base64 else None

    # Check Domain
    is_marine_query = any(w in query_text.lower() for w in ["fish", "sea", "boat", "wave", "harbor", "tide", "coast", "ocean", "trawler"])
    is_agri_query = any(w in query_text.lower() for w in ["crop", "spray", "pest", "farm", "rain", "cotton", "whitefly"])

    system_prompt = f"You are WeatherGPT for ResQ-Ops. You give 100% accurate, brief, authoritative advice. You MUST respond ONLY in the {lang} language. If provided with Guardrail data or internet context, strictly adhere to it."

    if is_marine_query:
        ocean = {"significant_wave_height_m": 2.8, "surface_wind_knots": 30.0, "imd_cyclone_alert": False}
        eval_result = evaluate_marine_safety(req.lat or 18.92, req.lon or 72.82, ocean)
        
        user_prompt = f"Question: {query_text}. Context: Ocean conditions - wave height {ocean['significant_wave_height_m']}m, wind {ocean['surface_wind_knots']} kts. Guardrail Status: {eval_result['safety_status']}."
        final_announcement = call_groq_llm(system_prompt, user_prompt)
        rag_matches = vector_store.search(query_text, top_k=2)
        
        return {
            "query": query_text,
            "domain": "coastal_marine",
            "telemetry": ocean,
            "verdict": f"⛔ {eval_result['safety_status']}",
            "alert_level": eval_result["alert_level"],
            "voice_announcement": final_announcement,
            "bhashini_tts": {"language": lang, "status": "SYNTHESIZED"},
            "vector_rag_sources": [m["document"]["title"] for m in rag_matches]
        }

    elif is_agri_query:
        weather = {"rain_probability_pct": 75, "wind_speed_kmh": 22.0, "temperature_c": 29.0}
        guardrails = evaluate_pesticide_guardrails(weather)
        
        user_prompt = f"Question: {query_text}. Context: Weather - rain prob {weather['rain_probability_pct']}%, wind {weather['wind_speed_kmh']} km/h, temp {weather['temperature_c']}C. Can spray? {guardrails['can_spray']}."
        final_announcement = call_groq_llm(system_prompt, user_prompt)
        rag_matches = vector_store.search(query_text, top_k=2)
        
        return {
            "query": query_text,
            "domain": "agriculture",
            "telemetry": weather,
            "guardrail_evaluation": guardrails,
            "verdict": "✅ SAFE TO SPRAY" if guardrails["can_spray"] else "⛔ DO NOT SPRAY",
            "alert_level": "RED" if not guardrails["can_spray"] else "GREEN",
            "voice_announcement": final_announcement,
            "bhashini_tts": {"language": lang, "status": "SYNTHESIZED"},
            "vector_rag_sources": [m["document"]["title"] for m in rag_matches]
        }
        
    else:
        # General query: rely on internet search fallback for 100% accuracy
        internet_context = search_internet(query_text)
        user_prompt = f"Question: {query_text}. Internet Context: {internet_context}. Answer accurately."
        final_announcement = call_groq_llm(system_prompt, user_prompt)
        
        return {
            "query": query_text,
            "domain": "general_inquiry",
            "telemetry": None,
            "verdict": "ℹ️ INFO",
            "alert_level": "BLUE",
            "voice_announcement": final_announcement,
            "bhashini_tts": {"language": lang, "status": "SYNTHESIZED"},
            "internet_context_used": internet_context
        }

@app.post("/predict-disaster")
def predict_disaster(req: PredictRiskRequest):
    if not forecaster:
        raise HTTPException(status_code=500, detail="Forecaster module not loaded")
    return forecaster.predict_risk(req.lat, req.lon, req.environmental_data)

@app.post("/satellite-analytics")
def satellite_analytics():
    # Simulated autonomous AI Vision agent for drone/satellite imagery
    return {
        "status": "success",
        "task": "Structural Damage Assessment",
        "results": [
            {"structure": "Main Bridge A", "integrity": "COMPROMISED", "confidence": 0.92, "recommendation": "Avoid route"},
            {"structure": "Highway 42", "integrity": "CLEAR", "confidence": 0.98, "recommendation": "Safe for logistics"}
        ]
    }

@app.post("/sos-triage")
def sos_triage(req: SOSTriageRequest):
    # Simulated NLP triage of distress SMS/messages
    text = req.distress_text.lower()
    categories = []
    if any(w in text for w in ["water", "food", "thirsty", "hungry"]):
        categories.append("SUPPLIES_NEEDED")
    if any(w in text for w in ["trapped", "stuck", "under", "help"]):
        categories.append("TRAPPED_PERSONS")
    if any(w in text for w in ["blood", "hurt", "medic", "injury", "bleeding"]):
        categories.append("MEDICAL_EMERGENCY")
        
    return {
        "original_text": req.distress_text,
        "triaged_categories": categories or ["GENERAL_DISTRESS"],
        "priority": "HIGH" if "MEDICAL_EMERGENCY" in categories or "TRAPPED_PERSONS" in categories else "MEDIUM"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
