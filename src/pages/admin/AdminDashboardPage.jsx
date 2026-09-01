import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  ArrowRight,
  Receipt,
  Truck,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import {
  useAdminDashboardStatsQuery,
  useAdminOrdersQuery,
} from "../../queries/useOrderQueries.js";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading } = useAdminDashboardStatsQuery();
  const { data: orders = [], isLoading: isOrdersLoading } = useAdminOrdersQuery();

  const orderList = Array.isArray(orders) ? orders : Array.isArray(orders?.content) ? orders.content : [];
  const recentOrders = orderList.slice(0, 8);
  // Use server count if available; fall back to local count using new PAYMENT_PROOF_SUBMITTED status
  const pendingManualCount =
    stats?.pendingPaymentVerification ??
    orderList.filter(
      (o) =>
        o.status === "PAYMENT_PROOF_SUBMITTED" ||
        (o.paymentMethod === "MANUAL" && o.paymentStatus === "PENDING")
    ).length;

  const totalGrossRevenue = useMemo(() => {
    if (stats?.totalRevenue && Number(stats.totalRevenue) > 0) {
      return Number(stats.totalRevenue);
    }
    return orderList
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((acc, curr) => acc + (Number(curr.finalAmount) || Number(curr.totalAmount) || 0), 0);
  }, [stats?.totalRevenue, orderList]);

  return (
    <AdminLayout
      title="Store Operations & Insights"
      subtitle="Live revenue metrics, fulfillment queues, and manual payment verification audits"
    >
      <div className="space-y-8">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div
            onClick={() => navigate("/admin/revenue")}
            className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs hover:border-[#800020] hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500 group-hover:text-[#800020] transition-colors">
                Total Gross Revenue
              </span>
              <div className="w-8 h-8 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {isStatsLoading && isOrdersLoading ? "₹..." : formatCurrency(totalGrossRevenue)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center justify-between">
              <span>View financial charts & analytics</span>
              <ArrowUpRight size={13} className="text-gray-400 group-hover:text-[#800020] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>

          {/* Orders */}
          <div
            onClick={() => navigate("/admin/orders")}
            className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500 group-hover:text-blue-700 transition-colors">
                Lifetime Orders
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {isStatsLoading ? "..." : stats?.totalOrders ?? orderList.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
              <span>Total customer transactions</span>
              <ArrowUpRight size={13} className="text-gray-400 group-hover:text-blue-700 transition-colors" />
            </div>
          </div>

          {/* Pending UPI Audits */}
          <div
            onClick={() => navigate("/admin/orders?status=PAYMENT_PROOF_SUBMITTED")}
            className="bg-white p-5 rounded-xs border border-amber-200 bg-amber-50/40 shadow-xs hover:border-amber-400 hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-800">
                Pending UPI Audits
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                <Receipt size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-amber-900 mt-2">
              {pendingManualCount}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center justify-between">
              <span>Manual screenshot audits</span>
              <ArrowUpRight size={13} className="text-amber-500 group-hover:text-amber-800 transition-colors" />
            </div>
          </div>

          {/* Total Customers */}
          <div
            onClick={() => navigate("/admin/customers")}
            className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs hover:border-purple-500 hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500 group-hover:text-purple-700 transition-colors">
                Registered Patrons
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700">
                <Users size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {stats?.totalCustomers ?? "—"}
            </div>
            <div className="text-[11px] text-purple-700 mt-1 flex items-center justify-between">
              <span>Patron customer accounts</span>
              <ArrowUpRight size={13} className="text-gray-400 group-hover:text-purple-700 transition-colors" />
            </div>
          </div>
        </div>

        {/* Quick Action Banner if Pending Manual Receipts Exist */}
        {pendingManualCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Receipt size={20} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-amber-950">
                  {pendingManualCount} Manual UPI Payments Awaiting Audit
                </h4>
                <p className="text-xs text-amber-800">
                  Customers have uploaded screenshot payment slips. Review and approve to release stock for packing.
                </p>
              </div>
            </div>
            <Link
              to="/admin/orders?status=PAYMENT_PROOF_SUBMITTED"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xs shrink-0 transition-colors shadow-xs"
            >
              <span>Audit Payments</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Recent Orders Overview */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-gray-900">
                Recent Customer Orders
              </h3>
              <p className="text-xs text-gray-500">
                Latest transactions and dispatch status across all channels (Click any order to view details)
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1"
            >
              <span>View All ({orderList.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Fulfillment</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isOrdersLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Loading latest orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const currentStatus = order.status || order.orderStatus || "PLACED";
                    const orderAmount = Number(order.finalAmount) || Number(order.totalAmount) || 0;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="hover:bg-gray-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-gray-900 group-hover:text-[#800020] transition-colors">
                          #{order.id?.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-gray-800">
                          {order.shippingAddress?.fullName || order.user?.fullName || "Guest Customer"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.paymentStatus === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {order.paymentMethod || "ONLINE"} · {order.paymentStatus || "PENDING"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                              currentStatus === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentStatus === "SHIPPED"
                                ? "bg-blue-100 text-blue-800"
                                : currentStatus === "PROCESSING"
                                ? "bg-purple-100 text-purple-800"
                                : currentStatus === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-serif font-bold text-gray-900 group-hover:text-[#800020] transition-colors">
                          {formatCurrency(orderAmount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/orders/${order.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#800020]/10 group-hover:bg-[#800020] text-[#800020] group-hover:text-white rounded-xs font-bold text-[10.5px] transition-colors shadow-2xs"
                          >
                            <span>View</span>
                            <ArrowRight size={11} />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}