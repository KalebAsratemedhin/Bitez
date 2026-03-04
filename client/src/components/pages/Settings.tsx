"use client";

import React, { useState, useEffect } from "react";
import {
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useSendOTPMutation,
  useVerifyEmailMutation,
} from "@/redux/api/authApi";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User, Lock, Mail, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

const profileSchema = yup.object({
  name: yup.string().max(50, "Name cannot exceed 50 characters").required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phoneNumber: yup
    .string()
    .matches(
      /^(?:(?:\+251|251|0)?9\d{8}|(?:\+251|251|0)?1[1-9]\d{6})$/,
      "Enter a valid Ethiopian phone number"
    )
    .required("Phone number is required"),
  address: yup.string().required("Address is required"),
});

const passwordSchema = yup.object({
  oldPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(6, "At least 6 characters")
    .required("New password is required"),
});

export default function SettingsPage() {
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUserQuery();
  const [updateUserProfile] = useUpdateUserProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const [sendOTP, { isLoading: isSendingOTP }] = useSendOTPMutation();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();

  const [image, setImage] = useState<File | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");

  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
  });
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const { register: regProfile, handleSubmit: handleProfileSubmit, setValue, formState: { errors: profileErrors } } = profileForm;
  const { register: regPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = passwordForm;

  useEffect(() => {
    if (user) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("phoneNumber", user.phoneNumber ?? "");
      setValue("address", user.address ?? "");
    }
  }, [user, setValue]);

  const onProfileSubmit = async (data: yup.InferType<typeof profileSchema>) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("address", data.address);
    if (image) formData.append("profilePicture", image);
    try {
      await updateUserProfile(formData).unwrap();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data: yup.InferType<typeof passwordSchema>) => {
    try {
      await changePassword(data).unwrap();
      toast.success("Password changed");
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data
        ? String((err.data as { message: unknown }).message)
        : "Failed to change password";
      toast.error(msg);
    }
  };

  const handleSendOTP = async () => {
    try {
      await sendOTP().unwrap();
      toast.success("Verification email sent");
      setOtpDialogOpen(true);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data
        ? String((err.data as { message: unknown }).message)
        : "Failed to send email";
      toast.error(msg);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      await verifyEmail({ otp }).unwrap();
      toast.success("Email verified");
      setEmailVerified(true);
      setOtpDialogOpen(false);
    } catch {
      toast.error("Invalid or expired code");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      toast.success("Account deleted");
      localStorage.clear();
      window.location.href = "/";
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data
        ? String((err.data as { message: unknown }).message)
        : "Failed to delete account";
      toast.error(msg);
    }
  };

  const isDeliveryPerson = user?.role === "delivery_person";
  const deliveryRating = user?.deliveryPersonRating ?? 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Manage your profile and account.
        </h1>
      </div>

      <Tabs defaultValue="profile" className="w-full max-w-2xl">
        <TabsList className="w-full grid grid-cols-3 h-11 rounded-xl bg-stone-100 p-1">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
      <Card className="border-stone-200 overflow-hidden">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-display text-lg text-stone-900">Profile</CardTitle>
              <CardDescription>Your name, contact info, and photo.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingUser ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden text-stone-600 shrink-0">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-display font-semibold">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <Label className="text-xs text-stone-500 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => e.target.files?.[0] && setImage(e.target.files[0])}
                    />
                    Change photo
                  </Label>
                </div>
                <div className="flex-1 space-y-4 min-w-0 max-w-md">
                  <div>
                    <Label htmlFor="name" className="text-stone-700">Name</Label>
                    <Input id="name" className="mt-1.5" {...regProfile("name")} />
                    {profileErrors.name && (
                      <p className="text-sm text-red-600 mt-1">{profileErrors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-stone-700">Email</Label>
                    <Input id="email" type="email" className="mt-1.5 bg-stone-50" {...regProfile("email")} disabled />
                    {profileErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{profileErrors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="text-stone-700">Phone</Label>
                    <Input id="phoneNumber" className="mt-1.5" {...regProfile("phoneNumber")} />
                    {profileErrors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">{profileErrors.phoneNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-stone-700">Address</Label>
                    <Input id="address" className="mt-1.5" {...regProfile("address")} />
                    {profileErrors.address && (
                      <p className="text-sm text-red-600 mt-1">{profileErrors.address.message}</p>
                    )}
                  </div>
                  {isDeliveryPerson && (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-amber-800">
                          Your rating: {typeof deliveryRating === "number" ? deliveryRating.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="rounded-xl">Save profile</Button>
            </form>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
      <Card className="border-stone-200 overflow-hidden">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-600">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-display text-lg text-stone-900">Security</CardTitle>
              <CardDescription>Password and email verification.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <p className="text-sm font-medium text-stone-700">Change password</p>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="oldPassword" className="text-stone-600">Current password</Label>
                <Input id="oldPassword" type="password" className="mt-1.5" {...regPassword("oldPassword")} />
                {passwordErrors.oldPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.oldPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-stone-600">New password</Label>
                <Input id="newPassword" type="password" className="mt-1.5" {...regPassword("newPassword")} />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isChangingPassword} className="rounded-xl">
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </div>
          </form>

          <div className="border-t border-stone-100 pt-6">
            <p className="text-sm font-medium text-stone-700 mb-2">Email verification</p>
            <Button
              variant="outline"
              onClick={handleSendOTP}
              disabled={isSendingOTP || emailVerified}
              className="rounded-xl gap-2"
            >
              {isSendingOTP ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {emailVerified ? "Email verified" : "Send verification email"}
            </Button>
          </div>

          <AlertDialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enter the code sent to your email</AlertDialogTitle>
              </AlertDialogHeader>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="font-mono text-center text-lg"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleVerifyOTP} disabled={isVerifying}>
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
      <Card className="border-red-100 overflow-hidden">
        <CardHeader className="border-b border-red-100 bg-red-50/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-display text-lg text-stone-900">Delete account</CardTitle>
              <CardDescription>Permanently remove your account and data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <p className="text-sm text-stone-500">
                  This cannot be undone. All your data will be removed.
                </p>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
