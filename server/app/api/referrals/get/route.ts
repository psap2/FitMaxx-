import { NextRequest, NextResponse } from "next/server";
import { getReferralByCode } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralCode = searchParams.get("referralCode");
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!referralCode) {
      return NextResponse.json(
        { error: "ReferralCode parameter is required" },
        { status: 400 }
      );
    }

    const data = await getReferralByCode(referralCode, accessToken || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in getReferralByCode API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get referral" },
      { status: 500 }
    );
  }
}

