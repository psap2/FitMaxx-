import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '../../../../lib/db/query';
import { getAuthUser } from '../../../../lib/auth';

const ALLOWED_FIELDS = ['height', 'weight', 'full_name', 'avatar_url'];
const BLOCKED_FIELDS = ['premium', 'email', 'id', 'created_at'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user can only update their own data
    if (auth.user.id !== params.id) {
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

    const data = await updateUser(params.id, filteredUpdates, auth.token);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

