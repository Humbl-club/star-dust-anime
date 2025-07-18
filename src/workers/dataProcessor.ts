// Data Processing Worker - Handle large dataset transformations
declare const self: Worker;

interface ProcessingTask {
  id: string;
  type: 'filterAndSort' | 'transformData' | 'calculateMetrics';
  data: any;
  options?: any;
}

interface ProcessingResult {
  id: string;
  result: any;
  error?: string;
}

// Filter and sort functions
const filterAndSort = (data: any[], options: any) => {
  try {
    let filtered = [...data];

    // Apply filters
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchLower) ||
        item.title_english?.toLowerCase().includes(searchLower) ||
        item.title_japanese?.toLowerCase().includes(searchLower)
      );
    }

    if (options.genre) {
      filtered = filtered.filter(item => 
        item.genres?.some((genre: any) => 
          genre.name === options.genre
        )
      );
    }

    if (options.status) {
      filtered = filtered.filter(item => 
        item.anime_details?.status === options.status ||
        item.manga_details?.status === options.status
      );
    }

    if (options.year) {
      filtered = filtered.filter(item => item.year === parseInt(options.year));
    }

    // Apply sorting
    if (options.sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[options.sortBy];
        let bVal = b[options.sortBy];

        if (options.sortBy === 'score') {
          aVal = aVal || 0;
          bVal = bVal || 0;
        }

        if (options.order === 'desc') {
          return bVal - aVal;
        }
        return aVal - bVal;
      });
    }

    return {
      data: filtered,
      total: filtered.length,
      hasMore: false
    };
  } catch (error) {
    throw new Error(`Failed to filter and sort: ${error}`);
  }
};

const transformData = (data: any[], transformType: string) => {
  try {
    switch (transformType) {
      case 'trending':
        return data.map(item => ({
          ...item,
          trendingScore: calculateTrendingScore(item),
          isCurrentlyAiring: checkCurrentlyAiring(item)
        }));
      
      case 'recommendations':
        return data.map(item => ({
          ...item,
          recommendationScore: calculateRecommendationScore(item)
        }));
      
      default:
        return data;
    }
  } catch (error) {
    throw new Error(`Failed to transform data: ${error}`);
  }
};

const calculateTrendingScore = (item: any) => {
  const popularityWeight = 0.4;
  const scoreWeight = 0.3;
  const recentWeight = 0.3;

  const popularity = item.popularity || 0;
  const score = item.score || 0;
  const isRecent = checkIsRecent(item);

  return (popularity * popularityWeight) + 
         (score * scoreWeight) + 
         (isRecent ? 100 * recentWeight : 0);
};

const calculateRecommendationScore = (item: any) => {
  // Simple recommendation scoring based on popularity and rating
  const popularity = item.popularity || 0;
  const score = item.score || 0;
  return (popularity * 0.6) + (score * 0.4);
};

const checkCurrentlyAiring = (item: any) => {
  if (!item.anime_details?.aired_to) return false;
  return new Date(item.anime_details.aired_to) > new Date();
};

const checkIsRecent = (item: any) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const startDate = item.anime_details?.aired_from || item.manga_details?.published_from;
  return startDate ? new Date(startDate) >= sixMonthsAgo : false;
};

const calculateMetrics = (data: any[]) => {
  try {
    const total = data.length;
    const avgScore = data.reduce((sum, item) => sum + (item.score || 0), 0) / total;
    const genreDistribution: Record<string, number> = {};
    
    data.forEach(item => {
      if (item.genres) {
        item.genres.forEach((genre: any) => {
          const genreName = genre.name || genre;
          genreDistribution[genreName] = (genreDistribution[genreName] || 0) + 1;
        });
      }
    });

    return {
      total,
      averageScore: Math.round(avgScore * 100) / 100,
      genreDistribution,
      topGenres: Object.entries(genreDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([genre, count]) => ({ genre, count }))
    };
  } catch (error) {
    throw new Error(`Failed to calculate metrics: ${error}`);
  }
};

// Main message handler
self.onmessage = (event: MessageEvent<ProcessingTask>) => {
  const { id, type, data, options } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'filterAndSort':
        result = filterAndSort(data, options || {});
        break;
      case 'transformData':
        result = transformData(data, options?.transformType || 'default');
        break;
      case 'calculateMetrics':
        result = calculateMetrics(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    const response: ProcessingResult = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: ProcessingResult = { 
      id, 
      result: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    self.postMessage(response);
  }
};

export {};