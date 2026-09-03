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
  Activity,
  Layers,
  Zap,
  Upload,
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
    if (preset === "1W" || preset === "WEEK") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return { start: formatToDateInput(weekStart), end: formatToDateInput(today) };
    }
    if (preset === "1M" || preset === "THIS_MONTH") {
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0);
      return { start: formatToDateInput(monthStart), end: formatToDateInput(monthEnd) };
    }
    if (preset === "3M") {
      const threeMonths = new Date(today);
      threeMonths.setMonth(today.getMonth() - 3);
      return { start: formatToDateInput(threeMonths), end: formatToDateInput(today) };
    }
    if (preset === "6M") {
      const sixMonths = new Date(today);
      sixMonths.setMonth(today.getMonth() - 6);
      return { start: formatToDateInput(sixMonths), end: formatToDateInput(today) };
    }
    if (preset === "LAST_MONTH") {
      const lastMonthStart = new Date(y, m - 1, 1);
      const lastMonthEnd = new Date(y, m, 0);
      return { start: formatToDateInput(lastMonthStart), end: formatToDateInput(lastMonthEnd) };
    }
    if (preset === "1Y" || preset === "YEAR") {
      const yearStart = new Date(today);
      yearStart.setFullYear(today.getFullYear() - 1);
      return { start: formatToDateInput(yearStart), end: formatToDateInput(today) };
    }
    // ALL TIME (past 3 years to today)
    const allStart = new Date(y - 2, 0, 1);
    return { start: formatToDateInput(allStart), end: formatToDateInput(today) };
  };

  const initialRange = getPresetRange("6M");
  const [activePreset, setActivePreset] = useState("6M");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [activeHoverIndex, setActiveHoverIndex] = useState(null);
  const [chartViewMode, setChartViewMode] = useState("AREA");
  const chartContainerRef = useRef(null);

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

  // Helper to determine if an order payment is settled & approved
  const isOrderSettled = (o) => {
    const ps = (o?.paymentStatus || "").toUpperCase();
    return ps === "COMPLETED" || ps === "PAID" || ps === "SUCCESS" || ps === "CAPTURED";
  };

  const isOrderAwaitingApproval = (o) => {
    const ps = (o?.paymentStatus || "").toUpperCase();
    const os = (o?.status || o?.orderStatus || "").toUpperCase();
    return (
      ps === "PENDING" ||
      ps === "PAYMENT_PROOF_SUBMITTED" ||
      ps === "UNDER_REVIEW" ||
      os === "PAYMENT_PROOF_SUBMITTED"
    );
  };

  // Executive Metrics (Strictly Separates Realized Money from Pending Pipeline)
  const metrics = useMemo(() => {
    let grossRevenue = 0; // Realized / Approved Revenue
    let pendingVerificationRevenue = 0; // In-pipeline awaiting admin approval
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

      totalDiscount += disc;
      totalShippingCollected += ship;
      totalCodCollected += cod;

      if (isOrderSettled(o)) {
        grossRevenue += amt;
        paidOrdersCount++;

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
      } else {
        pendingVerificationRevenue += amt;
        pendingOrdersCount++;
      }
    });

    const totalOrdersCount = filteredOrders.length;
    const avgOrderValue = paidOrdersCount > 0 ? grossRevenue / paidOrdersCount : 0;
    const totalAttemptedVolume = grossRevenue + pendingVerificationRevenue;
    const collectionEfficiency = totalAttemptedVolume > 0 ? (grossRevenue / totalAttemptedVolume) * 100 : 100;

    return {
      grossRevenue,
      netRealizedRevenue: grossRevenue,
      pendingVerificationRevenue,
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

  // Periodic Chart Data Points Builder (Only counts COMPLETED/PAID for Gross Income)
  const chartData = useMemo(() => {
    const points = [];
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T23:59:59`);
    const days = totalCalendarDays;

    if (days <= 1) {
      // 24-Hour blocks
      for (let h = 0; h < 24; h += 4) {
        const label = `${h.toString().padStart(2, "0")}:00`;
        const intervalOrders = filteredOrders.filter((o) => {
          const d = new Date(o.createdAt);
          return d.getHours() >= h && d.getHours() < h + 4;
        });

        const rev = intervalOrders
          .filter(isOrderSettled)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        const pendingRev = intervalOrders
          .filter(isOrderAwaitingApproval)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        points.push({
          label,
          fullLabel: `${label} – ${(h + 4).toString().padStart(2, "0")}:00`,
          value: rev,
          pendingValue: pendingRev,
          count: intervalOrders.filter(isOrderSettled).length,
          totalCount: intervalOrders.length,
        });
      }
    } else if (days <= 14) {
      // Day-by-Day individual intervals
      for (let i = 0; i < days; i++) {
        const curDate = new Date(s);
        curDate.setDate(s.getDate() + i);
        if (curDate > e) break;
        const dateKey = formatToDateInput(curDate);
        const dayName = curDate.toLocaleDateString("en-IN", { weekday: "short" });
        const dateStr = curDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        const dayOrders = filteredOrders.filter((o) => (o.createdAt || "").startsWith(dateKey));

        const rev = dayOrders
          .filter(isOrderSettled)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        const pendingRev = dayOrders
          .filter(isOrderAwaitingApproval)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        points.push({
          label: `${dayName} ${curDate.getDate()}`,
          fullLabel: `${dayName}, ${dateStr}`,
          value: rev,
          pendingValue: pendingRev,
          count: dayOrders.filter(isOrderSettled).length,
          totalCount: dayOrders.length,
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

        const rev = weekOrders
          .filter(isOrderSettled)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        const pendingRev = weekOrders
          .filter(isOrderAwaitingApproval)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        points.push({
          label: `Wk ${b + 1}`,
          fullLabel: `${bStartStr} – ${bEndStr}`,
          value: rev,
          pendingValue: pendingRev,
          count: weekOrders.filter(isOrderSettled).length,
          totalCount: weekOrders.length,
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

        const rev = mOrders
          .filter(isOrderSettled)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        const pendingRev = mOrders
          .filter(isOrderAwaitingApproval)
          .reduce((acc, c) => acc + (Number(c.finalAmount) || Number(c.totalAmount) || 0), 0);

        points.push({
          label: mLabel,
          fullLabel: mFull,
          value: rev,
          pendingValue: pendingRev,
          count: mOrders.filter(isOrderSettled).length,
          totalCount: mOrders.length,
        });
      }
    }

    const maxValue = Math.max(...points.map((p) => Math.max(p.value, p.pendingValue || 0)), 1000);
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

  const formatCompactCurrency = (val) => {
    if (!val || val === 0) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) {
      const l = (val / 100000).toFixed(1);
      return `₹${l.endsWith(".0") ? l.slice(0, -2) : l}L`;
    }
    if (val >= 1000) return `₹${Math.round(val / 1000)}K`;
    return `₹${val}`;
  };

  const handleExportCsv = () => {
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
  };

  // Peak Data point index
  const peakIndex = useMemo(() => {
    if (!chartData.points.length) return -1;
    let maxIdx = -1;
    let maxVal = 0;
    chartData.points.forEach((pt, idx) => {
      if (pt.value > maxVal) {
        maxVal = pt.value;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [chartData.points]);

  // Average Periodic Pace
  const avgPeriodRevenue = useMemo(() => {
    if (!chartData.points.length) return 0;
    const total = chartData.points.reduce((acc, p) => acc + p.value, 0);
    return Math.round(total / chartData.points.length);
  }, [chartData.points]);

  // Touch Move / Drag tracker for mobile devices
  const handleTouchChart = (e) => {
    if (!chartContainerRef.current || !chartData.points.length) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = touch.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, relativeX / rect.width));
    const index = Math.min(
      chartData.points.length - 1,
      Math.max(0, Math.round(fraction * (chartData.points.length - 1)))
    );
    setActiveHoverIndex(index);
  };

  // Generate smooth Monotone Cubic Spline Area Curve Path & Scaled Geometry
  const svgGraph = useMemo(() => {
    const pts = chartData.points;
    if (pts.length === 0) return { width: 860, height: 260, linePath: "", areaPath: "", coords: [], yTicks: [] };

    const width = 860;
    const height = 260;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;

    const innerW = width - paddingLeft - paddingRight;
    const innerH = height - paddingTop - paddingBottom;
    const maxVal = Math.max(chartData.maxValue, 1000);

    const barWidth = Math.max(8, Math.min(28, innerW / Math.max(1, pts.length * 2.2)));

    const coords = pts.map((p, idx) => {
      const x = paddingLeft + (idx / Math.max(1, pts.length - 1)) * innerW;
      const y = height - paddingBottom - (p.value / maxVal) * innerH;
      const barH = Math.max(2, (p.value / maxVal) * innerH);
      const barY = height - paddingBottom - barH;
      const barX = x - barWidth / 2;
      return { x, y, barX, barY, barW: barWidth, barH, ...p };
    });

    // Reference style Y-Axis ticks ($200K, $150K, $100K, $50K, $0)
    const yTicks = [
      { ratio: 1, label: formatCompactCurrency(maxVal), y: paddingTop },
      { ratio: 0.75, label: formatCompactCurrency(Math.round(maxVal * 0.75)), y: paddingTop + innerH * 0.25 },
      { ratio: 0.5, label: formatCompactCurrency(Math.round(maxVal * 0.5)), y: paddingTop + innerH * 0.5 },
      { ratio: 0.25, label: formatCompactCurrency(Math.round(maxVal * 0.25)), y: paddingTop + innerH * 0.75 },
      { ratio: 0, label: "₹0", y: height - paddingBottom },
    ];

    if (coords.length === 1) {
      const c = coords[0];
      return {
        width,
        height,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        yTicks,
        linePath: `M ${c.x - 20} ${c.y} L ${c.x + 20} ${c.y}`,
        areaPath: `M ${c.x - 20} ${height - paddingBottom} L ${c.x - 20} ${c.y} L ${c.x + 20} ${c.y} L ${c.x + 20} ${height - paddingBottom} Z`,
        coords,
      };
    }

    // Monotone Cubic Spline (Fritsch-Carlson) - Mathematically true curve
    // Only curves when real revenue changes occur; stays flat with 0 artificial wiggles when data is unchanged
    const n = coords.length;
    const dxs = [];
    const dys = [];
    const slopes = [];

    for (let i = 0; i < n - 1; i++) {
      const dx = coords[i + 1].x - coords[i].x;
      const dy = coords[i + 1].y - coords[i].y;
      dxs.push(dx);
      dys.push(dy);
      slopes.push(dx === 0 ? 0 : dy / dx);
    }

    const tangents = [slopes[0]];
    for (let i = 0; i < n - 2; i++) {
      const m0 = slopes[i];
      const m1 = slopes[i + 1];
      if (m0 * m1 <= 0 || coords[i].value === coords[i + 1].value) {
        tangents.push(0); // Strictly flat on flat periods or local extrema
      } else {
        const dx0 = dxs[i];
        const dx1 = dxs[i + 1];
        const common = dx0 + dx1;
        tangents.push((3 * common) / ((common + dx1) / m0 + (common + dx0) / m1));
      }
    }
    tangents.push(slopes[n - 2]);

    let linePath = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const dx = dxs[i];

      // If data is identical between intervals (e.g. ₹0 to ₹0 or no change), draw a true flat line
      if (p0.value === p1.value) {
        linePath += ` L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      } else {
        const cp1x = p0.x + dx / 3;
        const cp1y = p0.y + (tangents[i] * dx) / 3;
        const cp2x = p1.x - dx / 3;
        const cp2y = p1.y - (tangents[i + 1] * dx) / 3;
        linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      }
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x.toFixed(2)} ${height - paddingBottom} L ${first.x.toFixed(2)} ${height - paddingBottom} Z`;

    return { width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, yTicks, linePath, areaPath, coords };
  }, [chartData]);

  const activePoint = activeHoverIndex !== null ? chartData.points[activeHoverIndex] : null;

  return (
    <AdminLayout
      title="Financial & Revenue Intelligence"
      subtitle="Live revenue metrics, sales trends, channel distribution, and cashflow performance"
      actions={
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link to="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              title="Return to Orders"
              className="px-2.5 sm:px-3"
            >
              <span className="hidden xs:inline">Orders</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            title="Export Filtered Financial CSV"
            className="px-2.5 sm:px-3"
          >
            <span className="hidden lg:inline">Export Financial CSV</span>
            <span className="hidden xs:inline lg:hidden">Export CSV</span>
            <span className="xs:hidden">Export</span>
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

        {/* Ultra-Smooth SVG Area Chart + Channels Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Main Visual Sales Chart (8 cols) - Dark Obsidian Electric Blue Luxury Style */}
          <div className="lg:col-span-8 bg-[#0D1117] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 relative overflow-hidden">
            {/* Ambient Background Glow Effect in Sapphire Blue */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header: Fully responsive on mobile and desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-800/60 relative z-10">
              {/* Row 1 on mobile: Title + Export Button */}
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h3 className="text-white font-bold text-base sm:text-xl tracking-tight">
                  Revenue Overview
                </h3>

                {/* Export Button (Mobile position) */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="sm:hidden flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium px-3 py-1.5 rounded-xl bg-[#161B22] hover:bg-[#21262D] border border-slate-800 transition-all shadow-xs cursor-pointer"
                >
                  <Upload size={12} className="text-slate-400" />
                  <span>Export</span>
                </button>
              </div>

              {/* Row 2 on mobile / Right side on desktop: Horizon Tabs + Desktop Export */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Horizon Quick Filters: Full width 5-column grid on mobile, inline flex on desktop */}
                <div className="grid grid-cols-5 sm:flex items-center bg-[#161B22] p-1 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 w-full sm:w-auto">
                  {["1W", "1M", "3M", "1Y", "6M"].map((p) => {
                    const isSelected = activePreset === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`text-center py-1 sm:px-3 rounded-lg transition-all text-xs cursor-pointer ${
                          isSelected
                            ? "bg-[#21262D] text-white font-semibold shadow-xs ring-1 ring-white/10"
                            : "hover:text-slate-200 text-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Export Button (Desktop position) */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[#161B22] hover:bg-[#21262D] border border-slate-800 transition-all shadow-xs cursor-pointer"
                >
                  <Upload size={13} className="text-slate-400" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Chart Area with Floating White Tooltip & Smooth Spline */}
            <div className="pt-1 sm:pt-2 pb-1 relative z-10">
              {chartData.points.length === 0 || chartData.points.every((p) => p.value === 0) ? (
                <div className="h-56 sm:h-72 flex flex-col items-center justify-center text-slate-500 bg-[#161B22]/50 rounded-xl border border-dashed border-slate-800 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">No revenue data recorded for this horizon.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Select "6M" or "1Y" to analyze turnover flow.</p>
                </div>
              ) : (
                <div
                  ref={chartContainerRef}
                  onTouchStart={handleTouchChart}
                  onTouchMove={handleTouchChart}
                  onTouchEnd={() => setActiveHoverIndex(null)}
                  style={{ touchAction: "pan-y" }}
                  className="relative select-none"
                >
                  {/* Floating White Tooltip Card - Clamped for mobile screen edges */}
                  {(() => {
                    const activeIdx = activeHoverIndex !== null ? activeHoverIndex : (peakIndex !== -1 ? peakIndex : Math.max(0, chartData.points.length - 1));
                    const point = chartData.points[activeIdx];
                    const coord = svgGraph.coords[activeIdx];
                    if (!coord || !point) return null;

                    const prevPoint = activeIdx > 0 ? chartData.points[activeIdx - 1] : null;
                    let trendText = "";
                    let isPositive = true;

                    if (prevPoint) {
                      if (prevPoint.value > 0) {
                        const diffPercent = Math.round(((point.value - prevPoint.value) / prevPoint.value) * 100);
                        trendText = `${diffPercent >= 0 ? "+" : ""}${diffPercent}% vs prev`;
                        isPositive = diffPercent >= 0;
                      } else if (point.value > 0) {
                        trendText = "+100% vs prev";
                        isPositive = true;
                      } else {
                        trendText = "0% vs prev";
                        isPositive = true;
                      }
                    } else {
                      const share = metrics.grossRevenue > 0
                        ? Math.round((point.value / metrics.grossRevenue) * 100)
                        : 0;
                      trendText = `${share}% of period`;
                      isPositive = true;
                    }

                    return (
                      <div
                        style={{
                          left: `${Math.max(18, Math.min(82, (coord.x / svgGraph.width) * 100))}%`,
                          top: `${Math.max(4, (coord.y / svgGraph.height) * 100 - 16)}%`,
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-all duration-150 max-w-[200px]"
                      >
                        <div className="bg-white text-gray-900 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.5)] ring-1 ring-black/10 text-left">
                          <div className="text-[10.5px] sm:text-[11px] text-gray-500 font-medium tracking-tight">
                            {point.fullLabel || point.label}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 whitespace-nowrap">
                            Revenue <span className="font-mono font-bold text-gray-950">{formatCurrency(point.value)}</span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold mt-0.5 flex items-center gap-1.5 font-mono">
                            <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                              {trendText}
                            </span>
                            <span className="text-gray-400 font-normal font-sans text-[9.5px]">
                              ({point.count} {point.count === 1 ? "order" : "orders"})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Responsive SVG Canvas */}
                  <div className="w-full h-52 sm:h-64 md:h-76 relative overflow-visible">
                    <svg
                      viewBox="0 0 860 260"
                      preserveAspectRatio="none"
                      className="w-full h-full overflow-visible"
                    >
                      <defs>
                        {/* Reference Blue Gradient Area Fill */}
                        <linearGradient id="refBlueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.65" />
                          <stop offset="35%" stopColor="#3B82F6" stopOpacity="0.35" />
                          <stop offset="75%" stopColor="#1E40AF" stopOpacity="0.10" />
                          <stop offset="100%" stopColor="#0D1117" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Spline Stroke Gradient */}
                        <linearGradient id="refBlueStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="50%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#93C5FD" />
                        </linearGradient>

                        {/* Glow Filter */}
                        <filter id="refBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.45" />
                        </filter>
                      </defs>

                      {/* Reference Horizontal Gridlines & Y-Axis Scale */}
                      {svgGraph.yTicks?.map((tick, idx) => (
                        <g key={idx} className="transition-all duration-200">
                          <line
                            x1={svgGraph.paddingLeft}
                            y1={tick.y}
                            x2={svgGraph.width - svgGraph.paddingRight}
                            y2={tick.y}
                            stroke="#21262D"
                            strokeWidth="1"
                          />
                          <text
                            x={svgGraph.paddingLeft - 8}
                            y={tick.y + 3.5}
                            textAnchor="end"
                            className="text-[11px] fill-slate-400 font-mono font-medium"
                          >
                            {tick.label}
                          </text>
                        </g>
                      ))}

                      {/* Gradient Area Spline */}
                      {svgGraph.areaPath && (
                        <path
                          d={svgGraph.areaPath}
                          fill="url(#refBlueAreaGradient)"
                          className="transition-all duration-300 ease-out"
                        />
                      )}

                      {/* Spline Stroke Line */}
                      {svgGraph.linePath && (
                        <path
                          d={svgGraph.linePath}
                          fill="none"
                          stroke="url(#refBlueStrokeGradient)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#refBlueGlow)"
                          className="transition-all duration-300 ease-out"
                        />
                      )}

                      {/* Active Pinpoint Node on Curve */}
                      {(() => {
                        const activeIdx = activeHoverIndex !== null ? activeHoverIndex : (peakIndex !== -1 ? peakIndex : Math.max(0, chartData.points.length - 1));
                        const coord = svgGraph.coords[activeIdx];
                        if (!coord) return null;

                        return (
                          <g className="transition-all duration-150">
                            {/* Outer Halo */}
                            <circle
                              cx={coord.x}
                              cy={coord.y}
                              r="10"
                              fill="#3B82F6"
                              opacity="0.35"
                              className="animate-pulse"
                            />
                            {/* Inner Node */}
                            <circle
                              cx={coord.x}
                              cy={coord.y}
                              r="5"
                              fill="#ffffff"
                              stroke="#2563EB"
                              strokeWidth="2.5"
                            />
                          </g>
                        );
                      })()}
                    </svg>

                    {/* Interactive Column Hover & Touch Scrub Zones */}
                    <div
                      style={{
                        left: `${(svgGraph.paddingLeft / svgGraph.width) * 100}%`,
                        right: `${(svgGraph.paddingRight / svgGraph.width) * 100}%`,
                      }}
                      className="absolute inset-y-0 flex items-stretch"
                    >
                      {chartData.points.map((pt, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveHoverIndex(idx)}
                          onMouseLeave={() => setActiveHoverIndex(null)}
                          onClick={() => setActiveHoverIndex(idx)}
                          className="flex-1 flex flex-col justify-end items-center cursor-pointer group relative"
                        >
                          <div className="w-full h-full bg-transparent" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Responsive X-Axis Labels (Jan, Feb, Mar, Apr, May, Jun, etc.) */}
                  <div
                    style={{
                      paddingLeft: `${(svgGraph.paddingLeft / svgGraph.width) * 100}%`,
                      paddingRight: `${(svgGraph.paddingRight / svgGraph.width) * 100}%`,
                    }}
                    className="flex justify-between gap-1 pt-2.5 sm:pt-3 border-t border-slate-800/80 overflow-x-hidden"
                  >
                    {chartData.points.map((pt, idx) => {
                      const activeIdx = activeHoverIndex !== null ? activeHoverIndex : (peakIndex !== -1 ? peakIndex : Math.max(0, chartData.points.length - 1));
                      const isHovered = activeIdx === idx;
                      const count = chartData.points.length;
                      
                      // On mobile (<640px), keep only 4 to 6 evenly spaced labels so they never collide
                      const skipStep = count > 12 ? 3 : count > 6 ? 2 : 1;
                      const hideOnMobile = count > 5 && idx % skipStep !== 0 && !isHovered && idx !== count - 1 && idx !== 0;

                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveHoverIndex(idx)}
                          className={`flex-1 text-center truncate transition-all duration-150 cursor-pointer ${
                            hideOnMobile ? "hidden sm:block" : "block"
                          } ${
                            isHovered
                              ? "text-white font-bold scale-105"
                              : "text-slate-400 font-medium hover:text-slate-200"
                          }`}
                        >
                          <span className="text-[10px] sm:text-xs font-mono block tracking-tight">
                            {pt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
