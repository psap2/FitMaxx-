import { NextRequest, NextResponse } from 'next/server';
import { deleteGoal } from '../../../../lib/db/query';
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

    // First, verify the goal belongs to the authenticated user
    const { createUserClient } = await import('../../../../lib/db/supabase');
    const userClient = createUserClient(auth.token);
    const { data: goal, error: fetchError } = await userClient
      .from('goals')
      .select('user')
      .eq('id', id)
      .single();

    if (fetchError || !goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    if (goal.user !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own goals' },
        { status: 403 }
      );
    }

    const data = await deleteGoal(id, auth.user.id, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

