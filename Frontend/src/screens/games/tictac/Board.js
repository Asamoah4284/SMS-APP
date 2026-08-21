import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MarkO, MarkX } from './Marks';

export default function TicTacBoard({
  board,
  pending,
  rivalCell,
  winLine,
  onPress,
  disabled,
}) {
  const { width, height } = useWindowDimensions();
  const size = Math.round(Math.min(width - 48, 300, height * 0.36));
  const markSize = Math.max(28, Math.round(size / 7));

  return (
    <View style={[styles.wood, { width: size }]}>
      <View style={styles.inner}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2].map((col) => {
              const i = row * 3 + col;
              const cell = board[i];
              const won = winLine?.includes(i);
              const glow = pending === i || rivalCell === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => onPress(i)}
                  disabled={disabled || !!cell}
                  style={({ pressed }) => [
                    styles.cell,
                    won && styles.cellWin,
                    glow && styles.cellGlow,
                    pressed && !cell && !disabled && styles.cellPress,
                  ]}
                >
                  {cell === 'X' ? <MarkX size={markSize} /> : cell === 'O' ? <MarkO size={markSize} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wood: {
    alignSelf: 'center',
    backgroundColor: '#9A5B2A',
    borderRadius: 22,
    padding: 10,
    borderBottomWidth: 6,
    borderBottomColor: '#6B3A16',
    aspectRatio: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: '#C4894C',
    borderRadius: 14,
    padding: 7,
    gap: 7,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F6E6C8',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D4B483',
  },
  cellWin: {
    backgroundColor: '#FDE68A',
    borderBottomColor: '#C9A020',
  },
  cellGlow: {
    backgroundColor: '#FFEDD5',
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  cellPress: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#FFF7ED',
  },
});
