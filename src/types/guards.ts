// Type Guards for Runtime Type Safety

import { Anime, Manga } from '@/data/animeData';
import { AnimeDetailData, MangaDetailData } from './hooks';
import { AnalyticsData } from './api';

// Basic Type Guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

export function isNumberArray(value: unknown): value is number[] {
  return isArray(value) && value.every(isNumber);
}

// Content Type Guards
export function isAnime(item: unknown): item is Anime {
  if (!isObject(item)) return false;
  
  return (
    isString(item.title) &&
    (item.id === undefined || isString(item.id)) &&
    (item.anilist_id === undefined || isNumber(item.anilist_id)) &&
    (item.synopsis === undefined || isString(item.synopsis)) &&
    (item.image_url === undefined || isString(item.image_url)) &&
    (item.score === undefined || isNumber(item.score)) &&
    (item.year === undefined || isNumber(item.year)) &&
    (item.episodes === undefined || isNumber(item.episodes))
  );
}

export function isManga(item: unknown): item is Manga {
  if (!isObject(item)) return false;
  
  return (
    isString(item.title) &&
    (item.id === undefined || isString(item.id)) &&
    (item.anilist_id === undefined || isNumber(item.anilist_id)) &&
    (item.synopsis === undefined || isString(item.synopsis)) &&
    (item.image_url === undefined || isString(item.image_url)) &&
    (item.score === undefined || isNumber(item.score)) &&
    (item.year === undefined || isNumber(item.year)) &&
    (item.chapters === undefined || isNumber(item.chapters)) &&
    (item.volumes === undefined || isNumber(item.volumes))
  );
}

export function isAnimeDetail(item: unknown): item is AnimeDetailData {
  if (!isObject(item)) return false;
  
  return (
    isString(item.id) &&
    isNumber(item.anilist_id) &&
    isString(item.title) &&
    isString(item.status) &&
    isString(item.type) &&
    isString(item.last_sync_check) &&
    isStringArray(item.genres) &&
    isStringArray(item.studios) &&
    (item.title_english === undefined || isString(item.title_english)) &&
    (item.episodes === undefined || isNumber(item.episodes))
  );
}

export function isMangaDetail(item: unknown): item is MangaDetailData {
  if (!isObject(item)) return false;
  
  return (
    isString(item.id) &&
    isNumber(item.anilist_id) &&
    isString(item.title) &&
    isString(item.status) &&
    isString(item.type) &&
    isString(item.last_sync_check) &&
    isStringArray(item.genres) &&
    isStringArray(item.authors) &&
    (item.title_english === undefined || isString(item.title_english)) &&
    (item.chapters === undefined || isNumber(item.chapters)) &&
    (item.volumes === undefined || isNumber(item.volumes))
  );
}

// API Response Guards
export function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is { data: T[]; pagination: object; filters: object } {
  if (!isObject(value)) return false;
  
  const hasData = 'data' in value && isArray(value.data);
  const hasPagination = 'pagination' in value && isObject(value.pagination);
  const hasFilters = 'filters' in value && isObject(value.filters);
  
  if (!hasData || !hasPagination || !hasFilters) return false;
  
  // Type assertion after we've verified it's an array
  const dataArray = value.data as unknown[];
  return dataArray.every(dataGuard);
}

export function isAnimeApiResponse(value: unknown): value is { data: Anime[]; pagination: object; filters: object } {
  return isApiResponse(value, isAnime);
}

export function isMangaApiResponse(value: unknown): value is { data: Manga[]; pagination: object; filters: object } {
  return isApiResponse(value, isManga);
}

// Analytics Data Guards
export function isAnalyticsData(value: unknown): value is AnalyticsData {
  if (!isObject(value)) return false;
  
  return (
    'userActivity' in value &&
    isObject(value.userActivity) &&
    'contentStats' in value &&
    isObject(value.contentStats) &&
    'searchAnalytics' in value &&
    isObject(value.searchAnalytics) &&
    'recommendations' in value &&
    isObject(value.recommendations)
  );
}

// Error Guards
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isSupabaseError(value: unknown): value is { message: string; details?: string; hint?: string; code?: string } {
  if (!isObject(value)) return false;
  
  return (
    'message' in value &&
    isString(value.message) &&
    (value.details === undefined || isString(value.details)) &&
    (value.hint === undefined || isString(value.hint)) &&
    (value.code === undefined || isString(value.code))
  );
}

// Form Data Guards
export function isFormData(value: unknown): value is FormData {
  return value instanceof FormData;
}

// Date Guards
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isValidDateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return isDate(date);
}

// URL Guards
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Email Guards
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// UUID Guards
export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Status Guards
export function isAnimeStatus(value: unknown): value is 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' {
  return isString(value) && ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'].includes(value);
}

export function isMangaStatus(value: unknown): value is 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read' {
  return isString(value) && ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'].includes(value);
}

// Content Type Guards
export function isContentType(value: unknown): value is 'anime' | 'manga' {
  return isString(value) && (value === 'anime' || value === 'manga');
}

// Safe Parsing with Guards
export function safeParseJSON<T>(
  json: string,
  guard: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Runtime Type Assertion
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(errorMessage || 'Type assertion failed');
  }
}

// Safe Property Access
export function safeGet<T>(
  obj: unknown,
  path: string[],
  guard: (value: unknown) => value is T
): T | undefined {
  let current = obj;
  
  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  
  return guard(current) ? current : undefined;
}