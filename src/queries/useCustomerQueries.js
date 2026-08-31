import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import customerApi from "../api/customerApi.js";

export const CUSTOMER_KEYS = {
  all: ["customers"],
  search: (query) => ["customers", "search", query],
};

export function useCustomersQuery(query = "") {
  return useQuery({
    queryKey: CUSTOMER_KEYS.search(query),
    queryFn: () => customerApi.searchUsers(query),
    staleTime: 1000 * 60 * 3,
  });
}

export function useUpdateCustomerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, enabled }) => customerApi.updateUserStatus(userId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
}
