import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';
import { User } from '../../../lib/db/schema';

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
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Verify user can only query their own data
    if (email !== auth.user.email) {
      return NextResponse.json(
        { error: 'Forbidden: You can only query your own user data' },
        { status: 403 }
      );
    }

    const data = await getUser(email, auth.token);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user: User = body;

    if (!user.id || !user.email) {
      return NextResponse.json(
        { error: 'User id and email are required' },
        { status: 400 }
      );
    }

    const data = await createUser(user);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

