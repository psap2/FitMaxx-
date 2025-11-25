import { NextRequest, NextResponse } from 'next/server';
import { getGoals, createGoal } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';
import { GoalInsert } from '../../../lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId parameter is required' },
        { status: 400 }
      );
    }

    // Verify user can only get their own goals
    if (auth.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own goals' },
        { status: 403 }
      );
    }

    const data = await getGoals(userId, auth.token);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error getting goals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get goals' },
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
    const goal: GoalInsert = body;

    if (!goal.goal) {
      return NextResponse.json(
        { error: 'Goal text is required' },
        { status: 400 }
      );
    }

    // Ensure user matches authenticated user
    if (goal.user !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create goals for yourself' },
        { status: 403 }
      );
    }

    const data = await createGoal(goal, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create goal' },
      { status: 500 }
    );
  }
}

