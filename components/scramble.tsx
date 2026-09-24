'use client';
// v9.18.3 Mystery fare: a sealed number shown as a flickering, glitching readout instead of a range.
import { useEffect, useState } from 'react';

const DIGITS = '0123456789', SIGNS = '#$%&?@*§¥';
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
// Always at least one sign, so a frame can never be mistaken for a real fare.
const roll = (length: number) => { const at = Math.floor(Math.random() * length); return Array.from({ length }, (_, i) => (i === at ? pick(SIGNS) : pick(DIGITS + SIGNS))).join(''); };

export function Scramble({ length = 2, className = '' }: { length?: number; className?: string }) {
  const [text, setText] = useState(() => '?'.repeat(length));
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setText(roll(length)), 90);
    return () => window.clearInterval(id);
  }, [length]);
  return <span className={`scramble ${className}`} data-no-translate aria-label="?" data-text={text}>{text}</span>;
}
