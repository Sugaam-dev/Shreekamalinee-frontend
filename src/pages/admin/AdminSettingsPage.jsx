import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  Building2,
  QrCode,
  Save,
  Upload,
  Phone,
  CheckCircle2,
  Truck,
  Megaphone,
  Mail,
  HelpCircle,
} from "lucide-react";
import {
  shippingSettingsSchema,
  announcementSettingsSchema,
  contactSettingsSchema,
  bankDetailsSchema,
} from "../../schemas/settingsSchemas.js";
import {
  useAdminSettingsQuery,
  useUpdateShippingSettingsMutation,
  useUpdateAnnouncementSettingsMutation,
  useUpdateContactSettingsMutation,
  useUpdateBankDetailsMutation,
  useUploadQrCodeMutation,
} from "../../queries/useSettingsQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import { validateImageFile, ACCEPT_IMAGE_STRING } from "../../utils/fileValidation.js";

export default function AdminSettingsPage() {
  const { showToast } = useCart();
  const { data: storeSettings, isLoading } = useAdminSettingsQuery();

  // Mutations
  const updateShippingMutation = useUpdateShippingSettingsMutation();
  const updateAnnouncementMutation = useUpdateAnnouncementSettingsMutation();
  const updateContactMutation = useUpdateContactSettingsMutation();
  const updateBankMutation = useUpdateBankDetailsMutation();
  const uploadQrMutation = useUploadQrCodeMutation();

  // 1. Shipping Form
  const {
    register: regShipping,
    handleSubmit: handleShippingSubmit,
    reset: resetShipping,
    watch: watchShipping,
    formState: { errors: errorsShipping, isSubmitting: isSubmittingShipping },
  } = useForm({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      freeShippingThreshold: 1499,
      standardShippingFee: 99,
      codHandlingFee: 99,
      freeCodThreshold: 2999,
      isFreeShippingPromoActive: false,
      estimatedDeliveryDaysMin: 3,
      estimatedDeliveryDaysMax: 5,
      deliveryPolicyNotice: "★ A 360° unboxing video showing the sealed parcel and shipping label is strictly mandatory for any return, exchange, or transit damage claim.",
    },
  });

  // 2. Announcement Form
  const {
    register: regAnnouncement,
    handleSubmit: handleAnnouncementSubmit,
    reset: resetAnnouncement,
    watch: watchAnnouncement,
    formState: { errors: errorsAnnouncement, isSubmitting: isSubmittingAnnouncement },
  } = useForm({
    resolver: zodResolver(announcementSettingsSchema),
    defaultValues: {
      isAnnouncementActive: true,
      announcementText: "✨ Festive Handloom Edit Live — Free Express Shipping on Orders Above ₹1,499 ✨",
      announcementLink: "/shop",
    },
  });

  // 3. Contact Form
  const {
    register: regContact,
    control: controlContact,
    handleSubmit: handleContactSubmit,
    reset: resetContact,
    formState: { errors: errorsContact, isSubmitting: isSubmittingContact },
  } = useForm({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: {
      whatsappNumber: "",
      supportEmail: "care@shreekamalinee.com",
      contactAddress: "Shreekamalinee Studio, Atelier Heritage Lane, Varanasi, Uttar Pradesh 221001, India",
      operatingHours: "Monday to Saturday: 10:00 AM – 7:00 PM IST",
    },
  });

  // 4. Banking & Gateways Form
  const {
    register: regBank,
    handleSubmit: handleBankSubmit,
    reset: resetBank,
    watch: watchBank,
    formState: { errors: errorsBank, isSubmitting: isSubmittingBank },
  } = useForm({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      upiId: "",
      isUpiPaymentActive: true,
      isRazorpayPaymentActive: true,
      isCodPaymentActive: true,
      isWhatsappOrderActive: true,
      isActive: true,
    },
  });

  // Sync DB data into forms on load
  useEffect(() => {
    if (storeSettings) {
      resetShipping({
        freeShippingThreshold: storeSettings.freeShippingThreshold ?? 1499,
        standardShippingFee: storeSettings.standardShippingFee ?? 99,
        codHandlingFee: storeSettings.codHandlingFee ?? 99,
        freeCodThreshold: storeSettings.freeCodThreshold ?? 2999,
        isFreeShippingPromoActive: storeSettings.isFreeShippingPromoActive ?? false,
        estimatedDeliveryDaysMin: storeSettings.estimatedDeliveryDaysMin ?? 3,
        estimatedDeliveryDaysMax: storeSettings.estimatedDeliveryDaysMax ?? 5,
        deliveryPolicyNotice:
          storeSettings.deliveryPolicyNotice ||
          "★ A 360° unboxing video showing the sealed parcel and shipping label is strictly mandatory for any return, exchange, or transit damage claim.",
      });

      resetAnnouncement({
        isAnnouncementActive: storeSettings.isAnnouncementActive ?? true,
        announcementText:
          storeSettings.announcementText ||
          "✨ Festive Handloom Edit Live — Free Express Shipping on Orders Above ₹1,499 ✨",
        announcementLink: storeSettings.announcementLink || "/shop",
      });

      resetContact({
        whatsappNumber: storeSettings.whatsappNumber || storeSettings.contactPhone || "",
        supportEmail: storeSettings.supportEmail || storeSettings.contactEmail || "care@shreekamalinee.com",
        contactAddress:
          storeSettings.contactAddress ||
          "Shreekamalinee Studio, Atelier Heritage Lane, Varanasi, Uttar Pradesh 221001, India",
        operatingHours: storeSettings.operatingHours || "Monday to Saturday: 10:00 AM – 7:00 PM IST",
      });

      resetBank({
        accountHolderName: storeSettings.accountHolderName || "",
        accountNumber: storeSettings.accountNumber || "",
        ifscCode: storeSettings.ifscCode || "",
        bankName: storeSettings.bankName || "",
        branchName: storeSettings.branchName || "",
        upiId: storeSettings.upiId || "",
        isUpiPaymentActive: storeSettings.isUpiPaymentActive ?? true,
        isRazorpayPaymentActive: storeSettings.isRazorpayPaymentActive ?? true,
        isCodPaymentActive: storeSettings.isCodPaymentActive ?? true,
        isWhatsappOrderActive: storeSettings.isWhatsappOrderActive ?? true,
        isActive: storeSettings.isActive ?? true,
      });
    }
  }, [storeSettings, resetShipping, resetAnnouncement, resetContact, resetBank]);

  // Submit Handlers
  const onShippingSubmit = async (data) => {
    try {
      await updateShippingMutation.mutateAsync(data);
      showToast("Shipping thresholds and courier fees updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update shipping settings", "warning");
    }
  };

  const onAnnouncementSubmit = async (data) => {
    try {
      await updateAnnouncementMutation.mutateAsync(data);
      showToast("Top offer bar announcement updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update offer announcement", "warning");
    }
  };

  const onContactSubmit = async (data) => {
    try {
      await updateContactMutation.mutateAsync(data);
      showToast("Customer concierge & support channels updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update contact settings", "warning");
    }
  };

  const onBankingSubmit = async (data) => {
    try {
      await updateBankMutation.mutateAsync({
        ...data,
        ifscCode: data.ifscCode.toUpperCase().trim(),
      });
      showToast("Merchant banking credentials updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update bank details", "warning");
    }
  };

  const [localQrPreview, setLocalQrPreview] = useState(null);

  const handleQrUpload = async (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, "warning");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalQrPreview(previewUrl);

    try {
      await uploadQrMutation.mutateAsync(file);
      showToast("Merchant UPI QR Code uploaded and published live!", "success");
    } catch (err) {
      setLocalQrPreview(null);
      showToast(err.response?.data?.message || "Failed to upload QR code", "warning");
    }
  };

  const isFreeShippingPromo = watchShipping("isFreeShippingPromoActive");
  const isAnnouncementActive = watchAnnouncement("isAnnouncementActive");

  const activeQrDisplay = localQrPreview || storeSettings?.qrCodeUrl;

  return (
    <AdminLayout
      title="Store Settings & Configuration"
      subtitle="Independently configure shipping fees, promotional offer bars, support channels, and merchant bank accounts"
    >
      <div className="space-y-8 max-w-4xl">

        {/* 1. Dynamic Shipping & Delivery Configurations */}
        <form onSubmit={handleShippingSubmit(onShippingSubmit)} className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#800020]" />
              <h2 className="font-serif font-bold text-base text-gray-900">
                1. Shipping, Delivery & Handling Fees
              </h2>
            </div>
            <span className="text-[10.5px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              Live on Cart & Checkout
            </span>
          </div>

          {/* Storewide Free Shipping Toggle */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 block text-xs">
                Storewide Free Shipping (Campaign Mode)
              </span>
              <span className="text-[11px] text-gray-600">
                When enabled, all orders receive 100% Free Shipping regardless of cart total.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...regShipping("isFreeShippingPromoActive")}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#800020]"></div>
            </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Free Shipping Minimum Cart (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                disabled={isFreeShippingPromo}
                {...regShipping("freeShippingThreshold")}
                placeholder="1499"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsShipping.freeShippingThreshold ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                } ${isFreeShippingPromo ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Orders &ge; this amount get FREE shipping.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Standard Delivery Fee (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                disabled={isFreeShippingPromo}
                {...regShipping("standardShippingFee")}
                placeholder="99"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsShipping.standardShippingFee ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                } ${isFreeShippingPromo ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Charged when order is below threshold.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                COD Handling Surcharge (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...regShipping("codHandlingFee")}
                placeholder="99"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsShipping.codHandlingFee ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Base fee added for Cash on Delivery.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Free COD Minimum Cart (₹) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                {...regShipping("freeCodThreshold")}
                placeholder="2999"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsShipping.freeCodThreshold ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Orders &ge; this amount get FREE COD (₹0 fee).
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Estimated Delivery Min Days (Turnaround) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                {...regShipping("estimatedDeliveryDaysMin")}
                placeholder="3"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-mono font-bold focus:border-[#800020]"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Minimum business days (e.g. 3 days).
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Estimated Delivery Max Days (Turnaround) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                {...regShipping("estimatedDeliveryDaysMax")}
                placeholder="5"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-mono font-bold focus:border-[#800020]"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Maximum business days (e.g. 5 days) displayed on product & checkout pages.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Delivery & 360° Unboxing Video Policy Notice
              </label>
              <textarea
                rows={2}
                {...regShipping("deliveryPolicyNotice")}
                placeholder="e.g. ★ A 360° unboxing video showing the sealed parcel and shipping label is strictly mandatory for any return, exchange, or transit damage claim."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-medium focus:border-[#800020] resize-none"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Displayed across product details, cart, checkout, and order details pages under the delivery SLA.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={updateShippingMutation.isPending || isSubmittingShipping}
            >
              Save Shipping & Delivery SLA
            </Button>
          </div>
        </form>

        {/* 2. Top Announcement & Offer Bar */}
        <form onSubmit={handleAnnouncementSubmit(onAnnouncementSubmit)} className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-[#800020]" />
              <h2 className="font-serif font-bold text-base text-gray-900">
                2. Top Announcement & Promotional Offer Bar
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <span>{isAnnouncementActive ? "Active" : "Disabled"}</span>
              <input
                type="checkbox"
                {...regAnnouncement("isAnnouncementActive")}
                className="accent-[#800020] cursor-pointer"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
              Announcement Message / Headline *
            </label>
            <input
              type="text"
              {...regAnnouncement("announcementText")}
              placeholder="✨ Festive Handloom Edit Live — Free Express Shipping on Orders Above ₹1,499 ✨"
              className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                errorsAnnouncement.announcementText ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
              }`}
            />
            <span className="text-[10.5px] text-gray-400 mt-1 block">
              Appears at the very top of every page in the header ticker when active.
            </span>
            {errorsAnnouncement.announcementText && (
              <span className="text-[11px] text-rose-600 mt-1 block">
                {errorsAnnouncement.announcementText.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
              Offer Banner Redirect Link
            </label>
            <input
              type="text"
              {...regAnnouncement("announcementLink")}
              placeholder="/shop?category=Sarees"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-mono"
            />
            <span className="text-[10.5px] text-gray-400 mt-1 block">
              Where customers land when clicking the banner (e.g. /shop).
            </span>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={updateAnnouncementMutation.isPending || isSubmittingAnnouncement}
            >
              Save Offer Announcement
            </Button>
          </div>
        </form>

        {/* 3. Customer Concierge & Support Channels */}
        <form onSubmit={handleContactSubmit(onContactSubmit)} className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Phone size={16} className="text-[#800020]" />
            <h2 className="font-serif font-bold text-base text-gray-900">
              3. Customer Support & WhatsApp Channels
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                WhatsApp Concierge Phone (With Country Code)
              </label>
              <Controller
                name="whatsappNumber"
                control={controlContact}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="in"
                    value={field.value || ""}
                    onChange={field.onChange}
                    className="w-full text-xs"
                    inputClassName={`!w-full !py-2 !px-3 !text-xs !bg-white !rounded-r-xs !font-mono !text-gray-900 focus:!border-[#800020] border ${
                      errorsContact.whatsappNumber ? "!border-rose-500" : "!border-gray-300"
                    }`}
                    countrySelectorStyleProps={{
                      buttonClassName: "!bg-gray-50 !border-gray-300 !rounded-l-xs !px-2.5",
                    }}
                  />
                )}
              />
              <span className="text-[10.5px] text-gray-400 mt-1 block">
                Direct WhatsApp contact button for VIP buyers (includes country code flag).
              </span>
              {errorsContact.whatsappNumber && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsContact.whatsappNumber.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Customer Concierge Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...regContact("supportEmail")}
                  placeholder="care@shreekamalinee.com"
                  className={`w-full pl-8 pr-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                    errorsContact.supportEmail ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                  }`}
                />
                <Mail size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              </div>
              <span className="text-[10.5px] text-gray-400 mt-1 block">
                Official store support email for patron inquiries.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Studio / Atelier Physical Address
              </label>
              <input
                type="text"
                {...regContact("contactAddress")}
                placeholder="Shreekamalinee Studio, Varanasi, UP, India"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-medium focus:border-[#800020]"
              />
              <span className="text-[10.5px] text-gray-400 mt-1 block">
                Appears in footer and contact page.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Support Operating Hours
              </label>
              <input
                type="text"
                {...regContact("operatingHours")}
                placeholder="Monday to Saturday: 10:00 AM – 7:00 PM IST"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xs outline-none bg-white font-medium focus:border-[#800020]"
              />
              <span className="text-[10.5px] text-gray-400 mt-1 block">
                Hours of operation shown to patrons.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={updateContactMutation.isPending || isSubmittingContact}
            >
              Save Contact Info
            </Button>
          </div>
        </form>

        {/* 4. Merchant Banking & UPI Credentials */}
        <form onSubmit={handleBankSubmit(onBankingSubmit)} className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Building2 size={16} className="text-[#800020]" />
            <h2 className="font-serif font-bold text-base text-gray-900">
              4. Merchant Bank Account & UPI Credentials
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Account Beneficiary Name *
              </label>
              <input
                type="text"
                {...regBank("accountHolderName")}
                placeholder="e.g. Shreekamalinee Pvt Ltd"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errorsBank.accountHolderName ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.accountHolderName && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.accountHolderName.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Bank Account Number *
              </label>
              <input
                type="text"
                {...regBank("accountNumber")}
                placeholder="e.g. 50200012345678"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsBank.accountNumber ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.accountNumber && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.accountNumber.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                IFSC Code (11 Chars) *
              </label>
              <input
                type="text"
                {...regBank("ifscCode")}
                placeholder="e.g. HDFC0001234"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold uppercase ${
                  errorsBank.ifscCode ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.ifscCode && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.ifscCode.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                {...regBank("bankName")}
                placeholder="e.g. HDFC Bank Ltd"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errorsBank.bankName ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.bankName && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.bankName.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Branch / City Name *
              </label>
              <input
                type="text"
                {...regBank("branchName")}
                placeholder="e.g. Connaught Place, New Delhi"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-medium ${
                  errorsBank.branchName ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.branchName && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.branchName.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-800 mb-1">
                Merchant UPI ID (VPA) *
              </label>
              <input
                type="text"
                {...regBank("upiId")}
                placeholder="e.g. shreekamalinee@hdfcbank"
                className={`w-full px-3 py-2 text-xs border rounded-xs outline-none bg-white font-mono font-bold ${
                  errorsBank.upiId ? "border-rose-500" : "border-gray-300 focus:border-[#800020]"
                }`}
              />
              {errorsBank.upiId && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  {errorsBank.upiId.message}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Gateways Toggles */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <h3 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider">
              Enabled Customer Payment Gateways
            </h3>
            <p className="text-[11px] text-gray-500">
              Control which payment options customers can select on the checkout page.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xs bg-gray-50 cursor-pointer hover:border-gray-300">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-gray-900 block text-xs">Direct UPI & QR</span>
                  <span className="text-[10px] text-gray-500">Manual UTR & QR Scan</span>
                </div>
                <input
                  type="checkbox"
                  {...regBank("isUpiPaymentActive")}
                  className="accent-[#800020] w-4 h-4 cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xs bg-gray-100/70 opacity-50 cursor-not-allowed select-none">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-500 block text-xs">Razorpay Gateway</span>
                    <span className="text-[9.5px] font-bold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.2 rounded">
                      Disabled
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">Online payment gateway not implemented</span>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  className="w-4 h-4 cursor-not-allowed opacity-40"
                />
              </div>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xs bg-gray-50 cursor-pointer hover:border-gray-300">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-gray-900 block text-xs">Cash on Delivery</span>
                  <span className="text-[10px] text-gray-500">Pay cash upon parcel arrival</span>
                </div>
                <input
                  type="checkbox"
                  {...regBank("isCodPaymentActive")}
                  className="accent-[#800020] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xs bg-gray-50 cursor-pointer hover:border-gray-300">
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-gray-900 block text-xs">WhatsApp Booking</span>
                  <span className="text-[10px] text-gray-500">Order via WhatsApp Concierge</span>
                </div>
                <input
                  type="checkbox"
                  {...regBank("isWhatsappOrderActive")}
                  className="accent-[#800020] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={updateBankMutation.isPending || isSubmittingBank}
            >
              Save Banking & Payment Gateways
            </Button>
          </div>
        </form>

        {/* 5. UPI QR Code Scanner Upload Card */}
        <div className="bg-white p-6 rounded-xs border border-gray-200 shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-100 gap-2">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-[#800020]" />
              <div>
                <h2 className="font-serif font-bold text-base text-gray-900 leading-tight">
                  5. Merchant UPI QR Code Image
                </h2>
                <span className="text-[10.5px] text-gray-500 block">
                  Formats: <strong>JPG, PNG, WebP, GIF</strong> • Max: <strong>10 MB</strong> (Min: 100 Bytes)
                </span>
              </div>
            </div>

            <label
              className={`inline-flex items-center gap-2 px-3.5 py-2 bg-[#800020] text-white text-xs font-semibold rounded-xs transition-all shadow-xs ${
                uploadQrMutation.isPending
                  ? "opacity-70 cursor-not-allowed pointer-events-none"
                  : "cursor-pointer hover:bg-[#600018] active:scale-[0.97]"
              }`}
            >
              {uploadQrMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Uploading QR Code...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Select & Upload QR Code</span>
                </>
              )}
              <input
                type="file"
                accept={ACCEPT_IMAGE_STRING}
                className="hidden"
                disabled={uploadQrMutation.isPending}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleQrUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 items-center">
            <div className="border border-gray-200 rounded-xs overflow-hidden bg-gray-50 aspect-square max-w-[200px] flex items-center justify-center p-3">
              {activeQrDisplay ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                  <img
                    src={activeQrDisplay}
                    alt="Merchant UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-1 right-1 bg-emerald-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 shadow-xs">
                    <CheckCircle2 size={10} /> {uploadQrMutation.isPending ? "Uploading..." : "Active Live QR"}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 space-y-1">
                  <QrCode size={32} className="mx-auto" />
                  <span className="text-[11px] block">No QR Uploaded</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2 text-xs text-gray-600">
              <h4 className="font-serif font-bold text-sm text-gray-900">
                Displaying on Customer Checkout
              </h4>
              <p>
                When a customer selects <strong>"Direct UPI / Bank QR Transfer"</strong> during checkout,
                this QR code is presented alongside your account credentials and merchant UPI ID for instant 1-click scanning.
              </p>
              <div className="flex items-center gap-2 text-emerald-700 font-bold pt-1">
                <CheckCircle2 size={14} />
                <span>Live on checkout & payment verification screens</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}


