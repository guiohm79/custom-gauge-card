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

    // Calculate normalized percentage
    const normalizedValue = ((currentValue - min) / (max - min)) * 100;

    // Update LEDs and shadows (these functions will be called from the main class)
    if (context._updateLeds) {
      context._updateLeds(normalizedValue, ledsCount);
    }

    if (context._updateCenterShadow) {
      context._updateCenterShadow(normalizedValue);
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
