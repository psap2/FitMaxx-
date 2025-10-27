import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';

type ReferralScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Referral'>;
type ReferralScreenRouteProp = RouteProp<RootStackParamList, 'Referral'>;

interface ReferralScreenProps {
  navigation: ReferralScreenNavigationProp;
  route: ReferralScreenRouteProp;
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ navigation, route }) => {
  const [referralCode, setReferralCode] = useState('');

  const handleContinue = () => {
    navigation.navigate('Notifications', { 
      ...route.params,
      referralCode: referralCode || undefined
    });
  };

  const handleSkip = () => {
    navigation.navigate('Notifications', { 
      ...route.params,
      referralCode: undefined
    });
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a', '#000000']} style={styles.container}>
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
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF8C42']}
          style={styles.continueGradient}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 20,
    fontWeight: '600',
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
    margin: 20,
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
    fontWeight: 'bold',
  },
});
