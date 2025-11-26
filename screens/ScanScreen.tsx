import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleBeginScan = () => {
    navigation.navigate('Home');
  };

  return (
    <LinearGradient
      colors={['rgba(255, 107, 53, 0.08)', '#000000']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>FitMax</Text>
          <Text style={styles.subtitle}>AI Physique Analysis</Text>
        </View>

      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="body" size={120} color="rgba(255, 107, 53, 0.3)" />
          <Text style={styles.imageText}>Ready to scan your physique</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.glassCard}>
          <BlurView
            style={styles.blurView}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(11, 11, 15, 0.8)"
          >
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={handleBeginScan}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8C5A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="scan" size={28} color="#fff" />
                <Text style={styles.buttonText}>Begin Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Upload a clear photo of yourself to get detailed AI analysis of your physique
        </Text>
      </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontFamily: fonts.regular,
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: height * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    fontFamily: fonts.regular,
    marginTop: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  blurView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});
