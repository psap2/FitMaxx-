import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const segments = Array.from({ length: totalSteps });

  return (
    <View style={styles.container}>
      <View style={styles.segmentsRow}>
        {segments.map((_, index) => {
          const isFilled = index < currentStep;
          return (
            <View
              key={index}
              style={[styles.segment, isFilled ? styles.segmentFilled : styles.segmentEmpty]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  segmentEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  segmentFilled: {
    backgroundColor: '#FF6B35',
  },
});
