/**
 * Custom Gauge Card - Main Component Class
 */

import { parseConfig } from './config.js';
import { render, setupAccessibility, addMarkersAndZones } from './renderer.js';
import { setupVisibilityObserver, stopCenterShadowPulsation } from './animations.js';
import { updateGauge, updateLeds, updateCenterShadow, showEntityHistory, showTrendIndicator } from './state.js';
import { createButtons, updateButtonsState } from './controls.js';
import { createDynamicMarkers, updateDynamicMarkers, removeDynamicMarkers } from './dynamic-markers.js';

/**
 * Custom Gauge Card Web Component
 */
export class CustomGaugeCard extends HTMLElement {
  /**
   * Set card configuration
   * @param {Object} config - YAML configuration
   */
  setConfig(config) {
    this.config = parseConfig(config);

    this.previousState = null;
    this.updateTimer = null;
    this.isVisible = true;
    this.animationInterval = null;
    this.pulsationInterval = null;
    this.buttonsInitialized = false;

    this.attachShadow({ mode: "open" });
    render(this);

    // Bind methods to context
    this._updateGauge = updateGauge.bind(null, this);
    this._updateLeds = updateLeds.bind(null, this);
    this._updateCenterShadow = updateCenterShadow.bind(null, this);
    this._updateButtonsState = updateButtonsState.bind(null, this);
    this._createButtons = createButtons.bind(null, this);

    // Setup features
    this.shadowRoot
      .getElementById("gauge-container")
      .addEventListener("click", () => showEntityHistory(this));

    const min = this.config.min || 0;
    const max = this.config.max || 100;
    this._updateLeds(min, this.ledsCount, min, max);

    setupAccessibility(this);
    showTrendIndicator(this);
    addMarkersAndZones(this);
    createDynamicMarkers(this);
    setupVisibilityObserver(this);
  }

  /**
   * Home Assistant state setter
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    this._hass = hass;

    // Initialize buttons once when hass is available
    if (!this.buttonsInitialized && this.shadowRoot) {
      this._createButtons();
      this.buttonsInitialized = true;
    }

    // Power save mode: skip updates if not visible
    if (this.config.power_save_mode && !this.isVisible) return;

    // Update dynamic markers
    updateDynamicMarkers(this, hass);

    // Debounce updates if enabled
    if (this.config.debounce_updates) {
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
      }

      this.updateTimer = setTimeout(() => {
        this._updateGauge();
      }, this.config.update_interval);
    } else {
      this._updateGauge();
    }
  }

  /**
   * Cleanup when element is removed from DOM
   */
  disconnectedCallback() {
    // Clear all timers and intervals to prevent memory leaks
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.pulsationInterval) {
      clearInterval(this.pulsationInterval);
      this.pulsationInterval = null;
    }

    // Stop pulsation if active
    stopCenterShadowPulsation(this);

    // Disconnect intersection observer if exists
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}
