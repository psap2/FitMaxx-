import axios from 'axios';

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

const RAPIDAPI_KEY = '69ce05cc60msh8f2f3074af168dbp105695jsne212fc62bbd4';
const RAPIDAPI_HOST = 'chatgpt-vision1.p.rapidapi.com';

export const analyzePhysique = async (imageUrl: string): Promise<PhysiqueAnalysis> => {
  try {
    const prompt = `Analyze this physique image and provide a detailed assessment in the following JSON format:
{
  "overallRating": [number 1-10],
  "bodyFatPercentage": [estimated percentage],
  "muscleScores": {
    "chest": [number 1-10],
    "shoulders": [number 1-10],
    "arms": [number 1-10],
    "legs": [number 1-10],
    "abs": [number 1-10]
  },
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "strengths": ["strength 1", "strength 2"],
  "detailedFeedback": "detailed analysis text"
}

Provide honest, constructive feedback focusing on muscle development, symmetry, and body composition. Include specific training recommendations.`;

    const response = await axios.post(
      'https://chatgpt-vision1.p.rapidapi.com/matagvision2',
      {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image',
                url: imageUrl,
              },
            ],
          },
        ],
        web_access: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    const content = response.data.result || response.data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    throw new Error('Failed to parse analysis response');
  } catch (error) {
    console.error('Error analyzing physique:', error);
    throw error;
  }
};