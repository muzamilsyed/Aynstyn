// Helper function to generate Open Graph meta tag URLs
// This will work in both development and production environments

/**
 * Generates the appropriate URL for Open Graph meta tags
 * @param {string} relativePath - The relative path to the image (e.g., "/images/social/og-facebook.png")
 * @returns {string} - The full URL for use in meta tags
 */
export function getOgImageUrl(relativePath) {
  // In production, use the absolute URL with the domain
  if (import.meta.env.PROD) {
    const domain = window.location.hostname === 'localhost' 
      ? 'https://www.aynstyn.com' 
      : `${window.location.protocol}//${window.location.host}`;
    
    return `${domain}${relativePath}`;
  }
  
  // In development, use relative paths
  return relativePath;
}

/**
 * Updates Open Graph meta tags with dynamic content
 * @param {Object} options - Configuration options
 * @param {string} options.title - The page title
 * @param {string} options.description - The page description
 * @param {string} options.imagePath - The relative path to the image
 * @param {string} options.url - The canonical URL for the page
 */
export function updateOgMetaTags(options = {}) {
  try {
    const {
      title = 'Aynstyn - AI Knowledge Assessment',
      description = 'AI-powered platform that identifies knowledge gaps and provides personalized learning recommendations.',
      imagePath = '/images/social/og-facebook.png',
      url = window.location.href
    } = options;
    
    // Get the full image URL
    const imageUrl = getOgImageUrl(imagePath);
    
    // Update Open Graph meta tags - with safety checks
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]') || 
                   document.querySelector('meta[property="og:image:url"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogImage) ogImage.setAttribute('content', imageUrl);
    if (ogUrl) ogUrl.setAttribute('content', url);
    
    // Update Twitter meta tags - with safety checks
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    const twitterImage = document.querySelector('meta[property="twitter:image"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDesc) twitterDesc.setAttribute('content', description);
    if (twitterImage) twitterImage.setAttribute('content', getOgImageUrl('/images/social/twitter-card.png'));
    if (twitterUrl) twitterUrl.setAttribute('content', url);
    
    // Update the document title as well
    document.title = title;
  } catch (error) {
    console.warn("Error updating meta tags:", error);
  }
}