# Changelog

Newest first. Every release bumps `manifest.json` and `package.json` together.

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
