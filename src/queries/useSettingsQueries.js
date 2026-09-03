import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import settingsApi from "../api/settingsApi.js";

export const SETTINGS_KEYS = {
  bankDetails: ["settings", "public"],
  adminSettings: ["settings", "admin"],
};

/**
 * Public Storefront Settings Query (Open to all visitors)
 * Used by: Navbar, Footer, WhatsAppWidget, CartDrawer, ContactPage, etc.
 */
export function useBankDetailsQuery() {
  return useQuery({
    queryKey: SETTINGS_KEYS.bankDetails,
    queryFn: settingsApi.getPublicSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Admin Complete Store Settings Query (Protected by Admin Role)
 * Used exclusively by AdminSettingsPage to manage banking, shipping, contact, and announcements.
 */
export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_KEYS.adminSettings,
    queryFn: settingsApi.getAdminSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateShippingSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateShippingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateAnnouncementSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateAnnouncementSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateContactSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateBankDetails,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEYS.adminSettings, data);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "bank-details"] });
    },
  });
}

export function useUploadQrCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.uploadQrCode,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEYS.adminSettings, data);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "bank-details"] });
    },
  });
}

export function useSystemEnumsQuery() {
  return useQuery({
    queryKey: ["metadata", "enums"],
    queryFn: settingsApi.getSystemEnums,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
