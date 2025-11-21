import { supabase } from "../../../utils/supabase";
import { Post, User, Comment, Referral, ReferralInsert } from "./schema";

export const getUser = async (email: string | undefined) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email);
    if (error) {
        throw error;
    }
    return data;
}

export const createUser = async (user: User) => {
    const { data, error } = await supabase.from('users').insert(user);
    if (error) {
        throw error;
    }
    return data;
}

export const updateUser = async (userId: string, updates: Partial<User>, client = supabase) => {
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId);
    if (error) {
        throw error;
    }
    return data;
}

type PostInsert = Omit<Post, 'id' | 'created_at'>;

export const createPost = async (post: PostInsert) => {
    const { data, error } = await supabase.from('posts').insert(post).select().single();
    if (error) {
        throw error;
    }
    return data;
}

// Comment functions
export const getComments = async (postId: string) => {
    const { data, error } = await supabase
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

export const createComment = async (comment: CommentInsert) => {
    const { data, error } = await supabase.from('comments').insert(comment).select().single();
    if (error) {
        throw error;
    }
    return data;
}

export const deleteComment = async (commentId: string, userId: string) => {
    const { data, error } = await supabase
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
export const getOrCreateReferral = async (userId: string, client = supabase) => {
    // First, check if user already has a referral code
    const { data: existingReferral, error: fetchError } = await client
        .from('referrals')
        .select('*')
        .eq('referrer', userId)
        .single();
    
    // If user already has a referral code, return it
    if (existingReferral && !fetchError) {
        console.log('Returning existing referral code:', existingReferral.referral_code);
        return existingReferral;
    }
    
    // If no existing referral code, create a new one
    console.log('🆕 Creating new referral code for user:', userId);
    const referralCode = generateReferralCode(); // Generate 8-character code
    
    const referralData: ReferralInsert = {
        referrer: userId,
        referred: null,
        referral_code: referralCode
    };
    const { data, error } = await client.from('referrals').insert(referralData).select().single();
    if (error) {
        console.log('error', error);
        throw error;
    }
    return data;
}

// Keep the old function for backward compatibility, but redirect to new one
export const createReferral = getOrCreateReferral;

export const getReferralByCode = async (referralCode: string, client = supabase) => {
    const { data, error } = await client.from('referrals').select('*').eq('referral_code', referralCode).single();
    if (error) {
        throw error;
    }
    return data;
}

export const validateReferralCode = async (referralCode: string, client = supabase) => {
    try {
        const referral = await getReferralByCode(referralCode, client);
        
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

export const applyReferralAfterSignup = async (referralCode: string, referredUserId: string, client = supabase) => {
    console.log('🎯 Applying referral:', { referralCode, referredUserId });
    
    // First, get the referral to check if it exists and is unused
    const referral = await getReferralByCode(referralCode, client);
    console.log('📋 Found referral:', referral);
    
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
    console.log('🔄 Updating referral table...');
    const { error: updateError } = await client
        .from('referrals')
        .update({ referred: referredUserId })
        .eq('referral_code', referralCode);
    
    if (updateError) {
        console.error('❌ Error updating referral:', updateError);
        throw updateError;
    }
    console.log('✅ Referral table updated successfully');
    
    // First, check if the referrer user exists
    console.log('🔍 Checking if referrer exists:', referral.referrer);
    const { data: referrerUser, error: findError } = await client
        .from('users')
        .select('*')
        .eq('id', referral.referrer)
        .single();
    
    if (findError || !referrerUser) {
        console.error('❌ Referrer user not found:', findError);
        throw new Error(`Referrer user not found: ${referral.referrer}`);
    }
    
    console.log('👤 Found referrer user:', referrerUser);
    
    // Grant premium to the referrer using updateUser function
    console.log('🌟 Granting premium to referrer:', referral.referrer);
    try {
        const updatedUser = await updateUser(referral.referrer, { premium: true }, client);
        console.log('✅ Premium granted successfully via updateUser:', updatedUser);
    } catch (updateError) {
        console.error('❌ Error with updateUser, trying direct update:', updateError);
        
        // Fallback to direct update
        const { data: premiumData, error: premiumError } = await client
            .from('users')
            .update({ premium: true })
            .eq('id', referral.referrer)
            .select();
        
        if (premiumError) {
            console.error('❌ Error granting premium:', premiumError);
            throw premiumError;
        }
        
        console.log('✅ Premium granted successfully (direct):', premiumData);
    }
    
    // Verify the update worked
    const { data: verifyUser } = await client
        .from('users')
        .select('premium, id, email')
        .eq('id', referral.referrer)
        .single();
    
    console.log('🔍 Verification - User premium status:', verifyUser);
    
    return { success: true, referrerId: referral.referrer };
}

// Keep the old function for backward compatibility
export const useReferralCode = applyReferralAfterSignup;

export const getUserReferrals = async (userId: string, client = supabase) => {
    const { data, error } = await client.from('referrals').select('*').eq('referrer', userId);
    if (error) {
        throw error;
    }
    return data;
}

// Test function to verify premium updates work
export const testPremiumUpdate = async (userId: string, client = supabase) => {
    console.log('🧪 Testing premium update for user:', userId);
    
    // First check current status
    const { data: beforeData } = await client
        .from('users')
        .select('premium, id, email')
        .eq('id', userId)
        .single();
    console.log('📊 Before update:', beforeData);
    
    // Try to update
    const { data: updateData, error: updateError } = await client
        .from('users')
        .update({ premium: true })
        .eq('id', userId)
        .select();
    
    if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
    }
    
    console.log('✅ Update result:', updateData);
    
    // Verify the change
    const { data: afterData } = await client
        .from('users')
        .select('premium, id, email')
        .eq('id', userId)
        .single();
    console.log('📊 After update:', afterData);
    
    return { before: beforeData, after: afterData, updateResult: updateData };
}

