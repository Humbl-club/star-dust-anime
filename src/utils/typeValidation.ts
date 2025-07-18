// Type validation utilities for runtime type safety
import { isAnimeContent, isMangaContent, isAnimeApiResponse, isMangaApiResponse } from '@/types/guards';
import { AnimeContent, MangaContent } from '@/types/api';

/**
 * Validates API response data before using it in components
 */
export function validateApiResponse<T>(
  data: unknown, 
  contentType: 'anime' | 'manga'
): data is T[] {
  if (!Array.isArray(data)) {
    console.warn('API response is not an array:', data);
    return false;
  }

  if (contentType === 'anime') {
    return data.every(isAnimeContent);
  } else {
    return data.every(isMangaContent);
  }
}

/**
 * Safely casts content with runtime validation
 */
export function safeContentCast(
  item: unknown, 
  expectedType: 'anime'
): item is AnimeContent;
export function safeContentCast(
  item: unknown, 
  expectedType: 'manga'
): item is MangaContent;
export function safeContentCast(
  item: unknown, 
  expectedType: 'anime' | 'manga'
): item is AnimeContent | MangaContent {
  if (expectedType === 'anime') {
    return isAnimeContent(item);
  } else {
    return isMangaContent(item);
  }
}

/**
 * Type-safe array filter for content
 */
export function filterValidContent<T extends 'anime' | 'manga'>(
  items: unknown[], 
  contentType: T
): T extends 'anime' ? AnimeContent[] : MangaContent[] {
  if (contentType === 'anime') {
    return items.filter(isAnimeContent) as T extends 'anime' ? AnimeContent[] : MangaContent[];
  } else {
    return items.filter(isMangaContent) as T extends 'anime' ? AnimeContent[] : MangaContent[];
  }
}

/**
 * Validates and transforms database response
 */
export function validateDatabaseResponse(
  response: unknown,
  contentType: 'anime' | 'manga'
): (AnimeContent | MangaContent)[] {
  if (!Array.isArray(response)) {
    console.warn('Database response is not an array, returning empty array');
    return [];
  }

  if (contentType === 'anime') {
    return response.filter(isAnimeContent);
  } else {
    return response.filter(isMangaContent);
  }
}

/**
 * Runtime assertion with helpful error messages
 */
export function assertContentType<T extends 'anime' | 'manga'>(
  item: unknown,
  expectedType: T,
  context?: string
): asserts item is T extends 'anime' ? AnimeContent : MangaContent {
  const isValid = expectedType === 'anime' ? isAnimeContent(item) : isMangaContent(item);
  
  if (!isValid) {
    const contextMsg = context ? ` in ${context}` : '';
    throw new Error(`Expected ${expectedType} content${contextMsg}, but received invalid data`);
  }
}

/**
 * Safe property access with type checking
 */
export function getAnimeProperty<K extends keyof AnimeContent>(
  item: unknown,
  property: K
): AnimeContent[K] | undefined {
  if (isAnimeContent(item)) {
    return item[property];
  }
  return undefined;
}

export function getMangaProperty<K extends keyof MangaContent>(
  item: unknown,
  property: K
): MangaContent[K] | undefined {
  if (isMangaContent(item)) {
    return item[property];
  }
  return undefined;
}