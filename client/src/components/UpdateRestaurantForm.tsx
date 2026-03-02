"use client";
import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import LeafletMap from "@/components/LeafletMap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useUpdateRestaurantMutation, useGetRestaurantByIdQuery } from "@/redux/api/restaurantApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEFAULT_CENTER = { lat: 9.678112707591637, lng: 39.532579779624946 };

const updateRestaurantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  deliveryAreaRadius: z.coerce.number().min(1, "Radius must be greater than 0"),
});

type UpdateFormData = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryAreaRadius: number;
};
interface UpdateRestaurantFormProps {
  restaurant: any;
  onClose: () => void;
  asPage?: boolean;
}

function getFormDefaults(restaurant: any): UpdateFormData {
  const address =
    typeof restaurant.location === "string"
      ? restaurant.location
      : (restaurant.location?.address ?? "");
      
  const coords =
    typeof restaurant.location === "object" && restaurant.location?.coordinates;

  const latFromCoords =
    Array.isArray(coords) && coords.length >= 2 ? Number(coords[1]) : null;

  const lngFromCoords =
    Array.isArray(coords) && coords.length >= 2 ? Number(coords[0]) : null;

  const latFromTop =
    restaurant.latitude != null && Number.isFinite(Number(restaurant.latitude))
      ? Number(restaurant.latitude)
      : null;

  const lngFromTop =
    restaurant.longitude != null && Number.isFinite(Number(restaurant.longitude))
      ? Number(restaurant.longitude)
      : null;

  const lat = latFromCoords ?? latFromTop ?? 0;
  const lng = lngFromCoords ?? lngFromTop ?? 0;
  return {
    name: restaurant.name ?? "",
    address,
    latitude: lat,
    longitude: lng,
    deliveryAreaRadius: Number(restaurant.deliveryAreaRadius) || 5000,
  };
}

const UpdateRestaurantForm = ({
  restaurant: restaurantProp,
  onClose,
  asPage = false,
}: UpdateRestaurantFormProps) => {
  const {
    data: restaurantByIdResponse,
    isLoading: isLoadingRestaurant,
  } = useGetRestaurantByIdQuery(restaurantProp?._id ?? "", {
    skip: !restaurantProp?._id || asPage,
  });
  const restaurantById = restaurantByIdResponse?.data;
  const dialogWaitingForData =
    !asPage && !!restaurantProp?._id && (isLoadingRestaurant || !restaurantById);
  const restaurant = asPage
    ? restaurantProp
    : (restaurantById ?? restaurantProp);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateRestaurantSchema) as Resolver<UpdateFormData>,
    defaultValues: {
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
      deliveryAreaRadius: 5000,
    },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const deliveryAreaRadius = watch("deliveryAreaRadius");

  const router = useRouter();
  const [updateRestaurant, { isLoading }] = useUpdateRestaurantMutation();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    if (!asPage && restaurantProp) {
      console.log("[UpdateRestaurantForm] Restaurant selected for edit:", restaurantProp);
    }
  }, [asPage, restaurantProp]);

  useEffect(() => {
    if (!asPage && restaurantProp?._id) setFormReady(false);
  }, [asPage, restaurantProp?._id]);

  useEffect(() => {
    if (!restaurant) return;
    if (!asPage && !restaurantById) return;
    const defaults = getFormDefaults(restaurant);
    reset(defaults);
    setLogoPreview(restaurant.logo ? getImageUrl(restaurant.logo) : null);
    setLogoFile(null);
    const hasCoords =
      typeof defaults.latitude === "number" &&
      typeof defaults.longitude === "number" &&
      (defaults.latitude !== 0 || defaults.longitude !== 0);
    setPosition(
      hasCoords ? L.latLng(defaults.latitude, defaults.longitude) : null
    );
    if (!asPage) setFormReady(true);
  }, [restaurant, reset, asPage, restaurantById]);

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      (latitude !== 0 || longitude !== 0)
    ) {
      setPosition(L.latLng(latitude, longitude));
    }
  }, [latitude, longitude]);

  const mapCenter =
    position
      ? { lat: position.lat, lng: position.lng }
      : latitude !== 0 || longitude !== 0
        ? { lat: latitude, lng: longitude }
        : DEFAULT_CENTER;

  const onSubmit = async (data: UpdateFormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("address", data.address);
      formData.append("latitude", data.latitude.toString());
      formData.append("longitude", data.longitude.toString());
      formData.append("deliveryAreaRadius", data.deliveryAreaRadius.toString());

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await updateRestaurant({
        id: restaurant._id,
        data: formData as any,
      }).unwrap();
      toast.success("Restaurant updated successfully");
      if (asPage) router.push(`/restaurants/${restaurant._id}`);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update restaurant");
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 mt-4 max-w-md"
    >
      <Input {...register("name")} placeholder="Restaurant Name" />
      {errors.name && (
        <p className="text-red-500 text-sm">{errors.name.message}</p>
      )}

      <Input {...register("address")} placeholder="Address" />
      {errors.address && (
        <p className="text-red-500 text-sm">{errors.address.message}</p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
            }
          }}
          className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {logoPreview && (
          <img
            src={logoPreview}
            alt="Logo preview"
            className="mt-2 h-24 w-24 rounded-xl object-cover border border-stone-200"
          />
        )}
        <p className="text-xs text-stone-500 mt-1">Leave empty to keep current logo</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Location (click map to set)
        </label>
        <LeafletMap
          center={mapCenter}
          zoom={position || latitude !== 0 || longitude !== 0 ? 14 : 8}
          height={320}
          className="rounded-xl overflow-hidden border border-stone-200"
          onLocationSelect={(lat, lng) => {
            setPosition(L.latLng(lat, lng));
            setValue("latitude", lat);
            setValue("longitude", lng);
          }}
          selectedPosition={
            position ? { lat: position.lat, lng: position.lng } : null
          }
          deliveryRadius={deliveryAreaRadius}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Latitude
          </label>
          <Input
            {...register("latitude")}
            type="number"
            step="any"
            placeholder="e.g. 9.678"
          />
          {errors.latitude && (
            <p className="text-red-500 text-sm">
              {errors.latitude.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Longitude
          </label>
          <Input
            {...register("longitude")}
            type="number"
            step="any"
            placeholder="e.g. 39.532"
          />
          {errors.longitude && (
            <p className="text-red-500 text-sm">
              {errors.longitude.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Delivery area radius (meters)
        </label>
        <Input
          {...register("deliveryAreaRadius")}
          type="number"
          step="any"
          placeholder="5000"
        />
        {errors.deliveryAreaRadius && (
          <p className="text-red-500 text-sm">
            {errors.deliveryAreaRadius.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Restaurant"}
        </Button>
        {asPage ? (
          <Button type="button" variant="outline" asChild>
            <Link href={`/restaurants/${restaurant._id}`}>Cancel</Link>
          </Button>
        ) : (
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        )}
      </div>
    </form>
  );

  if (asPage) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Edit restaurant</h1>
        <p className="text-stone-600 text-sm mb-6">{restaurant.name}</p>
        {formContent}
        <Toaster />
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>Update Restaurant</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6 min-h-0 flex-1">
          {dialogWaitingForData || (!asPage && !formReady) ? (
            <div className="flex items-center justify-center py-12 text-stone-500">
              Loading restaurant…
            </div>
          ) : (
            formContent
          )}
        </div>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
};

export default UpdateRestaurantForm;
