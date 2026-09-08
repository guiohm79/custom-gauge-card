# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-09-08

### Changed
- **Buttons moved to a bar under the title.** They used to be pinned to the four corners of the card, on top of the gauge; they now sit in a centered row below the title, separated from it by a hairline whose color follows the theme. The bar centers itself for 1 to 4 buttons
- Buttons are **44 x 44 px** instead of 36 x 36, the minimum comfortable touch target
- **Default icons are now MDI** (`mdi:lightbulb`, `mdi:water-pump`, ...) rendered through `<ha-icon>`, instead of emojis. A custom `icon` written as `prefix:name` renders as an `<ha-icon>`; anything else - an emoji, a symbol, plain text - keeps the previous behavior, so existing configurations are unaffected
- With `buttons: []` (or none configured) neither the bar nor its separator is drawn, and no space is reserved - the card is exactly as tall as before

### Added
- `buttons_layout: bar | corners` - `bar` is the new default; `corners` restores the pre-2.3 placement and keeps honoring each button's `position`
- Buttons are configurable in the **visual editor**: a "Buttons" section with entity picker, HA's native MDI icon picker and per-button icon size, capped at 4 buttons
- `dynamic_markers` are configurable in the **visual editor** too: a "Dynamic markers" section with tracked entity, optional attribute, label, dot size, value display and color (cleared = automatic color by entity domain), with add/remove buttons. They used to be reachable only from YAML

### Fixed
- The 24 h trend indicator no longer lands on top of a button: with a button bar it is lifted above it

## [2.2.0] - 2026-08-04

### Added
- `alarms:` — a list of alarms replacing the single pulsating alarm. Each alarm can watch **any entity**, not only the gauge entity, which removes the need for `config-template-card` wrappers ([discussion #16](https://github.com/guiohm79/custom-gauge-card/discussions/16))
- 8 alarm conditions: `range`, `outside`, `above`, `below`, `equal`, `state`, `state_not`, `unavailable`
- 4 alarm effects: `shadow_pulse` (the former behavior), `leds_blink`, `value_blink`, `border_pulse`
- Per-alarm `color`, `duration`, `intensity`, `attribute` and `name`
- Several alarms can be active at the same time, one per effect
- Visual editor — the "Pulsating alarm" section becomes "Alarms", with add/remove rows and condition-dependent fields

### Changed
- `shadow_pulse` no longer requires `center_shadow: true` — with the center shadow off, the shadow now appears only while the alarm is active (it used to stay visible permanently in that configuration)
- Alarms are evaluated on every state update, bypassing `debounce_updates`, so an alert is never delayed
- Alarm effects are dropped while the card is off-screen under `power_save_mode`

### Fixed
- The pulsating shadow never reached its target color: the 300 ms CSS transition on `.center-shadow` lagged behind the 16 ms pulse tick. Only visible now that an alarm can define its own color, but the transition was fighting the pulse all along
- `hexToRgba()` accepts `#rgb` shorthand and no longer produces `rgba(NaN,…)` on unexpected color notations

### Deprecated
- `center_shadow_pulse`, `center_shadow_pulse_min`, `center_shadow_pulse_max`, `center_shadow_pulse_duration`, `center_shadow_pulse_intensity` — still fully supported, silently converted into a single alarm. `alarms:` takes precedence when both are present

## [2.0.0] - 2026-05-29

### Added
- `arc_sweep` (30–360°) and `arc_start` — full YAML control over arc span and start angle
- `scale_ticks`, `scale_steps`, `scale_labels` — SVG graduation overlay with major/minor ticks and value labels
- `tap_action` — configurable click behavior (`more-info`, `navigate`, `call-service`, `none`)
- `getCardSize()` — correct card height in Home Assistant grid layout
- `getStubConfig()` — minimal stub config for the HA visual card picker
- Visual editor — full GUI editor with collapsible sections for all card parameters, using native HA components (`ha-selector`, `ha-entity-picker`, `ha-expansion-panel`)
- Registration in `window.customCards` — card now appears in the HA card picker UI

### Fixed
- `.switch-button` was 0×0 px — buttons are now correctly sized at 36×36 px and visible
- `showTrendIndicator()` was called before `_hass` was set, causing silent failures — now called on first `set hass()` with a one-shot flag
- Bidirectional mode now works correctly on partial arcs (zero reference at arc midpoint)
- Markers, zones and dynamic markers now respect `arc_start`/`arc_sweep` via `valueToArcAngle()`

### Changed
- Rewritten as a single self-contained IIFE file — no build step required
- Card can now be deployed directly to `config/www/` without running `npm run build`

### Removed
- Modular `src/` architecture and Rollup build pipeline

## [1.0.4] - 2025-10-29

### Added
- Example screenshots in README files (Exemple1.png, Exemple2.png)
- Enhanced documentation with visual examples
- CHANGELOG.md file for version history tracking

### Changed
- Updated README.md with expanded configuration examples
- Updated README.fr.md with improved French documentation
- Improved code structure and optimization in custom-gauge-card.js

## [1.0.3.1] - 2025-10-29

### Changed
- Updated README.fr.md with comprehensive French documentation
- Enhanced info.md with better installation guidance
- Improved README.md with minor corrections

### Removed
- Removed old Capture1.png screenshot

## [1.0.3] - 2025-10-29

### Changed
- Code refactoring and optimization in custom-gauge-card.js
- Improved performance and reduced complexity

## [1.0.2] - 2025-10-28

### Fixed
- Minor bug fixes in custom-gauge-card.js
- Code quality improvements

## [1.0.1] - 2025-10-28

### Added
- French documentation (README.fr.md)
- Multi-button control feature with up to 4 customizable buttons
- Support for multiple entity types (switch, light, scene, script, automation, etc.)
- Custom icon support for buttons with emoji and text options
- Button icon size customization (global and per-button)
- Title font customization options (family, size, weight, color)

### Changed
- Extensive README.md updates with new features and examples
- Enhanced card.yaml with button configuration examples
- Major improvements to custom-gauge-card.js with new features

## [1.0.0] - 2025-10-28

### Added
- Initial release of Custom Gauge Card
- Circular LED gauge display for Home Assistant sensors
- Animated transitions with smooth value changes
- Multiple theme support (default, light, dark, custom)
- Zones and markers configuration
- Trend indicator (24-hour evolution)
- Shadow and lighting effects
- Performance optimizations (power save mode, debounce updates)
- Interactive control support
- ARIA attributes for accessibility
- HACS integration support

### Documentation
- Initial README.md with comprehensive documentation
- Initial README.fr.md with French translation
- Example configuration in card.yaml
- Screenshot (Capture1.png)

[2.2.0]: https://github.com/guiohm79/custom-gauge-card/compare/v2.0.0...v2.2.0
[2.0.0]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.4...v2.0.0
[1.0.4]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.3.1...v1.0.4
[1.0.3.1]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.3...v1.0.3.1
[1.0.3]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/guiohm79/custom-gauge-card/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/guiohm79/custom-gauge-card/releases/tag/v1.0.0
