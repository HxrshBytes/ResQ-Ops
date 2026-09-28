import { NextResponse } from 'next/server';

/**
 * 3. Evacuation Trip Anomaly Detection
 * Utilizes Kalman filtering (mocked here for demonstration) to enhance GPS accuracy
 * and track deviations from safe routes during active evacuations.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, currentLat, currentLon, assignedRoutePoints, speedKmH } = body;

    // A real implementation would use PostGIS ST_Distance to compute distance 
    // from the (currentLat, currentLon) to the assignedRoutePoints (a Polyline).
    // Here we simulate the logic.
    
    // Simulate Kalman Filter output (smoothing the GPS coordinate)
    const smoothedLat = currentLat + (Math.random() - 0.5) * 0.0001;
    const smoothedLon = currentLon + (Math.random() - 0.5) * 0.0001;
    
    // Mock anomaly checks
    let isAnomaly = false;
    let anomalyReason = "";
    let alertRescue = false;
    
    // 1. Deviated significantly from route (e.g. > 100 meters) - simulated
    const deviationMeters = Math.random() * 150; 
    if (deviationMeters > 100) {
      isAnomaly = true;
      anomalyReason = `Deviated from assigned route by ${Math.round(deviationMeters)} meters.`;
      alertRescue = true;
    }
    
    // 2. Unusual movement (e.g., speed = 0 for > 15 mins while in hazard zone)
    if (speedKmH === 0 && Math.random() > 0.8) {
      isAnomaly = true;
      anomalyReason = "Prolonged stop detected in active hazard zone.";
      alertRescue = true;
    }

    if (isAnomaly && alertRescue) {
      console.log(`[ANOMALY DETECTED] User ${userId} flagged. Reason: ${anomalyReason}`);
      // In production, this would trigger an alert to the NDRF dashboard.
    }

    return NextResponse.json({
      status: "success",
      tracker_id: userId,
      smoothed_location: { lat: smoothedLat, lon: smoothedLon },
      anomaly_detected: isAnomaly,
      anomaly_reason: anomalyReason,
      action_taken: alertRescue ? "Rescue team alerted" : "Monitoring"
    });
    
  } catch (error: any) {
    console.error("Anomaly Detection Error:", error);
    return NextResponse.json({ error: "Failed to process evacuation tracking." }, { status: 500 });
  }
}
