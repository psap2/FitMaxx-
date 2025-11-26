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
import { getUser, deletePost } from '../utils/api';

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
  // Premium scores
  chest?: number | null;
  quads?: number | null;
  hamstrings?: number | null;
  calves?: number | null;
  back?: number | null;
  biceps?: number | null;
  triceps?: number | null;
  shoulders?: number | null;
  forearms?: number | null;
  traps?: number | null;
}

const GalleryScreen: React.FC = () => {
  const navigation = useNavigation<GalleryNavigationProp>();
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        setPosts([]);
        return;
      }

      // Check if user is premium
      const userEmail = session.session?.user?.email;
      if (userEmail) {
        const userData = await getUser(userEmail);
        if (userData && userData.length > 0) {
          setIsPremiumUser(userData[0].premium || false);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id, image_url, created_at, overall_rating, potential, body_fat, symmetry, summaryrecc, chest, quads, hamstrings, calves, back, biceps, triceps, shoulders, forearms, traps')
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

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this progress photo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              // Refresh the posts list
              await fetchPosts();
            } catch (error: any) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', error.message || 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

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
        // Build premium scores object if user is premium and scores exist
        const premiumScores = isPremiumUser && (
          item.chest || item.quads || item.hamstrings || item.calves || 
          item.back || item.biceps || item.triceps || item.shoulders || 
          item.forearms || item.traps
        ) ? {
          chest: item.chest ? toScore(item.chest) : undefined,
          quads: item.quads ? toScore(item.quads) : undefined,
          hamstrings: item.hamstrings ? toScore(item.hamstrings) : undefined,
          calves: item.calves ? toScore(item.calves) : undefined,
          back: item.back ? toScore(item.back) : undefined,
          biceps: item.biceps ? toScore(item.biceps) : undefined,
          triceps: item.triceps ? toScore(item.triceps) : undefined,
          shoulders: item.shoulders ? toScore(item.shoulders) : undefined,
          forearms: item.forearms ? toScore(item.forearms) : undefined,
          traps: item.traps ? toScore(item.traps) : undefined,
        } : undefined;

        navigation.navigate('Results', {
          allowSave: false,
          imageUri: item.image_url,
          postId: item.id,
          analysis: {
            overallRating: toScore(item.overall_rating),
            potential: toScore(item.potential),
            bodyFatPercentage: toScore(item.body_fat),
            symmetry: toScore(item.symmetry),
            summaryRecommendation: item.summaryrecc ?? 'No summary available.',
            strengths: [],
            improvements: [],
            premiumScores,
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
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color="rgba(255, 107, 53, 0.8)" />
        </TouchableOpacity>
      </View>
      <View style={styles.overallBadge}>
        <Text style={styles.overallText}>
          {item.overall_rating ? (item.overall_rating / 10).toFixed(1) : '--'}
        </Text>
      </View>
      
      {/* Premium indicator for premium users with premium scores */}
      {isPremiumUser && (
        item.chest || item.quads || item.hamstrings || item.calves || 
        item.back || item.biceps || item.triceps || item.shoulders || 
        item.forearms || item.traps
      ) && (
        <View style={styles.premiumBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.premiumBadgeText}>Premium</Text>
        </View>
      )}
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
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No progress yet</Text>
          <Text style={styles.emptySubtitle}>
            Upload your first scan to start tracking your transformation.
          </Text>
        </View>
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
    backgroundColor: '#000000',
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
    fontFamily: fonts.regular,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.regular,
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fonts.regular,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
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
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 2,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontFamily: fonts.regular,
    fontSize: 10,
    marginLeft: 2,
  },
  fallbackText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default GalleryScreen;

