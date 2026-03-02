"use client";
import { useState } from "react";
import { useGetAllMineRestaurantQuery, useDeleteRestaurantMutation } from "@/redux/api/restaurantApi";
import CreateRestaurantForm from "@/components/CreateRestaurantForm";
import RestaurantMenus from "@/components/RestaurantMenus";
import UpdateRestaurantForm from "@/components/UpdateRestaurantForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Loader2, PlusCircle, UtensilsCrossed, Edit, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  disapproved: "bg-red-100 text-red-800",
  inactive: "bg-stone-100 text-stone-600",
};

const locationDisplay = (r: { location?: string | { address?: string } }) =>
  typeof r.location === "string"
    ? r.location
    : (r.location as { address?: string })?.address ?? "—";

type View = "create" | string; // "create" or restaurant id

const RestaurantManagement = () => {
  const [view, setView] = useState<View>("create");
  const [page, setPage] = useState(1);
  const { data: restaurantsData, isLoading: isLoadingList } = useGetAllMineRestaurantQuery({
    page,
    limit: 50,
  });
  const [updateRestaurant, setUpdateRestaurant] = useState<any | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteRestaurant, { isLoading: isDeleting }] = useDeleteRestaurantMutation();

  const restaurants = restaurantsData?.data ?? [];
  const selectedRestaurant = view !== "create" ? restaurants.find((r) => r._id === view) : null;
  const totalPages = restaurantsData?.totalPages ?? 1;

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteRestaurant(deleteTargetId).unwrap();
      toast.success("Restaurant deleted");
      setDeleteTargetId(null);
      setView("create");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; message?: string } };
      toast.error(e?.data?.error || e?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--surface-warm)" }}>
      {/* Left: master list */}
      <aside className="lg:w-72 shrink-0 flex flex-col gap-4">
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setView("create")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 text-left transition",
              view === "create"
                ? "bg-[var(--brand)] text-white font-semibold"
                : "text-stone-700 hover:bg-stone-50"
            )}
          >
            <PlusCircle className="h-5 w-5 shrink-0" />
            <span>New restaurant</span>
            {view === "create" && <ChevronRight className="h-4 w-4 ml-auto" />}
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden flex flex-col min-h-0">
          <h2 className="px-4 py-3 text-sm font-semibold text-stone-500 uppercase tracking-wide border-b border-stone-100">
            Your restaurants
          </h2>
          <div className="flex-1 min-h-0 overflow-auto">
            {isLoadingList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : restaurants.length === 0 ? (
              <p className="px-4 py-6 text-sm text-stone-500 text-center">
                No restaurants yet. Create one to get started.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {restaurants.map((r) => (
                  <li key={r._id}>
                    <button
                      type="button"
                      onClick={() => setView(r._id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition",
                        view === r._id ? "bg-[var(--brand)]/10 text-[var(--brand)] font-medium" : "hover:bg-stone-50 text-stone-800"
                      )}
                    >
                      {r.logo ? (
                        <img
                          src={getImageUrl(r.logo)}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-stone-200 flex items-center justify-center">
                          <UtensilsCrossed className="h-4 w-4 text-stone-400" />
                        </div>
                      )}
                      <span className="truncate flex-1 font-medium">{r.name}</span>
                      <span
                        className={cn(
                          "shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                          statusColors[r.status] ?? "bg-stone-100 text-stone-600"
                        )}
                      >
                        {r.status}
                      </span>
                      {view === r._id && <ChevronRight className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2 border-t border-stone-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="text-xs text-stone-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Right: detail */}
      <main className="flex-1 min-w-0">
        {view === "create" ? (
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold text-stone-800 mb-1">
              Add a restaurant
            </h1>
            <p className="text-stone-600 text-sm mb-6">
              Set name, address, and delivery area to list your place.
            </p>
            <CreateRestaurantForm />
          </div>
        ) : selectedRestaurant ? (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex items-start gap-4">
                  {selectedRestaurant.logo ? (
                    <img
                      src={getImageUrl(selectedRestaurant.logo)}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-stone-200 flex items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-stone-400" />
                    </div>
                  )}
                  <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl font-bold text-stone-800 truncate">
                      {selectedRestaurant.name}
                    </h1>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0",
                        statusColors[selectedRestaurant.status] ?? "bg-stone-100 text-stone-600"
                      )}
                    >
                      {selectedRestaurant.status}
                    </span>
                  </div>
                  <p className="text-stone-600 mt-1 flex items-center gap-1.5">
                    <span className="truncate">{locationDisplay(selectedRestaurant)}</span>
                  </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setUpdateRestaurant(selectedRestaurant)}
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteTargetId(selectedRestaurant._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-800 mb-4">
                <UtensilsCrossed className="h-5 w-5 text-[var(--brand)]" />
                Menus
              </h2>
              <RestaurantMenus initialRestaurantId={selectedRestaurant._id} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-12 text-center">
            <p className="text-stone-500">Select a restaurant or create a new one.</p>
          </div>
        )}
      </main>

      {updateRestaurant && (
        <UpdateRestaurantForm
          restaurant={updateRestaurant}
          onClose={() => setUpdateRestaurant(null)}
        />
      )}

      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="rounded-2xl border-stone-200">
          <h2 className="font-display text-xl font-semibold text-stone-800">
            Delete restaurant?
          </h2>
          <p className="text-stone-600 text-sm">
            This cannot be undone. All menus for this restaurant will be affected.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantManagement;
