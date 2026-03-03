"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const result: (number | "ellipsis")[] = [1];
  const low = Math.max(2, currentPage - 1);
  const high = Math.min(totalPages - 1, currentPage + 1);
  if (low > 2) result.push("ellipsis");
  for (let i = low; i <= high; i++) {
    if (!result.includes(i)) result.push(i);
  }
  if (high < totalPages - 1) result.push("ellipsis");
  if (totalPages > 1) result.push(totalPages);
  return result;
}

export type PaginationBarProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  limitOptions: readonly number[];
  onLimitChange: (limit: number) => void;
  className?: string;
};

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  limit,
  limitOptions,
  onLimitChange,
  className,
}: PaginationBarProps) {
  const safeTotal = Math.max(1, totalPages);
  const pageNumbers = getPageNumbers(page, safeTotal);

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4",
        "bg-[var(--surface-warm)] border-t border-stone-200/60"
      )}
    >
      <div
        className={cn(
          "flex flex-nowrap items-center justify-between gap-4 w-full",
          className
        )}
      >
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-stone-500 whitespace-nowrap">Per page</span>
        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="w-[72px] h-9 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-auto shrink-0">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || safeTotal <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          {pageNumbers.map((n, i) =>
            n === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <span className="flex h-9 w-9 items-center justify-center text-stone-400 px-1">
                  …
                </span>
              </PaginationItem>
            ) : (
              <PaginationItem key={n}>
                <Button
                  variant={page === n ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-full text-sm font-medium",
                    page === n && "bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
                  )}
                  onClick={() => onPageChange(n)}
                  aria-label={`Page ${n}`}
                  aria-current={page === n ? "page" : undefined}
                >
                  {n}
                </Button>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => onPageChange(Math.min(safeTotal, page + 1))}
              disabled={page >= safeTotal}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      </div>
    </div>
  );
}
