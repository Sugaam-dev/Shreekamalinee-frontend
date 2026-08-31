import { useState } from "react";
import { Building, QrCode, Upload, Save, Copy, CheckCircle2 } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";

export default function AdminBankSettingsPage() {
  const { showToast } = useCart();

  const [bankForm, setBankForm] = useState({
    accountHolderName: "Shreekamalinee Studio Private Limited",
    bankName: "HDFC Bank Limited",
    accountNumber: "50200067382109",
    ifscCode: "HDFC0000003",
    branch: "Connaught Place, New Delhi",
    upiId: "Shreekamalinee@upi",
  });

  const [qrCodePreview, setQrCodePreview] = useState(
    "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=Shreekamalinee@upi&pn=ShreekamalineeStudio"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    showToast("Store Bank & UPI payment details updated!", "success");
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setQrCodePreview(tempUrl);
      showToast("New UPI QR Code image uploaded for customer checkout", "success");
    }
  };

  return (
    <AdminLayout
      title="Store Bank Account & QR Code Settings"
      subtitle="Configure account information and QR code displayed on the checkout payment verification page"
    >
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start max-w-5xl">
        {/* Bank Form */}
        <form onSubmit={handleSaveBank} className="bg-white border border-line rounded-sm p-6 md:p-8 shadow-xs space-y-5">
          <h3 className="font-serif font-bold text-base md:text-lg text-charcoal flex items-center gap-2 pb-3 border-b border-line">
            <Building size={17} className="text-rust" />
            <span>Bank Account Details</span>
          </h3>

          <div className="space-y-4">
            <Input
              label="Account Holder Name"
              required
              value={bankForm.accountHolderName}
              onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                required
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />

              <Input
                label="Branch Location"
                required
                value={bankForm.branch}
                onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Account Number"
                required
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              />

              <Input
                label="IFSC Code"
                required
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>

            <Input
              label="Store UPI ID / VPA"
              required
              value={bankForm.upiId}
              onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} icon={Save}>
            Save Bank Settings
          </Button>
        </form>

        {/* QR Code Upload Preview */}
        <div className="bg-white border border-line rounded-sm p-6 md:p-8 shadow-xs space-y-5 text-center">
          <h3 className="font-serif font-bold text-base md:text-lg text-charcoal flex items-center justify-center gap-2 pb-3 border-b border-line">
            <QrCode size={17} className="text-rust" />
            <span>Storefront UPI QR Code</span>
          </h3>

          <div className="w-48 h-48 mx-auto border border-line bg-cream-2/40 p-3 rounded-sm flex items-center justify-center shadow-xs">
            <img
              src={qrCodePreview}
              alt="Storefront QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase font-bold tracking-wider text-charcoal/70">
              Upload New UPI QR Graphic
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="text-xs text-charcoal/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border file:border-line file:text-xs file:font-semibold file:bg-cream-2 file:text-charcoal hover:file:bg-rust hover:file:text-white file:cursor-pointer cursor-pointer"
            />
            <p className="text-[10.5px] text-charcoal/45">
              Recommended format: PNG or JPEG (minimum 400x400px)
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
