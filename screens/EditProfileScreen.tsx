import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { updateUser } from '../utils/api';
import { convertHeightToInches, convertWeightToLbs } from '../utils/conversionUtils';

type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [heightUnit, setHeightUnit] = useState<'in' | 'cm'>('in');
  const [editingField, setEditingField] = useState<'weight' | 'height' | null>(null);


  const handleSave = async () => {
    if (!userId) return;

    const parsedHeight = parseFloat(height);
    const parsedWeight = parseFloat(weight);

    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      Alert.alert('Invalid Height', `Please enter a valid height in ${heightUnit === 'in' ? 'inches' : 'centimeters'}.`);
      return;
    }

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Invalid Weight', `Please enter a valid weight in ${weightUnit === 'lbs' ? 'pounds' : 'kilograms'}.`);
      return;
    }

    // Convert to inches and lbs for storage (must be integers/bigint)
    let heightInInches: number;
    if (heightUnit === 'cm') {
      heightInInches = parsedHeight / 2.54;
    } else {
      heightInInches = parsedHeight;
    }

    let weightInLbs: number;
    if (weightUnit === 'kg') {
      weightInLbs = parsedWeight * 2.20462;
    } else {
      weightInLbs = parsedWeight;
    }

    setSaving(true);
    try {
      await updateUser(userId, {
        height: Math.round(heightInInches), // Must be integer
        weight: Math.round(weightInLbs), // Must be integer (bigint)
      });

      Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
      navigation.goBack();
    } catch (updateError: any) {
      console.error('Error updating profile:', updateError);
      Alert.alert('Update Failed', updateError.message ?? 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const editable = editingField !== null;

  // Track previous unit to know which direction to convert
  const prevHeightUnit = useRef<'in' | 'cm'>('in');
  const prevWeightUnit = useRef<'lbs' | 'kg'>('lbs');

  // Convert stored values when unit changes
  useEffect(() => {
    if (height && !editingField && prevHeightUnit.current !== heightUnit) {
      const heightNum = parseFloat(height);
      if (!isNaN(heightNum)) {
        if (prevHeightUnit.current === 'in' && heightUnit === 'cm') {
          // Converting from inches to cm
          const heightInCm = heightNum * 2.54;
          setHeight(heightInCm.toFixed(1));
        } else if (prevHeightUnit.current === 'cm' && heightUnit === 'in') {
          // Converting from cm to inches
          const heightInInches = heightNum / 2.54;
          setHeight(heightInInches.toFixed(1));
        }
      }
      prevHeightUnit.current = heightUnit;
    }
  }, [heightUnit, height, editingField]);

  useEffect(() => {
    if (weight && !editingField && prevWeightUnit.current !== weightUnit) {
      const weightNum = parseFloat(weight);
      if (!isNaN(weightNum)) {
        if (prevWeightUnit.current === 'lbs' && weightUnit === 'kg') {
          // Converting from lbs to kg
          const weightInKg = weightNum / 2.20462;
          setWeight(weightInKg.toFixed(1));
        } else if (prevWeightUnit.current === 'kg' && weightUnit === 'lbs') {
          // Converting from kg to lbs
          const weightInLbs = weightNum * 2.20462;
          setWeight(weightInLbs.toFixed(1));
        }
      }
      prevWeightUnit.current = weightUnit;
    }
  }, [weightUnit, weight, editingField]);

  // Load initial values and convert based on current unit
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        if (!user) {
          setError('Not signed in.');
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('height, weight')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        // Convert stored values (inches/lbs) to display units
        if (profile.height) {
          if (heightUnit === 'cm') {
            setHeight((profile.height * 2.54).toFixed(1));
          } else {
            setHeight(String(profile.height));
          }
          prevHeightUnit.current = heightUnit;
        } else {
          setHeight('');
        }

        if (profile.weight) {
          if (weightUnit === 'kg') {
            setWeight((profile.weight / 2.20462).toFixed(1));
          } else {
            setWeight(String(profile.weight));
          }
          prevWeightUnit.current = weightUnit;
        } else {
          setWeight('');
        }

        setLoading(false);
      } catch (fetchError: any) {
        console.error('Error loading profile:', fetchError);
        setError('Failed to load profile.');
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  const fieldsMarkup = useMemo(
    () => (
      <View style={styles.fieldsContainer}>
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.fieldHeaderRight}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'in' && styles.unitButtonActive]}
                  onPress={() => {
                    if (heightUnit !== 'in') {
                      setHeightUnit('in');
                    }
                  }}
                >
                  <Text style={[styles.unitText, heightUnit === 'in' && styles.unitTextActive]}>in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                  onPress={() => {
                    if (heightUnit !== 'cm') {
                      setHeightUnit('cm');
                    }
                  }}
                >
                  <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>cm</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setEditingField('height')}>
                <Ionicons name="create-outline" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </View>
          {editingField === 'height' ? (
            <TextInput
              value={height}
              onChangeText={(value) => setHeight(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              style={styles.fieldInput}
              placeholder={`Height in ${heightUnit === 'in' ? 'inches' : 'centimeters'}`}
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
          ) : (
            <Text style={styles.fieldValue}>{height || '--'} {heightUnit}</Text>
          )}
        </View>

        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <View style={styles.fieldHeaderRight}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                  onPress={() => {
                    if (weightUnit !== 'lbs') {
                      setWeightUnit('lbs');
                    }
                  }}
                >
                  <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                  onPress={() => {
                    if (weightUnit !== 'kg') {
                      setWeightUnit('kg');
                    }
                  }}
                >
                  <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setEditingField('weight')}>
                <Ionicons name="create-outline" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </View>
          {editingField === 'weight' ? (
            <TextInput
              value={weight}
              onChangeText={(value) => setWeight(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              style={styles.fieldInput}
              placeholder={`Weight in ${weightUnit === 'lbs' ? 'pounds' : 'kilograms'}`}
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
          ) : (
            <Text style={styles.fieldValue}>{weight || '--'} {weightUnit}</Text>
          )}
        </View>
      </View>
    ),
    [editingField, height, weight, heightUnit, weightUnit],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>{fieldsMarkup}</View>

      <TouchableOpacity
        style={[styles.saveButton, (!editable || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!editable || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontFamily: fonts.regular,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#FF6B35',
  },
  unitText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  unitTextActive: {
    color: '#fff',
    fontFamily: fonts.bold,
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 28,
    fontFamily: fonts.regular,
  },
  fieldInput: {
    fontSize: 24,
    color: '#fff',
    fontFamily: fonts.regular,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginBottom: 34,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EditProfileScreen;

