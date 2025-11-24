import { Platform } from 'react-native';
import { supabase } from './supabase';
import { User, Post, Comment, Referral } from '../server/lib/db/schema';

// Get API base URL
const getApiUrl = () => {
  if (__DEV__) {
    // Development URLs - different for Android and iOS
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000'; // Android emulator localhost
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:3000'; // iOS simulator localhost
    } else {
      return 'http://localhost:3000'; // Fallback for web/other
    }
  } else {
    // Production URL
    return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-url.com';
  }
};

const API_URL = getApiUrl();

// Helper function to make API calls with auth
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// User functions
export const getUser = async (email: string | undefined) => {
  if (!email) {
    throw new Error('Email is required');
  }
  return apiCall(`/users?email=${encodeURIComponent(email)}`, { method: 'GET' });
};

export const createUser = async (user: User) => {
  return apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  return apiCall(`/users/${userId}`, {
    method: 'POST',
    body: JSON.stringify(updates),
  });
};

// Post functions
type PostInsert = Omit<Post, 'id' | 'created_at'>;

export const createPost = async (post: PostInsert) => {
  return apiCall('/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
};

// Comment functions
export const getComments = async (postId: string) => {
  return apiCall(`/comments?postId=${encodeURIComponent(postId)}`, { method: 'GET' });
};

type CommentInsert = Omit<Comment, 'id' | 'created_at'>;

export const createComment = async (comment: CommentInsert) => {
  return apiCall('/comments', {
    method: 'POST',
    body: JSON.stringify(comment),
  });
};

export const deleteComment = async (commentId: string) => {
  return apiCall(`/comments/${commentId}`, {
    method: 'DELETE',
  });
};

// Referral functions
export const getOrCreateReferral = async (userId: string) => {
  return apiCall('/referrals', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

// Keep the old function for backward compatibility
export const createReferral = getOrCreateReferral;

export const validateReferralCode = async (referralCode: string) => {
  return apiCall(`/referrals/validate?code=${encodeURIComponent(referralCode)}`, { method: 'GET' });
};

export const applyReferralAfterSignup = async (referralCode: string, referredUserId?: string) => {
  return apiCall('/referrals/apply', {
    method: 'POST',
    body: JSON.stringify({ referralCode }),
  });
};

// Keep the old function for backward compatibility
export const useReferralCode = applyReferralAfterSignup;

export const getUserReferrals = async (userId: string) => {
  return apiCall(`/referrals?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
};

