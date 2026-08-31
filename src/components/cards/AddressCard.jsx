import { MapPin, Phone, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import Badge from "../common/Badge.jsx";

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  selectable = false,
  selected = false,
  onSelect,
}) {
  const displayName = address?.fullName || address?.name || "Delivery Address";
  const displayPhone = address?.phoneNumber || address?.phone || "";
  const displayPincode = address?.postalCode || address?.pincode || "";
  const displayLine1 = address?.addressLine1 || address?.street || "";
  const displayLine2 = address?.addressLine2 || address?.landmark || "";
  const displayCity = address?.city || "";
  const displayState = address?.state || "";

  return (
    <div
      onClick={selectable && onSelect ? () => onSelect(address) : undefined}
      className={`bg-white border rounded-sm p-3.5 sm:p-5 transition-all duration-300 relative break-words ${
        selectable ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-rust ring-2 ring-rust/15 shadow-sm"
          : "border-line hover:border-rust/40 shadow-xs"
      }`}
    >

      {/* Address Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm text-charcoal">{displayName}</h4>
          {address?.addressType && (
            <Badge variant="default" size="sm">
              {address.addressType}
            </Badge>
          )}
          {address?.isDefault && (
            <Badge variant="gold" size="sm">
              Default
            </Badge>
          )}
        </div>

        {selectable ? (
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              selected ? "bg-rust border-rust text-white" : "border-line bg-white"
            }`}
          >
            {selected && <CheckCircle2 size={13} />}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(address);
                }}
                className="p-1.5 text-charcoal/50 hover:text-rust hover:bg-cream-2 rounded-full transition-colors cursor-pointer"
                title="Edit Address"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(address.id);
                }}
                className="p-1.5 text-charcoal/50 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                title="Delete Address"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Address Details */}
      <div className="space-y-1.5 text-xs text-charcoal/70 leading-relaxed mb-4">
        <p className="flex items-start gap-2">
          <MapPin size={14} className="text-rust shrink-0 mt-0.5" />
          <span>
            {displayLine1}
            {displayLine2 ? `, ${displayLine2}` : ""}, {displayCity},{" "}
            {displayState} {displayPincode && <>- <strong className="text-charcoal">{displayPincode}</strong></>}
          </span>
        </p>
        {displayPhone && (
          <p className="flex items-center gap-2">
            <Phone size={14} className="text-rust shrink-0" />
            <span>{displayPhone.startsWith("+") ? displayPhone : `+91 ${displayPhone}`}</span>
          </p>
        )}
      </div>


      {/* Footer Set Default Action */}
      {!selectable && !address.isDefault && onSetDefault && (
        <div className="pt-3 border-t border-line/60">
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-[11px] font-bold uppercase tracking-wider text-charcoal/60 hover:text-rust transition-colors cursor-pointer"
          >
            Set as Default Address
          </button>
        </div>
      )}
    </div>
  );
}
