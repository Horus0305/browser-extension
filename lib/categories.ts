/**
 * Domain -> Category mapping utilities
 */

export type Category =
  | 'social'
  | 'video'
  | 'music'
  | 'productivity'
  | 'developer'
  | 'communication'
  | 'news'
  | 'shopping'
  | 'education'
  | 'finance'
  | 'search'
  | 'uncategorized';

export const DEFAULT_CATEGORY: Category = 'uncategorized';

// Suffix-based mapping; keys are domain suffixes matched with endsWith()
const CATEGORY_SUFFIX_MAP: Record<string, Category> = {
  // Social
  'facebook.com': 'social',
  'instagram.com': 'social',
  'twitter.com': 'social',
  'x.com': 'social',
  't.co': 'social',
  'linkedin.com': 'social',
  'reddit.com': 'social',
  'pinterest.com': 'social',
  'tiktok.com': 'social',
  'snapchat.com': 'social',

  // Video / Entertainment
  'youtube.com': 'video',
  'youtu.be': 'video',
  'netflix.com': 'video',
  'primevideo.com': 'video',
  'hotstar.com': 'video',
  'disneyplus.com': 'video',
  'hulu.com': 'video',
  'twitch.tv': 'video',

  // Music / Audio
  'spotify.com': 'music',
  'soundcloud.com': 'music',
  'music.apple.com': 'music',

  // Productivity / Work
  'docs.google.com': 'productivity',
  'drive.google.com': 'productivity',
  'mail.google.com': 'communication',
  'gmail.com': 'communication',
  'calendar.google.com': 'productivity',
  'notion.so': 'productivity',
  'slack.com': 'communication',
  'zoom.us': 'communication',
  'meet.google.com': 'communication',
  'figma.com': 'productivity',

  // Developer / Work
  'github.com': 'developer',
  'gitlab.com': 'developer',
  'bitbucket.org': 'developer',
  'stackoverflow.com': 'developer',
  'serverfault.com': 'developer',
  'superuser.com': 'developer',

  // News
  'nytimes.com': 'news',
  'bbc.com': 'news',
  'cnn.com': 'news',
  'theguardian.com': 'news',
  'reuters.com': 'news',
  'bloomberg.com': 'news',

  // Shopping
  'amazon.com': 'shopping',
  'amazon.in': 'shopping',
  'flipkart.com': 'shopping',
  'ebay.com': 'shopping',
  'aliexpress.com': 'shopping',

  // Education
  'coursera.org': 'education',
  'udemy.com': 'education',
  'khanacademy.org': 'education',
  'edx.org': 'education',

  // Finance
  'coinbase.com': 'finance',
  'binance.com': 'finance',
  'zerodha.com': 'finance',

  // Search
  'google.com': 'search',
  'bing.com': 'search',
  'duckduckgo.com': 'search',
  'yahoo.com': 'search',
};

/**
 * Normalize host for matching: lower-case and strip leading 'www.'
 */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  const h = host.toLowerCase();
  return h.startsWith('www.') ? h.slice(4) : h;
}

/**
 * Categorize domain using suffix matching.
 * Returns a Category label, or 'uncategorized' if unknown.
 */
export function categorizeDomain(domain: string | null | undefined): Category {
  const host = normalizeHost(domain);
  if (!host) return DEFAULT_CATEGORY;
  // Exact match first
  if (CATEGORY_SUFFIX_MAP[host]) return CATEGORY_SUFFIX_MAP[host];
  // Suffix match
  for (const suffix of Object.keys(CATEGORY_SUFFIX_MAP)) {
    if (host === suffix) return CATEGORY_SUFFIX_MAP[suffix];
    if (host.endsWith(`.${suffix}`)) return CATEGORY_SUFFIX_MAP[suffix];
  }
  return DEFAULT_CATEGORY;
}

/**
 * Optional: expose the raw map for UI overrides or debugging.
 */
export function getCategoryMap(): Record<string, Category> {
  return { ...CATEGORY_SUFFIX_MAP };
}
