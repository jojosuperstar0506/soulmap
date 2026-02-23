import { NextRequest, NextResponse } from "next/server";
import { calculateBaZi } from "@/lib/bazi-calculator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { birthDate, birthTime, gender } = body;
    if (!birthDate || !birthTime || !gender) {
      return NextResponse.json(
        { error: "Missing birthDate, birthTime, or gender" },
        { status: 400 }
      );
    }
    const chart = await calculateBaZi(birthDate, birthTime, gender);
    return NextResponse.json(chart);
  } catch (err) {
    console.error("BaZi calculation error:", err);
    return NextResponse.json(
      { error: "Failed to calculate chart" },
      { status: 500 }
    );
  }
}
