import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { colors } from '../../../theme';

const GOLD = colors.brandGold;
const SKIN = '#F6D7B0';
const MAX_VISIBLE = 6;

export default function TowerHero({ floors = 0, collapsed = false, compact = false, tint = colors.brandNavy }) {
  const pop = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const prevFloors = useRef(floors);

  useEffect(() => {
    if (floors > prevFloors.current) {
      Animated.sequence([
        Animated.timing(pop, { toValue: 1.07, duration: 140, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
    prevFloors.current = floors;
  }, [floors, pop]);

  useEffect(() => {
    if (!collapsed) {
      sway.setValue(0);
      return undefined;
    }
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [collapsed, shake, sway]);

  useEffect(() => {
    if (collapsed || floors < 2) {
      bounce.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, collapsed, floors]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });
  const ty = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  const visible = Math.min(Math.max(floors, 0), MAX_VISIBLE);
  const extra = Math.max(0, floors - MAX_VISIBLE);
  const floorH = 22;
  const bodyW = 84;
  const left = 78;
  const groundY = 228;
  const foundationH = 16;
  const roofH = 26;
  const bodyBottom = groundY - foundationH;
  const roofTop = visible > 0 ? bodyBottom - visible * floorH : bodyBottom - floorH;

  const width = compact ? 168 : 260;
  const height = compact ? 230 : 300;

  const builderX = visible > 0 ? left + bodyW / 2 : 48;
  const builderY = visible > 0 ? roofTop - roofH - 18 : groundY - 38;

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }, { translateX: tx }, { translateY: ty }, { rotate }] }}>
      <Svg width={width} height={height} viewBox="0 0 240 260">
        <Ellipse cx="120" cy="246" rx="96" ry="10" fill="#000" opacity={0.08} />
        <Path d="M0 232 C40 214 80 222 120 218 C170 214 210 226 240 220 L240 260 L0 260 Z" fill="#7BC45A" />
        <Path d="M0 240 C50 228 90 236 140 230 C180 226 210 236 240 232 L240 260 L0 260 Z" fill="#5FA644" />
        <Path d="M96 232 L120 236 L144 232 L150 238 L90 238 Z" fill="#C4A36A" />

        <Tree x={22} y={188} />
        <Tree x={198} y={192} small />

        <Rect x={left - 8} y={bodyBottom} width={bodyW + 16} height={foundationH} rx="3" fill="#8B5A2B" />
        <Rect x={left - 8} y={bodyBottom + 5} width={bodyW + 16} height={5} fill="#A06A33" />

        {visible === 0 ? (
          <G>
            <Rect x={left + 10} y={bodyBottom - 44} width="7" height="44" rx="1" fill="#E2E8F0" />
            <Rect x={left + bodyW - 18} y={bodyBottom - 58} width="7" height="58" rx="1" fill="#CBD5E1" />
            <Path d={`M${left + 13} ${bodyBottom - 40} L${left + bodyW - 15} ${bodyBottom - 52}`} stroke="#94A3B8" strokeWidth="3" />
            <Rect x={left + 28} y={bodyBottom - 18} width="28" height="10" rx="2" fill="#F97316" />
            <Rect x={left + 30} y={bodyBottom - 26} width="24" height="8" rx="1" fill="#FB923C" />
          </G>
        ) : (
          Array.from({ length: visible }).map((_, i) => {
            const y = bodyBottom - (i + 1) * floorH;
            const topFloor = i === visible - 1;
            const brick = i % 2 === 0 ? tint : shade(tint);
            return (
              <G key={i}>
                <Rect x={left} y={y} width={bodyW} height={floorH - 1} fill={brick} />
                <Rect x={left} y={y} width={4} height={floorH - 1} fill="#0F2A52" opacity={0.18} />
                <Rect x={left + bodyW - 4} y={y} width={4} height={floorH - 1} fill="#0F2A52" opacity={0.18} />
                <Rect x={left} y={y} width={bodyW} height={3} fill={topFloor ? GOLD : '#F8FAFC'} opacity={topFloor ? 1 : 0.22} />
                {i === 0 ? (
                  <Path d={`M${left + 32} ${y + 21} Q${left + 42} ${y + 6} ${left + 52} ${y + 21}`} fill={collapsed ? '#64748B' : '#7C4A1A'} />
                ) : (
                  <>
                    <Window x={left + 14} y={y + 6} dead={collapsed} />
                    <Window x={left + 36} y={y + 6} dead={collapsed} />
                    <Window x={left + 58} y={y + 6} dead={collapsed} />
                  </>
                )}
              </G>
            );
          })
        )}

        {visible > 0 ? (
          <G>
            <Polygon
              points={`${left - 10},${roofTop} ${left + bodyW / 2},${roofTop - roofH} ${left + bodyW + 10},${roofTop}`}
              fill={collapsed ? '#94A3B8' : '#B91C1C'}
            />
            <Polygon
              points={`${left - 2},${roofTop} ${left + bodyW / 2},${roofTop - roofH + 8} ${left + bodyW + 2},${roofTop}`}
              fill={collapsed ? '#CBD5E1' : '#DC2626'}
            />
            <Rect x={left + bodyW / 2 - 2} y={roofTop - roofH - 26} width="4" height="26" fill="#475569" />
            <Polygon
              points={`${left + bodyW / 2 + 2},${roofTop - roofH - 26} ${left + bodyW / 2 + 28},${roofTop - roofH - 18} ${left + bodyW / 2 + 2},${roofTop - roofH - 10}`}
              fill={GOLD}
            />
          </G>
        ) : null}

        <Builder x={builderX} y={builderY} sad={collapsed} onRoof={visible > 0} />
      </Svg>
      <View style={{
        marginTop: compact ? -18 : -22,
        backgroundColor: 'rgba(15,23,42,0.78)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
      }}
      >
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: compact ? 13 : 15 }}>
          {floors} {floors === 1 ? 'floor' : 'floors'}{extra ? `  ·  +${extra}` : ''}
        </Text>
      </View>
    </Animated.View>
  );
}

function Window({ x, y, dead }) {
  return (
    <G>
      <Rect x={x} y={y} width={12} height={11} rx="1.5" fill={dead ? '#94A3B8' : '#FDE68A'} />
      <Path d={`M${x + 6} ${y} V${y + 11} M${x} ${y + 5.5} H${x + 12}`} stroke="#1B4480" strokeWidth="0.8" opacity={0.45} />
    </G>
  );
}

function Tree({ x, y, small }) {
  const s = small ? 0.82 : 1;
  return (
    <G>
      <Rect x={x + 10 * s} y={y + 28 * s} width={7 * s} height={18 * s} fill="#7A4A22" />
      <Circle cx={x + 14 * s} cy={y + 22 * s} r={16 * s} fill="#3F9B4A" />
      <Circle cx={x + 4 * s} cy={y + 28 * s} r={11 * s} fill="#4CAF50" />
      <Circle cx={x + 22 * s} cy={y + 28 * s} r={11 * s} fill="#2E7D32" />
    </G>
  );
}

function Builder({ x, y, sad, onRoof }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 28} rx="8" ry="3" fill="#000" opacity={0.12} />
      <Circle cx={x} cy={y} r="8" fill={SKIN} />
      <Path d={`M${x - 8} ${y - 1} Q${x} ${y - 11} ${x + 8} ${y - 1}`} fill={GOLD} />
      <Rect x={x - 7} y={y - 3} width="14" height="3" rx="1" fill="#A07C10" />
      {sad ? (
        <>
          <Path d={`M${x - 3} ${y - 1} L${x - 1} ${y + 1} M${x - 1} ${y - 1} L${x - 3} ${y + 1}`} stroke="#1B4480" strokeWidth="1.2" />
          <Path d={`M${x + 1} ${y - 1} L${x + 3} ${y + 1} M${x + 3} ${y - 1} L${x + 1} ${y + 1}`} stroke="#1B4480" strokeWidth="1.2" />
          <Path d={`M${x - 3} ${y + 5} Q${x} ${y + 3} ${x + 3} ${y + 5}`} stroke="#1B4480" strokeWidth="1.2" fill="none" />
        </>
      ) : (
        <>
          <Circle cx={x - 2.5} cy={y} r="1.2" fill="#1B4480" />
          <Circle cx={x + 2.5} cy={y} r="1.2" fill="#1B4480" />
          <Path d={`M${x - 3} ${y + 3.5} Q${x} ${y + 6} ${x + 3} ${y + 3.5}`} stroke="#1B4480" strokeWidth="1.2" fill="none" />
        </>
      )}
      <Rect x={x - 8} y={y + 8} width="16" height="16" rx="5" fill={colors.brandNavy} />
      <Rect x={x - 5} y={y + 11} width="10" height="5" rx="1" fill={GOLD} />
      {onRoof && !sad ? (
        <Path d={`M${x + 8} ${y + 12} Q${x + 18} ${y + 2} ${x + 16} ${y - 4}`} stroke={colors.brandNavy} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : (
        <Path d={`M${x + 8} ${y + 14} L${x + 14} ${y + 22}`} stroke={colors.brandNavy} strokeWidth="3.5" strokeLinecap="round" />
      )}
    </G>
  );
}

function shade(hex) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 18);
  const g = Math.max(0, ((n >> 8) & 255) - 14);
  const b = Math.max(0, (n & 255) - 8);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
