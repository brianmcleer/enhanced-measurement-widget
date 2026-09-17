# Changelog

Newest first. Every release bumps `manifest.json` and `package.json` together.

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
