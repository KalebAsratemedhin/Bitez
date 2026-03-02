"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "./InputField";
import Link from "next/link";
import { useSigninMutation } from "@/redux/api/authApi";
import Snackbar from "./Snackbar";
import LoadingSpinner from "./LoadingSpinner";


const signinSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

type SigninFormValues = yup.InferType<typeof signinSchema>;

const SigninForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormValues>({
    resolver: yupResolver(signinSchema),
  });
  const [signin, { isError, isLoading, error, isSuccess }] = useSigninMutation();
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const onSubmit = async (data: SigninFormValues) => {
    try {
      const response = await signin(data).unwrap();
      const token = response?.token;
      const user = response?.user;
      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Error signing in";
      setSnackbar({ message: msg || "Error signing in", type: "error" });
    }
  };

  useEffect(() => {
    if (isError) {
      setSnackbar({
        message: (error as { data?: { error?: string } })?.data?.error ?? "Error signing in",
        type: "error",
      });
    }
    if (isSuccess) {
      setSnackbar({ message: "Signed in", type: "success" });
      window.location.href = `/dashboard`;
    }
  }, [isError, isSuccess, error]);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">
        Sign in
      </h2>
      <p className="text-stone-600 text-sm mb-8">
        Use your account to continue.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password?.message}
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold py-3 px-4 transition"
          >
            Sign in
          </button>
        )}

        <p className="text-center text-stone-600 text-sm">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--brand)] hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-center text-stone-500 text-xs">
          By signing in, you agree to our{" "}
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

export default SigninForm;
