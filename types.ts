export interface PremiumMuscleScores {
  chest?: number;
  quads?: number;
  hamstrings?: number;
  calves?: number;
  back?: number;
  biceps?: number;
  triceps?: number;
  shoulders?: number;
  forearms?: number;
  traps?: number;
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
};