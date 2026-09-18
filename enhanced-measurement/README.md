# Enhanced Measurement Widget

Comprehensive measurement widget for ArcGIS Experience Builder. Supports eight measurement tool types, custom units, segment labeling, statistics, session persistence, multiple export formats, and extensive UI customization.

Community post and downloads:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## Features

- Eight measurement tools: point, distance, area, circle, rectangle, triangle, freehand polyline, freehand polygon
- In-widget help guide: a Help button in the header opens a short, searchable, plain-language guide that only describes the features the builder has turned on, plus a dismissable first-run hint
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

- ArcGIS Experience Builder Developer Edition 1.19, 1.20, or 1.21 (these versions run React 19; EB 1.18 and earlier are not supported)
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

2. Install dependencies from the `client` folder. The command depends on your EB version:

   EB 1.19 or 1.20:

   ```
   npm install
   ```

   EB 1.21 and later (Esri switched to pnpm; `npm install` errors out by design):

   ```
   npm i -g pnpm
   pnpm ci
   ```

   Either way, Experience Builder picks up `package.json` inside the widget folder and installs the dependencies automatically. You do not need to install `@turf/turf` or `jspdf` separately.

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

## Usage telemetry

This widget records anonymous usage counts and errors so the GIS Division can see which widgets and versions are in use and which errors users hit. It records the app id and title, widget name and version, the action name, a truncated error message, the site host name and browser family. It never records usernames, coordinates, addresses, attribute values or URLs with query strings. Where the data goes: on page load the widget asks the app's portal for a public item tagged `exb-beacon-sink` and posts to that table. If your portal has no such item, nothing is sent anywhere. To turn it off for an app, set `"telemetry": false` in the widget's config, or users can enable Do Not Track in their browser. The shared module is `src/shared/beacon.ts`.

## Troubleshooting

### `<name> is duplicated` on `npm start`

This means Experience Builder found more than one widget registering the same `name` from `manifest.json`. Check, in this order:

1. **Nested folder.** Make sure the widget is at `your-extensions/widgets/enhanced-measurement/`, with `manifest.json` directly inside. A common mistake is dropping the extracted folder into another folder of the same name (`enhanced-measurement/enhanced-measurement/`).
2. **Leftover copies.** Look for `-copy` folders, older versions, or folders under a previous name if the widget was renamed.
3. **Stale build output.** Stop the client server, delete `client/dist/widgets/enhanced-measurement/`, and run `npm start` again. This is common after switching EB versions.

If removing one copy makes the widget disappear from the widget picker entirely, the remaining copy is nested too deep. Move it so `manifest.json` is directly inside the widget folder.

### Visual Studio shows hundreds of TypeScript errors on EB 1.21

Experience Builder 1.21 installs the client with pnpm. Visual Studio cannot read through the pnpm junctions under `client\node_modules` (`IDE1100 Access to the path ... is denied`), so its own TypeScript analysis has no types for React, jimu or the Maps SDK and reports errors the webpack build does not have. Webpack (`npm start` in `client`) is the only type authority.

The widget ships a self-contained `tsconfig.json` and `src/exb-editor-shims.d.ts` that give Visual Studio everything it needs without touching `node_modules`. They are `noEmit` and ignored by the build. To use them:

1. Open the widget folder itself in Visual Studio (`File > Open > Folder` on `client\your-extensions\widgets\enhanced-measurement`), never `client` or the EB root.
2. Set the Error List scope to **Open Documents**. Errors whose File column is under `client\jimu-core`, `client\dist` or `client\node_modules` are Esri's, not the widget's, and appear whenever a file under `client` is open in a tab.
3. If stale errors linger, close Visual Studio, delete the widget's `.vs` folder, and reopen.

`npx tsc -p .` from the widget folder should report 0 errors.

## Feedback

Bug reports, feature requests, and questions on the Esri Community post:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## License

Apache License, Version 2.0. See [LICENSE](./LICENSE).

Copyright (c) 2026 City of Grand Junction, CO
