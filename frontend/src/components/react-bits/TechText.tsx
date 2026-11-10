// TechText: Texto animado estilo terminal cyberpunk / glitch técnico de React Bits
// https://reactbits.dev/text-animations/tech-text
import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleSheet, StyleProp, Platform } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setDisplayText(text);
    setIsGlitching(false);
    if (reducedMotion) return;
    let frameTimer: ReturnType<typeof setInterval> | undefined;
    let running = false;
    const runGlitch = () => {
      if (running) return;
      running = true;
      setIsGlitching(true);
      let step = 0;
      frameTimer = setInterval(() => {
        step += 1;
        const glitched = text.split('').map((char) => {
          if (char === ' ' || char === '.' || step >= 8) return char;
          return Math.random() < 0.35
            ? TECH_SYMBOLS[Math.floor(Math.random() * TECH_SYMBOLS.length)]
            : char;
        }).join('');
        setDisplayText(glitched);
        if (step >= 10) {
          clearInterval(frameTimer);
          frameTimer = undefined;
          setDisplayText(text);
          setIsGlitching(false);
          running = false;
        }
      }, speed);
    };
    const initTimer = setTimeout(runGlitch, 400);
    const periodicTimer = setInterval(runGlitch, glitchInterval);
    return () => {
      clearTimeout(initTimer);
      clearInterval(periodicTimer);
      if (frameTimer) clearInterval(frameTimer);
    };
  }, [text, speed, glitchInterval, reducedMotion]);

  return (
    <Text
      accessibilityLabel={text}
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
