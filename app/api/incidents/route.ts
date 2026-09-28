import { NextResponse } from "next/server";
import { pushSOSToStream, readSOSStream } from "@/lib/redis";

// ── In-memory incident store (simulates PostGIS primary database) ──
export type IncidentStatus =
  | "SUBMITTED"
  | "QUEUED_REDIS"
  | "AUTO_EVALUATED"
  | "COMMANDER_APPROVED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "RESOLVED"
  | "REJECTED";

export interface Incident {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  lat: number;
  lon: number;
  location: string;
  description: string;
  reportedBy: string;
  status: IncidentStatus;
  confidence: number;
  opi: number;
  weatherScore: number;
  spatialScore: number;
  evidenceScore: number;
  affectedCount: number;
  streamId?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Array<{ ts: string; action: string; user: string }>;
}

const SEED_INCIDENTS: Incident[] = [
  {
    "id": "INC-001",
    "type": "Landslide",
    "severity": "HIGH",
    "lat": 12.1079244937805,
    "lon": 84.04538379518375,
    "location": "Zone 1",
    "description": "Generated incident 1",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.5198460087174009,
    "opi": 87,
    "weatherScore": 0.7792531464710528,
    "spatialScore": 0.40816120053680427,
    "evidenceScore": 0.017538865790527547,
    "affectedCount": 76,
    "createdAt": "2026-09-20T09:35:31.915Z",
    "updatedAt": "2026-09-20T09:35:31.915Z",
    "auditLog": []
  },
  {
    "id": "INC-002",
    "type": "Cloudburst",
    "severity": "MODERATE",
    "lat": 22.222765796789503,
    "lon": 84.43420925654493,
    "location": "Zone 2",
    "description": "Generated incident 2",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.655160392099036,
    "opi": 99,
    "weatherScore": 0.9022938415906547,
    "spatialScore": 0.13026633516998176,
    "evidenceScore": 0.5545429337425785,
    "affectedCount": 13,
    "createdAt": "2026-09-20T09:35:31.915Z",
    "updatedAt": "2026-09-20T09:35:31.915Z",
    "auditLog": []
  },
  {
    "id": "INC-003",
    "type": "Cyclone Evacuation",
    "severity": "LOW",
    "lat": 18.504705865440023,
    "lon": 76.17815170666083,
    "location": "Zone 3",
    "description": "Generated incident 3",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.7933975119205425,
    "opi": 69,
    "weatherScore": 0.7934243602348088,
    "spatialScore": 0.8776937243817897,
    "evidenceScore": 0.9832460657258126,
    "affectedCount": 35,
    "createdAt": "2026-09-20T09:35:31.915Z",
    "updatedAt": "2026-09-20T09:35:31.915Z",
    "auditLog": []
  },
  {
    "id": "INC-004",
    "type": "Heatwave",
    "severity": "CRITICAL",
    "lat": 23.407943136423285,
    "lon": 70.49070962701387,
    "location": "Zone 4",
    "description": "Generated incident 4",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.7507962838025558,
    "opi": 88,
    "weatherScore": 0.3839548828317103,
    "spatialScore": 0.10496456677664379,
    "evidenceScore": 0.7638481534661,
    "affectedCount": 64,
    "createdAt": "2026-09-20T09:35:31.915Z",
    "updatedAt": "2026-09-20T09:35:31.915Z",
    "auditLog": []
  },
  {
    "id": "INC-005",
    "type": "Urban Flood",
    "severity": "HIGH",
    "lat": 10.44448204955858,
    "lon": 75.95604856599188,
    "location": "Zone 5",
    "description": "Generated incident 5",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.6515235415789962,
    "opi": 23,
    "weatherScore": 0.772508109441301,
    "spatialScore": 0.6607240812335774,
    "evidenceScore": 0.7495742826759951,
    "affectedCount": 24,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-006",
    "type": "Landslide",
    "severity": "MODERATE",
    "lat": 19.710117242203605,
    "lon": 71.20659093157992,
    "location": "Zone 6",
    "description": "Generated incident 6",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.9347338340546582,
    "opi": 32,
    "weatherScore": 0.11026150808572788,
    "spatialScore": 0.5401086533960331,
    "evidenceScore": 0.21764572047957353,
    "affectedCount": 41,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-007",
    "type": "Cloudburst",
    "severity": "LOW",
    "lat": 20.394007534023878,
    "lon": 82.90717470683228,
    "location": "Zone 7",
    "description": "Generated incident 7",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.6366563534499748,
    "opi": 23,
    "weatherScore": 0.7901085258568578,
    "spatialScore": 0.21980927086899837,
    "evidenceScore": 0.07220755540343904,
    "affectedCount": 27,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-008",
    "type": "Cyclone Evacuation",
    "severity": "CRITICAL",
    "lat": 18.143406273317602,
    "lon": 80.71774687519331,
    "location": "Zone 8",
    "description": "Generated incident 8",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.7135752628748684,
    "opi": 32,
    "weatherScore": 0.3699734664901122,
    "spatialScore": 0.38934069105253166,
    "evidenceScore": 0.5219721461229054,
    "affectedCount": 3,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-009",
    "type": "Heatwave",
    "severity": "HIGH",
    "lat": 10.19985954878199,
    "lon": 72.10940214408619,
    "location": "Zone 9",
    "description": "Generated incident 9",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.6318867441583158,
    "opi": 32,
    "weatherScore": 0.39419143919265853,
    "spatialScore": 0.316989231610062,
    "evidenceScore": 0.08013011575710449,
    "affectedCount": 39,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-010",
    "type": "Urban Flood",
    "severity": "MODERATE",
    "lat": 14.809723141791132,
    "lon": 71.99523105289933,
    "location": "Zone 10",
    "description": "Generated incident 10",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.5409698721209275,
    "opi": 81,
    "weatherScore": 0.17386077792285748,
    "spatialScore": 0.03638517307396183,
    "evidenceScore": 0.2875981835871928,
    "affectedCount": 58,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-011",
    "type": "Landslide",
    "severity": "LOW",
    "lat": 20.746074463644447,
    "lon": 74.88451082921036,
    "location": "Zone 11",
    "description": "Generated incident 11",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.9191876171727257,
    "opi": 50,
    "weatherScore": 0.8176981835453246,
    "spatialScore": 0.41400900170638333,
    "evidenceScore": 0.16900570128106607,
    "affectedCount": 62,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-012",
    "type": "Cloudburst",
    "severity": "CRITICAL",
    "lat": 11.772846577566225,
    "lon": 75.10098547330492,
    "location": "Zone 12",
    "description": "Generated incident 12",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.7983124148917394,
    "opi": 28,
    "weatherScore": 0.6061063160056716,
    "spatialScore": 0.21937774588718273,
    "evidenceScore": 0.8225122026934896,
    "affectedCount": 2,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-013",
    "type": "Cyclone Evacuation",
    "severity": "HIGH",
    "lat": 23.667686423048053,
    "lon": 73.63302318047873,
    "location": "Zone 13",
    "description": "Generated incident 13",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.9705206844188233,
    "opi": 61,
    "weatherScore": 0.6587308373631213,
    "spatialScore": 0.5320321011546757,
    "evidenceScore": 0.6221686302882709,
    "affectedCount": 31,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-014",
    "type": "Heatwave",
    "severity": "MODERATE",
    "lat": 13.501562988390239,
    "lon": 82.14785452057428,
    "location": "Zone 14",
    "description": "Generated incident 14",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.636741441342358,
    "opi": 86,
    "weatherScore": 0.06759006283694946,
    "spatialScore": 0.5073608520126489,
    "evidenceScore": 0.23520644595878526,
    "affectedCount": 75,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-015",
    "type": "Urban Flood",
    "severity": "LOW",
    "lat": 11.704044089110212,
    "lon": 72.06959124271563,
    "location": "Zone 15",
    "description": "Generated incident 15",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.7016490906186449,
    "opi": 94,
    "weatherScore": 0.49434255481697453,
    "spatialScore": 0.4062220939564055,
    "evidenceScore": 0.026490822308962048,
    "affectedCount": 79,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-016",
    "type": "Landslide",
    "severity": "CRITICAL",
    "lat": 23.740391998288636,
    "lon": 71.44859174468506,
    "location": "Zone 16",
    "description": "Generated incident 16",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.7130313886248277,
    "opi": 2,
    "weatherScore": 0.7587844926968375,
    "spatialScore": 0.36806840881714487,
    "evidenceScore": 0.6131812338702818,
    "affectedCount": 89,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-017",
    "type": "Cloudburst",
    "severity": "HIGH",
    "lat": 20.790932347913575,
    "lon": 81.81269095885501,
    "location": "Zone 17",
    "description": "Generated incident 17",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.5602839252511083,
    "opi": 41,
    "weatherScore": 0.23601559209570588,
    "spatialScore": 0.16893309229725273,
    "evidenceScore": 0.01043714115939931,
    "affectedCount": 93,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-018",
    "type": "Cyclone Evacuation",
    "severity": "MODERATE",
    "lat": 16.153170799678936,
    "lon": 81.37275267681194,
    "location": "Zone 18",
    "description": "Generated incident 18",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.7865942254792426,
    "opi": 65,
    "weatherScore": 0.6661254911868051,
    "spatialScore": 0.38624482580488406,
    "evidenceScore": 0.013498162420051751,
    "affectedCount": 40,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.917Z",
    "auditLog": []
  },
  {
    "id": "INC-019",
    "type": "Heatwave",
    "severity": "LOW",
    "lat": 13.067828975845014,
    "lon": 78.77495546879436,
    "location": "Zone 19",
    "description": "Generated incident 19",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.8996000543719487,
    "opi": 36,
    "weatherScore": 0.6091924961349723,
    "spatialScore": 0.052009438235601224,
    "evidenceScore": 0.09800631538892757,
    "affectedCount": 48,
    "createdAt": "2026-09-20T09:35:31.917Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-020",
    "type": "Urban Flood",
    "severity": "CRITICAL",
    "lat": 23.583935836632996,
    "lon": 81.53310777900079,
    "location": "Zone 20",
    "description": "Generated incident 20",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.8475656255522892,
    "opi": 12,
    "weatherScore": 0.8497847659819189,
    "spatialScore": 0.8517563504803722,
    "evidenceScore": 0.20657029347422406,
    "affectedCount": 31,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-021",
    "type": "Landslide",
    "severity": "HIGH",
    "lat": 12.551813092723453,
    "lon": 70.44789920487763,
    "location": "Zone 21",
    "description": "Generated incident 21",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.7683895019032548,
    "opi": 40,
    "weatherScore": 0.9090662044895648,
    "spatialScore": 0.5824308495055415,
    "evidenceScore": 0.315505168121352,
    "affectedCount": 47,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-022",
    "type": "Cloudburst",
    "severity": "MODERATE",
    "lat": 17.80688706428662,
    "lon": 70.35911913213519,
    "location": "Zone 22",
    "description": "Generated incident 22",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.892187076578195,
    "opi": 95,
    "weatherScore": 0.5279123466920069,
    "spatialScore": 0.9526391658973826,
    "evidenceScore": 0.7851590801828885,
    "affectedCount": 16,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-023",
    "type": "Cyclone Evacuation",
    "severity": "LOW",
    "lat": 15.694538727469418,
    "lon": 74.80770156391041,
    "location": "Zone 23",
    "description": "Generated incident 23",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.9330436546779548,
    "opi": 73,
    "weatherScore": 0.3841114060884041,
    "spatialScore": 0.30653686093002563,
    "evidenceScore": 0.3230420940652142,
    "affectedCount": 71,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-024",
    "type": "Heatwave",
    "severity": "CRITICAL",
    "lat": 24.815135179202642,
    "lon": 72.17020648685303,
    "location": "Zone 24",
    "description": "Generated incident 24",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.9568134062451763,
    "opi": 79,
    "weatherScore": 0.8472919440078691,
    "spatialScore": 0.029904851956363276,
    "evidenceScore": 0.3204574050739053,
    "affectedCount": 86,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-025",
    "type": "Urban Flood",
    "severity": "HIGH",
    "lat": 21.43802698465019,
    "lon": 79.15902228516967,
    "location": "Zone 25",
    "description": "Generated incident 25",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.5700843028097073,
    "opi": 91,
    "weatherScore": 0.19754314122288053,
    "spatialScore": 0.5863654969487654,
    "evidenceScore": 0.7124195187049137,
    "affectedCount": 35,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-026",
    "type": "Landslide",
    "severity": "MODERATE",
    "lat": 10.435540526193122,
    "lon": 80.55620892498658,
    "location": "Zone 26",
    "description": "Generated incident 26",
    "reportedBy": "Citizen",
    "status": "AUTO_EVALUATED",
    "confidence": 0.9646681767612975,
    "opi": 39,
    "weatherScore": 0.10430032927150568,
    "spatialScore": 0.25489810074024954,
    "evidenceScore": 0.7217376098006657,
    "affectedCount": 71,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-027",
    "type": "Cloudburst",
    "severity": "LOW",
    "lat": 22.780863336430016,
    "lon": 77.94064924620024,
    "location": "Zone 27",
    "description": "Generated incident 27",
    "reportedBy": "Citizen",
    "status": "COMMANDER_APPROVED",
    "confidence": 0.7519007244520963,
    "opi": 39,
    "weatherScore": 0.25445266299266767,
    "spatialScore": 0.6571822819311741,
    "evidenceScore": 0.7321761038352173,
    "affectedCount": 28,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-028",
    "type": "Cyclone Evacuation",
    "severity": "CRITICAL",
    "lat": 22.706654370344673,
    "lon": 72.5665534622344,
    "location": "Zone 28",
    "description": "Generated incident 28",
    "reportedBy": "Citizen",
    "status": "ASSIGNED",
    "confidence": 0.8879609829053933,
    "opi": 89,
    "weatherScore": 0.9461792492740816,
    "spatialScore": 0.5695589215188841,
    "evidenceScore": 0.6867482421091247,
    "affectedCount": 42,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-029",
    "type": "Heatwave",
    "severity": "HIGH",
    "lat": 17.29484810555217,
    "lon": 71.43465644763417,
    "location": "Zone 29",
    "description": "Generated incident 29",
    "reportedBy": "Citizen",
    "status": "EN_ROUTE",
    "confidence": 0.5881391933972678,
    "opi": 56,
    "weatherScore": 0.5834477203959844,
    "spatialScore": 0.47394935948081884,
    "evidenceScore": 0.22404585281592726,
    "affectedCount": 66,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  },
  {
    "id": "INC-030",
    "type": "Urban Flood",
    "severity": "MODERATE",
    "lat": 23.402861589139867,
    "lon": 70.29602699075934,
    "location": "Zone 30",
    "description": "Generated incident 30",
    "reportedBy": "Citizen",
    "status": "SUBMITTED",
    "confidence": 0.8264480397527911,
    "opi": 53,
    "weatherScore": 0.9269789174357347,
    "spatialScore": 0.3156032808266328,
    "evidenceScore": 0.9153646639607983,
    "affectedCount": 44,
    "createdAt": "2026-09-20T09:35:31.918Z",
    "updatedAt": "2026-09-20T09:35:31.918Z",
    "auditLog": []
  }
];

// In-memory master storage
const incidents: Incident[] = [...SEED_INCIDENTS];

export async function GET() {
  return NextResponse.json(incidents.sort((a, b) => b.opi - a.opi));
}

/**
 * High-Throughput SOS Ingestion Endpoint
 * Decoupled Read/Write Pipeline handling high concurrent distress load
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  const body = await req.json();
  const id = `INC-${String(incidents.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();

  // 1. Offload raw SOS payload to Redis Streams for <15ms response latency
  const streamId = (await pushSOSToStream({
    incidentId: id,
    type: body.type ?? "Unknown",
    lat: body.lat ?? 20.5937,
    lon: body.lon ?? 78.9629,
    reportedBy: body.reportedBy ?? "Citizen App",
    timestamp: now,
    description: body.description ?? "",
  })) || `mem-stream-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const confidence = parseFloat((Math.random() * 0.4 + 0.55).toFixed(2));
  const opi = Math.min(99, Math.floor(confidence * 95 + Math.random() * 10));

  const newInc: Incident = {
    id,
    type: body.type ?? "Unknown",
    severity: opi >= 80 ? "CRITICAL" : opi >= 60 ? "HIGH" : opi >= 40 ? "MODERATE" : "LOW",
    lat: body.lat ?? 20.5937,
    lon: body.lon ?? 78.9629,
    location: body.location ?? "India",
    description: body.description ?? "",
    reportedBy: body.reportedBy ?? "Citizen App",
    status: "QUEUED_REDIS",
    confidence,
    opi,
    weatherScore: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
    spatialScore: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
    evidenceScore: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
    affectedCount: body.affectedCount ?? 1,
    streamId,
    createdAt: now,
    updatedAt: now,
    auditLog: [
      {
        ts: now,
        action: `QUEUED_REDIS (Stream ID: ${streamId}, Latency: ${Date.now() - startTime}ms)`,
        user: body.reportedBy ?? "citizen-app",
      },
    ],
  };

  incidents.push(newInc);

  // 2. Asynchronous Micro-Batch Worker Pool Simulation (DBSCAN + OPI Evaluation)
  setTimeout(() => {
    const idx = incidents.findIndex((i) => i.id === id);
    if (idx !== -1 && ["SUBMITTED", "QUEUED_REDIS"].includes(incidents[idx].status)) {
      const ts = new Date().toISOString();
      incidents[idx] = {
        ...incidents[idx],
        status: "AUTO_EVALUATED",
        updatedAt: ts,
        auditLog: [
          ...incidents[idx].auditLog,
          {
            ts,
            action: `AUTO_EVALUATED (PostGIS Spatial Indexing, OPI: ${opi}, Confidence: ${confidence})`,
            user: "ai-triage-worker-pool",
          },
        ],
      };
    }
  }, 2500);

  // Return HTTP 202 Accepted instantly for high concurrency resilience
  return NextResponse.json(
    {
      message: "Distress call accepted into Redis Stream queue",
      incident: newInc,
      queueMetrics: {
        streamId,
        ingestionLatencyMs: Date.now() - startTime,
        status: "202 Accepted",
        bufferType: "Redis Stream / In-Memory Cluster",
      },
    },
    { status: 202 }
  );
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const idx = incidents.findIndex((i) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date().toISOString();
  incidents[idx] = {
    ...incidents[idx],
    status: body.status,
    updatedAt: now,
    auditLog: [...incidents[idx].auditLog, { ts: now, action: body.status, user: body.user ?? "system" }],
  };
  return NextResponse.json(incidents[idx]);
}
