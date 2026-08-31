import { CheckCircle2, XCircle } from "lucide-react";
import { getPasswordStrength } from "../../schemas/authSchemas.js";

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const rules = [
    { label: "8-30 Characters", valid: password.length >= 8 && password.length <= 30 },
    { label: "1 Uppercase (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "1 Number (0-9)", valid: /[0-9]/.test(password) },
    { label: "1 Special Symbol", valid: /[@#$%^&+=!_\-*()/?><,.:;"'{}|~`[\]\\]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1.5 bg-gray-50 p-2.5 rounded-xs border border-gray-200 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="text-gray-500">Strength:</span>
        <span className="font-bold text-gray-800">{strength.label}</span>
      </div>
      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${(strength.score / 6) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-1 pt-1 text-[10.5px]">
        {rules.map((rule) => (
          <div
            key={rule.label}
            className={`flex items-center gap-1 ${
              rule.valid ? "text-emerald-700 font-medium" : "text-gray-400"
            }`}
          >
            {rule.valid ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
