// Export all services
export * from './baseService';
export * from './animeService';
export * from './mangaService';
export * from './userService';
export * from './searchService';

// Re-export service instances for easy importing
export { animeService } from './animeService';
export { mangaService } from './mangaService';
export { userService } from './userService';
export { searchService } from './searchService';