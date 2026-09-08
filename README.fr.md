# Custom Gauge Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub Release](https://img.shields.io/github/release/guiohm79/custom-gauge-card.svg)](https://github.com/guiohm79/custom-gauge-card/releases)
[![License](https://img.shields.io/github/license/guiohm79/custom-gauge-card.svg)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/guiohm79)

Une carte personnalisée pour Home Assistant qui affiche vos capteurs sous forme de jauge circulaire LED animée et interactive.

## Captures d'écran

![Exemple 5](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple5.jpeg)
![Exemple 1](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple1.png)
![Exemple 2](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple2.png)
![Exemple 3](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple3.png)
![Exemple 4](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple4.png)

## Fonctionnalités

 **Design Moderne et Animé**
- Jauge circulaire avec LEDs animées
- Transitions fluides et douces entre les valeurs
- Effets d'ombre et de lumière dynamiques
- Alarmes multi-entités avec quatre effets visuels (ombre pulsante, LEDs clignotantes, valeur clignotante, bordure pulsante)
- Thèmes personnalisables (clair, sombre, personnalisé)

 **Zones et Marqueurs**
- Définissez des zones colorées pour visualiser des plages de valeurs
- Ajoutez des marqueurs avec étiquettes pour des repères spécifiques
- Configuration flexible des couleurs et opacités

 **Indicateur de Tendance**
- Affichage de l'évolution sur 24 heures
- Pourcentage de changement avec flèche directionnelle
- Historique automatique depuis Home Assistant

 **Contrôle Multi-Boutons**
- Contrôlez plusieurs entités directement depuis la jauge
- Support des interrupteurs, lumières, scènes, scripts, automatisations et plus
- Jusqu'à 4 boutons MDI dans une barre sous le titre
- Icônes intelligentes et retour visuel d'état

 **Performances Optimisées**
- Mode économie d'énergie (pause quand invisible)
- Débouncing des mises à jour
- Animations optimisées
- Rendu cohérent sur tous les appareils

 **Accessible**
- Attributs ARIA pour lecteurs d'écran
- Navigation au clavier supportée
- Rôle slider pour contrôles interactifs

## Installation

### Via HACS (Recommandé)

1. Ouvrez HACS dans Home Assistant
2. Allez dans "Frontend"
3. Cliquez sur le menu (⋮) en haut à droite
4. Sélectionnez "Dépôts personnalisés"
5. Ajoutez l'URL : `https://github.com/guiohm79/custom-gauge-card`
6. Sélectionnez la catégorie "Lovelace"
7. Cliquez sur "Installer"
8. Redémarrez Home Assistant

### Installation Manuelle

1. Téléchargez le fichier `custom-gauge-card.js`
2. Copiez-le dans `config/www/custom-gauge-card.js`
3. Ajoutez la ressource dans Home Assistant :
   - Allez dans **Paramètres** → **Tableaux de bord** → **Ressources**
   - Cliquez sur **+ Ajouter une ressource**
   - URL : `/local/custom-gauge-card.js`
   - Type : **Module JavaScript**
4. Redémarrez Home Assistant

## Configuration

### Configuration Minimale

```yaml
type: custom:custom-gauge-card
entity: sensor.temperature
name: Température
unit: "°C"
min: 0
max: 40
```

### Configuration Complète

```yaml
type: custom:custom-gauge-card
entity: sensor.niveaux_cuves_capteur_niveau_cuve_1
name: Niveau cuve 1
unit: L
min: 0
max: 3000

# Apparence
gauge_size: 220
center_size: 120
led_size: 7
leds_count: 150
decimals: 0

# Thème
theme: custom  # default, light, dark, custom
custom_background: "#2c2c2c"
custom_gauge_background: "radial-gradient(circle, #444, #222)"
custom_center_background: "radial-gradient(circle, #333, #111)"
custom_text_color: "#ffffff"
custom_secondary_text_color: "#aaaaaa"

# Personnalisation de la police du titre
title_font_family: "Roboto, Arial, sans-serif"
title_font_size: "18px"
title_font_weight: "bold"
# title_font_color: "#00ff00"  # Optionnel: couleur personnalisée pour le titre

# Animations
smooth_transitions: true
animation_duration: 800

# Effets visuels
enable_shadow: true
center_shadow: true
center_shadow_blur: 30
center_shadow_spread: 5

# Alarmes (v2.2) — n'importe quelle entité, n'importe quel effet
alarms:
  - condition: range                  # alarme tant que 0L <= valeur <= 750L
    min: 0
    max: 750
    effect: shadow_pulse
    duration: 1500                    # durée d'un cycle en ms
    intensity: 0.3                    # creux du cycle (30% à 100%)
  - entity: binary_sensor.defaut_pompe  # surveille une tout autre entité
    condition: state
    state: "on"
    effect: border_pulse
    color: "#f44336"

# Tendance
show_trend: true

# Marqueurs
markers:
  - value: 1000
    color: "#ffffff"
    label: 1/3
  - value: 2000
    color: "#ffff00"
    label: 2/3

# Zones colorées
zones:
  - from: 0
    to: 750
    color: "#ff2d00"
    opacity: 0.3
  - from: 750
    to: 1500
    color: "#fb8804"
    opacity: 0.3
  - from: 1500
    to: 3000
    color: "#04fb1d"
    opacity: 0.3

# Couleurs selon sévérité (pour les LEDs)
severity:
  - color: "#ff2d00"
    value: 25
  - color: "#fb8804"
    value: 50
  - color: "#04fb1d"
    value: 100

# Contrôle multi-boutons (optionnel)
button_icon_size: 22  # Taille par défaut de l'icône pour tous les boutons (en pixels)
buttons:
  - entity: switch.pompe_1
    icon: "mdi:water-pump"  # Optionnel, défaut selon le type d'entité
    icon_size: 28  # Optionnel : taille personnalisée pour ce bouton
  - entity: light.led_cuve
  - entity: script.remplir_cuve
    icon: "mdi:play"
    icon_size: 20  # Optionnel : taille personnalisée pour ce bouton

# Optimisations
power_save_mode: true
power_save_threshold: 20
update_interval: 1000
debounce_updates: true
optimize_leds: true
```

## Options de Configuration

### Options de Base

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `entity` | string | **Requis** | Entité à afficher |
| `name` | string | - | Nom affiché sous la jauge |
| `unit` | string | - | Unité de mesure |
| `min` | number | 0 | Valeur minimale |
| `max` | number | 100 | Valeur maximale |
| `decimals` | number | 0 | Nombre de décimales |

### Apparence

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `gauge_size` | number | 200 | Taille de la jauge en pixels |
| `center_size` | number | 120 | Taille du centre en pixels |
| `led_size` | number | 8 | Taille des LEDs en pixels |
| `leds_count` | number | 100 | Nombre de LEDs |

### Thèmes

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `theme` | string | `default` | Thème : `default`, `light`, `dark`, `custom` |
| `custom_background` | string | - | Couleur de fond (thème custom) |
| `custom_gauge_background` | string | - | Fond de la jauge (thème custom) |
| `custom_center_background` | string | - | Fond du centre (thème custom) |
| `custom_text_color` | string | - | Couleur du texte (thème custom) |
| `custom_secondary_text_color` | string | - | Couleur du texte secondaire (thème custom) |

### Personnalisation de la Police du Titre

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `title_font_family` | string | `inherit` | Police de caractères pour le titre (ex: "Roboto, Arial, sans-serif") |
| `title_font_size` | string | `16px` | Taille de la police pour le titre |
| `title_font_weight` | string | `normal` | Épaisseur de la police pour le titre (ex: "normal", "bold", "600") |
| `title_font_color` | string | - | Couleur personnalisée pour le titre (remplace la couleur du thème) |

**Exemples de Polices pour le Titre :**

```yaml
# Style moderne
title_font_family: "Roboto, Helvetica, Arial, sans-serif"
title_font_size: "18px"
title_font_weight: "500"

# Style élégant
title_font_family: "Georgia, 'Times New Roman', serif"
title_font_size: "20px"
title_font_weight: "normal"

# Style technique/monospace
title_font_family: "Consolas, 'Courier New', monospace"
title_font_size: "16px"
title_font_weight: "bold"

# Utiliser la police par défaut de Home Assistant
title_font_family: "inherit"

# Gras avec couleur personnalisée
title_font_family: "Arial, sans-serif"
title_font_size: "22px"
title_font_weight: "bold"
title_font_color: "#00ff00"
```

### Personnalisation de la Police de la Valeur Centrale et de l'Unité

#### Options de la Valeur Centrale

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `value_font_family` | string | `inherit` | Police de caractères pour la valeur centrale (ex: "Roboto, Arial, sans-serif") |
| `value_font_size` | string | `32px` | Taille de la police pour la valeur centrale |
| `value_font_weight` | string/number | `bold` | Épaisseur de la police pour la valeur (ex: "normal", "bold", 300-900) |
| `value_font_color` | string | - | Couleur personnalisée pour la valeur (remplace la couleur du thème) |

#### Options de l'Unité

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `unit_font_size` | string | `16px` | Taille de la police pour le symbole d'unité |
| `unit_font_weight` | string/number | `normal` | Épaisseur de la police pour l'unité (ex: "normal", "bold", 300-900) |
| `unit_font_color` | string | - | Couleur personnalisée pour l'unité (remplace la couleur secondaire du thème) |

**Exemples de Polices pour la Valeur Centrale et l'Unité :**

```yaml
# Grande valeur moderne avec poids léger
value_font_size: "48px"
value_font_weight: 300
value_font_color: "#ffffff"
unit_font_size: "20px"
unit_font_weight: normal

# Valeur grasse avec couleurs personnalisées
value_font_size: "40px"
value_font_weight: 700
value_font_color: "#00ff00"
unit_font_size: "18px"
unit_font_weight: bold
unit_font_color: "#888888"

# Police personnalisée avec style élégant
value_font_family: "Georgia, serif"
value_font_size: "36px"
value_font_weight: 500
unit_font_size: "14px"

# Affichage compact
value_font_size: "28px"
value_font_weight: normal
unit_font_size: "12px"
unit_font_color: "#666666"

# Style technique ultra-gras
value_font_family: "Consolas, monospace"
value_font_size: "38px"
value_font_weight: 900
unit_font_size: "16px"
unit_font_weight: 600
```

### Animations

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `smooth_transitions` | boolean | true | Activer les transitions fluides |
| `animation_duration` | number | 800 | Durée des animations en ms |

### Effets Visuels

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `enable_shadow` | boolean | false | Activer l'ombre extérieure |
| `center_shadow` | boolean | false | Activer l'ombre au centre |
| `center_shadow_blur` | number | 30 | Flou de l'ombre centrale |
| `center_shadow_spread` | number | 15 | Expansion de l'ombre centrale |

### Alarmes (v2.2)

Une alarme surveille une entité et applique un effet visuel tant que sa condition est remplie.
L'entité surveillée **n'est pas forcément celle de la jauge** : c'est ce qui permet, par exemple,
de faire clignoter une jauge de batterie en fonction d'un `sensor.battery_power` séparé, sans
passer par `config-template-card`.

```yaml
alarms:
  - entity: sensor.battery_power   # optionnel — par défaut, l'entité de la jauge
    condition: below
    value: 0
    effect: shadow_pulse
    color: "#f44336"
    duration: 900
    intensity: 0.3
```

Plusieurs alarmes peuvent être actives simultanément, à condition d'utiliser des effets différents.

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `entity` | string | entité de la jauge | Entité surveillée |
| `attribute` | string | – | Lire cet attribut au lieu de l'état |
| `condition` | string | `range` | Voir le tableau des conditions |
| `min` / `max` | number | `min`/`max` de la jauge | Bornes pour `range` et `outside` |
| `value` | number | 0 | Seuil pour `above`, `below`, `equal` |
| `state` | string | `on` | Chaîne comparée pour `state` et `state_not` |
| `effect` | string | `shadow_pulse` | Voir le tableau des effets |
| `color` | string | couleur severity | Couleur de l'alarme — ignorée par `leds_blink` |
| `duration` | number | 1000 | Durée d'un cycle complet en ms (minimum 100) |
| `intensity` | number | 0.5 | Creux du cycle, 0 = flash complet, 1 = pulsation invisible |
| `name` | string | – | Libellé affiché dans l'éditeur visuel uniquement |

**Conditions**

| `condition` | Se déclenche quand |
|-------------|--------------------|
| `range` | la valeur est comprise entre `min` et `max`, bornes incluses — défaut |
| `outside` | la valeur est sous `min` ou au-dessus de `max` |
| `above` | la valeur est strictement supérieure à `value` |
| `below` | la valeur est strictement inférieure à `value` |
| `equal` | la valeur est égale à `value` |
| `state` | l'état est égal à `state` |
| `state_not` | l'état est différent de `state` |
| `unavailable` | l'entité est absente, `unavailable` ou `unknown` |

Les conditions numériques ne se déclenchent jamais sur un état non numérique ou indisponible.

**Effets**

| `effect` | Résultat |
|----------|----------|
| `shadow_pulse` | L'ombre centrale pulse. Fonctionne aussi avec `center_shadow: false` — l'ombre n'apparaît alors que pendant l'alarme |
| `leds_blink` | Les LEDs allumées clignotent en conservant leurs couleurs severity |
| `value_blink` | La valeur centrale et l'unité clignotent, teintées avec `color` |
| `border_pulse` | Un halo coloré pulse autour de toute la carte |

Exemples :

```yaml
# Clignoter tant qu'un capteur de puissance séparé est en décharge
alarms:
  - entity: sensor.battery_power
    condition: below
    value: 0
    effect: leds_blink
    duration: 700

# Mettre la carte en évidence tant qu'un détecteur de fuite est actif
alarms:
  - entity: binary_sensor.fuite_eau
    condition: state
    state: "on"
    effect: border_pulse
    color: "#f44336"

# Deux alarmes sur une même carte : avertissement puis critique
alarms:
  - condition: range
    min: 28
    max: 32
    effect: value_blink
    color: "#ff9800"
  - condition: above
    value: 32
    effect: shadow_pulse
    color: "#f44336"
    duration: 600
    intensity: 0.15

# Alerter quand le capteur ne remonte plus rien
alarms:
  - condition: unavailable
    effect: value_blink
    color: "#9e9e9e"
    duration: 2000
```

**Migration depuis `center_shadow_pulse`**

Les anciennes clés continuent de fonctionner : elles sont converties en une alarme unique, donc
aucune configuration existante ne casse. `alarms:` a la priorité si les deux sont présentes, et
modifier la section Alarmes dans l'éditeur visuel réécrit les anciennes clés au nouveau format.

```yaml
# Avant (toujours supporté)
center_shadow_pulse: true
center_shadow_pulse_min: 0
center_shadow_pulse_max: 750
center_shadow_pulse_duration: 1500
center_shadow_pulse_intensity: 0.3

# Après
alarms:
  - condition: range
    min: 0
    max: 750
    effect: shadow_pulse
    duration: 1500
    intensity: 0.3
```

### Transparence des Arrière-plans

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `transparent_card_background` | boolean | false | Rendre l'arrière-plan de la carte principale transparent |
| `transparent_gauge_background` | boolean | false | Rendre l'arrière-plan du cercle gauge transparent |
| `transparent_center_background` | boolean | false | Rendre l'arrière-plan du cercle central transparent |
| `hide_shadows` | boolean | false | Masquer toutes les ombres portées (box-shadows) |
| `hide_inactive_leds` | boolean | false | Masquer les LEDs inactives (grises), ne montrant que les LEDs actives |

**Exemple :**
```yaml
type: custom:custom-gauge-card
entity: sensor.batterie
transparent_card_background: true
transparent_gauge_background: true
transparent_center_background: true
hide_shadows: true
hide_inactive_leds: true
```

### Fonctionnalités Avancées

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `show_trend` | boolean | false | Afficher l'indicateur de tendance 24h |
| `buttons` | list | `[]` | Liste de configurations de boutons (voir Contrôle Multi-Boutons ci-dessous) |

### Contrôle Multi-Boutons

Configurez jusqu'à 4 boutons pour contrôler diverses entités. Depuis la v2.3, ils
sont disposés dans une **barre centrée sous le titre**, au-dessus d'un filet fin
dérivé du thème. Sans aucun bouton configuré, ni la barre ni le filet ne sont
dessinés et aucun espace n'est réservé.

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `button_icon_size` | number | 22 | Taille par défaut de l'icône pour tous les boutons (en pixels) |
| `buttons_layout` | string | `bar` | `bar` (sous le titre) ou `corners` (placement d'avant la 2.3, respecte le `position` de chaque bouton) |

**Propriétés des Boutons:**

```yaml
button_icon_size: 22  # Taille globale par défaut pour tous les boutons
buttons:
  - entity: switch.mon_interrupteur
    icon: "mdi:toggle-switch"  # Optionnel, défaut selon le type d'entité
    icon_size: 28  # Optionnel : taille personnalisée pour ce bouton (remplace button_icon_size)
```

| Propriété du Bouton | Type | Défaut | Description |
|----------------------|------|--------|-------------|
| `entity` | string | *requis* | ID de l'entité à contrôler |
| `icon` | string | *auto* | Icône personnalisée (par défaut selon le type d'entité) |
| `icon_size` | number | `button_icon_size` | Taille personnalisée de l'icône pour ce bouton |
| `position` | string | `bottom-right` | **Uniquement avec `buttons_layout: corners`** (top-left, top-right, bottom-left, bottom-right). Ignoré en disposition `bar` |

**Personnalisation des icônes :**
- Recommandé : **n'importe quelle icône MDI**, écrite `mdi:nom` (`mdi:water-pump`, `mdi:fan`, ...). Elle est rendue via le `<ha-icon>` de Home Assistant : elle hérite de la couleur du bouton et reste nette à toute taille. Dans l'éditeur visuel, vous disposez du sélecteur d'icônes natif de HA, avec recherche
- Toujours supporté : **n'importe quel emoji** (💡, 🎬, ●, 🔥, ⚡, 🌙, ⭐, 🎵, 🌡️, 💧, etc.)
- Toujours supporté : **n'importe quel texte ou symbole** (●, ▶, ■, ★, ON, OFF, etc.)

Tout ce qui n'est pas de la forme `prefixe:nom` est inséré tel quel, exactement comme avant la v2.3.

**Types d'Entités Supportés** (et leur icône MDI par défaut) :
- `switch` - Basculer on/off (`mdi:toggle-switch`)
- `light` - Basculer lumière on/off (`mdi:lightbulb`)
- `scene` - Activer scène (`mdi:palette`)
- `script` - Exécuter script (`mdi:play`)
- `input_boolean` - Basculer booléen (`mdi:toggle-switch-outline`)
- `automation` - Basculer automatisation (`mdi:robot`)
- `fan` - Basculer ventilateur (`mdi:fan`)
- `cover` - Ouvrir/fermer couverture (`mdi:window-shutter`)
- `climate` - Basculer climatisation (`mdi:thermostat`)
- `lock` - Verrouiller/déverrouiller (`mdi:lock`)
- `vacuum` - Démarrer/arrêter aspirateur (`mdi:robot-vacuum`)

**Note:** L'ancien format de configuration (`show_switch_button`, `switch_entity`, `switch_button_position`) est toujours supporté pour la rétrocompatibilité.

### Marqueurs et Zones

| Option | Type | Description |
|--------|------|-------------|
| `markers` | list | Liste de marqueurs avec `value`, `color`, `label` |
| `zones` | list | Liste de zones avec `from`, `to`, `color`, `opacity` |
| `severity` | list | Liste de paliers avec `value`, `color` pour les LEDs |

### Optimisations

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `power_save_mode` | boolean | false | Pause les mises à jour quand invisible |
| `power_save_threshold` | number | 10 | Seuil de visibilité (%) |
| `update_interval` | number | 1000 | Intervalle de mise à jour en ms |
| `debounce_updates` | boolean | false | Limiter la fréquence des mises à jour |


## Exemples d'Usage

### Jauge de Température

```yaml
type: custom:custom-gauge-card
entity: sensor.temperature_salon
name: Température Salon
unit: "°C"
min: 10
max: 35
severity:
  - color: "#00bfff"
    value: 30
  - color: "#4caf50"
    value: 60
  - color: "#ff9800"
    value: 80
  - color: "#f44336"
    value: 100
```

### Niveau de Batterie

```yaml
type: custom:custom-gauge-card
entity: sensor.phone_battery
name: Batterie Téléphone
unit: "%"
min: 0
max: 100
leds_count: 100
show_trend: true
zones:
  - from: 0
    to: 20
    color: "#f44336"
    opacity: 0.5
  - from: 20
    to: 80
    color: "#4caf50"
    opacity: 0.3
  - from: 80
    to: 100
    color: "#2196f3"
    opacity: 0.3
```

### Consommation Électrique avec Contrôle Multi-Boutons

```yaml
type: custom:custom-gauge-card
entity: sensor.power_consumption
name: Consommation
unit: W
min: 0
max: 5000
smooth_transitions: true
animation_duration: 600
# Ajout de boutons de contrôle multiples
buttons:
  - entity: switch.alimentation_principale
  - entity: light.indicateur_puissance
  - entity: script.reset_compteur
    icon: "🔄"
markers:
  - value: 2000
    color: "#ffeb3b"
    label: Limite
```

### Hub de Contrôle Maison Intelligente

```yaml
type: custom:custom-gauge-card
entity: sensor.temperature_salon
name: Salon
unit: "°C"
min: 15
max: 30
# Contrôler plusieurs appareils depuis une jauge
buttons:
  - entity: light.salon
    icon: "mdi:lightbulb"
  - entity: switch.climatisation
    icon: "mdi:snowflake"
  - entity: scene.mode_cinema
    icon: "mdi:movie-open"
  - entity: automation.routine_nuit
    icon: "mdi:weather-night"
    icon: "🌙"
severity:
  - color: "#00bfff"
    value: 40
  - color: "#4caf50"
    value: 70
  - color: "#ff9800"
    value: 100
```

## Compatibilité

- Home Assistant 2024.1.0 ou supérieur
- Tous les navigateurs modernes supportant les Web Components
- Compatible mobile et tablette


## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs via les [Issues](https://github.com/guiohm79/custom-gauge-card/issues)
- Proposer des améliorations
- Soumettre des Pull Requests

## Support

Si vous appréciez cette carte, n'hésitez pas à :
-  Mettre une étoile sur GitHub
-  Signaler les bugs
-  Proposer de nouvelles fonctionnalités

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.



---


