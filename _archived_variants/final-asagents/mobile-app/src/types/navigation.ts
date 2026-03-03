import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Home: undefined;
  DailyLog: { projectId?: string };
  ToolboxTalk: { talkId?: string };
};

// Projects Stack
export type ProjectsStackParamList = {
  ProjectList: undefined;
  ProjectHome: { projectId: string };
  PlansViewer: { projectId: string; planId: string };
  Tasks: { projectId: string };
  RFI: { projectId: string; rfiId?: string };
};

// Photos Stack
export type PhotosStackParamList = {
  Gallery: { projectId?: string };
  PhotoDetail: { photoId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
  PhotosTab: undefined;
  ProfileTab: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Navigation prop types
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>;
export type ProjectsNavigationProp = StackNavigationProp<ProjectsStackParamList>;
export type PhotosNavigationProp = StackNavigationProp<PhotosStackParamList>;
export type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Route prop types
export type HomeRouteProp = RouteProp<HomeStackParamList, 'Home'>;
export type DailyLogRouteProp = RouteProp<HomeStackParamList, 'DailyLog'>;
export type ProjectHomeRouteProp = RouteProp<ProjectsStackParamList, 'ProjectHome'>;
export type PlansViewerRouteProp = RouteProp<ProjectsStackParamList, 'PlansViewer'>;
