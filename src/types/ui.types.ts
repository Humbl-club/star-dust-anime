import { ReactNode } from 'react';
import { AnimeContent, MangaContent, FilterOptions, SearchResult, UserProfile } from './api.types';

// Component Props Types

// Layout Props
export interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export interface NavigationProps {
  className?: string;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Content Display Props
export interface ContentCardProps {
  content: AnimeContent | MangaContent;
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface ContentGridProps {
  content: (AnimeContent | MangaContent)[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export interface ContentListProps {
  content: (AnimeContent | MangaContent)[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Search Props
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface SearchResultsProps {
  results: SearchResult;
  loading: boolean;
  query: string;
  onClear: () => void;
  className?: string;
}

export interface SearchSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
  className?: string;
}

// Filter Props
export interface FilterPanelProps {
  filters: Partial<FilterOptions>;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  contentType: 'anime' | 'manga';
  className?: string;
}

export interface AdvancedFilteringProps {
  contentType: 'anime' | 'manga';
  className?: string;
}

export interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

export interface FilterGroupProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

// Form Props
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface MultiSelectProps {
  label: string;
  value: string[];
  options: Array<{ value: string; label: string }>;
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

// Modal Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// User Props
export interface UserProfileProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  className?: string;
}

export interface UserAvatarProps {
  user: UserProfile;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface UserStatsProps {
  userId: string;
  className?: string;
}

// Loading Props
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export interface LoadingStateProps {
  loading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

// Error Props
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: unknown) => void;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

// Pagination Props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  className?: string;
}

// Tooltip Props
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

// Button Props
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Badge Props
export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: ReactNode;
  className?: string;
}

// Card Props
export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

// Dropdown Props
export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// Tab Props
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

// Input Props
export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  className?: string;
}

export interface TextareaProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  error?: string;
  className?: string;
}

// Progress Props
export interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

// Theme Props
export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

// Route Props
export interface RouteParams {
  id?: string;
  slug?: string;
  [key: string]: string | undefined;
}

export interface RouteProps {
  params: RouteParams;
  searchParams: Record<string, string | string[] | undefined>;
}

// Event Handler Types
export type ClickHandler = () => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithClassName<T = Record<string, never>> = T & { className?: string };
export type WithChildren<T = Record<string, never>> = T & { children: ReactNode };