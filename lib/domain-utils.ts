/**
 * Utility functions for domain extraction and URL processing
 */

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns The domain string (e.g., "youtube.com")
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Remove www. prefix if present
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?#]+)/i);
    return match ? match[1] : 'unknown';
  }
}

/**
 * Checks if a URL should be tracked based on protocol and domain exclusions
 * @param url - The URL to check
 * @param excludedDomains - Array of domains to exclude from tracking
 * @returns True if the URL should be tracked
 */
export function shouldTrackUrl(url: string, excludedDomains: string[] = []): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only track http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    const domain = extractDomain(url);
    
    // Check if domain is in exclusion list
    return !excludedDomains.some(excluded => 
      domain === excluded || domain.endsWith('.' + excluded)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Validates if a domain string is valid
 * @param domain - The domain to validate
 * @returns True if the domain is valid
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  // Basic domain validation regex
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

/**
 * Gets the favicon URL for a domain
 * @param domain - The domain to get favicon for
 * @returns The favicon URL
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Normalizes a domain by removing subdomains for common services
 * @param domain - The domain to normalize
 * @returns The normalized domain
 */
export function normalizeDomain(domain: string): string {
  // Common subdomain patterns to normalize
  const patterns = [
    /^m\./,           // mobile sites (m.facebook.com -> facebook.com)
    /^mobile\./,      // mobile sites
    /^www\d+\./,      // numbered www sites (www2.example.com -> example.com)
  ];
  
  let normalized = domain;
  for (const pattern of patterns) {
    normalized = normalized.replace(pattern, '');
  }
  
  return normalized;
}