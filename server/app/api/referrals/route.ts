import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateReferral, getUserReferrals } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';

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
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Verify user can only get their own referrals
    if (auth.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own referrals' },
        { status: 403 }
      );
    }

    const data = await getUserReferrals(userId, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error getting referrals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get referrals' },
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
    const userId = body.userId || auth.user.id;

    // Verify user can only create referrals for themselves
    if (auth.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create referrals for yourself' },
        { status: 403 }
      );
    }

    const data = await getOrCreateReferral(userId, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create referral' },
      { status: 500 }
    );
  }
}

