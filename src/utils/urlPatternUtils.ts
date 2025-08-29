/**
 * Utility functions for URL pattern matching
 */

/**
 * Check if a URL matches a given pattern, supporting exact matching for non-wildcard patterns
 * and trailing slash equivalence.
 * 
 * @param url - The URL to test
 * @param pattern - The pattern to match against
 * @returns true if the URL matches the pattern
 */
export function matchesUrlPattern(url: string, pattern: string): boolean {
  // Check if pattern contains wildcard characters
  const hasWildcard = pattern.includes('*') || pattern.includes('?') || pattern.includes('[') || pattern.includes(']');
  
  if (hasWildcard) {
    // For wildcard patterns, use the existing regex behavior
    return new RegExp(pattern).test(url);
  }
  
  // For non-wildcard patterns, require exact match with trailing slash equivalence
  return urlsAreEquivalent(url, pattern);
}

/**
 * Check if two URLs are equivalent, considering trailing slash equivalence
 * (https://foo.com == https://foo.com/ regardless of which has the trailing slash)
 * 
 * @param url1 - First URL
 * @param url2 - Second URL  
 * @returns true if URLs are equivalent
 */
function urlsAreEquivalent(url1: string, url2: string): boolean {
  // Normalize URLs by removing trailing slash for comparison
  const normalize = (url: string) => url.replace(/\/$/, '');
  
  return normalize(url1) === normalize(url2);
}

/**
 * Legacy function for backward compatibility - uses regex matching
 * @deprecated Use matchesUrlPattern instead
 */
export function legacyUrlMatch(url: string, pattern: string): boolean {
  return new RegExp(pattern).test(url);
}