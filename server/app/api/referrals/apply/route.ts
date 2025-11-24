import { NextRequest, NextResponse } from "next/server";
import { applyReferralAfterSignup } from "@/lib/db/query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, referredUserId, accessToken } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: "ReferralCode is required" },
        { status: 400 }
      );
    }

    if (!referredUserId) {
      return NextResponse.json(
        { error: "ReferredUserId is required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await applyReferralAfterSignup(referralCode, referredUserId, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in applyReferralAfterSignup API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply referral" },
      { status: 500 }
    );
  }
}

