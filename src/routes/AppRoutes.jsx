import { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";

const HomePage = lazy(() => import("../pages/home/HomePage.jsx"));
const AboutPage = lazy(() => import("../pages/about/AboutPage.jsx"));
const Shop = lazy(() => import("../pages/listing/Shop.jsx"));
const ContactPage = lazy(() => import("../pages/contact/ContactPage.jsx"));
const PaymentPage = lazy(() => import("../pages/checkout/PaymentPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/product/ProductDetailsPage.jsx"));

export default function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* Shop reads category + subcat from URL query params — no props needed */}
        <Route path="/product" element={<Shop />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/payment" element={<PaymentPage onComplete={() => navigate("/")} />} />
        <Route path="/details/:id" element={<ProductDetailsPage />} />
      </Routes>
    </Suspense>
  );
}
