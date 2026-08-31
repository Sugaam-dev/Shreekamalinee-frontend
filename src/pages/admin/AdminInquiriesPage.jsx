import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  Archive,
  Mail,
  Phone,
  Eye,
  Send,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import contactApi from "../../api/contactApi.js";
import { formatDate } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

export default function AdminInquiriesPage() {
  const { showToast } = useCart();
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      const res = await contactApi.getAdminInquiries();
      return Array.isArray(res) ? res : res.content || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await contactApi.updateInquiryStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter((inq) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          inq.name?.toLowerCase().includes(term) ||
          inq.email?.toLowerCase().includes(term) ||
          inq.subject?.toLowerCase().includes(term) ||
          inq.phone?.includes(term) ||
          inq.message?.toLowerCase().includes(term);

        const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [inquiries, searchTerm, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      showToast(`Inquiry marked as ${newStatus}`, "success");
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "warning");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "NEW":
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10.5px] font-bold">New</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10.5px] font-bold">In Progress</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10.5px] font-bold">Resolved</span>;
      case "ARCHIVED":
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-[10.5px] font-bold">Archived</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10.5px] font-bold">{status}</span>;
    }
  };

  return (
    <AdminLayout
      title="Customer Inquiries & Messages"
      subtitle="Manage patron queries, bespoke sizing requests, and storefront contact messages"
    >
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Messages</span>
            <div className="font-serif font-bold text-2xl text-gray-900 mt-1">{inquiries.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xs border border-rose-100 bg-rose-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">New Inquiries</span>
            <div className="font-serif font-bold text-2xl text-rose-900 mt-1">
              {inquiries.filter((i) => i.status === "NEW").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xs border border-amber-100 bg-amber-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">In Progress</span>
            <div className="font-serif font-bold text-2xl text-amber-900 mt-1">
              {inquiries.filter((i) => i.status === "IN_PROGRESS").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xs border border-emerald-100 bg-emerald-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Resolved</span>
            <div className="font-serif font-bold text-2xl text-emerald-900 mt-1">
              {inquiries.filter((i) => i.status === "RESOLVED").length}
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-xs border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patron name, email, phone, or message content..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xs text-xs font-semibold">
            {["all", "NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-xs transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-[#800020] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "all" ? "All" : tab === "NEW" ? "New" : tab === "IN_PROGRESS" ? "In Progress" : tab === "RESOLVED" ? "Resolved" : "Archived"}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10.5px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Patron Contact</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Loading customer inquiries...
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No customer inquiries match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className="hover:bg-amber-50/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{inq.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span>{inq.email}</span>
                          {inq.phone && <span>• {inq.phone}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">{inq.subject}</span>
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-gray-600 truncate">{inq.message}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formatDate(inq.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(inq.status)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#800020] bg-white border border-[#800020]/30 hover:bg-[#800020] hover:text-white rounded-xs font-semibold cursor-pointer transition-all shadow-xs"
                        >
                          <Eye size={12} />
                          <span>View & Reply</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View & Resolve Inquiry Modal */}
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Inquiry from ${selectedInquiry?.name || "Customer"}`}
          subtitle={`Received on ${formatDate(selectedInquiry?.createdAt)}`}
          size="md"
        >
          {selectedInquiry && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <User size={15} className="text-[#800020]" />
                    <span>{selectedInquiry.name}</span>
                  </div>
                  <div>{getStatusBadge(selectedInquiry.status)}</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400" />
                    <a href={`mailto:${selectedInquiry.email}`} className="text-[#800020] underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" />
                      <a href={`tel:${selectedInquiry.phone}`} className="font-semibold text-gray-800">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-gray-500 block mb-1">
                  Subject:
                </span>
                <strong className="text-sm font-serif text-gray-900 block bg-white p-2.5 border border-gray-200 rounded-xs">
                  {selectedInquiry.subject}
                </strong>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-gray-500 block mb-1">
                  Message Content:
                </span>
                <div className="p-3 bg-white border border-gray-200 rounded-xs text-gray-800 leading-relaxed whitespace-pre-line text-xs">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 text-xs">Set Status:</span>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                    className="px-2.5 py-1 text-xs border border-gray-300 rounded-xs outline-none focus:border-[#800020] bg-white font-medium cursor-pointer"
                  >
                    <option value="NEW">NEW</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Re: ${selectedInquiry.subject}`)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#800020] text-white text-xs font-semibold rounded-xs hover:bg-[#600018] transition-colors shadow-xs"
                  >
                    <Mail size={13} />
                    <span>Reply via Email</span>
                  </a>
                  {selectedInquiry.phone && (
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste ${selectedInquiry.name}, this is regarding your inquiry with Shreekamalinee.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-xs hover:bg-[#128C7E] transition-colors shadow-xs"
                    >
                      <Send size={13} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
