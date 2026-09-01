import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import couponApi from "../api/couponApi.js";

export const COUPON_KEYS = {
  all: ["coupons"],
  available: ["coupons", "available"],
};

// 1. Fetch available public coupons for patrons
export function useAvailableCouponsQuery() {
  return useQuery({
    queryKey: COUPON_KEYS.available,
    queryFn: couponApi.getActiveCoupons,
    staleTime: 1000 * 60 * 2,
  });
}

// 2. Fetch all coupons (Admin)
export function useCouponsQuery() {
  return useQuery({
    queryKey: COUPON_KEYS.all,
    queryFn: couponApi.getAllCoupons,
    staleTime: 1000 * 60 * 5,
  });
}

// 2b. Fetch coupon redemption usages (Admin)
export function useCouponUsagesQuery(couponId) {
  return useQuery({
    queryKey: ["coupons", couponId, "usages"],
    queryFn: () => couponApi.getCouponUsages(couponId),
    enabled: !!couponId,
    staleTime: 1000 * 10,
  });
}


export function useCreateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponApi.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_KEYS.all });
    },
  });
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponApi.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPON_KEYS.all });
    },
  });
}
