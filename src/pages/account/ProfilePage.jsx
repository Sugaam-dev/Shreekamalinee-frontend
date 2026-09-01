import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { profileSchema, setPasswordSchema } from "../../schemas/authSchemas.js";
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useSetPasswordMutation,
} from "../../queries/useAuthQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import AccountLayout from "../../components/layout/AccountLayout.jsx";
import Button from "../../components/common/Button.jsx";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter.jsx";
import useSEO from "../../hooks/useSEO.js";

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { showToast } = useCart();
  const { data: serverProfile } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const setPasswordMutation = useSetPasswordMutation();

  useSEO({
    title: "My Profile — Shreekamalinee",
    description: "Manage your personal profile and account credentials.",
  });

  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [passwordServerError, setPasswordServerError] = useState("");

  const activeProfile = serverProfile || user || {};

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    control: profileControl,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: activeProfile.firstName || "",
      lastName: activeProfile.lastName || "",
      phone: activeProfile.phone || activeProfile.phoneNumber || "+91",
    },
  });

  // Password Update Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(setPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPasswordVal = watchPassword("newPassword") || "";

  // Sync profile form when server data arrives — use stable primitives as deps to avoid infinite loops
  const activeEmail = activeProfile?.email;
  const activeFirstName = activeProfile?.firstName;
  useEffect(() => {
    if (activeProfile && (activeProfile.firstName || activeProfile.email)) {
      resetProfile({
        firstName: activeProfile.firstName || "",
        lastName: activeProfile.lastName || "",
        phone: activeProfile.phone || activeProfile.phoneNumber || "+91",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmail, activeFirstName, resetProfile]);

  const onProfileSubmit = async (data) => {
    setServerError("");
    setSuccessMessage("");
    try {
      const cleanPhone = data.phone.replace(/[\s-]/g, "");
      await updateProfileMutation.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: cleanPhone,
      });

      await refetchUser();
      setSuccessMessage("Profile details updated successfully!");
      showToast("Profile details updated successfully!", "success");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update profile details. Please try again.";
      setServerError(msg);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordServerError("");
    setPasswordSuccessMessage("");
    try {
      await setPasswordMutation.mutateAsync({
        newPassword: data.newPassword,
      });

      setPasswordSuccessMessage("Account password updated successfully!");
      showToast("Account password updated successfully!", "success");
      resetPasswordForm();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update password. Please check complexity requirements.";
      setPasswordServerError(msg);
    }
  };

  return (
    <AccountLayout
      title="Personal Profile & Credentials"
      subtitle="Update your contact details for smooth order processing and seamless courier dispatch"
    >
      <div className="max-w-2xl space-y-10">
        {/* Profile Edit Form */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
              <User size={16} className="text-rust" />
              <span>Contact & Personal Details</span>
            </h2>
            {isProfileDirty && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-xs">
                Unsaved edits
              </span>
            )}
          </div>

          {serverError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  First Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                  <input
                    type="text"
                    {...registerProfile("firstName")}
                    placeholder="Enter first name"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                      profileErrors.firstName ? "border-rose-500" : "border-line focus:border-rust"
                    }`}
                  />
                </div>
                {profileErrors.firstName && (
                  <span className="text-[11px] text-rose-600 mt-1 block">
                    {profileErrors.firstName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                  Last Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                  <input
                    type="text"
                    {...registerProfile("lastName")}
                    placeholder="Enter last name"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                      profileErrors.lastName ? "border-rose-500" : "border-line focus:border-rust"
                    }`}
                  />
                </div>
                {profileErrors.lastName && (
                  <span className="text-[11px] text-rose-600 mt-1 block">
                    {profileErrors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Registered Email Address (Immutable / Verified Badge) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase font-bold tracking-wider text-charcoal">
                  Registered Email Address
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Verified Account</span>
                </span>
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                <input
                  type="email"
                  readOnly
                  disabled
                  value={activeProfile.email || ""}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-200 bg-gray-50/80 text-charcoal/70 rounded-xs font-mono select-none cursor-not-allowed"
                />
              </div>
              <span className="text-[11px] text-charcoal/50 mt-1 block">
                Primary email address cannot be changed directly to maintain order history security.
              </span>
            </div>

            {/* Phone Number with International Flag Selector */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1.5">
                Mobile Contact Number *
              </label>
              <Controller
                name="phone"
                control={profileControl}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="in"
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full text-xs"
                    inputClassName="!w-full !py-2.5 !px-3.5 !text-xs !bg-white !border-line !rounded-r-xs !font-medium !text-charcoal focus:!border-rust"
                    countrySelectorStyleProps={{
                      buttonClassName: "!bg-gray-50 !border-line !rounded-l-xs !px-2.5",
                    }}
                  />
                )}
              />
              {profileErrors.phone && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {profileErrors.phone.message}
                </span>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateProfileMutation.isPending}
                icon={Save}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Security & Password Reset Section */}
        <section className="border border-line rounded-sm p-6 bg-cream-2/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                <KeyRound size={16} className="text-rust" />
                <span>Account Security & Password</span>
              </h3>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Manage your login credentials or set a new password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
              className="text-xs font-bold text-rust hover:underline flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 border border-line rounded-xs shadow-xs"
            >
              <span>{passwordSectionOpen ? "Hide Form" : "Change Password"}</span>
              {passwordSectionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {passwordSectionOpen && (
            <div className="pt-4 border-t border-line mt-4 space-y-5">
              {passwordServerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{passwordServerError}</span>
                </div>
              )}

              {passwordSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{passwordSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                    New Secure Password *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...registerPassword("newPassword")}
                      placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                      className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                        passwordErrors.newPassword ? "border-rose-500" : "border-line focus:border-rust"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPasswordVal} />
                  {passwordErrors.newPassword && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {passwordErrors.newPassword.message}
                    </span>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...registerPassword("confirmNewPassword")}
                      placeholder="Re-type new password"
                      className={`w-full pl-10 pr-10 py-2.5 text-xs border rounded-xs outline-none bg-white font-medium ${
                        passwordErrors.confirmNewPassword ? "border-rose-500" : "border-line focus:border-rust"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {passwordErrors.confirmNewPassword.message}
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={setPasswordMutation.isPending}
                    icon={Lock}
                  >
                    Save New Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </AccountLayout>
  );
}
