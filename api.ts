import { PhysiqueAnalysis } from './types';
import { Platform } from 'react-native';

const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          const base64 = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          resolve(base64);
        } catch (error) {
          reject(new Error('Failed to parse base64 string'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image as base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error.message || 'Unknown error'}`);
  }
};

export const analyzePhysique = async (
  imageUri: string,
  analysisId?: string,
  userId?: string
): Promise<PhysiqueAnalysis> => {
  try {
    console.log('Converting image to base64...');
    const imageBase64 = await uriToBase64(imageUri);
    console.log('Image converted, sending to API...');

    const getApiUrl = () => {
      if (__DEV__) {
        if (Platform.OS === 'android') {
          return 'http://10.0.2.2:3000/api/openai';
        } else if (Platform.OS === 'ios') {
          return 'http://localhost:3000/api/openai';
        } else {
          return 'http://localhost:3000/api/openai';
        }
      } else {
        return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-url.com/api/openai';
      }
    };

    const apiUrl = getApiUrl();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        analysisId,
        userId,
      }),
      signal: controller.signal,
    }).catch((fetchError: any) => {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. The analysis is taking longer than expected.');
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const analysis: PhysiqueAnalysis = await response.json();
    console.log('Analysis received:', JSON.stringify(analysis, null, 2));

    if (
      typeof analysis.overallRating !== 'number' ||
      typeof analysis.potential !== 'number' ||
      (analysis.bodyFatPercentage !== null && typeof analysis.bodyFatPercentage !== 'number') ||
      typeof analysis.symmetry !== 'number'
    ) {
      console.error('Invalid analysis structure:', {
        overallRating: typeof analysis.overallRating,
        potential: typeof analysis.potential,
        bodyFatPercentage: typeof analysis.bodyFatPercentage,
        symmetry: typeof analysis.symmetry,
      });
      throw new Error('Invalid analysis response: missing or invalid required fields');
    }

    if (
      analysis.overallRating === 0 &&
      analysis.potential === 0 &&
      analysis.symmetry === 0 &&
      (!analysis.strengths || analysis.strengths.length === 0)
    ) {
      if (analysis.summaryRecommendation?.toLowerCase().includes('does not contain') ||
          analysis.summaryRecommendation?.toLowerCase().includes('not recognizable')) {
        throw new Error('Could not analyze the image. Please ensure the photo clearly shows your physique.');
      }
    }

    if (!Array.isArray(analysis.strengths)) {
      analysis.strengths = [];
    }
    if (!Array.isArray(analysis.improvements)) {
      analysis.improvements = [];
    }

    if (analysis.premiumScores) {
      const premiumScoreKeys = ['chest', 'quads', 'hamstrings', 'calves', 'back', 'biceps', 'triceps', 'shoulders', 'forearms', 'traps'];
      for (const key of premiumScoreKeys) {
        const value = analysis.premiumScores[key as keyof typeof analysis.premiumScores];
        if (value !== null && value !== undefined && typeof value !== 'number') {
          console.error(`Invalid premium score for ${key}:`, typeof value, value);
          analysis.premiumScores[key as keyof typeof analysis.premiumScores] = null;
        }
      }
    }

    return analysis;
  } catch (error: any) {
    console.error('Error analyzing physique:', error);
    throw new Error(error.message || 'Failed to analyze physique. Please try again.');
  }
};