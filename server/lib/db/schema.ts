export interface User {
    id: string;
    created_at: string;
    email: string | undefined;
    full_name: string | null;
    avatar_url: string | null;
    gender: 'male' | 'female'; 
    height: number; // in inches
    weight: number; // in lbs
    premium: boolean;
}

export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  image_url: string;
  overall_rating: number | null; // stored as integer score (0-100)
  potential: number | null;
  body_fat: number | null;
  symmetry: number | null;
  summaryrecc: string | null;
  // Premium scores (stored as integer scores 0-100)
  chest?: number | null;
  quads?: number | null;
  hamstrings?: number | null;
  calves?: number | null;
  back?: number | null;
  biceps?: number | null;
  triceps?: number | null;
  shoulders?: number | null;
  forearms?: number | null;
  traps?: number | null;
}

export interface Comment {
  id: string;
  created_at: string;
  comment: string;
  user: string; // user id
  post: string; // post id
}

export interface Referral {
  id: string;
  created_at: string;
  referrer: string; // user id who created the referral
  referred: string | null; // user id who used the referral (null until used)
  referral_code: string; // unique referral code
}

export type ReferralInsert = Omit<Referral, 'id' | 'created_at'>;

