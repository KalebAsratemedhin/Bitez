"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetRestaurantByIdQuery } from "@/redux/api/restaurantApi";
import UpdateRestaurantForm from "@/components/UpdateRestaurantForm";
import { Loader2 } from "lucide-react";

const EditRestaurantPage = () => {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { data, isLoading, error } = useGetRestaurantByIdQuery(id!, {
    skip: !id,
  });

  if (!id) {
    router.replace("/restaurants");
    return null;
  }
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }
  if (error || !data?.data) {
    return (
      <div className="p-6 text-center text-stone-600">
        Restaurant not found or you don’t have permission to edit it.
      </div>
    );
  }

  return (
    <UpdateRestaurantForm
      restaurant={data.data}
      onClose={() => {}}
      asPage
    />
  );
};

export default EditRestaurantPage;
