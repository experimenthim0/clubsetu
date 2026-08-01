import { useState, useEffect } from 'react';

/**
 * Custom React hook that pre-fetches an image URL as a binary Blob
 * and converts it into a local same-origin object URL. 
 * This enables ColorThief to analyze canvas pixels without CORS taints.
 *
 * @param {string} imageUrl - The URL of the image to fetch
 * @returns {Object} { displayUrl, isBlobLoaded }
 */
const blobCache = new Map();

export const useImageBlob = (imageUrl) => {
  const [displayUrl, setDisplayUrl] = useState(() => blobCache.get(imageUrl) || imageUrl);
  const [isBlobLoaded, setIsBlobLoaded] = useState(() => blobCache.has(imageUrl));

  useEffect(() => {
    if (!imageUrl) return;

    if (blobCache.has(imageUrl)) {
      setDisplayUrl(blobCache.get(imageUrl));
      setIsBlobLoaded(true);
      return;
    }

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

    const fetchImage = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        const response = await fetch(imageUrl, { mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Direct fetch failed');
        const blob = await response.blob();
        
        if (active) {
          const localUrl = URL.createObjectURL(blob);
          blobCache.set(imageUrl, localUrl);
          setDisplayUrl(localUrl);
          setIsBlobLoaded(true);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (active) {
          setDisplayUrl(imageUrl);
          setIsBlobLoaded(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [imageUrl]);

  return { displayUrl, isBlobLoaded };
};

export default useImageBlob;
