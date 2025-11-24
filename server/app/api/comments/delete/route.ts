import { NextRequest, NextResponse } from "next/server";
import { deleteComment } from "@/lib/db/query";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    const userId = searchParams.get("userId");
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!commentId) {
      return NextResponse.json(
        { error: "CommentId parameter is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "UserId parameter is required" },
        { status: 400 }
      );
    }

    const token = accessToken || undefined;
    const data = await deleteComment(commentId, userId, token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in deleteComment API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}

