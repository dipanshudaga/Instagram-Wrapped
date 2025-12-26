import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface NumberCounterProps {
  value: number;
  duration?: number;
  fontSize?: string;
  onComplete?: () => void;
}

export function NumberCounter({ value, duration = 0.4, fontSize = '140px', onComplete }: NumberCounterProps) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);

      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCount(Math.floor(eased * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, onComplete]);

  return (
    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize, letterSpacing: '-0.04em' }}>
      {count.toLocaleString()}
    </span>
  );
}
