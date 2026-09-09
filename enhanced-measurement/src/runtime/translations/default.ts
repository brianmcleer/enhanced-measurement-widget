/*
  Every string the in-widget help guide shows. Keys follow the shared pattern used by
  Droplets, Print Advanced and Property Report so the guide reads the same in every widget.
  {tokens} in braces are filled in by helpSections.ts with the button names the builder
  has configured, so the guide always names controls exactly as the interface shows them.
*/
export default {
  _widgetLabel: 'Enhanced Measurement',

  /* Shared keys (same wording in every widget) */
  helpTitle: 'Help',
  close: 'Close',
  helpIntro: 'Draw on the map to measure distances, areas and locations, then keep, label and export what you measured.',
  helpSearchPlaceholder: 'Search the guide (try "export" or "units")',
  helpNoMatches: 'Nothing in the guide matches that word. Try another, or open the sections above.',
  helpAnd: 'and',
  firstRunTitle: 'New here?',
  firstRunBody: 'Pick a tool at the top, click on the map, and your measurement appears in the list below.',
  firstRunHelpLink: 'Open the guide.',
  firstRunDismiss: 'Dismiss',

  /* Start here */
  helpStartTitle: 'Start here: three steps',
  helpStart1: 'Click one of the tool buttons at the top, such as {distance} or {area}.',
  helpStart2: 'Click on the map to place points. Double-click to finish a line or shape.',
  helpStart3: 'Your measurement appears in the {measurements} list. Click it to see every detail.',

  /* Tools */
  helpToolsTitle: 'The tools, button by button',
  helpToolsIntro: 'Each button draws one kind of measurement. A blue bar at the top shows which tool is active.',
  helpToolPoint: '{point}: click once to record the location of a spot on the map.',
  helpToolDistance: '{distance}: click each corner of a path, then double-click to finish. You get each leg and the total.',
  helpToolFreehandLine: '{freehandLine}: hold the mouse button and drag to trace a path by hand.',
  helpToolRectangle: '{rectangle}: click one corner, then click the opposite corner.',
  helpToolArea: '{area}: click each corner of a shape, then double-click to close it. You get the area and the edge around it.',
  helpToolFreehandArea: '{freehandArea}: hold the mouse button and drag to trace a shape by hand.',
  helpToolCircle: '{circle}: click the center, then click again to set the size.',
  helpToolTriangle: '{triangle}: click three corners. Hold Shift while you draw for a triangle with equal sides.',
  helpToolLive: 'While you draw, the running length or area shows in the blue bar and on the map.',
  helpToolCancel: 'Changed your mind? Press Esc or click the x on the blue bar to stop drawing.',

  /* Cards and details */
  helpCardsTitle: 'Reading your measurements',
  helpCardsIntro: 'Every measurement is a card in the {measurements} list.',
  helpCards1: 'Click a card to open its details: every leg or edge, the total and the coordinates.',
  helpCards2: 'Double-click the name to rename it. Press Enter to keep the new name.',
  helpCards3: 'Click the colored dot to change the color of the drawing on the map.',
  helpCards4: 'The Zoom to measurement button moves the map to that measurement.',
  helpCardsCopy: 'In the details, click any value to copy it. It flashes "Copied" for a moment.',
  helpCardsSegments: 'The small badge on a card counts the legs or edges in that measurement.',

  /* Card menu */
  helpMenuTitle: 'The card menu, button by button',
  helpMenuIntro: 'Click the three dots at the right of a card.',
  helpMenuRename: 'Rename: type a new name for the measurement.',
  helpMenuDuplicate: 'Duplicate: make a copy right below the original.',
  helpMenuEdit: 'Edit vertices: drag the corners of a line or shape on the map to adjust it. Choose Stop editing when done. Points and circles cannot be edited this way.',
  helpMenuDelete: 'Delete: remove the measurement. An Undo link appears for a few seconds in case you did not mean it.',

  /* Export and import */
  helpExportTitle: 'Saving a copy',
  helpExportIntro: 'Exports download a file to your computer.',
  helpExport1: 'Click the Export button on a card to save that one measurement as {formats}.',
  helpExportAll: 'Click the Export button above the list to save every measurement at once.',
  helpExportPdf: 'PDF opens a small window first so you can choose what goes on the page.',
  helpExportPrint: 'Turn on Print-Ready Labels in {displayOptions} before a PDF export to spread the labels out so they do not overlap.',
  helpImport: 'The Import button above the list brings a GeoJSON file you exported earlier back onto the map.',

  /* Units and coordinates */
  helpUnitsTitle: 'Units and coordinates',
  helpUnitsIntro: 'Open {units} to change how numbers are shown. Everything already measured updates at once.',
  helpUnitsLinear: 'Linear Unit sets feet, meters, miles and so on for lengths.',
  helpUnitsArea: 'Area Unit sets acres, square feet, hectares and so on for areas.',
  helpUnitsCustom: 'Some apps add special units to these lists, such as chains or rods.',
  helpUnitsCoord: 'Coordinate Display switches between Web Mercator and the coordinates of the map itself. Coordinate Format switches between decimal degrees, degrees minutes seconds and degrees decimal minutes.',

  /* Display options */
  helpOptionsTitle: 'What shows on the map',
  helpOptionsIntro: 'Open {displayOptions} to turn map decorations on or off.',
  helpOptionsSegments: '{segmentLabels}: show the length of each leg or edge on the map.',
  helpOptionsTooltips: '{tooltips}: show a small label when you hover over a measurement.',
  helpOptionsSnapping: '{snapping}: make the cursor jump to nearby corners and lines while you draw.',
  helpOptionsPrint: 'Print-Ready Labels: spread out the labels so they do not overlap when exported to PDF.',

  /* Finding and organizing */
  helpOrganizeTitle: 'Finding what you measured',
  helpOrganizeFilter: 'Type in the box above the list to show only measurements whose name or type contains that word.',
  helpOrganizeSort: 'The Sort list orders by Newest, Oldest, Name or Type.',
  helpOrganizeSelect: 'With two or more measurements, click the Select multiple measurements button to select several at once, then {bulkActions} them together.',
  helpOrganizeUndo: '{undo} and {redo} step backward and forward through adds, edits and deletes. Ctrl+Z and Ctrl+Y do the same.',
  helpOrganizeClear: 'Clear All removes every measurement after asking you to confirm.',
  helpBulkExport: 'export',
  helpBulkDelete: 'delete',
  helpOrganizeStats: '{statistics} adds up totals and averages across all measurements.',

  /* Where things live */
  helpKeepTitle: 'Where things live',
  helpKeep1: 'Measurements live in this browser on this computer. Another person, or another computer, will not see them.',
  helpKeep2: 'When you come back, a bar at the top offers to bring back what you measured last time. Click Restore to bring it back or the x to discard it.',
  helpKeep3: 'Clearing your browser history and site data removes saved measurements. Export what you want to keep.',
  helpKeepNone: 'Measurements are not saved. Closing or reloading the page clears them, so export what you want to keep.',

  /* Troubleshooting */
  helpTroubleTitle: 'If something looks wrong',
  helpTroubleNoMap: 'The tools do nothing: the widget is not connected to a map. Ask whoever built this app to check the map setting.',
  helpTroubleLoading: 'It says Loading measurement tools for a long time: the map is still starting. Give it a moment, then reload the page.',
  helpTroubleDouble: 'A line or shape will not finish: double-click on the last point.',
  helpTroubleUnits: 'The numbers look far too big or small: check the unit in {units}. The measurement itself is not wrong, only the unit shown.',
  helpTroubleExport: 'An export shows an error or nothing happens: the download was blocked. Allow downloads for this site and try again.',
  helpTroubleImport: 'An import fails: the file must be GeoJSON exported from this widget. Other GeoJSON files may not have the details the widget needs.',
  helpTroubleGone: 'Measurements disappeared: they live in this browser only. Another computer or a cleared browser will not have them.',
  helpTroubleContact: 'Still stuck? Contact the GIS Division and mention the Enhanced Measurement name and this app.',

  /* Tips */
  helpTipsTitle: 'Good to know',
  helpTips1: 'Press Esc to stop drawing.',
  helpTipsUndo: 'Ctrl+Z undoes the last change and Ctrl+Y brings it back.',
  helpTips2: 'The Keyboard shortcuts button above the list shows every shortcut.',
  helpTipsShift: 'Hold Shift while drawing a triangle to make all three sides equal.',
  helpTipsColor: 'Give related measurements the same color so they stand out together on the map.'
}
