export interface User {
    id: string;
    created_at: string;
    email: string | undefined;
    full_name: string | null;
    avatar_url: string | null;
    gender: 'male' | 'female'; 
    height: number; // in inches
    weight: number; // in lbs
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
}

export interface Comment {
  id: string;
  created_at: string;
  comment: string;
  user: string; // user id
  post: string; // post id
}

