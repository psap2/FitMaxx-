import { NextRequest, NextResponse } from "next/server";
import { getComments } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!postId) {
      return NextResponse.json(
        { error: "PostId parameter is required" },
        { status: 400 }
      );
    }

    const data = await getComments(postId, accessToken || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in getComments API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get comments" },
      { status: 500 }
    );
  }
}

