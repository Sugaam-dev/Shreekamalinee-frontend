/**
 * @file File Validation Utility
 * @description Single source of truth for file size, format, and batch upload constraints
 * exactly matching ShreeKamalinee_Backend Spring Boot specifications.
 */

// Size Limits in Bytes
export const MIN_FILE_SIZE_BYTES = 100; // 100 Bytes
export const MAX_SINGLE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_MULTI_FILE_BATCH_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Supported File Extensions & MIME Types
export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export const SUPPORTED_DOCUMENT_MIME_TYPES = [
  ...SUPPORTED_IMAGE_MIME_TYPES,
  "application/pdf",
];

export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ".pdf",
];

export const ACCEPT_IMAGE_STRING =
  "image/jpeg,image/png,image/webp,image/gif,image/jpg,.jpg,.jpeg,.png,.webp,.gif";

export const ACCEPT_PAYMENT_DOC_STRING =
  "image/jpeg,image/png,image/webp,image/gif,image/jpg,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf";

/**
 * Validate a single image file (Product image, QR code, Category image)
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: "No file selected." };

  if (file.size < MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" is too small (minimum required: 100 Bytes).`,
    };
  }

  if (file.size > MAX_SINGLE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum allowed size of 10 MB.`,
    };
  }

  const fileName = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  const isMimeValid = SUPPORTED_IMAGE_MIME_TYPES.includes(fileType);
  const isExtValid = SUPPORTED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: `File "${file.name}" has an unsupported format. Allowed: JPG, PNG, WebP, GIF.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate multiple image files for batch upload
 * @param {FileList|File[]} files
 * @returns {{ valid: boolean, error: string|null, validFiles: File[] }}
 */
export function validateImageBatch(files) {
  if (!files || files.length === 0) {
    return { valid: false, error: "No files selected.", validFiles: [] };
  }

  const fileList = Array.from(files);
  let totalBatchSize = 0;
  const validFiles = [];

  for (const file of fileList) {
    const singleValidation = validateImageFile(file);
    if (!singleValidation.valid) {
      return { valid: false, error: singleValidation.error, validFiles: [] };
    }
    totalBatchSize += file.size;
    validFiles.push(file);
  }

  if (totalBatchSize > MAX_MULTI_FILE_BATCH_SIZE_BYTES) {
    return {
      valid: false,
      error: `Total upload batch size exceeds the 20 MB limit (${(totalBatchSize / (1024 * 1024)).toFixed(1)} MB selected).`,
      validFiles: [],
    };
  }

  return { valid: true, error: null, validFiles };
}

/**
 * Validate a payment proof receipt (supports JPG, PNG, WebP, GIF, PDF up to 10 MB)
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePaymentDocument(file) {
  if (!file) return { valid: false, error: "Please attach your payment confirmation slip / screenshot." };

  if (file.size < MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Uploaded file is too small or corrupted (minimum 100 Bytes).",
    };
  }

  if (file.size > MAX_SINGLE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Payment proof file exceeds the 10 MB size limit.",
    };
  }

  const fileName = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  const isMimeValid = SUPPORTED_DOCUMENT_MIME_TYPES.includes(fileType);
  const isExtValid = SUPPORTED_DOCUMENT_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload an image (JPG, PNG, WebP, GIF) or PDF slip.",
    };
  }

  return { valid: true, error: null };
}
