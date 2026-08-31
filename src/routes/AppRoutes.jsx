import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import AdminRoute from "./AdminRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

// Storefront Pages
const HomePage = lazy(() => import("../pages/home/HomePage.jsx"));
const ShopPage = lazy(() => import("../pages/shop/ShopPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/product/ProductDetailsPage.jsx"));
const CartPage = lazy(() => import("../pages/cart/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/checkout/CheckoutPage.jsx"));
const OrderSuccessPage = lazy(() => import("../pages/checkout/OrderSuccessPage.jsx"));
const PaymentPage = lazy(() => import("../pages/checkout/PaymentPage.jsx"));

// Account Pages
const ProfilePage = lazy(() => import("../pages/account/ProfilePage.jsx"));
const OrdersPage = lazy(() => import("../pages/account/OrdersPage.jsx"));
const OrderDetailsPage = lazy(() => import("../pages/account/OrderDetailsPage.jsx"));
const AddressesPage = lazy(() => import("../pages/account/AddressesPage.jsx"));
const WishlistPage = lazy(() => import("../pages/account/WishlistPage.jsx"));

// Auth Pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const VerifyOtpPage = lazy(() => import("../pages/auth/VerifyOtpPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage.jsx"));

// Information & Error Pages
const AboutPage = lazy(() => import("../pages/about/AboutPage.jsx"));
const ContactPage = lazy(() => import("../pages/contact/ContactPage.jsx"));
const FaqPage = lazy(() => import("../pages/info/FaqPage.jsx"));
const TermsPage = lazy(() => import("../pages/info/TermsPage.jsx"));
const PrivacyPolicyPage = lazy(() => import("../pages/info/PrivacyPolicyPage.jsx"));
const ShippingReturnsPage = lazy(() => import("../pages/info/ShippingReturnsPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/error/NotFoundPage.jsx"));

// Admin Pages (100% Backend DTO Aligned)
const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage.jsx"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage.jsx"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage.jsx"));
const AdminProductsPage = lazy(() => import("../pages/admin/AdminProductsPage.jsx"));
const AdminProductFormPage = lazy(() => import("../pages/admin/AdminProductFormPage.jsx"));
const AdminInventoryPage = lazy(() => import("../pages/admin/AdminInventoryPage.jsx"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage.jsx"));
const AdminOrderDetailsPage = lazy(() => import("../pages/admin/AdminOrderDetailsPage.jsx"));
const AdminCouponsPage = lazy(() => import("../pages/admin/AdminCouponsPage.jsx"));
const AdminReviewsPage = lazy(() => import("../pages/admin/AdminReviewsPage.jsx"));
const AdminCustomersPage = lazy(() => import("../pages/admin/AdminCustomersPage.jsx"));
const AdminInquiriesPage = lazy(() => import("../pages/admin/AdminInquiriesPage.jsx"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage.jsx"));

export default function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <LoadingSpinner />
        </div>
      }
    >
      <Routes>
        {/* Public Storefront Catalog */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/collection" element={<Navigate to="/shop" replace />} />
        <Route path="/catalog" element={<Navigate to="/shop" replace />} />
        <Route path="/category/:category" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/details/:id" element={<ProductDetailsPage />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage onComplete={() => navigate("/")} />
            </ProtectedRoute>
          }
        />

        {/* Customer Account Dashboard (Protected RBAC) */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Navigate to="/account/profile" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/addresses"
          element={
            <ProtectedRoute>
              <AddressesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        {/* Public Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Brand & Customer Service */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/shipping-returns" element={<ShippingReturnsPage />} />

        {/* Admin Portal Authentication (Public Login) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Portal Protected Routes (ROLE_ADMIN & ROLE_SUPERADMIN) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProductsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <AdminRoute>
              <AdminProductFormPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/edit/:id"
          element={
            <AdminRoute>
              <AdminProductFormPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <AdminInventoryPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <AdminOrderDetailsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AdminRoute>
              <AdminCouponsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <AdminRoute>
              <AdminReviewsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminCustomersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminCustomersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inquiries"
          element={
            <AdminRoute>
              <AdminInquiriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <AdminInquiriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/bank-settings"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
