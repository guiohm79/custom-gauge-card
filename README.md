# Custom Gauge Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub Release](https://img.shields.io/github/release/guiohm79/custom-gauge-card.svg)](https://github.com/guiohm79/custom-gauge-card/releases)
[![License](https://img.shields.io/github/license/guiohm79/custom-gauge-card.svg)](LICENSE)

A custom card for Home Assistant that displays your sensors as an animated and interactive circular LED gauge.




<img width="589" alt="image" src="https://github.com/guiohm79/custom-gauge-card/blob/main/captures/Exemple1.png">
<img width="589" alt="image" src="https://github.com/guiohm79/custom-gauge-card/blob/main//captures/Exemple2.png">

## Screenshots

![Example 1](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple1.png)
![Example 2](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/captures/Exemple2.png)

## Features

 **Modern Animated Design**
- Circular gauge with animated LEDs
- Smooth and fluid value transitions
- Dynamic shadow and lighting effects
- Customizable themes (light, dark, custom)

 **Zones and Markers**
- Define colored zones to visualize value ranges
- Add markers with labels for specific reference points
- Flexible color and opacity configuration

 **Trend Indicator**
- Display 24-hour evolution
- Percentage change with directional arrow
- Automatic history from Home Assistant

 **Multi-Button Control**
- Control multiple entities directly from the gauge
- Support for switches, lights, scenes, scripts, automations and more
- Up to 4 buttons with customizable positions
- Smart icons and visual feedback

 **Optimized Performance**
- Power save mode (pauses when invisible)
- Update debouncing
- Optimized animations
- Consistent rendering across all devices

 **Accessible**
- ARIA attributes for screen readers
- Keyboard navigation support
- Slider role for interactive controls

## Installation

### Via HACS (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=guiohm79&repository=custom-gauge-card&category=plugin)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click on the menu (⋮) in the top right
4. Select "Custom repositories"
5. Add the URL: `https://github.com/guiohm79/custom-gauge-card`
6. Select category "Lovelace"
7. Click "Install"
8. Restart Home Assistant

### Manual Installation

1. Download the `custom-gauge-card.js` file
2. Copy it to `config/www/custom-gauge-card.js`
3. Add the resource in Home Assistant:
   - Go to **Settings** → **Dashboards** → **Resources**
   - Click **+ Add Resource**
   - URL: `/local/custom-gauge-card.js`
   - Type: **JavaScript Module**
4. Restart Home Assistant

## Configuration

### Minimal Configuration

```yaml
type: custom:custom-gauge-card
entity: sensor.temperature
name: Temperature
unit: "°C"
min: 0
max: 40
```

### Complete Configuration

```yaml
type: custom:custom-gauge-card
entity: sensor.water_tank_level_sensor_1
name: Water Tank 1 Level
unit: L
min: 0
max: 3000

# Appearance
gauge_size: 220
center_size: 120
led_size: 7
leds_count: 150
decimals: 0

# Theme
theme: custom  # default, light, dark, custom
custom_background: "#2c2c2c"
custom_gauge_background: "radial-gradient(circle, #444, #222)"
custom_center_background: "radial-gradient(circle, #333, #111)"
custom_text_color: "#ffffff"
custom_secondary_text_color: "#aaaaaa"

# Title font customization
title_font_family: "Roboto, Arial, sans-serif"
title_font_size: "18px"
title_font_weight: "bold"
# title_font_color: "#00ff00"  # Optional: custom title color

# Animations
smooth_transitions: true
animation_duration: 800

# Visual effects
enable_shadow: true
center_shadow: true
center_shadow_blur: 30
center_shadow_spread: 5

# Trend
show_trend: true

# Markers
markers:
  - value: 1000
    color: "#ffffff"
    label: 1/3
  - value: 2000
    color: "#ffff00"
    label: 2/3

# Colored zones
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

# Severity colors (for LEDs)
severity:
  - color: "#ff2d00"
    value: 25
  - color: "#fb8804"
    value: 50
  - color: "#04fb1d"
    value: 100

# Multi-button control (optional)
button_icon_size: 22  # Default icon size for all buttons (in pixels)
buttons:
  - entity: switch.pump_1
    position: bottom-right
    icon: "●"  # Optional, defaults to entity type icon
    icon_size: 28  # Optional: custom size for this button
  - entity: light.tank_led
    position: top-right
  - entity: script.fill_tank
    position: bottom-left
    icon: "▶"
    icon_size: 20  # Optional: custom size for this button

# Optimizations
power_save_mode: true
power_save_threshold: 20
update_interval: 1000
debounce_updates: true

```

## Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **Required** | Entity to display |
| `name` | string | - | Name displayed below the gauge |
| `unit` | string | - | Unit of measurement |
| `min` | number | 0 | Minimum value |
| `max` | number | 100 | Maximum value |
| `decimals` | number | 0 | Number of decimal places |

### Appearance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gauge_size` | number | 200 | Gauge size in pixels |
| `center_size` | number | 120 | Center size in pixels |
| `led_size` | number | 8 | LED size in pixels |
| `leds_count` | number | 100 | Number of LEDs |

### Themes

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | string | `default` | Theme: `default`, `light`, `dark`, `custom` |
| `custom_background` | string | - | Background color (custom theme) |
| `custom_gauge_background` | string | - | Gauge background (custom theme) |
| `custom_center_background` | string | - | Center background (custom theme) |
| `custom_text_color` | string | - | Text color (custom theme) |
| `custom_secondary_text_color` | string | - | Secondary text color (custom theme) |

### Title Font Customization

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title_font_family` | string | `inherit` | Font family for the title (e.g., "Roboto, Arial, sans-serif") |
| `title_font_size` | string | `16px` | Font size for the title |
| `title_font_weight` | string | `normal` | Font weight for the title (e.g., "normal", "bold", "600") |
| `title_font_color` | string | - | Custom color for the title (overrides theme color) |

**Title Font Examples:**

```yaml
# Modern style
title_font_family: "Roboto, Helvetica, Arial, sans-serif"
title_font_size: "18px"
title_font_weight: "500"

# Elegant style
title_font_family: "Georgia, 'Times New Roman', serif"
title_font_size: "20px"
title_font_weight: "normal"

# Technical/monospace style
title_font_family: "Consolas, 'Courier New', monospace"
title_font_size: "16px"
title_font_weight: "bold"

# Use Home Assistant default font
title_font_family: "inherit"

# Bold with custom color
title_font_family: "Arial, sans-serif"
title_font_size: "22px"
title_font_weight: "bold"
title_font_color: "#00ff00"
```

### Animations

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `smooth_transitions` | boolean | true | Enable smooth transitions |
| `animation_duration` | number | 800 | Animation duration in ms |

### Visual Effects

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable_shadow` | boolean | false | Enable outer shadow |
| `center_shadow` | boolean | false | Enable center shadow |
| `center_shadow_blur` | number | 30 | Center shadow blur |
| `center_shadow_spread` | number | 15 | Center shadow spread |

### Background Transparency

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transparent_card_background` | boolean | false | Make the main card background transparent |
| `transparent_gauge_background` | boolean | false | Make the gauge circle background transparent |
| `transparent_center_background` | boolean | false | Make the center circle background transparent |
| `hide_shadows` | boolean | false | Hide all box-shadows |
| `hide_inactive_leds` | boolean | false | Hide inactive (gray) LEDs, showing only active LEDs |

**Example:**
```yaml
type: custom:custom-gauge-card
entity: sensor.battery
transparent_card_background: true
transparent_gauge_background: true
transparent_center_background: true
hide_shadows: true
hide_inactive_leds: true
```

### Advanced Features

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_trend` | boolean | false | Show 24h trend indicator |
| `buttons` | list | `[]` | List of button configurations (see Multi-Button Control below) |

### Multi-Button Control

Configure multiple buttons to control various entities:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `button_icon_size` | number | 22 | Default icon size for all buttons (in pixels) |

**Button Properties:**

```yaml
button_icon_size: 22  # Global default size for all buttons
buttons:
  - entity: switch.my_switch
    position: bottom-right  # top-left, top-right, bottom-left, bottom-right
    icon: "●"  # Optional, defaults to entity type
    icon_size: 28  # Optional: custom size for this button (overrides button_icon_size)
```

| Button Property | Type | Default | Description |
|-----------------|------|---------|-------------|
| `entity` | string | *required* | Entity ID to control |
| `position` | string | `bottom-right` | Button position (top-left, top-right, bottom-left, bottom-right) |
| `icon` | string | *auto* | Custom icon/emoji (defaults to entity type icon) |
| `icon_size` | number | `button_icon_size` | Custom icon size for this button |

**Icon Customization:**
- You can use **any emoji** (💡, 🎬, ●, 🔥, ⚡, 🌙, ⭐, 🎵, 🌡️, 💧, etc.)
- You can use **any text or symbol** (●, ▶, ■, ★, ON, OFF, etc.)

**Supported Entity Types:**
- `switch` - Toggle switch on/off (●)
- `light` - Toggle light on/off (💡)
- `scene` - Activate scene (🎬)
- `script` - Execute script (▶)
- `input_boolean` - Toggle boolean (●)
- `automation` - Toggle automation (🤖)
- `fan` - Toggle fan (🌀)
- `cover` - Open/close cover (🪟)
- `climate` - Toggle climate (🌡️)
- `lock` - Lock/unlock (🔒)
- `vacuum` - Start/stop vacuum (🤖)

**Note:** Old configuration format (`show_switch_button`, `switch_entity`, `switch_button_position`) is still supported for backward compatibility.

### Markers and Zones

| Option | Type | Description |
|--------|------|-------------|
| `markers` | list | List of markers with `value`, `color`, `label` |
| `zones` | list | List of zones with `from`, `to`, `color`, `opacity` |
| `severity` | list | List of thresholds with `value`, `color` for LEDs |

### Optimizations

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `power_save_mode` | boolean | false | Pause updates when invisible |
| `power_save_threshold` | number | 10 | Visibility threshold (%) |
| `update_interval` | number | 1000 | Update interval in ms |
| `debounce_updates` | boolean | false | Limit update frequency |


## Usage Examples

### Temperature Gauge

```yaml
type: custom:custom-gauge-card
entity: sensor.living_room_temperature
name: Living Room Temperature
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

### Battery Level

```yaml
type: custom:custom-gauge-card
entity: sensor.phone_battery
name: Phone Battery
unit: "%"
min: 0
max: 100
leds_count: 50
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

### Power Consumption with Multi-Button Control

```yaml
type: custom:custom-gauge-card
entity: sensor.power_consumption
name: Power Consumption
unit: W
min: 0
max: 5000
smooth_transitions: true
animation_duration: 600
# Add multiple control buttons
buttons:
  - entity: switch.main_power
    position: bottom-right
  - entity: light.power_indicator
    position: top-right
  - entity: script.reset_counter
    position: bottom-left
    icon: "🔄"
markers:
  - value: 2000
    color: "#ffeb3b"
    label: Limit
```

### Smart Home Control Hub

```yaml
type: custom:custom-gauge-card
entity: sensor.room_temperature
name: Living Room
unit: "°C"
min: 15
max: 30
# Control multiple devices from one gauge
buttons:
  - entity: light.living_room
    position: top-left
    icon: "💡"
  - entity: switch.ac_unit
    position: top-right
    icon: "❄️"
  - entity: scene.movie_mode
    position: bottom-left
    icon: "🎬"
  - entity: automation.night_routine
    position: bottom-right
    icon: "🌙"
severity:
  - color: "#00bfff"
    value: 40
  - color: "#4caf50"
    value: 70
  - color: "#ff9800"
    value: 100
```

### Water Tank Level with Multiple Zones

```yaml
type: custom:custom-gauge-card
entity: sensor.water_tank_level
name: Water Tank
unit: L
min: 0
max: 3000
gauge_size: 250
leds_count: 150
enable_shadow: true
center_shadow: true
show_trend: true
markers:
  - value: 500
    color: "#ff0000"
    label: Low
  - value: 1500
    color: "#ffff00"
    label: Mid
  - value: 2500
    color: "#00ff00"
    label: Full
zones:
  - from: 0
    to: 750
    color: "#ff2d00"
    opacity: 0.4
  - from: 750
    to: 1500
    color: "#fb8804"
    opacity: 0.3
  - from: 1500
    to: 3000
    color: "#04fb1d"
    opacity: 0.3
```

### Humidity with Custom Theme

```yaml
type: custom:custom-gauge-card
entity: sensor.bathroom_humidity
name: Bathroom Humidity
unit: "%"
min: 0
max: 100
theme: custom
custom_background: "#1a1a2e"
custom_gauge_background: "radial-gradient(circle, #16213e, #0f3460)"
custom_center_background: "radial-gradient(circle, #533483, #1a1a2e)"
custom_text_color: "#e94560"
custom_secondary_text_color: "#00d4ff"
smooth_transitions: true
animation_duration: 1000
```

## Compatibility

- Home Assistant 2024.1.0 or higher
- All modern browsers supporting Web Components
- Mobile and tablet compatible


## Contributing

Contributions are welcome! Feel free to:
- Report bugs via [Issues](https://github.com/guiohm79/custom-gauge-card/issues)
- Propose improvements
- Submit Pull Requests

## Support

If you like this card, please:
- ⭐ Star it on GitHub
- 🐛 Report bugs
- 💡 Suggest new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---


