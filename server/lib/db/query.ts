import { supabase, createUserClient } from "./supabase";
import { Post, User, Comment, Referral, ReferralInsert, Goal, GoalInsert } from "./schema";

export const getUser = async (email: string | undefined, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('users').select('*').eq('email', email);
    if (error) {
        throw error;
    }
    return data;
}

export const createUser = async (user: User, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('users').insert(user);
    if (error) {
        throw error;
    }
    return data;
}

export const updateUser = async (userId: string, updates: Partial<User>, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('users').update(updates).eq('id', userId);
    if (error) {
        throw error;
    }
    return data;
}

type PostInsert = Omit<Post, 'id' | 'created_at'>;

export const createPost = async (post: PostInsert, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('posts').insert(post).select().single();
    if (error) {
        throw error;
    }
    return data;
}

export const deletePost = async (postId: string, userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

// Comment functions
export const getComments = async (postId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client
        .from('comments')
        .select('*')
        .eq('post', postId)
        .order('created_at', { ascending: false });
    if (error) {
        throw error;
    }
    return data;
}

type CommentInsert = Omit<Comment, 'id' | 'created_at'>;

export const createComment = async (comment: CommentInsert, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('comments').insert(comment).select().single();
    if (error) {
        throw error;
    }
    return data;
}

export const deleteComment = async (commentId: string, userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user', userId)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

// Generate a random referral code
const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Referral functions
export const getOrCreateReferral = async (userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    // First, check if user already has a referral code
    const { data: existingReferral, error: fetchError } = await client
        .from('referrals')
        .select('*')
        .eq('referrer', userId)
        .single();
    
    // If user already has a referral code, return it
    if (existingReferral && !fetchError) {
        return existingReferral;
    }
    
    // If no existing referral code, create a new one
    const referralCode = generateReferralCode(); // Generate 8-character code
    
    const referralData: ReferralInsert = {
        referrer: userId,
        referred: null,
        referral_code: referralCode
    };
    const { data, error } = await client.from('referrals').insert(referralData).select().single();
    if (error) {
        throw error;
    }
    return data;
}

// Keep the old function for backward compatibility, but redirect to new one
export const createReferral = getOrCreateReferral;

export const getReferralByCode = async (referralCode: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('referrals').select('*').eq('referral_code', referralCode).single();
    if (error) {
        throw error;
    }
    return data;
}

export const validateReferralCode = async (referralCode: string, token?: string) => {
    try {
        const referral = await getReferralByCode(referralCode, token);
        
        // Check if referral exists and is unused
        if (!referral) {
            return { valid: false, message: 'Invalid referral code' };
        }
        
        if (referral.referred) {
            return { valid: false, message: 'Referral code has already been used' };
        }
        
        return { valid: true, referral };
    } catch (error) {
        return { valid: false, message: 'Invalid referral code' };
    }
}

export const applyReferralAfterSignup = async (referralCode: string, referredUserId: string) => {
    // First, get the referral to check if it exists and is unused
    const referral = await getReferralByCode(referralCode);
    
    if (!referral) {
        throw new Error('Invalid referral code');
    }
    
    if (referral.referred) {
        throw new Error('Referral code has already been used');
    }
    
    if (referral.referrer === referredUserId) {
        throw new Error('You cannot use your own referral code');
    }
    
    // Update the referral with the referred user
    const { error: updateError } = await supabase
        .from('referrals')
        .update({ referred: referredUserId })
        .eq('referral_code', referralCode);
    
    if (updateError) {
        throw updateError;
    }
    
    // First, check if the referrer user exists
    const { data: referrerUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', referral.referrer)
        .single();
    
    if (findError || !referrerUser) {
        throw new Error(`Referrer user not found: ${referral.referrer}`);
    }
    
    // Grant premium to the referrer using updateUser function
    try {
        await updateUser(referral.referrer, { premium: true });
    } catch (updateError) {
        // Fallback to direct update
        const { data: premiumData, error: premiumError } = await supabase
            .from('users')
            .update({ premium: true })
            .eq('id', referral.referrer)
            .select();
        
        if (premiumError) {
            throw premiumError;
        }
    }
    
    return { success: true, referrerId: referral.referrer };
}

// Keep the old function for backward compatibility
export const useReferralCode = applyReferralAfterSignup;

export const getUserReferrals = async (userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('referrals').select('*').eq('referrer', userId);
    if (error) {
        throw error;
    }
    return data;
}

// Goal functions
export const getGoals = async (userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client
        .from('goals')
        .select('*')
        .eq('user', userId)
        .order('created_at', { ascending: false });
    if (error) {
        throw error;
    }
    return data;
}

export const createGoal = async (goal: GoalInsert, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client.from('goals').insert(goal).select().single();
    if (error) {
        throw error;
    }
    return data;
}

export const deleteGoal = async (goalId: string, userId: string, token?: string) => {
    const client = token ? createUserClient(token) : supabase;
    const { data, error } = await client
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user', userId)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

