/**
 * @file API Layer Barrel Export
 * @description Centralized export of all backend API modules and endpoints.
 */

export { default as apiClient } from "./client.js";
export * from "./endpoints.js";
export * from "./authApi.js";
export * from "./productApi.js";
export * from "./cartApi.js";
export * from "./wishlistApi.js";
export * from "./orderApi.js";
export * from "./addressApi.js";
export * from "./couponApi.js";

