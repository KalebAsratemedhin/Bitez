import { useAddRestaurantMutation } from "@/redux/api/restaurantApi";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "sonner";
import { useState, useEffect } from "react";
import L from "leaflet";
import LeafletMap from "@/components/LeafletMap";

const restaurantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  deliveryAreaRadius: z.coerce.number().min(1, "Radius must be greater than 0"),
});

type FormData = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryAreaRadius: number;
};

const CreateRestaurantForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(restaurantSchema) as Resolver<FormData>,
  });

  const [addRestaurant, { isLoading }] = useAddRestaurantMutation();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("address", data.address);
      formData.append("latitude", String(data.latitude));
      formData.append("longitude", String(data.longitude));
      formData.append("deliveryAreaRadius", String(data.deliveryAreaRadius));
      if (logoFile) formData.append("logo", logoFile);

      await addRestaurant(formData).unwrap();

      toast.success("Restaurant created successfully");
      reset();
      setPosition(null);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Something went wrong");
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";
  const errorClass = "text-[var(--brand)] text-sm mt-1";

  return (
    <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-6 max-w-2xl">
      <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">
        New restaurant
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Restaurant name
          </label>
          <input
            {...register("name")}
            placeholder="e.g. Enat Kitchen"
            className={inputClass}
          />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Address
          </label>
          <input
            {...register("address")}
            placeholder="Street, city"
            className={inputClass}
          />
          {errors.address && (
            <p className={errorClass}>{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Logo
          </label>
          <input
            type="file"
            accept="image/*"
            className={inputClass}
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          {logoPreview && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-24 w-24 rounded-xl object-cover border border-stone-200"
              />
              {logoFile && (
                <p className="text-sm text-stone-500">{logoFile.name}</p>
              )}
            </div>
          )}
        </div>

        <LeafletMap
          center={
            position
              ? { lat: position.lat, lng: position.lng }
              : { lat: 9.678112707591637, lng: 39.532579779624946 }
          }
          zoom={position ? 14 : 8}
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
          deliveryRadius={watch("deliveryAreaRadius") ?? 5000}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Latitude
            </label>
            <input
              {...register("latitude")}
              type="number"
              step="any"
              placeholder="9.678"
              className={inputClass}
            />
            {errors.latitude && (
              <p className={errorClass}>{errors.latitude.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Longitude
            </label>
            <input
              {...register("longitude")}
              type="number"
              step="any"
              placeholder="39.532"
              className={inputClass}
            />
            {errors.longitude && (
              <p className={errorClass}>{errors.longitude.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Delivery area radius (meters)
          </label>
          <input
            {...register("deliveryAreaRadius")}
            type="number"
            step="any"
            placeholder="5000"
            className={inputClass}
          />
          {errors.deliveryAreaRadius && (
            <p className={errorClass}>
              {errors.deliveryAreaRadius.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-3 px-4 transition disabled:opacity-60"
        >
          {isLoading ? "Creating…" : "Create restaurant"}
        </button>
      </form>
      <Toaster />
    </div>
  );
};

export default CreateRestaurantForm;
