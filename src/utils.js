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
 * @param {number} value - Current value percentage
 * @param {Array} severity - Severity configuration array
 * @returns {string} Color hex code
 */
export function getLedColor(value, severity) {
  const defaultSeverity = [
    { color: "#4caf50", value: 20 },
    { color: "#ffeb3b", value: 50 },
    { color: "#f44336", value: 100 },
  ];

  const severityConfig = severity || defaultSeverity;

  for (const zone of severityConfig) {
    if (value <= zone.value) {
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
