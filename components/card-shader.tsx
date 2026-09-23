'use client';
import { useEffect, useRef } from 'react';
import { registerCardShader, unregisterCardShader } from '@/lib/card-shader-gl';

/** WebGL foil for rare and legendary cards; falls back to the CSS foil when WebGL is unavailable. */
export function CardShader({ legendary }: { legendary: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, host = canvas?.parentElement;
    if (!canvas || !host || !registerCardShader(canvas, host, legendary)) return;
    host.classList.add('has-shader');
    return () => { unregisterCardShader(canvas); host.classList.remove('has-shader'); };
  }, [legendary]);
  return <canvas ref={ref} className="card-shader" aria-hidden="true" />;
}
