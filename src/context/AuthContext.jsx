import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useCurrentUserQuery, useLogoutMutation } from "../queries/useAuthQueries.js";
import authApi from "../api/authApi.js";

const AuthContext = createContext(null);

const USER_CACHE_KEY = "shreekamalinee_user_cache";

const getCachedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedUser = (userData) => {
  if (typeof window === "undefined") return;
  try {
    if (userData) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {}
};

export function AuthProvider({ children }) {
  // 1. Synchronously initialize from localStorage cache for instant 0ms rendering
  const [localUser, setLocalUser] = useState(() => getCachedUser());

  // 2. Query live session from Spring Boot API (/api/v1/auth/me) in background
  const { data: serverUser, isLoading: isServerLoading, isFetched: isServerFetched, refetch: refetchUser } = useCurrentUserQuery();
  const logoutMutation = useLogoutMutation();

  // Keep local user and storage in sync whenever server confirms fresh user data
  useEffect(() => {
    if (serverUser) {
      setLocalUser(serverUser);
      setCachedUser(serverUser);
    } else if (isServerFetched && serverUser === null) {
      // Server explicitly verified session is unauthenticated
      setLocalUser(null);
      setCachedUser(null);
    }
  }, [serverUser, isServerFetched]);

  // Active user entity (Server session takes priority, cached localUser ensures instant display)
  const user = serverUser || localUser;

  const rawRole = user?.role || "ROLE_ANONYMOUS";
  const normalizedRole = rawRole.startsWith("ROLE_") ? rawRole : `ROLE_${rawRole}`;
  const role = normalizedRole;
  const isAdmin = normalizedRole === "ROLE_ADMIN" || normalizedRole === "ROLE_SUPERADMIN";
  const isCustomer = normalizedRole === "ROLE_USER" || normalizedRole === "ROLE_CUSTOMER";
  const isAuthenticated = Boolean(user);
  // Only true if no cached user exists AND server is actively checking
  const isHydrating = !user && isServerLoading;

  // Direct login setter used after successful password / OTP / SSO mutation
  const setUserSession = useCallback((userData) => {
    if (userData?.token) {
      localStorage.setItem("shreekamalinee_token", userData.token);
    }
    setLocalUser(userData);
    setCachedUser(userData);
    refetchUser();
  }, [refetchUser]);

  // Immediate Auto-Logout on Session Expiry
  useEffect(() => {
    const handleSessionExpired = () => {
      setLocalUser(null);
      setCachedUser(null);
      localStorage.removeItem("shreekamalinee_token");
      localStorage.removeItem("shreekamalinee_guest_cart");
      localStorage.removeItem("shreekamalinee_guest_wishlist");
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/admin/login" || path === "/login") {
          return; // Do not redirect if already on a login page
        }
        if (path.startsWith("/admin")) {
          window.location.href = "/admin/login?sessionExpired=true";
        } else if (
          path.startsWith("/account") ||
          path.startsWith("/checkout")
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
      setCachedUser(null);
      localStorage.removeItem("shreekamalinee_token");
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
