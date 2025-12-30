/**
 * Get public URL for a file in Supabase Storage
 * @param {string} path - Full path including bucket (e.g., "kitchens/sky-linea.jpg")
 * @returns {string} Full public URL
 */
export function getStorageUrl(path) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !path) return "";
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
}

/**
 * Get public URL for product images
 * @param {string} imageKey - Image key from Product.imageKey (e.g., "kitchens/sky-linea.jpg")
 * @returns {string} Full public URL
 */
export function getProductImageUrl(imageKey) {
  return getStorageUrl(imageKey);
}

