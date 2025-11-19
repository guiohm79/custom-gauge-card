/**
 * Utility functions for the Custom Gauge Card
 */

/**
 * Easing function for smooth animations
 * @param {number} t - Progress value between 0 and 1
 * @returns {number} Eased value
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Get the entity type from an entity_id
 * @param {string} entityId - The entity ID
 * @returns {string|null} The entity type (domain)
 */
export function getEntityType(entityId) {
  if (!entityId) return null;
  return entityId.split('.')[0];
}

/**
 * Get default icon based on entity type
 * @param {string} entityType - The entity type
 * @returns {string} Default icon character
 */
export function getDefaultIcon(entityType) {
  const icons = {
    'switch': '●',
    'light': '💡',
    'scene': '🎬',
    'script': '▶',
    'input_boolean': '●',
    'automation': '🤖',
    'fan': '🌀',
    'cover': '🪟',
    'climate': '🌡️',
    'lock': '🔒',
    'vacuum': '🤖'
  };
  return icons[entityType] || '●';
}

/**
 * Get LED color based on value and severity configuration
 * @param {number} value - Current value percentage (0-100)
 * @param {Array} severity - Severity configuration array (uses real sensor values)
 * @param {number} min - Minimum value of the gauge (default: 0)
 * @param {number} max - Maximum value of the gauge (default: 100)
 * @returns {string} Color hex code
 */
export function getLedColor(value, severity, min = 0, max = 100) {
  const defaultSeverity = [
    { color: "#4caf50", value: 20 },
    { color: "#ffeb3b", value: 50 },
    { color: "#f44336", value: 100 },
  ];

  const severityConfig = severity || defaultSeverity;

  // Convert severity values from real sensor values to percentages
  for (const zone of severityConfig) {
    // Convert real value to percentage
    const thresholdPercentage = ((zone.value - min) / (max - min)) * 100;

    if (value <= thresholdPercentage) {
      return zone.color;
    }
  }

  return "#555";
}

/**
 * Optimize LED count based on configuration
 * @param {number} configuredCount - Configured LED count
 * @returns {number} Optimized LED count
 */
export function optimizeLEDs(configuredCount) {
  return configuredCount || 100;
}

/**
 * Calculate bidirectional LED activation
 * @param {number} value - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} ledsCount - Total number of LEDs
 * @param {boolean} bidirectional - Enable bidirectional mode
 * @returns {Object} Object with activeLeds count and direction ('positive', 'negative', or 'unidirectional')
 */
export function calculateBidirectionalLeds(value, min, max, ledsCount, bidirectional) {
  // Calculate full-range normalized value for severity colors (always needed)
  const fullRangeNormalized = ((value - min) / (max - min)) * 100;

  if (!bidirectional) {
    // Standard unidirectional behavior
    const activeLeds = Math.round((fullRangeNormalized / 100) * ledsCount);
    return {
      activeLeds,
      direction: 'unidirectional',
      normalizedValue: fullRangeNormalized
    };
  }

  // Bidirectional mode: reference point is at the top (LED index 0)
  // Values above reference go clockwise (to the right)
  // Values below reference go counter-clockwise (to the left)

  // Determine reference point (adaptive zero)
  const referencePoint = (min <= 0 && max >= 0) ? 0 : (min + max) / 2;

  // Calculate range sizes on each side of reference
  const totalRange = max - min;
  const lowerRange = referencePoint - min;  // Size from min to reference
  const upperRange = max - referencePoint;  // Size from reference to max

  // Calculate proportional LED allocation
  const lowerProportion = lowerRange / totalRange;
  const upperProportion = upperRange / totalRange;

  if (value >= referencePoint) {
    // Upper values: calculate percentage from reference to max
    const percentage = upperRange > 0 ? ((value - referencePoint) / upperRange) * 100 : 0;
    // Allocate LEDs proportionally based on upper range's share of total
    const maxUpperLeds = ledsCount * upperProportion;
    const activeLeds = Math.round((percentage / 100) * maxUpperLeds);

    return {
      activeLeds,
      direction: 'positive',
      normalizedValue: fullRangeNormalized  // Use full-range for severity colors
    };
  } else {
    // Lower values: calculate percentage from reference to min
    const percentage = lowerRange > 0 ? ((referencePoint - value) / lowerRange) * 100 : 0;
    // Allocate LEDs proportionally based on lower range's share of total
    const maxLowerLeds = ledsCount * lowerProportion;
    const activeLeds = Math.round((percentage / 100) * maxLowerLeds);

    return {
      activeLeds,
      direction: 'negative',
      normalizedValue: fullRangeNormalized  // Use full-range for severity colors
    };
  }
}

/**
 * Convert value to angle based on bidirectional or unidirectional mode
 * @param {number} value - The value to convert
 * @param {number} min - Minimum range value
 * @param {number} max - Maximum range value
 * @param {boolean} bidirectional - Whether bidirectional mode is enabled
 * @returns {number} Angle in degrees (0-360)
 */
export function valueToAngle(value, min, max, bidirectional) {
  if (!bidirectional) {
    // Unidirectional mode: simple linear mapping
    const percentage = ((value - min) / (max - min)) * 100;
    return (percentage / 100) * 360;
  }

  // Bidirectional mode: proportional allocation with adaptive reference point

  // Determine reference point (adaptive zero)
  const referencePoint = (min <= 0 && max >= 0) ? 0 : (min + max) / 2;

  // Calculate range sizes on each side of reference
  const totalRange = max - min;
  const lowerRange = referencePoint - min;  // Size from min to reference
  const upperRange = max - referencePoint;  // Size from reference to max

  // Calculate proportional angle allocation (total 360°)
  const lowerProportion = lowerRange / totalRange;
  const upperProportion = upperRange / totalRange;
  const maxLowerAngle = lowerProportion * 360;  // Degrees allocated to lower side
  const maxUpperAngle = upperProportion * 360;  // Degrees allocated to upper side

  if (value >= referencePoint) {
    // Upper values: go clockwise from top (0° to maxUpperAngle)
    const percentage = upperRange > 0 ? ((value - referencePoint) / upperRange) * 100 : 0;
    return (percentage / 100) * maxUpperAngle;
  } else {
    // Lower values: go counter-clockwise from top (360° to 360° - maxLowerAngle)
    const percentage = lowerRange > 0 ? ((referencePoint - value) / lowerRange) * 100 : 0;
    return 360 - ((percentage / 100) * maxLowerAngle);
  }
}
