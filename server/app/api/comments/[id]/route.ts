import { NextRequest, NextResponse } from 'next/server';
import { deleteComment } from '../../../../lib/db/query';
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

    // First, verify the comment belongs to the authenticated user
    // We need to get the comment to check ownership
    const { createUserClient } = await import('../../../../lib/db/supabase');
    const userClient = createUserClient(auth.token);
    const { data: comment, error: fetchError } = await userClient
      .from('comments')
      .select('user')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.user !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own comments' },
        { status: 403 }
      );
    }

    const data = await deleteComment(id, auth.user.id, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

