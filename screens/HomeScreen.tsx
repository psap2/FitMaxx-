import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { analyzePhysique } from '../api';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../contexts/AnalysisContext';
import { PhysiqueAnalysis } from '../types';
import { GlassCard } from '../components/GlassCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { startAnalysis, completeAnalysis, state } = useAnalysis();
  const isAnalyzing = state.isAnalyzing;
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const directResponseRef = React.useRef<PhysiqueAnalysis | null>(null);
  const currentAnalysisIdRef = React.useRef<string | null>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to continue.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to continue.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileExt = uri.split('.').pop() ?? 'jpg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: response.headers.get('Content-Type') ?? 'image/jpeg',
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert('Not Signed In', 'Please sign in before analyzing.');
        return;
      }

      // Generate unique analysis ID
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentAnalysisIdRef.current = analysisId;
      directResponseRef.current = null;
      
      // Start analysis tracking (this sets up the realtime subscription)
      startAnalysis(selectedImage, analysisId);

      // Start the analysis (API will broadcast when done)
      let apiCallCompleted = false;
      try {
        const directResponse = await analyzePhysique(selectedImage, analysisId, userId);
        apiCallCompleted = true;
        directResponseRef.current = directResponse;
        
        // Set a timeout to use direct response if broadcast doesn't arrive
        // Wait 5 seconds for the broadcast, then use direct response as fallback
        timeoutRef.current = setTimeout(() => {
          // Check if we have a direct response and the API call completed
          // The state check will happen via the context's completeAnalysis function
          if (
            directResponseRef.current &&
            currentAnalysisIdRef.current === analysisId &&
            apiCallCompleted
          ) {
            console.log('Broadcast timeout - using direct API response as fallback');
            completeAnalysis(directResponseRef.current, selectedImage);
            // Clean up
            directResponseRef.current = null;
            currentAnalysisIdRef.current = null;
            timeoutRef.current = null;
          }
        }, 5000);
      } catch (apiError: any) {
        // If API call fails, stop analysis state
        apiCallCompleted = false;
        directResponseRef.current = null;
        currentAnalysisIdRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        throw apiError;
      }
      
      // Note: Navigation will happen via toast notification when analysis completes
      // Either via broadcast (preferred) or direct response fallback after timeout
    } catch (error: any) {
      console.error('Analysis error:', error);
      // Clean up on error
      directResponseRef.current = null;
      currentAnalysisIdRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze the image. Please try again.'
      );
    }
  };

  // Clear timeout when analysis completes (either via broadcast or timeout)
  React.useEffect(() => {
    if (!state.isAnalyzing && timeoutRef.current) {
      // Analysis completed, clear the timeout
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      directResponseRef.current = null;
      currentAnalysisIdRef.current = null;
    }
  }, [state.isAnalyzing]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>FitMax</Text>
          <Text style={styles.subtitle}>AI Physique Analysis</Text>
        </View>

        {selectedImage ? (
          <View style={styles.imagePreviewCard}>
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconWrapper}>
                <Ionicons name="alert-circle" size={96} color="#FF6B35" />
              </View>
              <Text style={styles.placeholderText}>Add a picture to begin your scan</Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color="#fff" />
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {selectedImage && (
          <>
            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics" size={28} color="#fff" />
                  <Text style={styles.analyzeText}>Analyze Physique</Text>
                </>
              )}
            </TouchableOpacity>
            {isAnalyzing && (
              <View style={styles.loadingMessageContainer}>
                <Text style={styles.loadingMessage}>
                  You can leave and a notification will show you when completed
                </Text>
              </View>
            )}
          </>
        )}
      </View>
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
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    padding: 8,
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
  placeholderCard: {
    height: height * 0.4,
    marginBottom: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewCard: {
    height: height * 0.4,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  placeholderIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  placeholderText: {
    color: '#FF6B35',
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  analyzeButton: {
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    marginTop: 10,
  },
  analyzeButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  analyzeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  loadingMessageContainer: {
    marginTop: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loadingMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
});