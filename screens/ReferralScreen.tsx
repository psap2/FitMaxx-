import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { validateReferralCode } from '../utils/query';
import { supabase } from '../utils/supabase';

type ReferralScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Referral'>;
type ReferralScreenRouteProp = RouteProp<RootStackParamList, 'Referral'>;

interface ReferralScreenProps {
  navigation: ReferralScreenNavigationProp;
  route: ReferralScreenRouteProp;
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ navigation, route }) => {
  const [referralCode, setReferralCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (referralCode.trim()) {
      setIsProcessing(true);
      try {
        // Validate referral code without requiring sign-in
        const validation = await validateReferralCode(referralCode.trim().toUpperCase(), supabase);
        
        if (validation.valid) {
          Alert.alert(
            'Valid Code!',
            'Great! Your referral code is valid. Complete your signup to activate premium benefits for both you and your referrer.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('Notifications', { 
                  ...route.params,
                  referralCode: referralCode.trim().toUpperCase()
                })
              }
            ]
          );
        } else {
          Alert.alert(
            'Invalid Code',
            validation.message || 'The referral code is invalid or has already been used.',
            [
              {
                text: 'Try Again',
                onPress: () => setReferralCode('')
              },
              {
                text: 'Skip',
                onPress: () => navigation.navigate('Notifications', { 
                  ...route.params,
                  referralCode: undefined
                })
              }
            ]
          );
        }
      } catch (error: any) {
        console.error('Error validating referral code:', error);
        Alert.alert(
          'Error',
          'Unable to validate referral code. Please check your connection and try again.',
          [
            {
              text: 'Try Again'
            },
            {
              text: 'Skip',
              onPress: () => navigation.navigate('Notifications', { 
                ...route.params,
                referralCode: undefined
              })
            }
          ]
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      navigation.navigate('Notifications', { 
        ...route.params,
        referralCode: undefined
      });
    }
  };

  const handleSkip = () => {
    navigation.navigate('Notifications', { 
      ...route.params,
      referralCode: undefined
    });
  };

  return (
    <LinearGradient colors={['#000000', '#000000', '#000000']} style={styles.container}>
      <ProgressBar currentStep={4} totalSteps={6} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={80} color="#FF6B35" />
        </View>
        
        <Text style={styles.title}>Have a referral code?</Text>
        <Text style={styles.subtitle}>Get exclusive benefits and rewards</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter code (optional)"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          value={referralCode}
          onChangeText={setReferralCode}
          autoCapitalize="characters"
          maxLength={10}
        />

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>I don't have a code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, isProcessing && styles.disabledButton]}
        onPress={handleContinue}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF8C42']}
          style={styles.continueGradient}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.bold,
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(79, 172, 254, 0.3)',
    letterSpacing: 2,
  },
  skipButton: {
    marginTop: 20,
    padding: 12,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  continueButton: {
    marginHorizontal: 20,
    marginBottom: 64,
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
