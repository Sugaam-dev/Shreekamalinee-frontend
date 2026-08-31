import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import CartDrawer from "./components/ui/CartDrawer.jsx";
import WishlistDrawer from "./components/ui/WishlistDrawer.jsx";
import Toast from "./components/ui/Toast.jsx";
import WhatsAppWidget from "./components/layout/WhatsAppWidget.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Auto-scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AuthProvider>
      <CartProvider>
        {isAdminRoute ? (
          <div id="top" className="min-h-screen bg-[#F7F5F0]">
            <AppRoutes />
            <Toast />
          </div>
        ) : (
          <div id="top" className="flex flex-col min-h-screen bg-cream">
            <Navbar />

            <main className="flex-grow">
              <AppRoutes />
            </main>

            <Footer />
            <CartDrawer onCheckout={() => navigate("/cart")} />
            <WishlistDrawer />
            <Toast />
            <WhatsAppWidget />
          </div>
        )}
      </CartProvider>
    </AuthProvider>
  );
}
