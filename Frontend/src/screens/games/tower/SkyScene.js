import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

export default function SkyScene({ collapsed }) {
  const { width, height } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const a = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] });
  const b = drift.interpolate({ inputRange: [0, 1], outputRange: [16, -20] });

  const top = collapsed ? '#7B8BA8' : '#4C8DFF';
  const mid = collapsed ? '#C5CDD8' : '#A9D2FF';
  const bot = collapsed ? '#E8D9C4' : '#FFE7B0';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="ktSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="0.52" stopColor={mid} />
            <Stop offset="1" stopColor={bot} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#ktSky)" />
        <Circle cx={width * 0.82} cy={height * 0.12} r={38} fill={collapsed ? '#D6D3D1' : '#FFE08A'} />
        <Circle cx={width * 0.82} cy={height * 0.12} r={26} fill={collapsed ? '#E7E5E4' : '#FFF4C8'} opacity={0.85} />
      </Svg>
      <Animated.View style={[styles.cloud, { top: 56, left: 18, transform: [{ translateX: a }] }]}>
        <Cloud />
      </Animated.View>
      <Animated.View style={[styles.cloud, { top: 110, right: 10, transform: [{ translateX: b }] }]}>
        <Cloud scale={0.72} />
      </Animated.View>
      <Animated.View style={[styles.cloud, { top: 168, left: width * 0.38, transform: [{ translateX: a }] }]}>
        <Cloud scale={0.55} />
      </Animated.View>
    </View>
  );
}

function Cloud({ scale = 1 }) {
  return (
    <Svg width={110 * scale} height={42 * scale} viewBox="0 0 110 42">
      <Ellipse cx="38" cy="26" rx="28" ry="14" fill="#FFFFFF" opacity={0.88} />
      <Ellipse cx="62" cy="22" rx="24" ry="16" fill="#FFFFFF" opacity={0.92} />
      <Ellipse cx="84" cy="28" rx="18" ry="12" fill="#FFFFFF" opacity={0.86} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute' },
});
