// Wood species BTU ratings and utilities for burn prediction
// BTU values are in Million BTU per cord (MBTU/cord)

export const WOOD_SPECIES = {
  'White Oak': { btu: 24.0, density: 'high' },
  'Red Oak': { btu: 21.0, density: 'high' },
  'Sugar Maple': { btu: 18.6, density: 'medium-high' },
  'Yellow Birch': { btu: 21.3, density: 'high' },
  'White Birch': { btu: 18.0, density: 'medium' },
  'Ash': { btu: 20.0, density: 'high' },
  'Beech': { btu: 21.8, density: 'high' },
  'Hickory': { btu: 24.6, density: 'very-high' },
  'Black Locust': { btu: 24.8, density: 'very-high' },
  'Cherry': { btu: 18.5, density: 'medium' },
  'Elm': { btu: 19.5, density: 'medium-high' },
  'Walnut': { btu: 19.0, density: 'medium-high' },
  'Pine': { btu: 14.3, density: 'low' },
  'Spruce': { btu: 13.3, density: 'low' },
  'Poplar': { btu: 13.7, density: 'low' },
  'Aspen': { btu: 14.7, density: 'low' }
};

// Get list of species names for dropdowns
export const getSpeciesList = () => {
  return Object.keys(WOOD_SPECIES).sort();
};

// Calculate weighted average BTU from wood mix
// mix is an array of { species: string, percentage: number }
export const calculateMixBTU = (mix) => {
  if (!mix || mix.length === 0) {
    return 0;
  }

  let totalBTU = 0;
  let totalPercentage = 0;

  mix.forEach(({ species, percentage }) => {
    if (WOOD_SPECIES[species]) {
      totalBTU += WOOD_SPECIES[species].btu * (percentage / 100);
      totalPercentage += percentage;
    }
  });

  // Normalize if percentages don't add up to 100
  if (totalPercentage > 0 && totalPercentage !== 100) {
    totalBTU = (totalBTU / totalPercentage) * 100;
  }

  return totalBTU;
};

// Normalize BTU to 0-1 scale for model input
// Uses max BTU (Black Locust at 24.8) as reference
export const normalizeBTU = (btu) => {
  const MAX_BTU = 24.8;
  const MIN_BTU = 13.0;
  return Math.max(0, Math.min(1, (btu - MIN_BTU) / (MAX_BTU - MIN_BTU)));
};

// Get BTU for a single species
export const getSpeciesBTU = (species) => {
  return WOOD_SPECIES[species]?.btu || 0;
};

// Helper to create a simple two-species mix
export const createSimpleMix = (species1, percentage1, species2, percentage2) => {
  return [
    { species: species1, percentage: percentage1 },
    { species: species2, percentage: percentage2 }
  ];
};

// Validate that mix percentages add up to 100
export const validateMix = (mix) => {
  const total = mix.reduce((sum, item) => sum + item.percentage, 0);
  return Math.abs(total - 100) < 0.01; // Allow for floating point errors
};

// Get default mix (50% Maple, 50% Yellow Birch)
export const getDefaultMix = () => {
  return [
    { species: 'Sugar Maple', percentage: 50 },
    { species: 'Yellow Birch', percentage: 50 }
  ];
};

