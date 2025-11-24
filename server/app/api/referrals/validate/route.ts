import { NextRequest, NextResponse } from "next/server";
import { validateReferralCode } from "@/lib/db/query";

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

    const result = await validateReferralCode(referralCode, accessToken || undefined);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in validateReferralCode API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate referral code" },
      { status: 500 }
    );
  }
}

