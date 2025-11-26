import { NextRequest, NextResponse } from 'next/server';
import { deletePost } from '../../../../lib/db/query';
import { getAuthUser } from '../../../../lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params before accessing properties (Next.js 15+ requirement)
    const { id } = await params;

    // First, verify the post belongs to the authenticated user
    const { createUserClient } = await import('../../../../lib/db/supabase');
    const userClient = createUserClient(auth.token);
    const { data: post, error: fetchError } = await userClient
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    const data = await deletePost(id, auth.user.id, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}

