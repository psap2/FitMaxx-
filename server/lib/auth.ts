import { NextRequest } from 'next/server';
import { supabase } from './db/supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export async function getAuthUser(request: NextRequest): Promise<AuthResult | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

