// Single source of truth for money on screen.
//
// `price` is a plain Float in the database -- it carries no currency of its
// own. Currency belongs to the display layer, which is why this lives here and
// not in the API. Writing the symbol inline at each call site is what let the
// UI drift into a mix of $ and Rs, so every price goes through this.
//
// 'en-IN' matters more than the symbol: Indian grouping is lakh-based, so
// 100000 must render as 1,00,000 rather than 100,000.
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Formats a course price. Zero, null and undefined all read as "Free". */
export const formatPrice = (value?: number | null): string =>
  !value || value <= 0 ? 'Free' : inr.format(value);

/** Same formatting without the "Free" case -- for totals, revenue and stats. */
export const formatAmount = (value?: number | null): string => inr.format(value ?? 0);
