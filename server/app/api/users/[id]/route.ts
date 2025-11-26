import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '../../../../lib/db/query';
import { getAuthUser } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/db/supabase';

const ALLOWED_FIELDS = ['height', 'weight', 'full_name', 'avatar_url'];
const BLOCKED_FIELDS = ['premium', 'email', 'id', 'created_at'];

export async function POST(
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

    // Verify user can only update their own data
    if (auth.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = body;

    // Filter out blocked fields
    const filteredUpdates: any = {};
    for (const key in updates) {
      if (ALLOWED_FIELDS.includes(key) && !BLOCKED_FIELDS.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    const data = await updateUser(id, filteredUpdates, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

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

    // Verify user can only delete their own account
    if (auth.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own account' },
        { status: 403 }
      );
    }

    // Use admin client to delete all user data (bypasses RLS)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Admin client not available' },
        { status: 500 }
      );
    }

    const userId = id;

    // Delete in order: comments, posts, goals, referrals, then user
    // Comments
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user', userId);

    if (commentsError) {
      console.error('Error deleting comments:', commentsError);
    }

    // Posts (this should also delete associated comments via cascade if set up)
    const { error: postsError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('user_id', userId);

    if (postsError) {
      console.error('Error deleting posts:', postsError);
    }

    // Goals
    const { error: goalsError } = await supabaseAdmin
      .from('goals')
      .delete()
      .eq('user', userId);

    if (goalsError) {
      console.error('Error deleting goals:', goalsError);
    }

    // Referrals (where user is referrer or referred)
    const { error: referralsError } = await supabaseAdmin
      .from('referrals')
      .delete()
      .or(`referrer.eq.${userId},referred.eq.${userId}`);

    if (referralsError) {
      console.error('Error deleting referrals:', referralsError);
    }

    // Finally, delete the user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('Error deleting user:', userError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Don't fail the request if auth deletion fails - data is already deleted
      // The user will just need to sign out manually
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user account' },
      { status: 500 }
    );
  }
}

