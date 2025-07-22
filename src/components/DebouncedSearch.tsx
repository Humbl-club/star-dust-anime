import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function DebouncedSearch({ 
  onSearch, 
  placeholder = "Search...", 
  delay = 300,
  className = ""
}: DebouncedSearchProps) {
  const [query, setQuery] = useState('');

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, delay),
    [onSearch, delay]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={handleSearchChange}
        className="pl-10 glass-input"
      />
    </div>
  );
}