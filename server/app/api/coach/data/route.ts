import { NextRequest, NextResponse } from "next/server";
import { Goal, Post, Comment } from "@/lib/db/schema";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!
      );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "UserId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user', userId)
      .order('created_at', { ascending: false });

    if (goalsError) {
      throw goalsError;
    }

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw postsError;
    }

    // Fetch comments for all posts
    const postIds = posts?.map(post => post.id) || [];
    let allComments: Comment[] = [];
    
    if (postIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('post', postIds)
        .order('created_at', { ascending: false });

      if (commentsError) {
        throw commentsError;
      }

      allComments = (comments as Comment[]) || [];
    }

    return NextResponse.json({
      goals: (goals as Goal[]) || [],
      posts: (posts as Post[]) || [],
      comments: allComments,
    });
  } catch (error: any) {
    console.error("Error in coach data API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coach data" },
      { status: 500 }
    );
  }
}

