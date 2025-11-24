import { Platform } from 'react-native';
import { supabase } from './supabase';

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:3000';
    } else {
      return 'http://localhost:3000';
    }
  } else {
    return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-url.com';
  }
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// User API functions
export const getUser = async (email: string) => {
  return apiCall(`/api/users/get?email=${encodeURIComponent(email)}`);
};

export const createUser = async (user: any) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/users/create', {
    method: 'POST',
    body: JSON.stringify({ user, accessToken }),
  });
};

export const updateUser = async (userId: string, updates: any) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/users/update', {
    method: 'PUT',
    body: JSON.stringify({ userId, updates, accessToken }),
  });
};

// Post API functions
export const createPost = async (post: any) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/posts/create', {
    method: 'POST',
    body: JSON.stringify({ post, accessToken }),
  });
};

// Comment API functions
export const getComments = async (postId: string) => {
  return apiCall(`/api/comments/get?postId=${encodeURIComponent(postId)}`);
};

export const createComment = async (comment: any) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/comments/create', {
    method: 'POST',
    body: JSON.stringify({ comment, accessToken }),
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  return apiCall(`/api/comments/delete?commentId=${encodeURIComponent(commentId)}&userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
};

// Referral API functions
export const createReferral = async (userId: string) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/referrals/create', {
    method: 'POST',
    body: JSON.stringify({ userId, accessToken }),
  });
};

export const validateReferralCode = async (referralCode: string) => {
  return apiCall(`/api/referrals/validate?referralCode=${encodeURIComponent(referralCode)}`);
};

export const applyReferralAfterSignup = async (referralCode: string, referredUserId: string) => {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  return apiCall('/api/referrals/apply', {
    method: 'POST',
    body: JSON.stringify({ referralCode, referredUserId, accessToken }),
  });
};

