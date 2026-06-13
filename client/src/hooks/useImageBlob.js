import { useState, useEffect } from 'react';

/**
 * Custom React hook that pre-fetches an image URL as a binary Blob
 * and converts it into a local same-origin object URL. 
 * This enables ColorThief to analyze canvas pixels without CORS taints.
 *
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Object} { displayUrl, isBlobLoaded }
 */
export const useImageBlob = (imageUrl) => {
  const [displayUrl, setDisplayUrl] = useState(imageUrl);
  const [isBlobLoaded, setIsBlobLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    // Skip pre-fetching for local assets, data URIs, or already-blob URLs
    if (
      imageUrl.startsWith('blob:') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('/') ||
      imageUrl.startsWith('.')
    ) {
      setDisplayUrl(imageUrl);
      setIsBlobLoaded(true);
      return;
    }

    let active = true;
    let localUrl = null;

    const fetchImage = async () => {
      try {
        // Use a public CORS proxy to bypass server-side CORS restrictions during fetch
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Proxy fetch failed');
        const blob = await response.blob();

        if (active) {
          localUrl = URL.createObjectURL(blob);
          setDisplayUrl(localUrl);
          setIsBlobLoaded(true);
        }
      } catch (error) {
        console.warn('Failed to fetch image via proxy, attempting direct fetch:', error.message);
        try {
          const response = await fetch(imageUrl, { mode: 'cors' });
          if (!response.ok) throw new Error('Direct fetch failed');
          const blob = await response.blob();
          
          if (active) {
            localUrl = URL.createObjectURL(blob);
            setDisplayUrl(localUrl);
            setIsBlobLoaded(true);
          }
        } catch (directError) {
          console.warn('Direct fetch also failed:', directError.message);
          if (active) {
            setDisplayUrl(imageUrl);
            setIsBlobLoaded(false);
          }
        }
      }
    };

    fetchImage();

    // Cleanup: Revoke object URL to prevent memory leaks
    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [imageUrl]);

  return { displayUrl, isBlobLoaded };
};

export default useImageBlob;
