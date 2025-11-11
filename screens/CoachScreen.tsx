import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme/fonts';

const { width, height } = Dimensions.get('window');

export default function CoachScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={80} color="rgba(255, 107, 53, 0.3)" />
        </View>
        
        <Text style={styles.title}>AI Coach</Text>
        <Text style={styles.subtitle}>
          Your personal AI fitness coach is coming soon!
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="bulb" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Personalized Workouts</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="nutrition" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Nutrition Guidance</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="chatbubble" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>24/7 Support</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
    fontFamily: fonts.regular,
  },
});
