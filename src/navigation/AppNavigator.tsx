import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type {
  RootStackParamList,
  MainTabsParamList,
  HomeStackParamList,
} from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoryMeditationScreen from '../screens/CategoryMeditationScreen';
import CreateMeditationsScreen from '../screens/CreateMeditationsScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { enableScreens } from 'react-native-screens';

enableScreens();

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CategoryMeditation" component={CategoryMeditationScreen} />
    </HomeStack.Navigator>
  );
}

const ICONS = {
  home: {
    active: require('../assets/home_active.png'),
    inactive: require('../assets/home_inactive.png'),
  },
  create: {
    active: require('../assets/create_active.png'),
    inactive: require('../assets/create_inactive.png'),
  },
  stats: {
    active: require('../assets/stats_active.png'),
    inactive: require('../assets/stats_inactive.png'),
  },
  profile: {
    active: require('../assets/profile_active.png'),
    inactive: require('../assets/profile_inactive.png'),
  },
};

function TabIcon({
  focused,
  active,
  inactive,
  boostUnfocused = 1,
}: {
  focused: boolean;
  active: any;
  inactive: any;
  boostUnfocused?: number;
}) {
  const scale = focused ? 1 : boostUnfocused;
  return (
    <View style={styles.tabIconBox}>
      <Image
        source={focused ? active : inactive}
        style={[styles.tabIcon, scale !== 1 ? { transform: [{ scale }] } : null]}
        resizeMode="contain"
      />
    </View>
  );
}

function MainTabs() {

  const AnyTabs: any = Tabs.Navigator;

  return (
    <AnyTabs
      sceneContainerStyle={{ paddingBottom: 92 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 92,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        ),
        tabBarItemStyle: { paddingVertical: 6 },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={ICONS.home.active}
              inactive={ICONS.home.inactive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="CreateMeditations"
        component={CreateMeditationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={ICONS.create.active}
              inactive={ICONS.create.inactive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={ICONS.stats.active}
              inactive={ICONS.stats.inactive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
      
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={ICONS.profile.active}
              inactive={ICONS.profile.inactive}
              boostUnfocused={1.1}
            />
          ),
        }}
      />
    </AnyTabs>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Loader" component={LoaderScreen} />
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <RootStack.Screen name="Registration" component={RegistrationScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({

  tabIconBox: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 67,
    height: 67,
  },
});
