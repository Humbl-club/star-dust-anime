// Centralized query key factory for consistent cache management
export const queryKeys = {
  // Content queries
  content: {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (type: string, filters: Record<string, unknown>) => 
      [...queryKeys.content.lists(), type, filters] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (type: string, id: string) => 
      [...queryKeys.content.details(), type, id] as const,
  },
  
  // User queries
  user: {
    all: ['user'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
    preferences: (id: string) => [...queryKeys.user.all, 'preferences', id] as const,
    gamification: (id: string) => [...queryKeys.user.all, 'gamification', id] as const,
    initialization: (id: string) => [...queryKeys.user.all, 'initialization', id] as const,
  },
  
  // Search queries
  search: {
    all: ['search'] as const,
    global: (query: string, type?: string) => 
      [...queryKeys.search.all, 'global', query, type] as const,
    suggestions: (query: string) => 
      [...queryKeys.search.all, 'suggestions', query] as const,
  },
  
  // Filler data
  filler: {
    all: ['filler'] as const,
    byTitle: (title: string) => [...queryKeys.filler.all, title] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateContent = (queryClient: any, type?: string) => {
  if (type) {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.content.lists(),
      predicate: (query: any) => query.queryKey[2] === type 
    });
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
  }
};

export const invalidateUser = (queryClient: any, userId?: string) => {
  if (userId) {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.user.all,
      predicate: (query: any) => query.queryKey.includes(userId)
    });
  } else {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  }
};

export const invalidateSearch = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
};