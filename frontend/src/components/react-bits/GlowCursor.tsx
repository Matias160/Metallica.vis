// GlowCursor: Cursor ambiental con halo de luz reactivo y estela suave (React Bits)
// https://reactbits.dev/animations/glow-cursor
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface GlowCursorProps {
  color?: string;
  size?: number;
  glowOpacity?: number;
}

export const GlowCursor: React.FC<GlowCursorProps> = ({
  color = 'rgba(245, 158, 11, 0.14)',
  size = 320,
  glowOpacity = 0.85
}) => {
  const [pos, setPos] = useState({ x: -500, y: -500, isVisible: false });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Solo activar si no es un dispositivo exclusivamente táctil
    const isTouchOnly = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchOnly) return;

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!pos.isVisible) {
        setPos((prev) => ({ ...prev, isVisible: true }));
      }
    };

    const handleMouseLeave = () => {
      setPos((prev) => ({ ...prev, isVisible: false }));
    };

    // Interpolación suave (lerp) para movimiento orgánico
    const loop = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      const cursorEl = document.getElementById('rb-glow-cursor');
      if (cursorEl) {
        cursorEl.style.transform = `translate3d(${currentX - size / 2}px, ${currentY - size / 2}px, 0)`;
      }

      const dotEl = document.getElementById('rb-glow-dot');
      if (dotEl) {
        dotEl.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0)`;
      }

      animationFrame = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, [size]);

  if (Platform.OS !== 'web') return null;

  return (
    <>
      {/* Halo de luz suave */}
      <div
        id="rb-glow-cursor"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: `radial-gradient(circle, ${color} 0%, rgba(245, 158, 11, 0.05) 45%, transparent 70%)`,
          zIndex: 99998,
          opacity: pos.isVisible ? glowOpacity : 0,
          transition: 'opacity 0.4s ease',
          willChange: 'transform'
        }}
      />
      {/* Núcleo de precisión sutil */}
      <div
        id="rb-glow-dot"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#F59E0B',
          boxShadow: '0 0 10px #F59E0B, 0 0 20px #F59E0B',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: pos.isVisible ? 0.6 : 0,
          transition: 'opacity 0.3s ease',
          willChange: 'transform'
        }}
      />
    </>
  );
};
