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

// Mock data for testing
const mockAnalyses = [
  {
    overallRating: 8.6,
    bodyFatPercentage: 12.5,
    muscleScores: {
      chest: 8.2,
      shoulders: 9.5,
      arms: 8.2,
      legs: 9.2,
      abs: 7.2,
    },
    improvements: [
      "Focus on core strengthening exercises",
      "Increase protein intake for muscle recovery",
      "Add more compound movements to your routine"
    ],
    strengths: [
      "Excellent shoulder development",
      "Strong leg definition",
      "Good overall symmetry"
    ],
    detailedFeedback: "Your physique shows excellent development in the shoulders and legs. The symmetry is well-balanced, and your muscle definition is impressive. To reach the next level, focus on core strengthening and ensure adequate protein intake for optimal muscle recovery."
  },
  {
    overallRating: 7.3,
    bodyFatPercentage: 15.2,
    muscleScores: {
      chest: 7.8,
      shoulders: 8.1,
      arms: 6.9,
      legs: 7.5,
      abs: 6.8,
    },
    improvements: [
      "Increase arm training frequency",
      "Focus on progressive overload",
      "Improve core stability"
    ],
    strengths: [
      "Good chest development",
      "Solid shoulder structure",
      "Consistent training approach"
    ],
    detailedFeedback: "You have a solid foundation with good chest and shoulder development. Your training consistency shows. To improve further, increase your arm training frequency and focus on progressive overload principles."
  },
  {
    overallRating: 9.1,
    bodyFatPercentage: 8.7,
    muscleScores: {
      chest: 9.2,
      shoulders: 9.8,
      arms: 8.9,
      legs: 9.5,
      abs: 8.7,
    },
    improvements: [
      "Maintain current training intensity",
      "Focus on recovery and nutrition",
      "Consider advanced training techniques"
    ],
    strengths: [
      "Exceptional overall development",
      "Outstanding muscle definition",
      "Perfect symmetry and proportions"
    ],
    detailedFeedback: "This is an exceptional physique with outstanding muscle development across all areas. Your symmetry is perfect, and the muscle definition is impressive. Maintain your current approach while focusing on recovery and nutrition."
  }
];

export const analyzePhysique = async (imageUrl: string): Promise<PhysiqueAnalysis> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return random mock data
  const randomIndex = Math.floor(Math.random() * mockAnalyses.length);
  return mockAnalyses[randomIndex];
};