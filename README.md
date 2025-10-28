# Custom Gauge Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub Release](https://img.shields.io/github/release/guiohm79/custom-gauge-card.svg)](https://github.com/guiohm79/custom-gauge-card/releases)

A custom card for Home Assistant that displays your sensors as an animated and interactive circular LED gauge.

![Custom Gauge Card](icon.svg)

## Features

✨ **Modern Animated Design**
- Circular gauge with animated LEDs
- Smooth and fluid value transitions
- Dynamic shadow and lighting effects
- Customizable themes (light, dark, custom)

🎯 **Zones and Markers**
- Define colored zones to visualize value ranges
- Add markers with labels for specific reference points
- Flexible color and opacity configuration

📊 **Trend Indicator**
- Display 24-hour evolution
- Percentage change with directional arrow
- Automatic history from Home Assistant

🎮 **Switch Control**
- Control switches directly from the gauge
- Optional switch button with customizable position
- Toggle on/off with visual feedback

⚡ **Optimized Performance**
- Power save mode (pauses when invisible)
- Automatic LED reduction on mobile
- Update debouncing
- Optimized animations

♿ **Accessible**
- ARIA attributes for screen readers
- Keyboard navigation support
- Slider role for interactive controls

## Installation

### Via HACS (Recommended)

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
theme: dark  # default, light, dark, custom
custom_background: "#2c2c2c"
custom_gauge_background: "radial-gradient(circle, #444, #222)"
custom_center_background: "radial-gradient(circle, #333, #111)"
custom_text_color: "#ffffff"
custom_secondary_text_color: "#aaaaaa"

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

# Switch button (optional)
show_switch_button: true
switch_entity: switch.pump_1
switch_button_position: bottom-right  # Options: top-left, top-right, bottom-left, bottom-right

# Optimizations
power_save_mode: true
power_save_threshold: 20
update_interval: 1000
debounce_updates: true
optimize_leds: true
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

### Advanced Features

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_trend` | boolean | false | Show 24h trend indicator |
| `show_switch_button` | boolean | false | Show a switch control button |
| `switch_entity` | string | - | Switch entity to control |
| `switch_button_position` | string | `bottom-right` | Button position: `top-left`, `top-right`, `bottom-left`, `bottom-right` |

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
| `optimize_leds` | boolean | false | Reduce LEDs on mobile |

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

### Power Consumption with Switch Control

```yaml
type: custom:custom-gauge-card
entity: sensor.power_consumption
name: Power Consumption
unit: W
min: 0
max: 5000
smooth_transitions: true
animation_duration: 600
# Add a switch button to control a device
show_switch_button: true
switch_entity: switch.main_power
switch_button_position: bottom-right
markers:
  - value: 2000
    color: "#ffeb3b"
    label: Limit
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

## Credits

Developed with ❤️ for the Home Assistant community.

---


