/**
 * lib/utils.ts
 *
 * Shared utility functions used across the help-center feature.
 */

/**
 * Converts a human-readable title into a URL-safe slug.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace & and + with 'and'
    .replace(/[&+]/g, 'and')
    // Strip all characters that are not letters, numbers, spaces, or hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace whitespace and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Collapse consecutive hyphens
    .replace(/-{2,}/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/** Predefined video categories shown in the admin dropdown. */
export const VIDEO_CATEGORIES = [
  'Getting Started',
  'Account & Profile',
  'Billing & Payments',
  'Integrations',
  'Advanced Features',
  'Troubleshooting',
  'Security',
  'API & Developer',
] as const

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]