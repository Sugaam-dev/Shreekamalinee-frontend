import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import addressApi from "../api/addressApi.js";

export const ADDRESS_KEYS = {
  all: ["addresses"],
};

// 1. Fetch user's saved addresses
export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: ADDRESS_KEYS.all,
    queryFn: addressApi.getAddresses,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

// 2. Add new address
export function useAddAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressData) => addressApi.addAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

// 3. Update existing address
export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, addressData }) =>
      addressApi.updateAddress(addressId, addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

// 4. Delete address
export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId) => addressApi.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

// 5. Set default address
export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId) => addressApi.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}
