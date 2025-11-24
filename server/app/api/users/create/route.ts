import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/db/query";
import { User } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, accessToken } = body;

    if (!user) {
      return NextResponse.json(
        { error: "User data is required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await createUser(user as User, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in createUser API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

