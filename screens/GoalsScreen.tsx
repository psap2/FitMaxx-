import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { getGoals, createGoal, deleteGoal } from '../utils/api';
import { Goal, GoalInsert } from '../server/lib/db/schema';

type GoalsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Goals'>;

interface GoalsScreenProps {
  navigation: GoalsScreenNavigationProp;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        setGoals([]);
        return;
      }

      const data = await getGoals(userId);
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  const handleAddGoal = async () => {
    if (!newGoal.trim()) {
      Alert.alert('Error', 'Please enter a goal');
      return;
    }

    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be signed in to add goals');
        return;
      }

      // Convert selected date to ISO string
      let targetDateString = null;
      if (selectedDate) {
        targetDateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      const goalData: GoalInsert = {
        goal: newGoal.trim(),
        description: newDescription.trim() || null,
        target_date: targetDateString,
        user: userId,
      };

      await createGoal(goalData);

      setNewGoal('');
      setNewDescription('');
      setSelectedDate(null);
      setShowAddForm(false);
      fetchGoals();
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error: any) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const handleDeleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              fetchGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No target date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return targetDate < today;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading goals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Goal</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter your goal..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newGoal}
              onChangeText={setNewGoal}
              multiline
            />
            
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (optional)..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
            />
            
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateSelectorContent}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <Text style={styles.dateSelectorText}>
                  {selectedDate ? selectedDate.toLocaleDateString() : 'Select target date (optional)'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>
            
            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setSelectedDate(null)}
              >
                <Text style={styles.clearDateText}>Clear date</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleAddGoal}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Add Goal</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={80} color="rgba(255, 107, 53, 0.3)" />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>
              Set your fitness goals to stay motivated and track your progress.
            </Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            {goals.map((goal) => {
              const isExpanded = expandedGoals.has(goal.id);
              const hasDescription = goal.description && goal.description.trim().length > 0;
              
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => toggleGoalExpansion(goal.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalContent}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalText}>{goal.goal}</Text>
                      {hasDescription && (
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="rgba(255, 255, 255, 0.6)" 
                        />
                      )}
                    </View>
                    
                    {isExpanded && hasDescription && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionText}>{goal.description}</Text>
                      </View>
                    )}
                    
                    <View style={styles.goalMeta}>
                      <View style={styles.dateContainer}>
                        <Ionicons 
                          name="calendar-outline" 
                          size={16} 
                          color={isOverdue(goal.target_date) ? "#EF4444" : "rgba(255, 255, 255, 0.6)"} 
                        />
                        <Text style={[
                          styles.dateText,
                          isOverdue(goal.target_date) && styles.overdueText
                        ]}>
                          {formatDate(goal.target_date)}
                        </Text>
                      </View>
                      {isOverdue(goal.target_date) && (
                        <View style={styles.overdueIndicator}>
                          <Text style={styles.overdueLabel}>Overdue</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteGoal(goal.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  formTitle: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    marginLeft: 12,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  clearDateText: {
    color: '#FF6B35',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  saveButton: {
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.regular,
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  goalsContainer: {
    paddingBottom: 20,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalContent: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: '#fff',
    lineHeight: 22,
    marginRight: 8,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: fonts.regular,
    marginLeft: 6,
  },
  overdueText: {
    color: '#EF4444',
  },
  overdueIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overdueLabel: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: fonts.regular,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
