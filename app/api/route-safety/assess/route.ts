import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { origin, destination, vehicle, departure } = await req.json();

    // Mock response fulfilling: "Get 2 to 3 alternatives... Split them into segments... Return the top 4 reasons per route, per-segment risk (to colour the map line) and a disclaimer: 'Advice only. Official closures and police instructions come first.'"
    const alternatives = [
      {
        id: "route-1",
        timeMins: 45,
        distanceKm: 22.4,
        overallRisk: "HIGH",
        reasons: ["Flooded underpass at 12km", "Wind gusts up to 60km/h", "Visibility < 50m", "Heavy traffic congestion"],
        segments: [
          { risk: "LOW", km: 5 },
          { risk: "HIGH", km: 5 },
          { risk: "CRITICAL", km: 5 },
          { risk: "MODERATE", km: 7.4 }
        ]
      },
      {
        id: "route-2",
        timeMins: 65,
        distanceKm: 34.2,
        overallRisk: "MODERATE",
        reasons: ["Elevated ridge path", "Avoids major flood zones", "Mild crosswinds", "Slight detour required"],
        segments: [
          { risk: "LOW", km: 10 },
          { risk: "MODERATE", km: 5 },
          { risk: "LOW", km: 19.2 }
        ]
      },
      {
        id: "route-3",
        timeMins: 55,
        distanceKm: 28.5,
        overallRisk: "LOW",
        reasons: ["Clear highway", "No waterlogging detected", "Safe for all vehicles", "Optimal travel window"],
        segments: [
          { risk: "LOW", km: 10 },
          { risk: "LOW", km: 10 },
          { risk: "LOW", km: 8.5 }
        ]
      }
    ];

    return NextResponse.json({
      verdict: "Route 3 is the safest option. Avoid Route 1 due to flooding.",
      disclaimer: "Advice only. Official closures and police instructions come first.",
      alternatives,
      bestDeparture: new Date(Date.now() + 3600000).toISOString(),
      nearbyAmenities: {
        shelters: ["St. Mary's School (2km)"],
        hospitals: ["City Hospital (5km)"],
        fuel: ["Bharat Petroleum (1km)"]
      }
    });

  } catch (e) {
    return NextResponse.json({ error: "Failed to assess route safety" }, { status: 500 });
  }
}
