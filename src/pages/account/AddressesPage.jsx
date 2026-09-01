import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import {
  useAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from "../../queries/useAddressQueries.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import AccountLayout from "../../components/layout/AccountLayout.jsx";
import AddressCard from "../../components/cards/AddressCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import useSEO from "../../hooks/useSEO.js";
import { INDIAN_STATES } from "../../utils/constants.js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { validators } from "../../utils/validation.js";

export default function AddressesPage() {

  const { showToast } = useCart();
  const { user, isAuthenticated } = useAuth();

  const { data: dbAddresses = [] } = useAddressesQuery(isAuthenticated);
  const addAddressMutation = useAddAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();
  const setDefaultAddressMutation = useSetDefaultAddressMutation();

  const [localAddresses, setLocalAddresses] = useState([]);
  const addresses = isAuthenticated ? dbAddresses : localAddresses;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Derive account profile info to auto-fill
  const userFullName = user
    ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name || "")
    : "";
  const userPhone = (user?.phoneNumber || user?.phone || "").replace(/^\+91/, "").trim();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    country: "India",
    addressType: "Home",
  });

  useSEO({
    title: "Saved Addresses — Shreekamalinee",
    description: "Manage your delivery and billing addresses.",
  });

  const openAddModal = () => {
    setEditingAddress(null);
    setForm({
      name: userFullName,
      phone: userPhone,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
      country: "India",
      addressType: "Home",
    });
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setForm({
      name: addr.fullName || addr.name || "",
      phone: (addr.phoneNumber || addr.phone || "").replace(/^\+91/, "").trim(),
      addressLine1: addr.addressLine1 || addr.street || "",
      addressLine2: addr.addressLine2 || addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "Maharashtra",
      pincode: addr.postalCode || addr.pincode || "",
      country: addr.country || "India",
      addressType: addr.addressType || "Home",
      isDefault: addr.isDefault ?? false,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (isAuthenticated) {
      try {
        await deleteAddressMutation.mutateAsync(id);
        showToast("Address removed successfully", "info");
        return;
      } catch {
        // Fallback to local
      }
    }
    setLocalAddresses((prev) => prev.filter((a) => a.id !== id));
    showToast("Address removed successfully", "info");
  };

  const handleSetDefault = async (id) => {
    if (isAuthenticated) {
      try {
        await setDefaultAddressMutation.mutateAsync(id);
        showToast("Default delivery address updated", "success");
        return;
      } catch {
        // Fallback to local
      }
    }
    setLocalAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    showToast("Default delivery address updated", "success");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const phoneError = validators.phone(form.phone);
    if (phoneError) {
      showToast(phoneError, "warning");
      return;
    }

    if (!form.name || !form.addressLine1 || !form.pincode) {
      showToast("Please fill all mandatory fields", "warning");
      return;
    }

    const cleanPhone = form.phone.replace(/[^\d+]/g, "").trim();

    const payload = {
      fullName: form.name.trim(),
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      streetAddress: (form.addressLine1.trim() + (form.addressLine2 ? `, ${form.addressLine2.trim()}` : "")).trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2 ? form.addressLine2.trim() : "",
      city: form.city.trim(),
      state: form.state.trim(),
      pinCode: form.pincode.trim(),
      postalCode: form.pincode.trim(),
      country: form.country || "India",
      addressType: form.addressType,
      isDefault: form.isDefault ?? false,
    };

    if (isAuthenticated) {
      try {
        if (editingAddress) {
          await updateAddressMutation.mutateAsync({
            addressId: editingAddress.id,
            addressData: payload,
          });
          showToast("Address updated successfully", "success");
        } else {
          await addAddressMutation.mutateAsync(payload);
          showToast("New delivery address saved", "success");
        }
        setModalOpen(false);
        return;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to save address to server", "warning");
        return;
      }
    }

    if (editingAddress) {
      setLocalAddresses((prev) =>
        prev.map((a) => (a.id === editingAddress.id ? { ...payload, id: a.id, name: payload.fullName, phone: payload.phoneNumber, pincode: payload.postalCode } : a))
      );
      showToast("Address updated", "success");
    } else {
      const newAddr = {
        ...payload,
        name: payload.fullName,
        phone: payload.phoneNumber,
        pincode: payload.postalCode,
        id: "ADDR-" + Date.now(),
        isDefault: addresses.length === 0,
      };
      setLocalAddresses((prev) => [...prev, newAddr]);
      showToast("New address added", "success");
    }
    setModalOpen(false);
  };

  return (
    <AccountLayout
      title="Saved Delivery Addresses"
      subtitle="Add, edit, or set default delivery addresses for faster checkout"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-line">
          <p className="text-xs text-charcoal/60">
            {addresses.length === 0
              ? "No saved addresses found. Add an address for seamless checkout."
              : `${addresses.length} address${addresses.length > 1 ? "es" : ""} saved`}
          </p>
          <Button variant="primary" size="sm" icon={Plus} onClick={openAddModal}>
            Add New Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-cream/40 border border-dashed border-line rounded-sm space-y-3">
            <MapPin size={32} className="mx-auto text-charcoal/30" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-charcoal">No Saved Addresses</h3>
              <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                Add your home or office address to experience one-click authentic handloom delivery.
              </p>
            </div>
            <Button variant="outline" size="sm" icon={Plus} onClick={openAddModal}>
              Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAddress ? "Edit Delivery Address" : "Add New Address"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                Recipient Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                Mobile Number *
              </label>
              <PhoneInput
                defaultCountry="in"
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
                className="w-full text-xs"
                inputClassName="!w-full !py-2.5 !px-3.5 !text-xs !bg-white !border-line !rounded-r-xs !font-medium !text-charcoal focus:!border-rust"
                countrySelectorStyleProps={{
                  buttonClassName: "!bg-gray-50 !border-line !rounded-l-xs !px-2.5",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Flat, House No., Building, Apartment *
            </label>
            <input
              type="text"
              required
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              placeholder="e.g. Flat 402, Royal Palms Residency, 4th Floor"
              className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Street, Area, Landmark (Optional)
            </label>
            <input
              type="text"
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              placeholder="e.g. Near Inorbit Mall, MG Road, Shivaji Nagar"
              className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                City / District *
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                State *
              </label>
              <select
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                placeholder="400001"
                className="w-full px-3.5 py-2.5 text-xs border border-line rounded-xs bg-white outline-none focus:border-rust font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal mb-1">
              Address Type
            </label>
            <div className="flex gap-4">
              {["Home", "Work", "Other"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="addrType"
                    checked={form.addressType === t}
                    onChange={() => setForm({ ...form, addressType: t })}
                    className="accent-rust"
                  />
                  <span className="font-medium text-charcoal">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
            {editingAddress ? "Save Address Changes" : "Add Address"}
          </Button>
        </form>
      </Modal>
    </AccountLayout>
  );
}

