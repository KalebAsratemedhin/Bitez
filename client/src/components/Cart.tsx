"use client";
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { increment, decrement } from "@/redux/cartSlice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/lib/utils";

const Cart = () => {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart.items);
  const totalPrice = Object.values(cart).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );
  const itemCount = Object.values(cart).length;

  const handleGoToCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full border-stone-200 h-9 w-9 shrink-0"
          aria-label={itemCount ? `Cart (${itemCount} items)` : "Cart"}
        >
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-semibold text-white px-1">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-stone-200 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-stone-200 px-6 py-4 text-left">
          <SheetTitle className="font-display text-xl font-bold text-stone-800 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[var(--brand)]" />
            Your cart
          </SheetTitle>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
            <div className="rounded-full bg-stone-100 p-4">
              <ShoppingCart className="h-10 w-10 text-stone-400" />
            </div>
            <p className="text-center text-stone-500 text-sm">Your cart is empty.</p>
            <p className="text-center text-stone-400 text-xs max-w-[200px]">
              Add items from a restaurant menu to get started.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <ul className="space-y-4">
                {Object.values(cart).map(({ item, quantity }) => (
                  <li key={item._id} className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {item.itemPicture ? (
                        <img
                          src={getImageUrl(item.itemPicture)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-800 truncate">{item.name}</p>
                      <p className="text-sm text-stone-500">ETB {item.price.toFixed(2)} each</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-stone-200"
                          onClick={() => dispatch(decrement(item._id))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-[1.5rem] text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full border-stone-200"
                          onClick={() => dispatch(increment(item._id))}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-stone-800">
                      ETB {(item.price * quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <div className="border-t border-stone-200 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-display text-lg font-bold text-stone-800">
                  ETB {totalPrice.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-medium"
                onClick={handleGoToCheckout}
              >
                Proceed to checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
