import React from "react";
import { motion } from "motion/react";

/**
 * ScrollReveal - A minimalist scroll animation wrapper
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elements to animate
 * @param {"up" | "down" | "left" | "right" | "none"} props.direction - Direction of the slide (default: "up")
 * @param {number} props.delay - Animation delay in seconds (default: 0)
 * @param {number} props.duration - Animation duration in seconds (default: 0.4)
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.distance - Distance of the translation in pixels (default: 20)
 * @param {boolean} props.once - Whether to animate only once (default: true)
 */
const ScrollReveal = ({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 0.4, 
  className = "", 
  distance = 20,
  once = true 
}) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
      x: direction === "left" ? distance : direction === "right" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Custom Cubic-Bezier for smoothness
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
