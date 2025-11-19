/**
 * Rendering logic for the gauge card
 */

import stylesCSS from './styles.css';
import { getTheme } from './config.js';
import { optimizeLEDs, valueToAngle } from './utils.js';

/**
 * Generate CSS variables from theme and config
 * @param {Object} theme - Theme configuration
 * @param {Object} config - Card configuration
 * @returns {string} CSS variable declarations
 */
function generateCSSVariables(theme, config) {
  const ledSize = config.led_size || 8;
  const centerSize = config.center_size || 120;
  const gaugeSize = config.gauge_size || 200;
  const hideShadows = config.hide_shadows;

  return `
    --card-background: ${theme.background};
    --gauge-background: ${theme.gaugeBackground};
    --center-background: ${theme.centerBackground};
    --text-color: ${theme.textColor};
    --secondary-text-color: ${theme.secondaryTextColor};
    --gauge-size: ${gaugeSize}px;
    --center-size: ${centerSize}px;
    --led-size: ${ledSize}px;
    --card-shadow: ${hideShadows ? 'none' : '0 0 15px rgba(0, 0, 0, 0.5)'};
    --led-shadow: ${hideShadows ? 'none' : '0 0 4px rgba(0, 0, 0, 0.8)'};
    --button-shadow: ${hideShadows ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)'};
    --button-hover-shadow: ${hideShadows ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.5)'};
    --value-font-size: ${config.value_font_size};
    --value-font-family: ${config.value_font_family};
    --value-font-weight: ${config.value_font_weight};
    --value-font-color: ${config.value_font_color || theme.textColor};
    --unit-font-size: ${config.unit_font_size};
    --unit-font-weight: ${config.unit_font_weight};
    --unit-font-color: ${config.unit_font_color || theme.secondaryTextColor};
    --title-font-size: ${config.title_font_size};
    --title-font-family: ${config.title_font_family};
    --title-font-weight: ${config.title_font_weight};
    --title-font-color: ${config.title_font_color || theme.textColor};
    --button-icon-size: ${config.button_icon_size}px;
  `;
}

/**
 * Render the gauge HTML structure
 * @param {Object} context - The card instance context
 */
export function render(context) {
  context.ledsCount = optimizeLEDs(context.config.leds_count);
  const ledsCount = context.ledsCount;
  const cardTheme = context.config.theme || 'default';
  const theme = getTheme(cardTheme, context.config);

  const gaugeSize = context.config.gauge_size || 200;
  const ledSize = context.config.led_size || 8;

  const cssVariables = generateCSSVariables(theme, context.config);

  const gaugeHTML = `
    <style>
      :host {
        ${cssVariables}
      }
      ${stylesCSS}
    </style>
    <div class="gauge-card" id="gauge-container">
      <div class="gauge">
        <div class="center-shadow" id="center-shadow"></div>
        ${Array.from({ length: ledsCount })
          .map(
            (_, i) =>
              `<div class="led" id="led-${i}" style="transform: rotate(${(i / ledsCount) * 360 - 90}deg) translate(${gaugeSize / 2 - ledSize}px);"></div>`
          )
          .join("")}
        <div class="center">
          <div class="value">0</div>
          <div class="unit"></div>
        </div>
      </div>
      <div class="title">${context.config.name || ""}</div>
    </div>
  `;

  context.shadowRoot.innerHTML = gaugeHTML;
}

/**
 * Setup accessibility attributes
 * @param {Object} context - The card instance context
 */
export function setupAccessibility(context) {
  const gaugeContainer = context.shadowRoot.querySelector('.gauge-card');
  const entityId = context.config.entity;
  const name = context.config.name || entityId;

  gaugeContainer.setAttribute('role', 'slider');
  gaugeContainer.setAttribute('aria-valuemin', context.config.min || 0);
  gaugeContainer.setAttribute('aria-valuemax', context.config.max || 100);
  gaugeContainer.setAttribute('aria-label', `${name} gauge`);

  const updateAriaValue = (value) => {
    gaugeContainer.setAttribute('aria-valuenow', value);
    gaugeContainer.setAttribute('aria-valuetext',
      `${value}${context.config.unit ? ' ' + context.config.unit : ''}`);
  };

  const valueDisplay = context.shadowRoot.querySelector('.value');
  if (valueDisplay) {
    const observer = new MutationObserver(() => {
      updateAriaValue(parseFloat(valueDisplay.textContent));
    });

    observer.observe(valueDisplay, { childList: true });
    updateAriaValue(parseFloat(valueDisplay.textContent || '0'));
  }
}

/**
 * Add markers and zones to the gauge
 * @param {Object} context - The card instance context
 */
export function addMarkersAndZones(context) {
  if (!context.config.markers && !context.config.zones) return;

  const gauge = context.shadowRoot.querySelector('.gauge');
  if (!gauge) return;

  const min = context.config.min || 0;
  const max = context.config.max || 100;
  const range = max - min;
  const gaugeSize = context.config.gauge_size || 200;

  // Add markers
  if (context.config.markers) {
    context.config.markers.forEach(marker => {
      const angle = valueToAngle(marker.value, min, max, context.config.bidirectional);

      const markerElement = document.createElement('div');
      markerElement.className = 'marker';
      markerElement.style.cssText = `
        position: absolute;
        width: 4px;
        height: 12px;
        background: ${marker.color || '#fff'};
        border-radius: 2px;
        transform: rotate(${angle - 90}deg) translateX(${gaugeSize / 2 - 5}px);
        transform-origin: center center;
        z-index: 2;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      `;

      if (marker.label) {
        const labelElement = document.createElement('div');
        labelElement.className = 'marker-label';
        labelElement.textContent = marker.label;
        labelElement.style.cssText = `
          position: absolute;
          font-size: 10px;
          color: ${marker.color || '#fff'};
          transform: rotate(${angle - 90}deg) translateX(${gaugeSize / 2 + 15}px) rotate(${90 - angle}deg);
          transform-origin: center center;
          z-index: 2;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
        `;
        gauge.appendChild(labelElement);
      }

      gauge.appendChild(markerElement);
    });
  }

  // Add zones
  if (context.config.zones) {
    context.config.zones.forEach(zone => {
      const startAngle = valueToAngle(zone.from, min, max, context.config.bidirectional);
      const endAngle = valueToAngle(zone.to, min, max, context.config.bidirectional);

      // Calculate arc angle (handle wrapping around 0°/360°)
      let arcAngle = endAngle - startAngle;
      if (arcAngle < 0) {
        arcAngle += 360;
      }

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", `${gaugeSize + 20}`);
      svg.setAttribute("height", `${gaugeSize + 20}`);
      svg.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        z-index: 1;
        pointer-events: none;
      `;

      const circle = document.createElementNS(svgNS, "path");

      const radius = gaugeSize / 2 + 5;
      const centerPoint = (gaugeSize + 20) / 2;
      const startX = centerPoint + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const startY = centerPoint + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const endX = centerPoint + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const endY = centerPoint + radius * Math.sin((endAngle - 90) * Math.PI / 180);

      const largeArcFlag = arcAngle > 180 ? 1 : 0;

      const path = `M ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}`;

      circle.setAttribute("d", path);
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", zone.color || "#fff");
      circle.setAttribute("stroke-width", "4");
      circle.setAttribute("opacity", zone.opacity || "0.5");

      svg.appendChild(circle);
      gauge.appendChild(svg);
    });
  }
}
