import { PhysiqueAnalysis } from './types';
import { Platform } from 'react-native';

// Convert image URI to base64 using fetch (works for all URI types)
const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    // Use fetch to get the image, works for file://, content://, http://, etc.
    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Convert blob to base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string;
          // Remove data URL prefix if present (data:image/jpeg;base64,)
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

export const analyzePhysique = async (imageUri: string): Promise<PhysiqueAnalysis> => {
  try {
    // Convert image to base64
    console.log('Converting image to base64...');
    const imageBase64 = await uriToBase64(imageUri);
    console.log('Image converted, sending to API...');

    // Call the OpenAI API endpoint with platform-specific URLs for local dev
    const getApiUrl = () => {
      if (__DEV__) {
        // Development URLs - different for Android and iOS
        if (Platform.OS === 'android') {
          return 'http://10.0.2.2:3000/api/openai'; // Android emulator localhost
        } else if (Platform.OS === 'ios') {
          return 'http://localhost:3000/api/openai'; // iOS simulator localhost
        } else {
          return 'http://localhost:3000/api/openai'; // Fallback for web/other
        }
      } else {
        // Production URL
        return process.env.EXPO_PUBLIC_API_URL || 'https://your-production-url.com/api/openai';
      }
    };

    const apiUrl = getApiUrl();

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000000); // 60 second timeout for image analysis

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
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

    // Validate and ensure all required fields are present (allow 0 values and null for bodyFatPercentage)
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

    // Check if analysis seems valid (not all zeros, which might indicate image wasn't recognized)
    if (
      analysis.overallRating === 0 &&
      analysis.potential === 0 &&
      analysis.symmetry === 0 &&
      (!analysis.strengths || analysis.strengths.length === 0)
    ) {
      // If the summary indicates the image wasn't recognized, throw a helpful error
      if (analysis.summaryRecommendation?.toLowerCase().includes('does not contain') ||
          analysis.summaryRecommendation?.toLowerCase().includes('not recognizable')) {
        throw new Error('Could not analyze the image. Please ensure the photo clearly shows your physique.');
      }
    }

    // Ensure arrays exist even if empty
    if (!Array.isArray(analysis.strengths)) {
      analysis.strengths = [];
    }
    if (!Array.isArray(analysis.improvements)) {
      analysis.improvements = [];
    }

    // Validate premium scores if present - each should be number or null
    if (analysis.premiumScores) {
      const premiumScoreKeys = ['chest', 'quads', 'hamstrings', 'calves', 'back', 'biceps', 'triceps', 'shoulders', 'forearms', 'traps'];
      for (const key of premiumScoreKeys) {
        const value = analysis.premiumScores[key as keyof typeof analysis.premiumScores];
        if (value !== null && value !== undefined && typeof value !== 'number') {
          console.error(`Invalid premium score for ${key}:`, typeof value, value);
          // Set invalid values to null
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