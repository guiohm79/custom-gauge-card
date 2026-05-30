/**
 * Custom Gauge Card v2.0.0
 * Home Assistant custom card — LED gauge with arc control, bidirectional mode,
 * scale ticks, 4 buttons and full shadow support.
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

  const CARD_VERSION = '2.1.0';

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
.trend-indicator{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);padding:4px 8px;border-radius:12px;display:flex;align-items:center;gap:5px;font-size:12px;color:white;z-index:5}
.trend-arrow{font-size:14px;font-weight:bold}
.marker{position:absolute;width:4px;height:12px;background:#fff;border-radius:2px;z-index:2;box-shadow:0 0 5px rgba(0,0,0,.5)}
.marker-label{position:absolute;font-size:10px;color:#fff;z-index:2;text-shadow:0 0 3px rgba(0,0,0,.7)}
.dynamic-marker-container{position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:3}
.dynamic-marker{position:relative;border:2px solid rgba(255,255,255,.8);box-shadow:0 0 8px rgba(0,0,0,.6),0 0 12px currentColor;transition:background .3s ease-in-out,box-shadow .3s ease-in-out;z-index:3}
.dynamic-marker-label{position:absolute;left:15px;font-size:11px;font-weight:600;color:#fff;background:rgba(0,0,0,.7);padding:2px 6px;border-radius:4px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.8);box-shadow:0 2px 4px rgba(0,0,0,.3);z-index:4}
.dynamic-marker-value{position:absolute;left:15px;top:18px;font-size:10px;font-weight:500;color:#fff;background:rgba(0,0,0,.7);padding:1px 5px;border-radius:3px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.8);box-shadow:0 2px 4px rgba(0,0,0,.3);z-index:4}
.switch-button{position:absolute;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;transition:all .3s ease;box-shadow:var(--button-shadow);font-size:var(--icon-size,var(--button-icon-size));font-family:system-ui,-apple-system,"Segoe UI","Segoe UI Emoji","Apple Color Emoji",sans-serif;line-height:1;font-weight:normal;border:2px solid rgba(255,255,255,.2)}
.switch-button:hover{transform:scale(1.1);box-shadow:var(--button-hover-shadow)}
.switch-button:active{transform:scale(.95)}
.switch-button.on{background:linear-gradient(135deg,#4caf50,#2e7d32);color:#fff;opacity:1;text-shadow:0 0 10px rgba(76,175,80,1),0 0 20px rgba(76,175,80,.6);filter:brightness(1.2)}
.switch-button.off{background:linear-gradient(135deg,#666,#333);color:#333;opacity:.4;text-shadow:none;filter:grayscale(.5)}
.switch-button.top-left{top:30px;left:30px}
.switch-button.top-right{top:30px;right:30px}
.switch-button.bottom-left{bottom:40px;left:30px}
.switch-button.bottom-right{bottom:40px;right:30px}
`;

  // ── Utilities ────────────────────────────────────────────────────────────────

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getEntityType(id) {
    return id ? id.split('.')[0] : null;
  }

  function getDefaultIcon(type) {
    const map = { switch:'●', light:'💡', scene:'🎬', script:'▶', input_boolean:'●', automation:'🤖', fan:'🌀', cover:'🪟', climate:'🌡️', lock:'🔒', vacuum:'🤖' };
    return map[type] || '●';
  }

  function getLedColor(value, severity, min = 0, max = 100) {
    const cfg = severity || [{ color:'#4caf50', value:20 }, { color:'#ffeb3b', value:50 }, { color:'#f44336', value:100 }];
    for (const zone of cfg) {
      const threshold = ((zone.value - min) / (max - min)) * 100;
      if (value <= threshold) return zone.color;
    }
    return '#555';
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
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

  // ── Config ───────────────────────────────────────────────────────────────────

  function parseConfig(config) {
    if (!config.entity) throw new Error('Custom Gauge Card: entity is required.');

    const c = {
      ...config,
      update_interval:              config.update_interval || 1000,
      power_save_mode:              config.power_save_mode || false,
      power_save_threshold:         config.power_save_threshold || 10,
      debounce_updates:             config.debounce_updates || false,
      smooth_transitions:           config.smooth_transitions !== false,
      animation_duration:           config.animation_duration || 800,
      buttons:                      config.buttons || [],
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
        if (ctx.isVisible && ctx._hass && ctx._updateGauge) ctx._updateGauge();
      });
    }, { root: null, rootMargin: '0px', threshold: ctx.config.power_save_threshold / 100 });
    ctx.intersectionObserver.observe(ctx);
  }

  function startCenterShadowPulsation(ctx, value, min, max) {
    if (!ctx.config.center_shadow_pulse) return;
    const inZone = value >= ctx.config.center_shadow_pulse_min && value <= ctx.config.center_shadow_pulse_max;
    if (inZone && !ctx.pulsationInterval) {
      const dur        = ctx.config.center_shadow_pulse_duration || 1000;
      const intensity  = ctx.config.center_shadow_pulse_intensity;
      const baseBlur   = ctx.config.center_shadow_blur   || 30;
      const baseSpread = ctx.config.center_shadow_spread || 15;
      const t0         = Date.now();
      ctx.pulsationInterval = setInterval(() => {
        const wave = Math.sin(((Date.now() - t0) % dur) / dur * Math.PI * 2) * 0.5 + 0.5;
        const mult = intensity + (1 - intensity) * wave;
        const cs   = ctx.shadowRoot?.getElementById('center-shadow');
        if (cs && ctx.currentShadowColor) {
          const c = hexToRgba(ctx.currentShadowColor, mult);
          cs.style.boxShadow = `0 0 ${(baseBlur * mult).toFixed(1)}px ${(baseSpread * mult).toFixed(1)}px ${c}`;
        }
      }, 16);
    } else if (!inZone && ctx.pulsationInterval) {
      clearInterval(ctx.pulsationInterval);
      ctx.pulsationInterval = null;
      if (ctx._updateCenterShadow) ctx._updateCenterShadow(((value - min) / (max - min)) * 100, value, min, max);
    }
  }

  function stopCenterShadowPulsation(ctx) {
    if (ctx.pulsationInterval) { clearInterval(ctx.pulsationInterval); ctx.pulsationInterval = null; }
  }

  // ── Controls ─────────────────────────────────────────────────────────────────

  function createButtons(ctx) {
    if (!ctx._hass || !ctx.config.buttons?.length) return;
    const container = ctx.shadowRoot.getElementById('gauge-container');
    if (!container) return;
    ctx.config.buttons.forEach((btn, idx) => {
      if (!btn.entity || ctx.shadowRoot.getElementById(`button-${idx}`)) return;
      const s = ctx._hass.states[btn.entity];
      if (!s) { console.warn(`custom-gauge-card: entity ${btn.entity} not found`); return; }
      const b = document.createElement('div');
      b.id        = `button-${idx}`;
      b.className = `switch-button ${btn.position || 'bottom-right'}`;
      b.innerHTML = btn.icon || getDefaultIcon(getEntityType(btn.entity));
      if (btn.icon_size) b.style.setProperty('--icon-size', `${btn.icon_size}px`);
      b.addEventListener('click', e => { e.stopPropagation(); handleButtonClick(ctx, btn.entity); });
      container.appendChild(b);
    });
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
      const val = Math.max(min, Math.min(max, parseFloat(entity.state)));
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
    const csBlur   = config.center_shadow_blur   || 30;
    const csSpread = config.center_shadow_spread  || 15;
    const csColor  = (Array.isArray(config.severity) && config.severity[0]?.color) || '#4caf50';
    const csPreview = (config.center_shadow || config.center_shadow_pulse)
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
    const state = parseFloat(entityState.state || '0');
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
    if (!ctx.config.center_shadow && !ctx.config.center_shadow_pulse) {
      stopCenterShadowPulsation(ctx);
      if (cs) cs.style.boxShadow = 'none';
      return;
    }
    const color  = getLedColor(value, ctx.config.severity, min, max);
    const blur   = ctx.config.center_shadow_blur   || 30;
    const spread = ctx.config.center_shadow_spread || 15;
    ctx.currentShadowColor = color;
    if (cs && !ctx.pulsationInterval) cs.style.boxShadow = `0 0 ${blur}px ${spread}px ${color}`;
    if (ctx.config.center_shadow_pulse && realValue !== undefined) {
      startCenterShadowPulsation(ctx, realValue, min, max);
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
      const STRUCTURAL = ['theme', 'center_shadow', 'center_shadow_pulse'];
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
        .sev-del { width: 32px; height: 32px; border-radius: 50%; border: none;
                   background: var(--error-color, #f44336); color: white;
                   cursor: pointer; font-size: 14px; line-height: 1; }
        .sev-add { margin-top: 4px; padding: 7px 12px; border: 1px dashed var(--primary-color);
                   border-radius: 6px; background: none; color: var(--primary-color);
                   cursor: pointer; font-size: 13px; width: 100%; }
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
      </style><div class="editor" id="root"></div>`;

      const root = shadow.getElementById('root');

      // ── Essentials ──────────────────────────────────────────────────────────
      root.appendChild(this._section('Essentials',
        this._sel('entity', { entity: {} }, 'Entity *'),
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

      // ── Pulsating alarm ──────────────────────────────────────────────────────
      const alarmChildren = [];
      if (!cfg.center_shadow) {
        alarmChildren.push(this._info('⚠️ Enable "Center shadow" in Visual effects to use the pulsating alarm.'));
      }
      alarmChildren.push(this._sel('center_shadow_pulse', { boolean: {} }, 'Enable pulsating alarm', false));
      if (cfg.center_shadow_pulse) {
        alarmChildren.push(
          this._row(3,
            this._sel('center_shadow_pulse_min', { number: { mode: 'box', step: 'any' } }, 'Min trigger value'),
            this._sel('center_shadow_pulse_max', { number: { mode: 'box', step: 'any' } }, 'Max trigger value'),
            this._sel('center_shadow_pulse_duration', { number: { min: 200, max: 5000, step: 100, mode: 'box', unit_of_measurement: 'ms' } }, 'Cycle duration', 1000),
          ),
          this._sel('center_shadow_pulse_intensity', { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }, 'Minimum intensity (0 = full flash, 1 = no pulse)', 0.5),
        );
      }
      root.appendChild(this._section('Pulsating alarm', ...alarmChildren));

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
          'markers, zones, dynamic_markers, buttons. ' +
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
      this.buttonsInitialized  = false;
      this.trendInitialized    = false;

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      render(this);

      this._updateGauge        = updateGauge.bind(null, this);
      this._updateLeds         = updateLeds.bind(null, this);
      this._updateCenterShadow = updateCenterShadow.bind(null, this);
      this._updateButtonsState = updateButtonsState.bind(null, this);
      this._createButtons      = createButtons.bind(null, this);

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
    }

    getCardSize() { return 4; }

    disconnectedCallback() {
      if (this.updateTimer)       { clearTimeout(this.updateTimer);       this.updateTimer = null; }
      if (this.animationInterval) { clearInterval(this.animationInterval); this.animationInterval = null; }
      stopCenterShadowPulsation(this);
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
    description: 'LED gauge with arc_sweep/arc_start, bidirectional, scale ticks, up to 4 buttons, shadows.'
  });

  console.info(
    `%c custom-gauge-card %c v${CARD_VERSION} `,
    'color:#fff;background:#4caf50;padding:2px 5px;border-radius:3px 0 0 3px;font-weight:bold',
    'color:#4caf50;background:#1a1a1a;padding:2px 5px;border-radius:0 3px 3px 0;font-weight:bold'
  );

}();
