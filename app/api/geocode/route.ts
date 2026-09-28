import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "Mumbai, India";

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ResQ-Ops/1.1 emergency-ops" },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (!data.length) throw new Error("Not found");
    const r = data[0];
    return NextResponse.json({
      name: r.display_name.split(",").slice(0, 2).join(","),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display_name: r.display_name,
    });
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 404 });
  }
}
