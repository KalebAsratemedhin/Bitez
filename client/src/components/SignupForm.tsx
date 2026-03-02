"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "./InputField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignupMutation } from "@/redux/api/authApi";
import Snackbar from "./Snackbar";
import LoadingSpinner from "./LoadingSpinner";
import { cn } from "@/lib/utils";


const signupSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phoneNumber: yup
    .string()
    .matches(/^\d+$/, "Phone must be digits only")
    .min(10, "Phone must be at least 10 digits")
    .required("Phone is required"),
  address: yup.string().required("Address is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  role: yup
    .string()
    .oneOf(["restaurant_owner", "delivery_person", "customer"], "Please choose a role")
    .required("Role is required"),
});

type SignupFormValues = yup.InferType<typeof signupSchema>;

const ROLES = [
  {
    value: "customer",
    label: "Customer",
    description: "Order food from restaurants and get it delivered.",
  },
  {
    value: "restaurant_owner",
    label: "Restaurant owner",
    description: "List your restaurant and manage orders and menus.",
  },
  {
    value: "delivery_person",
    label: "Delivery person",
    description: "Deliver orders and earn on the go.",
  },
] as const;

const SignupForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
    defaultValues: { role: "customer" },
  });

  const router = useRouter();
  const [signup, { isError, isLoading }] = useSignupMutation();
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await signup(data).unwrap();
      const token = response?.token;
      const user = response?.user;
      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        router.replace("/dashboard");
      } else {
        setSnackbar({ message: "Invalid response from server", type: "error" });
      }
    } catch (err: unknown) {
      const rtq = err as { status?: number; data?: unknown };
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : err instanceof Error
            ? err.message
            : "Error signing up";
      setSnackbar({ message: msg || "Error signing up", type: "error" });
    }
  };

  useEffect(() => {
    if (isError) {
      setSnackbar({ message: "Error signing up", type: "error" });
    }
  }, [isError]);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">
        Sign up
      </h2>
      <p className="text-stone-600 text-sm mb-4">
        Create an account to start ordering.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <InputField
          label="Full name"
          name="name"
          register={register}
          error={errors.name?.message}
          compact
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
          compact
        />
        <InputField
          label="Phone number"
          name="phoneNumber"
          register={register}
          error={errors.phoneNumber?.message}
          compact
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address?.message}
          compact
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password?.message}
          compact
        />

        <div>
          <span className="block text-sm font-medium text-stone-700 mb-2">
            I am a
          </span>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => field.onChange(r.value)}
                    className={cn(
                      "w-full text-left rounded-lg border-2 py-2.5 px-3 transition-all duration-200",
                      field.value === r.value
                        ? "border-[var(--brand)] bg-[var(--brand)]/5"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold block",
                        field.value === r.value ? "text-[var(--brand)]" : "text-stone-800"
                      )}
                    >
                      {r.label}
                    </span>
                    <span className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                      {r.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.role && (
            <p className="text-[var(--brand)] text-xs mt-2">{errors.role.message}</p>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-2.5 text-sm transition"
          >
            Create account
          </button>
        )}

        <p className="text-center text-stone-600 text-xs pt-0.5">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-[var(--brand)] hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-stone-500 text-[11px] leading-tight">
          By signing up, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-stone-700">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-stone-700">
            Privacy
          </a>
          .
        </p>
      </form>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar(null)}
        />
      )}
    </div>
  );
};

export default SignupForm;
