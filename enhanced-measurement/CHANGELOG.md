# Changelog

Newest first. Every release bumps `manifest.json` and `package.json` together.

## 1.5.1 (2026-11-24)

### Fixed
- **Stop editing** in a measurement's three-dot menu did not stop vertex editing. It restarted the edit on the same shape, so the menu kept saying Stop editing and the blue banner stayed up until Esc was pressed. It now ends the edit and keeps the changes.
- An edit started from a measurement's menu also ends when you click off the shape. Before, the shape was released but the blue "Edit Vertices" banner stayed.
- Ending a vertex edit (Stop editing, the banner button, or Esc) now always keeps the changes.

### Changed
- While editing vertices the banner button reads **Done** instead of Esc, and the hint says how to finish.
- While editing vertices the blue banner now sits just above the Measurements section, next to the measurement being edited, instead of at the top of the widget. Drawing tools still show it at the top by the tool buttons.
- Near Me follows the measurement it was given. After **Set as Near Me location**, reshaping that measurement (vertex edit, segment delete, undo or redo) updates the Near Me location on its own. Choosing Set as Near Me location on another measurement switches to that one.

## 1.5.0 (2026-11-24)

### Added
- Use a measurement as the location for the Near Me widget. Each measurement's three-dot menu (on its card and in its details) has **Set as Near Me location**. Near Me then buffers and searches around that point, line or shape, the same as if a feature had been picked from a popup. The menu item only shows when the app has a Near Me widget.
- It goes through Near Me's own Set location data action, so Near Me opens itself when it sits in a widget controller, and the builder's data action settings for this widget are respected. Near Me still has to be set up to take a location: at least one analysis layer, a search by location (not by current map area), and on the same page as this widget. If it is not, a short message says so.
- Settings, Power Features: **Use a measurement as the Near Me location**. On by default; it carries through the settings XML export and import.
- Help guide: one line in the measurements section and one troubleshooting line, both shown only when the feature is available.

### Notes
- Near Me only accepts features that belong to a data source, so the widget creates a small in-memory data source per geometry type (point, line, shape) the first time a measurement is sent. They are not saved in the app.

## 1.4.3 (2026-11-10)

### Fixed
- Lat/long now works on State Plane maps when the ArcGIS projection engine cannot load, which is the case in the Experience Builder Developer Edition client. Before this, Coordinate Display set to lat/long still showed State Plane X/Y on the point label, in the measurement details and exports, and in the drawing tooltip. The widget now has its own conversion math (`pureProjection.ts`) for 4,527 projected coordinate systems that use Lambert Conformal Conic, Transverse Mercator or Albers Equal Area on GRS 1980 or WGS 1984: every US State Plane zone (NAD83 and its HARN, NSRS2007 and 2011 versions, metres and feet, EPSG and Esri codes), UTM, and most modern national grids. Each one was checked against PROJ to better than a millimetre. No datum shift is applied, so results match WGS 1984 to about two metres.
- Points measured before a conversion was available are converted when they are labelled or exported, instead of staying as X/Y.
- If the older ArcGIS projection module fails to load, the widget now tries its replacement (the project operator) before giving up.

### Notes
- Spatial references outside that list (older datums such as NAD27, or other projection types) still need the ArcGIS projection engine. If it cannot load, they show X/Y as before.

## 1.4.2 (2026-11-09)

### Fixed
- On a map that is not Web Mercator or WGS84 (State Plane, for example), the Esri drawing tooltip kept showing State Plane coordinates even with Coordinate Display set to lat/long. The tooltip's coordinates are now hidden in that case, and a small lat/long readout follows the cursor while a draw tool is active, in the chosen Coordinate Format. It needs the browser's projection engine; if that cannot load, the Esri tooltip keeps its coordinates. Switching Coordinate Display to the map's spatial reference, or turning Show Tooltips off, behaves as before.

## 1.4.1 (2026-11-06)

### Added
- Settings, Units: **Fixed decimal places**. Off by default, so existing apps look the same. Turn it on and Decimal Precision applies to every value. Before this, Decimal Precision only applied to values under 10: values from 10 to 99 got one decimal fewer and values of 100 or more got none, so a precision of 1 could never show one decimal on a 54 foot line or a 1,234 square foot area. It carries through the settings XML export and import.

### Changed
- Offset Labels now also applies to the Distance label on a line. On a two-point line the label runs parallel to the line and sits beside it, so a short line is no longer covered by its own label. On a longer line the label goes on the longest segment, parallel to it, on the opposite side from that segment's own label. This works while drawing a two-point line, after finishing, while a corner is dragged, and after zooming. With Offset Labels off, the label stays centered on the line (or at the middle corner) as before.

## 1.4.0 (2026-10-08)

### Added
- Segment labels on lines and shapes are now offset so the text sits entirely clear of the segment instead of on top of it. On a line the label sits just above the segment; on a shape it sits on the outside of the edge, so labels stay out of small shapes. The label still follows the angle of its segment. The gap is 8 screen pixels and is re-placed when the map stops moving, so it keeps its size after a zoom.
- Display Options: new **Offset Labels** switch, on by default. Turn it off to get the old centered labels back. It rebuilds the segment labels straight away.
- Settings: **Offset Labels on by default** (Segment Label Styling) sets the starting state, and **Show Offset Labels Toggle** (UI Toggle Controls Visibility) hides the switch from end users. Both carry through the settings XML export and import.
- Help guide: one line about Offset Labels in the display options section.

### Changed
- Segment labels now keep their rotation while a corner is being dragged (they used to snap flat until the drag ended).
- Print-ready labels use the same offset when it is on. With it off, the old small print nudge is kept.

## 1.3.1 (2026-10-01)

### Fixed
- The measurements list (header, filter and cards) could go blank while Summary Statistics still counted the measurements. The details pane was left pointing at a measurement that no longer existed, so it rendered nothing and hid the list. The widget now drops a stale details view and shows the list again. It also does this when a measurement is removed by undo, by the Delete key on the map, or by the clear-on-tool-switch setting.

## 1.3.0 (2026-09-30)

### Added
- Delete a segment from a drawn line or shape: each segment row in the measurement details has a trash button. The first or last segment of a line is trimmed off; any other segment loses its far-end corner so the pieces on either side join up. Lines keep at least 2 corners and shapes at least 3 (the button is hidden below that, and while vertices are being edited). Totals, segments and map labels are recalculated, and the change shows an Undo link and works with Ctrl+Z and Ctrl+Y.
- Point at a segment in the details list (or tab to it) to highlight it on the map. Click it to keep it lit, bringing it into view if it is off screen; click again to let go. The highlight clears when the measurement changes or the details close.
- Settings, Power Features: **Highlight a segment on the map** and **Delete segments from drawn lines and shapes**. Both default on, and both carry through the settings XML export and import.
- Help guide: lines for both features, shown only when the switch is on, and a troubleshooting line for a missing trash button.

### Changed
- Vertex editing and segment delete now share one recalculation routine (`recalcMeasurementFromGeometry`). Numbers are unchanged.

## 1.2.5 (2026-09-18)

- Settings: a **Show help guide** option. Turn it off and the question-mark button and the first-run hint both disappear; the guide itself is untouched. Undefined means on, so apps configured before this release keep their help button.

## 1.2.4 (2026-09-18)

- Security: the beacon's session id now falls back to `crypto.getRandomValues` and then to a clock value instead of `Math.random`, which CodeQL flags as insecure randomness (shared beacon 1.1.1). The id only groups one page load's events; it is never a secret or a credential.
- Build: `tsconfig.json` is `jsx: react-jsx` with `jsxImportSource: @emotion/react`, matching the Experience Builder client. ts-loader reads the widget tsconfig, and the previous classic `jsx: react` setting made the settings panel and runtime fail with "Cannot convert undefined or null to object" after a full rebuild. No functional change.

## 1.2.3 (2026-09-18)

- Added: anonymous usage and error telemetry (shared beacon module; off unless the portal publishes an exb-beacon-sink table; telemetry: false in config disables it).

## 1.2.2 (2026-09-17)

- Packaging: the Visual Studio editor shims are no longer in the release zip. `publish.ps1` strips them from a staging copy (`$ReleaseOnlyExclude`) and refuses to zip if any ambient `declare module` of react, jimu or esri survives. The shims stay in the GitHub repo; clone users delete them before building.
- Fixed: Maps SDK 5.x (Experience Builder 1.21) compatibility. Starting the triangle tool no longer throws when view.popup is undefined; popup access is guarded and closePopup() is used when present.

## 1.2.0

### Added
- In-widget help guide (shared pattern): Help button in the header, searchable accordion guide gated on the builder's feature switches, first-run hint stored per browser and widget id.
- `src/runtime/translations/default.ts` with every help string, so the guide can be localized with the rest of the UI.

### Changed
- Visual Studio setup moved to the self-contained mode: `tsconfig.json` no longer extends Esri's `client/tsconfig.json`, and `src/exb-editor-shims.d.ts` replaces `module-shims.d.ts` and `src/emotion-jsx-runtime.d.ts`. `npx tsc -p .` reports 0 errors; the webpack build is unaffected.
- README: Visual Studio troubleshooting section.

## 1.1.0

### Added
- Session persistence (opt-in), live measurement readout in the draw banner, multi-select with bulk delete and export, list sorting, copy-to-clipboard on stats, Power Features settings section.
- `pnpm-lock.yaml` alongside `package-lock.json` for EB 1.21+.
