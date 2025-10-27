import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';

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

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ProgressBar currentStep={5} totalSteps={6} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={80} color="#4facfe" />
          </View>
        </View>
        
        <Text style={styles.title}>Stay motivated!</Text>
        <Text style={styles.subtitle}>
          Get reminders, progress updates, and personalized tips
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
            <Text style={styles.benefitText}>Daily workout reminders</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
            <Text style={styles.benefitText}>Progress milestones</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
            <Text style={styles.benefitText}>Personalized tips</Text>
          </View>
        </View>

        {!enabled && (
          <TouchableOpacity style={styles.enableButton} onPress={handleEnable}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.enableGradient}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <Text style={styles.enableText}>Enable Notifications</Text>
            </LinearGradient>
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
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
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
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(79, 172, 254, 0.3)',
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
    lineHeight: 24,
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
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
  },
  enableButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  enableGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  enableText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
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
