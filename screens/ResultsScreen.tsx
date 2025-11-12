import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { createPost } from '../backend/server/db/query';

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const { width } = Dimensions.get('window');

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { analysis, imageUri } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const uploadImage = useCallback(async (uri: string, userId: string) => {
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
    return { publicUrl: data.publicUrl, storagePath: filePath };
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert('Not Signed In', 'Please sign in before saving your analysis.');
        return;
      }

      let publicUrl = imageUri;
      let storagePath: string | null = null;

      try {
        const uploadResult = await uploadImage(imageUri, userId);
        publicUrl = uploadResult.publicUrl;
        storagePath = uploadResult.storagePath;
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
        return;
      }

      const toStoredScore = (value: number | undefined | null) =>
        typeof value === 'number' ? Math.round(value) : null;

      await createPost({
        user_id: userId,
        image_url: publicUrl,
        overall_rating: toStoredScore(analysis.overallRating * 10),
        potential: toStoredScore(analysis.potential * 10),
        body_fat: toStoredScore(analysis.bodyFatPercentage * 10),
        symmetry: toStoredScore(analysis.symmetry * 10),
        summaryrecc: analysis.summaryRecommendation,
      });

      navigation.setParams({
        analysis,
        imageUri: publicUrl,
      });

      Alert.alert('Saved', 'Your analysis has been saved to your progress.');
    } catch (error) {
      console.error('Failed to persist analysis result:', error);
      Alert.alert('Save Failed', 'We could not save your analysis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [analysis, imageUri, isSaving]);

  const scoreMetrics = useMemo(
    () => [
      { label: 'Overall Rating', value: analysis.overallRating },
      { label: 'Potential', value: analysis.potential },
      { label: 'Symmetry', value: analysis.symmetry },
    ],
    [analysis],
  );

  const premiumMetrics = useMemo(() => {
    if (!analysis.premiumScores) {
      return [];
    }

    return Object.entries(analysis.premiumScores)
      .filter(([, value]) => typeof value === 'number')
      .map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: value as number,
      }));
  }, [analysis.premiumScores]);

  const formatScoreValue = (value: number) => value.toFixed(1);

  const progressColor = (value: number) => {
    if (value >= 8) return '#FF6B35';
    if (value >= 6) return '#FF8C42';
    if (value >= 4) return '#FFA500';
    return '#ef4444';
  };

  return (
    <LinearGradient
      colors={['#000000', '#000000', '#000000']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Analysis Summary</Text>

          <GlassCard style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </GlassCard>

          <View style={styles.metricsGrid}>
            {scoreMetrics.map((metric) => (
              <View key={metric.label} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={[styles.metricValue, { color: progressColor(metric.value) }]}>
                  {formatScoreValue(metric.value)}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(metric.value / 10, 1) * 100}%`,
                        backgroundColor: progressColor(metric.value)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          <GlassCard style={styles.bodyFatCard}>
            <Text style={styles.metricLabel}>Body Fat Percentage</Text>
            <Text style={[styles.metricValue, styles.bodyFatValue]}>
              {analysis.bodyFatPercentage.toFixed(1)}%
            </Text>
          </GlassCard>

          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>{analysis.summaryRecommendation}</Text>
          </GlassCard>

          {premiumMetrics.length > 0 && (
            <View style={styles.premiumContainer}>
              <Text style={styles.premiumTitle}>Premium Muscle Group Scores</Text>
              <GlassCard>
                <View style={styles.premiumGrid}>
                  {premiumMetrics.map((metric) => (
                    <View key={metric.label} style={styles.premiumItem}>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                      <Text style={[styles.metricValue, { color: progressColor(metric.value) }]}>
                        {formatScoreValue(metric.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
          )}

          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            
            <GlassCard style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="star" size={20} color="#FF6B35" />
                <Text style={styles.suggestionTitle}>Strengths</Text>
              </View>
              {analysis.strengths.map((strength, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionBullet} />
                  <Text style={styles.suggestionText}>{strength}</Text>
                </View>
              ))}
            </GlassCard>

            <GlassCard style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="trending-up" size={20} color="#FF6B35" />
                <Text style={styles.suggestionTitle}>Areas to Improve</Text>
              </View>
              {analysis.improvements.map((improvement, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionBullet} />
                  <Text style={styles.suggestionText}>{improvement}</Text>
                </View>
              ))}
            </GlassCard>
          </View>

          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient colors={['#FF6B35', '#FF8C42']} style={styles.buttonGradient}>
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Save</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Handle share functionality
                console.log('Share results');
              }}
            >
              <LinearGradient colors={['#FF6B35', '#FF8C42']} style={styles.buttonGradient}>
                <Ionicons name="share" size={20} color="#fff" />
                <Text style={styles.buttonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  imageCard: {
    marginBottom: 30,
    height: 200,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  metricsGrid: {
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  metricLabel: {
    fontSize: 16,
    color: '#fff',
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  bodyFatCard: {
    marginBottom: 20,
    padding: 16,
  },
  bodyFatValue: {
    color: '#FF6B35',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  summaryCard: {
    marginBottom: 24,
    padding: 18,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  premiumContainer: {
    marginBottom: 30,
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 12,
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  premiumItem: {
    width: '48%',
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 15,
  },
  suggestionCard: {
    marginBottom: 15,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    marginLeft: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    marginTop: 6,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});