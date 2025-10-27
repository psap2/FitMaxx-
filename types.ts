export interface PhysiqueAnalysis {
  overallRating: number;
  bodyFatPercentage: number;
  muscleScores: {
    chest: number;
    shoulders: number;
    arms: number;
    legs: number;
    abs: number;
  };
  improvements: string[];
  strengths: string[];
  detailedFeedback: string;
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
  Auth: {
    gender: 'male' | 'female';
    height: { feet: number; inches: number } | { cm: number };
    weight: { value: number; unit: 'lbs' | 'kg' };
    referralCode?: string;
  };
  MainApp: undefined;
  Scan: undefined;
  Extras: undefined;
  Coach: undefined;
  Home: undefined;
  Results: { analysis: PhysiqueAnalysis; imageUri: string };
};