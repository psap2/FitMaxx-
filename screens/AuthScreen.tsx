import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../utils/supabase';
import { createUser } from '../backend/server/db/query';
import { User } from '../backend/server/db/schema';

type AuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Auth'
>;
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

interface AuthScreenProps {
  navigation: AuthScreenNavigationProp;
  route: AuthScreenRouteProp;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation, route }) => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '507850657335-ivrmtuhiidkl7i3h1e9e7s4bc2hjqmlb.apps.googleusercontent.com',
      iosClientId:
        '507850657335-f6knolk41keva0b053ra871qui3teb8u.apps.googleusercontent.com'
        ,});
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      // Google Sign-In gives you an ID token
      const idToken = response?.data?.idToken;
      if (!idToken) {
        Alert.alert('Error', 'No ID token returned from Google Sign-In');
        return;
      }

      // Sign in with Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase sign-in error:', error.message);
        Alert.alert('Sign-in failed', error.message);
      } else {
        console.log('Supabase user data:', data);
        const user: User = {
          id: data.user.id,
          created_at: data.user.created_at,
          email: data.user.email,
          full_name: null,
          avatar_url: null
        };
        await createUser(user);
        navigation.navigate('MainApp');
      }
    } catch (error: any) {
      if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available or outdated.');
      } else {
        console.error(error);
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleAppleSignIn = () => {
    console.log('Apple Sign In', route.params);
    navigation.navigate('MainApp');
  };

  return (
    <LinearGradient colors={['#000000', '#000000', '#000000']} style={styles.container}>
      <ProgressBar currentStep={6} totalSteps={6} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>FitMax</Text>
          <Text style={styles.tagline}>Your AI Fitness Coach</Text>
        </View>

        <View style={styles.authContainer}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Choose your preferred sign-in method</Text>

          {/* ✅ Updated Google button */}
          <TouchableOpacity style={styles.authButton} onPress={handleGoogleSignIn}>
            <View style={styles.googleButton}>
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.authButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authButton} onPress={handleAppleSignIn}>
            <LinearGradient
              colors={['#000', '#1a1a1a']}
              style={styles.appleButton}
            >
              <Ionicons name="logo-apple" size={24} color="#fff" />
              <Text style={styles.authButtonText}>Continue with Apple</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{'\n'}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    letterSpacing: 1,
  },
  authContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  authButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  googleButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  terms: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 20,
  },
  termsLink: {
    color: '#4facfe',
    textDecorationLine: 'underline',
  },
});
