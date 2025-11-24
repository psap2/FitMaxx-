import { NextRequest, NextResponse } from 'next/server';
import { createPost } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';
import { Post } from '../../../lib/db/schema';

type PostInsert = Omit<Post, 'id' | 'created_at'>;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const post: PostInsert = body;

    // Ensure user_id matches authenticated user
    if (post.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create posts for yourself' },
        { status: 403 }
      );
    }

    const data = await createPost(post, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

