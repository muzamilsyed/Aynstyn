import { useEffect, useState } from "react";

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface DynamicTimelineProps {
  subject: string;
  language?: string; // Optional language parameter for multilingual support
}

export default function DynamicTimeline({ subject, language }: DynamicTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subject) return;

    setIsLoading(true);
    setError(null);
    
    // Enhanced language detection - check for language in component props
    // or detect from page content as fallback
    const detectLanguageFromPage = (): string => {
      // Look for non-English content in the page to detect language
      // This helps when the language param isn't being passed correctly
      const pageText = document.body.innerText;
      
      // Simple detection based on character sets and common phrases
      if (/[\u0900-\u097F]/.test(pageText)) return 'hi'; // Hindi
      if (/[\u0600-\u06FF]/.test(pageText)) return 'ar'; // Arabic
      if (/[\u0A80-\u0AFF]/.test(pageText)) return 'gu'; // Gujarati
      
      // Detect French using common words and accented characters
      if (/[àáâäæçèéêëìíîïòóôœùúûüÿ]/.test(pageText) || 
          /\b(Votre|compréhension|de la|gestion|produit|est|et|les|du)\b/i.test(pageText)) {
        return 'fr'; // French
      }
      
      return 'en'; // Default to English
    };
    
    // Use provided language, or try to detect it
    const detectedLanguage = language || detectLanguageFromPage();
    console.log("Timeline using language:", detectedLanguage);
    
    // Include language in the API request
    const url = `/api/timeline/${encodeURIComponent(subject)}?language=${encodeURIComponent(detectedLanguage)}`;
      
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Timeline request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Timeline data received:", data);
        if (data.timeline && Array.isArray(data.timeline)) {
          setTimeline(data.timeline);
        } else {
          setError("Invalid timeline data format");
        }
      })
      .catch(err => {
        console.error("Error fetching timeline:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [subject]);

  // Colors for the timeline nodes
  const colors = [
    "bg-amber-600", // First event
    "bg-blue-600",  // Second event
    "bg-green-600", // Third event
    "bg-purple-600", // Fourth event
    "bg-red-600",   // Fifth event
    "bg-gray-800"   // Sixth/last event
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
          <p className="text-sm text-gray-600">Generating timeline for {subject}...</p>
        </div>
      </div>
    );
  }

  if (error || timeline.length === 0) {
    // Fallback timeline when there's an error
    const fallbackTimeline = [
      {
        year: "Pre-1900s",
        title: "Early Foundations",
        description: "Initial concepts and theories"
      },
      {
        year: "1900-1950",
        title: "Early Development",
        description: "Fundamental discoveries"
      },
      {
        year: "1950-1970",
        title: "Expansion",
        description: "Broadening applications"
      },
      {
        year: "1970-1990",
        title: "Technological Advances",
        description: "Research breakthroughs"
      },
      {
        year: "1990-2010",
        title: "Digital Revolution",
        description: "Internet and global connectivity"
      },
      {
        year: "Present",
        title: "Current State",
        description: "Modern applications and research"
      }
    ];

    console.log("Using fallback timeline due to error:", error);
    
    return (
      <div className="relative">
        {/* Horizontal connecting line */}
        <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-300"></div>
        
        <div className="flex justify-between overflow-x-auto">
          {fallbackTimeline.map((event, index) => (
            <div key={index} className="flex flex-col items-center text-center px-4 min-w-[130px]">
              <div className="font-semibold text-xs text-gray-500 mb-2">
                {event.year}
              </div>
              <div className={`w-5 h-5 rounded-full ${colors[index % colors.length]} z-10 mb-2 shadow-sm`}></div>
              <h4 className="text-sm font-medium">
                {event.title}
              </h4>
              <p className="text-xs text-gray-600">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Horizontal connecting line */}
      <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-300"></div>
      
      <div className="flex justify-between overflow-x-auto">
        {timeline.map((event, index) => (
          <div key={index} className="flex flex-col items-center text-center px-4 min-w-[130px]">
            <div className="font-semibold text-xs text-gray-500 mb-2">
              {event.year}
            </div>
            <div className={`w-5 h-5 rounded-full ${colors[index % colors.length]} z-10 mb-2 shadow-sm`}></div>
            <h4 className="text-sm font-medium">
              {event.title}
            </h4>
            <p className="text-xs text-gray-600">
              {event.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}