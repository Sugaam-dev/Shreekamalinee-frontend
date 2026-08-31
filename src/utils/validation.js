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
   * Validate 10-digit Indian phone number.
   * @param {string} phone
   * @returns {string|null}
   */
  phone(phone) {
    if (!phone || !phone.trim()) return "Mobile number is required.";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return "Please enter a valid 10-digit mobile number starting with 6-9.";
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
    if (password.length < 6) return "Password must be at least 6 characters long.";
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
