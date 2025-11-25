/**
 * Configuration and theme management
 */

export const CARD_VERSION = '1.0.5';

/**
 * Theme definitions
 */
export const themes = {
  default: {
    background: '#222',
    gaugeBackground: 'radial-gradient(circle, #444, #222)',
    centerBackground: 'radial-gradient(circle, #333, #111)',
    textColor: 'white',
    secondaryTextColor: '#ddd'
  },
  light: {
    background: '#f0f0f0',
    gaugeBackground: 'radial-gradient(circle, #e0e0e0, #d0d0d0)',
    centerBackground: 'radial-gradient(circle, #f5f5f5, #e5e5e5)',
    textColor: '#333',
    secondaryTextColor: '#666'
  },
  dark: {
    background: '#111',
    gaugeBackground: 'radial-gradient(circle, #333, #111)',
    centerBackground: 'radial-gradient(circle, #222, #000)',
    textColor: '#eee',
    secondaryTextColor: '#bbb'
  }
};

/**
 * Parse and validate configuration
 * @param {Object} config - Raw configuration from YAML
 * @returns {Object} Parsed and validated configuration
 *
 * Note: severity and markers configurations use real sensor values (not percentages)
 * Example for a 0-3000L tank:
 *   severity: [{ color: "#ff0000", value: 750 }]  // Red until 750L (not 25%)
 *   center_shadow_pulse_min: 0, center_shadow_pulse_max: 750  // Alarm from 0-750L
 */
export function parseConfig(config) {
  if (!config.entity) {
    throw new Error("Entité non définie.");
  }

  // Default configuration with performance options
  const parsedConfig = {
    ...config,
    update_interval: config.update_interval || 1000,
    power_save_mode: config.power_save_mode || false,
    power_save_threshold: config.power_save_threshold || 10,
    debounce_updates: config.debounce_updates || false,
    smooth_transitions: config.smooth_transitions !== false,
    animation_duration: config.animation_duration || 800,
    buttons: config.buttons || [],

    // Font configuration
    title_font_family: config.title_font_family || 'inherit',
    title_font_size: config.title_font_size || '16px',
    title_font_weight: config.title_font_weight || 'normal',
    title_font_color: config.title_font_color || null,

    value_font_family: config.value_font_family || 'inherit',
    value_font_size: config.value_font_size || '32px',
    value_font_weight: config.value_font_weight || 'bold',
    value_font_color: config.value_font_color || null,

    unit_font_size: config.unit_font_size || '16px',
    unit_font_weight: config.unit_font_weight || 'normal',
    unit_font_color: config.unit_font_color || null,

    button_icon_size: config.button_icon_size || 22,

    // Transparency options
    transparent_card_background: config.transparent_card_background || false,
    transparent_gauge_background: config.transparent_gauge_background || false,
    transparent_center_background: config.transparent_center_background || false,
    hide_shadows: config.hide_shadows || false,
    hide_inactive_leds: config.hide_inactive_leds || false,

    // Dynamic markers configuration
    dynamic_markers: config.dynamic_markers || [],

    // Bidirectional display for negative values
    bidirectional: config.bidirectional || false,

    // Card container dimensions
    card_width: config.card_width || null,
    card_height: config.card_height || null,
    card_padding: config.card_padding || '16px',

    // Center shadow pulsation alarm configuration (uses real sensor values, not percentages)
    center_shadow_pulse: config.center_shadow_pulse || false,
    center_shadow_pulse_duration: config.center_shadow_pulse_duration || 1000,
    center_shadow_pulse_min: config.center_shadow_pulse_min !== undefined ? config.center_shadow_pulse_min : (config.min || 0),
    center_shadow_pulse_max: config.center_shadow_pulse_max !== undefined ? config.center_shadow_pulse_max : (config.max || 100),
    center_shadow_pulse_intensity: config.center_shadow_pulse_intensity !== undefined ? config.center_shadow_pulse_intensity : 0.5
  };

  // Backward compatibility: convert old switch config to buttons format
  if (config.show_switch_button && config.switch_entity && parsedConfig.buttons.length === 0) {
    parsedConfig.buttons = [{
      entity: config.switch_entity,
      position: config.switch_button_position || 'bottom-right',
      icon: null
    }];
  }

  return parsedConfig;
}

/**
 * Get theme configuration
 * @param {string} themeName - Theme name
 * @param {Object} config - Card configuration (for custom theme)
 * @returns {Object} Theme configuration
 */
export function getTheme(themeName, config) {
  let theme;

  if (themeName === 'custom') {
    theme = {
      background: config.custom_background || '#222',
      gaugeBackground: config.custom_gauge_background || 'radial-gradient(circle, #444, #222)',
      centerBackground: config.custom_center_background || 'radial-gradient(circle, #333, #111)',
      textColor: config.custom_text_color || 'white',
      secondaryTextColor: config.custom_secondary_text_color || '#ddd'
    };
  } else {
    theme = { ...(themes[themeName] || themes.default) };
  }

  // Apply transparency options
  if (config.transparent_card_background) {
    theme.background = 'transparent';
  }
  if (config.transparent_gauge_background) {
    theme.gaugeBackground = 'transparent';
  }
  if (config.transparent_center_background) {
    theme.centerBackground = 'transparent';
  }

  return theme;
}
