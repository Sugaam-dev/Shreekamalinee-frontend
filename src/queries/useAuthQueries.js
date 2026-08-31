import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import authApi from "../api/authApi.js";

// Query Key Constants
export const AUTH_KEYS = {
  currentUser: ["auth", "currentUser"],
  userProfile: ["auth", "userProfile"],
};

// 1. Hook to fetch current user session (/api/v1/auth/me) with smart staleTime
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (err) {
        if (err.response?.status === 401) {
          return null; // Gracefully treat unauthenticated guest session as null
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes fresh in memory
    retry: false, // Don't loop if unauthenticated on initial visit
    refetchOnWindowFocus: false,
  });
}


// 2. Hook to fetch detailed customer profile (/api/v1/users/me)
export function useProfileQuery() {
  return useQuery({
    queryKey: AUTH_KEYS.userProfile,
    queryFn: authApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    retry: 1,
  });
}

// 3. Hook for Updating Customer Profile
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(AUTH_KEYS.userProfile, updatedProfile);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });
}

// 4. Hook for Setting / Changing Password for Logged-In User
export function useSetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.setPassword,
  });
}

// 5. Hook for Login Mutation
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (userData) => {
      // Invalidate and immediately set current user in React Query memory cache
      queryClient.setQueryData(AUTH_KEYS.currentUser, userData);
    },
  });
}

// 6. Hook for Register Mutation
export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

// 7. Hook for Verify OTP Mutation
export function useVerifyOtpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (userData) => {
      queryClient.setQueryData(AUTH_KEYS.currentUser, userData);
    },
  });
}

// 8. Hook for Forgot Password Mutation
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
}

// 9. Hook for Reset Password Mutation
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
}

// 10. Hook for Google SSO Mutation
export function useGoogleAuthMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.googleAuthenticate,
    onSuccess: (userData) => {
      queryClient.setQueryData(AUTH_KEYS.currentUser, userData);
    },
  });
}

// 11. Hook for Logout Mutation
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear current user cache on logout
      queryClient.setQueryData(AUTH_KEYS.currentUser, null);
      queryClient.setQueryData(AUTH_KEYS.userProfile, null);
      queryClient.clear();
    },
  });
}
