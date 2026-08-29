/**
 * Marketplace API — thin wrappers over comnPost / comnPostForm.
 *
 * Every endpoint is POST and JWT-gated (token auto-attached by CommonServices).
 * Callers read `res.data.success` and `res.data.data`; paginated rows are at
 * `res.data.data.data`. See docs/app-api-integration.md for the full contract.
 */
import {comnPost, comnPostForm} from './CommonServices';

// ── Browse ──────────────────────────────────────────────────────────────────
export const listProducts = (params = {}, navigation) =>
  comnPost('v2/listProducts', params, navigation);

// payload: { id } or { slug }
export const productDetail = (payload, navigation) =>
  comnPost('v2/productDetail', payload, navigation);

export const productsBySite = (site_id, page = 1, navigation) =>
  comnPost('v2/productsBySite', {site_id, page}, navigation);

export const featuredProducts = (page = 1, navigation) =>
  comnPost('v2/featuredProducts', {page}, navigation);

// ── Engagement (fire-and-forget: ignore the response, never block UI) ─────────
export const recordProductView = (id, navigation) =>
  comnPost('v2/recordProductView', {id, platform: 'app'}, navigation);

// lead_type: 'call' | 'whatsapp' | 'directions' | 'enquiry'
export const recordProductLead = (id, lead_type, message, navigation) =>
  comnPost(
    'v2/recordProductLead',
    {id, lead_type, platform: 'app', ...(message ? {message} : {})},
    navigation,
  );

// ── Favourite / rate / comment (generic endpoints, type "Product") ───────────
export const toggleProductFavourite = (favouritable_id, navigation) =>
  comnPost(
    'v2/addDeleteFavourite',
    {favouritable_id, favouritable_type: 'Product'},
    navigation,
  );

// the caller's saved products; each row has the product under `favouritable`
// (or `favouritable: null` + `unavailable: true` when it's no longer live)
export const listFavourites = (params = {}, navigation) =>
  comnPost('v2/favourites', {favouritable_type: 'Product', ...params}, navigation);

// the caller's own enquiry history — buyer-side mirror of myLeads.
// rows carry `available` (false = product paused/deleted → render greyed out).
// params: { lead_type?, page? }
export const myEnquiries = (params = {}, navigation) =>
  comnPost('v2/myEnquiries', params, navigation);

export const rateProduct = (rateable_id, rate, navigation) =>
  comnPost(
    'v2/addUpdateRating',
    {rateable_id, rateable_type: 'Product', rate},
    navigation,
  );

export const productComments = (commentable_id, navigation) =>
  comnPost(
    'v2/comments',
    {commentable_id, commentable_type: 'Product'},
    navigation,
  );

export const addProductComment = (commentable_id, comment, navigation) =>
  comnPost(
    'v2/comment',
    {commentable_id, commentable_type: 'Product', comment},
    navigation,
  );

// ── Vendors (public) ─────────────────────────────────────────────────────────
export const listVendors = (params = {}, navigation) =>
  comnPost('v2/listVendors', params, navigation);

// payload: { id, latitude?, longitude? }
export const vendorProfile = (payload, navigation) =>
  comnPost('v2/vendorProfile', payload, navigation);

// ── Become a vendor ──────────────────────────────────────────────────────────
// NOTE: the role-request flow (requestRole POST, myRoleRequests GET) lives in
// ProfileView.js — don't duplicate it here.

// only vendor-registrable categories (parents + registrable children)
export const businessCategories = navigation =>
  comnPost('v2/businessCategories', {}, navigation);

// formData: multipart (name, description, categories[], latitude, longitude, phone, whatsapp, logo, image, …)
export const addSite = (formData, navigation) =>
  comnPostForm('v2/addSite', formData, navigation);

export const mySites = navigation => comnPost('v2/mySites', {}, navigation);

export const setPrimarySite = (id, navigation) =>
  comnPost('v2/setPrimarySite', {id}, navigation);

// ── Add / manage products ────────────────────────────────────────────────────
export const allowedProductCategories = (site_id, navigation) =>
  comnPost('v2/allowedProductCategories', {site_id}, navigation);

export const categoryAttributeSchema = (product_category_id, navigation) =>
  comnPost('v2/categoryAttributeSchema', {product_category_id}, navigation);

// formData: multipart (site_id, product_category_id, name, attributes JSON, …)
export const addProduct = (formData, navigation) =>
  comnPostForm('v2/addProduct', formData, navigation);

export const myProducts = (params = {}, navigation) =>
  comnPost('v2/myProducts', params, navigation);

export const getProduct = (id, navigation) =>
  comnPost('v2/getProduct', {id}, navigation);

export const updateProduct = (formData, navigation) =>
  comnPostForm('v2/updateProduct', formData, navigation);

export const deleteProduct = (id, navigation) =>
  comnPost('v2/deleteProduct', {id}, navigation);

export const submitProductForReview = (id, navigation) =>
  comnPost('v2/submitProductForReview', {id}, navigation);

export const toggleProductStatus = (id, navigation) =>
  comnPost('v2/toggleProductStatus', {id}, navigation);

// ── Product media ────────────────────────────────────────────────────────────
export const uploadProductMedia = (formData, navigation) =>
  comnPostForm('v2/uploadProductMedia', formData, navigation);

export const deleteProductMedia = (id, media_id, navigation) =>
  comnPost('v2/deleteProductMedia', {id, media_id}, navigation);

export const setProductCover = (id, media_id, navigation) =>
  comnPost('v2/setProductCover', {id, media_id}, navigation);

// media_ids: complete ordered list (a partial list is rejected)
export const reorderProductMedia = (id, media_ids, navigation) =>
  comnPost('v2/reorderProductMedia', {id, media_ids}, navigation);

// ── Variants ─────────────────────────────────────────────────────────────────
// payload: { id, variant_id?, name, price, sale_price?, sku?, stock?, is_default? }
export const saveProductVariant = (payload, navigation) =>
  comnPost('v2/saveProductVariant', payload, navigation);

export const deleteProductVariant = (id, variant_id, navigation) =>
  comnPost('v2/deleteProductVariant', {id, variant_id}, navigation);

// ── Vendor dashboard ─────────────────────────────────────────────────────────
export const myUsageStats = (params = {}, navigation) =>
  comnPost('v2/myUsageStats', params, navigation);

export const productAnalytics = (id, params = {}, navigation) =>
  comnPost('v2/productAnalytics', {id, ...params}, navigation);

export const myLeads = (params = {}, navigation) =>
  comnPost('v2/myLeads', params, navigation);

// ── Subscription ─────────────────────────────────────────────────────────────
export const mySubscription = navigation =>
  comnPost('v2/mySubscription', {}, navigation);

export const listPlans = navigation => comnPost('v2/listPlans', {}, navigation);
