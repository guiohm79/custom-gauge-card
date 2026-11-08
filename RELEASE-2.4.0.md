# Custom Gauge Card v2.4.0

Two new features, both configurable from the visual editor, with no impact on existing cards: with the default values, rendering is pixel-for-pixel identical to v2.3.

## ✨ What's new

### LED shape — `led_shape`

Switch from the classic round-LED look to rectangular segments, hi-fi VU-meter style.

```yaml
led_shape: rect
led_size: 6              # segment width, along the arc
led_length: 18            # segment length, along the radius
led_corner_radius: 1
```

- `led_shape`: `round` (default) or `rect`
- `led_length`: radial length of the segments in px (default: `led_size × 2`)
- `led_corner_radius`: corner rounding in px (default: 1)

Segments grow inward from the LED ring: their outer edge stays exactly where the round LEDs used to sit, so scale ticks, markers and zones don't move.

### Color gradient — `severity_mode`

Severity thresholds (`severity:`) can now be blended in RGB instead of applied as flat colors.

```yaml
severity_mode: gradient_arc   # or: gradient
severity:
  - color: "#2196f3"
    value: -10
  - color: "#4caf50"
    value: 15
  - color: "#f44336"
    value: 40
```

- `steps` (default): current behavior, one flat color per zone
- `gradient`: the whole lit bar takes a single color, interpolated between the two thresholds around the current value
- `gradient_arc`: each LED takes the color of its own position on the scale — the lit part shows the full gradient

Works with hex colors, CSS names, `rgb()` and `hsl()`. A `var(--theme)` color can't be interpolated and automatically falls back to the flat (`steps`) color.

## 🎛️ Visual editor

- **Appearance** section: an "LED shape" select (Round / Rectangle), with the "Segment length" and "Corner radius" sliders appearing only in rectangle mode.
- **Severity (LED colors)** section: a "Color mode" select at the top of the panel, with help text that changes based on the selected mode.

## 📦 Install / update

Copy `custom-gauge-card.js` to `config/www/` (direct replacement), or let HACS update the resource. If the editor doesn't show the new options after updating, clear your browser cache (Ctrl+F5) — Home Assistant sometimes caches the old version of the resource.

## 🔧 Technical details

See the [CHANGELOG](CHANGELOG.md#240---2026-09-13) for the full list of internal changes.

---

**Compatibility**: no changes required to existing configurations. All options are new and optional.
