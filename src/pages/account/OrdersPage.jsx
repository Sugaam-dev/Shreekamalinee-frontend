import { useState, useMemo } from "react";
import { Package, Search, Filter } from "lucide-react";
import { useUserOrdersQuery } from "../../queries/useOrderQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AccountLayout from "../../components/layout/AccountLayout.jsx";
import OrderCard from "../../components/cards/OrderCard.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import useSEO from "../../hooks/useSEO.js";

function normalizeOrder(o) {
  if (!o) return null;
  return {
    id: o.id,
    orderNumber: o.orderNumber || (o.id ? String(o.id).substring(0, 8).toUpperCase() : "SKM-ORD"),
    status: o.orderStatus || o.status || "CONFIRMED",
    orderDate: o.createdAt || o.orderDate || new Date().toISOString(),
    totalAmount: Number(o.totalAmount) || 0,
    paymentMethod: o.paymentMethod || "MANUAL",
    paymentStatus: o.paymentStatus || "PENDING",
    trackingNumber: o.trackingNumber || o.awbNumber || null,
    trackingUrl: o.trackingUrl || null,
    courierName: o.courierName || null,
    cancellationReason: o.cancellationReason || null,
    shippingAddress: o.shippingAddress || null,

    items: (o.items || []).map((item) => ({
      name: item.productName || item.name || "Handcrafted Heritage Saree",
      qty: item.quantity || item.qty || 1,
      price: Number(item.price) || 0,
      size: item.size || "Standard",
      color: item.color || "Default",
      image:
        item.imageUrl ||
        item.image ||
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    })),
  };
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const { data: responseData, isLoading } = useUserOrdersQuery({ page: page - 1, size: 10 });

  useSEO({
    title: "My Orders — Shreekamalinee",
    description: "Track and review all your previous handloom orders.",
  });

  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PROCESSING | DELIVERED | CANCELLED
  const [searchQuery, setSearchQuery] = useState("");

  const ordersList = Array.isArray(responseData)
    ? responseData
    : responseData?.content || [];
  const totalPages = responseData?.totalPages || 1;

  const rawOrders = ordersList.map(normalizeOrder).filter(Boolean);


  const filteredOrders = useMemo(() => {
    let list = [...rawOrders];

    if (activeTab === "PROCESSING") {
      list = list.filter(
        (o) =>
          o.status === "PROCESSING" ||
          o.status === "CONFIRMED" ||
          o.status === "SHIPPED" ||
          o.status === "PENDING"
      );
    } else if (activeTab === "DELIVERED") {
      list = list.filter((o) => o.status === "DELIVERED");
    } else if (activeTab === "CANCELLED") {
      list = list.filter((o) => o.status === "CANCELLED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
    );
  }, [rawOrders, activeTab, searchQuery]);



  return (
    <AccountLayout
      title="My Orders & History"
      subtitle="View current shipments, order history, and download tax invoices"
    >
      <div className="space-y-6">
        {/* Top Controls: Status Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-line">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "PROCESSING", label: "In Transit" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-sm text-xs uppercase tracking-wider font-semibold transition-colors shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-rust text-white shadow-xs"
                    : "bg-cream-2/50 text-charcoal/70 hover:text-rust"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-[220px]">
            <Search size={14} className="absolute left-3 text-charcoal/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or item..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-cream-2/30 border border-line rounded-sm outline-none focus:border-rust"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-4 border-t border-line">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You don't have any orders matching the selected filter."
            actionLabel="Explore Collections"
            actionTo="/shop"
          />
        )}
      </div>
    </AccountLayout>
  );
}
