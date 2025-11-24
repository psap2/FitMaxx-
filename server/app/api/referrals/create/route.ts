import { NextRequest, NextResponse } from "next/server";
import { createReferral } from "@/lib/db/query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await createReferral(userId, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in createReferral API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create referral" },
      { status: 500 }
    );
  }
}

