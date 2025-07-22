import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationContentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationContent({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = "" 
}: PaginationContentProps) {
  const maxVisible = 5;
  
  // Calculate which pages to show
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-2 mt-8 ${className}`}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="glass-card border-border/50"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>
      
      {/* First page if not visible */}
      {start > 1 && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(1)}
            className="glass-card border-border/50"
          >
            1
          </Button>
          {start > 2 && <span className="text-muted-foreground">...</span>}
        </>
      )}
      
      {/* Page numbers */}
      {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={page === currentPage 
            ? "bg-gradient-primary text-primary-foreground glow-primary" 
            : "glass-card border-border/50"
          }
        >
          {page}
        </Button>
      ))}
      
      {/* Last page if not visible */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-muted-foreground">...</span>}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(totalPages)}
            className="glass-card border-border/50"
          >
            {totalPages}
          </Button>
        </>
      )}
      
      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="glass-card border-border/50"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}