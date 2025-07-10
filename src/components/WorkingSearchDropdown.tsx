import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConsolidatedSearch } from "@/hooks/useConsolidatedSearch";
import { SearchInput, SearchResults } from "@/components/search";
import { cn } from "@/lib/utils";

interface WorkingSearchDropdownProps {
  className?: string;
  placeholder?: string;
  onResultClick?: () => void;
}

export const WorkingSearchDropdown = ({ 
  className, 
  placeholder = "Search anime...",
  onResultClick 
}: WorkingSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  const { query, isSearching, searchResults, handleInputChange, clearSearch } = useConsolidatedSearch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange_ = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange(value);
    setIsOpen(value.length >= 2 || searchResults.length > 0);
  };

  const handleResultClick = (anime: any) => {
    console.log('🎯 Clicked on anime:', anime.title);
    navigate(`/anime/${anime.id}`);
    setIsOpen(false);
    clearSearch();
    inputRef.current?.blur();
    onResultClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearch();
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.textContent = '';
      inputRef.current.focus();
    }
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  const showDropdown = isOpen && (query.length >= 2 || searchResults.length > 0);

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <SearchInput
        ref={inputRef}
        placeholder={placeholder}
        query={query}
        isSearching={isSearching}
        onInputChange={handleInputChange_}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        onClearSearch={handleClearSearch}
      />

      {/* Dropdown Results */}
      {showDropdown && (
        <SearchResults
          query={query}
          isSearching={isSearching}
          searchResults={searchResults}
          onResultClick={handleResultClick}
          onBackdropClick={handleBackdropClick}
        />
      )}
    </div>
  );
};