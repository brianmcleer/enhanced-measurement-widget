# enhanced-measurement-widget

Comprehensive measurement widget for ArcGIS Experience Builder, by Brian McLeer (GIS Administrator/Developer, City of Grand Junction, CO).

The widget supports eight measurement tool types (point, distance, area, circle, rectangle, triangle, freehand polyline, freehand polygon), with custom units, segment labeling, statistics, multiple export formats (JSON, CSV, GeoJSON, PDF), XML import/export of widget settings, undo/redo, vertex editing, and extensive UI customization.

## Download

Latest release: https://github.com/brianmcleer/enhanced-measurement-widget/releases

You can also browse the post on Esri Community:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## Repository layout

```
enhanced-measurement-widget/
├── README.md             <- this file (GitHub landing page)
├── LICENSE               <- Apache-2.0
├── .gitignore
├── publish.ps1           <- one-command sync + push + release script
└── enhanced-measurement/ <- the actual widget (drops into your-extensions/widgets)
    ├── package.json
    ├── package-lock.json
    ├── manifest.json
    ├── config.json
    ├── icon.svg
    ├── README.md
    ├── LICENSE
    ├── .gitignore
    ├── .npmignore
    └── src/
        ├── runtime/
        │   ├── widget.tsx
        │   └── style.css
        └── setting/
            └── setting.tsx
```

The `enhanced-measurement` subfolder is the shippable widget. Drop it into your Experience Builder install at `client/your-extensions/widgets/enhanced-measurement/`. See [enhanced-measurement/README.md](./enhanced-measurement/README.md) for full install steps and troubleshooting.

## Requirements

- Experience Builder Developer Edition 1.19 or 1.20 (React 19). EB 1.18 and earlier are not supported.
- The widget's dependencies (`@turf/turf`, `jspdf`) install automatically with the standard EB client install, because they are listed in the widget's `package.json` inside `your-extensions/widgets/`.

## Updating the widget on GitHub

Use `publish.ps1` from the repo root. The script syncs the widget files from your EB install (skipping `node_modules` and `.vs`), commits, pushes, and optionally cuts a versioned release.

Normal update:

```
powershell -ExecutionPolicy Bypass -File .\publish.ps1
```

Update plus a new tagged release:

```
powershell -ExecutionPolicy Bypass -File .\publish.ps1 -Release v1.1.0
```

Edit the three variables at the top of `publish.ps1` once (widget name, repo name, EB widget path) if you ever rename the widget or move your EB install.

## Feedback

Open an issue on the Esri Community post above for bug reports and enhancement requests:
https://community.esri.com/t5/experience-builder-custom-widgets/enhanced-measurement-widget/ba-p/1664211

## License

Apache License, Version 2.0. See [LICENSE](./LICENSE).

Copyright (c) 2026 City of Grand Junction, CO
