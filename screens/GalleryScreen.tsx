import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../utils/supabase';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

type GalleryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

interface PostPreview {
  id: string;
  image_url: string;
  created_at: string;
  overall_rating: number | null;
  potential: number | null;
  body_fat: number | null;
  symmetry: number | null;
  summaryrecc: string | null;
}

const GalleryScreen: React.FC = () => {
  const navigation = useNavigation<GalleryNavigationProp>();
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        setPosts([]);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, created_at, overall_rating, potential, body_fat, symmetry, summaryrecc')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const postsWithSignedUrls: PostPreview[] = [];

      for (const row of data ?? []) {
        const filePath = row.image_url;
        let signedUrl: string | null = null;

        if (filePath) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('images')
            .createSignedUrl(filePath, 60 * 60 * 24 * 7);

          if (signedError) {
            console.error('Failed to create signed URL for', filePath, signedError);
          } else {
            signedUrl = signedData?.signedUrl ?? null;
          }
        }

        postsWithSignedUrls.push({
          ...row,
          image_url: signedUrl ?? '',
        } as PostPreview);
      }

      setPosts(postsWithSignedUrls);
    } catch (err) {
      console.error('Failed to load posts', err);
      Alert.alert('Error', 'Failed to load your progress photos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts]),
  );

  const renderItem = ({ item }: { item: PostPreview }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        const toScore = (value: number | null) => (typeof value === 'number' ? value / 10 : 0);
        navigation.navigate('Results', {
          allowSave: false,
          imageUri: item.image_url,
          analysis: {
            overallRating: toScore(item.overall_rating),
            potential: toScore(item.potential),
            bodyFatPercentage: toScore(item.body_fat),
            symmetry: toScore(item.symmetry),
            summaryRecommendation: item.summaryrecc ?? 'No summary available.',
            strengths: [],
            improvements: [],
          },
        });
      }}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]}>
          <Ionicons name="image" size={32} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.fallbackText}>Image unavailable</Text>
        </View>
      )}
      <Text style={styles.dateText}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
      <View style={styles.overallBadge}>
        <Text style={styles.overallText}>
          {item.overall_rating ? (item.overall_rating / 10).toFixed(1) : '--'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No progress yet</Text>
        <Text style={styles.emptySubtitle}>
          Upload your first scan to start tracking your transformation.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.header}>Your Progress</Text>
      <FlatList
        data={posts}
        numColumns={2}
        columnWrapperStyle={styles.row}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  thumbnailFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateText: {
    padding: 12,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fonts.regular,
  },
  overallBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  overallText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  fallbackText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default GalleryScreen;

