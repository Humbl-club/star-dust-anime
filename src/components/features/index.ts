import { lazy } from 'react';

// Heavy components - lazy load
export const ContentGrid = lazy(() => import('./ContentGrid').then(m => ({ default: m.ContentGrid })));
export const AdvancedFiltering = lazy(() => import('./AdvancedFiltering').then(m => ({ default: m.AdvancedFiltering })));
export const AnalyticsCharts = lazy(() => import('./AnalyticsCharts').then(m => ({ default: m.AnalyticsCharts })));

// Light components - direct import
export { AnimeCard } from './AnimeCard';
export { AddToListButton } from './AddToListButton';
export { AgeVerificationModal } from './AgeVerificationModal';