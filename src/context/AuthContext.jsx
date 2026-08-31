import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useCurrentUserQuery, useLogoutMutation } from "../queries/useAuthQueries.js";
import authApi from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Query live session from Spring Boot API (/api/v1/auth/me)
  const { data: serverUser, isLoading: isHydrating, refetch: refetchUser } = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation();

  // Local fallback user state for development / optimistic login
  const [localUser, setLocalUser] = useState(null);

  // Active user entity (Server session takes priority)
  const user = serverUser || localUser;

  const rawRole = user?.role || "ROLE_ANONYMOUS";
  const normalizedRole = rawRole.startsWith("ROLE_") ? rawRole : `ROLE_${rawRole}`;
  const role = normalizedRole;
  const isAdmin = normalizedRole === "ROLE_ADMIN" || normalizedRole === "ROLE_SUPERADMIN";
  const isCustomer = normalizedRole === "ROLE_USER" || normalizedRole === "ROLE_CUSTOMER";
  const isAuthenticated = Boolean(user);

  // Direct login setter used after successful password / OTP mutation
  const setUserSession = useCallback((userData) => {
    setLocalUser(userData);
    refetchUser();
  }, [refetchUser]);

  // Immediate Auto-Logout on Session Expiry
  useEffect(() => {
    const handleSessionExpired = () => {
      setLocalUser(null);
      localStorage.removeItem("shreekamalinee_guest_cart");
      localStorage.removeItem("shreekamalinee_guest_wishlist");
      if (typeof window !== "undefined") {
        if (
          window.location.pathname.startsWith("/account") ||
          window.location.pathname.startsWith("/checkout") ||
          window.location.pathname.startsWith("/admin")
        ) {
          window.location.href = "/login?sessionExpired=true";
        }
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // Manual Logout action
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore network failure on logout
    } finally {
      setLocalUser(null);
      localStorage.removeItem("shreekamalinee_guest_cart");
      localStorage.removeItem("shreekamalinee_guest_wishlist");
    }
  }, [logoutMutation]);





  const value = useMemo(
    () => ({
      user,
      role,
      isAdmin,
      isCustomer,
      isAuthenticated,
      isLoading: isHydrating,
      setUserSession,
      refetchUser,
      logout,
    }),
    [user, role, isAdmin, isCustomer, isAuthenticated, isHydrating, setUserSession, refetchUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      role: "ROLE_ANONYMOUS",
      isAdmin: false,
      isCustomer: false,
      isAuthenticated: false,
      isLoading: false,
      setUserSession: () => {},
      refetchUser: async () => {},
      logout: async () => {},
    };
  }
  return context;
}


export default AuthContext;
