class CustomGaugeCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Entité non définie.");
    }

    // Configuration par défaut avec options de performance
    this.config = {
      ...config,
      update_interval: config.update_interval || 1000, // Intervalle de mise à jour en ms
      power_save_mode: config.power_save_mode || false, // Mode économie d'énergie
      power_save_threshold: config.power_save_threshold || 10, // Seuil de visibilité pour mode économie
      debounce_updates: config.debounce_updates || false, // Limiter les mises à jour rapides
      smooth_transitions: config.smooth_transitions !== false, // Activé par défaut
      animation_duration: config.animation_duration || 800 // Durée des animations
    };
    
    this.previousState = null; // Stocker l'état précédent
    this.updateTimer = null;
    this.isVisible = true; // Par défaut, la carte est visible
    this.isControlling = false; // Suivi du contrôle interactif
    this.animationInterval = null; // Pour suivre l'animation en cours
    
    this.attachShadow({ mode: "open" });
    this.render();
    
    // Ajouter un observateur d'intersection pour détecter la visibilité
    this._setupVisibilityObserver();
  }

  // Configurer l'observateur d'intersection
  _setupVisibilityObserver() {
    if (!this.config.power_save_mode) return;
    
    // Créer un observateur d'intersection pour détecter quand la carte est visible
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: this.config.power_save_threshold / 100
    };
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        
        // Mettre à jour immédiatement si la carte devient visible
        if (this.isVisible && this._hass) {
          this._updateGauge();
        }
      });
    }, options);
    
    // Observer la carte elle-même
    this.intersectionObserver.observe(this);
  }

  set hass(hass) {
    this._hass = hass;
    
    // Si le mode économie d'énergie est actif et que la carte n'est pas visible, ne pas mettre à jour
    if (this.config.power_save_mode && !this.isVisible) return;
    
    // Si on utilise le mode debounce, on évite les mises à jour trop fréquentes
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

  // Extraire la logique de mise à jour dans une méthode séparée
  _updateGauge() {
    const entityState = this._hass.states[this.config.entity];
    if (!entityState) return;
    
    const state = parseFloat(entityState?.state || "0");
    const previousState = this.previousState !== null ? this.previousState : state;
    
    // Lire le min et le max de la configuration YAML
    const min = this.config.min || 0;
    const max = this.config.max || 100;

    // Si les transitions fluides sont activées et qu'il y a un changement de valeur
    if (this.config.smooth_transitions && previousState !== state) {
      this._animateValueChange(previousState, state, min, max);
    } else {
      // Mise à jour directe sans animation
      const normalizedValue = ((state - min) / (max - min)) * 100;
      const ledsCount = this.config.leds_count || 100;
      
      this._updateLeds(normalizedValue, ledsCount);
      this._updateCenterShadow(normalizedValue);
      
      const valueDisplay = this.shadowRoot.querySelector(".value");
      const unitDisplay = this.shadowRoot.querySelector(".unit");
      if (valueDisplay) valueDisplay.textContent = state.toFixed(this.config.decimals || 0);
      if (unitDisplay) unitDisplay.textContent = this.config.unit || "";
    }
    
    // Stocker l'état actuel pour la prochaine mise à jour
    this.previousState = state;
  }

  // Animation pour les changements de valeur
  _animateValueChange(fromValue, toValue, min, max) {
    const ledsCount = this.config.leds_count || 100;
    const duration = this.config.animation_duration || 800; // 800ms par défaut
    const steps = 20; // Nombre d'étapes pour l'animation
    const stepDuration = duration / steps;
    
    const valueRange = toValue - fromValue;
    
    // Annuler toute animation en cours
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    let step = 0;
    
    this.animationInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      // Fonction d'easing pour une animation plus naturelle
      const easedProgress = this._easeInOutCubic(progress);
      const currentValue = fromValue + valueRange * easedProgress;
      
      // Calculer le pourcentage normalisé
      const normalizedValue = ((currentValue - min) / (max - min)) * 100;
      
      // Mettre à jour les LEDs et l'ombre extérieure
      this._updateLeds(normalizedValue, ledsCount);
      
      // Mettre à jour l'ombre au centre
      this._updateCenterShadow(normalizedValue);
      
      // Mettre à jour la valeur affichée
      const valueDisplay = this.shadowRoot.querySelector(".value");
      if (valueDisplay) {
        valueDisplay.textContent = currentValue.toFixed(this.config.decimals || 0);
      }
      
      if (step >= steps) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }, stepDuration);
  }

  // Fonction d'easing pour des animations plus naturelles
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Optimiser le rendu des LEDs pour les appareils à faible puissance
  _optimizeLEDs() {
    if (this.config.optimize_leds) {
      // Réduire le nombre de LEDs pour les appareils mobiles ou à faible puissance
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      
      if (isMobile) {
        // Réduire le nombre de LEDs sur mobile
        return Math.min(this.config.leds_count || 100, 60); // Limiter à 60 LEDs max sur mobile
      }
    }
    
    return this.config.leds_count || 100;
  }

  render() {
    const ledsCount = this._optimizeLEDs();
    const cardTheme = this.config.theme || 'default';
    
    // Définition des thèmes
    const themes = {
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
      },
      custom: {
        background: this.config.custom_background || '#222',
        gaugeBackground: this.config.custom_gauge_background || 'radial-gradient(circle, #444, #222)',
        centerBackground: this.config.custom_center_background || 'radial-gradient(circle, #333, #111)',
        textColor: this.config.custom_text_color || 'white',
        secondaryTextColor: this.config.custom_secondary_text_color || '#ddd'
      }
    };
    
    // Utiliser le thème sélectionné
    const currentTheme = themes[cardTheme] || themes.default;
    
    const ledSize = this.config.led_size || 8; // Taille des LEDs configurable
    const centerSize = this.config.center_size || 120; // Taille du centre configurable
    const gaugeSize = this.config.gauge_size || 200; // Taille de la jauge configurable
    
    const gaugeHTML = `
      <style>
        .gauge-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--ha-card-header-font-family, Arial), sans-serif;
          background: ${currentTheme.background};
          border-radius: 15px;
          padding: 16px;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: box-shadow 0.3s ease-in-out;
        }
        .gauge {
          position: relative;
          width: ${gaugeSize}px;
          height: ${gaugeSize}px;
          border-radius: 50%;
          background: ${currentTheme.gaugeBackground};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .center-shadow {
          position: absolute;
          width: ${centerSize}px;
          height: ${centerSize}px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0));
          box-shadow: none;
          transition: box-shadow 0.3s ease-in-out;
        }
        .led {
          position: absolute;
          width: ${ledSize}px;
          height: ${ledSize}px;
          background: #333;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .led.active {
          box-shadow: 0 0 8px currentColor, inset 0 0 3px currentColor;
        }
        .center {
          position: absolute;
          width: ${centerSize}px;
          height: ${centerSize}px;
          background: ${currentTheme.centerBackground};
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${currentTheme.textColor};
          text-align: center;
          font-weight: bold;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .value {
          font-size: 32px;
          transition: all 0.3s ease;
        }
        .unit {
          font-size: 16px;
          color: ${currentTheme.secondaryTextColor};
        }
        .title {
          margin-top: 10px;
          font-size: 16px;
          color: ${currentTheme.textColor};
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        .trend-indicator {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: white;
          z-index: 5;
        }
        .trend-arrow {
          font-size: 14px;
          font-weight: bold;
        }
        .marker {
          position: absolute;
          width: 4px;
          height: 12px;
          background: #fff;
          border-radius: 2px;
          z-index: 2;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
        .marker-label {
          position: absolute;
          font-size: 10px;
          color: #fff;
          z-index: 2;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
        }
        .control-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          z-index: 10;
          cursor: pointer;
          background: transparent;
        }
      </style>
      <div class="gauge-card" id="gauge-container">
        <div class="gauge">
          <div class="center-shadow" id="center-shadow"></div>
          ${Array.from({ length: ledsCount })
            .map(
              (_, i) =>
                `<div class="led" id="led-${i}" style="transform: rotate(${(i / ledsCount) * 360}deg) translate(${gaugeSize / 2 - ledSize}px);"></div>`
            )
            .join("")}
          <div class="center">
            <div class="value">0</div>
            <div class="unit"></div>
          </div>
        </div>
        <div class="title">${this.config.name || ""}</div>
      </div>
    `;

    this.shadowRoot.innerHTML = gaugeHTML;

    // Ajouter l'écouteur de clic pour afficher l'historique
    this.shadowRoot
      .getElementById("gauge-container")
      .addEventListener("click", () => this._showEntityHistory());

    // Initialiser toutes les LEDs à l'état inactif
    this._updateLeds(0, ledsCount);
    
    // Ajouter les fonctionnalités avancées
    this._handleEntityControl();
    this._setupAccessibility();
    this._showTrendIndicator();
    this._addMarkersAndZones();
  }

  _updateLeds(value, ledsCount) {
    const activeLeds = Math.round((value / 100) * ledsCount);
    const color = this._getLedColor(value);

    if (this.config.enable_shadow) {
      const gaugeContainer = this.shadowRoot.getElementById("gauge-container");
      gaugeContainer.style.boxShadow = `0 0 30px 2px ${color}`;
    }

    for (let i = 0; i < ledsCount; i++) {
      const led = this.shadowRoot.getElementById(`led-${i}`);
      if (!led) continue; // Ignorer si LED introuvable
      
      if (i < activeLeds) {
        led.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.8), ${color})`;
        led.style.boxShadow = `0 0 8px ${color}`;
        led.classList.add("active");
      } else {
        led.style.background = "#333";
        led.style.boxShadow = "none";
        led.classList.remove("active");
      }
    }
  }

  _updateCenterShadow(value) {
    if (!this.config.center_shadow) return;
  
    const color = this._getLedColor(value);
    const blur = this.config.center_shadow_blur || 30; // Valeur par défaut : 30px
    const spread = this.config.center_shadow_spread || 15; // Valeur par défaut : 15px
    const centerShadow = this.shadowRoot.getElementById("center-shadow");
    
    if (centerShadow) {
      centerShadow.style.boxShadow = `0 0 ${blur}px ${spread}px ${color}`;
    }
  }

  _getLedColor(value) {
    const severity = this.config.severity || [
      { color: "#4caf50", value: 20 },
      { color: "#ffeb3b", value: 50 },
      { color: "#f44336", value: 100 },
    ];

    for (const zone of severity) {
      if (value <= zone.value) {
        return zone.color;
      }
    }

    return "#555";
  }

  _showEntityHistory() {
    if (!this.config.entity || !this._hass) return;

    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: this.config.entity };
    this.dispatchEvent(event);
  }
  
  // Ajouter cette méthode pour le contrôle des entités
  _handleEntityControl() {
    if (!this._hass || !this.config.entity) return;
    
    // Vérifier si l'entité est contrôlable
    const entityId = this.config.entity;
    const stateObj = this._hass.states[entityId];
    
    if (!stateObj) return;
    
    // Si l'entité est un input_number ou similaire
    if (this.config.enable_control && 
       (entityId.startsWith('input_number.') || 
        entityId.startsWith('number.') ||
        this.config.controlable_entity)) {
        
      // Ajouter un overlay pour le contrôle
      const gauge = this.shadowRoot.querySelector('.gauge');
      
      // Créer un élément de contrôle circulaire
      const controlOverlay = document.createElement('div');
      controlOverlay.className = 'control-overlay';
      
      gauge.appendChild(controlOverlay);
      
      // Ajouter des gestionnaires d'événements pour le contrôle
      controlOverlay.addEventListener('mousedown', this._startControl.bind(this));
      controlOverlay.addEventListener('touchstart', this._startControl.bind(this), { passive: false });
      document.addEventListener('mouseup', this._endControl.bind(this));
      document.addEventListener('touchend', this._endControl.bind(this));
      document.addEventListener('mousemove', this._moveControl.bind(this));
      document.addEventListener('touchmove', this._moveControl.bind(this), { passive: false });
    }
  }

  _startControl(e) {
    e.preventDefault();
    this.isControlling = true;
    this.baseX = e.clientX || (e.touches && e.touches[0].clientX);
    this.baseY = e.clientY || (e.touches && e.touches[0].clientY);
  }

  _endControl() {
    this.isControlling = false;
  }

  _moveControl(e) {
    if (!this.isControlling) return;
    
    e.preventDefault();
    
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!x || !y) return;
    
    const gauge = this.shadowRoot.querySelector('.gauge');
    const rect = gauge.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculer l'angle à partir du centre
    const angleRad = Math.atan2(y - centerY, x - centerX);
    let angleDeg = (angleRad * 180 / Math.PI) + 90; // +90 pour commencer à midi
    if (angleDeg < 0) angleDeg += 360;
    
    // Convertir l'angle en pourcentage (0-100)
    const percentage = angleDeg / 360 * 100;
    
    // Convertir le pourcentage en valeur selon min et max
    const min = this.config.min || 0;
    const max = this.config.max || 100;
    let value = min + (percentage / 100) * (max - min);
    
    // Arrondir selon le nombre de décimales configuré
    const decimals = this.config.decimals || 0;
    value = parseFloat(value.toFixed(decimals));
    
    // Appeler le service pour mettre à jour l'entité
    const entityToControl = this.config.controlable_entity || this.config.entity;
    
    // Déterminer le domaine du service
    let domain = entityToControl.split('.')[0];
    let service = 'set_value';
    
    if (domain === 'number') {
      service = 'set_value';
    } else if (domain === 'input_number') {
      service = 'set_value';
    }
    
    this._hass.callService(domain, service, {
      entity_id: entityToControl,
      value: value
    });
  }

  // Ajouter une méthode pour l'accessibilité
  _setupAccessibility() {
    const gaugeContainer = this.shadowRoot.querySelector('.gauge-card');
    const entityId = this.config.entity;
    const name = this.config.name || entityId;
    
    // Ajouter des attributs ARIA pour l'accessibilité
    gaugeContainer.setAttribute('role', 'slider');
    gaugeContainer.setAttribute('aria-valuemin', this.config.min || 0);
    gaugeContainer.setAttribute('aria-valuemax', this.config.max || 100);
    gaugeContainer.setAttribute('aria-label', `${name} gauge`);
    
    // Mettre à jour les attributs ARIA lorsque la valeur change
    const updateAriaValue = (value) => {
      gaugeContainer.setAttribute('aria-valuenow', value);
      gaugeContainer.setAttribute('aria-valuetext', 
        `${value}${this.config.unit ? ' ' + this.config.unit : ''}`);
    };
    
    // Observer les changements de valeur
    const valueDisplay = this.shadowRoot.querySelector('.value');
    if (valueDisplay) {
      const observer = new MutationObserver(() => {
        updateAriaValue(parseFloat(valueDisplay.textContent));
      });
      
      observer.observe(valueDisplay, { childList: true });
      
      // Initialiser avec la valeur actuelle
      updateAriaValue(parseFloat(valueDisplay.textContent || '0'));
    }
  }
  
  // Ajouter cette méthode pour afficher un graphique de tendance miniature
  async _showTrendIndicator() {
    if (!this.config.show_trend || !this._hass || !this.config.entity) return;
    
    const entityId = this.config.entity;
    const now = new Date();
    const startTime = new Date();
    
    // Par défaut, montrer la tendance sur les dernières 24 heures
    startTime.setHours(now.getHours() - 24);
    
    try {
      // Obtenir l'historique de l'entité
      const history = await this._hass.callWS({
        type: 'history/history_during_period',
        entity_ids: [entityId],
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        minimal_response: true
      });
      
      if (!history || !history[0] || history[0].length === 0) return;
      
      const states = history[0];
      
      // Calculer la tendance
      const currentValue = parseFloat(states[states.length - 1].state);
      const previousValue = parseFloat(states[0].state);
      const difference = currentValue - previousValue;
      const percentChange = previousValue !== 0 ? (difference / previousValue) * 100 : 0;
      
      // Créer l'indicateur de tendance
      const trendContainer = document.createElement('div');
      trendContainer.className = 'trend-indicator';
      
      const trendArrow = document.createElement('span');
      trendArrow.className = 'trend-arrow';
      
      const trendValue = document.createElement('span');
      trendValue.className = 'trend-value';
      
      if (difference > 0) {
        trendArrow.textContent = '↑';
        trendArrow.style.color = '#4caf50'; // Vert pour augmentation
      } else if (difference < 0) {
        trendArrow.textContent = '↓';
        trendArrow.style.color = '#f44336'; // Rouge pour diminution
      } else {
        trendArrow.textContent = '→';
        trendArrow.style.color = '#ffeb3b'; // Jaune pour stable
      }
      
      trendValue.textContent = `${Math.abs(percentChange).toFixed(1)}%`;
      
      trendContainer.appendChild(trendArrow);
      trendContainer.appendChild(trendValue);
      
      // Ajouter l'indicateur de tendance à la carte
      this.shadowRoot.querySelector('.gauge-card').appendChild(trendContainer);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
    }
  }

  // Ajouter une méthode pour afficher des marqueurs et zones
  _addMarkersAndZones() {
    if (!this.config.markers && !this.config.zones) return;
    
    const gauge = this.shadowRoot.querySelector('.gauge');
    if (!gauge) return;
    
    const min = this.config.min || 0;
    const max = this.config.max || 100;
    const range = max - min;
    const gaugeSize = this.config.gauge_size || 200;
    
    // Ajouter des marqueurs (comme des repères spécifiques)
    if (this.config.markers) {
      this.config.markers.forEach(marker => {
        const percentage = ((marker.value - min) / range) * 100;
        const angle = (percentage / 100) * 360;
        
        const markerElement = document.createElement('div');
        markerElement.className = 'marker';
        markerElement.style.cssText = `
          position: absolute;
          width: 4px;
          height: 12px;
          background: ${marker.color || '#fff'};
          border-radius: 2px;
          transform: rotate(${angle}deg) translateY(-${gaugeSize / 2 - 5}px);
          transform-origin: center center;
          z-index: 2;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        `;
        
        // Ajouter une étiquette si spécifiée
        if (marker.label) {
          const labelElement = document.createElement('div');
          labelElement.className = 'marker-label';
          labelElement.textContent = marker.label;
          labelElement.style.cssText = `
            position: absolute;
            font-size: 10px;
            color: ${marker.color || '#fff'};
            transform: rotate(${angle}deg) translateY(-${gaugeSize / 2 + 15}px);
            transform-origin: center center;
            z-index: 2;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
          `;
          gauge.appendChild(labelElement);
        }
        
        gauge.appendChild(markerElement);
      });
    }
    
    // Ajouter des zones (comme des plages colorées sur le cercle)
    if (this.config.zones) {
      this.config.zones.forEach(zone => {
        const startPercentage = ((zone.from - min) / range) * 100;
        const endPercentage = ((zone.to - min) / range) * 100;
        const startAngle = (startPercentage / 100) * 360;
        const endAngle = (endPercentage / 100) * 360;
        const arcAngle = endAngle - startAngle;
        
        // Créer un élément SVG pour l'arc
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
        
        // Calculer les coordonnées pour l'arc
        const radius = gaugeSize / 2 + 5;
        const centerPoint = (gaugeSize + 20) / 2;
        const startX = centerPoint + radius * Math.cos((startAngle - 90) * Math.PI / 180);
        const startY = centerPoint + radius * Math.sin((startAngle - 90) * Math.PI / 180);
        const endX = centerPoint + radius * Math.cos((endAngle - 90) * Math.PI / 180);
        const endY = centerPoint + radius * Math.sin((endAngle - 90) * Math.PI / 180);
        
        const largeArcFlag = arcAngle > 180 ? 1 : 0;
        
        // Définir le chemin d'arc
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
}

customElements.define("custom-gauge-card", CustomGaugeCard);