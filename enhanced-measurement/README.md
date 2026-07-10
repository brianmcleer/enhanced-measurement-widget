# Enhanced Measurement Widget

Comprehensive measurement widget for ArcGIS Experience Builder. Supports eight measurement tool types, custom units, segment labeling, statistics, session persistence, multiple export formats, and extensive UI customization.

Community post and downloads:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## Features

- Eight measurement tools: point, distance, area, circle, rectangle, triangle, freehand polyline, freehand polygon
- Session persistence: measurements can be saved in the browser and restored after a page reload (opt-in via settings)
- Live measurement readout in the drawing banner while a tool is active
- Multi-select mode with bulk delete (one-click undo) and bulk GeoJSON export
- Sortable measurement list: newest, oldest, name, or type
- Copy-to-clipboard on every value in the measurement detail view
- Master-detail navigation: click a measurement to open a full detail pane with large readable stats
- Default and custom linear/area units configurable per deployment
- Segment labeling for polylines and polygons, with editable prefix and font size
- Statistics panel showing count, total distance, and total area
- Search/filter for the measurement list
- Inline rename (double-click), recolor after creation, and duplicate for any measurement
- Coordinate display in Decimal Degrees, DMS, or DDM, in Web Mercator or the map's spatial reference
- Edit vertices on existing measurements
- Undo and redo, including keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- Import and export of measurements in JSON, CSV, GeoJSON, and PDF
- Settings configuration import/export as XML (for replicating setup across Experience Builder applications)
- Full UI customization: button layout (2/3/4 column or vertical), compact mode, widget title, button text overrides
- Configurable symbol styling (point size, line width, polygon outline, fill opacity, 10-color palette) and label styling
- Configurable confirmation dialog text
- Optional dark mode (light, dark, or auto via prefers-color-scheme)
- Theme Typography support and WCAG-compliant accessibility

## Requirements

- ArcGIS Experience Builder Developer Edition 1.19 or 1.20 (these versions run React 19; EB 1.18 and earlier are not supported)
- Node.js as required by your EB version

Dependencies (these install automatically with the standard EB client install; no per-package install needed):

- `@turf/turf` for geodesic calculations
- `jspdf` for PDF export

## Install

1. Copy the `enhanced-measurement` folder into your Experience Builder install at:

   ```
   client/your-extensions/widgets/enhanced-measurement/
   ```

   The `manifest.json` must sit **directly** inside this folder. Do not nest the widget another level deep (for example `widgets/enhanced-measurement/enhanced-measurement/`). Nesting is the usual cause of a widget not registering.

2. From the `client` folder, run:

   ```
   npm install
   ```

   Experience Builder picks up `package.json` inside the widget folder and installs the dependencies automatically. You do not need to install `@turf/turf` or `jspdf` separately.

3. Start (or restart) the client:

   ```
   npm start
   ```

4. In Experience Builder, open an app and add the **Enhanced Measurement** widget from the widget picker.

## Configuration

Open the widget's settings panel in Experience Builder. Settings are grouped into sections covering tool enablement, default units, custom units, measurement display, toggle visibility and defaults, label styling, symbol styling, color palette, UI layout, dialog text, and import/export. A `Settings Import/Export` section at the top lets you transfer the full widget configuration between Experience Builder applications as an XML file.

A `Power Features` section controls the advanced end-user features: session persistence, the live measurement readout, multi-select mode, and list sorting. Session persistence is off by default; the other three are on by default.

A `Reset All Settings to Defaults` button at the bottom restores every option to its default state.

### About session persistence

When enabled, measurements are stored in the end user's browser (localStorage) as they work. On the next page load, a banner offers to restore the previous session. Data never leaves the browser, is scoped per widget instance, and is cleared when the user dismisses the banner or deletes all measurements. Private browsing and storage-quota failures degrade gracefully to normal session-only behavior.

## Troubleshooting

### `<name> is duplicated` on `npm start`

This means Experience Builder found more than one widget registering the same `name` from `manifest.json`. Check, in this order:

1. **Nested folder.** Make sure the widget is at `your-extensions/widgets/enhanced-measurement/`, with `manifest.json` directly inside. A common mistake is dropping the extracted folder into another folder of the same name (`enhanced-measurement/enhanced-measurement/`).
2. **Leftover copies.** Look for `-copy` folders, older versions, or folders under a previous name if the widget was renamed.
3. **Stale build output.** Stop the client server, delete `client/dist/widgets/enhanced-measurement/`, and run `npm start` again. This is common after switching EB versions.

If removing one copy makes the widget disappear from the widget picker entirely, the remaining copy is nested too deep. Move it so `manifest.json` is directly inside the widget folder.

## Feedback

Bug reports, feature requests, and questions on the Esri Community post:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## License

Apache License, Version 2.0. See [LICENSE](./LICENSE).

Copyright (c) 2026 City of Grand Junction, CO
