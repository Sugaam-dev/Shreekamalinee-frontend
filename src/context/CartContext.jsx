import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "../utils/constants.js";
import { useAuth } from "./AuthContext.jsx";
import { useBankDetailsQuery } from "../queries/useSettingsQueries.js";
import cartApi from "../api/cartApi.js";
import wishlistApi from "../api/wishlistApi.js";
import orderApi from "../api/orderApi.js";
import couponApi from "../api/couponApi.js";



const CartContext = createContext(null);


export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(() => {
    if (typeof window !== "undefined" && !isAuthenticated) {
      try {
        const saved = localStorage.getItem("shreekamalinee_guest_cart");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState(() => {
    if (typeof window !== "undefined" && !isAuthenticated) {
      try {
        const saved = localStorage.getItem("shreekamalinee_guest_wishlist");
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });

  // Enterprise Guest <-> Server Cart & Wishlist Sync
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      async function syncAndFetchBackendData() {
        // 1. Fetch current server cart first to prevent duplicate quantity additions
        let currentServerCart = null;
        try {
          currentServerCart = await cartApi.getCart();
        } catch {
          currentServerCart = { items: [] };
        }

        const existingVariantIds = new Set(
          Array.isArray(currentServerCart?.items)
            ? currentServerCart.items.map((i) => i.variantId)
            : []
        );

        // 2. Merge Guest Cart only for new items (prevents 1 + 1 = 2 doubling)
        try {
          const guestCartRaw = localStorage.getItem("shreekamalinee_guest_cart");
          if (guestCartRaw) {
            const guestItems = JSON.parse(guestCartRaw);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const gItem of guestItems) {
                if (gItem.variantId && !existingVariantIds.has(gItem.variantId)) {
                  try {
                    await cartApi.addItem({ variantId: gItem.variantId, quantity: gItem.qty || 1 });
                  } catch {
                    // Continue merging remaining items
                  }
                }
              }
            }
          }
        } catch {} finally {
          // Immediately wipe guest localStorage upon login
          localStorage.removeItem("shreekamalinee_guest_cart");
        }

        // 3. Merge Guest Wishlist to PostgreSQL and wipe guest wishlist storage
        try {
          const guestWishlistRaw = localStorage.getItem("shreekamalinee_guest_wishlist");
          if (guestWishlistRaw) {
            const guestWishlistIds = JSON.parse(guestWishlistRaw);
            if (Array.isArray(guestWishlistIds) && guestWishlistIds.length > 0) {
              for (const pId of guestWishlistIds) {
                try {
                  await wishlistApi.addItem(pId);
                } catch {}
              }
            }
          }
        } catch {} finally {
          localStorage.removeItem("shreekamalinee_guest_wishlist");
        }

        // 4. Fetch authoritative unified Cart directly from PostgreSQL

        try {
          const serverCart = await cartApi.getCart();
          if (isMounted) {
            const items = Array.isArray(serverCart?.items) ? serverCart.items : [];
            const mappedItems = items.map((item) => ({
              id: item.id || item.variantId,
              serverItemId: item.id,
              variantId: item.variantId,
              name: item.productName || "Royal Handloom Saree",
              price: Number(item.price) || 0,
              qty: item.quantity || 1,
              selectedSize: item.size || "Standard",
              selectedColor: item.color || "Default",
              image:
                item.imageUrl ||
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
            }));
            setCart(mappedItems);
          }
        } catch {
          if (isMounted) setCart([]);
        }

        // 4. Fetch authoritative Wishlist directly from PostgreSQL
        try {
          const serverWishlist = await wishlistApi.getWishlist();
          if (isMounted) {
            const wishlistArray = Array.isArray(serverWishlist) ? serverWishlist : [];
            setWishlist(new Set(wishlistArray.map((p) => p.id)));
          }
        } catch {
          if (isMounted) setWishlist(new Set());
        }
      }

      syncAndFetchBackendData();
    } else {
      // Guest User Session: hydrate from guest localStorage
      try {
        const savedCart = localStorage.getItem("shreekamalinee_guest_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
        const savedWish = localStorage.getItem("shreekamalinee_guest_wishlist");
        if (savedWish) setWishlist(new Set(JSON.parse(savedWish)));
      } catch {}
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Persist Guest Cart & Wishlist to localStorage when not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem("shreekamalinee_guest_cart", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem("shreekamalinee_guest_wishlist", JSON.stringify(Array.from(wishlist)));
      } catch {}
    }
  }, [wishlist, isAuthenticated]);





  const showToast = useCallback((msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3200);
  }, []);

  const addToCart = useCallback(
    async (product, qty = 1, options = {}) => {
      if (!product) return;
      const variantId = options?.variantId || options?.id || product?.variantId || product?.variants?.[0]?.id;
      const normalizedPrice = Number(product?.offerPrice ?? product?.originalPrice ?? product?.price ?? 0);
      const normalizedImage =
        product?.image ||
        (Array.isArray(product?.imageUrls) && product.imageUrls[0]) ||
        "/images/placeholder-saree.jpg";
      const normalizedName = product?.name || product?.title || "Handloom Attire";
      const selectedSize = options?.size || options?.selectedSize || "Standard";
      const selectedColor = options?.color || options?.selectedColor || product?.color || "Default";

      setCart((prev) => {
        const targetVariantId = variantId || product.id;
        const targetProductId = product.id || product.productId;

        const existing = prev.find((i) => {
          const matchVariant = targetVariantId && (i.variantId === targetVariantId || i.id === targetVariantId);
          const matchProduct = targetProductId && (i.productId === targetProductId || i.id === targetProductId);
          const matchSize = (i.selectedSize || "Standard") === (selectedSize || "Standard");
          return (matchVariant || matchProduct) && matchSize;
        });

        if (existing) {
          return prev.map((i) => {
            const matchVariant = targetVariantId && (i.variantId === targetVariantId || i.id === targetVariantId);
            const matchProduct = targetProductId && (i.productId === targetProductId || i.id === targetProductId);
            const matchSize = (i.selectedSize || "Standard") === (selectedSize || "Standard");
            if ((matchVariant || matchProduct) && matchSize) {
              return {
                ...i,
                qty: i.qty + qty,
                price: normalizedPrice,
                image: normalizedImage,
                name: normalizedName,
              };
            }
            return i;
          });
        }
        return [
          ...prev,
          {
            ...product,
            id: product.id,
            productId: targetProductId,
            name: normalizedName,
            price: normalizedPrice,
            image: normalizedImage,
            qty,
            variantId: targetVariantId,
            selectedSize,
            selectedColor,
          },
        ];
      });


      const openDrawer = options?.openDrawer ?? true;
      const silent = options?.silent ?? false;

      if (!silent) {
        showToast(`Added "${normalizedName}" to shopping bag`, "cart");
      }
      if (openDrawer) {
        setDrawerOpen(true);
      } else {
        setDrawerOpen(false);
      }

      // Server sync for authenticated user if a valid UUID variantId is available
      const isUUID = (str) =>
        typeof str === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

      if (isAuthenticated && variantId && isUUID(variantId)) {
        try {
          const serverResponse = await cartApi.addItem({ variantId, quantity: qty });
          if (serverResponse && Array.isArray(serverResponse.items)) {
            const mappedItems = serverResponse.items.map((item) => ({
              id: item.id || item.variantId,
              serverItemId: item.id,
              variantId: item.variantId,
              name: item.productName || normalizedName,
              price: Number(item.price) || normalizedPrice,
              qty: item.quantity || qty,
              selectedSize: item.size || selectedSize || "Standard",
              selectedColor: item.color || selectedColor || "Default",
              image: item.imageUrl || normalizedImage,
            }));
            setCart(mappedItems);
          }
        } catch {
          // Local fallback persists
        }
      }
    },
    [isAuthenticated, showToast]
  );

  const changeQty = useCallback(
    async (id, delta, selectedSize) => {
      let targetItem = null;
      let newQty = 1;

      setCart((prev) =>
        prev
          .map((i) => {
            if (i.id === id && (!selectedSize || i.selectedSize === selectedSize)) {
              targetItem = i;
              newQty = i.qty + delta;
              return { ...i, qty: newQty };
            }
            return i;
          })
          .filter((i) => i.qty > 0)
      );

      // Server sync
      if (isAuthenticated) {
        try {
          const itemId = targetItem?.serverItemId || targetItem?.id || id;
          if (itemId) {
            let updatedCart;
            if (newQty <= 0) {
              updatedCart = await cartApi.removeItem(itemId);
            } else {
              updatedCart = await cartApi.updateItemQty({
                itemId,
                quantity: newQty,
              });
            }
            if (updatedCart && Array.isArray(updatedCart.items)) {
              const mappedItems = updatedCart.items.map((item) => ({
                id: item.id || item.variantId,
                serverItemId: item.id,
                variantId: item.variantId,
                name: item.productName || "Royal Handloom Saree",
                price: Number(item.price) || 0,
                qty: item.quantity || 1,
                selectedSize: item.size || "Standard",
                selectedColor: item.color || "Default",
                image: item.imageUrl,
              }));
              setCart(mappedItems);
            }
          }
        } catch {
          // Local state remains active
        }
      }
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (id, selectedSize) => {
      let targetItem = null;
      setCart((prev) => {
        targetItem = prev.find(
          (i) => i.id === id && (!selectedSize || i.selectedSize === selectedSize)
        );
        return prev.filter(
          (i) => !(i.id === id && (!selectedSize || i.selectedSize === selectedSize))
        );
      });
      showToast("Item removed from bag", "info");

      if (isAuthenticated) {
        try {
          const itemId = targetItem?.serverItemId || targetItem?.id || id;
          if (itemId) {
            const updatedCart = await cartApi.removeItem(itemId);
            if (updatedCart && Array.isArray(updatedCart.items)) {
              const mappedItems = updatedCart.items.map((item) => ({
                id: item.id || item.variantId,
                serverItemId: item.id,
                variantId: item.variantId,
                name: item.productName || "Royal Handloom Saree",
                price: Number(item.price) || 0,
                qty: item.quantity || 1,
                selectedSize: item.size || "Standard",
                selectedColor: item.color || "Default",
                image: item.imageUrl,
              }));
              setCart(mappedItems);
            }
          }
        } catch {
          // Fallback refetch directly from PostgreSQL
          try {
            const serverCart = await cartApi.getCart();
            if (serverCart && Array.isArray(serverCart.items)) {
              const mappedItems = serverCart.items.map((item) => ({
                id: item.id || item.variantId,
                serverItemId: item.id,
                variantId: item.variantId,
                name: item.productName || "Royal Handloom Saree",
                price: Number(item.price) || 0,
                qty: item.quantity || 1,
                selectedSize: item.size || "Standard",
                selectedColor: item.color || "Default",
                image: item.imageUrl,
              }));
              setCart(mappedItems);
            }
          } catch {}
        }
      }
    },
    [isAuthenticated, showToast]
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    setAppliedCoupon(null);
    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch {
        // Local cleared
      }
    }
  }, [isAuthenticated]);


  const toggleWish = useCallback(
    async (id) => {
      let isAdding = false;
      setWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          showToast("Removed from wishlist", "info");
          isAdding = false;
        } else {
          next.add(id);
          showToast("Saved to your wishlist", "wishlist");
          isAdding = true;
        }
        return next;
      });

      if (isAuthenticated) {
        try {
          if (isAdding) {
            await wishlistApi.addItem(id);
          } else {
            await wishlistApi.removeItem(id);
          }
        } catch {
          // Local wishlist state preserved
        }
      }
    },
    [isAuthenticated, showToast]
  );


  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());

  // Automatically select all cart items by default
  useEffect(() => {
    setSelectedItemIds((prev) => {
      const next = new Set();
      const isFirstInit = !prev.has("__init__");
      cart.forEach((item) => {
        if (isFirstInit || prev.has(item.id)) {
          next.add(item.id);
        }
      });
      next.add("__init__");
      return next;
    });
  }, [cart]);

  const toggleSelectItem = useCallback((id) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedItemIds((prev) => {
      const selectableIds = cart.map((i) => i.id);
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      const next = new Set();
      if (!allSelected) {
        selectableIds.forEach((id) => next.add(id));
      }
      next.add("__init__");
      return next;
    });
  }, [cart]);

  const selectedCartItems = useMemo(() => {
    return cart.filter((item) => selectedItemIds.has(item.id));
  }, [cart, selectedItemIds]);

  const isAllSelected = useMemo(() => {
    return cart.length > 0 && cart.every((item) => selectedItemIds.has(item.id));
  }, [cart, selectedItemIds]);

  const removePurchasedItems = useCallback(
    async (purchasedIds) => {
      if (!purchasedIds || purchasedIds.length === 0) return;
      const idSet = new Set(purchasedIds);
      const itemsToRemove = cart.filter((i) => idSet.has(i.id) || idSet.has(i.serverItemId) || idSet.has(i.variantId));

      setCart((prev) => prev.filter((i) => !idSet.has(i.id) && !idSet.has(i.serverItemId) && !idSet.has(i.variantId)));
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        itemsToRemove.forEach((i) => next.delete(i.id));
        return next;
      });

      if (isAuthenticated) {
        for (const item of itemsToRemove) {
          const itemId = item.serverItemId || item.id;
          if (itemId) {
            try {
              await cartApi.removeItem(itemId);
            } catch {}
          }
        }
      }
    },
    [cart, isAuthenticated]
  );

  // Calculations based on checked items
  const subtotal = useMemo(() => {
    return selectedCartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [selectedCartItems]);

  const totalItemsCount = useMemo(() => {
    return selectedCartItems.reduce((sum, item) => sum + item.qty, 0);
  }, [selectedCartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    if (typeof appliedCoupon.discountAmount === "number" && appliedCoupon.discountAmount > 0) {
      return Math.min(appliedCoupon.discountAmount, subtotal);
    }
    if (typeof appliedCoupon.calculatedDiscount === "number" && appliedCoupon.calculatedDiscount > 0) {
      return Math.min(appliedCoupon.calculatedDiscount, subtotal);
    }
    if (appliedCoupon.discountType === "PERCENTAGE" && appliedCoupon.discountValue) {
      const calculated = (subtotal * Number(appliedCoupon.discountValue)) / 100;
      return appliedCoupon.maxDiscountAmount ? Math.min(calculated, Number(appliedCoupon.maxDiscountAmount)) : calculated;
    }
    if (appliedCoupon.discountType === "FIXED" && appliedCoupon.discountValue) {
      return Math.min(Number(appliedCoupon.discountValue), subtotal);
    }
    if (appliedCoupon.flatDiscount) {
      return Math.min(appliedCoupon.flatDiscount, subtotal);
    }
    if (appliedCoupon.discountPercent) {
      const calculated = (subtotal * appliedCoupon.discountPercent) / 100;
      return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const { data: storeSettings } = useBankDetailsQuery();

  const freeShippingThreshold = Number(storeSettings?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD);
  const standardShippingFee = Number(storeSettings?.standardShippingFee ?? STANDARD_SHIPPING_FEE);
  const codHandlingFee = Number(storeSettings?.codHandlingFee ?? 99);
  const isFreeShippingPromo = Boolean(storeSettings?.isFreeShippingPromoActive);

  const isFreeShipping = isFreeShippingPromo || subtotal >= freeShippingThreshold || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : standardShippingFee;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const applyCouponCode = useCallback(
    async (code, customSubtotal) => {
      const cleanCode = (code || "").trim().toUpperCase();
      if (!cleanCode) {
        showToast("Please enter a coupon code", "warning");
        return false;
      }
      const effectiveSubtotal = typeof customSubtotal === "number" ? customSubtotal : subtotal;
      console.log(`[Coupon Validation] Checking code: "${cleanCode}" with subtotal: ₹${effectiveSubtotal}`);
      try {
        const res = await couponApi.validateCoupon(cleanCode, effectiveSubtotal);
        console.log("[Coupon Validation] API Response:", res);
        if (res && res.valid) {
          const discountVal =
            Number(res.discountAmount) ||
            Number(res.calculatedDiscount) ||
            (res.discountType === "FIXED" ? Number(res.discountValue) : (effectiveSubtotal * Number(res.discountValue)) / 100) ||
            0;

          setAppliedCoupon({
            code: cleanCode,
            discountAmount: discountVal,
            calculatedDiscount: discountVal,
            discountType: res.discountType,
            discountValue: res.discountValue,
            finalPrice: Number(res.finalPrice) || Math.max(0, effectiveSubtotal - discountVal),
            description: res.message || `Saved ₹${discountVal}`,
          });
          showToast(`Promo code "${cleanCode}" applied! (Saved ₹${discountVal})`, "success");
          return true;
        } else {
          showToast(res?.message || "Invalid promo code", "warning");
          return false;
        }
      } catch (err) {
        console.error("[Coupon Validation Error]:", err);
        showToast(err.response?.data?.message || "Invalid or expired promo code", "warning");
        return false;
      }
    },
    [subtotal, showToast]
  );




  const removeCouponCode = useCallback(() => {
    setAppliedCoupon(null);
    showToast("Coupon removed", "info");
  }, [showToast]);

  const value = {
    cart,
    selectedItemIds,
    selectedCartItems,
    isAllSelected,
    toggleSelectItem,
    toggleSelectAll,
    removePurchasedItems,
    addToCart,
    changeQty,
    removeItem,
    clearCart,
    wishlist,
    toggleWish,
    isInWishlist: (id) => wishlist.has(id),
    drawerOpen,
    setDrawerOpen,
    wishlistOpen,
    setWishlistOpen,
    toast,
    showToast,
    // Financial calculations (Dynamic Store Settings)
    subtotal,
    totalItemsCount,
    appliedCoupon,
    discountAmount,
    freeShippingThreshold,
    standardShippingFee,
    codHandlingFee,
    isFreeShippingPromo,
    shippingFee,
    isFreeShipping,
    grandTotal,
    applyCouponCode,
    removeCouponCode,
  };


  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: [],
      selectedItemIds: new Set(),
      selectedCartItems: [],
      isAllSelected: false,
      toggleSelectItem: () => {},
      toggleSelectAll: () => {},
      removePurchasedItems: async () => {},
      wishlist: new Set(),
      subtotal: 0,
      grandTotal: 0,
      totalItemsCount: 0,
      appliedCoupon: null,
      discountAmount: 0,
      drawerOpen: false,
      setDrawerOpen: () => {},
      wishlistOpen: false,
      setWishlistOpen: () => {},
      toast: { show: false, msg: "", type: "info" },
      setToast: () => {},
      showToast: () => {},
      addToCart: () => {},
      changeQty: () => {},
      removeItem: () => {},
      clearCart: () => {},
      toggleWish: () => {},
      isInWishlist: () => false,
      applyCouponCode: async () => false,
      removeCouponCode: () => {},
    };
  }
  return ctx;
}



export default CartContext;
