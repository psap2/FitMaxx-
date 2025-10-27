import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';

type GenderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gender'>;

interface GenderScreenProps {
  navigation: GenderScreenNavigationProp;
}

export const GenderScreen: React.FC<GenderScreenProps> = ({ navigation }) => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleContinue = () => {
    if (selectedGender) {
      navigation.navigate('Height', { gender: selectedGender });
    }
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ProgressBar currentStep={1} totalSteps={6} />
      
      <View style={styles.content}>
        <Text style={styles.title}>What's your gender?</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.option, selectedGender === 'male' && styles.optionSelected]}
            onPress={() => setSelectedGender('male')}
          >
            <Ionicons 
              name="male" 
              size={60} 
              color={selectedGender === 'male' ? '#4facfe' : 'rgba(255, 255, 255, 0.6)'} 
            />
            <Text style={[styles.optionText, selectedGender === 'male' && styles.optionTextSelected]}>
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedGender === 'female' && styles.optionSelected]}
            onPress={() => setSelectedGender('female')}
          >
            <Ionicons 
              name="female" 
              size={60} 
              color={selectedGender === 'female' ? '#4facfe' : 'rgba(255, 255, 255, 0.6)'} 
            />
            <Text style={[styles.optionText, selectedGender === 'female' && styles.optionTextSelected]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !selectedGender && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedGender}
      >
        <LinearGradient
          colors={selectedGender ? ['#4facfe', '#00f2fe'] : ['#666', '#888']}
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
    marginBottom: 60,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  option: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#4facfe',
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
  },
  optionText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
  },
  continueButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
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
