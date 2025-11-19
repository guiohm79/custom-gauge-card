/**
 * Dynamic Markers Module
 * Handles entity-driven markers that update in real-time based on Home Assistant entity values
 */

/**
 * Creates dynamic marker elements in the DOM
 * @param {Object} context - The CustomGaugeCard instance
 */
export function createDynamicMarkers(context) {
  if (!context.config.dynamic_markers || !Array.isArray(context.config.dynamic_markers)) {
    return;
  }

  const gauge = context.shadowRoot.querySelector('.gauge');
  if (!gauge) {
    console.warn('Gauge element not found, cannot create dynamic markers');
    return;
  }

  // Clean up any existing dynamic markers
  if (context._dynamicMarkerElements) {
    context._dynamicMarkerElements.forEach(el => el.remove());
  }
  context._dynamicMarkerElements = [];
  context._dynamicMarkerData = new Map();

  const gaugeSize = context.config.gauge_size || 200;

  context.config.dynamic_markers.forEach((markerConfig, index) => {
    if (!markerConfig.entity) {
      console.warn('Dynamic marker configuration missing entity', markerConfig);
      return;
    }

    // Create marker container
    const container = document.createElement('div');
    container.className = 'dynamic-marker-container';
    container.dataset.entity = markerConfig.entity;
    container.dataset.index = index;

    // Create the circular dot
    const markerDot = document.createElement('div');
    markerDot.className = 'dynamic-marker';
    const size = markerConfig.size || 8;
    const color = markerConfig.color || '#4CAF50'; // Default green, will be updated if 'auto'

    markerDot.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
    `;

    container.appendChild(markerDot);

    // Create label if configured
    if (markerConfig.label) {
      const label = document.createElement('div');
      label.className = 'dynamic-marker-label';
      label.textContent = markerConfig.label;
      container.appendChild(label);
    }

    // Create value display if configured
    if (markerConfig.show_value) {
      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'dynamic-marker-value';
      valueDisplay.textContent = '-';
      container.appendChild(valueDisplay);
    }

    // Store initial position (will be updated by updateDynamicMarkers)
    container.style.cssText = `
      position: absolute;
      transform: rotate(-90deg) translateX(${gaugeSize / 2 - 10}px);
      transform-origin: center center;
      transition: transform 0.3s ease-in-out;
    `;

    gauge.appendChild(container);
    context._dynamicMarkerElements.push(container);

    // Store marker configuration and state
    context._dynamicMarkerData.set(markerConfig.entity, {
      config: markerConfig,
      element: container,
      currentAngle: -90, // Start at top
      targetAngle: -90
    });
  });
}

/**
 * Updates dynamic marker positions based on current entity states
 * @param {Object} context - The CustomGaugeCard instance
 * @param {Object} hass - Home Assistant state object
 */
export function updateDynamicMarkers(context, hass) {
  if (!context._dynamicMarkerElements || context._dynamicMarkerElements.length === 0) {
    return;
  }

  const min = context.config.min || 0;
  const max = context.config.max || 100;
  const range = max - min;
  const gaugeSize = context.config.gauge_size || 200;
  const animationDuration = context.config.animation_duration || 1000;

  context._dynamicMarkerData.forEach((markerData, entityId) => {
    const entity = hass.states[entityId];

    if (!entity) {
      console.warn(`Dynamic marker entity not found: ${entityId}`);
      // Hide the marker if entity doesn't exist
      markerData.element.style.opacity = '0';
      return;
    }

    // Show marker if it was hidden
    markerData.element.style.opacity = '1';

    // Get entity value
    let value = parseFloat(entity.state);
    if (isNaN(value)) {
      console.warn(`Dynamic marker entity has non-numeric state: ${entityId} = ${entity.state}`);
      return;
    }

    // Clamp value to min/max range
    value = Math.max(min, Math.min(max, value));

    // Calculate angle based on value
    let targetAngle;

    if (context.config.bidirectional) {
      // Bidirectional mode: reference point at top (0°/-90° rotated)

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
        // Upper values: go clockwise from top
        const percentage = upperRange > 0 ? ((value - referencePoint) / upperRange) * 100 : 0;
        const angle = (percentage / 100) * maxUpperAngle;  // 0° to maxUpperAngle
        targetAngle = angle - 90;
      } else {
        // Lower values: go counter-clockwise from top
        const percentage = lowerRange > 0 ? ((referencePoint - value) / lowerRange) * 100 : 0;
        const angle = 360 - ((percentage / 100) * maxLowerAngle);  // 360° down by maxLowerAngle
        targetAngle = angle - 90;
      }
    } else {
      // Unidirectional mode: standard linear mapping
      const percentage = ((value - min) / range) * 100;
      const angle = (percentage / 100) * 360;
      targetAngle = angle - 90; // Offset to start at top
    }

    // Update marker position with smooth transition
    const container = markerData.element;
    const markerDot = container.querySelector('.dynamic-marker');

    // Update transition duration based on config
    const useAnimation = context.config.smooth_transitions !== false;
    const duration = useAnimation ? (animationDuration / 1000) : 0;
    container.style.transition = `transform ${duration}s ease-in-out`;
    container.style.transform = `rotate(${targetAngle}deg) translateX(${gaugeSize / 2 - 10}px)`;

    // Update color if set to 'auto' or not specified
    if (!markerData.config.color || markerData.config.color === 'auto') {
      const autoColor = _getEntityColor(entity);
      markerDot.style.background = autoColor;
    }

    // Update value display if enabled
    if (markerData.config.show_value) {
      const valueDisplay = container.querySelector('.dynamic-marker-value');
      if (valueDisplay) {
        const unit = entity.attributes.unit_of_measurement || '';
        valueDisplay.textContent = `${value.toFixed(1)}${unit}`;
      }
    }

    // Counter-rotate label and value to keep them upright
    const label = container.querySelector('.dynamic-marker-label');
    const valueDisplay = container.querySelector('.dynamic-marker-value');

    if (label || valueDisplay) {
      const counterRotation = -targetAngle;
      if (label) {
        label.style.transform = `rotate(${counterRotation}deg)`;
        label.style.transition = `transform ${duration}s ease-in-out`;
      }
      if (valueDisplay) {
        valueDisplay.style.transform = `rotate(${counterRotation}deg)`;
        valueDisplay.style.transition = `transform ${duration}s ease-in-out`;
      }
    }

    // Store current angle for future reference
    markerData.currentAngle = targetAngle;
  });
}

/**
 * Gets an appropriate color for an entity based on its domain or state
 * @param {Object} entity - Home Assistant entity object
 * @returns {string} Hex color code
 */
function _getEntityColor(entity) {
  const domain = entity.entity_id.split('.')[0];

  // Domain-based colors
  const domainColors = {
    'sensor': '#2196F3',      // Blue
    'input_number': '#4CAF50', // Green
    'climate': '#FF9800',      // Orange
    'light': '#FFC107',        // Amber
    'switch': '#9C27B0',       // Purple
    'binary_sensor': '#00BCD4' // Cyan
  };

  return domainColors[domain] || '#4CAF50'; // Default green
}

/**
 * Cleanup function to remove all dynamic markers
 * @param {Object} context - The CustomGaugeCard instance
 */
export function removeDynamicMarkers(context) {
  if (context._dynamicMarkerElements) {
    context._dynamicMarkerElements.forEach(el => el.remove());
    context._dynamicMarkerElements = [];
  }
  if (context._dynamicMarkerData) {
    context._dynamicMarkerData.clear();
  }
}
