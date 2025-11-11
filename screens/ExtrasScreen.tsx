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

export default function ExtrasScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="ellipsis-horizontal" size={80} color="rgba(255, 107, 53, 0.3)" />
        </View>
        
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          We're working on exciting new features for you!
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="trending-up" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Progress Tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Community Features</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Achievements</Text>
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
