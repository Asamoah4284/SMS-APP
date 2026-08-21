import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme';

const NAVY = colors.brandNavy;
const GOLD = colors.brandGold;
const SKIN = '#F6D7B0';
const SHIRT = '#1B4480';

export default function HangmanHero({ lives, won, lost }) {
  const missed = Math.max(0, Math.min(6, 6 - lives));
  const shake = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const prevMissed = useRef(missed);

  useEffect(() => {
    if (missed > prevMissed.current) {
      Animated.sequence([
        Animated.timing(pop, { toValue: 1.08, duration: 90, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevMissed.current = missed;
  }, [missed, pop, shake]);

  useEffect(() => {
    if (!lost) {
      sway.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lost, sway]);

  useEffect(() => {
    if (!won) {
      bounce.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [won, bounce]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const ty = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const showHead = missed >= 1 || won;
  const showBody = missed >= 2 || won;
  const showArmL = missed >= 3 || won;
  const showArmR = missed >= 4 || won;
  const showLegL = missed >= 5 || won;
  const showLegR = missed >= 6 || won;

  return (
    <Animated.View style={{ transform: [{ scale: pop }, { translateX: tx }, { translateY: ty }, { rotate }] }}>
      <Svg width={280} height={268} viewBox="0 0 200 200">
        <Ellipse cx="100" cy="188" rx="70" ry="8" fill="#E8EEF7" />
        <Rect x="28" y="176" width="90" height="10" rx="3" fill="#8B5A2B" />
        <Rect x="42" y="22" width="10" height="154" rx="3" fill="#8B5A2B" />
        <Rect x="42" y="18" width="86" height="10" rx="3" fill="#A06A33" />
        <Line x1="52" y1="42" x2="78" y2="22" stroke="#A06A33" strokeWidth="6" />
        {!won && <Line x1="118" y1="28" x2="118" y2={showHead ? 48 : 62} stroke="#C9A020" strokeWidth="3" />}

        <G>
          {showArmL && (
            <Path
              d={won ? 'M118 88 Q96 70 90 58' : 'M118 86 Q98 102 92 118'}
              stroke={SHIRT}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {showArmR && (
            <Path
              d={won ? 'M118 88 Q140 70 146 58' : 'M118 86 Q138 102 144 118'}
              stroke={SHIRT}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {showLegL && (
            <Path d="M112 128 Q104 148 98 168" stroke="#2A4A8A" strokeWidth="8" fill="none" strokeLinecap="round" />
          )}
          {showLegR && (
            <Path d="M124 128 Q132 148 138 168" stroke="#2A4A8A" strokeWidth="8" fill="none" strokeLinecap="round" />
          )}
          {showLegL && <Ellipse cx="96" cy="172" rx="8" ry="5" fill={GOLD} />}
          {showLegR && <Ellipse cx="140" cy="172" rx="8" ry="5" fill={GOLD} />}
          {showBody && <Rect x="104" y="78" width="28" height="50" rx="12" fill={SHIRT} />}
          {showHead && (
            <G>
              <Circle cx="118" cy="62" r="18" fill={SKIN} />
              <Circle cx="118" cy="62" r="18" fill="none" stroke={NAVY} strokeWidth="2" />
              {lost ? (
                <>
                  <Path d="M110 56 L114 60 M114 56 L110 60" stroke={NAVY} strokeWidth="2" />
                  <Path d="M122 56 L126 60 M126 56 L122 60" stroke={NAVY} strokeWidth="2" />
                  <Path d="M111 72 Q118 68 125 72" stroke={NAVY} strokeWidth="2" fill="none" />
                </>
              ) : (
                <>
                  <Circle cx="112" cy="60" r="2.2" fill={NAVY} />
                  <Circle cx="124" cy="60" r="2.2" fill={NAVY} />
                  <Path
                    d={won ? 'M110 68 Q118 76 126 68' : missed >= 4 ? 'M111 70 Q118 68 125 70' : 'M111 68 Q118 73 125 68'}
                    stroke={NAVY}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {won && <Path d="M108 64 Q112 66 112 62" stroke="#E8899A" strokeWidth="2" fill="none" />}
                </>
              )}
            </G>
          )}
        </G>
      </Svg>
      <View style={{ height: 0 }} />
    </Animated.View>
  );
}
