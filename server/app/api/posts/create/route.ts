import { NextRequest, NextResponse } from "next/server";
import { createPost } from "@/lib/db/query";
import { Post } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post, accessToken } = body;

    if (!post) {
      return NextResponse.json(
        { error: "Post data is required" },
        { status: 400 }
      );
    }

    const token = accessToken || request.headers.get("authorization")?.replace("Bearer ", "");
    const data = await createPost(post as Omit<Post, 'id' | 'created_at'>, token || undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in createPost API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

