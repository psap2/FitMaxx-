import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const data = await getUser(email, accessToken || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in getUser API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user" },
      { status: 500 }
    );
  }
}

