import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  CategoryMeditation: { category?: 'calm' | 'energy' | 'break' } | undefined;
};

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CreateMeditations: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Loader: undefined;
  Onboarding: undefined;
  Registration: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
};
