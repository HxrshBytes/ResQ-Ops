import { NextResponse } from "next/server";


// Example route using ST_DWithin to check for hazards along a path
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { start, end } = body; // expect { lat, lon } for both
    
    if (!start || !end) {
      return NextResponse.json({ error: "Missing start or end coordinates" }, { status: 400 });
    }

    // 1. We mock a routing API by generating a straight line (LineString) between start and end.
    // In a real app, this would be an OSRM or Mapbox directions API response.
    const routeGeoJSON = {
      type: "LineString",
      coordinates: [
        [start.lon, start.lat],
        [end.lon, end.lat]
      ]
    };

    // 2. We mock PostGIS ST_DWithin hazards detection
    // In demo mode, we'll randomly generate a hazard 30% of the time
    let isSafe = true;
    let penalties = 0;
    const hazards: any[] = [];
    
    if (Math.random() > 0.7) {
      isSafe = false;
      penalties = 100;
      hazards.push({
        id: `HAZ-${Date.now()}`,
        incident_type: 'FLOOD',
        description: 'Mocked urban flash flood along path.',
        status: 'ACTIVE',
        dist_meters: 150
      });
    }

    return NextResponse.json({
      status: "success",
      route: routeGeoJSON,
      isSafe,
      penalties,
      hazards,
      message: isSafe ? "Route is safe" : "Hazardous conditions detected on route. Re-routing recommended."
    });
  } catch (error: any) {
    console.error("Routing error:", error);
    return NextResponse.json({ error: "Failed to calculate hazard-aware route" }, { status: 500 });
  }
}
