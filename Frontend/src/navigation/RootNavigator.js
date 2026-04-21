import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Platform, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FeesScreen from '../screens/FeesScreen';
import ExaminationScreen from '../screens/ExaminationScreen';
import GradesScreen from '../screens/GradesScreen';
import TimetableScreen from '../screens/TimetableScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import CustomTabBar from './CustomTabBar';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** Native stack: smooth push/pop, swipe-back on iOS, slide-from-right on Android, no white flash */
const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  ...(Platform.OS === 'android' ? { animation: 'slide_from_right' } : {}),
};

/** Bottom tabs: light cross-fade when switching main sections */
const tabScreenOptions = {
  headerShown: false,
  animation: 'fade',
  transitionSpec: {
    animation: 'timing',
    config: { duration: 280, useNativeDriver: true },
  },
};

// ─── Overview stack ───────────────────────────────────────────────────────────
// Keeps all "drill-down" screens reachable from Home via push navigation.
function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="Attendance"  component={AttendanceScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Examination" component={ExaminationScreen} />
      <Stack.Screen name="Grades"      component={GradesScreen} />
      <Stack.Screen name="Timetable"   component={TimetableScreen} />
    </Stack.Navigator>
  );
}

// ─── Fees stack ───────────────────────────────────────────────────────────────
function FeesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="FeesHome"    component={FeesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

// ─── Attendance stack ─────────────────────────────────────────────────────────
function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AttendanceMain" component={AttendanceScreen} />
    </Stack.Navigator>
  );
}

// ─── Main 5-tab navigator ─────────────────────────────────────────────────────
// Tab order matters — index 2 is the center rounded "Fees" button:
//   0: Overview  |  1: Attendance  |  2: Fees (center)  |  3: Examination  |  4: Performance
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={tabScreenOptions}
    >
      <Tab.Screen name="Overview"    component={OverviewStack} />
      <Tab.Screen name="Attendance"  component={AttendanceStack} />
      <Tab.Screen name="Fees"        component={FeesStack} />
      <Tab.Screen name="Examination" component={ExaminationScreen} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { token, student, status } = useAuth();

  // Show a blank screen while AsyncStorage is being read
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.iconBlue} />
      </View>
    );
  }

  const isAuthenticated = !!token && !!student;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // Authenticated → show the main tabbed app
        <MainTabs />
      ) : (
        // Not authenticated → phone lookup + child selection
        <Stack.Navigator screenOptions={stackScreenOptions}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
