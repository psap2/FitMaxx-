import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { GlassCard } from './GlassCard';

interface MuscleScoreChartProps {
  muscleScores: {
    chest: number;
    shoulders: number;
    arms: number;
    legs: number;
    abs: number;
  };
}

export const MuscleScoreChart: React.FC<MuscleScoreChartProps> = ({ muscleScores }) => {
  const screenWidth = Dimensions.get('window').width - 40;

  const data = {
    labels: ['Chest', 'Shoulders', 'Arms', 'Legs', 'Abs'],
    datasets: [
      {
        data: [
          muscleScores.chest,
          muscleScores.shoulders,
          muscleScores.arms,
          muscleScores.legs,
          muscleScores.abs,
        ],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(255, 107, 53, 0.1)',
    backgroundGradientTo: 'rgba(255, 140, 66, 0.1)',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
  };

  return (
    <GlassCard style={styles.container}>
      <Text style={styles.title}>Muscle Group Scores</Text>
      <BarChart
        data={data}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix="/10"
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
});