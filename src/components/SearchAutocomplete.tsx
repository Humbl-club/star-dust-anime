import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchSuggestions } from '@/hooks/useOptimizedSearch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { LazyImage } from '@/components/ui/lazy-image';

interface SearchSuggestion {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  year?: number;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchAutocomplete({ 
  placeholder = "Search anime or manga...", 
  onSearch,
  className 
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const navigate = useNavigate();
  
  const { data: suggestions = [], isLoading } = useSearchSuggestions(debouncedQuery);

  const handleSelect = (item: SearchSuggestion) => {
    setOpen(false);
    setQuery('');
    onSearch?.(item.title);
    
    // Navigate to detail page (assume anime for now, could be improved)
    navigate(`/anime/${item.id}`);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setOpen(value.length >= 2);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            onFocus={() => query.length >= 2 && setOpen(true)}
          />
        </PopoverTrigger>
        {open && (
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandList>
                {isLoading && (
                  <div className="p-4 text-center">
                    <div className="animate-pulse">Searching...</div>
                  </div>
                )}
                {!isLoading && suggestions.length === 0 && query.length >= 2 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}
                {suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((item) => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          {item.image_url && (
                            <LazyImage
                              src={item.image_url}
                              alt={item.title}
                              className="w-8 h-12 rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.title_english || item.title}
                            </p>
                            {item.year && (
                              <p className="text-sm text-muted-foreground">
                                {item.year}
                              </p>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}