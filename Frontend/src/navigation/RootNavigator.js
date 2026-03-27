import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Examination" component={ExaminationScreen} />
      <Stack.Screen name="Grades" component={GradesScreen} />
      <Stack.Screen name="Timetable" component={TimetableScreen} />
    </Stack.Navigator>
  );
}

function FeesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeesHome" component={FeesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Overview'
              ? 'home-outline'
              : route.name === 'Examination'
                ? 'calendar-outline'
                : route.name === 'Fees'
                  ? 'wallet-outline'
                  : 'bar-chart-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={OverviewStack} />
      <Tab.Screen name="Examination" component={ExaminationScreen} />
      <Tab.Screen name="Fees" component={FeesStack} />
      <Tab.Screen name="Performance" component={PerformanceScreen} />
    </Tab.Navigator>
  );
}

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
        // Not authenticated → show phone lookup + child selection
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
