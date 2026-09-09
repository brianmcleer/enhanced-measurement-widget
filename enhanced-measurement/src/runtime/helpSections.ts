import type { HelpSection } from './components/HelpPopup'

/**
 * Flags the widget computes from config and live status. One per feature that has help text.
 * widget.tsx computes these with the same `config.x !== false` checks the UI itself uses, so
 * the guide never describes a control the widget is not currently showing.
 */
export interface HelpFeatures {
  /* tools */
  point: boolean
  distance: boolean
  freehandLine: boolean
  rectangle: boolean
  area: boolean
  freehandArea: boolean
  circle: boolean
  triangle: boolean
  vertexEdit: boolean
  liveMeasurement: boolean
  /* display options */
  segmentLabelsToggle: boolean
  tooltipsToggle: boolean
  snappingToggle: boolean
  printReady: boolean
  /* units */
  unitToggle: boolean
  coordinateModeToggle: boolean
  customUnits: boolean
  /* list */
  statistics: boolean
  exportButton: boolean
  importButton: boolean
  clearAll: boolean
  undoRedo: boolean
  multiSelect: boolean
  sortOptions: boolean
  persistence: boolean
  /* button and header names as the builder configured them */
  labels: HelpLabels
}

export interface HelpLabels {
  point: string
  distance: string
  freehandLine: string
  rectangle: string
  area: string
  freehandArea: string
  circle: string
  triangle: string
  segmentLabels: string
  tooltips: string
  snapping: string
  undo: string
  redo: string
  displayOptions: string
  units: string
  statistics: string
  measurements: string
}

type T = (id: string, values?: Record<string, string>) => string

export function buildHelpSections (t: T, f: HelpFeatures): HelpSection[] {
  const L = f.labels
  const when = (on: boolean, ...ids: string[]): string[] => (on ? ids.map((id: string) => t(id)) : [])
  const listOf = (parts: string[]): string =>
    parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} ${t('helpAnd')} ${parts[parts.length - 1]}`

  const anyTool = f.point || f.distance || f.freehandLine || f.rectangle || f.area || f.freehandArea || f.circle || f.triangle
  const anyDisplayOption = f.segmentLabelsToggle || f.tooltipsToggle || f.snappingToggle || f.printReady
  const anyUnits = f.unitToggle || f.coordinateModeToggle

  /* Start here names the first two enabled tools so the steps match the buttons on screen. */
  const startTools = [
    ...(f.distance ? [L.distance] : []), ...(f.area ? [L.area] : []), ...(f.point ? [L.point] : []),
    ...(f.rectangle ? [L.rectangle] : []), ...(f.circle ? [L.circle] : []), ...(f.freehandLine ? [L.freehandLine] : []),
    ...(f.freehandArea ? [L.freehandArea] : []), ...(f.triangle ? [L.triangle] : [])
  ]
  const startA = startTools[0] ?? L.distance
  const startB = startTools[1] ?? startTools[0] ?? L.area

  const formats = listOf(['CSV', 'PDF', 'JSON', 'GeoJSON'])
  const bulkActions = listOf([t('helpBulkExport'), t('helpBulkDelete')])

  const sections: HelpSection[] = [
    {
      key: 'start',
      icon: 'play',
      title: t('helpStartTitle'),
      ordered: true,
      body: [
        t('helpStart1', { distance: startA, area: startB }),
        t('helpStart2'),
        t('helpStart3', { measurements: L.measurements })
      ]
    }
  ]

  if (anyTool) {
    sections.push({
      key: 'tools',
      icon: 'measure',
      title: t('helpToolsTitle'),
      intro: t('helpToolsIntro'),
      body: [
        ...(f.point ? [t('helpToolPoint', { point: L.point })] : []),
        ...(f.distance ? [t('helpToolDistance', { distance: L.distance })] : []),
        ...(f.freehandLine ? [t('helpToolFreehandLine', { freehandLine: L.freehandLine })] : []),
        ...(f.rectangle ? [t('helpToolRectangle', { rectangle: L.rectangle })] : []),
        ...(f.area ? [t('helpToolArea', { area: L.area })] : []),
        ...(f.freehandArea ? [t('helpToolFreehandArea', { freehandArea: L.freehandArea })] : []),
        ...(f.circle ? [t('helpToolCircle', { circle: L.circle })] : []),
        ...(f.triangle ? [t('helpToolTriangle', { triangle: L.triangle })] : []),
        ...when(f.liveMeasurement, 'helpToolLive'),
        t('helpToolCancel')
      ]
    })
  }

  sections.push({
    key: 'cards',
    icon: 'list',
    title: t('helpCardsTitle'),
    intro: t('helpCardsIntro', { measurements: L.measurements }),
    body: [t('helpCards1'), t('helpCards2'), t('helpCards3'), t('helpCards4'), t('helpCardsCopy'), t('helpCardsSegments')]
  })

  sections.push({
    key: 'menu',
    icon: 'ellipsis',
    title: t('helpMenuTitle'),
    intro: t('helpMenuIntro'),
    body: [
      t('helpMenuRename'),
      t('helpMenuDuplicate'),
      ...when(f.vertexEdit, 'helpMenuEdit'),
      t('helpMenuDelete')
    ]
  })

  if (f.exportButton || f.importButton) {
    sections.push({
      key: 'export',
      icon: 'export',
      title: t('helpExportTitle'),
      intro: t('helpExportIntro'),
      body: [
        ...(f.exportButton ? [t('helpExport1', { formats }), t('helpExportAll'), t('helpExportPdf')] : []),
        ...(f.exportButton && f.printReady ? [t('helpExportPrint', { displayOptions: L.displayOptions })] : []),
        ...when(f.importButton, 'helpImport')
      ]
    })
  }

  if (anyUnits) {
    sections.push({
      key: 'units',
      icon: 'globe',
      title: t('helpUnitsTitle'),
      intro: t('helpUnitsIntro', { units: L.units }),
      body: [
        ...when(f.unitToggle, 'helpUnitsLinear', 'helpUnitsArea'),
        ...when(f.unitToggle && f.customUnits, 'helpUnitsCustom'),
        ...when(f.coordinateModeToggle, 'helpUnitsCoord')
      ]
    })
  }

  if (anyDisplayOption) {
    sections.push({
      key: 'options',
      icon: 'gear',
      title: t('helpOptionsTitle'),
      intro: t('helpOptionsIntro', { displayOptions: L.displayOptions }),
      body: [
        ...(f.segmentLabelsToggle ? [t('helpOptionsSegments', { segmentLabels: L.segmentLabels })] : []),
        ...(f.tooltipsToggle ? [t('helpOptionsTooltips', { tooltips: L.tooltips })] : []),
        ...(f.snappingToggle ? [t('helpOptionsSnapping', { snapping: L.snapping })] : []),
        ...when(f.printReady, 'helpOptionsPrint')
      ]
    })
  }

  sections.push({
    key: 'organize',
    icon: 'search',
    title: t('helpOrganizeTitle'),
    body: [
      t('helpOrganizeFilter'),
      ...when(f.sortOptions, 'helpOrganizeSort'),
      ...(f.multiSelect ? [t('helpOrganizeSelect', { bulkActions })] : []),
      ...(f.undoRedo ? [t('helpOrganizeUndo', { undo: L.undo, redo: L.redo })] : []),
      ...when(f.clearAll, 'helpOrganizeClear'),
      ...(f.statistics ? [t('helpOrganizeStats', { statistics: L.statistics })] : [])
    ]
  })

  sections.push({
    key: 'keep',
    icon: 'folder',
    title: t('helpKeepTitle'),
    body: f.persistence
      ? [t('helpKeep1'), t('helpKeep2'), t('helpKeep3')]
      : [t('helpKeepNone')]
  })

  sections.push({
    key: 'trouble',
    icon: 'exclamation-mark-triangle',
    title: t('helpTroubleTitle'),
    body: [
      t('helpTroubleNoMap'),
      t('helpTroubleLoading'),
      ...when(f.distance || f.area || f.freehandLine || f.freehandArea, 'helpTroubleDouble'),
      ...(f.unitToggle ? [t('helpTroubleUnits', { units: L.units })] : []),
      ...when(f.exportButton, 'helpTroubleExport'),
      ...when(f.importButton, 'helpTroubleImport'),
      ...when(f.persistence, 'helpTroubleGone'),
      t('helpTroubleContact')
    ]
  })

  sections.push({
    key: 'tips',
    icon: 'lightbulb',
    title: t('helpTipsTitle'),
    body: [
      t('helpTips1'),
      ...when(f.undoRedo, 'helpTipsUndo'),
      t('helpTips2'),
      ...when(f.triangle, 'helpTipsShift'),
      t('helpTipsColor')
    ]
  })

  return sections
}
