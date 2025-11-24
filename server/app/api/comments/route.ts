import { NextRequest, NextResponse } from 'next/server';
import { getComments, createComment } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';
import { Comment } from '../../../lib/db/schema';

type CommentInsert = Omit<Comment, 'id' | 'created_at'>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId parameter is required' },
        { status: 400 }
      );
    }

    // Try to get auth token if available (optional for this endpoint)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    const data = await getComments(postId, token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get comments' },
      { status: 500 }
    );
  }
}

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
    const comment: CommentInsert = body;

    // Ensure user matches authenticated user
    if (comment.user !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create comments as yourself' },
        { status: 403 }
      );
    }

    const data = await createComment(comment, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}

