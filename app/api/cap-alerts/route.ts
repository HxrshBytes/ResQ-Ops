import { NextResponse } from "next/server";


/**
 * National Standard Compliance (CAP-XML & SACHET)
 * Adheres to ITU CAP-XML schema used by NDMA, CERT-In, and SACHET portal.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'All';
    
    // We mock critical incidents to turn into CAP-XML for demo purposes without Postgres
    const result = {
      rowCount: 2,
      rows: [
        {
          id: "CAP-001",
          incident_type: "Urban Flash Flood",
          description: "Intense urban flash flooding reported.",
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          lat: 19.1136,
          lon: 72.8697
        },
        {
          id: "CAP-002",
          incident_type: "Landslide Warning",
          description: "High landslide probability following heavy rainfall.",
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          lat: 11.6854,
          lon: 76.1320
        }
      ]
    };
    
    // Generate CAP-XML string
    let capXml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>RESQ-OPS-CAP-${Date.now()}</identifier>
  <sender>resq-ops@ndma.gov.in</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>`;

    result.rows.forEach((incident, index) => {
      const lat = incident.lat || 20.0;
      const lon = incident.lon || 77.0;
      
      capXml += `
  <info>
    <category>Safety</category>
    <event>${incident.incident_type}</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <description>${(incident.description || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>
    <area>
      <areaDesc>Affected Zone</areaDesc>
      <circle>${lat},${lon} 5.0</circle>
    </area>
  </info>`;
    });

    capXml += `
</alert>`;

    // If requested specifically for XML via query param or headers, return XML response
    if (searchParams.get('format') === 'xml') {
      return new NextResponse(capXml, {
        status: 200,
        headers: {
          'Content-Type': 'application/cap+xml; charset=utf-8'
        }
      });
    }

    // Default to JSON wrapper for web UI display, containing the CAP-XML blob
    return NextResponse.json({
      status: "success",
      source: "ITU Common Alerting Protocol (CAP-XML) v1.2",
      standard: "NDMA / SACHET Compliant",
      count: result.rowCount,
      data: capXml
    });
  } catch (error: any) {
    console.error("CAP-XML Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate CAP-XML" }, { status: 500 });
  }
}

/**
 * National SACHET Cell Broadcast Integration
 * Utilizes cellular towers to broadcast instant, one-way emergency alerts to geographic hazard zones.
 * Bypasses SMS congestion, requires no internet, maintains privacy.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { capXmlPayload, zoneCoordinates, hazardLevel } = body;
    
    // Simulate connection to NDMA SACHET Cell Broadcast API
    console.log(`[SACHET CELL BROADCAST] Transmitting to towers in zone: ${JSON.stringify(zoneCoordinates)}`);
    console.log(`[SACHET CELL BROADCAST] Hazard Level: ${hazardLevel}`);
    
    // Simulate propagation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      status: "success",
      message: "Alert transmitted to SACHET Cell Broadcast system.",
      transmission_details: {
        towers_activated: 24,
        estimated_devices_reached: 12500,
        privacy_mode: "ANONYMOUS_BROADCAST",
        network: "CELL_BROADCAST_CHANNEL_4370"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("SACHET Broadcast Error:", error);
    return NextResponse.json({ error: "Broadcast transmission failed" }, { status: 500 });
  }
}
