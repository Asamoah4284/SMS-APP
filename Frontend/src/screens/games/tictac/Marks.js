import Svg, { Circle, Line } from 'react-native-svg';

export function MarkX({ size = 44 }) {
  const pad = 10;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Line x1={pad} y1={pad} x2={48 - pad} y2={48 - pad} stroke="#1B4480" strokeWidth="7" strokeLinecap="round" />
      <Line x1={48 - pad} y1={pad} x2={pad} y2={48 - pad} stroke="#1B4480" strokeWidth="7" strokeLinecap="round" />
      <Line x1={pad} y1={pad} x2={48 - pad} y2={48 - pad} stroke="#C9A020" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function MarkO({ size = 44 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="14" fill="none" stroke="#C2410C" strokeWidth="7" />
      <Circle cx="24" cy="24" r="14" fill="none" stroke="#FB923C" strokeWidth="2.5" />
    </Svg>
  );
}
