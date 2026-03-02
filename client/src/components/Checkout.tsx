"use client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LeafletMap from "@/components/LeafletMap";
import { Minus, Plus, MapPin, ShoppingBag } from "lucide-react";
import { decrement, increment } from "@/redux/cartSlice";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateOrderMutation } from "@/redux/api/orderApi";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { clearCart } from "@/redux/cartSlice";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/lib/utils";

export const checkoutSchema = z.object({
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

type CheckoutFormValues = {
  deliveryAddress: string;
  coordinates: { lat: number; lng: number };
};

const DEFAULT_COORDS = { lat: 9.03, lng: 38.74 };

const Checkout = () => {
  const cart = useSelector((state: RootState) => state.cart.items);
  const restaurantID = useSelector((state: RootState) => state.cart.restaurantId);
  const dispatch = useDispatch();
  const router = useRouter();

  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as Resolver<CheckoutFormValues>,
    defaultValues: {
      deliveryAddress: "",
      coordinates: DEFAULT_COORDS,
    } as CheckoutFormValues,
  });

  const total = Object.values(cart).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );
  const coords = watch("coordinates");

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!restaurantID) {
      toast.warning("Your cart is empty.");
      return;
    }
    const orderPayload = {
      ...data,
      deliveryAddress: data.deliveryAddress.trim(),
      orderDetails: Object.values(cart),
      totalAmount: total,
      restaurantID,
    };
    try {
      const res = await createOrder(orderPayload).unwrap();
      if (res.success) {
        dispatch(clearCart());
        toast.success("Order placed successfully!");
        router.push("/orders");
      }
    } catch {
      toast.error("Failed to place order.");
    }
  };

  if (Object.keys(cart).length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="rounded-full bg-stone-100 p-6 inline-flex mb-4">
          <ShoppingBag className="h-12 w-12 text-stone-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">Your cart is empty</h2>
        <p className="text-stone-600 mb-6">Add items from a restaurant before checkout.</p>
        <Button asChild className="rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)]">
          <a href="/restaurants">Browse restaurants</a>
        </Button>
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-stone-800 mb-2">Checkout</h1>
        <p className="text-stone-600 mb-8">Confirm your delivery details and place your order.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-stone-200 overflow-hidden">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="font-display text-lg font-semibold text-stone-800">
                Order summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[280px]">
                <ul className="divide-y divide-stone-100 p-4">
                  {Object.values(cart).map(({ item, quantity }) => (
                    <li key={item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {item.itemPicture ? (
                          <img
                            src={getImageUrl(item.itemPicture)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-stone-800">{item.name}</p>
                        <p className="text-sm text-stone-500">ETB {item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => dispatch(decrement(item._id))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-[1.5rem] text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => dispatch(increment(item._id))}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="w-16 text-right text-sm font-semibold text-stone-800">
                        ETB {(item.price * quantity).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              <div className="border-t border-stone-100 px-4 py-4 flex justify-between items-center bg-stone-50/50">
                <span className="font-medium text-stone-700">Total</span>
                <span className="font-display text-xl font-bold text-stone-800">
                  ETB {total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader className="border-b border-stone-100">
              <CardTitle className="font-display text-lg font-semibold text-stone-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[var(--brand)]" />
                Delivery details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="text-stone-700">
                  Delivery address
                </Label>
                <Input
                  id="deliveryAddress"
                  placeholder="Street, area, city..."
                  className="rounded-xl border-stone-200"
                  {...register("deliveryAddress")}
                />
                {errors.deliveryAddress && (
                  <p className="text-sm text-red-600">{errors.deliveryAddress.message}</p>
                )}
                <p className="text-xs text-stone-500">
                  Enter the address where you want your order delivered.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-stone-700">Pick location on map</Label>
                <p className="text-sm text-stone-500">
                  Click on the map to set your delivery location.
                </p>
                <div className="rounded-xl overflow-hidden border border-stone-200 h-64">
                  <LeafletMap
                    center={coords ? { lat: coords.lat, lng: coords.lng } : DEFAULT_COORDS}
                    zoom={coords ? 14 : 10}
                    height={256}
                    className="h-full w-full"
                    onLocationSelect={(lat, lng) => setValue("coordinates", { lat, lng })}
                    selectedPosition={coords ? { lat: coords.lat, lng: coords.lng } : null}
                  />
                </div>
                {errors.coordinates && (
                  <p className="text-sm text-red-600">{errors.coordinates.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-end sm:items-center pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium px-8"
            >
              {isLoading ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </>
  );
};

export default Checkout;
