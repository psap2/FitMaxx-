import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/lib/db/query";
import { Comment } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comment, accessToken } = body;

    if (!comment) {
      return NextResponse.json(
        { error: "Comment data is required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await createComment(comment as Omit<Comment, 'id' | 'created_at'>, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in createComment API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}

