import { PhysiqueAnalysis } from './types';

// Mock data for testing
const mockAnalyses = [
  {
    overallRating: 8.6,
    potential: 9.1,
    bodyFatPercentage: 12.5,
    symmetry: 8.8,
    strengths: [
      'Excellent shoulder development',
      'Strong leg definition',
      'Good overall symmetry',
    ],
    improvements: [
      'Focus on core strengthening exercises',
      'Increase protein intake for muscle recovery',
      'Add more compound movements to your routine',
    ],
    summaryRecommendation:
      'Your physique shows excellent development in the shoulders and legs. Maintain your current intensity while leaning into core work and recovery.',
    premiumScores: {
      chest: 8.2,
      quads: 9.2,
      hamstrings: 8.5,
      calves: 7.8,
      back: 8.9,
      biceps: 8.0,
      triceps: 8.3,
      shoulders: 9.5,
      forearms: 7.4,
      traps: 8.7,
    },
  },
  {
    overallRating: 7.3,
    potential: 8.0,
    bodyFatPercentage: 15.2,
    symmetry: 7.1,
    strengths: [
      'Good chest development',
      'Solid shoulder structure',
      'Consistent training approach',
    ],
    improvements: [
      'Increase arm training frequency',
      'Focus on progressive overload',
      'Improve core stability',
    ],
    summaryRecommendation:
      'You have a solid foundation with good chest and shoulder development. Increase arm training frequency and apply progressive overload to break plateaus.',
    premiumScores: {
      chest: 7.8,
      quads: 7.4,
      hamstrings: 7.0,
      calves: 6.5,
      back: 7.2,
      biceps: 6.9,
      triceps: 6.8,
      shoulders: 8.1,
      forearms: 6.4,
      traps: 7.0,
    },
  },
  {
    overallRating: 9.1,
    potential: 9.6,
    bodyFatPercentage: 8.7,
    symmetry: 9.4,
    strengths: [
      'Exceptional overall development',
      'Outstanding muscle definition',
      'Perfect symmetry and proportions',
    ],
    improvements: [
      'Maintain current training intensity',
      'Focus on recovery and nutrition',
      'Consider advanced training techniques',
    ],
    summaryRecommendation:
      'This is an exceptional physique with outstanding development across all areas. Stay consistent, prioritise recovery, and explore advanced periodisation for continued gains.',
    premiumScores: {
      chest: 9.2,
      quads: 9.6,
      hamstrings: 9.3,
      calves: 8.9,
      back: 9.4,
      biceps: 8.9,
      triceps: 9.0,
      shoulders: 9.8,
      forearms: 8.6,
      traps: 9.2,
    },
  }
];

export const analyzePhysique = async (imageUrl: string): Promise<PhysiqueAnalysis> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return random mock data
  const randomIndex = Math.floor(Math.random() * mockAnalyses.length);
  return mockAnalyses[randomIndex];
};