import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

type MetadataProviderProps = {
  children: ReactNode;
};

export default function MetadataProvider({ children }: MetadataProviderProps) {
  const [location] = useLocation();
  
  useEffect(() => {
    try {
      // Safety check for browser environment
      if (typeof window === 'undefined') return;
      
      // Update meta tags based on current route
      updateMetaTags(location);
      
      // Set canonical URL - use current location for dynamic URL
      const canonicalUrl = `${window.location.origin}${location}`;
      
      // Safely update meta tags with null checks
      const ogUrlMeta = document.querySelector('meta[property="og:url"]');
      const twitterUrlMeta = document.querySelector('meta[property="twitter:url"]');
      
      if (ogUrlMeta) ogUrlMeta.setAttribute('content', canonicalUrl);
      if (twitterUrlMeta) twitterUrlMeta.setAttribute('content', canonicalUrl);
      
      // Update image URLs to include origin
      const imageUrl = `${window.location.origin}/og-image.png`;
      const twitterImageUrl = `${window.location.origin}/twitter-card.png`;
      
      const ogImageUrlMeta = document.querySelector('meta[property="og:image:url"]');
      const ogImageSecureUrlMeta = document.querySelector('meta[property="og:image:secure_url"]');
      const twitterImageMeta = document.querySelector('meta[property="twitter:image"]');
      
      if (ogImageUrlMeta) ogImageUrlMeta.setAttribute('content', imageUrl);
      if (ogImageSecureUrlMeta) ogImageSecureUrlMeta.setAttribute('content', imageUrl);
      if (twitterImageMeta) twitterImageMeta.setAttribute('content', twitterImageUrl);
      
      // Update page title based on route
      const title = getPageTitle(location);
      document.title = title;
      
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      const twitterTitleMeta = document.querySelector('meta[property="twitter:title"]');
      
      if (ogTitleMeta) ogTitleMeta.setAttribute('content', title);
      if (twitterTitleMeta) twitterTitleMeta.setAttribute('content', title);
    } catch (error) {
      console.error("Error updating metadata:", error);
    }
  }, [location]);
  
  return <>{children}</>;
}

function updateMetaTags(path: string) {
  // Get page-specific metadata
  const metadata = getPageMetadata(path);
  
  // Update description
  if (metadata.description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', metadata.description);
  }
}

function getPageTitle(path: string): string {
  switch (path) {
    case '/':
      return 'Aynstyn - AI Knowledge Assessment';
    case '/assessment':
      return 'Knowledge Assessment - Aynstyn';
    case '/profile':
      return 'Your Profile - Aynstyn';
    case '/auth':
      return 'Sign In - Aynstyn';
    default:
      return 'Aynstyn - Identify Knowledge Gaps';
  }
}

function getPageMetadata(path: string) {
  switch (path) {
    case '/':
      return {
        description: 'Aynstyn is an AI-powered knowledge assessment platform that helps you identify gaps in your understanding and improve your learning efficiency.'
      };
    case '/assessment':
      return {
        description: 'Take an AI-powered assessment to identify gaps in your knowledge and get personalized recommendations.'
      };
    case '/profile':
      return {
        description: 'View your assessment history and track your progress across different subjects.'
      };
    default:
      return {
        description: 'Aynstyn is an AI-powered platform that identifies knowledge gaps and provides personalized learning recommendations.'
      };
  }
}