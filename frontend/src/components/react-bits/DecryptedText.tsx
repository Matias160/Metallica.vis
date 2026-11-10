// DecryptedText: Texto desencriptado con ciclo de caracteres estilo consola / matriz analógica (React Bits)
import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

interface DecryptedTextProps {
  text: string;
  speed?: number; // Velocidad de cambio de frames en ms (default 40)
  maxIterations?: number; // Cuántas vueltas da cada caracter antes de fijarse
  characters?: string;
  style?: StyleProp<TextStyle>;
  animateOnMount?: boolean;
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=<>?/';

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 35,
  maxIterations = 8,
  characters = DEFAULT_CHARS,
  style,
  animateOnMount = true
}) => {
  const [displayText, setDisplayText] = useState<string>(animateOnMount ? '' : text);
  const reducedMotion = useReducedMotion();

  const startAnimation = () => {
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      iteration += 1 / (maxIterations / 2);

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, speed);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (animateOnMount && !reducedMotion) {
      const cleanup = startAnimation();
      return cleanup;
    } else {
      setDisplayText(text);
    }
  }, [text, animateOnMount, reducedMotion, speed, maxIterations, characters]);

  return (
    <Text accessibilityLabel={text} style={[styles.text, style]}>
      {displayText || text}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'monospace'
  }
});
