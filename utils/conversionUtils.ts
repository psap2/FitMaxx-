/**
 * Utility functions for converting height and weight units
 */

type HeightData = { feet: number; inches: number } | { cm: number };
type WeightData = { value: number; unit: 'lbs' | 'kg' };

/**
 * Converts height to inches
 * @param heightData - Height data in either {feet, inches} or {cm} format
 * @returns Height in inches as a number
 */
export const convertHeightToInches = (heightData: HeightData): number => {
  if ('cm' in heightData) {
    // Convert cm to inches: 1 cm = 0.393701 inches
    return heightData.cm / 2.54;
  } else {
    // Convert feet and inches to total inches
    return heightData.feet * 12 + heightData.inches;
  }
};

/**
 * Converts weight to pounds
 * @param weightData - Weight data with value and unit
 * @returns Weight in pounds as a number
 */
export const convertWeightToLbs = (weightData: WeightData): number => {
  if (weightData.unit === 'kg') {
    // Convert kg to lbs: 1 kg = 2.20462 lbs
    return weightData.value * 2.20462;
  } else {
    // Already in lbs
    return weightData.value;
  }
};

