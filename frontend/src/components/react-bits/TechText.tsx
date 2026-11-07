// TechText: Texto animado estilo terminal cyberpunk / glitch técnico de React Bits
// https://reactbits.dev/text-animations/tech-text
import React, { useEffect, useState, useRef } from 'react';
import { Text, TextStyle, StyleSheet, StyleProp, Platform } from 'react-native';

interface TechTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  color?: string;
  glowColor?: string;
  speed?: number; // ms entre glitches
  glitchInterval?: number; // ms entre ráfagas de glitch
}

const TECH_SYMBOLS = '0123456789ABCDEF_~<>#/*$!%';

export const TechText: React.FC<TechTextProps> = ({
  text,
  style,
  color = '#F59E0B',
  glowColor = 'rgba(245, 158, 11, 0.4)',
  speed = 40,
  glitchInterval = 4500
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const timerRef = useRef<any>(null);

  const runGlitch = () => {
    setIsGlitching(true);
    let step = 0;
    const maxSteps = 10;

    const interval = setInterval(() => {
      step++;
      const glitched = text
        .split('')
        .map((char, i) => {
          if (char === ' ' || char === '.') return char;
          // Glitch aleatorio en un 30% de los caracteres
          if (Math.random() < 0.35 && step < maxSteps - 2) {
            return TECH_SYMBOLS[Math.floor(Math.random() * TECH_SYMBOLS.length)];
          }
          return char;
        })
        .join('');

      setDisplayText(glitched);

      if (step >= maxSteps) {
        clearInterval(interval);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, speed);
  };

  useEffect(() => {
    // Glitch inicial al montar
    const initTimer = setTimeout(runGlitch, 400);

    // Glitch periódico
    const periodicTimer = setInterval(runGlitch, glitchInterval);

    return () => {
      clearTimeout(initTimer);
      clearInterval(periodicTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, glitchInterval]);

  return (
    <Text
      style={[
        styles.text,
        { color },
        Platform.OS === 'web' && {
          textShadow: isGlitching
            ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 2px 0 0 rgba(0, 229, 255, 0.4)`
            : `0 0 8px ${glowColor}`,
          letterSpacing: 2,
          transition: 'text-shadow 0.2s ease'
        } as any,
        style
      ]}
    >
      {displayText}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'Courier New',
      android: 'monospace',
      default: '"JetBrains Mono", Consolas, monospace'
    }),
    fontWeight: '800'
  }
});
