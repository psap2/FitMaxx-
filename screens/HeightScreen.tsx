import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';

type HeightScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Height'>;
type HeightScreenRouteProp = RouteProp<RootStackParamList, 'Height'>;

interface HeightScreenProps {
  navigation: HeightScreenNavigationProp;
  route: HeightScreenRouteProp;
}

export const HeightScreen: React.FC<HeightScreenProps> = ({ navigation, route }) => {
  const [unit, setUnit] = useState<'ft' | 'cm'>('ft');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [cm, setCm] = useState('');

  const isValid = unit === 'ft' ? (feet !== '' && inches !== '') : cm !== '';

  const handleContinue = () => {
    if (isValid) {
      const heightData = unit === 'ft' 
        ? { feet: parseInt(feet), inches: parseInt(inches) }
        : { cm: parseInt(cm) };
      
      navigation.navigate('Weight', { 
        gender: route.params.gender,
        height: heightData 
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
        <ProgressBar currentStep={2} totalSteps={6} />
        
        <View style={styles.content}>
        <Text style={styles.title}>What's your height?</Text>
        <Text style={styles.subtitle}>This helps us calculate accurate metrics</Text>

        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'ft' && styles.unitButtonActive]}
            onPress={() => setUnit('ft')}
          >
            <Text style={[styles.unitText, unit === 'ft' && styles.unitTextActive]}>ft/in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'cm' && styles.unitButtonActive]}
            onPress={() => setUnit('cm')}
          >
            <Text style={[styles.unitText, unit === 'cm' && styles.unitTextActive]}>cm</Text>
          </TouchableOpacity>
        </View>

        {unit === 'ft' ? (
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="number-pad"
                value={feet}
                onChangeText={setFeet}
                maxLength={1}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputLabel}>feet</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="number-pad"
                value={inches}
                onChangeText={setInches}
                maxLength={2}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputLabel}>inches</Text>
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="175"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="number-pad"
              value={cm}
              onChangeText={setCm}
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={styles.inputLabel}>centimeters</Text>
          </View>
        )}
      </View>

        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <LinearGradient
            colors={isValid ? ['#4facfe', '#00f2fe'] : ['#666', '#888']}
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
    backgroundColor: '#4facfe',
  },
  unitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 20,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(79, 172, 254, 0.3)',
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
