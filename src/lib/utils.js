/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Generate a stream URL with only slug (no ID)
 * @param {string} title - Stream title
 * @returns {string} - Slugified URL path
 */
export const generateStreamUrl = (streamTitle, streamerName) => {
  if (!streamTitle) return '/home';
  
  const titleSlug = slugify(streamTitle);
  
  // If streamer name is provided, include it in the URL
  if (streamerName) {
    const streamerSlug = slugify(streamerName);
    return `/stream/${streamerSlug}/${titleSlug}`;
  }
  
  return `/stream/${titleSlug}`;
};

/**
 * Extract slug from URL
 * @param {string} slug - URL slug
 * @returns {string} - Cleaned slug
 */
export const extractSlug = (slug) => {
  return slug ? slug.toLowerCase().trim() : '';
};

/**
 * Generate a blog URL with slug
 * @param {string} title - Blog title
 * @returns {string} - Slugified URL path
 */
export const generateBlogUrl = (title) => {
  const slug = slugify(title);
  return slug ? `/blog/${slug}` : '/blogs';
};
