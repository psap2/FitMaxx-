import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Exo2_400Regular,
  Exo2_700Bold,
} from '@expo-google-fonts/exo-2';
import { GenderScreen } from './screens/GenderScreen';
import { HeightScreen } from './screens/HeightScreen';
import { WeightScreen } from './screens/WeightScreen';
import { ReferralScreen } from './screens/ReferralScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { MainAppScreen } from './screens/MainAppScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import GalleryScreen from './screens/GalleryScreen';
import { CommentsScreen } from './screens/CommentsScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Exo2_400Regular,
    Exo2_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const textComponent = Text as typeof Text & { defaultProps?: any };
    textComponent.defaultProps = {
      ...(textComponent.defaultProps ?? {}),
      style: {
        ...(textComponent.defaultProps?.style ?? {}),
        fontFamily: 'Exo2_400Regular',
      },
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Gender"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Gender" component={GenderScreen} />
        <Stack.Screen name="Height" component={HeightScreen} />
        <Stack.Screen name="Weight" component={WeightScreen} />
        <Stack.Screen name="Referral" component={ReferralScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen 
          name="MainApp" 
          component={MainAppScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Comments" component={CommentsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
