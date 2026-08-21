import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#1B4480', '#C9A020', '#16A34A', '#EA580C', '#7C3AED', '#0EA5E9', '#E11D48'];

export default function ConfettiBurst({ play }) {
  const { width } = useWindowDimensions();
  const pieces = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({
      key: i,
      left: ((i * 37) % Math.max(width - 16, 1)),
      color: COLORS[i % COLORS.length],
      delay: (i % 7) * 40,
      rotate: i % 2 === 0 ? '180deg' : '-180deg',
      size: 7 + (i % 5),
    })),
    [width],
  );

  if (!play) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.key} {...p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ left, color, delay, rotate, size }) {
  const y = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 520, duration: 1800 + delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 1800 + delay, useNativeDriver: true }),
      Animated.timing(spin, { toValue: 1, duration: 1800 + delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, spin, y]);

  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rotate] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left,
        width: size,
        height: size * 1.4,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }, { rotate: rot }],
      }}
    />
  );
}
