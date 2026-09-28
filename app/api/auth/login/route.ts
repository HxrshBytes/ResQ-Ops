import { NextRequest, NextResponse } from "next/server";
import { POST as mainAuthPOST } from "../route";

export async function POST(req: NextRequest) {
  return mainAuthPOST(req);
}
