/**
 * @file Variant SKU Generator Utility
 * @description Generates a clean, unique Variant SKU from product code, size, and color.
 * Separated from AdminProductFormPage to preserve Vite HMR (Fast Refresh).
 * Pattern: PRODUCT_SKU-SIZE-COLOR (with counter for duplicates)
 */

export function generateVariantSku(productSku, size, color, existingVariantSkus = [], currentIdx = -1) {
  const cleanProdSku = (productSku || "SKU").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const cleanSize = (size || "FS").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const cleanColor = (color || "STD").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const baseSku = `${cleanProdSku || "SKU"}-${cleanSize || "FS"}-${cleanColor || "STD"}`;
  let uniqueSku = baseSku;
  let counter = 1;

  const otherSkus = existingVariantSkus.filter((_, idx) => idx !== currentIdx);

  while (otherSkus.includes(uniqueSku)) {
    uniqueSku = `${baseSku}-${counter}`;
    counter += 1;
  }

  return uniqueSku;
}
