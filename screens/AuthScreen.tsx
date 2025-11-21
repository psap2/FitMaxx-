import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { fonts } from '../theme/fonts';
import { RootStackParamList } from '../types';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../utils/supabase';
import { createUser, getUser, updateUser, applyReferralAfterSignup } from '../server/lib/db/query';
import { User } from '../server/lib/db/schema';
import { convertHeightToInches, convertWeightToLbs } from '../utils/conversionUtils';

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
      await GoogleSignin.signOut(); // Let's have it where there is no remembering of the user's sign in (from Dan)
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
        
        // Extract route params for gender, height, and weight
        const routeParams = route.params;
        const hasOnboardingData = routeParams?.gender && routeParams?.height && routeParams?.weight;
        
        let isExistingUser = await getUser(data.user.email);
        if (isExistingUser.length > 0) {
          const existingUser = isExistingUser[0];
          const needsOnboarding =
            !existingUser.gender ||
            existingUser.height === null ||
            existingUser.height === undefined ||
            existingUser.height === 0 ||
            existingUser.weight === null ||
            existingUser.weight === undefined ||
            existingUser.weight === 0;

          if (needsOnboarding) {
            if (hasOnboardingData) {
              try {
                const heightInches = convertHeightToInches(routeParams.height);
                const weightLbs = convertWeightToLbs(routeParams.weight);

                if (isNaN(heightInches) || isNaN(weightLbs) || heightInches <= 0 || weightLbs <= 0) {
                  console.error('Invalid conversion values:', { heightInches, weightLbs });
                  throw new Error('Invalid height or weight values');
                }

                await updateUser(data.user.id, {
                  gender: routeParams.gender,
                  height: Math.round(heightInches),
                  weight: Math.round(weightLbs),
                });
              } catch (updateError: any) {
                console.error('Error updating existing user:', updateError);
              }
            } else {
              await supabase.auth.signOut();
              await GoogleSignin.signOut();
              Alert.alert(
                'Complete Your Profile',
                'We need a few details before you can continue. Please finish the onboarding steps.'
              );
              navigation.reset({
                index: 0,
                routes: [{ name: 'Gender' }],
              });
              return;
            }
          }

          navigation.navigate('MainApp');
          return;
        }
        
        // New user handling
        if (!hasOnboardingData) {
          await supabase.auth.signOut();
          await GoogleSignin.signOut();
          Alert.alert(
            'Finish Setup',
            'Please complete the onboarding steps before signing in.'
          );
          navigation.reset({
            index: 0,
            routes: [{ name: 'Gender' }],
          });
          return;
        }

        let heightInches = 0;
        let weightLbs = 0;

        try {
          heightInches = convertHeightToInches(routeParams.height);
          weightLbs = convertWeightToLbs(routeParams.weight);

          if (isNaN(heightInches) || isNaN(weightLbs) || heightInches <= 0 || weightLbs <= 0) {
            console.error('Invalid conversion values:', { heightInches, weightLbs });
            throw new Error('Invalid height or weight values');
          }
        } catch (conversionError: any) {
          console.error('Error converting height/weight:', conversionError);
          await supabase.auth.signOut();
          await GoogleSignin.signOut();
          Alert.alert(
            'Invalid Data',
            'We had trouble processing your height or weight. Please try again.'
          );
          navigation.reset({
            index: 0,
            routes: [{ name: 'Gender' }],
          });
          return;
        }

        const user: User = {
          id: data.user.id,
          created_at: data.user.created_at,
          email: data.user.email,
          full_name: null,
          avatar_url: null,
          gender: routeParams.gender,
          height: Math.round(heightInches),
          weight: Math.round(weightLbs),
          premium: false,
        };
        
        try {
          await createUser(user);
          
          // Apply referral code if provided
          if (routeParams.referralCode) {
            console.log('🎯 Found referral code in params:', routeParams.referralCode);
            try {
              const result = await applyReferralAfterSignup(routeParams.referralCode, data.user.id, supabase);
              console.log('✅ Referral applied successfully:', result);
              Alert.alert(
                'Welcome!',
                'Your account has been created successfully!',
                [{ text: 'Continue', onPress: () => navigation.navigate('MainApp') }]
              );
              return;
            } catch (referralError: any) {
              console.error('❌ Error applying referral:', referralError);
              // Continue to main app even if referral fails
              Alert.alert(
                'Account Created',
                `Your account has been created successfully! However, there was an issue with the referral code: ${referralError.message}`,
                [{ text: 'Continue', onPress: () => navigation.navigate('MainApp') }]
              );
              return;
            }
          } else {
            console.log('ℹ️ No referral code found in params');
          }
        } catch (createError: any) {
          console.error('Error creating user:', createError);
          Alert.alert('Error', 'Failed to create account. Please try again.');
          return;
        }
        
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

  return (
    <LinearGradient colors={['#000000', '#000000', '#000000']} style={styles.container}>
      <ProgressBar currentStep={6} totalSteps={6} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>FitMax</Text>
          <Text style={styles.tagline}>Your AI Fitness Coach</Text>
          <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
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
    justifyContent: 'flex-start',
    paddingTop: 72,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 56,
    fontFamily: fonts.bold,
    color: '#fff',
    letterSpacing: 2,
  },
  logoImage: {
    width: 160,
    height: 160,
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 24,
    letterSpacing: 1,
  },
  authContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#fff',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
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
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
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
