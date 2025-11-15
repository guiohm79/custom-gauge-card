/**
 * Custom Gauge Card - Entry Point
 */

import { CustomGaugeCard } from './CustomGaugeCard.js';
import { CARD_VERSION } from './config.js';

// Display version info
console.info(
  `%c CUSTOM-GAUGE-CARD \n%c Version ${CARD_VERSION} `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

// Register custom element
customElements.define("custom-gauge-card", CustomGaugeCard);
