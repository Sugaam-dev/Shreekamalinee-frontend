import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import settingsApi from "../api/settingsApi.js";

export const SETTINGS_KEYS = {
  bankDetails: ["settings", "bankDetails"],
};

export function useBankDetailsQuery() {
  return useQuery({
    queryKey: SETTINGS_KEYS.bankDetails,
    queryFn: settingsApi.getBankDetails,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateShippingSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateShippingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.bankDetails });
    },
  });
}

export function useUpdateAnnouncementSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateAnnouncementSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.bankDetails });
    },
  });
}

export function useUpdateContactSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateContactSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.bankDetails });
    },
  });
}

export function useUpdateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateBankDetails,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEYS.bankDetails, data);
      queryClient.setQueryData(["orders", "bank-details"], data);
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
      queryClient.setQueryData(SETTINGS_KEYS.bankDetails, data);
      queryClient.setQueryData(["orders", "bank-details"], data);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "bank-details"] });
    },
  });
}

