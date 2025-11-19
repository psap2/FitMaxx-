import React, { useEffect, useMemo, useState } from 'react';
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
import { updateUser } from '../server/lib/db/query';

type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [editingField, setEditingField] = useState<'weight' | 'height' | null>(null);

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

        setHeight(profile.height ? String(profile.height) : '');
        setWeight(profile.weight ? String(profile.weight) : '');
        setLoading(false);
      } catch (fetchError: any) {
        console.error('Error loading profile:', fetchError);
        setError('Failed to load profile.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!userId) return;

    const parsedHeight = parseInt(height, 10);
    const parsedWeight = parseInt(weight, 10);

    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      Alert.alert('Invalid Height', 'Please enter a valid height in inches.');
      return;
    }

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in pounds.');
      return;
    }

    setSaving(true);
    try {
      await updateUser(userId, {
        height: parsedHeight,
        weight: parsedWeight,
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

  const fieldsMarkup = useMemo(
    () => (
      <View style={styles.fieldsContainer}>
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Height</Text>
            <TouchableOpacity onPress={() => setEditingField('height')}>
              <Ionicons name="create-outline" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          {editingField === 'height' ? (
            <TextInput
              value={height}
              onChangeText={(value) => setHeight(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.fieldInput}
              placeholder="Height in inches"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
          ) : (
            <Text style={styles.fieldValue}>{height || '--'} in</Text>
          )}
        </View>

        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <TouchableOpacity onPress={() => setEditingField('weight')}>
              <Ionicons name="create-outline" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          {editingField === 'weight' ? (
            <TextInput
              value={weight}
              onChangeText={(value) => setWeight(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.fieldInput}
              placeholder="Weight in lbs"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
          ) : (
            <Text style={styles.fieldValue}>{weight || '--'} lbs</Text>
          )}
        </View>
      </View>
    ),
    [editingField, height, weight],
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
    <LinearGradient colors={['#000000', '#000000', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>{fieldsMarkup}</View>

      <TouchableOpacity
        style={[styles.saveButton, editable ? null : styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!editable || saving}
      >
        <LinearGradient
          colors={editable ? ['#FF6B35', '#FF8C42'] : ['#444', '#666']}
          style={styles.saveGradient}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.saveText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: fonts.bold,
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
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 28,
    fontFamily: fonts.bold,
  },
  fieldInput: {
    fontSize: 24,
    color: '#fff',
    fontFamily: fonts.bold,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
  },
  saveButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 34,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
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

