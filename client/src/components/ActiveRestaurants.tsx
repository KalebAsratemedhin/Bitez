"use client";
import { useState } from "react";
import { useGetActiveRestaurantsQuery } from "@/redux/api/restaurantApi";
import { Loader2, Star, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

const ActiveRestaurants = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data, isLoading, error, isFetching } = useGetActiveRestaurantsQuery(
    { page, limit, search, rating: ratingFilter },
    { refetchOnMountOrArgChange: true }
  );

  const totalCount = data?.totalCount ?? 0;
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil(totalCount / limit));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(input);
    setPage(1);
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="text-stone-500 text-sm">Loading restaurants…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-6 rounded-2xl border border-red-200 bg-red-50/50">
        <p className="text-red-600 font-medium">Failed to load restaurants.</p>
        <p className="text-red-500 text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="flex-1 flex flex-col space-y-10">
      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <form
          onSubmit={handleSearch}
          className="flex gap-2 w-full sm:max-w-md"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
              aria-hidden
            />
            <Input
              placeholder="Search by name..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 h-11 rounded-full border-stone-200 bg-white shadow-sm focus-visible:ring-[var(--brand)]"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="rounded-full h-11 px-6 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white shrink-0"
          >
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-stone-500 hidden sm:inline">Rating:</span>
          <Select
            value={ratingFilter}
            onValueChange={(v) => {
              setRatingFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] rounded-full border-stone-200 bg-white shadow-sm h-11">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5+ stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="2">2+ stars</SelectItem>
              <SelectItem value="1">1+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {data && data.data.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
          <p className="text-stone-600 font-medium">No restaurants found</p>
          <p className="text-stone-500 text-sm mt-1">
            Try a different search or filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-1 content-start">
            {data?.data.map((restaurant) => (
              <Link
                key={restaurant._id}
                href={`/restaurants/${restaurant._id}`}
                className="group block"
              >
                <article className="h-full rounded-2xl overflow-hidden bg-white border border-stone-200/80 shadow-sm hover:shadow-xl hover:border-stone-300/80 transition-all duration-300">
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    {restaurant.logo ? (
                      <img
                        src={getImageUrl(restaurant.logo)}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-stone-400 text-sm">
                        No image
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 shadow-sm">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-stone-800">
                          {restaurant.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-xl font-bold text-stone-800 group-hover:text-[var(--brand)] transition-colors line-clamp-1">
                      {restaurant.name}
                    </h2>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-stone-500 line-clamp-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      {typeof restaurant.location === "string"
                        ? restaurant.location
                        : restaurant.location?.address ?? "—"}
                    </p>
                    <span className="mt-4 flex items-center justify-center w-full rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-medium py-2.5 px-4 transition-colors">
                      View & order
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </>
      )}
      </div>

      {data && data.data.length > 0 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          limitOptions={PAGE_SIZE_OPTIONS}
          onLimitChange={(v) => {
            setLimit(v);
            setPage(1);
          }}
          className="flex-row"
        />
      )}
    </div>
  );
};

export default ActiveRestaurants;
