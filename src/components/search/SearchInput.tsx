import { forwardRef } from "react";
import { Search, Loader2, X } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  query: string;
  isSearching: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClearSearch: (e: React.MouseEvent) => void;
}

export const SearchInput = forwardRef<HTMLDivElement, SearchInputProps>(
  ({ placeholder, query, isSearching, onInputChange, onFocus, onKeyDown, onClearSearch }, ref) => {
    return (
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 group-focus-within:text-primary transition-colors" />
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={(e) => {
            const value = e.currentTarget.textContent || '';
            onInputChange({ target: { value } } as any);
          }}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          data-placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.3), inset 0 1px 0 hsl(255 255 255 / 0.1)',
            background: 'hsl(220 20% 8% / 0.6)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1rem',
            padding: '0 3rem',
            height: '3.5rem',
            fontSize: '1.125rem',
            lineHeight: '3.5rem',
            color: 'hsl(210 40% 98%)',
            width: '100%',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            minHeight: '3.5rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
          className="search-editable"
        />
        {/* Loading or Clear button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : query.length > 0 ? (
            <button
              onClick={onClearSearch}
              className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors spring-bounce rounded-full hover:bg-muted/30 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";