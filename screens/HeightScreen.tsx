import React, { useState, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProgressBar } from '../components/ProgressBar';
import { fonts } from '../theme/fonts';
import { RootStackParamList } from '../types';

type HeightScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Height'>;
type HeightScreenRouteProp = RouteProp<RootStackParamList, 'Height'>;

interface HeightScreenProps {
  navigation: HeightScreenNavigationProp;
  route: HeightScreenRouteProp;
}

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 3;

// Scrollable Picker Component
const ScrollablePicker: React.FC<{
  items: number[];
  selectedValue: number | null;
  onValueChange: (value: number) => void;
  label: string;
}> = ({ items, selectedValue, onValueChange, label }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const getInitialIndex = () => {
    if (selectedValue !== null) {
      const index = items.indexOf(selectedValue);
      return index !== -1 ? index : Math.floor(items.length / 2);
    }
    return Math.floor(items.length / 2);
  };
  const [selectedIndex, setSelectedIndex] = useState(getInitialIndex);
  const [visualIndex, setVisualIndex] = useState(getInitialIndex); // For instant highlight update
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const initializedRef = useRef(false);
  const scrollY = useRef(0);
  const isProgrammaticScroll = useRef(false);

  // Generate snap offsets for precise snapping
  const snapOffsets = React.useMemo(() => {
    return items.map((_, index) => index * ITEM_HEIGHT);
  }, [items]);

  // Use useLayoutEffect to update index synchronously before paint to prevent flash
  useLayoutEffect(() => {
    if (selectedValue !== null) {
      const index = items.indexOf(selectedValue);
      if (index !== -1) {
        const targetY = index * ITEM_HEIGHT;
        // Update index and scroll position immediately before render
        scrollY.current = targetY;
        if (index !== selectedIndex) {
          setSelectedIndex(index);
          setVisualIndex(index);
        }
        initializedRef.current = true;
        // Scroll instantly
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: targetY,
            animated: false,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedValue]);

  React.useEffect(() => {
    if (selectedValue !== null) {
      const index = items.indexOf(selectedValue);
      if (index !== -1) {
        const targetY = index * ITEM_HEIGHT;
        // Update scroll position ref immediately to prevent flashing
        scrollY.current = targetY;
        setVisualIndex(index);
        // Scroll instantly without animation
        if (scrollViewRef.current) {
          isProgrammaticScroll.current = true;
          scrollViewRef.current.scrollTo({
            y: targetY,
            animated: false,
          });
          isProgrammaticScroll.current = false;
        }
      }
    } else if (!initializedRef.current && selectedValue === null) {
      // Set default immediately on first mount
      const defaultIndex = Math.floor(items.length / 2);
      const targetY = defaultIndex * ITEM_HEIGHT;
      scrollY.current = targetY;
      setSelectedIndex(defaultIndex);
      setVisualIndex(defaultIndex);
      initializedRef.current = true;
      onValueChange(items[defaultIndex]);
      
      // Scroll instantly without delay
      if (scrollViewRef.current) {
        isProgrammaticScroll.current = true;
        scrollViewRef.current.scrollTo({
          y: targetY,
          animated: false,
        });
        isProgrammaticScroll.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, items]);

  const handleScroll = (event: any) => {
    // Don't update during programmatic scroll to prevent flashing
    if (isProgrammaticScroll.current) {
      return;
    }
    
    const y = event.nativeEvent.contentOffset.y;
    scrollY.current = y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    
    // Only update visual state, don't trigger value change during scroll
    if (clampedIndex !== selectedIndex) {
      setVisualIndex(clampedIndex);
    }
  };

  const snapToNearest = (y: number) => {
    // Find the closest snap position
    let closestIndex = 0;
    let minDistance = Math.abs(y - snapOffsets[0]);
    
    for (let i = 1; i < snapOffsets.length; i++) {
      const distance = Math.abs(y - snapOffsets[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    const targetY = snapOffsets[closestIndex];
    scrollY.current = targetY;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: false,
      });
    }
    
    setSelectedIndex(closestIndex);
    setVisualIndex(closestIndex);
    onValueChange(items[closestIndex]);
  };

  const handleItemPress = (index: number) => {
    // If clicking the selected item, open edit modal
    if (index === selectedIndex) {
      setEditingIndex(index);
      setEditValue(items[index].toString());
      return;
    }

    // Otherwise, scroll to the clicked item
    const targetY = snapOffsets[index];
    
    // Update state and scroll position synchronously to prevent flashing
    isProgrammaticScroll.current = true;
    scrollY.current = targetY;
    setSelectedIndex(index);
    setVisualIndex(index);
    onValueChange(items[index]);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: false,
      });
    }
    
    // Reset flag immediately
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  };

  const handleIncrement = () => {
    if (selectedIndex < items.length - 1) {
      const newIndex = selectedIndex + 1;
      const targetY = snapOffsets[newIndex];
      
      // Update visual index immediately for instant highlight (state update triggers re-render)
      setVisualIndex(newIndex);
      
      // Use animated scroll for plus/minus buttons
      isProgrammaticScroll.current = true;
      scrollY.current = targetY;
      setSelectedIndex(newIndex);
      onValueChange(items[newIndex]);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: targetY,
          animated: true, // Animated scroll for buttons
        });
      }
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 300);
    }
  };

  const handleDecrement = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      const targetY = snapOffsets[newIndex];
      
      // Update visual index immediately for instant highlight (state update triggers re-render)
      setVisualIndex(newIndex);
      
      // Use animated scroll for plus/minus buttons
      isProgrammaticScroll.current = true;
      scrollY.current = targetY;
      setSelectedIndex(newIndex);
      onValueChange(items[newIndex]);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: targetY,
          animated: true, // Animated scroll for buttons
        });
      }
      
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 300);
    }
  };

  const handleEditConfirm = () => {
    if (editingIndex !== null) {
      const numValue = parseInt(editValue, 10);
      if (!isNaN(numValue) && items.includes(numValue)) {
        const newIndex = items.indexOf(numValue);
        const targetY = snapOffsets[newIndex];
        
        isProgrammaticScroll.current = true;
        scrollY.current = targetY;
        setSelectedIndex(newIndex);
        onValueChange(items[newIndex]);
        
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: targetY,
            animated: false,
          });
        }
        
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
        });
      }
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleScrollEndDrag = (event: any) => {
    // Ignore if this is from a programmatic scroll (click)
    if (isProgrammaticScroll.current) {
      return;
    }
    const y = event.nativeEvent.contentOffset.y;
    snapToNearest(y);
  };

  const handleMomentumScrollEnd = (event: any) => {
    // Ignore if this is from a programmatic scroll (click)
    if (isProgrammaticScroll.current) {
      return;
    }
    const y = event.nativeEvent.contentOffset.y;
    snapToNearest(y);
  };

  const handleScrollBeginDrag = () => {
    // Ensure we're at a valid position before starting drag
    const currentY = scrollY.current;
    const index = Math.round(currentY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const targetY = snapOffsets[clampedIndex];
    
    if (Math.abs(currentY - targetY) > 1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: false,
      });
    }
  };

  const handleLayout = () => {
    // Immediately set scroll position when layout completes
    if (scrollViewRef.current && selectedValue !== null) {
      const index = items.indexOf(selectedValue);
      if (index !== -1) {
        const targetY = index * ITEM_HEIGHT;
        scrollY.current = targetY;
        // Update selectedIndex immediately to prevent flash
        setSelectedIndex(index);
        isProgrammaticScroll.current = true;
        scrollViewRef.current.scrollTo({
          y: targetY,
          animated: false,
        });
        isProgrammaticScroll.current = false;
      }
    } else if (scrollViewRef.current && !initializedRef.current && selectedValue === null) {
      const defaultIndex = Math.floor(items.length / 2);
      const targetY = defaultIndex * ITEM_HEIGHT;
      scrollY.current = targetY;
      setSelectedIndex(defaultIndex);
      isProgrammaticScroll.current = true;
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: false,
      });
      onValueChange(items[defaultIndex]);
      initializedRef.current = true;
      isProgrammaticScroll.current = false;
    }
  };

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerRowContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleDecrement}
          disabled={selectedIndex === 0}
        >
          <Ionicons
            name="remove"
            size={24}
            color={selectedIndex === 0 ? 'rgba(255, 107, 53, 0.3)' : '#FF6B35'}
          />
        </TouchableOpacity>
        
        <View style={styles.pickerWrapper} onLayout={handleLayout}>
          <View style={styles.pickerSelection} />
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            decelerationRate={0.98}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            contentContainerStyle={styles.pickerContent}
            bounces={false}
            overScrollMode="never"
            scrollEnabled={true}
            nestedScrollEnabled={false}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.pickerItem}
                onPress={() => handleItemPress(index)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    index === visualIndex && styles.pickerItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleIncrement}
          disabled={selectedIndex === items.length - 1}
        >
          <Ionicons
            name="add"
            size={24}
            color={selectedIndex === items.length - 1 ? 'rgba(255, 107, 53, 0.3)' : '#FF6B35'}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={editingIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleEditCancel}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Enter {label.toLowerCase()}</Text>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity style={styles.editButton} onPress={handleEditCancel}>
                <Text style={styles.editButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.editButtonConfirm]} onPress={handleEditConfirm}>
                <Text style={[styles.editButtonText, styles.editButtonTextConfirm]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const HeightScreen: React.FC<HeightScreenProps> = ({ navigation, route }) => {
  const [unit, setUnit] = useState<'ft' | 'cm'>('ft');
  const [feet, setFeet] = useState<number | null>(5); // Default: 5 feet
  const [inches, setInches] = useState<number | null>(10); // Default: 10 inches
  const [cm, setCm] = useState<number | null>(null);

  const feetItems = Array.from({ length: 8 }, (_, i) => i + 1);
  const inchesItems = Array.from({ length: 12 }, (_, i) => i);
  const cmItems = Array.from({ length: 150 }, (_, i) => i + 50);

  const isValid = unit === 'ft' ? (feet !== null && inches !== null) : cm !== null;

  const handleContinue = () => {
    if (isValid) {
      const heightData = unit === 'ft' 
        ? { feet: feet!, inches: inches! }
        : { cm: cm! };
      
      navigation.navigate('Weight', { 
        gender: route.params.gender,
        height: heightData 
      });
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
        <ProgressBar currentStep={2} totalSteps={6} />
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#FF6B35" />
        </View>
      </TouchableOpacity>
        
        <View style={styles.content}>
        <Text style={styles.title}>What's your height?</Text>
        <Text style={styles.subtitle}>This helps us calculate accurate metrics</Text>

        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'ft' && styles.unitButtonActive]}
            onPress={() => {
              setUnit('ft');
              // Set defaults if not already set
              if (feet === null) setFeet(5);
              if (inches === null) setInches(10);
            }}
          >
            <Text style={[styles.unitText, unit === 'ft' && styles.unitTextActive]}>ft/in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'cm' && styles.unitButtonActive]}
            onPress={() => {
              setUnit('cm');
              // Convert from feet/inches to cm if switching, or set default
              if (feet !== null && inches !== null && unit === 'ft') {
                const totalInches = feet * 12 + inches;
                const cmValue = Math.round(totalInches * 2.54);
                setCm(Math.max(50, Math.min(250, cmValue)));
              } else if (cm === null) {
                setCm(175);
              }
            }}
          >
            <Text style={[styles.unitText, unit === 'cm' && styles.unitTextActive]}>cm</Text>
          </TouchableOpacity>
        </View>

        {unit === 'ft' ? (
          <View style={styles.pickerRow}>
            <ScrollablePicker
              key="feet"
              items={feetItems}
              selectedValue={feet}
              onValueChange={setFeet}
              label="feet"
            />
            <ScrollablePicker
              key="inches"
              items={inchesItems}
              selectedValue={inches}
              onValueChange={setInches}
              label="inches"
            />
          </View>
        ) : (
          <View style={styles.pickerRow}>
            <ScrollablePicker
              key="cm"
              items={cmItems}
              selectedValue={cm}
              onValueChange={setCm}
              label="centimeters"
            />
          </View>
        )}
      </View>

        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          >
            <Text style={styles.continueText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.regular,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 60,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 40,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: '#FF6B35',
  },
  unitText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  unitTextActive: {
    color: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 20,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginTop: 20,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  pickerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  pickerSelection: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.4)',
    zIndex: 1,
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    paddingVertical: ITEM_HEIGHT,
    paddingHorizontal: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pickerItemText: {
    fontSize: 32,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: ITEM_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pickerItemTextSelected: {
    fontSize: 48,
    fontFamily: fonts.regular,
    color: '#FF6B35',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: ITEM_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
  },
  continueButton: {
    marginHorizontal: 20,
    marginBottom: 64,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    letterSpacing: 0.3,
  },
  backButton: {
    position: 'absolute',
    top: 90,
    left: 20,
    zIndex: 10,
    width: 48,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  editModalTitle: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontFamily: fonts.regular,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    marginBottom: 20,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  editButtonConfirm: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  editButtonText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  editButtonTextConfirm: {
    color: '#fff',
  },
});
