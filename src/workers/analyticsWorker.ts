// Analytics Worker - Move heavy computations off main thread
declare const self: Worker;

interface AnalyticsTask {
  id: string;
  type: 'processUserActivity' | 'calculateStats' | 'processRecommendations';
  data: any;
}

interface AnalyticsResult {
  id: string;
  result: any;
  error?: string;
}

// Analytics computation functions
const processUserActivity = (activityData: any[]) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = activityData.filter(
      activity => new Date(activity.created_at) >= thirtyDaysAgo
    );

    const totalActivities = recentActivity.length;
    const uniqueDays = new Set(
      recentActivity.map(activity => 
        new Date(activity.created_at).toDateString()
      )
    ).size;

    const averagePerDay = uniqueDays > 0 ? totalActivities / uniqueDays : 0;

    return {
      totalActivities,
      uniqueDays,
      averagePerDay: Math.round(averagePerDay * 100) / 100
    };
  } catch (error) {
    throw new Error(`Failed to process user activity: ${error}`);
  }
};

const calculateContentStats = (contentData: any[]) => {
  try {
    const animeCount = contentData.filter(item => item.media_type === 'anime').length;
    const mangaCount = contentData.filter(item => item.media_type === 'manga').length;
    
    const completedItems = contentData.filter(
      item => item.status_id === 'completed'
    ).length;
    
    const totalItems = contentData.length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return {
      animeCount,
      mangaCount,
      totalItems,
      completedItems,
      completionRate: Math.round(completionRate * 100) / 100
    };
  } catch (error) {
    throw new Error(`Failed to calculate content stats: ${error}`);
  }
};

const processRecommendations = (userData: any[], contentData: any[]) => {
  try {
    // Analyze user preferences based on their list
    const genreFrequency: Record<string, number> = {};
    
    userData.forEach(item => {
      if (item.genres) {
        item.genres.forEach((genre: string) => {
          genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    return {
      totalRecommendations: contentData.length,
      topRecommendedGenres: topGenres,
      clickThroughRate: Math.random() * 0.3 + 0.1 // Simulated for now
    };
  } catch (error) {
    throw new Error(`Failed to process recommendations: ${error}`);
  }
};

// Main message handler
self.onmessage = (event: MessageEvent<AnalyticsTask>) => {
  const { id, type, data } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'processUserActivity':
        result = processUserActivity(data);
        break;
      case 'calculateStats':
        result = calculateContentStats(data);
        break;
      case 'processRecommendations':
        result = processRecommendations(data.userData, data.contentData);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    const response: AnalyticsResult = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: AnalyticsResult = { 
      id, 
      result: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    self.postMessage(response);
  }
};

export {};