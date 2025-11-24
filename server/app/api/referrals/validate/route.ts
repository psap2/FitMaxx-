import { NextRequest, NextResponse } from 'next/server';
import { validateReferralCode } from '../../../../lib/db/query';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'code parameter is required' },
        { status: 400 }
      );
    }

    const result = await validateReferralCode(code);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}

