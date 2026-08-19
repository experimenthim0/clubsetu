import React from 'react';

/**
 * ShimmerText — Modern AI-style shimmering text loader.
 * Features a soft, bright shine continuously sweeping from left to right across the letters.
 * 
 * Props:
 *  - text (string): Text to display (e.g., "Loading...", "Loading event...")
 *  - className (string): Additional custom styling / font size / layout classes
 *  - ariaLabel (string): Accessibility label (defaults to "Loading")
 *  - style (object): Optional inline styles
 */
export default function ShimmerText({
  text = 'Loading...',
  className = '',
  ariaLabel,
  style = {},
  ...rest
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || (typeof text === 'string' ? text : 'Loading')}
      className={`ai-shimmer-text font-medium tracking-wide ${className}`}
      style={style}
      {...rest}
    >
      {text}
    </span>
  );
}
