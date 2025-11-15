/**
 * Interactive controls (buttons) management
 */

import { getEntityType, getDefaultIcon } from './utils.js';

/**
 * Create all configured buttons
 * @param {Object} context - The card instance context
 */
export function createButtons(context) {
  if (!context._hass || !context.config.buttons || context.config.buttons.length === 0) return;

  const gaugeContainer = context.shadowRoot.getElementById('gauge-container');
  if (!gaugeContainer) return;

  context.config.buttons.forEach((buttonConfig, index) => {
    const entityId = buttonConfig.entity;
    if (!entityId) return;

    const stateObj = context._hass.states[entityId];
    if (!stateObj) {
      console.warn(`Entity ${entityId} not found`);
      return;
    }

    const buttonId = `button-${index}`;
    let button = context.shadowRoot.getElementById(buttonId);

    if (!button) {
      const entityTypeStr = getEntityType(entityId);
      const icon = buttonConfig.icon || getDefaultIcon(entityTypeStr);
      const position = buttonConfig.position || 'bottom-right';
      const iconSize = buttonConfig.icon_size || context.config.button_icon_size;

      button = document.createElement('div');
      button.id = buttonId;
      button.className = `switch-button ${position}`;
      button.innerHTML = icon;
      button.dataset.entity = entityId;
      button.dataset.index = index;

      if (buttonConfig.icon_size) {
        button.style.setProperty('--icon-size', `${iconSize}px`);
      }

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        handleButtonClick(context, entityId);
      });

      gaugeContainer.appendChild(button);
    }
  });

  updateButtonsState(context);
}

/**
 * Update visual state of all buttons
 * @param {Object} context - The card instance context
 */
export function updateButtonsState(context) {
  if (!context._hass || !context.config.buttons || context.config.buttons.length === 0) return;

  context.config.buttons.forEach((buttonConfig, index) => {
    const entityId = buttonConfig.entity;
    const button = context.shadowRoot.getElementById(`button-${index}`);

    if (!button || !entityId) return;

    const stateObj = context._hass.states[entityId];
    if (!stateObj) return;

    const state = stateObj.state;
    const isOn = ['on', 'open', 'unlocked', 'home', 'active'].includes(state);

    button.classList.remove('on', 'off');
    button.classList.add(isOn ? 'on' : 'off');

    const friendlyName = stateObj.attributes.friendly_name || entityId;
    button.title = `${friendlyName}: ${state.toUpperCase()}`;
  });
}

/**
 * Handle button click (multi-type support)
 * @param {Object} context - The card instance context
 * @param {string} entityId - The entity ID to control
 */
export function handleButtonClick(context, entityId) {
  if (!entityId || !context._hass) return;

  const stateObj = context._hass.states[entityId];
  if (!stateObj) return;

  const entityTypeStr = getEntityType(entityId);
  const currentState = stateObj.state;

  let domain, service, serviceData;

  switch (entityTypeStr) {
    case 'switch':
    case 'light':
    case 'input_boolean':
    case 'fan':
      domain = entityTypeStr;
      service = 'toggle';
      serviceData = { entity_id: entityId };
      break;

    case 'automation':
      domain = 'automation';
      service = 'toggle';
      serviceData = { entity_id: entityId };
      break;

    case 'scene':
      domain = 'scene';
      service = 'turn_on';
      serviceData = { entity_id: entityId };
      break;

    case 'script':
      domain = 'script';
      service = 'turn_on';
      serviceData = { entity_id: entityId };
      break;

    case 'cover':
      domain = 'cover';
      service = currentState === 'open' ? 'close_cover' : 'open_cover';
      serviceData = { entity_id: entityId };
      break;

    case 'lock':
      domain = 'lock';
      service = currentState === 'locked' ? 'unlock' : 'lock';
      serviceData = { entity_id: entityId };
      break;

    case 'vacuum':
      domain = 'vacuum';
      service = currentState === 'cleaning' ? 'stop' : 'start';
      serviceData = { entity_id: entityId };
      break;

    case 'climate':
      domain = 'climate';
      service = currentState === 'off' ? 'turn_on' : 'turn_off';
      serviceData = { entity_id: entityId };
      break;

    default:
      console.warn(`Entity type ${entityTypeStr} not supported for button control`);
      return;
  }

  context._hass.callService(domain, service, serviceData)
    .then(() => {
      setTimeout(() => updateButtonsState(context), 100);
    })
    .catch(error => {
      console.error(`Error calling ${domain}.${service}:`, error);
    });
}
