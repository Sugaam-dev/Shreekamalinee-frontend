/**
 * @file Form Validation Utility
 * @description Robust client-side validation rules and error messages.
 */

export const validators = {
  /**
   * Validate email address.
   * @param {string} email
   * @returns {string|null} Error message or null if valid.
   */
  email(email) {
    if (!email || !email.trim()) return "Email address is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim())) return "Please enter a valid email address.";
    return null;
  },

  /**
   * Validate international or 10-digit mobile number with country code.
   * @param {string} phone
   * @returns {string|null}
   */
  phone(phone) {
    if (!phone || !String(phone).trim()) return "Mobile contact number is required.";
    const cleanPhone = String(phone).replace(/[^\d+]/g, "");
    if (!cleanPhone || cleanPhone === "+91" || cleanPhone === "+") {
      return "Mobile contact number is required.";
    }
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return "Please enter a valid complete mobile number (minimum 10 digits).";
    }
    if (digitsOnly.length > 15) {
      return "Phone number cannot exceed 15 digits.";
    }
    return null;
  },

  /**
   * Validate password strength.
   * @param {string} password
   * @returns {string|null}
   */
  password(password) {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    return null;
  },

  /**
   * Validate 6-digit Indian PIN code.
   * @param {string} pincode
   * @returns {string|null}
   */
  pincode(pincode) {
    if (!pincode || !pincode.trim()) return "PIN code is required.";
    if (!/^\d{6}$/.test(pincode.trim())) return "Please enter a valid 6-digit PIN code.";
    return null;
  },

  /**
   * Validate required non-empty string.
   * @param {string} val
   * @param {string} fieldName
   * @param {number} minLen
   * @returns {string|null}
   */
  required(val, fieldName = "Field", minLen = 2) {
    if (!val || !val.trim()) return `${fieldName} is required.`;
    if (val.trim().length < minLen) return `${fieldName} must be at least ${minLen} characters.`;
    return null;
  },
};
