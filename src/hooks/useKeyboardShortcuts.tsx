import { useHotkeys } from 'react-hotkeys-hook';
import { useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSearch?: () => void;
  onToggleView?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onQuickAdd?: () => void;
  onRefresh?: () => void;
  onToggleFilters?: () => void;
  enabledScopes?: string[];
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    onSearch,
    onToggleView,
    onSelectAll,
    onClearSelection,
    onQuickAdd,
    onRefresh,
    onToggleFilters,
    enabledScopes = ['lists']
  } = config;

  // Search focus
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    onSearch?.();
  }, { scopes: enabledScopes });

  // Toggle list view
  useHotkeys('v', () => {
    onToggleView?.();
  }, { scopes: enabledScopes });

  // Select all items
  useHotkeys('ctrl+a, cmd+a', (e) => {
    e.preventDefault();
    onSelectAll?.();
  }, { scopes: enabledScopes });

  // Clear selection
  useHotkeys('escape', () => {
    onClearSelection?.();
  }, { scopes: enabledScopes });

  // Quick add
  useHotkeys('ctrl+enter, cmd+enter', (e) => {
    e.preventDefault();
    onQuickAdd?.();
  }, { scopes: enabledScopes });

  // Refresh
  useHotkeys('f5, ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    onRefresh?.();
  }, { scopes: enabledScopes });

  // Toggle filters
  useHotkeys('f', () => {
    onToggleFilters?.();
  }, { scopes: enabledScopes });

  return {
    shortcuts: [
      { key: 'Ctrl+K', description: 'Focus search' },
      { key: 'V', description: 'Toggle view' },
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Esc', description: 'Clear selection' },
      { key: 'Ctrl+Enter', description: 'Quick add' },
      { key: 'F5', description: 'Refresh' },
      { key: 'F', description: 'Toggle filters' },
    ]
  };
};