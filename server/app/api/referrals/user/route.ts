import { NextRequest, NextResponse } from "next/server";
import { getUserReferrals } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!userId) {
      return NextResponse.json(
        { error: "UserId parameter is required" },
        { status: 400 }
      );
    }

    const data = await getUserReferrals(userId, accessToken || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in getUserReferrals API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user referrals" },
      { status: 500 }
    );
  }
}

