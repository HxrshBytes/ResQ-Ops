import math
import re
from typing import List, Dict, Any

# ─── Official Agricultural & Marine Vector Knowledge Base (RAG Database) ───

KNOWLEDGE_DOCUMENTS = [
    {
        "id": "cibrc_icar_cotton_whitefly_001",
        "title": "ICAR SOP & CIBRC Guideline: Cotton Whitefly Management",
        "crop": "cotton",
        "target_pest": "whitefly",
        "content": """
ICAR & CIBRC Approved Package of Practices for Cotton Whitefly (Bemisia tabaci):
- Chemical: Imidacloprid 17.8% SL
- Dosage: 60 - 75 mL mixed in 500 Liters of water per hectare.
- Target Pests: Whitefly, Jassids, Thrips, Aphids on Cotton.
- Maximum Residue Limit (MRL): 0.05 mg/kg.
- Pre-Harvest Interval (PHI): 40 days safety wait period before harvesting.
- Weather Constraints: Do not spray if precipitation probability is > 50% within next 6-12 hours or wind speed > 15 km/h.
- Phytotoxicity Warning: Avoid application when temperature exceeds 35°C to prevent foliar scorching.
- Pollinator Safety: Do not spray during morning peak honeybee foraging hours (07:00 - 11:00 AM).
""",
        "metadata": {
            "chemical": "Imidacloprid 17.8% SL",
            "dosage": "60 - 75 mL in 500 Liters water / ha",
            "phi_days": 40,
            "crop": "Cotton",
            "pest": "Whitefly",
            "authority": "CIBRC / ICAR-CICR",
        }
    },
    {
        "id": "cibrc_icar_paddy_blast_002",
        "title": "ICAR SOP & CIBRC Guideline: Paddy Blast Disease Control",
        "crop": "paddy",
        "target_pest": "blast disease",
        "content": """
ICAR & CIBRC Approved Package of Practices for Paddy Blast (Pyricularia oryzae):
- Chemical: Tricyclazole 75% WP
- Dosage: 300 grams mixed in 500 Liters of water per hectare.
- Target Diseases: Neck blast, leaf blast, node blast in Rice / Paddy.
- Pre-Harvest Interval (PHI): 30 days safety wait period.
- Weather Constraints: Spraying must be suspended if rainfall (>50% prob) is expected within 12 hours or wind > 15 km/h.
- Irrigation Window: Maintain 2-3 cm shallow water layer after application.
""",
        "metadata": {
            "chemical": "Tricyclazole 75% WP",
            "dosage": "300 g in 500 Liters water / ha",
            "phi_days": 30,
            "crop": "Paddy / Rice",
            "pest": "Paddy Blast",
            "authority": "CIBRC / ICAR-NRRI",
        }
    },
    {
        "id": "cibrc_icar_soybean_rust_003",
        "title": "ICAR SOP & CIBRC Guideline: Soybean Rust & Caterpillar Management",
        "crop": "soybean",
        "target_pest": "rust & caterpillar",
        "content": """
ICAR & CIBRC Approved Package of Practices for Soybean Rust & Spodoptera caterpillar:
- Chemical: Hexaconazole 5% EC / Chlorantraniliprole 18.5% SC
- Dosage: 1000 mL (Hexaconazole) or 150 mL (Chlorantraniliprole) in 500 Liters water per hectare.
- Pre-Harvest Interval (PHI): 30 days for Hexaconazole, 20 days for Chlorantraniliprole.
- Weather Guardrails: Never apply when wind speed > 15 km/h to prevent drift to adjacent pulse fields.
""",
        "metadata": {
            "chemical": "Hexaconazole 5% EC",
            "dosage": "1000 mL in 500 Liters water / ha",
            "phi_days": 30,
            "crop": "Soybean",
            "pest": "Soybean Rust",
            "authority": "CIBRC / ICAR-IISR",
        }
    },
    {
        "id": "incois_marine_safety_001",
        "title": "INCOIS Ocean State Forecast & High Wave Safety SOP",
        "crop": "marine",
        "target_pest": "rough sea",
        "content": """
INCOIS Marine Safety Matrix & Operational Advisory:
- Significant Wave Height (SWH) < 1.5m: Normal (Green). Favorable for traditional, motorized, and mechanized vessels.
- SWH 1.5m - 2.5m: Moderate Risk (Yellow). Small unmotorized craft must stay within harbor limits; caution advised.
- SWH > 2.5m: Severe Danger (Red). Immediate return to shore. Small craft launch strictly prohibited.
- Surface Wind > 28 knots (> 50 km/h, Gale force): Red Alert. Immediate harbor retreat.
- Tidal Swell Storm Surge > 1.0m above astronomical tide: Red Alert. Emergency coastal evacuation protocol.
""",
        "metadata": {
            "authority": "INCOIS / IMD Coastal Services",
            "domain": "Ocean State Forecast",
        }
    }
]

def _tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def _tf_vector(tokens: List[str], vocab: List[str]) -> List[float]:
    counts = {t: 0 for t in vocab}
    for t in tokens:
        if t in counts:
            counts[t] += 1
    length = math.sqrt(sum(v * v for v in counts.values())) or 1.0
    return [counts[w] / length for w in vocab]

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    return sum(a * b for a, b in zip(v1, v2))

class RAGVectorStore:
    def __init__(self):
        self.docs = KNOWLEDGE_DOCUMENTS
        self.vocab = sorted(list(set(w for doc in self.docs for w in _tokenize(doc["content"] + " " + doc["title"]))))
        self.doc_vectors = []
        for doc in self.docs:
            tokens = _tokenize(doc["content"] + " " + doc["title"])
            self.doc_vectors.append(_tf_vector(tokens, self.vocab))

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_tokens = _tokenize(query)
        q_vec = _tf_vector(query_tokens, self.vocab)
        
        scores = []
        for idx, d_vec in enumerate(self.doc_vectors):
            sim = cosine_similarity(q_vec, d_vec)
            # Boost score if crop or pest exact match
            doc = self.docs[idx]
            q_lower = query.lower()
            if doc.get("crop") and doc["crop"] in q_lower:
                sim += 0.35
            if doc.get("target_pest") and any(p in q_lower for p in doc["target_pest"].split()):
                sim += 0.30
            scores.append((sim, doc))
        
        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, doc in scores[:top_k]:
            results.append({
                "document": doc,
                "score": round(score, 3)
            })
        return results

vector_store = RAGVectorStore()
