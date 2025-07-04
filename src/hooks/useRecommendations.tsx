// Temporarily disabled - requires additional database tables
export const useRecommendations = () => {
  return {
    recommendations: [],
    loading: false,
    createRecommendation: () => Promise.resolve(),
    deleteRecommendation: () => Promise.resolve(),
    getRecommendationsForUser: () => Promise.resolve([]),
    generateAIRecommendations: (_: any) => Promise.resolve(),
    generateGenreRecommendations: (_: any) => Promise.resolve(),
    dismissRecommendation: (_: any) => Promise.resolve(),
  };
};