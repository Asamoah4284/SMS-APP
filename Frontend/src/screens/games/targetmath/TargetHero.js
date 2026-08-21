import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export default function TargetHero({ value, size = 132, hot }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={c - 2} fill="#9A3412" />
      <Circle cx={c} cy={c} r={c - 14} fill="#C2410C" />
      <Circle cx={c} cy={c} r={c - 28} fill="#F5F0E0" />
      <Circle cx={c} cy={c} r={c - 40} fill={hot ? '#FEF3C7' : '#FFFBEB'} />
      <SvgText
        x={c}
        y={c + 8}
        textAnchor="middle"
        fontSize={String(value).length > 3 ? 28 : 34}
        fontWeight="800"
        fill="#A07C10"
      >
        {String(value)}
      </SvgText>
    </Svg>
  );
}
