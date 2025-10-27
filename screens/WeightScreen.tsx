import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';

type WeightScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Weight'>;
type WeightScreenRouteProp = RouteProp<RootStackParamList, 'Weight'>;

interface WeightScreenProps {
  navigation: WeightScreenNavigationProp;
  route: WeightScreenRouteProp;
}

export const WeightScreen: React.FC<WeightScreenProps> = ({ navigation, route }) => {
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [weight, setWeight] = useState('');

  const isValid = weight !== '';

  const handleContinue = () => {
    if (isValid) {
      navigation.navigate('Referral', { 
        ...route.params,
        weight: { value: parseInt(weight), unit }
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={['#000000', '#000000', '#000000']} style={styles.container}>
        <ProgressBar currentStep={3} totalSteps={6} />
        
        <View style={styles.content}>
          <Text style={styles.title}>What's your weight?</Text>
          <Text style={styles.subtitle}>Track your progress over time</Text>

          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
              onPress={() => setUnit('lbs')}
            >
              <Text style={[styles.unitText, unit === 'lbs' && styles.unitTextActive]}>lbs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
              onPress={() => setUnit('kg')}
            >
              <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder={unit === 'lbs' ? '180' : '80'}
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="number-pad"
              value={weight}
              onChangeText={setWeight}
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={styles.inputLabel}>{unit === 'lbs' ? 'pounds' : 'kilograms'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <LinearGradient
            colors={isValid ? ['#FF6B35', '#FF8C42'] : ['#666', '#888']}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableWithoutFeedback>
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
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 40,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#FF6B35',
  },
  unitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  inputGroup: {
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  inputLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
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
