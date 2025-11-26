import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { validateReferralCode } from '../utils/api';
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
        const validation = await validateReferralCode(referralCode.trim().toUpperCase());
        
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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={4} totalSteps={6} />
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#FF6B35" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={80} color="#FF6B35" />
        </View>
        
        <Text style={styles.title}>Have a referral code?</Text>
        <Text style={styles.subtitle}>Get exclusive benefits and rewards</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter code"
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
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    fontSize: 28,
    fontFamily: fonts.regular,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 18,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    letterSpacing: 2,
  },
  skipButton: {
    marginTop: 20,
    padding: 12,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  continueButton: {
    marginHorizontal: 20,
    marginBottom: 64,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 90,
    left: 20,
    zIndex: 10,
    width: 48,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
