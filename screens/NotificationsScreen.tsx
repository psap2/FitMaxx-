import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
type NotificationsScreenRouteProp = RouteProp<RootStackParamList, 'Notifications'>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
  route: NotificationsScreenRouteProp;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation, route }) => {
  const [enabled, setEnabled] = useState(false);

  const handleEnable = () => {
    setEnabled(true);
    // Here you would request actual notification permissions
    Alert.alert('Notifications Enabled', 'You will receive updates about your progress!');
  };

  const handleContinue = () => {
    navigation.navigate('Auth', route.params);
  };

  const handleSkip = () => {
    navigation.navigate('Auth', route.params);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={5} totalSteps={6} />
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#FF6B35" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={80} color="#FF6B35" />
          </View>
        </View>
        
        <Text style={styles.title}>Stay motivated!</Text>
        <Text style={styles.subtitle}>
          Get reminders, progress updates, and personalized tips
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
            <Text style={styles.benefitText}>Daily workout reminders</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
            <Text style={styles.benefitText}>Progress milestones</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
            <Text style={styles.benefitText}>Personalized tips</Text>
          </View>
        </View>

        {!enabled && (
          <TouchableOpacity style={styles.enableButton} onPress={handleEnable}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.enableText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
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
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  benefitText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
  },
  enableButton: {
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginBottom: 16,
  },
  enableText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    letterSpacing: 0.3,
  },
  skipButton: {
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
