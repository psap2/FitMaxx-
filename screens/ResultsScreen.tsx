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
import { MuscleScoreChart } from '../components/MuscleScoreChart';
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
    if (rating >= 8) return '#10b981';
    if (rating >= 6) return '#3b82f6';
    if (rating >= 4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
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

          <Text style={styles.title}>Your Results</Text>

          <GlassCard style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </GlassCard>

          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statLabel}>Overall Rating</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: getRatingColor(analysis.overallRating) },
                ]}
              >
                {analysis.overallRating.toFixed(1)}/10
              </Text>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <Text style={styles.statLabel}>Body Fat</Text>
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                {analysis.bodyFatPercentage.toFixed(1)}%
              </Text>
            </GlassCard>
          </View>

          <MuscleScoreChart muscleScores={analysis.muscleScores} />

          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Strengths</Text>
            </View>
            {analysis.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
            </View>
            {analysis.improvements.map((improvement, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: '#10b981' }]} />
                <Text style={styles.listText}>{improvement}</Text>
              </View>
            ))}
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Detailed Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{analysis.detailedFeedback}</Text>
          </GlassCard>

          <TouchableOpacity
            style={styles.newAnalysisButton}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.newAnalysisGradient}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.newAnalysisText}>New Analysis</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageCard: {
    marginBottom: 20,
    height: 300,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginTop: 6,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  feedbackText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  newAnalysisButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 40,
  },
  newAnalysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  newAnalysisText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});