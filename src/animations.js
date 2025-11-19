/**
 * Animation system for smooth value transitions
 */

import { easeInOutCubic } from './utils.js';

/**
 * Animate value change with smooth transitions
 * @param {Object} context - The card instance context
 * @param {number} fromValue - Starting value
 * @param {number} toValue - Target value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 */
export function animateValueChange(context, fromValue, toValue, min, max) {
  const ledsCount = context.ledsCount || context.config.leds_count || 100;
  const duration = context.config.animation_duration || 800;
  const steps = 20;
  const stepDuration = duration / steps;

  const valueRange = toValue - fromValue;

  // Cancel any ongoing animation
  if (context.animationInterval) {
    clearInterval(context.animationInterval);
  }

  let step = 0;

  context.animationInterval = setInterval(() => {
    step++;
    const progress = step / steps;
    const easedProgress = easeInOutCubic(progress);
    const currentValue = fromValue + valueRange * easedProgress;

    // Update LEDs with actual value (not normalized)
    if (context._updateLeds) {
      context._updateLeds(currentValue, ledsCount, min, max);
    }

    // For center shadow, use normalized value for color but pass real value for pulsation
    const normalizedValue = ((currentValue - min) / (max - min)) * 100;
    if (context._updateCenterShadow) {
      context._updateCenterShadow(normalizedValue, currentValue, min, max);
    }

    // Update displayed value
    const valueDisplay = context.shadowRoot?.querySelector(".value");
    if (valueDisplay) {
      valueDisplay.textContent = currentValue.toFixed(context.config.decimals || 0);
    }

    if (step >= steps) {
      clearInterval(context.animationInterval);
      context.animationInterval = null;
    }
  }, stepDuration);
}

/**
 * Setup visibility observer for power save mode
 * @param {Object} context - The card instance context
 */
export function setupVisibilityObserver(context) {
  if (!context.config.power_save_mode) return;

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: context.config.power_save_threshold / 100
  };

  context.intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      context.isVisible = entry.isIntersecting;

      // Update immediately when card becomes visible
      if (context.isVisible && context._hass && context._updateGauge) {
        context._updateGauge();
      }
    });
  }, options);

  // Observe the card itself
  context.intersectionObserver.observe(context);
}

/**
 * Start center shadow pulsation effect for alarm
 * @param {Object} context - The card instance context
 * @param {number} value - Current value (actual value, not normalized)
 * @param {number} min - Minimum value of the gauge
 * @param {number} max - Maximum value of the gauge
 */
export function startCenterShadowPulsation(context, value, min, max) {
  if (!context.config.center_shadow || !context.config.center_shadow_pulse) return;

  const pulseMin = context.config.center_shadow_pulse_min !== undefined ? context.config.center_shadow_pulse_min : min;
  const pulseMax = context.config.center_shadow_pulse_max !== undefined ? context.config.center_shadow_pulse_max : max;

  // Check if value is within alarm zone (using real values)
  const isInAlarmZone = value >= pulseMin && value <= pulseMax;

  if (isInAlarmZone && !context.pulsationInterval) {
    // Start pulsation
    const duration = context.config.center_shadow_pulse_duration || 1000;
    const intensity = context.config.center_shadow_pulse_intensity;
    const baseBlur = context.config.center_shadow_blur || 30;
    const baseSpread = context.config.center_shadow_spread || 15;

    let startTime = Date.now();

    context.pulsationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration; // 0 to 1 cycle

      // Sinusoidal wave for smooth pulsation (0 to 1 to 0)
      const wave = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;

      // Calculate intensity multiplier (from intensity to 1.0)
      const intensityMultiplier = intensity + (1 - intensity) * wave;

      // Calculate opacity (from intensity to 1.0 for smooth fade)
      const opacity = intensity + (1 - intensity) * wave;

      const currentBlur = baseBlur * intensityMultiplier;
      const currentSpread = baseSpread * intensityMultiplier;

      const centerShadow = context.shadowRoot?.getElementById("center-shadow");
      if (centerShadow && context.currentShadowColor) {
        // Extract RGB from color and add opacity
        const colorWithOpacity = context.currentShadowColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        centerShadow.style.boxShadow = `0 0 ${currentBlur}px ${currentSpread}px ${colorWithOpacity}`;
      }
    }, 16); // ~60fps for smooth animation
  } else if (!isInAlarmZone && context.pulsationInterval) {
    // Stop pulsation and restore normal shadow
    clearInterval(context.pulsationInterval);
    context.pulsationInterval = null;

    // Restore normal shadow without pulsation (convert to normalized value)
    if (context._updateCenterShadow) {
      const normalizedValue = ((value - min) / (max - min)) * 100;
      context._updateCenterShadow(normalizedValue);
    }
  }
}

/**
 * Stop center shadow pulsation
 * @param {Object} context - The card instance context
 */
export function stopCenterShadowPulsation(context) {
  if (context.pulsationInterval) {
    clearInterval(context.pulsationInterval);
    context.pulsationInterval = null;
  }
}
