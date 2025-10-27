import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/GlassCard';
import { RootStackParamList } from '../types';

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const { width } = Dimensions.get('window');

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { analysis, imageUri } = route.params;

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return '#FF6B35';
    if (rating >= 6) return '#FF8C42';
    if (rating >= 4) return '#FFA500';
    return '#ef4444';
  };

  const getProgressBarColor = (rating: number) => {
    if (rating >= 8) return '#FF6B35';
    if (rating >= 6) return '#FF8C42';
    if (rating >= 4) return '#FFA500';
    return '#ef4444';
  };

  const ratings = [
    { label: 'Overall', value: analysis.overallRating },
    { label: 'Potential', value: Math.min(analysis.overallRating + 2, 10) },
    { label: 'Symmetry', value: analysis.muscleScores.chest },
    { label: 'Quality', value: analysis.muscleScores.shoulders },
    { label: 'Definition', value: analysis.muscleScores.abs },
    { label: 'Cleanliness', value: analysis.muscleScores.legs },
    { label: 'Chest', value: analysis.muscleScores.chest },
    { label: 'Shoulders', value: analysis.muscleScores.shoulders },
    { label: 'Arms', value: analysis.muscleScores.arms },
    { label: 'Legs', value: analysis.muscleScores.legs },
    { label: 'Abs', value: analysis.muscleScores.abs },
    { label: 'Body Fat', value: 10 - (analysis.bodyFatPercentage / 2) },
  ];

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

          <Text style={styles.title}>RATINGS</Text>

          <GlassCard style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </GlassCard>

          <View style={styles.ratingsGrid}>
            {ratings.map((rating, index) => (
              <View key={index} style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>{rating.label}:</Text>
                <Text style={[styles.ratingValue, { color: getRatingColor(rating.value) }]}>
                  {Math.round(rating.value * 10)}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${rating.value * 10}%`,
                        backgroundColor: getProgressBarColor(rating.value)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

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
              onPress={() => navigation.navigate('Home')}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                style={styles.buttonGradient}
              >
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.buttonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Handle share functionality
                console.log('Share results');
              }}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                style={styles.buttonGradient}
              >
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
    fontWeight: 'bold',
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
  ratingsGrid: {
    marginBottom: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ratingItem: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
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
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
});