"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades + slides its children in when they scroll into view.
 * Works with server-rendered children (passed through as-is).
 *
 * Props: delay (ms), className, as (element tag), y (px offset).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  y = 24,
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If IntersectionObserver is unavailable, just show it.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
      }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
