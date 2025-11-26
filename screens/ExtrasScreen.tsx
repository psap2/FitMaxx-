import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts } from '../theme/fonts';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type ExtrasNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExtrasScreen() {
  const navigation = useNavigation<ExtrasNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={80} color="rgba(255, 107, 53, 0.3)" />
        </View>
        
        <Text style={styles.title}>Tracking</Text>
        <Text style={styles.subtitle}>
          Check out these extra features.
        </Text>
        
        <View style={styles.featuresContainer}>
          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => navigation.navigate('Gallery')}
          >
            <View style={styles.featureLeft}>
              <Ionicons name="trending-up" size={24} color="#FF6B35" />
              <Text style={styles.featureText}>Progress Tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => navigation.navigate('Goals')}
          >
            <View style={styles.featureLeft}>
              <Ionicons name="flag" size={24} color="#FF6B35" />
              <Text style={styles.featureText}>Goals</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.regular,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 16,
    fontFamily: fonts.regular,
  },
});
