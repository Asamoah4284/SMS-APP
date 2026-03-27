import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FeesScreen from '../screens/FeesScreen';
import ExaminationScreen from '../screens/ExaminationScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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

export default function RootNavigator() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}
