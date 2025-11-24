import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/lib/db/query";
import { User } from "@/lib/db/schema";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates, accessToken } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    if (!updates) {
      return NextResponse.json(
        { error: "Updates are required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await updateUser(userId, updates as Partial<User>, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in updateUser API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

