import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { createPost, getUser, createReferral } from '../utils/query';

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const { width } = Dimensions.get('window');

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { analysis, imageUri, allowSave = true, postId } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  
  // Animation values for shiny effect
  const shineAnimation = useRef(new Animated.Value(0)).current;

  // Check if user is premium
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userEmail = session.session?.user?.email;
        
        if (userEmail) {
          const userData = await getUser(userEmail);
          if (userData && userData.length > 0) {
            setIsPremiumUser(userData[0].premium || false);
          }
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremiumUser(false);
      }
    };

    checkPremiumStatus();
  }, []);

  // Start shine animation for high scores
  useEffect(() => {
    const startShineAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(shineAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    };

    startShineAnimation();
  }, [shineAnimation]);

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

    const { data, error: signedError } = await supabase.storage
      .from('images')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    if (signedError || !data?.signedUrl) {
      throw signedError ?? new Error('Failed to create signed URL');
    }

    return { signedUrl: data.signedUrl, storagePath: filePath };
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving || !allowSave) {
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
        publicUrl = uploadResult.signedUrl;
        storagePath = uploadResult.storagePath;
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
        return;
      }

      const toStoredScore = (value: number | undefined | null) =>
        typeof value === 'number' && !isNaN(value) ? Math.round(value) : null;

      await createPost({
        user_id: userId,
        image_url: storagePath ?? '',
        overall_rating: toStoredScore(analysis.overallRating * 10),
        potential: toStoredScore(analysis.potential * 10),
        body_fat: analysis.bodyFatPercentage !== null && analysis.bodyFatPercentage !== undefined
          ? toStoredScore(analysis.bodyFatPercentage * 10)
          : null,
        symmetry: toStoredScore(analysis.symmetry * 10),
        summaryrecc: analysis.summaryRecommendation,
        // Save premium scores if they exist
        chest: analysis.premiumScores?.chest ? toStoredScore(analysis.premiumScores.chest * 10) : null,
        quads: analysis.premiumScores?.quads ? toStoredScore(analysis.premiumScores.quads * 10) : null,
        hamstrings: analysis.premiumScores?.hamstrings ? toStoredScore(analysis.premiumScores.hamstrings * 10) : null,
        calves: analysis.premiumScores?.calves ? toStoredScore(analysis.premiumScores.calves * 10) : null,
        back: analysis.premiumScores?.back ? toStoredScore(analysis.premiumScores.back * 10) : null,
        biceps: analysis.premiumScores?.biceps ? toStoredScore(analysis.premiumScores.biceps * 10) : null,
        triceps: analysis.premiumScores?.triceps ? toStoredScore(analysis.premiumScores.triceps * 10) : null,
        shoulders: analysis.premiumScores?.shoulders ? toStoredScore(analysis.premiumScores.shoulders * 10) : null,
        forearms: analysis.premiumScores?.forearms ? toStoredScore(analysis.premiumScores.forearms * 10) : null,
        traps: analysis.premiumScores?.traps ? toStoredScore(analysis.premiumScores.traps * 10) : null,
      });

      Alert.alert('Saved', 'Your analysis has been saved to your progress.');
    } catch (error) {
      console.error('Failed to persist analysis result:', error);
      Alert.alert('Save Failed', 'We could not save your analysis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [analysis, imageUri, isSaving]);

  const handleUpgradePress = async () => {
    setIsCreatingReferral(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be signed in to create a referral.');
        return;
      }

      const referral = await createReferral(userId, supabase);
      
      Alert.alert(
        'Your Referral Code',
        `Share your referral code with a friend to unlock Premium:\n\n${referral.referral_code}\n\nWhen they sign up and use your code, you'll both get Premium access!\n\nNote: This is your permanent referral code - it will be the same each time.`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              // You might want to add clipboard functionality here
              console.log('Referral code:', referral.referral_code);
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      console.error('Error creating referral:', error);
      Alert.alert('Error', 'Failed to create referral code. Please try again.');
    } finally {
      setIsCreatingReferral(false);
    }
  };

  const scoreMetrics = useMemo(
    () => [
      { label: 'Overall Rating', value: analysis.overallRating },
      { label: 'Potential', value: analysis.potential },
      { label: 'Symmetry', value: analysis.symmetry },
    ],
    [analysis],
  );

  // Remove premiumMetrics since we're showing scores directly now

  const formatScoreValue = (value: number) => Math.round(value).toString();

  const progressColor = (value: number) => {
    // Yellow to red gradient where higher scores are redder
    // Scores are 0-100, so normalize to 0-1 range
    const normalizedValue = Math.min(Math.max(value / 100, 0), 1);
    
    if (normalizedValue >= 0.8) return '#DC2626'; // Deep red for highest scores (80-100)
    if (normalizedValue >= 0.6) return '#EF4444'; // Red (60-79)
    if (normalizedValue >= 0.4) return '#F97316'; // Orange-red (40-59)
    if (normalizedValue >= 0.2) return '#F59E0B'; // Orange (20-39)
    return '#EAB308'; // Yellow for lowest scores (0-19)
  };

  // Component for shiny text effect on high scores
  const ShinyScoreText: React.FC<{ value: number; style?: any }> = ({ value, style }) => {
    const baseColor = progressColor(value);
    
    if (value < 70) {
      // Regular text for scores below 70
      return (
        <Text style={[style, { color: baseColor }]}>
          {formatScoreValue(value)}
        </Text>
      );
    }

    // Shiny effect for scores 70 and above - using MaskedView to clip shine to text
    const shinePosition = shineAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['-100%', '200%'],
    });

    return (
      <MaskedView
        style={{ flexDirection: 'row' }}
        maskElement={
          <Text style={[style, { color: 'black', backgroundColor: 'transparent' }]}>
            {formatScoreValue(value)}
          </Text>
        }
      >
        {/* Base colored text */}
        <Text style={[style, { color: baseColor }]}>
          {formatScoreValue(value)}
        </Text>
        
        {/* Animated shine overlay - only visible through the text mask */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: shinePosition,
            width: '100%',
            height: '100%',
          }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.9)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: '50%',
              height: '100%',
              transform: [{ skewX: '-20deg' }],
            }}
          />
        </Animated.View>
      </MaskedView>
    );
  };

  return (
    <LinearGradient colors={['#0B0B0F', '#0B0B0F']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

          <Text style={styles.title}>Analysis Summary</Text>

          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </View>

          <View style={styles.metricsGrid}>
            {scoreMetrics.map((metric) => (
              <View key={metric.label} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <ShinyScoreText 
                  value={metric.value} 
                  style={styles.metricValue}
                />
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min(metric.value / 100, 1) * 100}%`,
                        backgroundColor: progressColor(metric.value)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bodyFatCard}>
            <Text style={styles.metricLabel}>Body Fat Percentage</Text>
            <Text style={[styles.metricValue, styles.bodyFatValue]}>
              {analysis.bodyFatPercentage !== null && analysis.bodyFatPercentage !== undefined
                ? `${analysis.bodyFatPercentage.toFixed(1)}%`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>{analysis.summaryRecommendation}</Text>
          </View>

          {analysis.premiumScores && (
            <View style={styles.premiumContainer}>
              <Text style={styles.premiumTitle}>Premium Muscle Group Scores</Text>
              <View style={styles.premiumContentWrapper}>
                {/* Premium scores grid with individual blur effects for non-premium users */}
                <View style={styles.premiumGrid}>
                  {Object.entries(analysis.premiumScores)
                    .filter(([, value]) => typeof value === 'number')
                    .map(([key, value]) => (
                      <View key={key} style={styles.premiumItemWrapper}>
                        {isPremiumUser ? (
                          // Clear view for premium users
                          <View style={styles.premiumItem}>
                            <Text style={styles.metricLabel}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Text>
                            <ShinyScoreText 
                              value={value as number} 
                              style={styles.metricValue}
                            />
                          </View>
                        ) : (
                          // Blurred individual items for non-premium users
                          <View style={styles.premiumItemBlurWrapper}>
                            <View style={styles.premiumItem}>
                              <Text style={styles.metricLabel}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Text>
                              <ShinyScoreText 
                                value={value as number} 
                                style={styles.metricValue}
                              />
                            </View>
                            <BlurView
                              style={styles.individualBlurOverlay}
                              blurType="light"
                              blurAmount={5}
                              reducedTransparencyFallbackColor="rgba(255,255,255,0.3)"
                            />
                          </View>
                        )}
                      </View>
                    ))}
                  
                  {/* Premium unlock card (only shown for non-premium users) - INSIDE the grid */}
                  {!isPremiumUser && (
                    <View style={styles.premiumUpgradeCard}>
                      <View style={styles.lockIconContainer}>
                        <Ionicons name="lock-closed" size={48} color="#FF6B35" />
                      </View>
                      <Text style={styles.upgradeTitle}>Unlock Detailed Analysis</Text>
                      <Text style={styles.upgradeText}>
                        See individual muscle group scores, advanced insights, and personalized recommendations for free!
                      </Text>
                      <TouchableOpacity 
                        style={styles.upgradeButton}
                        onPress={handleUpgradePress}
                        disabled={isCreatingReferral}
                      >
                        <LinearGradient colors={['#FF6B35', '#FF8C42']} style={styles.upgradeGradient}>
                          {isCreatingReferral ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="star" size={20} color="#fff" style={styles.upgradeIcon} />
                              <Text style={styles.upgradeButtonText}>Get Premium</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <Text style={styles.upgradeSubtext}>
                        Join thousands of users getting detailed physique insights
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {allowSave && (
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
          )}

          <View style={styles.buttonContainer}>
            {allowSave && (
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
            )}

            {!allowSave && postId && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Comments', { postId })}
              >
                <LinearGradient colors={['#E63222', '#FF6A2F']} style={styles.buttonGradient}>
                  <Ionicons name="chatbubble" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Notes</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

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
    paddingBottom: 40,
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
  imageWrapper: {
    marginBottom: 30,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
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
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  metricLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: fonts.regular,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    marginBottom: 6,
    color: '#FFFFFF',
  },
  bodyFatCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
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
    marginBottom: 30,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FF6B35',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  premiumContainer: {
    marginBottom: 40,
    zIndex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 16,
    paddingBottom: 16,
  },
  premiumContentWrapper: {
    position: 'relative',
    borderRadius: 16,
    minHeight: 300,
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    padding: 16,
    gap: 8,
    minHeight: 300,
  },
  premiumItemWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  premiumItemBlurWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  individualBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  premiumItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
    justifyContent: 'center',
  },
  premiumUpgradeCard: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    transform: [{ translateY: -150 }],
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 11, 15, 0.98)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.4)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  lockIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  upgradeTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  upgradeIcon: {
    marginRight: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  upgradeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginBottom: 30,
    marginTop: 20,
    backgroundColor: 'rgba(11, 11, 15, 0.85)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    zIndex: 0,
    position: 'relative',
  },
  suggestionsTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#FF6B35',
    marginBottom: 12,
  },
  suggestionCard: {
    marginBottom: 15,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FF6B35',
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
    color: 'rgba(255, 255, 255, 0.85)',
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