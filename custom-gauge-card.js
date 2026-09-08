/**
 * Custom Gauge Card v2.3.0
 * Home Assistant custom card — LED gauge with arc control, bidirectional mode,
 * scale ticks, 4 buttons and full shadow support.
 *
 * Changelog v2.3 vs v2.2:
 *   - CHG  buttons now sit in a centered bar under the title, above a hairline
 *          separator derived from the theme — no more absolute corner placement
 *   - CHG  buttons are 44 × 44 px (touch target) instead of 36 × 36
 *   - CHG  default icons are MDI (<ha-icon>) instead of emojis; a custom `icon`
 *          in `prefix:name` form renders as <ha-icon>, anything else (emoji,
 *          plain text) keeps the pre-2.3 innerHTML behaviour
 *   - NEW  buttons_layout: bar | corners — `corners` restores the 2.2 placement
 *          and honours each button's `position`
 *   - NEW  buttons are configurable in the visual editor (entity, MDI icon
 *          picker, icon size), capped at 4
 *
 * Changelog v2.2 vs v2.1:
 *   - NEW  alarms: [] — multiple alarms, each watching any entity (not just the
 *          gauge entity), with 8 condition types and 4 visual effects
 *   - NEW  alarm effects: shadow_pulse, leds_blink, value_blink, border_pulse
 *   - NEW  per-alarm color override
 *   - KEEP center_shadow_pulse* still works — silently migrated to alarms[0]
 *
 * Changelog v2.0 vs v1.0.5:
 *   - NEW  arc_sweep (30–360°) + arc_start — full YAML control
 *   - NEW  scale_ticks + scale_steps + scale_labels — SVG graduation overlay
 *   - NEW  tap_action (more-info / navigate / call-service / none)
 *   - NEW  getCardSize() + getStubConfig() for HA visual editor
 *   - FIX  .switch-button was 0×0 px — buttons now 36×36 px
 *   - FIX  showTrendIndicator() was called before _hass was set
 *   - FIX  bidirectional mode now works on partial arcs (zero at arc midpoint)
 *   - FIX  markers and zones respect arc_start/arc_sweep
 *   - FIX  dynamic_markers respect arc_start/arc_sweep
 */
!function () {
  "use strict";

  const CARD_VERSION = '2.3.0';

  // ── Themes ──────────────────────────────────────────────────────────────────
  const THEMES = {
    default: { background:'#222', gaugeBackground:'radial-gradient(circle,#444,#222)', centerBackground:'radial-gradient(circle,#333,#111)', textColor:'white', secondaryTextColor:'#ddd' },
    light:   { background:'#f0f0f0', gaugeBackground:'radial-gradient(circle,#e0e0e0,#d0d0d0)', centerBackground:'radial-gradient(circle,#f5f5f5,#e5e5e5)', textColor:'#333', secondaryTextColor:'#666' },
    dark:    { background:'#111', gaugeBackground:'radial-gradient(circle,#333,#111)', centerBackground:'radial-gradient(circle,#222,#000)', textColor:'#eee', secondaryTextColor:'#bbb' }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const STYLES_CSS = `
.gauge-card{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--ha-card-header-font-family,Arial),sans-serif;background:var(--card-background);border-radius:15px;width:var(--card-width);height:var(--card-height);padding:var(--card-padding);box-shadow:var(--card-shadow);cursor:pointer;transition:box-shadow .3s ease-in-out}
.gauge{position:relative;width:var(--gauge-size);height:var(--gauge-size);border-radius:50%;background:var(--gauge-background);display:flex;align-items:center;justify-content:center}
.center-shadow{position:absolute;width:var(--center-size);height:var(--center-size);border-radius:50%;background:radial-gradient(circle,rgba(0,0,0,0),rgba(0,0,0,0));box-shadow:var(--center-shadow-preview,none);transition:box-shadow .3s ease-in-out}
.led{position:absolute;width:var(--led-size);height:var(--led-size);background:#333;border-radius:50%;box-shadow:var(--led-shadow);transition:background .2s ease,box-shadow .2s ease}
.led.active{box-shadow:0 0 8px currentColor,inset 0 0 3px currentColor}
.center{position:absolute;width:var(--center-size);height:var(--center-size);background:var(--center-background);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-color);text-align:center;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.value{font-size:var(--value-font-size);font-family:var(--value-font-family);font-weight:var(--value-font-weight);color:var(--value-font-color);transition:all .3s ease}
.unit{font-size:var(--unit-font-size);font-weight:var(--unit-font-weight);color:var(--unit-font-color)}
.title{margin-top:10px;font-size:var(--title-font-size);font-family:var(--title-font-family);font-weight:var(--title-font-weight);color:var(--title-font-color);text-shadow:0 1px 3px rgba(0,0,0,.5)}
.gauge-card.has-button-bar .trend-indicator{bottom:calc(var(--button-bar-height,72px) + 10px)}
.trend-indicator{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);padding:4px 8px;border-radius:12px;display:flex;align-items:center;gap:5px;font-size:12px;color:white;z-index:5}
.trend-arrow{font-size:14px;font-weight:bold}
.marker{position:absolute;width:4px;height:12px;background:#fff;border-radius:2px;z-index:2;box-shadow:0 0 5px rgba(0,0,0,.5)}
.marker-label{position:absolute;font-size:10px;color:#fff;z-index:2;text-shadow:0 0 3px rgba(0,0,0,.7)}
.dynamic-marker-container{position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:3}
.dynamic-marker{position:relative;border:2px solid rgba(255,255,255,.8);box-shadow:0 0 8px rgba(0,0,0,.6),0 0 12px currentColor;transition:background .3s ease-in-out,box-shadow .3s ease-in-out;z-index:3}
.dynamic-marker-label{position:absolute;left:15px;font-size:11px;font-weight:600;color:#fff;background:rgba(0,0,0,.7);padding:2px 6px;border-radius:4px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.8);box-shadow:0 2px 4px rgba(0,0,0,.3);z-index:4}
.dynamic-marker-value{position:absolute;left:15px;top:18px;font-size:10px;font-weight:500;color:#fff;background:rgba(0,0,0,.7);padding:1px 5px;border-radius:3px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.8);box-shadow:0 2px 4px rgba(0,0,0,.3);z-index:4}
.button-bar{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:12px;padding-top:12px;width:100%;border-top:1px solid var(--button-bar-border)}
.switch-button{width:44px;height:44px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;transition:all .3s ease;box-shadow:var(--button-shadow);font-size:var(--icon-size,var(--button-icon-size));font-family:system-ui,-apple-system,"Segoe UI","Segoe UI Emoji","Apple Color Emoji",sans-serif;line-height:1;font-weight:normal;border:2px solid rgba(255,255,255,.2)}
.switch-button ha-icon{--mdc-icon-size:var(--icon-size,var(--button-icon-size));display:flex;align-items:center;justify-content:center;line-height:0}
.switch-button:hover{transform:scale(1.1);box-shadow:var(--button-hover-shadow)}
.switch-button:active{transform:scale(.95)}
.switch-button.on{background:linear-gradient(135deg,#4caf50,#2e7d32);color:#fff;opacity:1;text-shadow:0 0 10px rgba(76,175,80,1),0 0 20px rgba(76,175,80,.6);filter:brightness(1.2)}
.switch-button.on ha-icon{filter:drop-shadow(0 0 6px rgba(76,175,80,.9))}
.switch-button.off{background:linear-gradient(135deg,#666,#333);color:#9aa0a3;opacity:.55;text-shadow:none;filter:grayscale(.5)}
.switch-button.corner{position:absolute;width:36px;height:36px}
.switch-button.top-left{top:30px;left:30px}
.switch-button.top-right{top:30px;right:30px}
.switch-button.bottom-left{bottom:40px;left:30px}
.switch-button.bottom-right{bottom:40px;right:30px}
@keyframes cgc-alarm-blink{0%,100%{opacity:1}50%{opacity:var(--cgc-blink-min,.25)}}
@keyframes cgc-alarm-border{0%,100%{box-shadow:0 0 6px 0 var(--alarm-border-color,#f44336)}50%{box-shadow:0 0 24px 7px var(--alarm-border-color,#f44336)}}
.gauge-card.alarm-leds .led.active{--cgc-blink-min:var(--alarm-leds-opacity,.25);animation:cgc-alarm-blink var(--alarm-leds-duration,1s) ease-in-out infinite}
.gauge-card.alarm-value .value,.gauge-card.alarm-value .unit{--cgc-blink-min:var(--alarm-value-opacity,.25);animation:cgc-alarm-blink var(--alarm-value-duration,1s) ease-in-out infinite}
.gauge-card.alarm-value .value{color:var(--alarm-value-color,var(--value-font-color))}
.gauge-card.alarm-value .unit{color:var(--alarm-value-color,var(--unit-font-color))}
.gauge-card.alarm-border{animation:cgc-alarm-border var(--alarm-border-duration,1s) ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.gauge-card.alarm-leds .led.active,.gauge-card.alarm-value .value,.gauge-card.alarm-value .unit,.gauge-card.alarm-border{animation-duration:2.5s}}
`;

  // ── Utilities ────────────────────────────────────────────────────────────────

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getEntityType(id) {
    return id ? id.split('.')[0] : null;
  }

  function getDefaultIcon(type) {
    const map = {
      switch:'mdi:toggle-switch', light:'mdi:lightbulb', scene:'mdi:palette', script:'mdi:play',
      input_boolean:'mdi:toggle-switch-outline', automation:'mdi:robot', fan:'mdi:fan',
      cover:'mdi:window-shutter', climate:'mdi:thermostat', lock:'mdi:lock', vacuum:'mdi:robot-vacuum'
    };
    return map[type] || 'mdi:toggle-switch';
  }

  /**
   * `mdi:water-pump` / `hass:foo` → <ha-icon>. Anything else (emoji, plain text)
   * keeps the pre-2.3 behaviour and is injected as innerHTML, so existing configs
   * that use emojis are untouched.
   */
  const ICON_NAME_RE = /^[a-z0-9_-]+:[a-z0-9_-]+$/i;

  function renderButtonIcon(el, icon) {
    if (ICON_NAME_RE.test(String(icon))) {
      el.innerHTML = '';
      const i = document.createElement('ha-icon');
      i.setAttribute('icon', icon);
      el.appendChild(i);
    } else {
      el.innerHTML = icon;
    }
  }

  /**
   * Rough luminance test on a hex background. Gradients, `transparent` and named
   * colors are treated as dark — the safe default for this card's themes.
   */
  function isLightBackground(bg) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(bg).trim());
    if (!m) return false;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140;
  }

  function getLedColor(value, severity, min = 0, max = 100) {
    const cfg = severity || [{ color:'#4caf50', value:20 }, { color:'#ffeb3b', value:50 }, { color:'#f44336', value:100 }];
    for (const zone of cfg) {
      const threshold = ((zone.value - min) / (max - min)) * 100;
      if (value <= threshold) return zone.color;
    }
    return '#555';
  }

  /**
   * #rrggbb / #rgb → rgba(). Any other notation (named color, rgb(), var(...))
   * is returned untouched: the pulsation then varies blur/spread only.
   */
  function hexToRgba(hex, alpha) {
    if (typeof hex !== 'string') return hex;
    let h = hex.trim();
    if (h.length === 4 && h[0] === '#') h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return hex;
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  }

  function optimizeLEDs(count) { return count || 100; }

  function calculateBidirectionalLeds(value, min, max, ledsCount, bidirectional) {
    const fullNorm = ((value - min) / (max - min)) * 100;
    if (!bidirectional) {
      return { activeLeds: Math.round((fullNorm / 100) * ledsCount), direction: 'unidirectional', normalizedValue: fullNorm };
    }
    const ref        = (min <= 0 && max >= 0) ? 0 : (min + max) / 2;
    const total      = max - min;
    const lowerRange = ref - min;
    const upperRange = max - ref;
    if (value >= ref) {
      const pct = upperRange > 0 ? ((value - ref) / upperRange) * 100 : 0;
      return { activeLeds: Math.round((pct / 100) * ledsCount * (upperRange / total)), direction: 'positive', normalizedValue: fullNorm };
    } else {
      const pct = lowerRange > 0 ? ((ref - value) / lowerRange) * 100 : 0;
      return { activeLeds: Math.round((pct / 100) * ledsCount * (lowerRange / total)), direction: 'negative', normalizedValue: fullNorm };
    }
  }

  /**
   * Convert a sensor value to degrees-from-top-clockwise, respecting arc_start / arc_sweep.
   * arcStart: 0 = top (12 o'clock), clockwise.
   * Returns an angle in the same "degrees from top, clockwise" space.
   */
  function valueToArcAngle(value, min, max, arcStart, arcSweep, bidirectional) {
    if (!bidirectional) {
      const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return arcStart + frac * arcSweep;
    }
    // Bidirectional: zero (or range midpoint) sits at its proportional position in the arc,
    // exactly like a non-bidirectional gauge would place value=0 in [min, max].
    const refPoint   = (min <= 0 && max >= 0) ? 0 : (min + max) / 2;
    const zeroFrac   = Math.max(0, Math.min(1, (refPoint - min) / (max - min)));
    const refAngle   = arcStart + zeroFrac * arcSweep;

    const lowerRange = refPoint - min;
    const upperRange = max - refPoint;

    if (value >= refPoint) {
      const frac = upperRange > 0 ? (value - refPoint) / upperRange : 0;
      return refAngle + frac * arcSweep * (1 - zeroFrac);
    } else {
      const frac = lowerRange > 0 ? (refPoint - value) / lowerRange : 0;
      return refAngle - frac * arcSweep * zeroFrac;
    }
  }

  // ── Alarms ───────────────────────────────────────────────────────────────────

  const ALARM_CONDITIONS = ['range', 'outside', 'above', 'below', 'equal', 'state', 'state_not', 'unavailable'];
  const ALARM_EFFECTS    = ['shadow_pulse', 'leds_blink', 'value_blink', 'border_pulse'];

  // CSS-driven effects: class toggled on .gauge-card, parameters passed as CSS vars.
  // shadow_pulse is absent here — it is driven in JS because it follows the live
  // severity color of the gauge when no explicit alarm color is set.
  const ALARM_CSS_EFFECTS = {
    leds_blink:   { cls: 'alarm-leds',   ns: 'leds'   },
    value_blink:  { cls: 'alarm-value',  ns: 'value'  },
    border_pulse: { cls: 'alarm-border', ns: 'border' },
  };

  const LEGACY_PULSE_KEYS = [
    'center_shadow_pulse', 'center_shadow_pulse_min', 'center_shadow_pulse_max',
    'center_shadow_pulse_duration', 'center_shadow_pulse_intensity',
  ];

  // Pre-2.2 single-button config, superseded by `buttons[]`
  const LEGACY_BUTTON_KEYS = ['show_switch_button', 'switch_entity', 'switch_button_position'];
  const MAX_BUTTONS = 4;

  function normalizeAlarm(a, config) {
    const num = (v, fallback) => (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : fallback);
    return {
      name:      a.name || null,
      entity:    a.entity || null,                 // null → the gauge entity
      attribute: a.attribute || null,
      condition: ALARM_CONDITIONS.includes(a.condition) ? a.condition : 'range',
      min:       num(a.min, num(config.min, 0)),
      max:       num(a.max, num(config.max, 100)),
      value:     num(a.value, 0),
      state:     a.state !== undefined && a.state !== null ? String(a.state) : 'on',
      effect:    ALARM_EFFECTS.includes(a.effect) ? a.effect : 'shadow_pulse',
      color:     a.color || null,                  // null → severity color of the gauge
      duration:  Math.max(100, num(a.duration, 1000)),
      intensity: Math.max(0, Math.min(1, num(a.intensity, 0.5))),
    };
  }

  /** Legacy center_shadow_pulse_* → a single alarm. Returns null when disabled. */
  function legacyPulseAlarm(config) {
    if (!config.center_shadow_pulse) return null;
    return {
      condition: 'range',
      min:       config.center_shadow_pulse_min,
      max:       config.center_shadow_pulse_max,
      effect:    'shadow_pulse',
      duration:  config.center_shadow_pulse_duration,
      intensity: config.center_shadow_pulse_intensity,
    };
  }

  /** alarms: [] wins over the legacy keys; both are supported. */
  function buildAlarms(config) {
    if (Array.isArray(config.alarms)) {
      return config.alarms
        .filter(a => a && typeof a === 'object')
        .map(a => normalizeAlarm(a, config));
    }
    const legacy = legacyPulseAlarm(config);
    return legacy ? [normalizeAlarm(legacy, config)] : [];
  }

  function isAlarmActive(ctx, alarm) {
    const hass = ctx._hass;
    if (!hass) return false;
    const entityId = alarm.entity || ctx.config.entity;
    const st = hass.states[entityId];
    if (!st) return alarm.condition === 'unavailable';

    const raw = alarm.attribute ? st.attributes[alarm.attribute] : st.state;
    const unavailable = raw === undefined || raw === null || raw === 'unavailable' || raw === 'unknown';

    switch (alarm.condition) {
      case 'unavailable': return unavailable;
      case 'state':       return String(raw) === alarm.state;
      case 'state_not':   return String(raw) !== alarm.state;
    }
    if (unavailable) return false;

    const v = parseFloat(raw);
    if (isNaN(v)) return false;
    switch (alarm.condition) {
      case 'above':   return v >  alarm.value;
      case 'below':   return v <  alarm.value;
      case 'equal':   return v === alarm.value;
      case 'outside': return v <  alarm.min || v > alarm.max;
      default:        return v >= alarm.min && v <= alarm.max;   // range
    }
  }

  /**
   * Re-evaluate every alarm and apply the matching effects.
   * Called on every hass update — including when the gauge entity itself did not
   * change — so an alarm can watch any other entity.
   */
  function evaluateAlarms(ctx) {
    if (!ctx.shadowRoot || !ctx._hass) return;
    const card = ctx.shadowRoot.getElementById('gauge-container');
    if (!card) return;

    const alarms = ctx.config.alarms || [];
    const active = alarms.filter(a => isAlarmActive(ctx, a));
    ctx.activeAlarms = active;

    for (const [effect, { cls, ns }] of Object.entries(ALARM_CSS_EFFECTS)) {
      const a = active.find(x => x.effect === effect);
      card.classList.toggle(cls, !!a);
      if (!a) continue;
      card.style.setProperty(`--alarm-${ns}-duration`, `${a.duration}ms`);
      card.style.setProperty(`--alarm-${ns}-opacity`,  String(a.intensity));
      if (a.color) card.style.setProperty(`--alarm-${ns}-color`, a.color);
      else         card.style.removeProperty(`--alarm-${ns}-color`);
    }

    updateShadowPulse(ctx, active.find(a => a.effect === 'shadow_pulse') || null);
  }

  function clearAlarmEffects(ctx) {
    const card = ctx.shadowRoot?.getElementById('gauge-container');
    if (card) Object.values(ALARM_CSS_EFFECTS).forEach(({ cls }) => card.classList.remove(cls));
    ctx.activeAlarms = [];
    updateShadowPulse(ctx, null);
  }

  // ── Config ───────────────────────────────────────────────────────────────────

  function parseConfig(config) {
    if (!config.entity) throw new Error('Custom Gauge Card: entity is required.');

    const c = {
      ...config,
      attribute:                    config.attribute || null,
      update_interval:              config.update_interval || 1000,
      power_save_mode:              config.power_save_mode || false,
      power_save_threshold:         config.power_save_threshold || 10,
      debounce_updates:             config.debounce_updates || false,
      smooth_transitions:           config.smooth_transitions !== false,
      animation_duration:           config.animation_duration || 800,
      buttons:                      config.buttons || [],
      buttons_layout:               config.buttons_layout === 'corners' ? 'corners' : 'bar',
      title_font_family:            config.title_font_family  || 'inherit',
      title_font_size:              config.title_font_size    || '16px',
      title_font_weight:            config.title_font_weight  || 'normal',
      title_font_color:             config.title_font_color   || null,
      value_font_family:            config.value_font_family  || 'inherit',
      value_font_size:              config.value_font_size    || '32px',
      value_font_weight:            config.value_font_weight  || 'bold',
      value_font_color:             config.value_font_color   || null,
      unit_font_size:               config.unit_font_size     || '16px',
      unit_font_weight:             config.unit_font_weight   || 'normal',
      unit_font_color:              config.unit_font_color    || null,
      button_icon_size:             config.button_icon_size   || 22,
      transparent_card_background:  config.transparent_card_background  || false,
      transparent_gauge_background: config.transparent_gauge_background || false,
      transparent_center_background:config.transparent_center_background|| false,
      hide_shadows:                 config.hide_shadows        || false,
      hide_inactive_leds:           config.hide_inactive_leds  || false,
      dynamic_markers:              config.dynamic_markers     || [],
      bidirectional:                config.bidirectional       || false,
      card_width:                   config.card_width  || null,
      card_height:                  config.card_height || null,
      card_padding:                 config.card_padding || '16px',
      center_shadow_pulse:          config.center_shadow_pulse || false,
      center_shadow_pulse_duration: config.center_shadow_pulse_duration || 1000,
      center_shadow_pulse_min:      config.center_shadow_pulse_min  !== undefined ? config.center_shadow_pulse_min  : (config.min || 0),
      center_shadow_pulse_max:      config.center_shadow_pulse_max  !== undefined ? config.center_shadow_pulse_max  : (config.max || 100),
      center_shadow_pulse_intensity:config.center_shadow_pulse_intensity !== undefined ? config.center_shadow_pulse_intensity : 0.5,
      // ── v2.0: arc ─────────────────────────────────────────────────────────
      arc_sweep:    config.arc_sweep  !== undefined ? Math.min(360, Math.max(30, Number(config.arc_sweep)))  : 360,
      arc_start:    config.arc_start  !== undefined ? Number(config.arc_start)  : 0,
      // ── v2.0: scale ticks ─────────────────────────────────────────────────
      scale_ticks:  config.scale_ticks  || false,
      scale_steps:  config.scale_steps  || 5,
      scale_labels: config.scale_labels !== false,
      // ── v2.0: tap_action ──────────────────────────────────────────────────
      tap_action:   config.tap_action   || { action: 'more-info' },
    };

    // Backward compat: show_switch_button → buttons
    if (config.show_switch_button && config.switch_entity && c.buttons.length === 0) {
      c.buttons = [{ entity: config.switch_entity, position: config.switch_button_position || 'bottom-right', icon: null }];
    }
    // v2.2: alarms — normalized here so the render path never sees raw user input.
    // Built from `c` (not `config`) so the legacy pulse keys are already defaulted.
    c.alarms = buildAlarms(c);
    return c;
  }

  function getTheme(name, config) {
    let theme;
    if (name === 'custom') {
      theme = {
        background:         config.custom_background         || '#222',
        gaugeBackground:    config.custom_gauge_background    || 'radial-gradient(circle,#444,#222)',
        centerBackground:   config.custom_center_background   || 'radial-gradient(circle,#333,#111)',
        textColor:          config.custom_text_color          || 'white',
        secondaryTextColor: config.custom_secondary_text_color|| '#ddd'
      };
    } else {
      theme = { ...(THEMES[name] || THEMES.default) };
    }
    if (config.transparent_card_background)   theme.background      = 'transparent';
    if (config.transparent_gauge_background)  theme.gaugeBackground = 'transparent';
    if (config.transparent_center_background) theme.centerBackground= 'transparent';
    return theme;
  }

  // ── Animations ───────────────────────────────────────────────────────────────

  function animateValueChange(ctx, fromValue, toValue, min, max) {
    const ledsCount = ctx.ledsCount || 100;
    const duration  = ctx.config.animation_duration || 800;
    const steps     = 20;
    const stepDur   = duration / steps;
    const range     = toValue - fromValue;
    if (ctx.animationInterval) clearInterval(ctx.animationInterval);
    let step = 0;
    ctx.animationInterval = setInterval(() => {
      step++;
      const cur  = fromValue + range * easeInOutCubic(step / steps);
      const norm = ((cur - min) / (max - min)) * 100;
      if (ctx._updateLeds)         ctx._updateLeds(cur, ledsCount, min, max);
      if (ctx._updateCenterShadow) ctx._updateCenterShadow(norm, cur, min, max);
      const vd = ctx.shadowRoot?.querySelector('.value');
      if (vd) vd.textContent = cur.toFixed(ctx.config.decimals || 0);
      if (step >= steps) { clearInterval(ctx.animationInterval); ctx.animationInterval = null; }
    }, stepDur);
  }

  function setupVisibilityObserver(ctx) {
    if (!ctx.config.power_save_mode) return;
    ctx.intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        ctx.isVisible = e.isIntersecting;
        if (ctx.isVisible) {
          if (ctx._hass && ctx._updateGauge) ctx._updateGauge();
          if (ctx._evaluateAlarms) ctx._evaluateAlarms();
        } else {
          // Off-screen: drop the animations too, that is the point of power save.
          clearAlarmEffects(ctx);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: ctx.config.power_save_threshold / 100 });
    ctx.intersectionObserver.observe(ctx);
  }

  /**
   * Start/stop/retune the center-shadow pulsation from an alarm (or null to stop).
   * The interval is only restarted when the pulse parameters actually change, so a
   * hass update every second does not reset the wave.
   */
  function updateShadowPulse(ctx, alarm) {
    const sig = alarm ? `${alarm.duration}|${alarm.intensity}|${alarm.color || ''}` : null;
    if (sig === ctx.pulsationSig) return;
    ctx.pulsationSig = sig;
    stopCenterShadowPulsation(ctx);
    if (alarm) { startCenterShadowPulsation(ctx, alarm); return; }
    // Back to the static shadow — or none at all when center_shadow is off.
    const cs = ctx.shadowRoot?.getElementById('center-shadow');
    if (!cs) return;
    cs.style.transition = '';
    if (ctx.config.center_shadow && ctx.currentShadowColor) {
      const blur   = ctx.config.center_shadow_blur   || 30;
      const spread = ctx.config.center_shadow_spread || 15;
      cs.style.boxShadow = `0 0 ${blur}px ${spread}px ${ctx.currentShadowColor}`;
    } else {
      cs.style.boxShadow = 'none';
    }
  }

  function startCenterShadowPulsation(ctx, alarm) {
    const dur        = alarm.duration;
    const intensity  = alarm.intensity;
    const baseBlur   = ctx.config.center_shadow_blur   || 30;
    const baseSpread = ctx.config.center_shadow_spread || 15;
    const t0         = Date.now();
    // The .center-shadow CSS transition (300 ms) would lag behind a 16 ms tick and
    // never let the shadow reach its target color — the wave is the animation here.
    const csEl = ctx.shadowRoot?.getElementById('center-shadow');
    if (csEl) csEl.style.transition = 'none';
    ctx.pulsationInterval = setInterval(() => {
      const wave  = Math.sin(((Date.now() - t0) % dur) / dur * Math.PI * 2) * 0.5 + 0.5;
      const mult  = intensity + (1 - intensity) * wave;
      const cs    = ctx.shadowRoot?.getElementById('center-shadow');
      // Falls back to the live severity color, re-read each tick so the pulse
      // follows the gauge color when no explicit alarm color is configured.
      const color = alarm.color || ctx.currentShadowColor;
      if (cs && color) {
        cs.style.boxShadow = `0 0 ${(baseBlur * mult).toFixed(1)}px ${(baseSpread * mult).toFixed(1)}px ${hexToRgba(color, mult)}`;
      }
    }, 16);
  }

  function stopCenterShadowPulsation(ctx) {
    if (ctx.pulsationInterval) { clearInterval(ctx.pulsationInterval); ctx.pulsationInterval = null; }
  }

  // ── Controls ─────────────────────────────────────────────────────────────────

  function createButtons(ctx) {
    if (!ctx._hass || !ctx.config.buttons?.length) return;
    const container = ctx.shadowRoot.getElementById('gauge-container');
    if (!container) return;
    const corners = ctx.config.buttons_layout === 'corners';

    // Bar mode: .button-bar is created lazily by the first button that actually
    // renders, so a list that is empty -- or whose entities are all missing --
    // leaves no bar, no separator and no reserved space.
    let bar = null;
    const parentFor = () => {
      if (corners) return container;
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'button-bar';
        container.appendChild(bar);
      }
      return bar;
    };

    ctx.config.buttons.forEach((btn, idx) => {
      if (!btn.entity || ctx.shadowRoot.getElementById(`button-${idx}`)) return;
      const s = ctx._hass.states[btn.entity];
      if (!s) { console.warn(`custom-gauge-card: entity ${btn.entity} not found`); return; }
      const b = document.createElement('div');
      b.id        = `button-${idx}`;
      b.className = corners
        ? `switch-button corner ${btn.position || 'bottom-right'}`
        : 'switch-button';
      renderButtonIcon(b, btn.icon || getDefaultIcon(getEntityType(btn.entity)));
      if (btn.icon_size) b.style.setProperty('--icon-size', `${btn.icon_size}px`);
      b.addEventListener('click', e => { e.stopPropagation(); handleButtonClick(ctx, btn.entity); });
      parentFor().appendChild(b);
    });

    if (bar) {
      // Lets .trend-indicator lift itself above the bar instead of landing on a
      // button. offsetHeight is 0 while the card is not laid out yet (editor
      // preview) — the CSS fallback covers that case.
      container.classList.add('has-button-bar');
      const barH = bar.offsetHeight;
      if (barH) container.style.setProperty('--button-bar-height', `${barH + 12}px`);
    }
    updateButtonsState(ctx);
  }

  function updateButtonsState(ctx) {
    if (!ctx._hass || !ctx.config.buttons?.length) return;
    ctx.config.buttons.forEach((btn, idx) => {
      const b = ctx.shadowRoot.getElementById(`button-${idx}`);
      const s = ctx._hass.states[btn?.entity];
      if (!b || !s) return;
      const isOn = ['on','open','unlocked','home','active'].includes(s.state);
      b.classList.remove('on', 'off');
      b.classList.add(isOn ? 'on' : 'off');
      b.title = `${s.attributes.friendly_name || btn.entity}: ${s.state.toUpperCase()}`;
    });
  }

  function handleButtonClick(ctx, entityId) {
    if (!entityId || !ctx._hass) return;
    const s = ctx._hass.states[entityId];
    if (!s) return;
    const type = getEntityType(entityId);
    let domain, service;
    const data = { entity_id: entityId };
    switch (type) {
      case 'switch': case 'light': case 'input_boolean': case 'fan': case 'automation':
        [domain, service] = [type, 'toggle']; break;
      case 'scene':   [domain, service] = ['scene',  'turn_on'];   break;
      case 'script':  [domain, service] = ['script', 'turn_on'];   break;
      case 'cover':   domain = 'cover';   service = s.state === 'open'    ? 'close_cover' : 'open_cover'; break;
      case 'lock':    domain = 'lock';    service = s.state === 'locked'  ? 'unlock'      : 'lock';       break;
      case 'vacuum':  domain = 'vacuum';  service = s.state === 'cleaning'? 'stop'        : 'start';      break;
      case 'climate': domain = 'climate'; service = s.state === 'off'     ? 'turn_on'     : 'turn_off';   break;
      default: console.warn(`custom-gauge-card: entity type ${type} not supported for buttons`); return;
    }
    ctx._hass.callService(domain, service, data)
      .then(() => setTimeout(() => updateButtonsState(ctx), 100))
      .catch(err => console.error(`custom-gauge-card: ${domain}.${service} error`, err));
  }

  // ── Dynamic Markers ──────────────────────────────────────────────────────────

  const DOMAIN_COLORS = { sensor:'#2196F3', input_number:'#4CAF50', climate:'#FF9800', light:'#FFC107', switch:'#9C27B0', binary_sensor:'#00BCD4' };

  function createDynamicMarkers(ctx) {
    if (!ctx.config.dynamic_markers?.length) return;
    const gauge = ctx.shadowRoot.querySelector('.gauge');
    if (!gauge) return;
    ctx._dynamicMarkerElements?.forEach(el => el.remove());
    ctx._dynamicMarkerElements = [];
    ctx._dynamicMarkerData = new Map();
    const gaugeSize = ctx.config.gauge_size || 200;
    ctx.config.dynamic_markers.forEach(mc => {
      if (!mc.entity) return;
      const wrap = document.createElement('div');
      wrap.className = 'dynamic-marker-container';
      wrap.dataset.entity = mc.entity;
      const dot = document.createElement('div');
      dot.className = 'dynamic-marker';
      dot.style.cssText = `width:${mc.size||8}px;height:${mc.size||8}px;background:${mc.color||'#4CAF50'};border-radius:50%`;
      wrap.appendChild(dot);
      if (mc.label) {
        const lbl = document.createElement('div');
        lbl.className = 'dynamic-marker-label';
        lbl.textContent = mc.label;
        wrap.appendChild(lbl);
      }
      if (mc.show_value) {
        const vd = document.createElement('div');
        vd.className = 'dynamic-marker-value';
        vd.textContent = '-';
        wrap.appendChild(vd);
      }
      wrap.style.cssText = `position:absolute;transform:rotate(-90deg) translateX(${gaugeSize/2-10}px);transform-origin:center center;transition:transform .3s ease-in-out`;
      gauge.appendChild(wrap);
      ctx._dynamicMarkerElements.push(wrap);
      ctx._dynamicMarkerData.set(mc.entity, { config: mc, element: wrap, currentAngle: -90 });
    });
  }

  function updateDynamicMarkers(ctx, hass) {
    if (!ctx._dynamicMarkerElements?.length) return;
    const { min=0, max=100, gauge_size:gSz=200, animation_duration:animDur=1000,
            arc_start:arcStart=0, arc_sweep:arcSweep=360, bidirectional=false,
            smooth_transitions:smooth=true } = ctx.config;
    const dur = smooth ? animDur / 1000 : 0;
    ctx._dynamicMarkerData.forEach((md, entityId) => {
      const entity = hass.states[entityId];
      if (!entity) { md.element.style.opacity = '0'; return; }
      md.element.style.opacity = '1';
      const rawVal = md.config.attribute ? entity.attributes[md.config.attribute] : entity.state;
      const val = Math.max(min, Math.min(max, parseFloat(rawVal)));
      if (isNaN(val)) return;
      const topDeg = valueToArcAngle(val, min, max, arcStart, arcSweep, bidirectional);
      const targetAngle = topDeg - 90;
      md.element.style.transition = `transform ${dur}s ease-in-out`;
      md.element.style.transform  = `rotate(${targetAngle}deg) translateX(${gSz/2-10}px)`;
      if (!md.config.color || md.config.color === 'auto') {
        const autoColor = DOMAIN_COLORS[entity.entity_id.split('.')[0]] || '#4CAF50';
        md.element.querySelector('.dynamic-marker').style.background = autoColor;
      }
      if (md.config.show_value) {
        const vd = md.element.querySelector('.dynamic-marker-value');
        if (vd) vd.textContent = `${val.toFixed(1)}${entity.attributes.unit_of_measurement||''}`;
      }
      ['dynamic-marker-label','dynamic-marker-value'].forEach(cls => {
        const el = md.element.querySelector(`.${cls}`);
        if (el) { el.style.transform = `rotate(${-targetAngle}deg)`; el.style.transition = `transform ${dur}s ease-in-out`; }
      });
      md.currentAngle = targetAngle;
    });
  }

  function removeDynamicMarkers(ctx) {
    ctx._dynamicMarkerElements?.forEach(el => el.remove());
    ctx._dynamicMarkerElements = [];
    ctx._dynamicMarkerData?.clear();
  }

  // ── Renderer ─────────────────────────────────────────────────────────────────

  function generateCSSVariables(theme, config) {
    const hs = config.hide_shadows;
    // Separator above the button bar: invisible when the card has no chrome to
    // sit on (hidden shadows, transparent background), otherwise a hairline
    // contrasting with the theme background.
    const barBorder = (hs || config.transparent_card_background)
      ? 'transparent'
      : (isLightBackground(theme.background) ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.08)');
    const csBlur   = config.center_shadow_blur   || 30;
    const csSpread = config.center_shadow_spread  || 15;
    const csColor  = (Array.isArray(config.severity) && config.severity[0]?.color) || '#4caf50';
    const csPreview = config.center_shadow
      ? `0 0 ${csBlur}px ${csSpread}px ${csColor}`
      : 'none';
    return `
      --card-background:${theme.background};--gauge-background:${theme.gaugeBackground};
      --center-background:${theme.centerBackground};--text-color:${theme.textColor};
      --secondary-text-color:${theme.secondaryTextColor};
      --gauge-size:${config.gauge_size||200}px;--center-size:${config.center_size||120}px;--led-size:${config.led_size||8}px;
      --card-width:${config.card_width||'auto'};--card-height:${config.card_height||'auto'};--card-padding:${config.card_padding};
      --card-shadow:${hs?'none':'0 0 15px rgba(0,0,0,.5)'};
      --led-shadow:${hs?'none':'0 0 4px rgba(0,0,0,.8)'};
      --button-shadow:${hs?'none':'0 2px 8px rgba(0,0,0,.3)'};
      --button-hover-shadow:${hs?'none':'0 4px 12px rgba(0,0,0,.5)'};
      --center-shadow-preview:${csPreview};
      --value-font-size:${config.value_font_size};--value-font-family:${config.value_font_family};--value-font-weight:${config.value_font_weight};--value-font-color:${config.value_font_color||theme.textColor};
      --unit-font-size:${config.unit_font_size};--unit-font-weight:${config.unit_font_weight};--unit-font-color:${config.unit_font_color||theme.secondaryTextColor};
      --title-font-size:${config.title_font_size};--title-font-family:${config.title_font_family};--title-font-weight:${config.title_font_weight};--title-font-color:${config.title_font_color||theme.textColor};
      --button-icon-size:${config.button_icon_size}px;
      --button-bar-border:${barBorder};
    `;
  }

  function render(ctx) {
    ctx.ledsCount = optimizeLEDs(ctx.config.leds_count);
    const n         = ctx.ledsCount;
    const theme     = getTheme(ctx.config.theme || 'default', ctx.config);
    const gaugeSize = ctx.config.gauge_size || 200;
    const ledSize   = ctx.config.led_size   || 8;
    const arcStart  = ctx.config.arc_start;  // v2.0: degrees from top, clockwise
    const arcSweep  = ctx.config.arc_sweep;  // v2.0: total arc degrees

    const leds = Array.from({ length: n }, (_, i) => {
      // cssAngle: subtract 90 because CSS 0° points right, we want 0° to point top
      const cssAngle = (arcStart + (i / n) * arcSweep - 90).toFixed(3);
      return `<div class="led" id="led-${i}" style="transform:rotate(${cssAngle}deg) translate(${gaugeSize/2-ledSize}px)"></div>`;
    }).join('');

    // When scale_ticks is enabled the SVG overlay extends PAD=38px beyond the gauge
    // on all sides. The gauge-wrap is sized to include that extra space so the labels
    // remain inside the card boundaries (HA wraps cards with overflow:hidden).
    const TICK_PAD  = 38;
    const wrapSize  = ctx.config.scale_ticks ? gaugeSize + TICK_PAD * 2 : gaugeSize;

    ctx.shadowRoot.innerHTML = `
      <style>:host{display:block;${generateCSSVariables(theme, ctx.config)}}${STYLES_CSS}</style>
      <div class="gauge-card" id="gauge-container">
        <div class="gauge-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:${wrapSize}px;height:${wrapSize}px">
          <div class="gauge">
            <div class="center-shadow" id="center-shadow"></div>
            ${leds}
            <div class="center"><div class="value">0</div><div class="unit"></div></div>
          </div>
        </div>
        <div class="title">${ctx.config.name || ''}</div>
      </div>`;
  }

  function setupAccessibility(ctx) {
    const gc = ctx.shadowRoot.querySelector('.gauge-card');
    gc.setAttribute('role', 'slider');
    gc.setAttribute('aria-valuemin', ctx.config.min || 0);
    gc.setAttribute('aria-valuemax', ctx.config.max || 100);
    gc.setAttribute('aria-label', `${ctx.config.name || ctx.config.entity} gauge`);
    const vd = ctx.shadowRoot.querySelector('.value');
    if (vd) {
      const obs = new MutationObserver(() => {
        const v = parseFloat(vd.textContent);
        gc.setAttribute('aria-valuenow', v);
        gc.setAttribute('aria-valuetext', `${v}${ctx.config.unit ? ' ' + ctx.config.unit : ''}`);
      });
      obs.observe(vd, { childList: true });
    }
  }

  function addMarkersAndZones(ctx) {
    if (!ctx.config.markers && !ctx.config.zones) return;
    const gauge = ctx.shadowRoot.querySelector('.gauge');
    if (!gauge) return;
    const { min=0, max=100, gauge_size:gSz=200, arc_start:arcStart=0, arc_sweep:arcSweep=360, bidirectional=false } = ctx.config;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    (ctx.config.markers || []).forEach(marker => {
      const topDeg = valueToArcAngle(marker.value, min, max, arcStart, arcSweep, bidirectional);
      const cssA   = topDeg - 90;
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cssText = `position:absolute;width:4px;height:12px;background:${marker.color||'#fff'};border-radius:2px;transform:rotate(${cssA}deg) translateX(${gSz/2-5}px);transform-origin:center center;z-index:2;box-shadow:0 0 5px rgba(0,0,0,.5)`;
      gauge.appendChild(el);
      if (marker.label) {
        const lbl = document.createElement('div');
        lbl.className = 'marker-label';
        lbl.textContent = marker.label;
        lbl.style.cssText = `position:absolute;font-size:10px;color:${marker.color||'#fff'};transform:rotate(${cssA}deg) translateX(${gSz/2+15}px) rotate(${-cssA}deg);transform-origin:center center;z-index:2;text-shadow:0 0 3px rgba(0,0,0,.7)`;
        gauge.appendChild(lbl);
      }
    });

    (ctx.config.zones || []).forEach(zone => {
      const r   = gSz / 2 + 5;
      const cxy = (gSz + 20) / 2;
      const aS  = (valueToArcAngle(zone.from, min, max, arcStart, arcSweep, bidirectional) - 90) * Math.PI / 180;
      const aE  = (valueToArcAngle(zone.to,   min, max, arcStart, arcSweep, bidirectional) - 90) * Math.PI / 180;
      let arc   = (aE - aS) * 180 / Math.PI; if (arc < 0) arc += 360;
      const x1  = cxy + r * Math.cos(aS), y1 = cxy + r * Math.sin(aS);
      const x2  = cxy + r * Math.cos(aE), y2 = cxy + r * Math.sin(aE);
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('width', gSz+20); svg.setAttribute('height', gSz+20);
      svg.style.cssText = 'position:absolute;top:-10px;left:-10px;z-index:1;pointer-events:none';
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${arc>180?1:0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`);
      path.setAttribute('fill','none'); path.setAttribute('stroke', zone.color||'#fff');
      path.setAttribute('stroke-width','4'); path.setAttribute('opacity', zone.opacity||'0.5');
      svg.appendChild(path); gauge.appendChild(svg);
    });
  }

  /** v2.0 — SVG scale ticks + labels overlay */
  function renderScaleTicks(ctx) {
    if (!ctx.config.scale_ticks) return;
    const { gauge_size:gSz=200, arc_start:arcStart=0, arc_sweep:arcSweep=360,
            scale_steps:steps=5, scale_labels=true, min=0, max=100,
            led_size:ledSize=8, decimals=0 } = ctx.config;
    const ledR   = gSz / 2 - ledSize;
    const PAD    = 38;
    const svgSz  = gSz + PAD * 2;
    const cx = svgSz / 2, cy = svgSz / 2;
    const MINOR  = steps * 2;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg    = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', svgSz); svg.setAttribute('height', svgSz);
    svg.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:visible;z-index:1`;
    for (let i = 0; i <= MINOR; i++) {
      const isMajor = i % 2 === 0;
      const rad     = (arcStart + (i / MINOR) * arcSweep - 90) * Math.PI / 180;
      const r1      = ledR + PAD * 0.35 + (isMajor ? 0 : 4);
      const r2      = ledR + PAD * 0.35 + (isMajor ? 14 : 8);
      const line    = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', (cx + r1 * Math.cos(rad)).toFixed(2));
      line.setAttribute('y1', (cy + r1 * Math.sin(rad)).toFixed(2));
      line.setAttribute('x2', (cx + r2 * Math.cos(rad)).toFixed(2));
      line.setAttribute('y2', (cy + r2 * Math.sin(rad)).toFixed(2));
      line.setAttribute('stroke', isMajor ? '#888' : '#555');
      line.setAttribute('stroke-width', isMajor ? '1.5' : '1');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
      if (isMajor && scale_labels) {
        const lR  = ledR + PAD * 0.35 + 25;
        const txt = document.createElementNS(SVG_NS, 'text');
        txt.setAttribute('x', (cx + lR * Math.cos(rad)).toFixed(2));
        txt.setAttribute('y', (cy + lR * Math.sin(rad)).toFixed(2));
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('fill', '#888');
        txt.setAttribute('font-size', '10');
        txt.setAttribute('font-family', 'system-ui,sans-serif');
        txt.textContent = (min + (i / MINOR) * (max - min)).toFixed(decimals);
        svg.appendChild(txt);
      }
    }
    const wrap = ctx.shadowRoot.querySelector('.gauge-wrap');
    if (wrap) wrap.appendChild(svg);
  }

  // ── State ────────────────────────────────────────────────────────────────────

  function updateGauge(ctx) {
    const entityState = ctx._hass.states[ctx.config.entity];
    if (!entityState) return;
    const rawValue = ctx.config.attribute
      ? entityState.attributes[ctx.config.attribute]
      : entityState.state;
    const state = parseFloat(rawValue ?? '0');
    const prev  = ctx.previousState !== null ? ctx.previousState : state;
    const min   = ctx.config.min || 0;
    const max   = ctx.config.max || 100;
    if (ctx.config.smooth_transitions && prev !== state) {
      animateValueChange(ctx, prev, state, min, max);
    } else {
      const n = ctx.ledsCount || 100;
      updateLeds(ctx, state, n, min, max);
      updateCenterShadow(ctx, ((state - min) / (max - min)) * 100, state, min, max);
      const vd = ctx.shadowRoot.querySelector('.value');
      const ud = ctx.shadowRoot.querySelector('.unit');
      if (vd) vd.textContent = state.toFixed(ctx.config.decimals || 0);
      if (ud) ud.textContent = ctx.config.unit || '';
    }
    ctx.previousState = state;
    if (ctx._updateButtonsState) ctx._updateButtonsState();
  }

  function updateLeds(ctx, value, ledsCount, min, max) {
    const cfg       = ctx.config;
    const ledInfo   = calculateBidirectionalLeds(value, min, max, ledsCount, cfg.bidirectional);
    const color     = getLedColor(ledInfo.normalizedValue, cfg.severity, min, max);

    const gc = ctx.shadowRoot.getElementById('gauge-container');
    if (gc) gc.style.boxShadow = cfg.enable_shadow ? `0 0 30px 2px ${color}` : '';

    // Zero LED index: proportional to where refPoint falls in [min, max], same logic as valueToArcAngle.
    const biRef      = cfg.bidirectional ? ((min <= 0 && max >= 0) ? 0 : (min + max) / 2) : min;
    const zeroFrac   = Math.max(0, Math.min(1, (biRef - min) / (max - min)));
    const zeroLedIdx = Math.round(zeroFrac * ledsCount);

    for (let i = 0; i < ledsCount; i++) {
      const led = ctx.shadowRoot.getElementById(`led-${i}`);
      if (!led) continue;
      let isActive = false;

      if (ledInfo.direction === 'unidirectional') {
        isActive = i < ledInfo.activeLeds;
      } else if (ledInfo.direction === 'positive') {
        isActive = i >= zeroLedIdx && i < zeroLedIdx + ledInfo.activeLeds;
      } else {
        // negative: zero LED always lit as reference point
        isActive = (i === zeroLedIdx) || (i >= zeroLedIdx - ledInfo.activeLeds && i < zeroLedIdx);
      }

      if (isActive) {
        led.style.display    = '';
        led.style.background = `radial-gradient(circle,rgba(255,255,255,.8),${color})`;
        led.style.boxShadow  = `0 0 8px ${color}`;
        led.classList.add('active');
      } else {
        if (cfg.hide_inactive_leds) {
          led.style.display = 'none';
        } else {
          led.style.display    = '';
          led.style.background = '#333';
          led.style.boxShadow  = 'none';
        }
        led.classList.remove('active');
      }
    }
  }

  function updateCenterShadow(ctx, value, realValue, min, max) {
    const cs = ctx.shadowRoot.getElementById('center-shadow');
    // The shadow is also needed when an alarm pulses it, even with center_shadow off.
    const pulsable = (ctx.config.alarms || []).some(a => a.effect === 'shadow_pulse');
    if (!ctx.config.center_shadow && !pulsable) {
      updateShadowPulse(ctx, null);
      if (cs) cs.style.boxShadow = 'none';
      return;
    }
    const color  = getLedColor(value, ctx.config.severity, min, max);
    const blur   = ctx.config.center_shadow_blur   || 30;
    const spread = ctx.config.center_shadow_spread || 15;
    ctx.currentShadowColor = color;
    // While pulsing, the pulsation interval owns the box-shadow.
    if (cs && !ctx.pulsationInterval) {
      cs.style.boxShadow = ctx.config.center_shadow ? `0 0 ${blur}px ${spread}px ${color}` : 'none';
    }
  }

  function showEntityHistory(ctx) {
    if (!ctx.config.entity || !ctx._hass) return;
    const action = ctx.config.tap_action || { action: 'more-info' };
    if (action.action === 'none') return;
    if (action.action === 'navigate' && action.navigation_path) {
      history.pushState(null, '', action.navigation_path);
      window.dispatchEvent(new Event('location-changed'));
    } else if (action.action === 'call-service' && action.service) {
      const [domain, svc] = action.service.split('.');
      ctx._hass.callService(domain, svc, action.service_data || {});
    } else {
      // default: more-info
      const evt = new Event('hass-more-info', { bubbles: true, composed: true });
      evt.detail = { entityId: ctx.config.entity };
      ctx.dispatchEvent(evt);
    }
  }

  async function showTrendIndicator(ctx) {
    if (!ctx.config.show_trend || !ctx._hass || !ctx.config.entity) return;
    const now = new Date(), start = new Date();
    start.setHours(now.getHours() - 24);
    try {
      const history = await ctx._hass.callWS({ type:'history/history_during_period', entity_ids:[ctx.config.entity], start_time:start.toISOString(), end_time:now.toISOString(), minimal_response:true });
      if (!history?.[0]?.length) return;
      const states = history[0];
      const cur    = parseFloat(states[states.length - 1].state);
      const prev   = parseFloat(states[0].state);
      const diff   = cur - prev;
      const pct    = prev !== 0 ? (diff / prev) * 100 : 0;
      const wrap   = document.createElement('div'); wrap.className = 'trend-indicator';
      const arrow  = document.createElement('span'); arrow.className = 'trend-arrow';
      const val    = document.createElement('span'); val.className   = 'trend-value';
      arrow.textContent = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
      arrow.style.color = diff > 0 ? '#4caf50' : diff < 0 ? '#f44336' : '#ffeb3b';
      val.textContent   = `${Math.abs(pct).toFixed(1)}%`;
      wrap.appendChild(arrow); wrap.appendChild(val);
      ctx.shadowRoot.querySelector('.gauge-card')?.appendChild(wrap);
    } catch (e) { console.error('custom-gauge-card: error fetching history', e); }
  }

  // ── Visual Editor ────────────────────────────────────────────────────────────

  class CustomGaugeCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass   = null;
      this._built  = false;
    }

    set hass(hass) {
      this._hass = hass;
      this.shadowRoot.querySelectorAll('[data-sel]').forEach(el => {
        el.hass = hass;
        // Re-sync value so ha-selector re-renders don't revert user changes
        const key = el.getAttribute('data-key');
        if (key && this._config[key] !== undefined) el.value = this._config[key];
      });
    }

    setConfig(config) {
      this._config = { ...config };
      if (!this._built) {
        this._build();
        this._built = true;
        return;
      }
      // Only rebuild when a key that controls section visibility changes.
      // Compare against _builtConfig (snapshot at last _build), not _config,
      // because _change() updates _config immediately before HA calls setConfig.
      // `alarms` is deliberately absent: the alarms editor redraws itself, a full
      // rebuild on every keystroke would steal focus.
      const STRUCTURAL = ['theme', 'center_shadow', 'entity'];
      if (STRUCTURAL.some(k => (this._builtConfig || {})[k] !== config[k])) this._build();
    }

    _change(key, value) {
      this._config = { ...this._config, [key]: value };
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true, composed: true,
      }));
    }

    // Create a ha-selector field
    _sel(key, selector, label, defaultVal) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      if (label) {
        const lbl = document.createElement('label');
        lbl.className = 'field-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }
      const el = document.createElement('ha-selector');
      el.setAttribute('data-sel', '');
      el.setAttribute('data-key', key);
      el.selector = selector;
      const val = this._config[key] !== undefined ? this._config[key] : (defaultVal !== undefined ? defaultVal : '');
      el.value = val;
      if (this._hass) el.hass = this._hass;
      el.addEventListener('value-changed', e => { e.stopPropagation(); this._change(key, e.detail.value); });
      wrap.appendChild(el);
      return wrap;
    }

    // Create a row of fields (grid)
    _row(cols, ...fields) {
      const row = document.createElement('div');
      row.className = `row cols-${cols}`;
      fields.forEach(f => row.appendChild(f));
      return row;
    }

    // Create a collapsible section
    _section(title, ...children) {
      const panel = document.createElement('ha-expansion-panel');
      panel.header = title;
      panel.outlined = true;
      const body = document.createElement('div');
      body.className = 'panel-body';
      children.forEach(c => c && body.appendChild(c));
      panel.appendChild(body);
      return panel;
    }

    // Small info text
    _info(text) {
      const el = document.createElement('p');
      el.className = 'info';
      el.textContent = text;
      return el;
    }

    // Sub-title inside a section
    _sub(text) {
      const el = document.createElement('div');
      el.className = 'sub';
      el.textContent = text;
      return el;
    }

    _colorField(key, label) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      if (label) {
        const lbl = document.createElement('label');
        lbl.className = 'field-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }
      const row = document.createElement('div');
      row.className = 'color-field-row';

      const currentVal = this._config[key] || '';
      const isHex = /^#[0-9a-fA-F]{6}$/.test(currentVal);

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = isHex ? currentVal : '#ffffff';
      picker.className = 'color-field-picker';
      picker.title = 'Choose a color';

      const valTxt = document.createElement('span');
      valTxt.className = 'color-field-val';
      valTxt.textContent = currentVal || '(theme color)';

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '✕';
      clearBtn.className = 'color-field-clear';
      clearBtn.title = 'Reset (theme color)';
      clearBtn.style.visibility = currentVal ? 'visible' : 'hidden';

      picker.addEventListener('input', e => {
        valTxt.textContent = e.target.value;
        clearBtn.style.visibility = 'visible';
        this._change(key, e.target.value);
      });
      clearBtn.addEventListener('click', () => {
        this._change(key, null);
        picker.value = '#ffffff';
        valTxt.textContent = '(theme color)';
        clearBtn.style.visibility = 'hidden';
      });

      row.append(picker, valTxt, clearBtn);
      wrap.appendChild(row);
      return wrap;
    }

    _attrField(entityId) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const lbl = document.createElement('label');
      lbl.className = 'field-label';
      lbl.textContent = 'Attribute (optional)';
      wrap.appendChild(lbl);

      const row = document.createElement('div');
      row.className = 'attr-field-row';

      const sel = document.createElement('ha-selector');
      sel.setAttribute('data-sel', '');
      sel.setAttribute('data-key', 'attribute');
      sel.selector = { attribute: { entity_id: entityId } };
      sel.value = this._config.attribute || '';
      if (this._hass) sel.hass = this._hass;

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '✕';
      clearBtn.className = 'attr-field-clear';
      clearBtn.title = 'Use entity state (no attribute)';
      clearBtn.style.visibility = this._config.attribute ? 'visible' : 'hidden';

      sel.addEventListener('value-changed', e => {
        e.stopPropagation();
        const v = e.detail.value || null;
        clearBtn.style.visibility = v ? 'visible' : 'hidden';
        this._change('attribute', v);
      });
      clearBtn.addEventListener('click', () => {
        sel.value = '';
        clearBtn.style.visibility = 'hidden';
        this._change('attribute', null);
      });

      row.append(sel, clearBtn);
      wrap.appendChild(row);
      return wrap;
    }

    /**
     * Write the alarms list to the config and drop the legacy pulse keys so a
     * migrated card never carries two sources of truth.
     */
    _commitAlarms(alarms) {
      const cfg = { ...this._config, alarms: alarms.map(a => ({ ...a })) };
      LEGACY_PULSE_KEYS.forEach(k => delete cfg[k]);
      this._config = cfg;
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: cfg }, bubbles: true, composed: true,
      }));
    }

    /**
     * Write the buttons list to the config and drop the pre-2.2 single-button
     * keys, so a migrated card never carries two sources of truth.
     */
    _commitButtons(buttons) {
      const cfg = { ...this._config, buttons: buttons.map(b => ({ ...b })) };
      LEGACY_BUTTON_KEYS.forEach(k => delete cfg[k]);
      this._config = cfg;
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: cfg }, bubbles: true, composed: true,
      }));
    }

    /**
     * ha-selector bound to one key of one entry of a config list (alarms,
     * buttons, dynamic markers). `commit` writes the mutated list back.
     *
     * No data-key attribute: the `set hass` re-sync loop only re-syncs top-level
     * config keys and would otherwise overwrite this value with the whole array.
     */
    _listSel(list, idx, key, selector, label, defaultVal, commit, onChange) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      if (label) {
        const lbl = document.createElement('label');
        lbl.className = 'field-label';
        lbl.textContent = label;
        wrap.appendChild(lbl);
      }
      const el = document.createElement('ha-selector');
      el.setAttribute('data-sel', '');
      el.selector = selector;
      const cur = list[idx][key];
      el.value = cur !== undefined && cur !== null ? cur : (defaultVal !== undefined ? defaultVal : '');
      if (this._hass) el.hass = this._hass;
      el.addEventListener('value-changed', e => {
        e.stopPropagation();
        const v = e.detail.value;
        list[idx][key] = (v === '' || v === undefined) ? null : v;
        commit(list);
        if (onChange) onChange();
      });
      wrap.appendChild(el);
      return wrap;
    }

    /**
     * Color picker bound to `list[idx].color`. The clear button resets it to
     * null; what null means is per-list, hence the opts.
     */
    _listColorField(list, idx, opts) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const lbl = document.createElement('label');
      lbl.className = 'field-label';
      lbl.textContent = 'Color';
      wrap.appendChild(lbl);

      const row = document.createElement('div');
      row.className = 'color-field-row';
      const cur   = list[idx].color || '';
      const isHex = /^#[0-9a-fA-F]{6}$/.test(cur);

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = isHex ? cur : opts.defaultHex;
      picker.className = 'color-field-picker';
      picker.title = opts.pickerTitle;

      const valTxt = document.createElement('span');
      valTxt.className = 'color-field-val';
      valTxt.textContent = cur || opts.emptyText;

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '\u2715';
      clearBtn.className = 'color-field-clear';
      clearBtn.title = opts.clearTitle;
      clearBtn.style.visibility = cur ? 'visible' : 'hidden';

      picker.addEventListener('input', e => {
        valTxt.textContent = e.target.value;
        clearBtn.style.visibility = 'visible';
        list[idx].color = e.target.value;
        opts.commit(list);
      });
      clearBtn.addEventListener('click', () => {
        picker.value = opts.defaultHex;
        valTxt.textContent = opts.emptyText;
        clearBtn.style.visibility = 'hidden';
        list[idx].color = null;
        opts.commit(list);
      });

      row.append(picker, valTxt, clearBtn);
      wrap.appendChild(row);
      return wrap;
    }

    _buttonSel(buttons, idx, key, selector, label, defaultVal, onChange) {
      return this._listSel(buttons, idx, key, selector, label, defaultVal,
        l => this._commitButtons(l), onChange);
    }

    _buildButtonsEditor() {
      const wrap = document.createElement('div');
      wrap.className = 'alarms-editor';

      // Seed from `buttons`, falling back to the legacy show_switch_button pair
      // so an existing card opens in the editor with its button already listed.
      let buttons = Array.isArray(this._config.buttons)
        ? this._config.buttons.map(b => ({ ...b }))
        : [];
      if (!buttons.length && this._config.show_switch_button && this._config.switch_entity) {
        buttons = [{ entity: this._config.switch_entity, icon: null }];
      }

      const redraw = () => {
        wrap.innerHTML = '';

        buttons.forEach((btn, idx) => {
          const box = document.createElement('div');
          box.className = 'alarm-box';

          const head = document.createElement('div');
          head.className = 'alarm-head';
          const title = document.createElement('span');
          title.textContent = `Button ${idx + 1}`;
          const delBtn = document.createElement('button');
          delBtn.textContent = '\u2715';
          delBtn.className = 'alarm-del';
          delBtn.title = 'Delete this button';
          delBtn.addEventListener('click', () => {
            buttons.splice(idx, 1);
            this._commitButtons(buttons);
            redraw();
          });
          head.append(title, delBtn);
          box.appendChild(head);

          // redraw on entity change: the default-icon hint follows the domain
          box.appendChild(this._buttonSel(buttons, idx, 'entity', { entity: {} },
            'Entity', undefined, redraw));

          box.appendChild(this._buttonSel(buttons, idx, 'icon', { icon: {} },
            'Icon (empty = default for the entity type)'));

          if (btn.entity && !btn.icon) {
            box.appendChild(this._info(
              `Default icon for this entity: ${getDefaultIcon(getEntityType(btn.entity))}`));
          }

          box.appendChild(this._buttonSel(buttons, idx, 'icon_size',
            { number: { min: 8, max: 44, step: 1, mode: 'box', unit_of_measurement: 'px' } },
            'Icon size', this._config.button_icon_size || 22));

          wrap.appendChild(box);
        });

        if (!buttons.length) {
          wrap.appendChild(this._info(
            'No button configured. Buttons appear in a bar under the title \u2014 with none, ' +
            'neither the bar nor its separator is drawn.'));
        }

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add button';
        addBtn.className = 'alarm-add';
        addBtn.disabled = buttons.length >= MAX_BUTTONS;
        if (addBtn.disabled) addBtn.title = `${MAX_BUTTONS} buttons maximum`;
        addBtn.addEventListener('click', () => {
          if (buttons.length >= MAX_BUTTONS) return;
          buttons.push({ entity: null, icon: null });
          this._commitButtons(buttons);
          redraw();
        });
        wrap.appendChild(addBtn);
      };

      redraw();
      return wrap;
    }

    _alarmSel(alarms, idx, key, selector, label, defaultVal, onChange) {
      return this._listSel(alarms, idx, key, selector, label, defaultVal,
        l => this._commitAlarms(l), onChange);
    }

    _alarmColorField(alarms, idx) {
      return this._listColorField(alarms, idx, {
        defaultHex:  '#f44336',
        pickerTitle: 'Choose an alarm color',
        emptyText:   '(gauge color)',
        clearTitle:  'Reset (follow the gauge severity color)',
        commit:      l => this._commitAlarms(l),
      });
    }

    // ── Dynamic markers ─────────────────────────────────────────────────────

    _commitDynamicMarkers(markers) {
      this._config = { ...this._config, dynamic_markers: markers.map(m => ({ ...m })) };
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config }, bubbles: true, composed: true,
      }));
    }

    _dynMarkerSel(markers, idx, key, selector, label, defaultVal, onChange) {
      return this._listSel(markers, idx, key, selector, label, defaultVal,
        l => this._commitDynamicMarkers(l), onChange);
    }

    _buildDynamicMarkersEditor() {
      const wrap = document.createElement('div');
      wrap.className = 'alarms-editor';

      const markers = Array.isArray(this._config.dynamic_markers)
        ? this._config.dynamic_markers.map(m => ({ ...m }))
        : [];

      const redraw = () => {
        wrap.innerHTML = '';

        markers.forEach((mk, idx) => {
          const box = document.createElement('div');
          box.className = 'alarm-box';

          const head = document.createElement('div');
          head.className = 'alarm-head';
          const title = document.createElement('span');
          title.textContent = mk.label || `Marker ${idx + 1}`;
          const delBtn = document.createElement('button');
          delBtn.textContent = '✕';
          delBtn.className = 'alarm-del';
          delBtn.title = 'Delete this marker';
          delBtn.addEventListener('click', () => {
            markers.splice(idx, 1);
            this._commitDynamicMarkers(markers);
            redraw();
          });
          head.append(title, delBtn);
          box.appendChild(head);

          // redraw: picking an entity reveals its attribute selector
          box.appendChild(this._dynMarkerSel(markers, idx, 'entity', { entity: {} },
            'Tracked entity', undefined, redraw));

          if (mk.entity) {
            box.appendChild(this._dynMarkerSel(markers, idx, 'attribute',
              { attribute: { entity_id: mk.entity } }, 'Attribute (optional, defaults to the state)'));
          }

          box.appendChild(this._dynMarkerSel(markers, idx, 'label', { text: {} },
            'Label (optional, shown next to the dot)'));

          box.appendChild(this._row(2,
            this._dynMarkerSel(markers, idx, 'size',
              { number: { min: 4, max: 30, step: 1, mode: 'box', unit_of_measurement: 'px' } }, 'Dot size', 8),
            this._dynMarkerSel(markers, idx, 'show_value', { boolean: {} }, 'Show value', false),
          ));

          box.appendChild(this._listColorField(markers, idx, {
            defaultHex:  '#4caf50',
            pickerTitle: 'Choose a marker color',
            emptyText:   '(auto — by entity domain)',
            clearTitle:  'Reset (automatic color, based on the entity domain)',
            commit:      l => this._commitDynamicMarkers(l),
          }));

          wrap.appendChild(box);
        });

        if (!markers.length) {
          wrap.appendChild(this._info(
            'No dynamic marker configured. A marker is a dot that rides along the gauge ' +
            'to track another entity in real time.'));
        }

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add dynamic marker';
        addBtn.className = 'alarm-add';
        addBtn.addEventListener('click', () => {
          markers.push({ entity: null, color: null, size: 8, show_value: false });
          this._commitDynamicMarkers(markers);
          redraw();
        });
        wrap.appendChild(addBtn);
      };

      redraw();
      return wrap;
    }

    _buildAlarmsEditor() {
      const wrap = document.createElement('div');
      wrap.className = 'alarms-editor';

      // Seed from `alarms`, falling back to the legacy center_shadow_pulse_* keys
      // so an existing card opens in the editor with its alarm already listed.
      let alarms;
      if (Array.isArray(this._config.alarms)) {
        alarms = this._config.alarms.map(a => ({ ...a }));
      } else {
        const legacy = legacyPulseAlarm(this._config);
        alarms = legacy ? [legacy] : [];
      }

      const CONDITIONS = [
        { value: 'range',       label: 'Value between min and max' },
        { value: 'outside',     label: 'Value outside min…max' },
        { value: 'above',       label: 'Value above' },
        { value: 'below',       label: 'Value below' },
        { value: 'equal',       label: 'Value equals' },
        { value: 'state',       label: 'State is' },
        { value: 'state_not',   label: 'State is not' },
        { value: 'unavailable', label: 'Entity unavailable' },
      ];
      const EFFECTS = [
        { value: 'shadow_pulse', label: 'Pulsating center shadow' },
        { value: 'leds_blink',   label: 'Blinking LEDs' },
        { value: 'value_blink',  label: 'Blinking value' },
        { value: 'border_pulse', label: 'Pulsating card border' },
      ];

      const redraw = () => {
        wrap.innerHTML = '';

        alarms.forEach((alarm, idx) => {
          const box = document.createElement('div');
          box.className = 'alarm-box';

          const head = document.createElement('div');
          head.className = 'alarm-head';
          const title = document.createElement('span');
          title.textContent = alarm.name || `Alarm ${idx + 1}`;
          const delBtn = document.createElement('button');
          delBtn.textContent = '✕';
          delBtn.className = 'alarm-del';
          delBtn.title = 'Delete this alarm';
          delBtn.addEventListener('click', () => {
            alarms.splice(idx, 1);
            this._commitAlarms(alarms);
            redraw();
          });
          head.append(title, delBtn);
          box.appendChild(head);

          // redraw: picking an entity reveals its attribute selector
          box.appendChild(this._alarmSel(alarms, idx, 'entity', { entity: {} },
            'Watched entity (empty = gauge entity)', undefined, redraw));

          if (alarm.entity) {
            box.appendChild(this._alarmSel(alarms, idx, 'attribute',
              { attribute: { entity_id: alarm.entity } }, 'Attribute (optional)'));
          }

          box.appendChild(this._row(2,
            this._alarmSel(alarms, idx, 'condition', { select: { options: CONDITIONS, mode: 'dropdown' } },
              'Condition', 'range', redraw),
            this._alarmSel(alarms, idx, 'effect', { select: { options: EFFECTS, mode: 'dropdown' } },
              'Effect', 'shadow_pulse', redraw),
          ));

          const cond = alarm.condition || 'range';
          if (cond === 'range' || cond === 'outside') {
            box.appendChild(this._row(2,
              this._alarmSel(alarms, idx, 'min', { number: { mode: 'box', step: 'any' } }, 'Min value'),
              this._alarmSel(alarms, idx, 'max', { number: { mode: 'box', step: 'any' } }, 'Max value'),
            ));
          } else if (cond === 'above' || cond === 'below' || cond === 'equal') {
            box.appendChild(this._alarmSel(alarms, idx, 'value',
              { number: { mode: 'box', step: 'any' } }, 'Threshold value'));
          } else if (cond === 'state' || cond === 'state_not') {
            box.appendChild(this._alarmSel(alarms, idx, 'state', { text: {} }, 'State (e.g. on, off, charging)', 'on'));
          }

          box.appendChild(this._row(2,
            this._alarmSel(alarms, idx, 'duration',
              { number: { min: 200, max: 5000, step: 100, mode: 'box', unit_of_measurement: 'ms' } }, 'Cycle duration', 1000),
            this._alarmSel(alarms, idx, 'intensity',
              { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }, 'Min intensity (0 = full flash)', 0.5),
          ));

          if (alarm.effect === 'leds_blink') {
            box.appendChild(this._info('Blinking LEDs keep their severity colors — the color below is ignored for this effect.'));
          }
          box.appendChild(this._alarmColorField(alarms, idx));
          box.appendChild(this._alarmSel(alarms, idx, 'name', { text: {} }, 'Label (optional, editor only)'));

          wrap.appendChild(box);
        });

        if (!alarms.length) {
          wrap.appendChild(this._info('No alarm configured. An alarm watches any entity and applies a visual effect while its condition is met.'));
        }

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add alarm';
        addBtn.className = 'alarm-add';
        addBtn.addEventListener('click', () => {
          alarms.push({
            entity: null, condition: 'range',
            min: this._config.min !== undefined ? this._config.min : 0,
            max: this._config.max !== undefined ? this._config.max : 100,
            effect: 'shadow_pulse', duration: 1000, intensity: 0.5,
          });
          this._commitAlarms(alarms);
          redraw();
        });
        wrap.appendChild(addBtn);
      };

      redraw();
      return wrap;
    }

    _buildSeverityEditor() {
      const wrap = document.createElement('div');
      wrap.className = 'severity-editor';
      const defaultSev = [{ color: '#4caf50', value: 20 }, { color: '#ffeb3b', value: 50 }, { color: '#f44336', value: 100 }];
      let sev = this._config.severity ? this._config.severity.map(z => ({ ...z })) : defaultSev.map(z => ({ ...z }));

      const redraw = () => {
        wrap.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'sev-header';
        header.innerHTML = '<span>Color</span><span>≤ Threshold value</span><span></span>';
        wrap.appendChild(header);

        sev.forEach((zone, idx) => {
          const row = document.createElement('div');
          row.className = 'sev-row';

          const colorInput = document.createElement('input');
          colorInput.type = 'color';
          colorInput.value = zone.color;
          colorInput.className = 'sev-color';
          colorInput.title = 'Choose a color';
          colorInput.addEventListener('input', e => {
            sev[idx].color = e.target.value;
            this._change('severity', sev.map(z => ({ ...z })));
          });

          const valInput = document.createElement('input');
          valInput.type = 'number';
          valInput.value = zone.value;
          valInput.className = 'sev-val';
          valInput.placeholder = 'Value';
          valInput.step = 'any';
          valInput.addEventListener('change', e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              sev[idx].value = v;
              this._change('severity', sev.map(z => ({ ...z })));
            }
          });

          const delBtn = document.createElement('button');
          delBtn.textContent = '✕';
          delBtn.className = 'sev-del';
          delBtn.title = 'Delete';
          delBtn.addEventListener('click', () => {
            sev.splice(idx, 1);
            this._change('severity', sev.map(z => ({ ...z })));
            redraw();
          });

          row.append(colorInput, valInput, delBtn);
          wrap.appendChild(row);
        });

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add zone';
        addBtn.className = 'sev-add';
        addBtn.addEventListener('click', () => {
          const last = sev[sev.length - 1];
          sev.push({ color: '#ffffff', value: last ? last.value + 10 : 100 });
          this._change('severity', sev.map(z => ({ ...z })));
          redraw();
        });
        wrap.appendChild(addBtn);

        const note = document.createElement('p');
        note.className = 'info';
        note.textContent = 'Zones are evaluated in order — the first one whose threshold ≥ the current value applies.';
        wrap.appendChild(note);
      };

      redraw();
      return wrap;
    }

    _build() {
      this._builtConfig = { ...this._config };
      const shadow = this.shadowRoot;
      const cfg    = this._config;

      // Save which panels are currently expanded before wiping the DOM
      const openPanels = new Set();
      shadow.querySelectorAll('ha-expansion-panel').forEach(p => {
        if (p.expanded) openPanels.add(p.header);
      });

      shadow.innerHTML = `<style>
        :host { display: block; }
        .editor { padding: 4px 0; }
        ha-expansion-panel { display: block; margin-bottom: 6px; }
        .panel-body { padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
        .field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
        .row { display: grid; gap: 10px; }
        .cols-1 { grid-template-columns: 1fr; }
        .cols-2 { grid-template-columns: 1fr 1fr; }
        .cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        .cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        ha-selector { display: block; }
        .info { font-size: 12px; color: var(--secondary-text-color); font-style: italic;
                padding: 8px 10px; background: var(--secondary-background-color);
                border-radius: 6px; margin: 0; line-height: 1.5; }
        .sub  { font-size: 11px; font-weight: 700; color: var(--primary-color);
                text-transform: uppercase; letter-spacing: 0.6px;
                border-bottom: 1px solid var(--divider-color); padding-bottom: 4px; margin-top: 4px; }
        .severity-editor { display: flex; flex-direction: column; gap: 4px; }
        .sev-header { display: grid; grid-template-columns: 44px 1fr 32px; gap: 8px; padding: 0 2px;
                      font-size: 10px; font-weight: 600; color: var(--secondary-text-color);
                      text-transform: uppercase; letter-spacing: 0.4px; }
        .sev-row { display: grid; grid-template-columns: 44px 1fr 32px; gap: 8px; align-items: center; }
        .sev-color { width: 44px; height: 34px; padding: 2px 3px; border: 1px solid var(--divider-color);
                     border-radius: 6px; cursor: pointer; background: none; }
        .sev-val { height: 34px; padding: 0 10px; border: 1px solid var(--divider-color); border-radius: 6px;
                   background: var(--card-background-color, #fff); color: var(--primary-text-color);
                   font-size: 14px; width: 100%; box-sizing: border-box; }
        .sev-del, .alarm-del { width: 32px; height: 32px; border-radius: 50%; border: none;
                   background: var(--error-color, #f44336); color: white;
                   cursor: pointer; font-size: 14px; line-height: 1; }
        .sev-add, .alarm-add { margin-top: 4px; padding: 7px 12px; border: 1px dashed var(--primary-color);
                   border-radius: 6px; background: none; color: var(--primary-color);
                   cursor: pointer; font-size: 13px; width: 100%; }
        .sev-add:disabled, .alarm-add:disabled { opacity: 0.4; cursor: not-allowed; }
        .alarms-editor { display: flex; flex-direction: column; gap: 10px; }
        .alarm-box { display: flex; flex-direction: column; gap: 10px; padding: 12px;
                     border: 1px solid var(--divider-color); border-radius: 8px; }
        .alarm-head { display: flex; align-items: center; justify-content: space-between;
                      font-size: 11px; font-weight: 700; color: var(--primary-color);
                      text-transform: uppercase; letter-spacing: 0.6px; }
        .color-field-row { display: flex; align-items: center; gap: 8px; }
        .color-field-picker { width: 44px; height: 34px; padding: 2px 3px; border: 1px solid var(--divider-color);
                              border-radius: 6px; cursor: pointer; background: none; flex-shrink: 0; }
        .color-field-val { flex: 1; font-size: 12px; color: var(--secondary-text-color);
                           font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .color-field-clear { width: 26px; height: 26px; border-radius: 50%; border: none;
                             background: var(--secondary-text-color, #888); color: white;
                             cursor: pointer; font-size: 12px; line-height: 1; flex-shrink: 0;
                             opacity: 0.55; transition: opacity .15s; }
        .color-field-clear:hover { opacity: 1; }
        .attr-field-row { display: flex; align-items: center; gap: 8px; }
        .attr-field-row ha-selector { flex: 1; min-width: 0; }
        .attr-field-clear { width: 26px; height: 26px; border-radius: 50%; border: none;
                            background: var(--secondary-text-color, #888); color: white;
                            cursor: pointer; font-size: 12px; line-height: 1; flex-shrink: 0;
                            opacity: 0.55; transition: opacity .15s; }
        .attr-field-clear:hover { opacity: 1; }
      </style><div class="editor" id="root"></div>`;

      const root = shadow.getElementById('root');

      // ── Essentials ──────────────────────────────────────────────────────────
      root.appendChild(this._section('Essentials',
        this._sel('entity', { entity: {} }, 'Entity *'),
        cfg.entity
          ? this._attrField(cfg.entity)
          : this._info('Select an entity first to pick an attribute.'),
        this._row(2,
          this._sel('name',     { text: {} },   'Display name'),
          this._sel('unit',     { text: {} },   'Unit'),
        ),
        this._row(3,
          this._sel('min',      { number: { mode: 'box', step: 'any' } }, 'Minimum'),
          this._sel('max',      { number: { mode: 'box', step: 'any' } }, 'Maximum'),
          this._sel('decimals', { number: { min: 0, max: 5, mode: 'box' } }, 'Decimals', 0),
        ),
      ));

      // ── Appearance ──────────────────────────────────────────────────────────
      root.appendChild(this._section('Appearance',
        this._row(3,
          this._sel('gauge_size',  { number: { min: 100, max: 500, step: 10,  mode: 'box' } }, 'Gauge size (px)',  200),
          this._sel('center_size', { number: { min: 1,  max: 400, step: 10,  mode: 'box' } }, 'Center size (px)', 120),
          this._sel('led_size',    { number: { min: 2,   max: 20,  step: 1,   mode: 'box' } }, 'LED size (px)',    8),
        ),
        this._row(2,
          this._sel('leds_count',   { number: { min: 20, max: 300, step: 5, mode: 'slider' } }, 'LED count', 100),
          this._sel('bidirectional', { boolean: {} }, 'Bidirectional mode', false),
        ),
      ));

      // ── Arc ─────────────────────────────────────────────────────────────────
      root.appendChild(this._section('Arc',
        this._row(2,
          this._sel('arc_start', { number: { min: 0, max: 359, step: 1,  mode: 'slider', unit_of_measurement: '°' } }, 'Start angle', 0),
          this._sel('arc_sweep', { number: { min: 30, max: 360, step: 5, mode: 'slider', unit_of_measurement: '°' } }, 'Arc sweep', 360),
        ),
      ));

      // ── Card dimensions ──────────────────────────────────────────────────────
      root.appendChild(this._section('Card dimensions',
        this._info('Leave empty for automatic sizing (e.g. 300px, 50%).'),
        this._row(3,
          this._sel('card_width',   { text: {} }, 'Width'),
          this._sel('card_height',  { text: {} }, 'Height'),
          this._sel('card_padding', { text: {} }, 'Padding', '16px'),
        ),
      ));

      // ── Theme ────────────────────────────────────────────────────────────────
      const themeChildren = [
        this._sel('theme', {
          select: { options: [
            { value: 'default', label: 'Default (dark)' },
            { value: 'light',   label: 'Light' },
            { value: 'dark',    label: 'Dark' },
            { value: 'custom',  label: 'Custom' },
          ]},
        }, 'Theme', 'default'),
      ];
      if (cfg.theme === 'custom') {
        themeChildren.push(
          this._row(2,
            this._sel('custom_background',        { text: {} }, 'Card background (CSS)'),
            this._sel('custom_gauge_background',  { text: {} }, 'Gauge background (CSS)'),
          ),
          this._sel('custom_center_background',   { text: {} }, 'Center background (CSS)'),
          this._colorField('custom_text_color',            'Main text color'),
          this._colorField('custom_secondary_text_color',  'Secondary text color'),
        );
      }
      root.appendChild(this._section('Theme', ...themeChildren));

      // ── Font ─────────────────────────────────────────────────────────────────
      root.appendChild(this._section('Font',
        this._sub('Title'),
        this._row(3,
          this._sel('title_font_family', { text: {} }, 'Family',         'inherit'),
          this._sel('title_font_size',   { text: {} }, 'Size',           '16px'),
          this._sel('title_font_weight', { text: {} }, 'Weight',         'normal'),
        ),
        this._colorField('title_font_color', 'Color (optional)'),

        this._sub('Center value'),
        this._row(3,
          this._sel('value_font_family', { text: {} }, 'Family',         'inherit'),
          this._sel('value_font_size',   { text: {} }, 'Size',           '32px'),
          this._sel('value_font_weight', { text: {} }, 'Weight',         'bold'),
        ),
        this._colorField('value_font_color', 'Color (optional)'),

        this._sub('Unit'),
        this._row(2,
          this._sel('unit_font_size',   { text: {} }, 'Size',            '16px'),
          this._sel('unit_font_weight', { text: {} }, 'Weight',          'normal'),
        ),
        this._colorField('unit_font_color', 'Color (optional)'),
      ));

      // ── Visual effects ───────────────────────────────────────────────────────
      const fxChildren = [
        this._row(2,
          this._sel('enable_shadow', { boolean: {} }, 'Outer shadow', false),
          this._sel('center_shadow', { boolean: {} }, 'Center shadow', false),
        ),
      ];
      if (cfg.center_shadow) {
        fxChildren.push(this._row(2,
          this._sel('center_shadow_blur',   { number: { min: 0, max: 100, step: 1, mode: 'slider' } }, 'Blur',   30),
          this._sel('center_shadow_spread', { number: { min: 0, max: 50,  step: 1, mode: 'slider' } }, 'Spread', 15),
        ));
      }
      root.appendChild(this._section('Visual effects', ...fxChildren));

      // ── Severity ─────────────────────────────────────────────────────────────
      root.appendChild(this._section('Severity (LED colors)',
        this._info('Define color zones by value. The first zone whose threshold ≥ the current value applies.'),
        this._buildSeverityEditor(),
      ));

      // ── Alarms ───────────────────────────────────────────────────────────────
      root.appendChild(this._section('Alarms',
        this._info('Each alarm watches an entity — the gauge one by default, or any other — and applies a visual effect while its condition is met.'),
        this._buildAlarmsEditor(),
      ));

      // ── Dynamic markers ────────────────────────────────────────────────────
      root.appendChild(this._section('Dynamic markers',
        this._info('Dots that ride along the gauge to track other entities in real time. ' +
                   'A value outside min…max is clamped to the nearest end of the scale.'),
        this._buildDynamicMarkersEditor(),
      ));

      // ── Scale ticks ──────────────────────────────────────────────────────────
      root.appendChild(this._section('Scale ticks',
        this._row(3,
          this._sel('scale_ticks',  { boolean: {} }, 'Show ticks',   false),
          this._sel('scale_steps',  { number: { min: 2, max: 20, step: 1, mode: 'box' } }, 'Steps', 5),
          this._sel('scale_labels', { boolean: {} }, 'Show labels',  true),
        ),
      ));

      // ── Transparency ─────────────────────────────────────────────────────────
      root.appendChild(this._section('Transparency',
        this._row(3,
          this._sel('transparent_card_background',   { boolean: {} }, 'Card background', false),
          this._sel('transparent_gauge_background',  { boolean: {} }, 'Gauge background', false),
          this._sel('transparent_center_background', { boolean: {} }, 'Center background', false),
        ),
        this._row(2,
          this._sel('hide_shadows',       { boolean: {} }, 'Hide shadows',        false),
          this._sel('hide_inactive_leds', { boolean: {} }, 'Hide inactive LEDs',  false),
        ),
      ));

      // ── Buttons ──────────────────────────────────────────────────────────────
      root.appendChild(this._section('Buttons',
        this._info('Up to 4 entity buttons, laid out in a bar under the title. ' +
                   'With an empty list the bar and its separator are not drawn at all.'),
        this._buildButtonsEditor(),
      ));

      // ── Trend & Action ───────────────────────────────────────────────────────
      root.appendChild(this._section('Trend & Click action',
        this._sel('show_trend', { boolean: {} }, 'Show 24h trend', false),
        this._sel('tap_action', { ui_action: { default_action: 'more-info' } }, 'Click action'),
      ));

      // ── Animations ───────────────────────────────────────────────────────────
      root.appendChild(this._section('Animations',
        this._row(2,
          this._sel('smooth_transitions',  { boolean: {} }, 'Smooth transitions', true),
          this._sel('animation_duration',  { number: { min: 100, max: 3000, step: 100, mode: 'slider', unit_of_measurement: 'ms' } }, 'Animation duration', 800),
        ),
      ));

      // ── Performance ──────────────────────────────────────────────────────────
      root.appendChild(this._section('Performance',
        this._row(2,
          this._sel('power_save_mode',  { boolean: {} }, 'Power save mode', false),
          this._sel('debounce_updates', { boolean: {} }, 'Limit updates',   false),
        ),
        this._row(2,
          this._sel('update_interval',        { number: { min: 100, max: 10000, step: 100, mode: 'box', unit_of_measurement: 'ms' } }, 'Update interval', 1000),
          this._sel('power_save_threshold',   { number: { min: 1,   max: 100,   step: 1,   mode: 'slider', unit_of_measurement: '%' } }, 'Visibility threshold', 10),
        ),
      ));

      // ── Advanced options (YAML only) ─────────────────────────────────────────
      root.appendChild(this._section('Advanced options (YAML only)',
        this._info(
          'The following options can only be configured via the code editor (button at the bottom of the page): ' +
          'markers, zones, buttons_layout. ' +
          'They remain fully functional when edited in YAML.'
        ),
      ));

      // Apply hass to all selectors, then restore expanded panels
      if (this._hass) {
        shadow.querySelectorAll('[data-sel]').forEach(el => { el.hass = this._hass; });
      }
      if (openPanels.size) {
        requestAnimationFrame(() => {
          shadow.querySelectorAll('ha-expansion-panel').forEach(p => {
            if (openPanels.has(p.header)) p.expanded = true;
          });
        });
      }
    }
  }

  // ── Main Component ───────────────────────────────────────────────────────────

  class CustomGaugeCard extends HTMLElement {

    static getConfigElement() {
      return document.createElement('custom-gauge-card-editor');
    }

    static getStubConfig() {
      return { entity: 'sensor.example', name: 'My Gauge', min: 0, max: 100, unit: '%' };
    }

    setConfig(config) {
      // Clean up existing state before re-configuring (editor live-updates reuse the element)
      if (this.shadowRoot) {
        if (this.updateTimer)         clearTimeout(this.updateTimer);
        if (this.animationInterval)   clearInterval(this.animationInterval);
        stopCenterShadowPulsation(this);
        if (this.intersectionObserver) { this.intersectionObserver.disconnect(); this.intersectionObserver = null; }
      }

      this.config              = parseConfig(config);
      this.previousState       = null;
      this.updateTimer         = null;
      this.isVisible           = true;
      this.animationInterval   = null;
      this.pulsationInterval   = null;
      this.pulsationSig        = null;
      this.activeAlarms        = [];
      this.buttonsInitialized  = false;
      this.trendInitialized    = false;

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      render(this);

      this._updateGauge        = updateGauge.bind(null, this);
      this._updateLeds         = updateLeds.bind(null, this);
      this._updateCenterShadow = updateCenterShadow.bind(null, this);
      this._updateButtonsState = updateButtonsState.bind(null, this);
      this._createButtons      = createButtons.bind(null, this);
      this._evaluateAlarms     = evaluateAlarms.bind(null, this);

      this.shadowRoot
        .getElementById('gauge-container')
        .addEventListener('click', () => showEntityHistory(this));

      const min = this.config.min || 0;
      const max = this.config.max || 100;
      this._updateLeds(min, this.ledsCount, min, max);

      setupAccessibility(this);
      addMarkersAndZones(this);
      renderScaleTicks(this);
      createDynamicMarkers(this);
      setupVisibilityObserver(this);

      // Re-config from editor: hass is already set but setter won't be called again,
      // so we trigger an immediate update to apply CSS/shadow changes right away.
      if (this._hass) {
        this._createButtons();
        this.buttonsInitialized = true;
        showTrendIndicator(this);
        this.trendInitialized = true;
        updateDynamicMarkers(this, this._hass);
        this._updateGauge();
        this._evaluateAlarms();
      }
    }

    set hass(hass) {
      this._hass = hass;

      // Init buttons once
      if (!this.buttonsInitialized && this.shadowRoot) {
        this._createButtons();
        this.buttonsInitialized = true;
      }

      // v2.0 fix: trend indicator needs _hass — call it here, once
      if (!this.trendInitialized) {
        showTrendIndicator(this);
        this.trendInitialized = true;
      }

      if (this.config.power_save_mode && !this.isVisible) return;

      updateDynamicMarkers(this, hass);

      if (this.config.debounce_updates) {
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this._updateGauge(), this.config.update_interval);
      } else {
        this._updateGauge();
      }

      // Alarms are never debounced: they may watch an entity other than the gauge
      // one, and a delayed alert is a broken alert.
      this._evaluateAlarms();
    }

    getCardSize() { return 4; }

    disconnectedCallback() {
      if (this.updateTimer)       { clearTimeout(this.updateTimer);       this.updateTimer = null; }
      if (this.animationInterval) { clearInterval(this.animationInterval); this.animationInterval = null; }
      stopCenterShadowPulsation(this);
      this.pulsationSig = null;
      if (this.intersectionObserver) { this.intersectionObserver.disconnect(); this.intersectionObserver = null; }
    }
  }

  // ── Registration ─────────────────────────────────────────────────────────────

  customElements.define('custom-gauge-card-editor', CustomGaugeCardEditor);
  customElements.define('custom-gauge-card', CustomGaugeCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type:        'custom-gauge-card',
    name:        'Custom Gauge Card',
    description: 'LED gauge with arc_sweep/arc_start, bidirectional, scale ticks, up to 4 MDI buttons, shadows.'
  });

  console.info(
    `%c custom-gauge-card %c v${CARD_VERSION} `,
    'color:#fff;background:#4caf50;padding:2px 5px;border-radius:3px 0 0 3px;font-weight:bold',
    'color:#4caf50;background:#1a1a1a;padding:2px 5px;border-radius:0 3px 3px 0;font-weight:bold'
  );

}();
