"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ViewersPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ViewersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8 animate-in fade-in duration-300">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-border hover:border-violet-500/50 hover:bg-violet-500/10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            // Show first, last, current, and pages around current
            return page === 1 
              || page === totalPages 
              || Math.abs(page - currentPage) <= 1;
          })
          .map((page, index, arr) => {
            // Add ellipsis if there's a gap
            const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
            
            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsisBefore && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={currentPage === page 
                    ? "bg-violet-600 text-white hover:bg-violet-700" 
                    : "border-border hover:border-violet-500/50 hover:bg-violet-500/10"
                  }
                >
                  {page}
                </Button>
              </div>
            );
          })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-border hover:border-violet-500/50 hover:bg-violet-500/10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

