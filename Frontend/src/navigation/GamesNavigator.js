import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import GamesScreen from '../screens/GamesScreen';
import GameLobbyScreen from '../screens/games/GameLobbyScreen';
import HangmanScreen from '../screens/games/HangmanScreen';
import KnowledgeTowerScreen from '../screens/games/KnowledgeTowerScreen';
import WordSmithScreen from '../screens/games/WordSmithScreen';
import TicTacTriviaScreen from '../screens/games/TicTacTriviaScreen';
import TargetMathScreen from '../screens/games/TargetMathScreen';
import ScribbleScreen from '../screens/games/ScribbleScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  ...(Platform.OS === 'android' ? { animation: 'slide_from_right' } : {}),
};

export default function GamesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="GamesHub" component={GamesScreen} />
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="Hangman" component={HangmanScreen} />
      <Stack.Screen name="KnowledgeTower" component={KnowledgeTowerScreen} />
      <Stack.Screen name="WordSmith" component={WordSmithScreen} />
      <Stack.Screen name="TicTacTrivia" component={TicTacTriviaScreen} />
      <Stack.Screen name="TargetMath" component={TargetMathScreen} />
      <Stack.Screen
        name="Scribble"
        component={ScribbleScreen}
        options={{ gestureEnabled: false, fullScreenGestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
