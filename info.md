{% if installed %}
## Thank you for installing Custom Gauge Card! 🎉

The card is now installed and ready to use in your Home Assistant dashboards.

### Quick Start

Add this to your Lovelace dashboard:

```yaml
type: custom:custom-gauge-card
entity: sensor.your_sensor
name: My Gauge
unit: "unit"
min: 0
max: 100
```

### Important Notes

- The card is registered as `custom:custom-gauge-card`
- Make sure to clear your browser cache if the card doesn't appear
- Restart Home Assistant if needed

### Need Help?

- 📖 [Full Documentation](https://github.com/guiohm79/custom-gauge-card/blob/main/README.md)
- 🐛 [Report Issues](https://github.com/guiohm79/custom-gauge-card/issues)
- 💡 [Request Features](https://github.com/guiohm79/custom-gauge-card/issues/new)

{% else %}
## Custom Gauge Card

A modern, animated circular LED gauge card for Home Assistant.

![Custom Gauge Card](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/icon.svg)

### ✨ Key Features

- 🎨 **Animated LED Gauge** - Beautiful circular gauge with smooth animations
- 🎯 **Zones & Markers** - Visual indicators for value ranges
- 📊 **Trend Indicator** - 24-hour history at a glance
- 🎮 **Multi-Button Control** - Control multiple entities with customizable buttons
- ⚡ **Performance Optimized** - Power save mode and consistent rendering
- 🎨 **Customizable Themes** - Light, dark, and custom themes

### 📋 Requirements

- Home Assistant 2024.1.0 or higher
- Modern browser with Web Components support

### 🚀 After Installation

1. Click "Install" to add the card to your Home Assistant
2. Restart Home Assistant
3. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
4. Add the card to your dashboard with type: `custom:custom-gauge-card`

### 📖 Documentation

Full configuration options and examples are available in the [README](https://github.com/guiohm79/custom-gauge-card/blob/main/README.md).

### Example Configuration

```yaml
type: custom:custom-gauge-card
entity: sensor.temperature
name: Living Room
unit: "°C"
min: 10
max: 35
gauge_size: 220
leds_count: 150
smooth_transitions: true
enable_shadow: true
center_shadow: true
show_trend: true
# Multi-button control
buttons:
  - entity: light.living_room
    position: top-right
  - entity: switch.ac_unit
    position: bottom-right
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

### 🌟 Support

If you like this card:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs to help improve it
- 💡 Suggest new features

---
