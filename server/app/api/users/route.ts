import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser } from '../../../lib/db/query';
import { getAuthUser } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/db/supabase';
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
    // Verify user is authenticated (they just signed in with Supabase)
    const auth = await getAuthUser(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized - must be authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const user: User = body;

    if (!user.id || !user.email) {
      return NextResponse.json(
        { error: 'User id and email are required' },
        { status: 400 }
      );
    }

    // Verify user can only create their own profile
    if (user.id !== auth.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create your own profile' },
        { status: 403 }
      );
    }

    // Verify email matches authenticated user
    if (user.email !== auth.user.email) {
      return NextResponse.json(
        { error: 'Forbidden: Email must match authenticated user' },
        { status: 403 }
      );
    }

    // Use admin client for user creation during signup (bypasses RLS)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Admin client not available' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(user)
      .select();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

