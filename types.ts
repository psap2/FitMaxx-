export interface PremiumMuscleScores {
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

export interface PhysiqueAnalysis {
  overallRating: number;
  potential: number;
  bodyFatPercentage: number;
  symmetry: number;
  strengths: string[];
  improvements: string[];
  summaryRecommendation: string;
  premiumScores?: PremiumMuscleScores;
}

export type RootStackParamList = {
  Gender: undefined;
  Height: { gender: 'male' | 'female' };
  Weight: { 
    gender: 'male' | 'female';
    height: { feet: number; inches: number } | { cm: number };
  };
  Referral: {
    gender: 'male' | 'female';
    height: { feet: number; inches: number } | { cm: number };
    weight: { value: number; unit: 'lbs' | 'kg' };
  };
  Notifications: {
    gender: 'male' | 'female';
    height: { feet: number; inches: number } | { cm: number };
    weight: { value: number; unit: 'lbs' | 'kg' };
    referralCode?: string;
  };
  Auth:
    | {
        gender: 'male' | 'female';
        height: { feet: number; inches: number } | { cm: number };
        weight: { value: number; unit: 'lbs' | 'kg' };
        referralCode?: string;
      }
    | undefined;
  MainApp: undefined;
  Scan: undefined;
  Extras: undefined;
  Coach: undefined;
  Home: undefined;
  Results: { analysis: PhysiqueAnalysis; imageUri: string; allowSave?: boolean; postId?: string };
  Gallery: undefined;
  EditProfile: undefined;
  Comments: { postId: string };
  Goals: undefined;
};