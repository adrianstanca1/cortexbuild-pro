"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = "",
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(0);

  useEffect(() => {
    if (value === previousValue.current) return;
    
    setIsAnimating(true);
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span className={cn("tabular-nums", isAnimating && "transition-transform", className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Animated percentage
export function AnimatedPercentage({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <AnimatedCounter
      value={value}
      suffix="%"
      className={className}
      duration={800}
    />
  );
}

// Animated currency
export function AnimatedCurrency({
  value,
  currency = "£",
  className
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  return (
    <AnimatedCounter
      value={value}
      prefix={currency}
      className={className}
      duration={1000}
    />
  );
}
