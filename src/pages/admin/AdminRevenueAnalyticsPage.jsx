import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  ShoppingBag,
  Tag,
  ArrowUpRight,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  PieChart,
  BarChart3,
  Receipt,
  Sparkles,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { useAdminOrdersQuery } from "../../queries/useOrderQueries.js";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Breadcrumb from "../../components/common/Breadcrumb.jsx";

export default function AdminRevenueAnalyticsPage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading: isOrdersLoading } = useAdminOrdersQuery();

  const formatToDateInput = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPresetRange = (preset) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    if (preset === "TODAY") {
      const s = formatToDateInput(today);
      return { start: s, end: s };
    }
    if (preset === "WEEK") {
      const weekStart = new Date(today);
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      weekStart.setDate(diff);
      return { start: formatToDateInput(weekStart), end: formatToDateInput(today) };
    }
    if (preset === "THIS_MONTH") {
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0); // Exact last day (28, 29, 30, 31)
      return { start: formatToDateInput(monthStart), end: formatToDateInput(monthEnd) };
    }
    if (preset === "LAST_MONTH") {
      const lastMonthStart = new Date(y, m - 1, 1);
      const lastMonthEnd = new Date(y, m, 0);
      return { start: formatToDateInput(lastMonthStart), end: formatToDateInput(lastMonthEnd) };
    }
    if (preset === "YEAR") {
      const yearStart = new Date(y, 0, 1);
      const yearEnd = new Date(y, 11, 31);
      return { start: formatToDateInput(yearStart), end: formatToDateInput(yearEnd) };
    }
    // ALL TIME (past 3 years to today)
    const allStart = new Date(y - 2, 0, 1);
    return { start: formatToDateInput(allStart), end: formatToDateInput(today) };
  };

  const initialRange = getPresetRange("THIS_MONTH");
  const [activePreset, setActivePreset] = useState("THIS_MONTH");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [activeHoverIndex, setActiveHoverIndex] = useState(null);

  // Exact calendar days count
  const totalCalendarDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);
    const diffTime = Math.abs(e - s);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const orderList = useMemo(() => {
    const raw = Array.isArray(orders) ? orders : Array.isArray(orders?.content) ? orders.content : [];
    return raw;
  }, [orders]);

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    if (preset !== "CUSTOM") {
      const range = getPresetRange(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  // Filter orders strictly between calendar bounds & channel
  const filteredOrders = useMemo(() => {
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);

    return orderList.filter((o) => {
      if (channelFilter !== "ALL") {
        const pm = (o.paymentMethod || "").toUpperCase();
        if (channelFilter === "RAZORPAY" && !pm.includes("RAZORPAY") && !pm.includes("ONLINE")) return false;
        if (channelFilter === "WHATSAPP_UPI" && !pm.includes("WHATSAPP") && !pm.includes("UPI") && !pm.includes("MANUAL")) return false;
        if (channelFilter === "DIRECT_BANK" && !pm.includes("BANK") && !pm.includes("NEFT")) return false;
        if (channelFilter === "COD" && !pm.includes("COD")) return false;
      }

      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      return orderDate >= s && orderDate <= e;
    });
  }, [orderList, startDate, endDate, channelFilter]);

  // Executive Metrics
  const metrics = useMemo(() => {
    let grossRevenue = 0;
    let netRealizedRevenue = 0;
    let totalDiscount = 0;
    let totalShippingCollected = 0;
    let totalCodCollected = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;

    const channelTotals = {
      RAZORPAY: 0,
      WHATSAPP_UPI: 0,
      DIRECT_BANK: 0,
      COD: 0,
    };

    filteredOrders.forEach((o) => {
      const amt = Number(o.finalAmount) || Number(o.totalAmount) || 0;
      const disc = Number(o.discountAmount) || 0;
      const ship = Number(o.shippingFee) || 0;
      const cod = Number(o.codHandlingFee) || 0;

      grossRevenue += amt;
      totalDiscount += disc;
      totalShippingCollected += ship;
      totalCodCollected += cod;

      if (o.paymentStatus === "PAID") {
        netRealizedRevenue += amt;
        paidOrdersCount++;
      } else {
        pendingOrdersCount++;
      }

      const pm = (o.paymentMethod || "").toUpperCase();
      if (pm.includes("RAZORPAY") || pm.includes("ONLINE")) {
        channelTotals.RAZORPAY += amt;
      } else if (pm.includes("WHATSAPP") || pm.includes("UPI") || pm.includes("MANUAL")) {
        channelTotals.WHATSAPP_UPI += amt;
      } else if (pm.includes("BANK") || pm.includes("NEFT")) {
        channelTotals.DIRECT_BANK += amt;
      } else if (pm.includes("COD")) {
        channelTotals.COD += amt;
      } else {
        channelTotals.WHATSAPP_UPI += amt;
      }
    });

    const totalOrdersCount = filteredOrders.length;
    const avgOrderValue = paidOrdersCount > 0 ? netRealizedRevenue / paidOrdersCount : (totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0);
    const collectionEfficiency = grossRevenue > 0 ? (netRealizedRevenue / grossRevenue) * 100 : 100;

    return {
      grossRevenue,
      netRealizedRevenue,
      totalDiscount,
      totalShippingCollected,
      totalCodCollected,
      totalOrdersCount,
      paidOrdersCount,
      pendingOrdersCount,
      avgOrderValue,
      collectionEfficiency,
      channelTotals,
    };
  }, [filteredOrders]);

  // Periodic Chart Data Points Builder (Dynamic by Calendar Span)
  const chartData = useMemo(() => {
    const points = [];
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);
    const days = totalCalendarDays;

    if (days <= 1) {
      // 24-Hour blocks
      for (let h = 0; h < 24; h += 4) {
        const label = `${h.toString().padStart(2, "0")}:00`;
        const rev = filteredOrders
          .filter((o) => {
            const d = new Date(o.createdAt);
            return d.getHours() >= h && d.getHours() < h + 4;
          })
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);
        points.push({
          label,
          fullLabel: `${label} – ${(h + 4).toString().padStart(2, "0")}:00`,
          value: rev,
          count: filteredOrders.filter((o) => new Date(o.createdAt).getHours() >= h && new Date(o.createdAt).getHours() < h + 4).length,
        });
      }
    } else if (days <= 14) {
      // Day-by-Day individual bars
      for (let i = 0; i < days; i++) {
        const curDate = new Date(s);
        curDate.setDate(s.getDate() + i);
        if (curDate > e) break;
        const dateKey = formatToDateInput(curDate);
        const dayName = curDate.toLocaleDateString("en-IN", { weekday: "short" });
        const dateStr = curDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const dayOrders = filteredOrders.filter((o) => (o.createdAt || "").startsWith(dateKey));
        const rev = dayOrders.reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);
        points.push({
          label: `${dayName} ${curDate.getDate()}`,
          fullLabel: `${dayName}, ${dateStr}`,
          value: rev,
          count: dayOrders.length,
        });
      }
    } else if (days <= 35) {
      // 4 clean weekly buckets across the exact month
      const bucketSize = Math.ceil(days / 4);
      for (let b = 0; b < 4; b++) {
        const bStart = new Date(s);
        bStart.setDate(s.getDate() + b * bucketSize);
        const bEnd = new Date(s);
        bEnd.setDate(Math.min(e.getDate(), s.getDate() + (b + 1) * bucketSize - 1));
        if (bStart > e) break;

        const bStartStr = bStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const bEndStr = (bEnd > e ? e : bEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

        const weekOrders = filteredOrders.filter((o) => {
          const od = new Date(o.createdAt);
          return od >= bStart && od <= (bEnd > e ? e : new Date(`${formatToDateInput(bEnd)}T23:59:59`));
        });
        const rev = weekOrders.reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);
        points.push({
          label: `Wk ${b + 1}`,
          fullLabel: `${bStartStr} – ${bEndStr}`,
          value: rev,
          count: weekOrders.length,
        });
      }
    } else {
      // Multi-month or Yearly
      const startMonth = s.getMonth();
      const startYear = s.getFullYear();
      const endMonth = e.getMonth();
      const endYear = e.getFullYear();
      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

      for (let m = 0; m < Math.min(totalMonths, 12); m++) {
        const curM = new Date(startYear, startMonth + m, 1);
        const monthEnd = new Date(curM.getFullYear(), curM.getMonth() + 1, 0, 23, 59, 59);
        const mLabel = curM.toLocaleDateString("en-IN", { month: "short" });
        const mFull = curM.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

        const mOrders = filteredOrders.filter((o) => {
          const od = new Date(o.createdAt);
          return od >= curM && od <= monthEnd;
        });
        const rev = mOrders.reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);
        points.push({
          label: mLabel,
          fullLabel: mFull,
          value: rev,
          count: mOrders.length,
        });
      }
    }

    const maxValue = Math.max(...points.map((p) => p.value), 1000);
    return { points, maxValue };
  }, [filteredOrders, startDate, endDate, totalCalendarDays]);

  // Top Products
  const topProducts = useMemo(() => {
    const map = new Map();
    filteredOrders.forEach((o) => {
      const items = o.items || o.orderItems || [];
      items.forEach((item) => {
        const name = item.productName || item.name || "Handloom Saree";
        const price = Number(item.price) || (Number(item.totalPrice) / (item.quantity || 1)) || 0;
        const qty = item.quantity || item.qty || 1;
        const total = Number(item.totalPrice) || (price * qty);

        if (map.has(name)) {
          const prev = map.get(name);
          map.set(name, { name, qty: prev.qty + qty, revenue: prev.revenue + total });
        } else {
          map.set(name, { name, qty, revenue: total });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  const channelPercentage = (val) => {
    if (!metrics.grossRevenue || metrics.grossRevenue === 0) return 0;
    return Math.round((val / metrics.grossRevenue) * 100);
  };

  // Generate smooth SVG Area Curve Path
  const svgGraph = useMemo(() => {
    const pts = chartData.points;
    if (pts.length === 0) return { linePath: "", areaPath: "", coords: [] };

    const width = 800;
    const height = 200;
    const paddingX = 40;
    const paddingY = 20;

    const innerW = width - paddingX * 2;
    const innerH = height - paddingY * 2;
    const maxVal = chartData.maxValue;

    const coords = pts.map((p, idx) => {
      const x = paddingX + (idx / Math.max(1, pts.length - 1)) * innerW;
      const y = height - paddingY - (p.value / maxVal) * innerH;
      return { x, y, ...p };
    });

    if (coords.length === 1) {
      const c = coords[0];
      return {
        linePath: `M ${c.x - 20} ${c.y} L ${c.x + 20} ${c.y}`,
        areaPath: `M ${c.x - 20} ${height - paddingY} L ${c.x - 20} ${c.y} L ${c.x + 20} ${c.y} L ${c.x + 20} ${height - paddingY} Z`,
        coords,
      };
    }

    // Build Catmull-Rom or cubic spline
    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const midX = (curr.x + next.x) / 2;
      linePath += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;

    return { linePath, areaPath, coords };
  }, [chartData]);

  const activePoint = activeHoverIndex !== null ? chartData.points[activeHoverIndex] : null;

  return (
    <AdminLayout
      title="Financial & Revenue Intelligence"
      subtitle="Live revenue metrics, sales trends, channel distribution, and cashflow performance"
      actions={
        <div className="flex items-center gap-2">
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Orders View
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => {
              const headers = "Order ID,Order Date,Customer,Amount,Discount,Payment Method,Payment Status\n";
              const rows = filteredOrders
                .map(
                  (o) =>
                    `"${o.orderNumber || o.id}","${o.createdAt}","${(o.shippingAddress?.fullName || o.user?.fullName || "").replace(/"/g, '""')}","${o.finalAmount || o.totalAmount}","${o.discountAmount || 0}","${o.paymentMethod}","${o.paymentStatus}"`
                )
                .join("\n");
              const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `shreekamalinee-revenue-${startDate}-to-${endDate}.csv`;
              link.click();
            }}
          >
            Export Financial CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Breadcrumb
          items={[
            { label: "Admin Portal", to: "/admin/dashboard" },
            { label: "Revenue Analytics" },
          ]}
        />

        {/* Global Controls & Dynamic Calendar Ribbon */}
        <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Calendar Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <Calendar size={16} className="text-[#800020]" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Calendar Horizon:
              </span>
              <div className="inline-flex flex-wrap rounded-xs border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
                {[
                  { id: "TODAY", label: "Today" },
                  { id: "WEEK", label: "This Week" },
                  { id: "THIS_MONTH", label: "This Month" },
                  { id: "LAST_MONTH", label: "Last Month" },
                  { id: "YEAR", label: "This Year" },
                  { id: "ALL", label: "All Time" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectPreset(tab.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                      activePreset === tab.id
                        ? "bg-[#800020] text-white shadow-2xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Channel Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Channel:
              </span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-xs bg-white focus:border-[#800020] outline-none cursor-pointer"
              >
                <option value="ALL">All Payment Channels</option>
                <option value="RAZORPAY">Razorpay / Net Banking</option>
                <option value="WHATSAPP_UPI">WhatsApp UPI Concierge</option>
                <option value="DIRECT_BANK">NEFT / RTGS Bank Transfer</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>
          </div>

          {/* Interactive Date Range Calendar Inputs */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-gray-600 uppercase tracking-wider text-[10px]">
                Active Bounds:
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset("CUSTOM");
                  }}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-xs font-mono font-bold bg-[#FAF7F2] text-[#800020] focus:border-[#800020] outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset("CUSTOM");
                  }}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-xs font-mono font-bold bg-[#FAF7F2] text-[#800020] focus:border-[#800020] outline-none cursor-pointer"
                />
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono text-[11px]">
                <Clock size={12} />
                <span>{totalCalendarDays} Calendar {totalCalendarDays === 1 ? "Day" : "Days"}</span>
              </span>
            </div>

            <div className="text-[11px] text-gray-400">
              * Select custom dates anytime to dynamically filter all financial charts
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Invoiced Revenue */}
          <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs relative overflow-hidden group hover:border-[#800020] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                Total Gross Invoiced
              </span>
              <div className="w-8 h-8 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {formatCurrency(metrics.grossRevenue)}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-gray-700">{metrics.totalOrdersCount}</span> Orders Placed
            </div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#800020]" />
          </div>

          {/* Net Realized Revenue */}
          <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs relative overflow-hidden group hover:border-emerald-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                Net Realized (Settled)
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-emerald-800 mt-2">
              {formatCurrency(metrics.netRealizedRevenue)}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{metrics.paidOrdersCount} Paid Orders ({metrics.collectionEfficiency.toFixed(0)}% Realized)</span>
            </div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs relative overflow-hidden group hover:border-blue-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                Average Order Value (AOV)
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-2">
              {formatCurrency(metrics.avgOrderValue)}
            </div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">
              Per finalized customer basket
            </div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          </div>

          {/* Promotional Discounts Given */}
          <div className="bg-white p-5 rounded-xs border border-gray-200 shadow-xs relative overflow-hidden group hover:border-purple-600 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                Vouchers & Promo Savings
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
                <Tag size={16} />
              </div>
            </div>
            <div className="font-serif font-bold text-2xl text-purple-900 mt-2">
              {formatCurrency(metrics.totalDiscount)}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-1">
              Total coupons & festive savings
            </div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
          </div>
        </div>

        {/* Ultra-Smooth SVG Area & Velocity Chart + Channels Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Sales Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xs p-6 shadow-xs space-y-4">
            {/* Stable Header with Zero Layout Shift */}
            <div className="flex items-start justify-between min-h-[48px]">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#800020]" />
                  <span>
                    Revenue Velocity Curve ({startDate} to {endDate})
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Continuous revenue progression across {totalCalendarDays} calendar {totalCalendarDays === 1 ? "day" : "days"}
                </p>
              </div>

              {/* Reserved Tooltip Box to Prevent Jitter */}
              <div className="h-10 flex items-center justify-end">
                <div
                  className={`bg-[#FAF7F2] border border-[#E6DFD3] px-3 py-1 rounded-xs text-right transition-opacity duration-150 shadow-2xs ${
                    activePoint ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <span className="text-[10px] text-gray-500 font-bold block">
                    {activePoint?.fullLabel || activePoint?.label || "—"}
                  </span>
                  <span className="font-serif font-bold text-xs text-[#800020] font-mono">
                    {activePoint ? formatCurrency(activePoint.value) : "₹0"} ({activePoint?.count || 0} orders)
                  </span>
                </div>
              </div>
            </div>

            {/* Buttery Smooth SVG Curve + Bar Container */}
            <div className="pt-2 pb-2">
              {chartData.points.length === 0 || chartData.points.every((p) => p.value === 0) ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xs border border-dashed border-gray-200">
                  <BarChart3 size={32} className="text-gray-300 mb-2" />
                  <p className="text-xs font-semibold">No transactions recorded in this specific date range.</p>
                  <p className="text-[11px] text-gray-400">Switch horizon to "All Time" to view full lifetime data.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* SVG Area Spline */}
                  <div className="w-full h-56 relative overflow-hidden">
                    <svg
                      viewBox="0 0 800 200"
                      preserveAspectRatio="none"
                      className="w-full h-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#800020" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#800020" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Subtle Horizontal Gridlines */}
                      <line x1="40" y1="20" x2="760" y2="20" stroke="#f1f1f1" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="40" y1="90" x2="760" y2="90" stroke="#f1f1f1" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="40" y1="160" x2="760" y2="160" stroke="#f1f1f1" strokeDasharray="3 3" strokeWidth="1" />

                      {/* Gradient Area */}
                      {svgGraph.areaPath && (
                        <path
                          d={svgGraph.areaPath}
                          fill="url(#areaGradient)"
                          className="transition-all duration-300 ease-out"
                        />
                      )}

                      {/* Spline Line */}
                      {svgGraph.linePath && (
                        <path
                          d={svgGraph.linePath}
                          fill="none"
                          stroke="#800020"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-300 ease-out"
                        />
                      )}

                      {/* Active Circle Point */}
                      {activeHoverIndex !== null && svgGraph.coords[activeHoverIndex] && (
                        <g>
                          <circle
                            cx={svgGraph.coords[activeHoverIndex].x}
                            cy={svgGraph.coords[activeHoverIndex].y}
                            r="6"
                            fill="#800020"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <line
                            x1={svgGraph.coords[activeHoverIndex].x}
                            y1={svgGraph.coords[activeHoverIndex].y}
                            x2={svgGraph.coords[activeHoverIndex].x}
                            y2="180"
                            stroke="#800020"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.6"
                          />
                        </g>
                      )}
                    </svg>

                    {/* Interactive Column Hover Zones (Zero Jerk Layer) */}
                    <div className="absolute inset-0 flex items-stretch px-6">
                      {chartData.points.map((pt, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveHoverIndex(idx)}
                          onMouseLeave={() => setActiveHoverIndex(null)}
                          className="flex-1 flex flex-col justify-end items-center cursor-pointer group"
                        >
                          {/* Smooth Light Pillar on Hover */}
                          <div
                            className={`w-full max-w-[36px] h-full rounded-t-xs transition-colors duration-150 ${
                              activeHoverIndex === idx ? "bg-[#800020]/10" : "bg-transparent"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between gap-2 px-6 pt-2 border-t border-gray-100">
                    {chartData.points.map((pt, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 text-center truncate transition-colors duration-150 ${
                          activeHoverIndex === idx ? "text-[#800020] font-bold" : "text-gray-500 font-semibold"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-mono block">
                          {pt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Chart Legend */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                  <span>Realized Sales Curve</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#800020]/20" />
                  <span>Volume Area</span>
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-gray-700">
                Peak Period Volume: {formatCurrency(chartData.maxValue)}
              </span>
            </div>
          </div>

          {/* Payment Gateways & Settlement Split (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xs p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-gray-900 flex items-center gap-2">
                <PieChart size={18} className="text-[#800020]" />
                <span>Payment Channel Mix</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Breakdown of revenue collected across online & concierge channels
              </p>
            </div>

            <div className="space-y-4">
              {/* WhatsApp / Direct UPI */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>WhatsApp / Direct UPI</span>
                  </span>
                  <span className="font-mono">{formatCurrency(metrics.channelTotals.WHATSAPP_UPI)} ({channelPercentage(metrics.channelTotals.WHATSAPP_UPI)}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${channelPercentage(metrics.channelTotals.WHATSAPP_UPI)}%` }}
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Razorpay Gateway */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                    <span>Razorpay / Cards / NetBanking</span>
                  </span>
                  <span className="font-mono">{formatCurrency(metrics.channelTotals.RAZORPAY)} ({channelPercentage(metrics.channelTotals.RAZORPAY)}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${channelPercentage(metrics.channelTotals.RAZORPAY)}%` }}
                    className="h-full bg-[#800020] rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Bank Transfer */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>NEFT / RTGS Bank Transfer</span>
                  </span>
                  <span className="font-mono">{formatCurrency(metrics.channelTotals.DIRECT_BANK)} ({channelPercentage(metrics.channelTotals.DIRECT_BANK)}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${channelPercentage(metrics.channelTotals.DIRECT_BANK)}%` }}
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Cash On Delivery */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Cash on Delivery (COD)</span>
                  </span>
                  <span className="font-mono">{formatCurrency(metrics.channelTotals.COD)} ({channelPercentage(metrics.channelTotals.COD)}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${channelPercentage(metrics.channelTotals.COD)}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-3.5 border border-[#E6DFD3] rounded-xs space-y-1 text-xs">
              <span className="font-bold text-gray-900 block font-serif">Logistics & Handling Collections:</span>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Shipping Fees:</span>
                <span className="font-mono font-semibold">{formatCurrency(metrics.totalShippingCollected)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>COD Handling Surcharges:</span>
                <span className="font-mono font-semibold">{formatCurrency(metrics.totalCodCollected)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Sarees */}
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-gray-900">
                Top Revenue Generating Handloom Creations
              </h3>
              <p className="text-xs text-gray-500">
                Best-selling creations driving maximum gross turnover in the current active calendar range
              </p>
            </div>
            <Link to="/admin/products" className="text-xs font-bold text-[#800020] hover:underline">
              Manage Catalog →
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No product sale data recorded for this selection.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topProducts.map((p, idx) => (
                <div key={idx} className="bg-[#FAF7F2] border border-[#E6DFD3] rounded-xs p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-[#800020] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {p.qty} Sold
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-xs text-gray-900 line-clamp-2 min-h-[32px]">{p.name}</h4>
                  <div className="border-t border-[#E6DFD3] pt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-[10px]">Total Revenue:</span>
                    <span className="font-serif font-bold text-[#800020] font-mono">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtered Financial Orders Ledger */}
        <div className="bg-white border border-gray-200 rounded-xs p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-gray-900">
                Financial Transaction Ledger ({filteredOrders.length} records)
              </h3>
              <p className="text-xs text-gray-500">
                Detailed transaction records matching your current active calendar horizon and channel filter
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Patron Customer</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3">Voucher Discount</th>
                  <th className="py-3 px-3">Net Payable</th>
                  <th className="py-3 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 15).map((order) => {
                    const amt = Number(order.finalAmount) || Number(order.totalAmount) || 0;
                    const disc = Number(order.discountAmount) || 0;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="hover:bg-gray-50/90 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-gray-900 group-hover:text-[#800020]">
                          {order.orderNumber || `#${order.id?.slice(0, 8).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-gray-800">
                          {order.shippingAddress?.fullName || order.user?.fullName || "Patron Customer"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-700">
                            {order.paymentMethod || "ONLINE"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus || "PENDING"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-purple-700">
                          {disc > 0 ? `-${formatCurrency(disc)}` : "—"}
                        </td>
                        <td className="py-3 px-3 font-serif font-bold text-gray-900 group-hover:text-[#800020]">
                          {formatCurrency(amt)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#800020] group-hover:underline">
                            <span>Details</span>
                            <ArrowUpRight size={12} />
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
