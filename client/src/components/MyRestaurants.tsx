import { useState } from "react";
import {
  useGetAllMineRestaurantQuery,
  useDeleteRestaurantMutation,
} from "@/redux/api/restaurantApi";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Trash } from "lucide-react";
import { toast, Toaster } from "sonner";
import UpdateRestaurantForm from "@/components/UpdateRestaurantForm";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { cn, getImageUrl } from "@/lib/utils";

const LIMIT = 6;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  disapproved: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
};

const MyRestaurants = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useGetAllMineRestaurantQuery({
    page,
    limit: LIMIT,
  });

  const totalPages = data?.totalPages || 1;

  const [deleteRestaurant] = useDeleteRestaurantMutation();
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(
    null
  );
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(
    null
  );

  const handleDelete = async () => {
    if (!restaurantToDelete) return;
    try {
      await deleteRestaurant(restaurantToDelete).unwrap();
      toast.success("Restaurant deleted successfully");
      setIsConfirmDeleteOpen(false);
      setRestaurantToDelete(null);
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; message?: string } };
      toast.error(e?.data?.error || e?.data?.message || "Failed to delete restaurant");
    }
  };

 
  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-8 text-center">
        <p className="text-stone-600">Failed to load your restaurants.</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-8 text-center">
        <p className="text-stone-600">You haven’t created any restaurants yet.</p>
      </div>
    );
  }

  const locationDisplay =
  (r: (typeof data.data)[0]) =>
  typeof r.location === "string"
    ? r.location
    : (r.location as { address?: string })?.address ?? "—";


  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((restaurant) => (
          <div
            key={restaurant._id}
            className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden"
          >
            <div className="h-36 w-full bg-stone-100 flex items-center justify-center overflow-hidden">
              {restaurant.logo ? (
                <img
                  src={getImageUrl(restaurant.logo)}
                  alt={`${restaurant.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-stone-400 text-sm">No logo</span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-display font-semibold text-stone-800">
                  {restaurant.name}
                </h3>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-lg font-medium capitalize",
                    statusColors[restaurant.status] ?? "bg-stone-100 text-stone-700"
                  )}
                >
                  {restaurant.status}
                </span>
              </div>
              <p className="text-sm text-stone-600">
                {locationDisplay(restaurant)}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRestaurant(restaurant);
                    setIsUpdateDialogOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  <Edit size={14} />
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRestaurantToDelete(restaurant._id);
                    setIsConfirmDeleteOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-50 transition"
        >
          Previous
        </button>
        <span className="text-sm text-stone-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-50 transition"
        >
          Next
        </button>
      </div>

      {isUpdateDialogOpen && selectedRestaurant && (
        <UpdateRestaurantForm
          restaurant={selectedRestaurant}
          onClose={() => setIsUpdateDialogOpen(false)}
        />
      )}

      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="rounded-2xl border-stone-200">
          <h2 className="font-display text-xl font-semibold text-stone-800 mb-2">
            Confirm deletion
          </h2>
          <p className="text-stone-600 text-sm">
            Are you sure you want to delete this restaurant?
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default MyRestaurants;
