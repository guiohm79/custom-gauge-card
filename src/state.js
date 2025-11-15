/**
 * State management for the gauge card
 */

import { getLedColor } from './utils.js';
import { animateValueChange } from './animations.js';

/**
 * Update the gauge based on current state
 * @param {Object} context - The card instance context
 */
export function updateGauge(context) {
  const entityState = context._hass.states[context.config.entity];
  if (!entityState) return;

  const state = parseFloat(entityState?.state || "0");
  const previousState = context.previousState !== null ? context.previousState : state;

  const min = context.config.min || 0;
  const max = context.config.max || 100;

  // Use smooth transitions if enabled and value has changed
  if (context.config.smooth_transitions && previousState !== state) {
    animateValueChange(context, previousState, state, min, max);
  } else {
    // Direct update without animation
    const normalizedValue = ((state - min) / (max - min)) * 100;
    const ledsCount = context.ledsCount || context.config.leds_count || 100;

    updateLeds(context, normalizedValue, ledsCount);
    updateCenterShadow(context, normalizedValue);

    const valueDisplay = context.shadowRoot.querySelector(".value");
    const unitDisplay = context.shadowRoot.querySelector(".unit");
    if (valueDisplay) valueDisplay.textContent = state.toFixed(context.config.decimals || 0);
    if (unitDisplay) unitDisplay.textContent = context.config.unit || "";
  }

  // Store current state for next update
  context.previousState = state;

  // Update all buttons
  if (context._updateButtonsState) {
    context._updateButtonsState();
  }
}

/**
 * Update LED states
 * @param {Object} context - The card instance context
 * @param {number} value - Current value percentage
 * @param {number} ledsCount - Number of LEDs
 */
export function updateLeds(context, value, ledsCount) {
  const activeLeds = Math.round((value / 100) * ledsCount);
  const color = getLedColor(value, context.config.severity);

  if (context.config.enable_shadow) {
    const gaugeContainer = context.shadowRoot.getElementById("gauge-container");
    if (gaugeContainer) {
      gaugeContainer.style.boxShadow = `0 0 30px 2px ${color}`;
    }
  }

  for (let i = 0; i < ledsCount; i++) {
    const led = context.shadowRoot.getElementById(`led-${i}`);
    if (!led) continue;

    if (i < activeLeds) {
      led.style.display = "";
      led.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.8), ${color})`;
      led.style.boxShadow = `0 0 8px ${color}`;
      led.classList.add("active");
    } else {
      if (context.config.hide_inactive_leds) {
        led.style.display = "none";
      } else {
        led.style.display = "";
        led.style.background = "#333";
        led.style.boxShadow = "none";
      }
      led.classList.remove("active");
    }
  }
}

/**
 * Update center shadow effect
 * @param {Object} context - The card instance context
 * @param {number} value - Current value percentage
 */
export function updateCenterShadow(context, value) {
  if (!context.config.center_shadow) return;

  const color = getLedColor(value, context.config.severity);
  const blur = context.config.center_shadow_blur || 30;
  const spread = context.config.center_shadow_spread || 15;
  const centerShadow = context.shadowRoot.getElementById("center-shadow");

  if (centerShadow) {
    centerShadow.style.boxShadow = `0 0 ${blur}px ${spread}px ${color}`;
  }
}

/**
 * Show entity history dialog
 * @param {Object} context - The card instance context
 */
export function showEntityHistory(context) {
  if (!context.config.entity || !context._hass) return;

  const event = new Event("hass-more-info", { bubbles: true, composed: true });
  event.detail = { entityId: context.config.entity };
  context.dispatchEvent(event);
}

/**
 * Show trend indicator
 * @param {Object} context - The card instance context
 */
export async function showTrendIndicator(context) {
  if (!context.config.show_trend || !context._hass || !context.config.entity) return;

  const entityId = context.config.entity;
  const now = new Date();
  const startTime = new Date();

  startTime.setHours(now.getHours() - 24);

  try {
    const history = await context._hass.callWS({
      type: 'history/history_during_period',
      entity_ids: [entityId],
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      minimal_response: true
    });

    if (!history || !history[0] || history[0].length === 0) return;

    const states = history[0];
    const currentValue = parseFloat(states[states.length - 1].state);
    const previousValue = parseFloat(states[0].state);
    const difference = currentValue - previousValue;
    const percentChange = previousValue !== 0 ? (difference / previousValue) * 100 : 0;

    const trendContainer = document.createElement('div');
    trendContainer.className = 'trend-indicator';

    const trendArrow = document.createElement('span');
    trendArrow.className = 'trend-arrow';

    const trendValue = document.createElement('span');
    trendValue.className = 'trend-value';

    if (difference > 0) {
      trendArrow.textContent = '↑';
      trendArrow.style.color = '#4caf50';
    } else if (difference < 0) {
      trendArrow.textContent = '↓';
      trendArrow.style.color = '#f44336';
    } else {
      trendArrow.textContent = '→';
      trendArrow.style.color = '#ffeb3b';
    }

    trendValue.textContent = `${Math.abs(percentChange).toFixed(1)}%`;

    trendContainer.appendChild(trendArrow);
    trendContainer.appendChild(trendValue);

    context.shadowRoot.querySelector('.gauge-card').appendChild(trendContainer);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
  }
}
