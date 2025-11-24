import { NextRequest, NextResponse } from 'next/server';
import { getReferralByCode } from '../../../../lib/db/query';
import { getAuthUser } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/db/supabase';

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
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'referralCode is required' },
        { status: 400 }
      );
    }

    // Get the referral to check if it exists and is unused (use user token for RLS)
    const referral = await getReferralByCode(referralCode, auth.token);
    
    if (!referral) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }
    
    if (referral.referred) {
      return NextResponse.json(
        { error: 'Referral code has already been used' },
        { status: 400 }
      );
    }
    
    if (referral.referrer === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      );
    }
    
    // Update the referral with the referred user (use user token for RLS)
    const { createUserClient } = await import('../../../../lib/db/supabase');
    const userClient = createUserClient(auth.token);
    const { error: updateError } = await userClient
      .from('referrals')
      .update({ referred: auth.user.id })
      .eq('referral_code', referralCode);
    
    if (updateError) {
      console.error('Error updating referral:', updateError);
      return NextResponse.json(
        { error: 'Failed to update referral' },
        { status: 500 }
      );
    }
    
    // Grant premium to the referrer using admin client (bypasses RLS)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Admin client not available' },
        { status: 500 }
      );
    }
    
    const { error: premiumError } = await supabaseAdmin
      .from('users')
      .update({ premium: true })
      .eq('id', referral.referrer);
    
    if (premiumError) {
      console.error('Error granting premium:', premiumError);
      return NextResponse.json(
        { error: 'Failed to grant premium' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, referrerId: referral.referrer });
  } catch (error: any) {
    console.error('Error applying referral:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply referral' },
      { status: 500 }
    );
  }
}

