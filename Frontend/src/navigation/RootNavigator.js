import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FeesScreen from '../screens/FeesScreen';
import ExaminationScreen from '../screens/ExaminationScreen';
import ReportCardScreen from '../screens/ReportCardScreen';
import GradesScreen from '../screens/GradesScreen';
import LibraryScreen from '../screens/LibraryScreen';
import TimetableScreen from '../screens/TimetableScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import StudentAssistantScreen from '../screens/StudentAssistantScreen';
import GamesScreen from '../screens/GamesScreen';
import StudentAssistantScreen from '../screens/StudentAssistantScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import SplashScreen from '../screens/SplashScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import CustomTabBar from './CustomTabBar';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../services/pushNotifications';

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

/** Bottom tabs — avoid fade animation (causes blank/white screens with nested native stacks on Android) */
const tabScreenOptions = {
  headerShown: false,
  lazy: false,
};

// ─── Overview stack ───────────────────────────────────────────────────────────
// Keeps all "drill-down" screens reachable from Home via push navigation.
function OverviewStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackScreenOptions,
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="Attendance"  component={AttendanceScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Examination" component={ExaminationScreen} />
      <Stack.Screen name="ReportCard" component={ReportCardScreen} />
      <Stack.Screen name="Grades"      component={GradesScreen} />
      <Stack.Screen name="Timetable"   component={TimetableScreen} />
      <Stack.Screen name="StudentAssistant" component={StudentAssistantScreen} />
      <Stack.Screen name="Games" component={GamesScreen} />
      <Stack.Screen name="Library"     component={LibraryScreen} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
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

// ─── Examination stack ────────────────────────────────────────────────────────
function ExaminationStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ExaminationMain" component={ExaminationScreen} />
      <Stack.Screen name="ReportCard" component={ReportCardScreen} />
    </Stack.Navigator>
  );
}

// ─── Main 5-tab navigator ─────────────────────────────────────────────────────
// Tab order matters — index 2 is the center rounded "Fees" button:
//   0: Overview  |  1: Attendance  |  2: Fees (center)  |  3: Examination  |  4: Profile
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={tabScreenOptions}
      detachInactiveScreens={false}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Overview', { screen: 'Home' });
          },
        })}
      />
      <Tab.Screen name="Attendance"  component={AttendanceStack} />
      <Tab.Screen name="Fees"        component={FeesStack} />
      <Tab.Screen name="Examination" component={ExaminationStack} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  const { token, student, status } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!token || !student) return;
    registerForPushNotifications(token).catch(() => {});
  }, [token, student?.studentId]);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const type = response?.notification?.request?.content?.data?.type;
      if (type === 'announcement' && navigationRef.current?.isReady()) {
        navigationRef.current.navigate('Overview', { screen: 'Announcements' });
      }
    });
    return () => sub.remove();
  }, []);

  // Show the branded splash while AsyncStorage is read and the saved token is verified
  if (status === 'loading') {
    return <SplashScreen />;
  }

  const isAuthenticated = !!token && !!student;

  return (
    <NavigationContainer ref={navigationRef}>
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
