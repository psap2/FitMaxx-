import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import { GoalsScreen } from './screens/GoalsScreen';
import { RootStackParamList } from './types';
import { AnalysisProvider, useAnalysis } from './contexts/AnalysisContext';
import { AnalysisToast } from './components/AnalysisToast';
import { supabase } from './utils/supabase';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { state, dismissToast } = useAnalysis();
  const navigationRef = useNavigationContainerRef<any>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (navigationRef.isReady()) {
      const currentRouteName = navigationRef.getCurrentRoute()?.name;
      setCurrentRoute(currentRouteName);
    }
  }, [navigationRef.isReady()]);

  const handleNavigationStateChange = useCallback(() => {
    if (navigationRef.isReady()) {
      const currentRouteName = navigationRef.getCurrentRoute()?.name;
      setCurrentRoute(currentRouteName);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await supabase.auth.getSession();
      setIsAuthenticated(!!session.session?.user?.id);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user?.id);
      if (!session?.user?.id && state.showToast) {
        dismissToast();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [state.showToast, dismissToast]);

  useEffect(() => {
    if (state.showToast && state.analysis && state.imageUri && navigationRef.isReady() && currentRoute === 'Home') {
      navigationRef.navigate('Results', {
        analysis: state.analysis,
        imageUri: state.imageUri,
        allowSave: true,
      });
      dismissToast();
    }
  }, [state.showToast, state.analysis, state.imageUri, currentRoute, dismissToast]);

  const handleViewResults = () => {
    if (state.analysis && state.imageUri && navigationRef.isReady()) {
      navigationRef.navigate('Results', {
        analysis: state.analysis,
        imageUri: state.imageUri,
        allowSave: true,
      });
      dismissToast();
    }
  };

  return (
    <>
      <NavigationContainer 
        ref={navigationRef}
        onReady={handleNavigationStateChange}
        onStateChange={handleNavigationStateChange}
      >
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Gender"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        >
          <Stack.Screen 
            name="Gender" 
            component={GenderScreen}
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen 
            name="Height" 
            component={HeightScreen}
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen 
            name="Weight" 
            component={WeightScreen}
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen 
            name="Referral" 
            component={ReferralScreen}
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
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
          <Stack.Screen name="Goals" component={GoalsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      
      {isAuthenticated && currentRoute !== 'Home' && (
        <AnalysisToast
          visible={state.showToast}
          onViewResults={handleViewResults}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}

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
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}
