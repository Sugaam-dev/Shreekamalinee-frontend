import { useState, useMemo } from "react";
import { Search, Users, UserCheck, UserX, Shield, Mail, Phone, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Badge from "../../components/common/Badge.jsx";

export default function AdminUsersPage() {
  const { showToast } = useCart();

  const [users, setUsers] = useState([
    {
      id: "usr-1",
      name: "Aaradhya Deshmukh",
      email: "aaradhya.deshmukh@gmail.com",
      phone: "9820785210",
      ordersCount: 4,
      totalSpent: 28400,
      joinedDate: "2024-03-15",
      enabled: true,
      role: "CUSTOMER",
    },
    {
      id: "usr-2",
      name: "Kavita Rao",
      email: "kavita.rao@outlook.com",
      phone: "9844123890",
      ordersCount: 2,
      totalSpent: 14200,
      joinedDate: "2024-08-10",
      enabled: true,
      role: "CUSTOMER",
    },
    {
      id: "usr-3",
      name: "Priyanka Kulkarni",
      email: "priyanka.k@gmail.com",
      phone: "9819203810",
      ordersCount: 6,
      totalSpent: 52000,
      joinedDate: "2023-11-20",
      enabled: true,
      role: "VIP_CUSTOMER",
    },
    {
      id: "usr-4",
      name: "Rajesh Patil",
      email: "rajesh.patil@yahoo.com",
      phone: "9822019481",
      ordersCount: 0,
      totalSpent: 0,
      joinedDate: "2026-08-01",
      enabled: false,
      role: "CUSTOMER",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }, [users, searchQuery]);

  const handleToggleStatus = (userId, currentStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, enabled: !currentStatus } : u))
    );
    showToast(
      `User account ${currentStatus ? "disabled" : "enabled"} successfully`,
      currentStatus ? "warning" : "success"
    );
  };

  return (
    <AdminLayout
      title="Registered Customers & Users"
      subtitle="View customer spending history, order counts, and manage account statuses"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white border border-line rounded-sm p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, email, or mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-xs outline-none bg-cream-2/30 focus:border-rust"
            />
          </div>

          <span className="text-xs text-charcoal/60 font-semibold">
            {filteredUsers.length} Customers Registered
          </span>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-line rounded-sm shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-2/50 text-[10.5px] uppercase font-bold tracking-wider text-charcoal/60 border-b border-line">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Orders</th>
                  <th className="p-3.5">Total Spent</th>
                  <th className="p-3.5">Member Since</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream-2/20 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rust/10 text-rust font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-charcoal block">{u.name}</strong>
                          {u.role === "VIP_CUSTOMER" && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded-xs border border-amber-200 uppercase">
                              VIP Patron
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="block text-charcoal">{u.email}</span>
                      <span className="text-[11px] text-charcoal/50">+91 {u.phone}</span>
                    </td>

                    <td className="p-3.5 font-semibold text-charcoal">
                      {u.ordersCount} {u.ordersCount === 1 ? "Order" : "Orders"}
                    </td>

                    <td className="p-3.5 font-serif font-bold text-charcoal">
                      {formatCurrency(u.totalSpent)}
                    </td>

                    <td className="p-3.5 text-charcoal/60">{formatDate(u.joinedDate)}</td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-xs border ${
                          u.enabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {u.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.enabled)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xs border transition-colors cursor-pointer ${
                          u.enabled
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {u.enabled ? "Disable Account" : "Enable Account"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
