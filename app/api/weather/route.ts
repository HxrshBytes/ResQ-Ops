import { NextResponse } from "next/server";

// Open-Meteo — free, no API key needed
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "19.076";
  const lon = searchParams.get("lon") ?? "72.877";
  const loc = searchParams.get("loc") ?? "Mumbai";

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,` +
      `wind_direction_10m,weather_code,cloud_cover,visibility` +
      `&hourly=precipitation_probability,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=Asia/Kolkata&forecast_days=7`;

    const res = await fetch(url, { next: { revalidate: 900 } }); // 15-min cache (simulates Redis TTL)
    if (!res.ok) throw new Error("Open-Meteo fetch failed");
    const data = await res.json();

    return NextResponse.json({ location: loc, lat, lon, ...data });
  } catch {
    // Fallback seed data when API is unavailable
    return NextResponse.json({
      location: loc, lat, lon,
      current: {
        temperature_2m: 28.4,
        relative_humidity_2m: 88,
        precipitation: 12.4,
        rain: 12.4,
        wind_speed_10m: 18.2,
        wind_direction_10m: 225,
        weather_code: 95,
        cloud_cover: 97,
        visibility: 3200,
      },
      _fallback: true,
    });
  }
}
