import { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function strokeToD(points, size) {
  if (!points?.length) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * size} ${p.y * size}`).join(' ');
}

function pagePoint(evt) {
  const n = evt.nativeEvent || {};
  const t = (n.touches && n.touches[0]) || {};
  return {
    x: n.pageX ?? t.pageX ?? 0,
    y: n.pageY ?? t.pageY ?? 0,
  };
}

export default function DrawCanvas({
  strokes,
  onChange,
  enabled,
  size,
  color = '#1B4480',
  width = 5,
}) {
  const viewRef = useRef(null);
  const origin = useRef({ x: 0, y: 0, w: size, h: size });
  const strokesRef = useRef(strokes);
  const currentRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const enabledRef = useRef(enabled);
  const raf = useRef(null);

  strokesRef.current = currentRef.current ? strokesRef.current : strokes;
  onChangeRef.current = onChange;
  colorRef.current = color;
  widthRef.current = width;
  enabledRef.current = enabled;

  const measure = () => {
    viewRef.current?.measureInWindow((x, y, w, h) => {
      origin.current = { x, y, w: w || size, h: h || size };
    });
  };

  const toNorm = (evt) => {
    const page = pagePoint(evt);
    const { x, y, w, h } = origin.current;
    return {
      x: Math.max(0, Math.min(1, (page.x - x) / (w || 1))),
      y: Math.max(0, Math.min(1, (page.y - y) / (h || 1))),
    };
  };

  const flush = () => {
    raf.current = null;
    onChangeRef.current(strokesRef.current.map((s) => ({
      ...s,
      points: s.points.slice(),
    })));
  };

  const schedule = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(flush);
  };

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabledRef.current,
      onMoveShouldSetPanResponder: () => enabledRef.current,
      onStartShouldSetPanResponderCapture: () => enabledRef.current,
      onMoveShouldSetPanResponderCapture: () => enabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!enabledRef.current) return;
        measure();
        const pt = toNorm(evt);
        currentRef.current = {
          color: colorRef.current,
          width: widthRef.current,
          points: [pt],
        };
        strokesRef.current = [...strokesRef.current, currentRef.current];
        schedule();
      },
      onPanResponderMove: (evt) => {
        if (!enabledRef.current || !currentRef.current) return;
        const pt = toNorm(evt);
        const pts = currentRef.current.points;
        const prev = pts[pts.length - 1];
        if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.002) return;
        pts.push(pt);
        schedule();
      },
      onPanResponderRelease: () => {
        currentRef.current = null;
        schedule();
      },
      onPanResponderTerminate: () => {
        currentRef.current = null;
        schedule();
      },
    }),
  ).current;

  return (
    <View
      ref={viewRef}
      collapsable={false}
      onLayout={measure}
      {...(enabled ? responder.panHandlers : {})}
      style={[styles.canvas, { width: size, height: size }]}
    >
      <Svg width={size} height={size} pointerEvents="none">
        {(strokes || []).map((stroke, i) => (
          <Path
            key={i}
            d={strokeToD(stroke.points, size)}
            stroke={stroke.color || '#1B4480'}
            strokeWidth={stroke.width || 5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FAF8F2',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#99F6E4',
  },
});
