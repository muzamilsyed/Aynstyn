import { useState, useEffect } from 'react';

interface LocationData {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData>({
    country: null,
    countryCode: null,
    city: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from IP geolocation service
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          setLocation({
            country: data.country_name,
            countryCode: data.country_code,
            city: data.city,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error('Failed to fetch location');
        }
      } catch (error) {
        // Fallback: try another service
        try {
          const fallbackResponse = await fetch('https://api.ipify.org?format=json');
          if (fallbackResponse.ok) {
            const ipData = await fallbackResponse.json();
            // For demo purposes, we'll assume if we can't get country, we'll default to non-India
            setLocation({
              country: null,
              countryCode: null,
              city: null,
              isLoading: false,
              error: 'Could not determine location',
            });
          }
        } catch (fallbackError) {
          setLocation({
            country: null,
            countryCode: null,
            city: null,
            isLoading: false,
            error: 'Failed to detect location',
          });
        }
      }
    };

    detectLocation();
  }, []);

  return location;
}

export function useIsIndianUser() {
  const location = useGeolocation();
  
  return {
    isFromIndia: location.countryCode === 'IN',
    isLoading: location.isLoading,
    error: location.error,
    location,
  };
}