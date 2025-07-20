import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdvancedFiltering } from '@/components/features/AdvancedFiltering';
import { useSearchStore } from '@/store';
import { Search, X } from 'lucide-react';

interface SearchWithFiltersProps {
  contentType: 'anime' | 'manga';
  availableGenres: string[];
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchWithFilters({
  contentType,
  availableGenres,
  onSearch,
  placeholder = "Search..."
}: SearchWithFiltersProps) {
  const { query, setQuery, clearSearch } = useSearchStore();
  const [localQuery, setLocalQuery] = useState(query);

  const handleSearch = () => {
    setQuery(localQuery);
    onSearch?.(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-10"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <Button onClick={handleSearch} className="shrink-0">
        <Search className="w-4 h-4" />
      </Button>
      
      <AdvancedFiltering
        contentType={contentType}
        availableGenres={availableGenres}
      />
    </div>
  );
}