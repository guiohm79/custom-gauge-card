{% if installed %}
## Thank you for installing Custom Gauge Card v2! 🎉

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
## Custom Gauge Card v2

A modern, animated circular LED gauge card for Home Assistant.

![Custom Gauge Card](https://raw.githubusercontent.com/guiohm79/custom-gauge-card/main/icon.svg)

### ✨ Key Features

- 🎨 **Animated LED Gauge** — Beautiful circular gauge with smooth animations
- 🔧 **Arc Control** — Full YAML control over arc span and start angle (`arc_sweep`, `arc_start`)
- 📐 **Scale Ticks** — SVG graduation overlay with major/minor ticks and value labels
- 🖱️ **Tap Action** — Configurable click behavior (more-info, navigate, call-service, none)
- 🎛️ **Visual Editor** — Full GUI editor with collapsible sections, no YAML required
- 🎯 **Zones & Markers** — Colored zones, static markers, and real-time dynamic markers
- 📊 **Trend Indicator** — 24-hour history at a glance
- 🎮 **Multi-Button Control** — Control multiple entities with customizable buttons
- ⚡ **Performance Optimized** — Power save mode and consistent rendering
- 🎨 **Customizable Themes** — Light, dark, and custom themes

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
arc_sweep: 270
arc_start: 135
scale_ticks: true
scale_steps: 5
smooth_transitions: true
enable_shadow: true
center_shadow: true
show_trend: true
tap_action:
  action: more-info
buttons:
  - entity: light.living_room
    position: top-right
  - entity: switch.ac_unit
    position: bottom-right
severity:
  - color: "#00bfff"
    value: 16
  - color: "#4caf50"
    value: 22
  - color: "#ff9800"
    value: 28
  - color: "#f44336"
    value: 35
```

### 🌟 Support

If you like this card:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs to help improve it
- 💡 Suggest new features

---
{% endif %}
