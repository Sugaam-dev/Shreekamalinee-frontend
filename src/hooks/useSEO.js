import { useEffect } from "react";

/**
 * A custom React hook to dynamically update document SEO metadata,
 * Open Graph tags, canonical link, and JSON-LD schema markup.
 * 
 * @param {Object} seoOptions
 * @param {string} seoOptions.title - Page title (will be suffixed with " | Shreekamalinee")
 * @param {string} seoOptions.description - Meta and OG description
 * @param {string} seoOptions.image - Open Graph image URL
 * @param {string} seoOptions.canonical - Canonical URL of the page
 * @param {Object} seoOptions.schema - JSON-LD schema object
 */
export default function useSEO({ title, description, image, canonical, schema } = {}) {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title 
      ? `${title} | Shreekamalinee` 
      : "Shreekamalinee | Premium Indian Heritage Sarees, Jewellery & Accessories";
    document.title = formattedTitle;

    // Helper to select or create meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Update Meta Description
    const fallbackDesc = "Shreekamalinee offers curated handloom heritage sarees, royal Kundan jewellery, and custom designer ensembles for elegant women.";
    const activeDesc = description || fallbackDesc;
    setMetaTag("name", "description", activeDesc);

    // 3. Update Open Graph Tags
    setMetaTag("property", "og:title", title ? `${title} | Shreekamalinee` : "Shreekamalinee");
    setMetaTag("property", "og:description", activeDesc);
    setMetaTag("property", "og:image", image || "/shreekamalineeLogo.png");
    setMetaTag("property", "og:url", window.location.href);
    setMetaTag("property", "og:type", "website");

    // 4. Update Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title ? `${title} | Shreekamalinee` : "Shreekamalinee");
    setMetaTag("name", "twitter:description", activeDesc);
    setMetaTag("name", "twitter:image", image || "/shreekamalineeLogo.png");

    // 5. Update Canonical URL — strip query params and hash to avoid duplicate content indexing
    const cleanOriginPath = window.location.origin + window.location.pathname;
    const activeCanonical = canonical || cleanOriginPath;
    let canonicalElement = document.querySelector("link[rel='canonical']");
    if (!canonicalElement) {
      canonicalElement = document.createElement("link");
      canonicalElement.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute("href", activeCanonical);

    // 6. Update JSON-LD Schema
    let schemaScript = document.getElementById("json-ld-schema");
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.setAttribute("id", "json-ld-schema");
        schemaScript.setAttribute("type", "application/ld+json");
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else {
      if (schemaScript) {
        schemaScript.remove();
      }
    }

    // Clean up when unmounting
    return () => {
      // Remove page-specific JSON-LD schema on route transition
      const activeSchemaScript = document.getElementById("json-ld-schema");
      if (activeSchemaScript) {
        activeSchemaScript.remove();
      }
    };
  }, [title, description, image, canonical, schema]);
}
