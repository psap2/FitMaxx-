import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { getComments, createComment, deleteComment } from '../server/lib/db/query';
import { Comment } from '../server/lib/db/schema';

type CommentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Comments'>;
type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

interface CommentsScreenProps {
  navigation: CommentsScreenNavigationProp;
  route: CommentsScreenRouteProp;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({ navigation, route }) => {
  const { postId } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndComments = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user?.id;
        setCurrentUserId(userId || null);

        if (postId) {
          const commentsData = await getComments(postId);
          setComments(commentsData || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        Alert.alert('Error', 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !postId) {
      return;
    }

    setSubmitting(true);
    try {
      const comment = await createComment({
        comment: newComment.trim(),
        user: currentUserId,
        post: postId,
      });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (commentUserId !== currentUserId) {
      Alert.alert('Error', 'You can only delete your own comments');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUserId) return;
              await deleteComment(commentId, currentUserId);
              setComments(comments.filter((c) => c.id !== commentId));
            } catch (error: any) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0B0B0F', '#0B0B0F']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#0B0B0F', '#0B0B0F']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
        </View>

        <ScrollView
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to add a comment!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                </View>
                <View style={styles.commentFooter}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.timestamp}>{formatTimestamp(comment.created_at)}</Text>
                    {comment.user === currentUserId && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteComment(comment.id, comment.user)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.2)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#fff',
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  commentCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
  },
  commentHeader: {
    marginBottom: 12,
  },
  commentText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#fff',
    lineHeight: 22,
  },
  commentFooter: {
    alignItems: 'flex-end',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: fonts.regular,
  },
  deleteButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(11, 11, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.2)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.regular,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
});

