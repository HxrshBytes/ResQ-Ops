import { NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════════════
//  /api/alerts — CAP-XML v1.2 compliant alert feed
//  Timestamps are computed dynamically relative to NOW so the
//  "Onset / Expires" labels always show meaningful relative times.
// ══════════════════════════════════════════════════════════════════════

const H = 3_600_000; // 1 hour in ms

function ts(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function buildAlerts() {
  const now = Date.now();
  return [
    {
      id: "CAP-2026-MH-001",
      severity: "CRITICAL",
      event: "Urban Flash Flood — Andheri Subway",
      area: "Andheri West, Mumbai, Maharashtra",
      lat: 19.1136,
      lon: 72.8697,
      radius_km: 8.5,
      onset: ts(-H * 0.5),      // 30 mins ago
      expires: ts(H * 5),        // 5 hours from now
      description:
        "Intense urban flash flooding reported across Andheri West and Jogeshwari Link Road. Subway station underpasses are fully submerged (depth est. 90cm). Multiple vehicle stalls reported on Western Express Highway near Goregaon. NDRF teams deployed. Rainfall intensity: 72mm/hour (IMD Doppler).",
      instructions:
        "Do NOT attempt to drive through flooded underpasses. Move to elevated ground. Evacuate ground floors in Saki Naka, Vile Parle, and Andheri East. Rescue helpline: 1916. NDMA SOS: 1078.",
      source: "IMD Mumbai + NDMA",
      confidence: 0.97,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-MH-001</identifier>
  <sender>IMD-Mumbai-Doppler</sender>
  <sent>${new Date(now - H * 0.5).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Urban Flash Flood</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <areaDesc>Andheri West, Mumbai, Maharashtra</areaDesc>
    <circle>19.1136,72.8697 8.5</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-KL-002",
      severity: "HIGH",
      event: "Landslide Warning — Wayanad Hills",
      area: "Wayanad District, Kerala",
      lat: 11.6854,
      lon: 76.1320,
      radius_km: 25.0,
      onset: ts(H * 1),          // 1 hour from now
      expires: ts(H * 18),       // 18 hours from now
      description:
        "High landslide probability (>78%) across Wayanad district following 240mm cumulative rainfall over 48 hours. Soil saturation index at critical threshold. Multiple minor slippages already reported near Kalpetta–Mananthavady road (SH-29). KSEB powerlines at risk.",
      instructions:
        "Evacuate all hillside settlements in Meppadi, Vythiri, and Ambalavayal to designated relief camps. Avoid NH-766 between Kozhikode and Mysuru. Contact SDMA Kerala helpline: 1070.",
      source: "KSNDMC + CWC Kerala",
      confidence: 0.88,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-KL-002</identifier>
  <sender>KSNDMC-Thiruvananthapuram</sender>
  <sent>${new Date(now).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <event>Landslide Warning</event>
    <urgency>Expected</urgency>
    <severity>Severe</severity>
    <certainty>Likely</certainty>
    <areaDesc>Wayanad District, Kerala</areaDesc>
    <circle>11.6854,76.1320 25.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-OD-003",
      severity: "CRITICAL",
      event: "Cyclone DANA — Landfall Warning",
      area: "Puri–Bhubaneswar Coastal Corridor, Odisha",
      lat: 19.8133,
      lon: 85.8315,
      radius_km: 120.0,
      onset: ts(H * 4),          // 4 hours from now
      expires: ts(H * 36),       // 36 hours from now
      description:
        "Very Severe Cyclonic Storm DANA (RSMC New Delhi Track No. 14). Maximum sustained wind speed: 185 km/h. Storm surge expected 2.5–3.5m above Astronomical High Tide along Puri–Kendrapara coast. IMD Red Alert issued for 8 districts. Massive evacuation underway (1.2 lakh people moved so far).",
      instructions:
        "MANDATORY evacuation for all coastal areas within 5km of shoreline in Puri, Kendrapara, Jagatsinghpur, Khordha. Shut down all fishing activities. Move to inland cyclone shelters. OSDMA Helpline: 1800-345-6789. Emergency: 112.",
      source: "IMD RSMC New Delhi + OSDMA",
      confidence: 0.95,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-OD-003</identifier>
  <sender>IMD-RSMC-NewDelhi</sender>
  <sent>${new Date(now + H).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Cyclone DANA Landfall Warning</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <areaDesc>Puri-Bhubaneswar Coastal Corridor, Odisha</areaDesc>
    <circle>19.8133,85.8315 120.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-RJ-004",
      severity: "HIGH",
      event: "Severe Heatwave — WBGT Extreme",
      area: "Barmer–Jaisalmer–Bikaner Region, Rajasthan",
      lat: 26.9124,
      lon: 70.9083,
      radius_km: 55.0,
      onset: ts(-H * 6),         // started 6 hours ago
      expires: ts(H * 48),       // 2 days from now
      description:
        "Maximum temperature touching 49.2°C at Barmer (new district record). WBGT index: 38.4°C (EXTREME HEAT STROKE risk for all outdoor work). Livestock mortality reported in 12 villages. Power grid under stress (14-hour load shedding). IMD Orange Alert issued.",
      instructions:
        "Avoid all outdoor exposure between 11:00–16:00 IST. Hydrate every 20 minutes. Farmers: Suspend all field operations. Cool livestock with wet burlap. NDMA Heatwave SOP active. ORS distribution at PHCs. Emergency: 108.",
      source: "IMD Jodhpur Observatory + NDMA",
      confidence: 0.93,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-RJ-004</identifier>
  <sender>IMD-Jodhpur</sender>
  <sent>${new Date(now - H * 6).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Severe Heatwave — WBGT Extreme</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <areaDesc>Barmer, Jaisalmer, Bikaner — Rajasthan</areaDesc>
    <circle>26.9124,70.9083 55.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-AS-005",
      severity: "CRITICAL",
      event: "Brahmaputra River Flood — Embankment Breach",
      area: "Kaziranga–Golaghat District, Assam",
      lat: 26.5775,
      lon: 93.3625,
      radius_km: 40.0,
      onset: ts(-H * 2),         // 2 hours ago
      expires: ts(H * 72),       // 3 days from now
      description:
        "Brahmaputra river embankment breach at 3 locations near Jakhalabandha (km 192, 196, 208). Flood waters entering Kaziranga National Park and 48 revenue villages. 62,000 people displaced. NDRF Battalion 5 deployed. NH-37 submerged at Numaligarh.",
      instructions:
        "All residents in low-lying char areas (Batadroba, Raha, Jakhalabandha) must evacuate immediately to Relief Camps. Rescue boats deployed at Biswanath Ghat. ASDMA Helpline: 1800-345-3500. Boat rescue registration: 94012-45678.",
      source: "CWC Brahmaputra + ASDMA",
      confidence: 0.99,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-AS-005</identifier>
  <sender>CWC-Brahmaputra-Guwahati</sender>
  <sent>${new Date(now - H * 2).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Hydro</category>
    <event>Brahmaputra River Flood — Embankment Breach</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <areaDesc>Kaziranga–Golaghat District, Assam</areaDesc>
    <circle>26.5775,93.3625 40.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-HP-006",
      severity: "MODERATE",
      event: "Cloudburst — Flash Flood Watch",
      area: "Shimla–Kullu–Kinnaur Region, Himachal Pradesh",
      lat: 31.1048,
      lon: 77.1734,
      radius_km: 30.0,
      onset: ts(H * 2),          // 2 hours from now
      expires: ts(H * 12),       // 12 hours from now
      description:
        "Deep convective cells detected over Shimla–Kullu valley by Doppler radar at Solan. Cloudburst probability: 68% between 17:00–23:00 IST. Past 24h rainfall: 118mm at Bhuntar (IMD AWS). Risk of debris flow on Jalori Pass route and NH-305 near Rampur.",
      instructions:
        "Avoid trekking and mountain travel after 15:00 IST. Tourist vehicles: Do not park near riverbeds or nallahs. Road users: Monitor HPRTC advisories. HPSDMA Alert: 1070.",
      source: "IMD Solan Doppler + HPSDMA",
      confidence: 0.72,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-HP-006</identifier>
  <sender>IMD-Solan</sender>
  <sent>${new Date(now).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Met</category>
    <event>Cloudburst Flash Flood Watch</event>
    <urgency>Expected</urgency>
    <severity>Moderate</severity>
    <certainty>Possible</certainty>
    <areaDesc>Shimla–Kullu–Kinnaur, Himachal Pradesh</areaDesc>
    <circle>31.1048,77.1734 30.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-TN-007",
      severity: "HIGH",
      event: "Coastal Storm Surge — Fishermen Warning",
      area: "Nagapattinam–Karaikal Coastal Zone, Tamil Nadu",
      lat: 10.7672,
      lon: 79.8450,
      radius_km: 35.0,
      onset: ts(H * 3),
      expires: ts(H * 24),
      description:
        "Deep depression in Bay of Bengal (Lat 9.5N, Long 83E) intensifying. Wave height: 4.2m (INCOIS Ocean State Forecast). Coastal inundation expected 1–1.5m above normal tide at Nagapattinam, Velankanni, and Karaikal Harbour. All fishing boats recalled.",
      instructions:
        "ALL fishing vessels must return to harbour immediately. No venturing into sea for next 48 hours. Coast Guard vessels on patrol. Fishermen helpline (TNFMD): 044-2852 4000. Emergency: 112.",
      source: "INCOIS + IMD Chennai",
      confidence: 0.87,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-TN-007</identifier>
  <sender>INCOIS-Hyderabad</sender>
  <sent>${new Date(now + H).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Marine</category>
    <event>Coastal Storm Surge — Fishermen Warning</event>
    <urgency>Expected</urgency>
    <severity>Severe</severity>
    <certainty>Likely</certainty>
    <areaDesc>Nagapattinam–Karaikal Coastal Zone, Tamil Nadu</areaDesc>
    <circle>10.7672,79.8450 35.0</circle>
  </info>
</alert>`,
    },
    {
      id: "CAP-2026-UK-008",
      severity: "MODERATE",
      event: "Glacial Lake Outburst Flood (GLOF) Watch",
      area: "Chamoli–Uttarkashi District, Uttarakhand",
      lat: 30.4127,
      lon: 79.3204,
      radius_km: 20.0,
      onset: ts(H * 6),
      expires: ts(H * 30),
      description:
        "WIHG (Wadia Institute) monitoring anomalous meltwater surge in Satopanth glacier basin. Infrared satellite imagery shows significant drainage channel blockage. GLOF risk classification: MODERATE–HIGH. Downstream villages: Mana, Ghastoli, Joshimath under watch.",
      instructions:
        "Evacuate campers and tourists from Satopanth Tal trek route. Close Valley of Flowers sector to visitors. Alert Joshimath and Chamoli administration. SDRF Uttarakhand: 0135-2712700.",
      source: "WIHG + ISRO NRSC + SDMA Uttarakhand",
      confidence: 0.65,
      capXml: `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CAP-2026-UK-008</identifier>
  <sender>WIHG-Dehradun</sender>
  <sent>${new Date(now + H * 2).toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <event>Glacial Lake Outburst Flood Watch</event>
    <urgency>Expected</urgency>
    <severity>Moderate</severity>
    <certainty>Possible</certainty>
    <areaDesc>Chamoli–Uttarkashi District, Uttarakhand</areaDesc>
    <circle>30.4127,79.3204 20.0</circle>
  </info>
</alert>`,
    },
  ];
}

export async function GET() {
  return NextResponse.json(buildAlerts());
}
