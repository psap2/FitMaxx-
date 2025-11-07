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