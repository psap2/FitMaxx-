import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../types';
import { supabase } from '../utils/supabase';
import { useEffect } from 'react';
import { fonts } from '../theme/fonts';

type GenderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gender'>;

interface GenderScreenProps {
  navigation: GenderScreenNavigationProp;
}

export const GenderScreen: React.FC<GenderScreenProps> = ({ navigation }) => {
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('gender,height,weight')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user record:', error);
          await supabase.auth.signOut();
          return;
        }

        if (
          userRecord &&
          userRecord.gender &&
          userRecord.height &&
          userRecord.weight &&
          userRecord.height > 0 &&
          userRecord.weight > 0
        ) {
          navigation.replace('MainApp');
        } else {
          await supabase.auth.signOut();
        }
      }
    };
    checkUser();
  }, []);
  
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleContinue = () => {
    if (selectedGender) {
      navigation.navigate('Height', { gender: selectedGender });
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={1} totalSteps={6} />
      
      {navigation.canGoBack() && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={20} color="#FF6B35" />
          </View>
        </TouchableOpacity>
      )}
      
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
              color={selectedGender === 'male' ? '#FF6B35' : 'rgba(255, 255, 255, 0.6)'} 
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
              color={selectedGender === 'female' ? '#FF6B35' : 'rgba(255, 255, 255, 0.6)'} 
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
    marginBottom: 60,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  option: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  optionText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  optionTextSelected: {
    color: '#fff',
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
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
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
