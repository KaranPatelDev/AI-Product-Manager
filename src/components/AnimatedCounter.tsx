import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Props {
  value: number;
  max?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, max = 10, duration = 1.2, suffix = "", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const step = value / (duration * 60);
    let raf: number;

    const tick = () => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        return;
      }
      setDisplay(Math.round(start * 10) / 10);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, duration]);

  const pct = (display / max) * 100;

  return (
    <motion.div
      ref={ref}
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <motion.circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 15.5}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 15.5 }}
            animate={isInView ? { strokeDashoffset: 2 * Math.PI * 15.5 * (1 - pct / 100) } : {}}
            transition={{ duration, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
          {Math.round(display * 10) / 10}{suffix}
        </span>
      </div>
    </motion.div>
  );
}
