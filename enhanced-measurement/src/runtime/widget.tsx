/* eslint-disable eslint-comments/no-unlimited-disable -- intentional file-wide disable */
/* eslint-disable */
/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { React, jsx, WidgetState as JimuWidgetState } from 'jimu-core';
import type { AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, loadArcGISJSAPIModules } from 'jimu-arcgis';
import type { JimuMapView } from 'jimu-arcgis';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import './style.css';

// Dropdown Menu Components (shadcn/ui style) - WCAG 2.1 AA Accessible
const DropdownMenuSeparator = () => (
    <div
        role="separator"
        aria-orientation="horizontal"
        style={{
            height: '1px',
            backgroundColor: '#e5e7eb',
            margin: '0.25rem 0'
        }}
    />
);

interface DropdownMenuProps {
    children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => (
    <div className="dropdown-menu-root">{children}</div>
);

interface DropdownMenuTriggerProps {
    className?: string;
    children: React.ReactNode;
    isOpen?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    title?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
    id?: string;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
    ({ className = "", children, isOpen, style, title, 'aria-label': ariaLabel, id, ...props }, ref) => (
        <button
            ref={ref}
            id={id}
            className={`dropdown-trigger ${className}`}
            aria-haspopup="menu"
            aria-expanded={isOpen || false}
            aria-label={ariaLabel || title}
            title={title}
            style={{
                backgroundColor: isOpen ? '#f3f4f6' : 'transparent',
                borderColor: isOpen ? '#d1d5db' : 'transparent',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    )
);

interface DropdownMenuContentProps {
    className?: string;
    children: React.ReactNode;
    triggerRef?: HTMLElement;
    'aria-labelledby'?: string;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
    ({ className = "", children, triggerRef, 'aria-labelledby': ariaLabelledby, ...props }, ref) => {
        const [position, setPosition] = React.useState({ top: 0, right: 0 });
        const menuRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            if (triggerRef) {
                const rect = triggerRef.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 4,
                    right: window.innerWidth - rect.right
                });
            }
        }, [triggerRef]);

        // Focus trap and keyboard navigation
        React.useEffect(() => {
            const menu = menuRef.current;
            if (!menu) return;

            const focusableItems = menu.querySelectorAll('[role="menuitem"]:not([disabled])') as NodeListOf<HTMLElement>;
            if (focusableItems.length > 0) {
                focusableItems[0].focus();
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                const items: HTMLElement[] = Array.from(focusableItems);
                const currentIndex = items.findIndex(item => item === document.activeElement);

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                        items[nextIndex]?.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                        items[prevIndex]?.focus();
                        break;
                    case 'Home':
                        e.preventDefault();
                        items[0]?.focus();
                        break;
                    case 'End':
                        e.preventDefault();
                        items[items.length - 1]?.focus();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        triggerRef?.focus();
                        break;
                }
            };

            menu.addEventListener('keydown', handleKeyDown);
            return () => {
                menu.removeEventListener('keydown', handleKeyDown);
                // Restore focus to the trigger when the menu unmounts (e.g. after item click).
                // Only if focus has fallen back to body — don't steal focus from anywhere intentional.
                if (triggerRef && (document.activeElement === document.body || document.activeElement === null)) {
                    try { triggerRef.focus(); } catch (_) { /* trigger may have unmounted */ }
                }
            };
        }, [triggerRef]);

        return (
            <div
                ref={(node) => {
                    menuRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) ref.current = node;
                }}
                role="menu"
                aria-labelledby={ariaLabelledby}
                aria-orientation="vertical"
                className={`dropdown-content ${className}`}
                style={{
                    position: 'fixed',
                    top: `${position.top}px`,
                    right: `${position.right}px`,
                    zIndex: 99999,
                    minWidth: '10rem',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    padding: '0.5rem',
                    animation: 'dropdown-in 0.15s ease-out'
                }}
                {...props}
            >
                <style>
                    {`
                    @keyframes dropdown-in {
                        from {
                            opacity: 0;
                            transform: scale(0.95) translateY(-4px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        @keyframes dropdown-in {
                            from { opacity: 1; transform: none; }
                            to { opacity: 1; transform: none; }
                        }
                    }
                `}
                </style>
                {children}
            </div>
        );
    }
);

interface DropdownMenuItemProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
    ({ className = "", children, disabled, ...props }, ref) => (
        <button
            ref={ref}
            role="menuitem"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={`dropdown-item ${className}`}
            style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                borderRadius: '0.25rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                color: disabled ? '#9ca3af' : '#374151',
                transition: 'all 0.15s ease-in-out',
                gap: '0.5rem',
                opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#f3f4f6';
                    target.style.color = '#1f2937';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = 'transparent';
                    target.style.color = '#374151';
                }
            }}
            {...props}
        >
            {children}
        </button>
    )
);

interface HistoryAction {
    type: 'ADD' | 'DELETE' | 'MODIFY';
    measurement: MeasurementRecord;
    previousMeasurement?: MeasurementRecord; // For MODIFY actions
}

interface WidgetState {
    jimuMapView: JimuMapView;
    measurements: MeasurementRecord[];
    currentTool: 'point' | 'distance' | 'freehand-polyline' | 'rectangle' | 'area' | 'freehand-polygon' | 'circle' | 'triangle' | 'edit' | null;
    editingMeasurementId: string | null;
    expandedMeasurements: Set<string>;
    sketchWidget: any;
    modulesLoaded: boolean;
    moduleLoadError: string | null;
    currentLinearUnit: string;
    currentAreaUnit: string;
    coordinateDisplayMode: 'webmercator' | 'input';
    coordinateFormat: 'decimal' | 'dms' | 'ddm';
    showStatistics: boolean;
    showDisplayOptions: boolean;
    showUnits: boolean;
    showSegmentLabels: boolean;
    showTooltips: boolean;
    enableSnapping: boolean;
    liveMeasurement: { value: string; type: string } | null;
    liveLabelGraphic: any | null;
    exportAllDropdownOpen: boolean;
    exportDropdownOpen: { [key: string]: boolean };
    overflowDropdownOpen: { [key: string]: boolean };
    showClearAllDialog: boolean;
    showImportSuccessDialog: boolean;
    printReadyLabels: boolean;
    importSuccessMessage: string;
    importErrorMessage: string;
    showImportErrorDialog: boolean;
    trianglePoints: any[];
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];
    /** UI-only: which measurement is being inline-renamed and the temp value */
    renamingMeasurementId: string | null;
    renamingValue: string;
    /** UI-only: which measurement's color picker popover is open */
    colorPickerForId: string | null;
    /** Transient toast for undoable actions (delete) */
    undoToast: { message: string; action: HistoryAction | null; bulkCount?: number } | null;
    /** Filter text typed in the measurements list */
    measurementFilter: string;
    /** How many measurements to render (paged list for perf with large counts) */
    visibleMeasurementCount: number;
    /** Whether the keyboard-shortcuts help popover is open */
    showShortcutsHelp: boolean;
    /** Whether a heavy PDF export is in progress (shows a non-blocking spinner) */
    isExportingPDF: boolean;
    /** PDF export options dialog visibility */
    showPDFExportDialog: boolean;
    /** Pending PDF export target — either a single measurement or 'all' */
    pendingPDFExport: { kind: 'one' | 'all'; measurement?: MeasurementRecord } | null;
    /** When non-null, the list is replaced by a full-pane detail view for this measurement. */
    detailViewMeasurementId: string | null;
    /** Captured scroll position of the list so we can restore it on exiting detail view. */
    listScrollTop: number;
    /** Number of measurements found in localStorage from a prior session, or null when no banner should show. */
    restoreBannerCount: number | null;
    /** Multi-select mode: cards show checkboxes and bulk actions replace the header. */
    selectMode: boolean;
    /** IDs currently checked while in select mode. */
    selectedIds: Set<string>;
    /** List sort order. */
    sortOrder: 'newest' | 'oldest' | 'name' | 'type';
    /** Detail-stat key that was just copied to clipboard, for the transient "Copied" flash. */
    copiedStatKey: string | null;
}

interface MeasurementRecord {
    id: string;
    type: 'point' | 'distance' | 'area' | 'circle' | 'triangle';
    timestamp: Date;
    segments: SegmentRecord[];
    totalDistance?: number;
    totalArea?: number;
    perimeter?: number;
    radius?: number;
    sideLength?: number;
    coordinates?: {
        x: number;
        y: number;
        lat: number;
        lon: number;
        spatialReference?: any;
    };
    linearUnit: string;
    areaUnit: string;
    label: string;
    geometry: any;
    geojson: any;
    graphic: any;
    color: string;
}

interface SegmentRecord {
    id: string;
    distance: number;
    startPoint: { x: number; y: number; lat: number; lon: number };
    endPoint: { x: number; y: number; lat: number; lon: number };
    label: string;
    spatialReference?: any;
}

// EB 1.21 type-only fix: the 1.21 types may not surface builder-injected props
// (e.g. id). Intersection restores them at the type level only.
type WidgetProps = AllWidgetProps<any> & {
    id: string;
    useMapWidgetIds?: string[] | any;
};

export default class EnhancedMeasurement extends React.PureComponent<WidgetProps, WidgetState> {
    // EB 1.21 editor fallback: some Visual Studio TypeScript services cannot resolve
    // React's class typings through pnpm layouts, which makes every this.props /
    // this.state / this.setState reference error. These `declare` members restate the
    // inherited types explicitly. `declare` emits no JavaScript, so runtime behavior
    // is untouched, and when React's types do resolve these are compatible
    // redeclarations that change nothing.
    declare props: Readonly<WidgetProps>;
    declare state: Readonly<WidgetState>;
    declare setState: <K extends keyof WidgetState>(
        state: ((prevState: Readonly<WidgetState>, props: Readonly<WidgetProps>) => Pick<WidgetState, K> | WidgetState | null) | Pick<WidgetState, K> | WidgetState | null,
        callback?: () => void
    ) => void;
    declare forceUpdate: (callback?: () => void) => void;

    private Sketch: any = null;
    private GraphicsLayer: any = null;
    private Graphic: any = null;
    private Point: any = null;
    private Polyline: any = null;
    private Polygon: any = null;
    private TextSymbol: any = null;
    private SimpleLineSymbol: any = null;
    private SimpleFillSymbol: any = null;
    private SimpleMarkerSymbol: any = null;
    private webMercatorUtils: any = null;
    private projection: any = null;
    private SpatialReference: any = null;
    private geometryEngine: any = null;
    private FeatureSnappingLayerSource: any = null;

    private sketchLayer: any = null;
    private labelLayer: any = null;
    private measurementCount: number = 0;
    private fileInputRef: HTMLInputElement | null = null;
    private colorPalette: string[] = [];
    private exportAllTriggerRef: HTMLElement | null = null;
    private triangleClickHandler: any = null;
    private triangleGraphicsLayer: any = null;
    private keydownHandler: any = null;
    private keyupHandler: any = null;
    private trianglePreviewGraphics: any[] = [];
    private widgetContainerRef: HTMLDivElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    /** Track mounted state so async callbacks (module loads, file reads, Esri callbacks) can avoid calling setState after unmount. */
    private _isMounted: boolean = false;
    /** Sketch handler refs we keep for explicit removal when switching map views (instead of leaking on the old SketchViewModel). */
    private sketchHandlers: any[] = [];
    /** Refs map keyed by measurement id — replaces leaky `this[`exportTrigger_${id}`]` properties so we can clean up on delete. */
    private exportTriggerRefs: Map<string, HTMLElement | null> = new Map();
    private overflowTriggerRefs: Map<string, HTMLElement | null> = new Map();
    /** Cached statistics + invalidation token so getStatistics() is O(1) per render after the first compute. */
    private _statsCache: { token: any; value: any } | null = null;
    /** Pending undo-delete toast timer so it can be cancelled if a new delete happens or the user clicks Undo. */
    private deleteToastTimer: any = null;
    /** Ref to the scrollable list container so we can capture/restore scrollTop when drilling in/out of detail view. */
    private listScrollRef: HTMLDivElement | null = null;
    /** Debounce timer for localStorage persistence. */
    private persistTimer: any = null;
    /** Timer for the transient "Copied" flash in the detail view. */
    private copiedFlashTimer: any = null;

    constructor(props) {
        super(props);

        // Initialize color palette from config
        this.updateColorPalette(props.config);

        // Get initial settings from config
        const config = props.config || {};

        this.state = {
            jimuMapView: null,
            measurements: [],
            currentTool: null,
            editingMeasurementId: null,
            expandedMeasurements: new Set(),
            sketchWidget: null,
            modulesLoaded: false,
            moduleLoadError: null,
            currentLinearUnit: config.defaultLinearUnit || 'miles',
            currentAreaUnit: config.defaultAreaUnit || 'acres',
            coordinateDisplayMode: 'webmercator',
            coordinateFormat: config.coordinateFormat || 'decimal',
            showStatistics: config.defaultStatisticsState === true,
            showDisplayOptions: config.defaultDisplayOptionsState === true,
            showUnits: config.defaultUnitsState === true,
            showSegmentLabels: config.defaultSegmentLabelsState !== undefined ? config.defaultSegmentLabelsState : true,
            enableSnapping: config.defaultSnappingState === true,
            showTooltips: config.defaultTooltipsState !== undefined ? config.defaultTooltipsState : true,
            liveMeasurement: null,
            liveLabelGraphic: null,
            exportAllDropdownOpen: false,
            exportDropdownOpen: {},
            overflowDropdownOpen: {},
            showClearAllDialog: false,
            showImportSuccessDialog: false,
            showImportErrorDialog: false,
            importSuccessMessage: '',
            importErrorMessage: '',
            printReadyLabels: false,
            trianglePoints: [],
            undoStack: [],
            redoStack: [],
            renamingMeasurementId: null,
            renamingValue: '',
            colorPickerForId: null,
            undoToast: null,
            measurementFilter: '',
            visibleMeasurementCount: 50,
            showShortcutsHelp: false,
            isExportingPDF: false,
            showPDFExportDialog: false,
            pendingPDFExport: null,
            detailViewMeasurementId: null,
            listScrollTop: 0,
            restoreBannerCount: null,
            selectMode: false,
            selectedIds: new Set(),
            sortOrder: 'newest',
            copiedStatKey: null
        };
    }

    updateColorPalette(config: any) {
        const useColorPalette = config?.useColorPalette !== false;

        if (useColorPalette) {
            // Use color palette array if available
            if (config?.colorPalette && Array.isArray(config.colorPalette)) {
                this.colorPalette = config.colorPalette;
            } else {
                // Fallback to individual properties or defaults
                this.colorPalette = [
                    config?.colorPalette1 || '#3b82f6',
                    config?.colorPalette2 || '#ef4444',
                    config?.colorPalette3 || '#10b981',
                    config?.colorPalette4 || '#f59e0b',
                    config?.colorPalette5 || '#8b5cf6',
                    config?.colorPalette6 || '#ec4899',
                    config?.colorPalette7 || '#14b8a6',
                    config?.colorPalette8 || '#f97316',
                    config?.colorPalette9 || '#6366f1',
                    config?.colorPalette10 || '#84cc16'
                ];
            }
        } else {
            const primaryColor = config?.primaryColor || '#3b82f6';
            this.colorPalette = Array(10).fill(primaryColor);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // Persist to localStorage whenever measurements change (debounced, config-gated)
        if (prevState && prevState.measurements !== this.state.measurements) {
            this.schedulePersist();
        }

        // Check if widget was closed - deactivate any active measurement tool
        if (prevProps.state !== this.props.state && this.props.state === JimuWidgetState.Closed) {
            if (this.state.currentTool) {
                // Cancel any active sketch operation
                if (this.state.sketchWidget) {
                    this.state.sketchWidget.cancel();
                }
                // Clear live measurement label
                this.clearLiveLabel();
                // Cleanup triangle handlers if active
                if (typeof this.cleanupTriangleHandlers === 'function') {
                    this.cleanupTriangleHandlers();
                }
                // Reset current tool state
                this.setState({
                    currentTool: null,
                    liveMeasurement: null,
                    trianglePoints: [],
                    editingMeasurementId: null
                });
            }
        }

        // Update color palette if config changed
        if (prevProps.config !== this.props.config) {
            this.updateColorPalette(this.props.config);

            const prevConfig = prevProps.config || {};
            const config = this.props.config || {};

            // Only sync these unit-related preferences from config if the *defaults
            // in config themselves changed* — never overwrite a value the user
            // has actively chosen via the in-widget dropdown.
            const syncPatch: Partial<WidgetState> = {};
            if (prevConfig.defaultLinearUnit !== config.defaultLinearUnit && this.state.currentLinearUnit === (prevConfig.defaultLinearUnit || 'miles')) {
                syncPatch.currentLinearUnit = config.defaultLinearUnit || 'miles';
            }
            if (prevConfig.defaultAreaUnit !== config.defaultAreaUnit && this.state.currentAreaUnit === (prevConfig.defaultAreaUnit || 'acres')) {
                syncPatch.currentAreaUnit = config.defaultAreaUnit || 'acres';
            }
            if (prevConfig.coordinateFormat !== config.coordinateFormat && this.state.coordinateFormat === (prevConfig.coordinateFormat || 'decimal')) {
                syncPatch.coordinateFormat = config.coordinateFormat || 'decimal';
            }
            if (Object.keys(syncPatch).length > 0) {
                this.safeSetState(syncPatch as any);
            }

            // Update sketch widget tooltips based on current toggle state
            if (this.state.sketchWidget) {
                this.state.sketchWidget.tooltipOptions = {
                    enabled: this.state.showTooltips
                };
            }
        }
    }

    updateSnappingConfiguration(enabled: boolean) {
        if (!this.state.sketchWidget || !this.state.jimuMapView) return;

        try {
            this.state.sketchWidget.snappingOptions = {
                enabled: enabled,
                featureEnabled: enabled,
                selfEnabled: enabled
            };

            if (enabled) {
                // Configure feature snapping with all available feature layers.
                // SnappingOptions.featureSources autocasts plain { layer, enabled } objects
                // in JSAPI 5.0, so no need to load FeatureSnappingLayerSource explicitly.
                const featureSources = [];
                const map = this.state.jimuMapView.view.map;

                map.allLayers.forEach((layer: any) => {
                    if (layer.type === 'feature' && layer !== this.sketchLayer && layer !== this.labelLayer) {
                        featureSources.push({ layer: layer, enabled: true });
                    }
                });

                if (featureSources.length > 0) {
                    this.state.sketchWidget.snappingOptions.featureSources = featureSources;
                }
            }
        } catch (error) {
            console.error('Error updating snapping configuration:', error);
        }
    }

    async componentDidMount() {
        this._isMounted = true;
        await this.loadModules();
        document.addEventListener('click', this.handleDocumentClick);
        // Add click outside handler for dropdowns
        document.addEventListener('click', this.handleClickOutside);
        // Add keyboard shortcuts for undo/redo
        document.addEventListener('keydown', this.handleKeyDown);
        // Surface the restore banner if a saved session exists (config-gated)
        this.checkForSavedSession();
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this.deleteToastTimer) { clearTimeout(this.deleteToastTimer); this.deleteToastTimer = null; }
        if (this.persistTimer) {
            // Flush the pending save synchronously so a fast page close never loses data
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
            if (this.persistenceEnabled()) {
                try {
                    if (this.state.measurements.length === 0) {
                        window.localStorage.removeItem(this.persistenceKey);
                    } else {
                        const fc = this.buildGeoJSONFeatureCollection(this.state.measurements);
                        window.localStorage.setItem(this.persistenceKey, JSON.stringify(fc));
                    }
                } catch (err) { /* non-fatal */ }
            }
        }
        if (this.copiedFlashTimer) { clearTimeout(this.copiedFlashTimer); this.copiedFlashTimer = null; }
        this.cleanup();
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleKeyDown);

        // Clean up ResizeObserver
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    /** setState wrapper that no-ops after unmount — eliminates the "Can't perform a React state update on an unmounted component" warnings from async paths. */
    safeSetState(patch: any, cb?: () => void) {
        if (!this._isMounted) return;
        this.setState(patch, cb);
    }

    handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.export-dropdown-container')) {
            this.closeAllDropdowns();
        }
    }

    handleClickOutside = (event: MouseEvent) => {
        // Close dropdowns when clicking outside
        const target = event.target as Element;
        if (!target.closest('.dropdown-menu-root')) {
            this.setState({
                exportAllDropdownOpen: false,
                exportDropdownOpen: {}
            });
        }
    };

    handleKeyDown = (event: KeyboardEvent) => {
        const config = this.props.config || {};
        const enableUndoRedo = config.enableUndoRedo !== false;

        // Esc priority:
        // 1) If a detail view is open, close it (no other handlers fire)
        // 2) Otherwise, cancel the active drawing tool
        if (event.key === 'Escape') {
            const target = event.target as HTMLElement;
            const inEditable = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );
            const dialogOpen = this.state.showClearAllDialog || this.state.showImportSuccessDialog || this.state.showImportErrorDialog || this.state.showPDFExportDialog || this.state.showShortcutsHelp;
            if (!inEditable && !dialogOpen) {
                if (this.state.detailViewMeasurementId) {
                    event.preventDefault();
                    this.exitDetailView();
                    return;
                }
                if (this.state.currentTool) {
                    event.preventDefault();
                    this.activateTool(this.state.currentTool as any);
                    return;
                }
            }
        }

        if (!enableUndoRedo) return;

        // Check for Ctrl+Z (Undo) or Cmd+Z on Mac
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.undo();
        }
        // Check for Ctrl+Y (Redo) or Ctrl+Shift+Z (Redo) or Cmd+Shift+Z on Mac
        else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
            event.preventDefault();
            this.redo();
        }
    };

    recordAction(action: HistoryAction) {
        const config = this.props.config || {};
        const enableUndoRedo = config.enableUndoRedo !== false;
        const maxUndoSteps = 50; // Default max history depth

        if (!enableUndoRedo) return;

        this.setState(prevState => {
            const newUndoStack = [...prevState.undoStack, action];

            // Limit stack size
            if (newUndoStack.length > maxUndoSteps) {
                newUndoStack.shift();
            }

            return {
                undoStack: newUndoStack,
                redoStack: [] // Clear redo stack when new action is performed
            };
        });
    }

    canUndo(): boolean {
        return this.state.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.state.redoStack.length > 0;
    }

    undo() {
        if (!this.canUndo()) return;

        const action = this.state.undoStack[this.state.undoStack.length - 1];

        if (action.type === 'ADD') {
            // Undo ADD: remove the measurement
            const measurement = this.state.measurements.find(m => m.id === action.measurement.id);
            if (measurement) {
                // Remove graphics
                this.sketchLayer.remove(measurement.graphic);

                // Remove all labels associated with this measurement
                const labelsToRemove = this.labelLayer.graphics.filter(g => {
                    return g.attributes && g.attributes.measurementId === action.measurement.id;
                });
                labelsToRemove.forEach(label => this.labelLayer.remove(label));

                // Update state
                this.setState(prevState => ({
                    measurements: prevState.measurements.filter(m => m.id !== action.measurement.id),
                    expandedMeasurements: new Set(
                        Array.from(prevState.expandedMeasurements).filter(id => id !== action.measurement.id)
                    ),
                    undoStack: prevState.undoStack.slice(0, -1),
                    redoStack: [...prevState.redoStack, action]
                }));
            }
        } else if (action.type === 'DELETE') {
            // Undo DELETE: restore the measurement
            const measurement = action.measurement;

            // Re-add the graphic
            this.sketchLayer.add(measurement.graphic);

            // Re-add labels
            this.addLabelsForMeasurement(measurement);

            // Update state
            this.setState(prevState => ({
                measurements: [...prevState.measurements, measurement],
                undoStack: prevState.undoStack.slice(0, -1),
                redoStack: [...prevState.redoStack, action]
            }));
        } else if (action.type === 'MODIFY' && action.previousMeasurement) {
            // Undo MODIFY: restore previous state
            const currentMeasurement = this.state.measurements.find(m => m.id === action.measurement.id);
            if (currentMeasurement) {
                // Remove current graphic and labels
                this.sketchLayer.remove(currentMeasurement.graphic);
                const labelsToRemove = this.labelLayer.graphics.filter(g => {
                    return g.attributes && g.attributes.measurementId === action.measurement.id;
                });
                labelsToRemove.forEach(label => this.labelLayer.remove(label));

                // Restore previous graphic and labels
                this.sketchLayer.add(action.previousMeasurement.graphic);
                this.addLabelsForMeasurement(action.previousMeasurement);

                // Update state
                this.setState(prevState => ({
                    measurements: prevState.measurements.map(m =>
                        m.id === action.measurement.id ? action.previousMeasurement : m
                    ),
                    undoStack: prevState.undoStack.slice(0, -1),
                    redoStack: [...prevState.redoStack, action]
                }));
            }
        }
    }

    redo() {
        if (!this.canRedo()) return;

        const action = this.state.redoStack[this.state.redoStack.length - 1];

        if (action.type === 'ADD') {
            // Redo ADD: add the measurement back
            const measurement = action.measurement;

            // Re-add the graphic
            this.sketchLayer.add(measurement.graphic);

            // Re-add labels
            this.addLabelsForMeasurement(measurement);

            // Update state
            this.setState(prevState => ({
                measurements: [...prevState.measurements, measurement],
                undoStack: [...prevState.undoStack, action],
                redoStack: prevState.redoStack.slice(0, -1)
            }));
        } else if (action.type === 'DELETE') {
            // Redo DELETE: remove the measurement again
            const measurement = this.state.measurements.find(m => m.id === action.measurement.id);
            if (measurement) {
                // Remove graphics
                this.sketchLayer.remove(measurement.graphic);

                // Remove all labels
                const labelsToRemove = this.labelLayer.graphics.filter(g => {
                    return g.attributes && g.attributes.measurementId === action.measurement.id;
                });
                labelsToRemove.forEach(label => this.labelLayer.remove(label));

                // Update state
                this.setState(prevState => ({
                    measurements: prevState.measurements.filter(m => m.id !== action.measurement.id),
                    expandedMeasurements: new Set(
                        Array.from(prevState.expandedMeasurements).filter(id => id !== action.measurement.id)
                    ),
                    undoStack: [...prevState.undoStack, action],
                    redoStack: prevState.redoStack.slice(0, -1)
                }));
            }
        } else if (action.type === 'MODIFY') {
            // Redo MODIFY: apply the modification again
            const previousMeasurement = this.state.measurements.find(m => m.id === action.measurement.id);
            if (previousMeasurement) {
                // Remove current graphic and labels
                this.sketchLayer.remove(previousMeasurement.graphic);
                const labelsToRemove = this.labelLayer.graphics.filter(g => {
                    return g.attributes && g.attributes.measurementId === action.measurement.id;
                });
                labelsToRemove.forEach(label => this.labelLayer.remove(label));

                // Apply modified graphic and labels
                this.sketchLayer.add(action.measurement.graphic);
                this.addLabelsForMeasurement(action.measurement);

                // Update state
                this.setState(prevState => ({
                    measurements: prevState.measurements.map(m =>
                        m.id === action.measurement.id ? action.measurement : m
                    ),
                    undoStack: [...prevState.undoStack, action],
                    redoStack: prevState.redoStack.slice(0, -1)
                }));
            }
        }
    }

    addLabelsForMeasurement(measurement: MeasurementRecord) {
        // Add main label
        const labelText = this.getMeasurementLabelText(measurement);
        const labelGraphic = this.createLabelGraphic(measurement.geometry, labelText, measurement.id, measurement.color);
        this.labelLayer.add(labelGraphic);

        // Add segment labels if applicable and enabled
        // Skip segment labels for polylines with only 2 vertices (single segment) - show only total
        const geometry = measurement.geometry;
        const isSimpleLine = geometry.type === 'polyline' && geometry.paths[0] && geometry.paths[0].length === 2;

        if (this.state.showSegmentLabels && measurement.segments && measurement.segments.length > 0 && !isSimpleLine) {
            measurement.segments.forEach((segment, index) => {
                const segmentLabelGraphic = this.createSegmentLabelGraphic(segment, measurement, index);
                this.labelLayer.add(segmentLabelGraphic);
            });
        }
    }


    getMeasurementLabelText(measurement: MeasurementRecord): string {
        const geometry = measurement.geometry;
        let labelText: string;

        if (geometry.type === 'point') {
            labelText = this.getPointLabelText(measurement.coordinates);
        } else if (geometry.type === 'polyline') {
            labelText = `Distance: ${this.formatValue(measurement.totalDistance)} ${measurement.linearUnit}`;
        } else if (measurement.type === 'circle') {
            labelText = `Radius: ${this.formatValue(measurement.radius)} ${measurement.linearUnit}\nCircumference: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}\nArea: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`;
        } else {
            labelText = `Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}\nPerimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`;
        }

        return labelText;
    }

    createLabelGraphic(geometry: any, labelText: string, measurementId: string, color: string): any {
        const config = this.props.config || {};

        let labelPoint;
        if (geometry.type === 'point') {
            labelPoint = geometry;
        } else if (geometry.type === 'polyline') {
            // For single-segment lines (2 vertices), calculate true geometric midpoint
            const isSimpleLine = geometry.paths[0] && geometry.paths[0].length === 2;

            if (isSimpleLine) {
                // Calculate geometric midpoint between the two vertices
                const start = geometry.paths[0][0];
                const end = geometry.paths[0][1];
                const midX = (start[0] + end[0]) / 2;
                const midY = (start[1] + end[1]) / 2;

                labelPoint = new this.Point({
                    x: midX,
                    y: midY,
                    spatialReference: geometry.spatialReference
                });
            } else {
                // For multi-segment lines, use the middle vertex
                const midIndex = Math.floor(geometry.paths[0].length / 2);
                const midPoint = geometry.paths[0][midIndex];
                labelPoint = new this.Point({
                    x: midPoint[0],
                    y: midPoint[1],
                    spatialReference: geometry.spatialReference
                });
            }
        } else {
            labelPoint = geometry.centroid;
        }

        // Calculate angle for single-segment polylines
        let labelAngle = 0;
        const isSimpleLine = geometry.type === 'polyline' && geometry.paths[0] && geometry.paths[0].length === 2;

        if (isSimpleLine && this.state.jimuMapView && this.state.jimuMapView.view) {
            const view = this.state.jimuMapView.view;
            const start = geometry.paths[0][0];
            const end = geometry.paths[0][1];

            // Create points in map coordinates
            const startPoint = new this.Point({
                x: start[0],
                y: start[1],
                spatialReference: geometry.spatialReference
            });
            const endPoint = new this.Point({
                x: end[0],
                y: end[1],
                spatialReference: geometry.spatialReference
            });

            // Convert to screen coordinates
            const startScreen = view.toScreen(startPoint);
            const endScreen = view.toScreen(endPoint);

            if (startScreen && endScreen) {
                // Calculate angle in screen space
                const dx = endScreen.x - startScreen.x;
                const dy = endScreen.y - startScreen.y;
                labelAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                // Normalize angle to keep text readable (avoid upside-down text)
                if (labelAngle > 90) {
                    labelAngle -= 180;
                } else if (labelAngle < -90) {
                    labelAngle += 180;
                }
            }
        }

        const textSymbol = new this.TextSymbol({
            text: labelText,
            color: config.labelColor || 'white',
            haloColor: config.labelHaloColor || color,
            haloSize: config.labelHaloSize ?? 2,
            font: {
                size: config.labelFontSize || (geometry.type === 'point' ? 10 : 12),
                family: config.labelFontFamily || 'Arial',
                weight: config.labelFontWeight || 'bold',
                style: config.labelFontStyle || 'normal'
            },
            angle: labelAngle,  // Apply rotation for single-segment lines
            yoffset: geometry.type === 'point' ? -15 : 0
        });

        const labelGraphic = new this.Graphic({
            geometry: labelPoint,
            symbol: textSymbol,
            attributes: {
                measurementId: measurementId,
                labelType: 'main'
            }
        });

        return labelGraphic;
    }

    createSegmentLabelGraphic(segment: SegmentRecord, measurement: MeasurementRecord, segmentIndex: number): any {
        const config = this.props.config || {};
        const geometry = measurement.geometry;

        // Calculate midpoint of the segment
        const startCoords = geometry.type === 'polyline'
            ? geometry.paths[0][segmentIndex]
            : geometry.rings[0][segmentIndex];
        const endCoords = geometry.type === 'polyline'
            ? geometry.paths[0][segmentIndex + 1]
            : geometry.rings[0][segmentIndex + 1];

        if (!startCoords || !endCoords) {
            return null;
        }

        const midX = (startCoords[0] + endCoords[0]) / 2;
        const midY = (startCoords[1] + endCoords[1]) / 2;

        const segmentLabelPoint = new this.Point({
            x: midX,
            y: midY,
            spatialReference: geometry.spatialReference
        });

        // Calculate angle using screen coordinates for accurate rotation
        let angle = 0;
        if (this.state.jimuMapView && this.state.jimuMapView.view) {
            const view = this.state.jimuMapView.view;

            // Create points in map coordinates
            const startPoint = new this.Point({
                x: startCoords[0],
                y: startCoords[1],
                spatialReference: geometry.spatialReference
            });
            const endPoint = new this.Point({
                x: endCoords[0],
                y: endCoords[1],
                spatialReference: geometry.spatialReference
            });

            // Convert to screen coordinates
            const startScreen = view.toScreen(startPoint);
            const endScreen = view.toScreen(endPoint);

            if (startScreen && endScreen) {
                // Calculate angle in screen space
                const dx = endScreen.x - startScreen.x;
                const dy = endScreen.y - startScreen.y;
                angle = Math.atan2(dy, dx) * (180 / Math.PI);  // Screen coordinates: y increases downward

                // Normalize angle to keep text readable (avoid upside-down text)
                if (angle > 90) {
                    angle -= 180;
                } else if (angle < -90) {
                    angle += 180;
                }
            }
        }

        const segmentTextSymbol = new this.TextSymbol({
            text: `${segment.label}: ${this.formatValue(segment.distance)} ${measurement.linearUnit}`,
            color: config.segmentLabelColor || config.labelColor || 'white',
            haloColor: config.segmentLabelHaloColor || config.labelHaloColor || measurement.color,
            haloSize: config.segmentLabelHaloSize ?? config.labelHaloSize ?? 1.5,
            font: {
                size: config.segmentLabelFontSize || 10,
                family: config.segmentLabelFontFamily || 'Arial',
                weight: config.segmentLabelFontWeight || 'normal',
                style: config.segmentLabelFontStyle || 'normal'
            },
            angle: angle  // Apply rotation to align with segment
        });

        const segmentLabelGraphic = new this.Graphic({
            geometry: segmentLabelPoint,
            symbol: segmentTextSymbol,
            attributes: {
                measurementId: measurement.id,
                labelType: 'segment',
                segmentId: segment.id
            }
        });

        return segmentLabelGraphic;
    }


    cleanup() {
        // Cleanup triangle handlers
        if (typeof this.cleanupTriangleHandlers === 'function') {
            this.cleanupTriangleHandlers();
        }

        // Explicitly remove sketch event handler refs (belt-and-suspenders alongside sketchWidget.destroy())
        this.sketchHandlers.forEach(h => { try { h.remove(); } catch (_) { /* already removed */ } });
        this.sketchHandlers = [];

        if (this.state.sketchWidget) {
            try {
                this.state.sketchWidget.destroy();
            } catch (e) {
                console.warn('Error destroying sketch widget:', e);
            }
        }

        if (this.sketchLayer && this.state.jimuMapView) {
            try {
                this.state.jimuMapView.view.map.remove(this.sketchLayer);
            } catch (e) { }
        }

        if (this.labelLayer && this.state.jimuMapView) {
            try {
                this.state.jimuMapView.view.map.remove(this.labelLayer);
            } catch (e) { }
        }

        // Drop per-measurement ref entries (Maps don't auto-shrink)
        this.exportTriggerRefs.clear();
        this.overflowTriggerRefs.clear();
    }

    // Universal coordinate conversion - handles any spatial reference
    /**
     * Pure JS UTM → WGS84 conversion. Works without WASM or JSAPI projection engine.
     * Handles WGS84 UTM zones (326xx North, 327xx South) and NAD83 UTM zones (269xx).
     */
    utmToWgs84(easting: number, northing: number, wkid: number): [number, number] | null {
        try {
            // Determine zone number and hemisphere from wkid
            let zone: number, isSouth: boolean;
            if (wkid >= 32601 && wkid <= 32660) { zone = wkid - 32600; isSouth = false; }
            else if (wkid >= 32701 && wkid <= 32760) { zone = wkid - 32700; isSouth = true; }
            else if (wkid >= 26901 && wkid <= 26923) { zone = wkid - 26900; isSouth = false; }
            else return null;

            const a = 6378137.0, f = 1 / 298.257223563;
            const b = a * (1 - f), e2 = 1 - (b * b) / (a * a);
            const k0 = 0.9996, E0 = 500000;
            const N0 = isSouth ? 10000000 : 0;

            const x = easting - E0, y = northing - N0;
            const M = y / k0;
            const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64));
            const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
            const phi1 = mu
                + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
                + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
                + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);
            const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
            const T1 = Math.tan(phi1) * Math.tan(phi1);
            const C1 = e2 * Math.cos(phi1) * Math.cos(phi1) / (1 - e2);
            const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
            const D = x / (N1 * k0);
            const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
                D * D / 2 -
                (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e2) * D * D * D * D / 24 +
                (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e2 - 3 * C1 * C1) * D * D * D * D * D * D / 720
            );
            const lon0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
            const lon = lon0 + (
                D -
                (1 + 2 * T1 + C1) * D * D * D / 6 +
                (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e2 + 24 * T1 * T1) * D * D * D * D * D / 120
            ) / Math.cos(phi1);
            return [lon * 180 / Math.PI, lat * 180 / Math.PI];
        } catch (_) {
            return null;
        }
    }

    convertToGeographic(x: number, y: number, spatialReference: any): [number, number] {
        try {
            const wkid = spatialReference?.wkid || spatialReference?.latestWkid || 0

            // WGS84 (4326)
            if (wkid === 4326) return [x, y]

            // Web Mercator (3857 / 102100 / 102113)
            if ([3857, 102100, 102113].includes(wkid)) {
                return this.webMercatorUtils.xyToLngLat(x, y)
            }

            // JSAPI projection engine (works for any SR on deployed Portal)
            if (this.projection) {
                const point = new this.Point({ x, y, spatialReference })
                const wgs84SR = new this.SpatialReference({ wkid: 4326 })
                const projected = this.projection.project(point, wgs84SR)
                if (projected) return [projected.x, projected.y]
            }

            // Pure JS UTM → WGS84 fallback (works in local dev without WASM)
            // Handles WGS84 UTM (326xx/327xx) and NAD83 UTM (269xx) zones
            const utmResult = this.utmToWgs84(x, y, wkid)
            if (utmResult) return utmResult

            // Unknown SR - return raw XY
            return [x, y]
        } catch (error) {
            return [x, y]
        }
    }

    // Get display name for spatial reference
    getSpatialReferenceLabel(spatialReference: any): string {
        if (!spatialReference) return 'Unknown';

        const wkid = spatialReference.wkid || spatialReference.latestWkid;

        // Common spatial reference names
        const srNames = {
            4326: 'WGS 84',
            3857: 'Web Mercator',
            102100: 'Web Mercator',
            32612: 'WGS 84 / UTM zone 12N',
            32613: 'WGS 84 / UTM zone 13N',
            32614: 'WGS 84 / UTM zone 14N',
            32615: 'WGS 84 / UTM zone 15N',
            32616: 'WGS 84 / UTM zone 16N',
            32617: 'WGS 84 / UTM zone 17N',
            32618: 'WGS 84 / UTM zone 18N',
            32619: 'WGS 84 / UTM zone 19N',
            2927: 'NAD83(HARN) / Washington South',
            2926: 'NAD83(HARN) / Washington North',
            2285: 'NAD83 / California zone 5',
            2286: 'NAD83 / California zone 6',
            2229: 'NAD83 / California zone 5 (ftUS)',
            2230: 'NAD83 / California zone 6 (ftUS)'
        };

        const name = srNames[wkid] || (spatialReference.name || 'Custom');
        return `${name} (${wkid})`;
    }

    // Format a decimal coordinate to DMS (Degrees Minutes Seconds)
    formatToDMS(decimal: number, isLat: boolean): string {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutesDecimal = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesDecimal);
        const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

        const direction = isLat
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');

        return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
    }

    // Format a decimal coordinate to DDM (Degrees Decimal Minutes)
    formatToDDM(decimal: number, isLat: boolean): string {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutes = ((absolute - degrees) * 60).toFixed(4);

        const direction = isLat
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');

        return `${degrees}° ${minutes}' ${direction}`;
    }

    // Format coordinates based on selected format
    formatCoordinate(lat: number, lon: number, format: 'decimal' | 'dms' | 'ddm'): { lat: string; lon: string } {
        switch (format) {
            case 'dms':
                return {
                    lat: this.formatToDMS(lat, true),
                    lon: this.formatToDMS(lon, false)
                };
            case 'ddm':
                return {
                    lat: this.formatToDDM(lat, true),
                    lon: this.formatToDDM(lon, false)
                };
            case 'decimal':
            default:
                return {
                    lat: `${lat.toFixed(6)}°`,
                    lon: `${lon.toFixed(6)}°`
                };
        }
    }

    // Format point coordinates based on coordinate display mode
    getPointLabelText(coordinates: { x: number; y: number; lat: number; lon: number; spatialReference?: any }): string {
        if (this.state.coordinateDisplayMode === 'input' && coordinates.spatialReference) {
            return `X: ${coordinates.x.toFixed(2)}\nY: ${coordinates.y.toFixed(2)}`;
        } else {
            // Detect if lat/lon are actually raw projected coordinates (projection unavailable).
            // Valid geographic coordinates: lat -90..90, lon -180..180.
            const looksGeographic = coordinates.lat >= -90 && coordinates.lat <= 90
                && coordinates.lon >= -180 && coordinates.lon <= 180;
            if (!looksGeographic) {
                // Projection engine not yet loaded (local dev only).
                // Coordinate conversion unavailable — show native SR coordinates.
                // On deployed Portal servers this displays correctly in the selected format.
                return `X: ${coordinates.x.toFixed(2)}\nY: ${coordinates.y.toFixed(2)}`;
            }
            const formatted = this.formatCoordinate(coordinates.lat, coordinates.lon, this.state.coordinateFormat);
            return `Lat: ${formatted.lat}\nLon: ${formatted.lon}`;
        }
    }

    // Refresh all point labels when coordinate display mode changes
    refreshPointLabels() {
        const pointMeasurements = this.state.measurements.filter(m => m.type === 'point');
        pointMeasurements.forEach(measurement => {
            this.refreshSingleMeasurementLabels(measurement);
        });
    }

    // Format segment coordinates based on coordinate display mode
    formatSegmentCoords(point: { x: number; y: number; lat: number; lon: number }): string {
        if (this.state.coordinateDisplayMode === 'input') {
            return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
        } else {
            const looksGeographic = point.lat >= -90 && point.lat <= 90
                && point.lon >= -180 && point.lon <= 180;
            if (!looksGeographic) {
                return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
            }
            const formatted = this.formatCoordinate(point.lat, point.lon, this.state.coordinateFormat);
            return `(${formatted.lon}, ${formatted.lat})`;
        }
    }

    // Get segment coordinate value for CSV/export based on coordinate display mode
    getSegmentCoordValue(point: { x: number; y: number; lat: number; lon: number }, axis: 'x' | 'y'): number {
        if (this.state.coordinateDisplayMode === 'input') {
            return axis === 'x' ? point.x : point.y;
        } else {
            return axis === 'x' ? point.lon : point.lat;
        }
    }

    async loadModules() {
        try {
            // Use loadArcGISJSAPIModules (async AMD callbacks) instead of ES dynamic imports.
            // ES dynamic imports of AMD externals get compiled by webpack as synchronous
            // requires, causing the entire JSAPI dependency chain to load at widget parse
            // time rather than lazily. loadArcGISJSAPIModules uses proper async AMD require.
            // FeatureSnappingLayerSource removed - snappingOptions.featureSources autocasts
            // plain objects { layer, enabled } in JSAPI 5.0, avoiding geometryEngineAsync deps.
            const [
                SketchViewModel,
                GraphicsLayer,
                Graphic,
                Point,
                Polyline,
                Polygon,
                TextSymbol,
                SimpleLineSymbol,
                SimpleFillSymbol,
                SimpleMarkerSymbol,
                webMercatorUtils,
                SpatialReference
            ] = await loadArcGISJSAPIModules([
                'esri/widgets/Sketch/SketchViewModel',
                'esri/layers/GraphicsLayer',
                'esri/Graphic',
                'esri/geometry/Point',
                'esri/geometry/Polyline',
                'esri/geometry/Polygon',
                'esri/symbols/TextSymbol',
                'esri/symbols/SimpleLineSymbol',
                'esri/symbols/SimpleFillSymbol',
                'esri/symbols/SimpleMarkerSymbol',
                'esri/geometry/support/webMercatorUtils',
                'esri/geometry/SpatialReference'
            ]);

            // Load geometryEngine separately - its dependencies (geometryEngineAsync,
            // geometry.js, symbols.js) are blocked by CSP in local dev. Loading it
            // separately prevents a failure from taking down the whole widget.
            // Suppress the AMD scriptError noise during the attempt.
            const _origErr = console.error;
            const _suppressedErr = (...args: any[]) => {
                const s = String(args[0] || '');
                if (s.includes('scriptError') || s.includes('dojoLoader')) return;
                _origErr.apply(console, args);
            };
            console.error = _suppressedErr;
            try {
                const [ge] = await loadArcGISJSAPIModules(['esri/geometry/geometryEngine']);
                this.geometryEngine = ge;
            } catch (_) {
                this.geometryEngine = null; // local dev only - Euclidean fallback used instead
            } finally {
                // Restore synchronously — but only if no one else has further-patched console.error in the meantime.
                if (console.error === _suppressedErr) {
                    console.error = _origErr;
                }
            }

            // Projection is loaded lazily on first coordinate conversion call (see loadProjectionLazy).
            // Loading it here via AMD causes a permanently hung await when WASM/CSP
            // blocks the script on the local EXB dev server (AMD errback never fires).
            // On deployed Portal servers it loads fine when first needed.

            this.Sketch = SketchViewModel;
            this.GraphicsLayer = GraphicsLayer;
            this.Graphic = Graphic;
            this.Point = Point;
            this.Polyline = Polyline;
            this.Polygon = Polygon;
            this.TextSymbol = TextSymbol;
            this.SimpleLineSymbol = SimpleLineSymbol;
            this.SimpleFillSymbol = SimpleFillSymbol;
            this.SimpleMarkerSymbol = SimpleMarkerSymbol;
            this.webMercatorUtils = webMercatorUtils;
            this.projection = null; // loaded lazily on first coordinate conversion - see loadProjectionLazy()
            this.SpatialReference = SpatialReference;
            this.FeatureSnappingLayerSource = null; // autocasting used instead

            this.setState({ modulesLoaded: true });
        } catch (error) {
            console.error('Failed to load modules:', error);
            const errMsg = (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : String(error || 'unknown error');
            this.safeSetState({
                moduleLoadError: `Failed to load required modules: ${errMsg}`
            });
        }
    }

    // Background-load the projection engine after startup.
    // Called fire-and-forget so it never blocks widget initialization.
    // Sets this.projection when ready; coordinate conversion checks this.projection before use.
    loadProjectionLazy() {
        if (this.projection) return;

        // Temporarily filter console.error and console.log to suppress the AMD
        // scriptError that JSAPI's core.js emits when projection.js WASM is blocked
        // by CSP in local dev. The error originates inside core.js before our catch
        // runs, so this is the only way to suppress it.
        const origError = console.error;
        const origLog = console.log;
        const filter = (...args: any[]) => {
            const s = String(args[0] || '');
            if (s.includes('projection.js') || s.includes('dojoLoader') || s === '.') return;
            origError.apply(console, args);
        };
        const filterLog = (...args: any[]) => {
            const s = String(args[0] || '');
            if (s.includes('projection.js') || s.startsWith('src') || s.startsWith('info') || s === '.') return;
            origLog.apply(console, args);
        };
        console.error = filter;
        console.log = filterLog;

        const restore = () => {
            // Only restore if we still own the patch (avoid clobbering a later patch from another module).
            if (console.error === filter) console.error = origError;
            if (console.log === filterLog) console.log = origLog;
        };

        loadArcGISJSAPIModules(['esri/geometry/projection']).then(([proj]) => {
            return proj.load().then(() => {
                this.projection = proj;
            });
        }).catch(() => {
            // WASM blocked in local dev - coordinate display falls back to raw XY
        }).finally(restore);
    }

    onActiveViewChange = (jimuMapView: JimuMapView) => {
        if (jimuMapView) {
            this.setState({ jimuMapView }, () => {
                this.initializeSketch();

                // Only load projection engine for maps that need it (non-Web Mercator, non-WGS84).
                // Web Mercator and WGS84 coordinate display works via webMercatorUtils with no WASM.
                const wkid = jimuMapView.view?.spatialReference?.wkid
                    || jimuMapView.view?.spatialReference?.latestWkid
                    || 0;
                const noProjectionNeeded = [3857, 102100, 102113, 4326].includes(wkid);
                if (!noProjectionNeeded) {
                    this.loadProjectionLazy();
                }
            });
        }
    };

    initializeSketch() {
        if (!this.state.jimuMapView || !this.state.modulesLoaded) return;

        try {
            if (this.sketchLayer) {
                this.state.jimuMapView.view.map.remove(this.sketchLayer);
            }
            if (this.labelLayer) {
                this.state.jimuMapView.view.map.remove(this.labelLayer);
            }

            this.sketchLayer = new this.GraphicsLayer({
                title: 'Measurements',
                listMode: 'hide'
            });
            this.labelLayer = new this.GraphicsLayer({
                title: 'Measurement Labels',
                listMode: 'hide'
            });

            this.state.jimuMapView.view.map.addMany([this.sketchLayer, this.labelLayer]);

            // Prepare feature snapping sources using plain objects (autocast by SnappingOptions)
            const featureSources = [];
            if (this.state.enableSnapping) {
                const map = this.state.jimuMapView.view.map;
                map.allLayers.forEach((layer: any) => {
                    if (layer.type === 'feature' && layer !== this.sketchLayer && layer !== this.labelLayer) {
                        featureSources.push({ layer: layer, enabled: true });
                    }
                });
            }

            const snappingOptions: any = {
                enabled: this.state.enableSnapping,
                featureEnabled: this.state.enableSnapping,
                selfEnabled: this.state.enableSnapping
            };

            if (featureSources.length > 0) {
                snappingOptions.featureSources = featureSources;
            }

            const sketchWidget = new this.Sketch({
                view: this.state.jimuMapView.view,
                layer: this.sketchLayer,
                creationMode: 'update',
                // Force Web Mercator output regardless of map SR.
                // This lets webMercatorUtils.xyToLngLat() convert all vertices to
                // WGS84 for turf measurements without needing the projection engine.
                // The sketch layer itself will reproject visually on the map correctly.
                spatialReference: { wkid: 3857 },
                defaultUpdateOptions: {
                    enableRotation: true,
                    enableScaling: true,
                    enableZ: false,
                    multipleSelectionEnabled: false,
                    toggleToolOnClick: false,
                    reshapeOptions: {
                        edgeOperation: 'split',
                        shapeOperation: 'move',
                        vertexOperation: 'move'
                    },
                    tool: 'reshape'
                },
                tooltipOptions: {
                    enabled: this.state.showTooltips
                },
                snappingOptions: snappingOptions
            });

            // Remove handlers from any previous sketchWidget (e.g. after map view change)
            this.sketchHandlers.forEach(h => { try { h.remove(); } catch (_) { /* already removed */ } });
            this.sketchHandlers = [];

            const createHandle = sketchWidget.on('create', (event) => {
                if (event.state === 'active' || event.state === 'start') {
                    this.handleLiveMeasurement(event);
                } else if (event.state === 'complete') {
                    this.safeSetState({ liveMeasurement: null });
                    this.handleSketchComplete(event);
                }
            });

            const updateHandle = sketchWidget.on('update', (event) => {
                // Check if this is a delete operation
                if (event.toolEventInfo && event.toolEventInfo.type === 'delete-complete') {
                    this.handleGraphicDelete(event);
                } else if (event.state === 'active' || event.state === 'start') {
                    this.handleGraphicUpdate(event);
                } else if (event.state === 'complete') {
                    // Check if graphic still exists in layer (it might have been deleted)
                    const graphic = event.graphics && event.graphics[0];
                    if (graphic && this.sketchLayer.graphics.includes(graphic)) {
                        this.handleGraphicUpdateComplete(event);
                    } else if (graphic) {
                        // Graphic was deleted
                        this.handleGraphicDelete(event);
                    }
                }
            });

            this.sketchHandlers.push(createHandle, updateHandle);

            this.safeSetState({ sketchWidget });
        } catch (error) {
            console.error('Error initializing sketch:', error);
        }
    }

    handleSketchComplete(event: any) {
        const graphic = event.graphic;
        const geometryType = graphic.geometry.type;

        // Validate geometry before processing
        if (geometryType === 'polyline') {
            if (!graphic.geometry.paths || !graphic.geometry.paths[0] || graphic.geometry.paths[0].length < 2) {
                console.error('Invalid polyline: insufficient points');
                this.clearLiveLabel();
                return;
            }
        } else if (geometryType === 'polygon') {
            if (!graphic.geometry.rings || !graphic.geometry.rings[0] || graphic.geometry.rings[0].length < 4) {
                console.error('Invalid polygon: insufficient points (need at least 4 points for a closed polygon)');
                this.clearLiveLabel();
                return;
            }
        }

        // Clear live label BEFORE creating the measurement
        this.clearLiveLabel();

        if ((geometryType === 'point' && this.state.currentTool === 'point') ||
            (geometryType === 'polyline' && (this.state.currentTool === 'distance' || this.state.currentTool === 'freehand-polyline')) ||
            (geometryType === 'polygon' && (this.state.currentTool === 'area' || this.state.currentTool === 'freehand-polygon' || this.state.currentTool === 'rectangle' || this.state.currentTool === 'triangle')) ||
            (geometryType === 'polygon' && this.state.currentTool === 'circle')) {
            this.createMeasurement(graphic);
        }

        // Check continuous drawing config
        const continuousDrawing = this.props.config?.continuousDrawing !== false;

        if (continuousDrawing) {
            // Keep tool active - restart the same tool
            this.setState({ liveMeasurement: null }, () => {
                if (this.state.currentTool && this.state.sketchWidget) {
                    setTimeout(() => {
                        if (this.state.currentTool === 'point') {
                            this.state.sketchWidget.create('point');
                        } else if (this.state.currentTool === 'distance') {
                            this.state.sketchWidget.create('polyline');
                        } else if (this.state.currentTool === 'freehand-polyline') {
                            this.state.sketchWidget.create('polyline', { mode: 'freehand' });
                        } else if (this.state.currentTool === 'rectangle') {
                            this.state.sketchWidget.create('rectangle');
                        } else if (this.state.currentTool === 'area') {
                            this.state.sketchWidget.create('polygon');
                        } else if (this.state.currentTool === 'freehand-polygon') {
                            this.state.sketchWidget.create('polygon', { mode: 'freehand' });
                        } else if (this.state.currentTool === 'circle') {
                            this.state.sketchWidget.create('circle');
                        } else if (this.state.currentTool === 'triangle') {
                            this.state.sketchWidget.create('polygon');
                        }
                    }, 100);
                }
            });
        } else {
            // Reset tool state and clear live measurement
            this.setState({ currentTool: null, liveMeasurement: null });
        }
    }

    handleLiveMeasurement(event: any) {
        if (!event.graphic || !event.graphic.geometry) return;

        // Check if live measurement display is enabled
        const config = this.props.config || {};
        const showLiveMeasurement = config.showLiveMeasurement !== false;

        if (!showLiveMeasurement) {
            // Skip live measurement display if disabled
            return;
        }

        const geometry = event.graphic.geometry;
        const geometryType = geometry.type;

        try {
            if (geometryType === 'polyline' && geometry.paths && geometry.paths[0] && geometry.paths[0].length > 1) {
                const distance = this.measureLength(geometry, this.state.currentLinearUnit);

                this.setState({
                    liveMeasurement: {
                        value: `Distance: ${this.formatValue(distance)} ${this.state.currentLinearUnit}`,
                        type: 'distance'
                    }
                });

                // Update live label
                this.updateLiveLabel(geometry, `Distance: ${this.formatValue(distance)} ${this.state.currentLinearUnit}`, 'polyline');
            } else if (geometryType === 'polygon' && geometry.rings && geometry.rings[0] && geometry.rings[0].length > 2) {
                const rings = geometry.rings[0];
                const areaConverted = this.measureArea(geometry, this.state.currentAreaUnit);
                const perimeter = this.measureLength(geometry, this.state.currentLinearUnit);

                if (this.state.currentTool === 'circle') {
                    const centerX = geometry.centroid.x;
                    const centerY = geometry.centroid.y;
                    const edgePoint = rings[0];
                    const radius = this.measurePointDistance(centerX, centerY, edgePoint[0], edgePoint[1], geometry.spatialReference, this.state.currentLinearUnit);

                    this.setState({
                        liveMeasurement: {
                            value: `Radius: ${this.formatValue(radius)} ${this.state.currentLinearUnit}\nCircumference: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}\nArea: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}`,
                            type: 'circle'
                        }
                    });

                    this.updateLiveLabel(geometry, `Radius: ${this.formatValue(radius)} ${this.state.currentLinearUnit}\nCircumference: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}\nArea: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}`, 'polygon');
                } else {
                    this.setState({
                        liveMeasurement: {
                            value: `Area: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}\nPerimeter: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}`,
                            type: 'area'
                        }
                    });

                    this.updateLiveLabel(geometry, `Area: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}\nPerimeter: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}`, 'polygon');
                }
            } else if (geometryType === 'point') {
                const lonLat = this.convertToGeographic(geometry.x, geometry.y, geometry.spatialReference);
                const coordinates = {
                    x: geometry.x,
                    y: geometry.y,
                    lat: lonLat[1],
                    lon: lonLat[0],
                    spatialReference: geometry.spatialReference
                };
                this.updateLiveLabel(geometry, this.getPointLabelText(coordinates), 'point');
            }
        } catch (error) {
            // Ignore errors during live measurement
        }
    }

    updateLiveLabel(geometry: any, labelText: string, geometryType: string) {
        if (!this.labelLayer) return;

        const config = this.props.config || {};
        const showLiveLabels = config.showLiveLabels !== false;

        if (!showLiveLabels) return;

        // Clear all live labels completely before adding new one
        this.clearLiveLabel();

        let labelPoint;
        if (geometryType === 'point') {
            labelPoint = geometry;
        } else if (geometryType === 'polyline') {
            const midIndex = Math.floor(geometry.paths[0].length / 2);
            const midPoint = geometry.paths[0][midIndex];
            labelPoint = new this.Point({
                x: midPoint[0],
                y: midPoint[1],
                spatialReference: geometry.spatialReference
            });
        } else if (geometryType === 'polygon') {
            labelPoint = geometry.centroid;
        }

        const primaryColor = config.useColorPalette !== false
            ? (config.colorPalette1 || '#3b82f6')
            : (config.primaryColor || '#3b82f6');

        const textSymbol = new this.TextSymbol({
            text: labelText,
            color: config.labelColor || 'white',
            haloColor: config.labelHaloColor || primaryColor,
            haloSize: config.labelHaloSize ?? 2,
            font: {
                size: config.liveLabelFontSize || (geometryType === 'point' ? 10 : 14),
                family: config.labelFontFamily || 'Arial',
                weight: config.labelFontWeight || 'bold',
                style: config.labelFontStyle || 'normal'
            },
            yoffset: geometryType === 'point' ? -15 : 0
        });

        const labelGraphic = new this.Graphic({
            geometry: labelPoint,
            symbol: textSymbol,
            attributes: {
                isLiveLabel: true
            }
        });

        this.labelLayer.add(labelGraphic);
        this.setState({ liveLabelGraphic: labelGraphic });
    }

    clearLiveLabel() {
        if (!this.labelLayer) return;

        // Remove tracked live label graphic first
        if (this.state.liveLabelGraphic) {
            this.labelLayer.remove(this.state.liveLabelGraphic);
        }

        // Remove any labels marked as live labels (comprehensive cleanup)
        const liveLabels = this.labelLayer.graphics.filter(g =>
            g.attributes && g.attributes.isLiveLabel
        ).toArray();
        liveLabels.forEach(label => this.labelLayer.remove(label));

        // Clear state
        this.setState({ liveLabelGraphic: null });
    }

    handleGraphicUpdate(event: any) {
        // Find the measurement being updated
        const graphic = event.graphics && event.graphics[0];
        if (!graphic || !graphic.attributes || !graphic.attributes.measurementId) return;

        const measurementId = graphic.attributes.measurementId;
        const measurement = this.state.measurements.find(m => m.id === measurementId);

        if (measurement) {
            // Track which measurement is being edited
            if (this.state.editingMeasurementId !== measurementId) {
                this.setState({ editingMeasurementId: measurementId });
            }

            // Update label positions during drag/update
            this.updateMeasurementLabels(measurement, graphic.geometry);

            // Show live measurement during resize/move
            try {
                const geometry = graphic.geometry;
                if (geometry.type === 'polyline' && geometry.paths && geometry.paths[0] && geometry.paths[0].length > 1) {
                    const distance = this.measureLength(geometry, measurement.linearUnit);
                    this.setState({
                        liveMeasurement: {
                            value: `${this.formatValue(distance)} ${measurement.linearUnit}`,
                            type: 'distance'
                        }
                    });
                } else if (geometry.type === 'polygon' && geometry.rings && geometry.rings[0] && geometry.rings[0].length > 2) {
                    const areaConverted = this.measureArea(geometry, measurement.areaUnit);
                    this.setState({
                        liveMeasurement: {
                            value: `${this.formatValue(areaConverted)} ${measurement.areaUnit}`,
                            type: measurement.type === 'circle' ? 'circle' : measurement.type === 'triangle' ? 'triangle' : 'area'
                        }
                    });
                }
            } catch (error) {
                // Ignore errors during live measurement update
            }
        }
    }

    handleGraphicDelete(event: any) {
        const graphic = event.graphics && event.graphics[0];
        if (!graphic || !graphic.attributes || !graphic.attributes.measurementId) return;

        const measurementId = graphic.attributes.measurementId;
        const measurement = this.state.measurements.find(m => m.id === measurementId);

        if (!measurement) return;


        // Record this action in undo history BEFORE deleting
        this.recordAction({
            type: 'DELETE',
            measurement: measurement
        });

        // Remove all labels associated with this measurement
        const labelsToRemove = this.labelLayer.graphics.filter(g => {
            return g.attributes && g.attributes.measurementId === measurementId;
        });

        labelsToRemove.forEach(label => this.labelLayer.remove(label));

        // Update state to remove the measurement
        this.setState(prevState => ({
            measurements: prevState.measurements.filter(m => m.id !== measurementId),
            expandedMeasurements: new Set(
                Array.from(prevState.expandedMeasurements).filter(expId => expId !== measurementId)
            )
        }));
    }

    handleGraphicUpdateComplete(event: any) {
        const graphic = event.graphics && event.graphics[0];
        if (!graphic || !graphic.attributes || !graphic.attributes.measurementId) return;

        const measurementId = graphic.attributes.measurementId;
        const measurement = this.state.measurements.find(m => m.id === measurementId);

        if (!measurement) return;

        // Clear live measurement display and live label
        this.setState({ liveMeasurement: null, editingMeasurementId: null });
        this.clearLiveLabel();

        // Recalculate measurements based on new geometry
        try {
            let updatedMeasurement = { ...measurement };
            updatedMeasurement.geometry = graphic.geometry;

            if (graphic.geometry.type === 'polyline') {
                const paths = graphic.geometry.paths[0];
                // Still build geojson for calculateSegments
                const coordinates = paths.map(p => {
                    const lonLat = this.convertToGeographic(p[0], p[1], graphic.geometry.spatialReference);
                    return [lonLat[0], lonLat[1]];
                });
                const geojson = turf.lineString(coordinates);
                updatedMeasurement.geojson = geojson;

                const isFreehand = measurement.label.includes('Freehand');
                const segments = this.calculateSegments(geojson, paths, graphic.geometry.spatialReference, false, isFreehand);

                // Geodesic length directly on raw JSAPI geometry - correct for any SR
                const totalDistance = this.measureLength(graphic.geometry, measurement.linearUnit);

                updatedMeasurement.segments = segments;
                updatedMeasurement.totalDistance = totalDistance;
            } else if (graphic.geometry.type === 'polygon') {
                const rings = graphic.geometry.rings[0];
                const coordinates = rings.map(p => {
                    const lonLat = this.convertToGeographic(p[0], p[1], graphic.geometry.spatialReference);
                    return [lonLat[0], lonLat[1]];
                });
                if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                    coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                    coordinates.push(coordinates[0]);
                }
                const geojson = turf.polygon([coordinates]);
                updatedMeasurement.geojson = geojson;

                // Geodesic area/perimeter directly on raw JSAPI geometry - correct for any SR
                const areaConverted = this.measureArea(graphic.geometry, this.state.currentAreaUnit);
                const perimeter = this.measureLength(graphic.geometry, measurement.linearUnit);
                const isFreehand = measurement.label.includes('Freehand');
                const perimeterLine = turf.polygonToLine(geojson);
                const segments = this.calculateSegments(perimeterLine, rings, graphic.geometry.spatialReference, true, isFreehand);

                if (measurement.type === 'circle') {
                    const centerX = graphic.geometry.centroid.x;
                    const centerY = graphic.geometry.centroid.y;
                    const edgePoint = rings[0];
                    const radius = this.measurePointDistance(centerX, centerY, edgePoint[0], edgePoint[1], graphic.geometry.spatialReference, measurement.linearUnit);
                    const centerLonLat = this.convertToGeographic(centerX, centerY, graphic.geometry.spatialReference);

                    updatedMeasurement.radius = radius;
                    updatedMeasurement.totalArea = areaConverted;
                    updatedMeasurement.perimeter = perimeter;
                    updatedMeasurement.coordinates = {
                        x: centerX,
                        y: centerY,
                        lon: centerLonLat[0],
                        lat: centerLonLat[1],
                        spatialReference: graphic.geometry.spatialReference
                    };
                } else {
                    updatedMeasurement.segments = segments;
                    updatedMeasurement.totalArea = areaConverted;
                    updatedMeasurement.perimeter = perimeter;
                }
            } else if (graphic.geometry.type === 'point') {
                const lonLat = this.convertToGeographic(graphic.geometry.x, graphic.geometry.y, graphic.geometry.spatialReference);
                const geojson = turf.point([lonLat[0], lonLat[1]]);

                updatedMeasurement.geojson = geojson;
                updatedMeasurement.coordinates = {
                    x: graphic.geometry.x,
                    y: graphic.geometry.y,
                    lon: lonLat[0],
                    lat: lonLat[1],
                    spatialReference: graphic.geometry.spatialReference
                };
            }

            // Record this action in undo history BEFORE updating state
            this.recordAction({
                type: 'MODIFY',
                measurement: updatedMeasurement,
                previousMeasurement: measurement  // Store the previous state
            });

            // Update state with new measurement
            this.setState(prevState => ({
                measurements: prevState.measurements.map(m =>
                    m.id === measurementId ? updatedMeasurement : m
                )
            }));

            // Update all labels for this measurement
            this.refreshSingleMeasurementLabels(updatedMeasurement);
        } catch (error) {
            console.error('Error updating measurement:', error);
        }
    }

    updateMeasurementLabels(measurement: MeasurementRecord, geometry: any) {
        // Remove existing labels for this measurement
        const labelsToUpdate = this.labelLayer.graphics.filter(g =>
            g.attributes && g.attributes.measurementId === measurement.id
        );

        labelsToUpdate.forEach(label => {
            const labelType = label.attributes.labelType;

            if (labelType === 'main') {
                // Update main label position and text
                let labelText = '';
                let labelPoint;

                if (geometry.type === 'point') {
                    labelPoint = geometry;
                    const lonLat = this.convertToGeographic(geometry.x, geometry.y, geometry.spatialReference);
                    const coordinates = {
                        x: geometry.x,
                        y: geometry.y,
                        lat: lonLat[1],
                        lon: lonLat[0],
                        spatialReference: geometry.spatialReference
                    };
                    labelText = this.getPointLabelText(coordinates);
                } else if (geometry.type === 'polyline') {
                    const midIndex = Math.floor(geometry.paths[0].length / 2);
                    const midPoint = geometry.paths[0][midIndex];
                    labelPoint = new this.Point({
                        x: midPoint[0],
                        y: midPoint[1],
                        spatialReference: geometry.spatialReference
                    });

                    // Recalculate distance
                    const distance = this.measureLength(geometry, measurement.linearUnit);
                    labelText = `Distance: ${this.formatValue(distance)} ${measurement.linearUnit}`;
                } else if (geometry.type === 'polygon') {
                    labelPoint = geometry.centroid;

                    // Geodesic area/perimeter directly on raw JSAPI geometry
                    const areaConverted = this.measureArea(geometry, measurement.areaUnit);
                    const perimeter = this.measureLength(geometry, measurement.linearUnit);

                    if (measurement.type === 'circle') {
                        const rings = geometry.rings[0];
                        const centerX = geometry.centroid.x;
                        const centerY = geometry.centroid.y;
                        const edgePoint = rings[0];
                        const radius = this.measurePointDistance(centerX, centerY, edgePoint[0], edgePoint[1], geometry.spatialReference, measurement.linearUnit);
                        labelText = `Radius: ${this.formatValue(radius)} ${measurement.linearUnit}\nCircumference: ${this.formatValue(perimeter)} ${measurement.linearUnit}\nArea: ${this.formatValue(areaConverted)} ${measurement.areaUnit}`;
                    } else {
                        labelText = `Area: ${this.formatValue(areaConverted)} ${measurement.areaUnit}\nPerimeter: ${this.formatValue(perimeter)} ${measurement.linearUnit}`;
                    }
                }

                label.geometry = labelPoint;
                label.symbol = new this.TextSymbol({
                    text: labelText,
                    color: (this.props.config || {}).labelColor || 'white',
                    haloColor: (this.props.config || {}).labelHaloColor || measurement.color,
                    haloSize: (this.props.config || {}).labelHaloSize ?? 2,
                    font: {
                        size: (this.props.config || {}).labelFontSize || (geometry.type === 'point' ? 10 : 12),
                        family: (this.props.config || {}).labelFontFamily || 'Arial',
                        weight: (this.props.config || {}).labelFontWeight || 'bold',
                        style: (this.props.config || {}).labelFontStyle || 'normal'
                    },
                    yoffset: geometry.type === 'point' ? -15 : 0
                });
            } else if (labelType === 'segment' && measurement.segments && measurement.type !== 'circle') {
                // Update segment label positions and values
                const segmentId = label.attributes.segmentId;
                const segmentIndex = measurement.segments.findIndex(s => s.id === segmentId);

                if (segmentIndex >= 0) {
                    const startCoords = geometry.type === 'polyline'
                        ? geometry.paths[0][segmentIndex]
                        : geometry.rings[0][segmentIndex];
                    const endCoords = geometry.type === 'polyline'
                        ? geometry.paths[0][segmentIndex + 1]
                        : geometry.rings[0][segmentIndex + 1];

                    if (startCoords && endCoords) {
                        const midX = (startCoords[0] + endCoords[0]) / 2;
                        const midY = (startCoords[1] + endCoords[1]) / 2;

                        const labelPoint = new this.Point({
                            x: midX,
                            y: midY,
                            spatialReference: geometry.spatialReference
                        });

                        // Recalculate segment distance geodesically
                        const distance = this.measurePointDistance(
                            startCoords[0], startCoords[1],
                            endCoords[0], endCoords[1],
                            geometry.spatialReference,
                            measurement.linearUnit
                        );

                        const segmentLabel = measurement.type === 'distance' ? `Segment ${segmentIndex + 1}` : `Edge ${segmentIndex + 1}`;

                        label.geometry = labelPoint;
                        label.symbol = new this.TextSymbol({
                            text: `${segmentLabel}: ${this.formatValue(distance)} ${measurement.linearUnit}`,
                            color: (this.props.config || {}).segmentLabelColor || (this.props.config || {}).labelColor || 'white',
                            haloColor: (this.props.config || {}).segmentLabelHaloColor || (this.props.config || {}).labelHaloColor || measurement.color,
                            haloSize: (this.props.config || {}).segmentLabelHaloSize ?? (this.props.config || {}).labelHaloSize ?? 1.5,
                            font: {
                                size: (this.props.config || {}).segmentLabelFontSize || 10,
                                family: (this.props.config || {}).segmentLabelFontFamily || 'Arial',
                                weight: (this.props.config || {}).segmentLabelFontWeight || 'normal',
                                style: (this.props.config || {}).segmentLabelFontStyle || 'normal'
                            }
                        });
                    }
                }
            }
        });
    }

    refreshSingleMeasurementLabels(measurement: MeasurementRecord) {
        // Remove all existing labels for this measurement
        const labelsToRemove = this.labelLayer.graphics.filter(g =>
            g.attributes && g.attributes.measurementId === measurement.id
        );
        labelsToRemove.forEach(label => this.labelLayer.remove(label));

        // Add new labels with updated measurements
        this.addMeasurementLabel(measurement.geometry, measurement);
    }

    createMeasurement(graphic: any) {
        const measurementId = `measurement-${Date.now()}-${Math.random()}`;
        // Color picking: prefer the first palette color not currently in use, so
        // colors don't drift unpredictably after deletions. Fall back to the old
        // count-based rotation if every palette color is already used.
        const usedColors = new Set(this.state.measurements.map(m => m.color));
        const color = (this.colorPalette || []).find(c => !usedColors.has(c)) || this.colorPalette[this.measurementCount % this.colorPalette.length];
        this.measurementCount++;

        graphic.symbol = this.createSymbol(graphic.geometry.type, color);
        graphic.attributes = {
            measurementId: measurementId
        };

        let geojson;
        let measurement: MeasurementRecord;

        if (graphic.geometry.type === 'point') {
            const lonLat = this.convertToGeographic(graphic.geometry.x, graphic.geometry.y, graphic.geometry.spatialReference);
            geojson = turf.point([lonLat[0], lonLat[1]]);

            measurement = {
                id: measurementId,
                type: 'point',
                timestamp: new Date(),
                segments: [],
                coordinates: {
                    x: graphic.geometry.x,
                    y: graphic.geometry.y,
                    lon: lonLat[0],
                    lat: lonLat[1],
                    spatialReference: graphic.geometry.spatialReference
                },
                linearUnit: this.state.currentLinearUnit,
                areaUnit: this.state.currentAreaUnit,
                label: `Point ${this.measurementCount}`,
                geometry: graphic.geometry,
                geojson: geojson,
                graphic: graphic,
                color: color
            };
        } else if (graphic.geometry.type === 'polyline') {
            const paths = graphic.geometry.paths[0];

            // Validate geometry has sufficient points
            if (!paths || paths.length < 2) {
                console.error('Invalid polyline geometry: insufficient points');
                return;
            }

            // Build geojson for segment labeling (still needed for calculateSegments)
            const coordinates = paths.map(p => {
                const lonLat = this.convertToGeographic(p[0], p[1], graphic.geometry.spatialReference);
                return [lonLat[0], lonLat[1]];
            });
            geojson = turf.lineString(coordinates);

            const isFreehand = this.state.currentTool === 'freehand-polyline';
            const segments = this.calculateSegments(geojson, paths, graphic.geometry.spatialReference, false, isFreehand);

            // Use geodesic measurement directly on raw JSAPI geometry - works for any SR
            const totalDistance = this.measureLength(graphic.geometry, this.state.currentLinearUnit);

            const labelPrefix = isFreehand ? 'Freehand Line' : 'Line';

            measurement = {
                id: measurementId,
                type: 'distance',
                timestamp: new Date(),
                segments: segments,
                totalDistance: totalDistance,
                linearUnit: this.state.currentLinearUnit,
                areaUnit: this.state.currentAreaUnit,
                label: `${labelPrefix} ${this.measurementCount}`,
                geometry: graphic.geometry,
                geojson: geojson,
                graphic: graphic,
                color: color
            };
        } else if (graphic.geometry.type === 'polygon') {
            const rings = graphic.geometry.rings[0];

            // Validate geometry has sufficient points (4 points minimum for closed polygon)
            if (!rings || rings.length < 4) {
                console.error('Invalid polygon geometry: insufficient points (need at least 4 for closed polygon)');
                return;
            }

            // Build geojson for segment labeling (calculateSegments still needs it)
            const coordinates = rings.map(p => {
                const lonLat = this.convertToGeographic(p[0], p[1], graphic.geometry.spatialReference);
                return [lonLat[0], lonLat[1]];
            });
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                coordinates.push(coordinates[0]);
            }
            geojson = turf.polygon([coordinates]);

            // Use geodesic measurement directly on raw JSAPI geometry - works for any SR
            const areaConverted = this.measureArea(graphic.geometry, this.state.currentAreaUnit);
            const perimeter = this.measureLength(graphic.geometry, this.state.currentLinearUnit);

            // Build a line from polygon rings for calculateSegments
            const perimeterLine = turf.polygonToLine(geojson);
            const isFreehand = this.state.currentTool === 'freehand-polygon';
            const segments = this.calculateSegments(perimeterLine, rings, graphic.geometry.spatialReference, true, isFreehand);

            if (this.state.currentTool === 'circle') {
                const centerX = graphic.geometry.centroid.x;
                const centerY = graphic.geometry.centroid.y;
                const edgePoint = rings[0];
                const radius = this.measurePointDistance(centerX, centerY, edgePoint[0], edgePoint[1], graphic.geometry.spatialReference, this.state.currentLinearUnit);
                const centerLonLat = this.convertToGeographic(centerX, centerY, graphic.geometry.spatialReference);

                measurement = {
                    id: measurementId,
                    type: 'circle',
                    timestamp: new Date(),
                    segments: [],
                    totalArea: areaConverted,
                    perimeter: perimeter,
                    radius: radius,
                    coordinates: {
                        x: centerX,
                        y: centerY,
                        lon: centerLonLat[0],
                        lat: centerLonLat[1],
                        spatialReference: graphic.geometry.spatialReference
                    },
                    linearUnit: this.state.currentLinearUnit,
                    areaUnit: this.state.currentAreaUnit,
                    label: `Circle ${this.measurementCount}`,
                    geometry: graphic.geometry,
                    geojson: geojson,
                    graphic: graphic,
                    color: color
                };
            } else if (this.state.currentTool === 'triangle') {
                // For equilateral triangle, calculate side length
                const sideLength = segments.length > 0 ? segments[0].distance : 0;

                measurement = {
                    id: measurementId,
                    type: 'triangle',
                    timestamp: new Date(),
                    segments: segments,
                    totalArea: areaConverted,
                    perimeter: perimeter,
                    sideLength: sideLength,
                    linearUnit: this.state.currentLinearUnit,
                    areaUnit: this.state.currentAreaUnit,
                    label: `Triangle ${this.measurementCount}`,
                    geometry: graphic.geometry,
                    geojson: geojson,
                    graphic: graphic,
                    color: color
                };
            } else {
                const labelPrefix = this.state.currentTool === 'freehand-polygon' ? 'Freehand Area' :
                    this.state.currentTool === 'rectangle' ? 'Rectangle' : 'Area';

                measurement = {
                    id: measurementId,
                    type: 'area',
                    timestamp: new Date(),
                    segments: segments,
                    totalArea: areaConverted,
                    perimeter: perimeter,
                    linearUnit: this.state.currentLinearUnit,
                    areaUnit: this.state.currentAreaUnit,
                    label: `${labelPrefix} ${this.measurementCount}`,
                    geometry: graphic.geometry,
                    geojson: geojson,
                    graphic: graphic,
                    color: color
                };
            }
        }

        this.setState(prevState => ({
            measurements: [...prevState.measurements, measurement]
        }), () => {
            // Record this action in undo history
            this.recordAction({
                type: 'ADD',
                measurement: measurement
            });
        });

        this.addMeasurementLabel(graphic.geometry, measurement);
    }

    calculateSegments(geojson: any, originalPaths: any[], spatialReference: any, isPolygon: boolean = false, isFreehand: boolean = false): SegmentRecord[] {
        const coordinates = geojson.geometry.coordinates;
        const segments: SegmentRecord[] = [];

        // Check if segment labeling is enabled
        const config = this.props.config || {};
        const enableSegmentLabeling = config.enableSegmentLabeling !== false;

        // Skip segment calculation if disabled
        if (!enableSegmentLabeling) {
            return segments;
        }

        // For freehand tools, skip segment calculation to avoid overcrowding
        if (isFreehand) {
            return segments;
        }

        // Get segment label prefix from config
        const segmentLabelPrefix = config.segmentLabelPrefix || 'Segment';
        const edgeLabelPrefix = config.edgeLabelPrefix || 'Edge';

        for (let i = 0; i < coordinates.length - 1; i++) {
            // Get original x/y from paths
            const startX = originalPaths[i][0];
            const startY = originalPaths[i][1];
            const endX = originalPaths[i + 1][0];
            const endY = originalPaths[i + 1][1];

            // Geodesic segment distance - correct for any spatial reference
            const distance = this.measurePointDistance(startX, startY, endX, endY, spatialReference, this.state.currentLinearUnit);

            segments.push({
                id: `segment-${i}`,
                distance: distance,
                startPoint: {
                    x: startX,
                    y: startY,
                    lon: coordinates[i][0],
                    lat: coordinates[i][1]
                },
                endPoint: {
                    x: endX,
                    y: endY,
                    lon: coordinates[i + 1][0],
                    lat: coordinates[i + 1][1]
                },
                label: isPolygon ? `${edgeLabelPrefix} ${i + 1}` : `${segmentLabelPrefix} ${i + 1}`,
                spatialReference: spatialReference
            });
        }

        return segments;
    }

    // ==================== Custom Unit Helpers ====================

    /**
     * Get custom linear units from config
     */
    getCustomLinearUnits(): Array<{ name: string; label: string; toMeters: number; addToDropdown: boolean }> {
        const config = this.props.config || {};
        return (config.customLinearUnits || []).filter((u: any) => u && u.name && u.toMeters);
    }

    /**
     * Get custom area units from config
     */
    getCustomAreaUnits(): Array<{ name: string; label: string; toSquareMeters: number; addToDropdown: boolean }> {
        const config = this.props.config || {};
        return (config.customAreaUnits || []).filter((u: any) => u && u.name && u.toSquareMeters);
    }

    /**
     * Check if a linear unit is a custom (non-turf) unit
     */
    isCustomLinearUnit(unit: string): boolean {
        return this.getCustomLinearUnits().some(u => u.name === unit);
    }

    /**
     * Check if an area unit is a custom (non-turf) unit
     */
    isCustomAreaUnit(unit: string): boolean {
        return this.getCustomAreaUnits().some(u => u.name === unit);
    }

    /**
     * Get the meters conversion factor for a custom linear unit
     */
    getCustomLinearFactor(unit: string): number {
        const custom = this.getCustomLinearUnits().find(u => u.name === unit);
        return custom ? custom.toMeters : 1;
    }

    /**
     * Get the square meters conversion factor for a custom area unit
     */
    getCustomAreaFactor(unit: string): number {
        const custom = this.getCustomAreaUnits().find(u => u.name === unit);
        return custom ? custom.toSquareMeters : 1;
    }

    /**
     * Get a human-readable display label for any unit (standard or custom)
     */
    getUnitDisplayLabel(unit: string): string {
        // Check custom linear units
        const customLinear = this.getCustomLinearUnits().find(u => u.name === unit);
        if (customLinear) return customLinear.label;

        // Check custom area units
        const customArea = this.getCustomAreaUnits().find(u => u.name === unit);
        if (customArea) return customArea.label;

        // Standard unit label mapping
        const standardLabels: Record<string, string> = {
            'miles': 'Miles', 'kilometers': 'Kilometers', 'meters': 'Meters',
            'feet': 'Feet', 'yards': 'Yards', 'nauticalmiles': 'Nautical Miles',
            'nautical-miles': 'Nautical Miles', 'inches': 'Inches',
            'centimeters': 'Centimeters',
            'square-meters': 'Square Meters', 'square-kilometers': 'Square Kilometers',
            'square-feet': 'Square Feet', 'square-miles': 'Square Miles',
            'acres': 'Acres', 'hectares': 'Hectares'
        };
        return standardLabels[unit] || unit;
    }

    /**
     * Geodesic length using JSAPI geometryEngine directly on a raw JSAPI geometry.
     * Works correctly for ANY spatial reference (Web Mercator, UTM 32612, Geographic, etc.)
     * without needing coordinate conversion. Falls back to turf on WGS84 geojson.
     */
    // Returns true when coordinates are in a projected metric CS (e.g. UTM)
    // where raw XY differences are in meters and Euclidean math is valid.
    /**
     * Measure length of a JSAPI geometry in the requested unit.
     *
     * Strategy (handles ANY coordinate system):
     * 1. Try geometryEngine.geodesicLength — correct for any SR, works on deployed
     *    Portal servers. Throws "Not Implemented" in local dev (WASM blocked by CSP).
     * 2. Fallback: geometryEngine.planarLength — works everywhere, no WASM needed.
     *    Uses the geometry's native SR units and converts. Accurate for projected SRs
     *    (UTM meters, State Plane feet, etc.). Not ideal for geographic SRs at scale
     *    but acceptable as a local-dev fallback.
     * 3. Further fallback: webMercatorUtils → turf for Web Mercator / WGS84 SRs.
     */
    measureLength(jsapiGeometry: any, unit: string): number {
        try {
            if (!jsapiGeometry || !this.geometryEngine) return 0;
            const linearUnit = this.isCustomLinearUnit(unit) ? 'meters' : unit;

            // Primary: geodesic (correct for any SR, needs WASM - works on Portal)
            try {
                const result = this.geometryEngine.geodesicLength(jsapiGeometry, linearUnit);
                const meters = Math.abs(result);
                if (!isNaN(meters) && meters >= 0) {
                    if (this.isCustomLinearUnit(unit)) return meters / this.getCustomLinearFactor(unit);
                    return meters;
                }
            } catch (_) {
                // geodesicLength requires WASM - blocked in local dev, fall through
            }

            // Fallback: planar — no WASM needed, handles any projected SR
            // geometryEngine converts to meters automatically when unit='meters'
            try {
                const planar = Math.abs(this.geometryEngine.planarLength(jsapiGeometry, 'meters'));
                if (!isNaN(planar) && planar > 0) {
                    if (this.isCustomLinearUnit(unit)) return planar / this.getCustomLinearFactor(unit);
                    return turf.convertLength(planar, 'meters' as any, unit as any);
                }
            } catch (_) { }

            // Last resort: WGS84/Web Mercator conversion → turf
            if (jsapiGeometry.type === 'polyline' && jsapiGeometry.paths?.[0]) {
                const coords = jsapiGeometry.paths[0].map((p: number[]) =>
                    this.convertToGeographic(p[0], p[1], jsapiGeometry.spatialReference)
                );
                if (coords.length >= 2) return this.turfLength(turf.lineString(coords), unit);
            }
            if (jsapiGeometry.type === 'polygon' && jsapiGeometry.rings?.[0]) {
                const coords = jsapiGeometry.rings[0].map((p: number[]) =>
                    this.convertToGeographic(p[0], p[1], jsapiGeometry.spatialReference)
                );
                if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                    coords.push(coords[0]);
                }
                return this.turfLength(turf.polygonToLine(turf.polygon([coords])), unit);
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Measure area of a JSAPI polygon in the requested unit.
     * Same strategy as measureLength: geodesic → planar → turf fallback.
     */
    measureArea(jsapiGeometry: any, unit: string): number {
        try {
            if (!jsapiGeometry || jsapiGeometry.type !== 'polygon') return 0;
            if (!jsapiGeometry.rings?.[0] || jsapiGeometry.rings[0].length < 3) return 0;
            if (!this.geometryEngine) return 0;

            // Primary: geodesic (needs WASM)
            try {
                const sqm = Math.abs(this.geometryEngine.geodesicArea(jsapiGeometry, 'square-meters'));
                if (!isNaN(sqm) && sqm > 0) {
                    if (this.isCustomAreaUnit(unit)) return sqm / this.getCustomAreaFactor(unit);
                    return this.convertArea(sqm, 'square-meters', unit);
                }
            } catch (_) { }

            // Fallback: planar (no WASM)
            try {
                const sqm = Math.abs(this.geometryEngine.planarArea(jsapiGeometry, 'square-meters'));
                if (!isNaN(sqm) && sqm > 0) {
                    if (this.isCustomAreaUnit(unit)) return sqm / this.getCustomAreaFactor(unit);
                    return this.convertArea(sqm, 'square-meters', unit);
                }
            } catch (_) { }

            // Last resort: turf
            const coords = jsapiGeometry.rings[0].map((p: number[]) =>
                this.convertToGeographic(p[0], p[1], jsapiGeometry.spatialReference)
            );
            if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                coords.push(coords[0]);
            }
            const sqm = turf.area(turf.polygon([coords]));
            return this.convertArea(sqm, 'square-meters', unit);
        } catch (e) {
            return 0;
        }
    }

    /**
     * Measure distance between two XY points in any SR.
     * Builds a 2-point Polyline and delegates to measureLength.
     */
    measurePointDistance(x1: number, y1: number, x2: number, y2: number, spatialReference: any, unit: string): number {
        try {
            if (this.Polyline) {
                const line = new this.Polyline({
                    paths: [[[x1, y1], [x2, y2]]],
                    spatialReference: spatialReference
                });
                return this.measureLength(line, unit);
            }
            // No Polyline class yet — fall back to coordinate conversion
            const ll1 = this.convertToGeographic(x1, y1, spatialReference);
            const ll2 = this.convertToGeographic(x2, y2, spatialReference);
            return this.turfDistance(turf.point(ll1), turf.point(ll2), unit);
        } catch (e) {
            return 0;
        }
    }

    /** Map widget linear unit strings to geometryEngine unit strings */
    toGeometryEngineLinearUnit(unit: string): string {
        const map: Record<string, string> = {
            'miles': 'miles', 'feet': 'feet', 'meters': 'meters',
            'kilometers': 'kilometers', 'yards': 'yards',
            'nautical-miles': 'nautical-miles', 'nauticalMiles': 'nautical-miles'
        };
        return map[unit] || 'meters';
    }

    /** Map widget area unit strings to geometryEngine unit strings */
    toGeometryEngineAreaUnit(unit: string): string {
        const map: Record<string, string> = {
            'square-meters': 'square-meters', 'square-feet': 'square-feet',
            'square-kilometers': 'square-kilometers', 'square-miles': 'square-miles',
            'square-yards': 'square-yards', 'acres': 'acres', 'hectares': 'hectares',
            'squareMeters': 'square-meters', 'squareFeet': 'square-feet',
            'squareKilometers': 'square-kilometers', 'squareMiles': 'square-miles'
        };
        return map[unit] || 'square-meters';
    }

    /**
     * Wrapper for turf.length that handles custom units.
     * If the unit is custom, calculates in meters then converts.
     */
    turfLength(geojson: any, unit: string): number {
        try {
            if (this.isCustomLinearUnit(unit)) {
                const meters = turf.length(geojson, { units: 'meters' as any });
                return meters / this.getCustomLinearFactor(unit);
            }
            return turf.length(geojson, { units: unit as any });
        } catch (e) {
            return 0;
        }
    }

    /**
     * Wrapper for turf.distance that handles custom units.
     * If the unit is custom, calculates in meters then converts.
     */
    turfDistance(from: any, to: any, unit: string): number {
        try {
            if (this.isCustomLinearUnit(unit)) {
                const meters = turf.distance(from, to, { units: 'meters' as any });
                return meters / this.getCustomLinearFactor(unit);
            }
            return turf.distance(from, to, { units: unit as any });
        } catch (e) {
            return 0;
        }
    }

    /**
     * Wrapper for turf.convertLength that handles custom units.
     * Converts through meters as an intermediate when custom units are involved.
     */
    convertLinearValue(value: number, fromUnit: string, toUnit: string): number {
        if (value === undefined || value === null || isNaN(value)) return 0;

        const fromIsCustom = this.isCustomLinearUnit(fromUnit);
        const toIsCustom = this.isCustomLinearUnit(toUnit);

        try {
            if (fromIsCustom && toIsCustom) {
                // Both custom: convert from -> meters -> to
                const meters = value * this.getCustomLinearFactor(fromUnit);
                return meters / this.getCustomLinearFactor(toUnit);
            } else if (fromIsCustom) {
                // Custom -> standard: convert to meters first, then use turf
                const meters = value * this.getCustomLinearFactor(fromUnit);
                return turf.convertLength(meters, 'meters' as any, toUnit as any);
            } else if (toIsCustom) {
                // Standard -> custom: convert to meters via turf, then to custom
                const meters = turf.convertLength(value, fromUnit as any, 'meters' as any);
                return meters / this.getCustomLinearFactor(toUnit);
            } else {
                // Both standard: use turf directly
                return turf.convertLength(value, fromUnit as any, toUnit as any);
            }
        } catch (e) {
            console.error('convertLinearValue error:', e);
            return 0;
        }
    }

    // ==================== End Custom Unit Helpers ====================

    convertArea(value: number, fromUnit: string, toUnit: string): number {
        // Validate input - only check for NaN/undefined, not zero
        if (value === undefined || value === null || isNaN(value)) {
            return 0;
        }

        // Normalize unit names - remove 'square-' or 'square ' prefix and handle hyphens
        const normalizeUnit = (unit: string): string => {
            if (!unit) return '';
            return unit.toLowerCase()
                .replace(/^square[-\s]*/i, '')  // Remove 'square-' or 'square ' prefix
                .replace(/[-\s]/g, '');          // Remove hyphens and spaces
        };

        const normalizedFromUnit = normalizeUnit(fromUnit);
        const normalizedToUnit = normalizeUnit(toUnit);

        // Build conversion factors including standard and custom area units
        const conversionFactors: Record<string, number> = {
            'meters': 1,
            'kilometers': 0.000001,
            'feet': 10.7639,
            'yards': 1.19599,
            'miles': 3.861e-7,
            'acres': 0.000247105,
            'hectares': 0.0001
        };

        // Add custom area units to conversion factors
        for (const customUnit of this.getCustomAreaUnits()) {
            const normalizedName = normalizeUnit(customUnit.name);
            conversionFactors[normalizedName] = 1 / customUnit.toSquareMeters;
        }

        // Validate units exist
        if (!conversionFactors[normalizedFromUnit] && conversionFactors[normalizedFromUnit] !== 0) {
            // Try matching by exact custom name
            const fromCustom = this.getCustomAreaUnits().find(u => u.name === fromUnit);
            if (fromCustom) {
                conversionFactors[normalizedFromUnit] = 1 / fromCustom.toSquareMeters;
            }
        }
        if (!conversionFactors[normalizedToUnit] && conversionFactors[normalizedToUnit] !== 0) {
            const toCustom = this.getCustomAreaUnits().find(u => u.name === toUnit);
            if (toCustom) {
                conversionFactors[normalizedToUnit] = 1 / toCustom.toSquareMeters;
            }
        }

        if (conversionFactors[normalizedFromUnit] === undefined || conversionFactors[normalizedToUnit] === undefined) {
            console.error('Invalid unit conversion:', fromUnit, toUnit, '(normalized:', normalizedFromUnit, normalizedToUnit, ')');
            return 0;
        }

        const metersValue = value / conversionFactors[normalizedFromUnit];
        const result = metersValue * conversionFactors[normalizedToUnit];

        return isNaN(result) ? 0 : result;
    }

    convertAllMeasurementsToNewLinearUnit(newUnit: string) {
        const updatedMeasurements = this.state.measurements.map(measurement => {
            const updatedMeasurement = { ...measurement };

            // Convert linear measurements using custom-unit-aware converter
            if (measurement.totalDistance !== undefined) {
                updatedMeasurement.totalDistance = this.convertLinearValue(
                    measurement.totalDistance,
                    measurement.linearUnit,
                    newUnit
                );
            }

            if (measurement.perimeter !== undefined) {
                updatedMeasurement.perimeter = this.convertLinearValue(
                    measurement.perimeter,
                    measurement.linearUnit,
                    newUnit
                );
            }

            if (measurement.radius !== undefined) {
                updatedMeasurement.radius = this.convertLinearValue(
                    measurement.radius,
                    measurement.linearUnit,
                    newUnit
                );
            }

            if (measurement.sideLength !== undefined) {
                updatedMeasurement.sideLength = this.convertLinearValue(
                    measurement.sideLength,
                    measurement.linearUnit,
                    newUnit
                );
            }

            // Convert segment distances
            if (measurement.segments && measurement.segments.length > 0) {
                updatedMeasurement.segments = measurement.segments.map(segment => ({
                    ...segment,
                    distance: this.convertLinearValue(
                        segment.distance,
                        measurement.linearUnit,
                        newUnit
                    )
                }));
            }

            updatedMeasurement.linearUnit = newUnit;
            return updatedMeasurement;
        });

        this.setState({ measurements: updatedMeasurements }, () => {
            this.updateAllMeasurementLabels();
        });
    }

    convertAllMeasurementsToNewAreaUnit(newUnit: string) {
        const updatedMeasurements = this.state.measurements.map(measurement => {
            const updatedMeasurement = { ...measurement };

            // Convert area measurements
            if (measurement.totalArea !== undefined) {
                updatedMeasurement.totalArea = this.convertArea(
                    measurement.totalArea,
                    measurement.areaUnit,
                    newUnit
                );
            }

            updatedMeasurement.areaUnit = newUnit;
            return updatedMeasurement;
        });

        this.setState({ measurements: updatedMeasurements }, () => {
            this.updateAllMeasurementLabels();
        });
    }

    updateAllMeasurementLabels() {
        if (!this.labelLayer) return;

        // Remove all existing label graphics
        this.labelLayer.removeAll();

        // Recreate labels for all measurements using their stored geometry
        this.state.measurements.forEach(measurement => {
            if (measurement.geometry) {
                this.addMeasurementLabel(measurement.geometry, measurement);
            }
        });
    }

    createSymbol(geometryType: string, color: string) {
        const config = this.props.config || {};

        if (geometryType === 'point') {
            return new this.SimpleMarkerSymbol({
                color: color,
                size: config.pointSize || 10,
                outline: {
                    color: config.pointOutlineColor || 'white',
                    width: config.pointOutlineWidth ?? 2
                }
            });
        } else if (geometryType === 'polyline') {
            return new this.SimpleLineSymbol({
                color: color,
                width: config.lineWidth || 3
            });
        } else if (geometryType === 'polygon') {
            return new this.SimpleFillSymbol({
                color: [
                    parseInt(color.slice(1, 3), 16),
                    parseInt(color.slice(3, 5), 16),
                    parseInt(color.slice(5, 7), 16),
                    config.fillOpacity ?? 0.3
                ],
                outline: {
                    color: config.outlineColor || color,
                    width: config.outlineWidth || 2
                }
            });
        }
    }

    /**
     * Calculate the approximate bounding box dimensions for a text label
     */
    calculateLabelBounds(text: string, fontSize: number, point: any): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } {
        // Estimate character width (approximately 0.6 * fontSize for most fonts)
        const charWidth = fontSize * 0.6;
        // Handle multi-line text
        const lines = text.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const textWidth = maxLineLength * charWidth;
        const textHeight = lines.length * fontSize * 1.2; // 1.2 for line height

        // Add padding
        const padding = fontSize * 0.5;

        return {
            minX: point.x - textWidth / 2 - padding,
            maxX: point.x + textWidth / 2 + padding,
            minY: point.y - textHeight / 2 - padding,
            maxY: point.y + textHeight / 2 + padding
        };
    }

    /**
     * Check if two bounding boxes overlap
     */
    boundsOverlap(bounds1: any, bounds2: any): boolean {
        return !(bounds1.maxX < bounds2.minX ||
            bounds1.minX > bounds2.maxX ||
            bounds1.maxY < bounds2.minY ||
            bounds1.minY > bounds2.maxY);
    }

    /**
     * Find a non-overlapping position for a label
     */
    findNonOverlappingPosition(
        labelPoint: any,
        labelText: string,
        fontSize: number,
        yoffset: number,
        measurementId: string
    ): { point: any; yoffset: number } {
        if (!this.state.printReadyLabels) {
            return { point: labelPoint, yoffset };
        }

        // Get all existing label graphics except the current measurement's labels
        const existingLabels = this.labelLayer.graphics.filter(g =>
            g.attributes &&
            g.attributes.labelType === 'main' &&
            g.attributes.measurementId !== measurementId
        );

        if (existingLabels.length === 0) {
            return { point: labelPoint, yoffset };
        }

        // Calculate bounds for the proposed label position
        const proposedBounds = this.calculateLabelBounds(
            labelText,
            fontSize,
            labelPoint
        );

        // Adjust bounds for yoffset
        proposedBounds.minY += yoffset;
        proposedBounds.maxY += yoffset;

        // Check for overlaps with existing labels
        let hasOverlap = false;
        for (let i = 0; i < existingLabels.length; i++) {
            const existingLabel = existingLabels.getItemAt(i);
            const existingSymbol = existingLabel.symbol;
            const existingPoint = existingLabel.geometry;
            const existingYOffset = existingSymbol.yoffset || 0;
            const existingFontSize = existingSymbol.font?.size || 12;

            const existingBounds = this.calculateLabelBounds(
                existingSymbol.text,
                existingFontSize,
                existingPoint
            );

            // Adjust for existing yoffset
            existingBounds.minY += existingYOffset;
            existingBounds.maxY += existingYOffset;

            if (this.boundsOverlap(proposedBounds, existingBounds)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            return { point: labelPoint, yoffset };
        }

        // Try alternative positions: up, down, left, right, diagonal positions
        const offsetMultiplier = fontSize * 2.5;
        const alternativeOffsets = [
            { xoff: 0, yoff: -offsetMultiplier * 2 },      // Further up
            { xoff: 0, yoff: offsetMultiplier * 2 },       // Further down
            { xoff: offsetMultiplier, yoff: 0 },            // Right
            { xoff: -offsetMultiplier, yoff: 0 },           // Left
            { xoff: offsetMultiplier, yoff: -offsetMultiplier }, // Upper right
            { xoff: -offsetMultiplier, yoff: -offsetMultiplier }, // Upper left
            { xoff: offsetMultiplier, yoff: offsetMultiplier },   // Lower right
            { xoff: -offsetMultiplier, yoff: offsetMultiplier },  // Lower left
            { xoff: 0, yoff: -offsetMultiplier * 3 },      // Much further up
            { xoff: 0, yoff: offsetMultiplier * 3 }        // Much further down
        ];

        for (const altOffset of alternativeOffsets) {
            const altPoint = new this.Point({
                x: labelPoint.x + altOffset.xoff,
                y: labelPoint.y + altOffset.yoff,
                spatialReference: labelPoint.spatialReference
            });

            const altBounds = this.calculateLabelBounds(labelText, fontSize, altPoint);
            altBounds.minY += yoffset;
            altBounds.maxY += yoffset;

            let altHasOverlap = false;
            for (let i = 0; i < existingLabels.length; i++) {
                const existingLabel = existingLabels.getItemAt(i);
                const existingSymbol = existingLabel.symbol;
                const existingPoint = existingLabel.geometry;
                const existingYOffset = existingSymbol.yoffset || 0;
                const existingFontSize = existingSymbol.font?.size || 12;

                const existingBounds = this.calculateLabelBounds(
                    existingSymbol.text,
                    existingFontSize,
                    existingPoint
                );

                existingBounds.minY += existingYOffset;
                existingBounds.maxY += existingYOffset;

                if (this.boundsOverlap(altBounds, existingBounds)) {
                    altHasOverlap = true;
                    break;
                }
            }

            if (!altHasOverlap) {
                return { point: altPoint, yoffset };
            }
        }

        // If no non-overlapping position found, return original position
        return { point: labelPoint, yoffset };
    }

    addMeasurementLabel(geometry: any, measurement: MeasurementRecord) {
        const config = this.props.config || {};
        const autoLabelMeasurements = config.autoLabelMeasurements !== false;

        if (!autoLabelMeasurements) return;

        let labelPoint;
        let labelText;

        if (geometry.type === 'point') {
            labelPoint = geometry;
            labelText = this.getPointLabelText(measurement.coordinates);
        } else if (geometry.type === 'polyline') {
            // For single-segment lines (2 vertices), calculate true geometric midpoint
            const isSimpleLine = geometry.paths[0] && geometry.paths[0].length === 2;

            if (isSimpleLine) {
                // Calculate geometric midpoint between the two vertices
                const start = geometry.paths[0][0];
                const end = geometry.paths[0][1];
                const midX = (start[0] + end[0]) / 2;
                const midY = (start[1] + end[1]) / 2;

                labelPoint = new this.Point({
                    x: midX,
                    y: midY,
                    spatialReference: geometry.spatialReference
                });
            } else {
                // For multi-segment lines, use the middle vertex
                const midIndex = Math.floor(geometry.paths[0].length / 2);
                const midPoint = geometry.paths[0][midIndex];
                labelPoint = new this.Point({
                    x: midPoint[0],
                    y: midPoint[1],
                    spatialReference: geometry.spatialReference
                });
            }

            labelText = `Distance: ${this.formatValue(measurement.totalDistance)} ${measurement.linearUnit}`;
        } else if (measurement.type === 'circle') {
            labelPoint = geometry.centroid;
            labelText = `Radius: ${this.formatValue(measurement.radius)} ${measurement.linearUnit}\nCircumference: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}\nArea: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`;
        } else {
            labelPoint = geometry.centroid;
            labelText = `Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}\nPerimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`;
        }

        // Main measurement label - adjust offsets for print-ready mode
        const printMode = this.state.printReadyLabels;
        let yoffset = 0;
        let fontSize = config.labelFontSize || 12;
        let haloSize = config.labelHaloSize ?? 2;

        if (geometry.type === 'point') {
            yoffset = printMode ? -32 : -15;  // More offset for print
            fontSize = config.labelFontSize || (printMode ? 10 : 10);
        } else if (geometry.type === 'polyline') {
            yoffset = printMode ? -8 : 0;  // More offset for print
            fontSize = config.labelFontSize || (printMode ? 11 : 12);
        } else {
            // Polygon/area/circle labels
            yoffset = printMode ? -10 : 0;  // More offset for print
            fontSize = config.labelFontSize || (printMode ? 11 : 12);
        }

        if (printMode) {
            haloSize = (config.labelHaloSize ?? 2) + 0.5;  // Slightly larger halo for print
        }

        // Calculate angle for single-segment polylines
        let labelAngle = 0;
        const isSimpleLine = geometry.type === 'polyline' && geometry.paths[0] && geometry.paths[0].length === 2;

        if (isSimpleLine && this.state.jimuMapView && this.state.jimuMapView.view) {
            const view = this.state.jimuMapView.view;
            const start = geometry.paths[0][0];
            const end = geometry.paths[0][1];

            // Create points in map coordinates
            const startPoint = new this.Point({
                x: start[0],
                y: start[1],
                spatialReference: geometry.spatialReference
            });
            const endPoint = new this.Point({
                x: end[0],
                y: end[1],
                spatialReference: geometry.spatialReference
            });

            // Convert to screen coordinates
            const startScreen = view.toScreen(startPoint);
            const endScreen = view.toScreen(endPoint);

            if (startScreen && endScreen) {
                // Calculate angle in screen space
                const dx = endScreen.x - startScreen.x;
                const dy = endScreen.y - startScreen.y;
                labelAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                // Normalize angle to keep text readable (avoid upside-down text)
                if (labelAngle > 90) {
                    labelAngle -= 180;
                } else if (labelAngle < -90) {
                    labelAngle += 180;
                }
            }
        }

        const textSymbol = new this.TextSymbol({
            text: labelText,
            color: config.labelColor || 'white',
            haloColor: config.labelHaloColor || measurement.color,
            haloSize: haloSize,
            font: {
                size: fontSize,
                family: config.labelFontFamily || 'Arial',
                weight: config.labelFontWeight || 'bold',
                style: config.labelFontStyle || 'normal'
            },
            angle: labelAngle,  // Apply rotation for single-segment lines
            yoffset: yoffset
        });

        const labelGraphic = new this.Graphic({
            geometry: labelPoint,
            symbol: textSymbol,
            attributes: {
                measurementId: measurement.id,
                labelType: 'main'
            }
        });

        this.labelLayer.add(labelGraphic);

        // Add segment labels (skip for point, circle, and if segment labels are disabled)
        if (this.state.showSegmentLabels && geometry.type !== 'point' && measurement.type !== 'circle' && measurement.segments && measurement.segments.length > 0) {
            // Skip segment labels for polylines with only 2 vertices (single segment) - show only total
            const isSimpleLine = geometry.type === 'polyline' && geometry.paths[0] && geometry.paths[0].length === 2;

            if (!isSimpleLine) {
                measurement.segments.forEach((segment, index) => {
                    // Calculate midpoint of the segment
                    const startCoords = geometry.type === 'polyline'
                        ? geometry.paths[0][index]
                        : geometry.rings[0][index];
                    const endCoords = geometry.type === 'polyline'
                        ? geometry.paths[0][index + 1]
                        : geometry.rings[0][index + 1];

                    if (!startCoords || !endCoords) return;

                    const midX = (startCoords[0] + endCoords[0]) / 2;
                    const midY = (startCoords[1] + endCoords[1]) / 2;

                    const segmentLabelPoint = new this.Point({
                        x: midX,
                        y: midY,
                        spatialReference: geometry.spatialReference
                    });

                    // Calculate angle using screen coordinates for accurate rotation
                    let angle = 0;
                    if (this.state.jimuMapView && this.state.jimuMapView.view) {
                        const view = this.state.jimuMapView.view;

                        // Create points in map coordinates
                        const startPoint = new this.Point({
                            x: startCoords[0],
                            y: startCoords[1],
                            spatialReference: geometry.spatialReference
                        });
                        const endPoint = new this.Point({
                            x: endCoords[0],
                            y: endCoords[1],
                            spatialReference: geometry.spatialReference
                        });

                        // Convert to screen coordinates
                        const startScreen = view.toScreen(startPoint);
                        const endScreen = view.toScreen(endPoint);

                        if (startScreen && endScreen) {
                            // Calculate angle in screen space
                            const dx = endScreen.x - startScreen.x;
                            const dy = endScreen.y - startScreen.y;
                            angle = Math.atan2(dy, dx) * (180 / Math.PI);  // Screen coordinates: y increases downward

                            // Normalize angle to keep text readable (avoid upside-down text)
                            if (angle > 90) {
                                angle -= 180;
                            } else if (angle < -90) {
                                angle += 180;
                            }
                        }
                    }

                    // Apply print-ready adjustments to segment labels
                    const segmentFontSize = config.segmentLabelFontSize || (printMode ? 10 : 10);
                    const segmentHaloSize = config.segmentLabelHaloSize ?? config.labelHaloSize ?? (printMode ? 2 : 1.5);

                    const segmentTextSymbol = new this.TextSymbol({
                        text: `${segment.label}: ${this.formatValue(segment.distance)} ${measurement.linearUnit}`,
                        color: config.segmentLabelColor || config.labelColor || 'white',
                        haloColor: config.segmentLabelHaloColor || config.labelHaloColor || measurement.color,
                        haloSize: segmentHaloSize,
                        font: {
                            size: segmentFontSize,
                            family: config.segmentLabelFontFamily || 'Arial',
                            weight: config.segmentLabelFontWeight || 'normal',
                            style: config.segmentLabelFontStyle || 'normal'
                        },
                        angle: angle,  // Apply rotation to align with segment
                        yoffset: printMode ? -5 : 0  // More offset for print
                    });

                    const segmentLabelGraphic = new this.Graphic({
                        geometry: segmentLabelPoint,
                        symbol: segmentTextSymbol,
                        attributes: {
                            measurementId: measurement.id,
                            labelType: 'segment',
                            segmentId: segment.id
                        }
                    });

                    this.labelLayer.add(segmentLabelGraphic);
                });
            }
        }
    }

    formatValue(value: number): string {
        const config = this.props.config || {};
        const precision = config.decimalPrecision ?? 2;

        let formattedValue: string;
        if (value < 0.01) formattedValue = value.toFixed(Math.max(precision, 4));
        else if (value < 1) formattedValue = value.toFixed(Math.max(precision, 3));
        else if (value < 10) formattedValue = value.toFixed(precision);
        else if (value < 100) formattedValue = value.toFixed(Math.max(precision - 1, 0));
        else formattedValue = value.toFixed(0);

        // Add thousands separators
        const parts = formattedValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    /**
     * Returns an inline SVG path icon for a given measurement type.
     * Used to give each measurement card a visual cue independent of color.
     */
    getTypeIconPath(type: string): string {
        switch (type) {
            case 'point':
                return 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z';
            case 'distance':
                return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
            case 'area':
                return 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z';
            case 'circle':
                return 'M12 21a9 9 0 100-18 9 9 0 000 18z';
            case 'triangle':
                return 'M12 4L3 20h18L12 4z';
            default:
                return 'M4 6h16M4 12h16M4 18h16';
        }
    }

    /**
     * Returns a short human label for the currently-active tool.
     */
    getToolLabel(tool: string | null): string {
        const config = this.props.config || {};
        switch (tool) {
            case 'point': return config.pointButtonText || 'Point';
            case 'distance': return config.lineButtonText || 'Line';
            case 'freehand-polyline': return config.freehandLineButtonText || 'Freehand Line';
            case 'rectangle': return config.rectangleButtonText || 'Rectangle';
            case 'area': return config.areaButtonText || 'Area';
            case 'freehand-polygon': return config.freehandAreaButtonText || 'Freehand Area';
            case 'circle': return config.circleButtonText || 'Circle';
            case 'triangle': return config.triangleButtonText || 'Triangle';
            case 'edit': return 'Edit Vertices';
            default: return '';
        }
    }

    /**
     * Returns interaction hint text for the active tool (shown in draw-mode banner).
     */
    getToolHint(tool: string | null): string {
        switch (tool) {
            case 'point':
                return 'Click on the map to place a point';
            case 'distance':
                return 'Click to add points · double-click to finish · Esc to cancel';
            case 'area':
                return 'Click to add vertices · double-click to close · Esc to cancel';
            case 'freehand-polyline':
            case 'freehand-polygon':
                return 'Click and drag on the map · release to finish';
            case 'rectangle':
                return 'Click and drag to draw a rectangle · Esc to cancel';
            case 'circle':
                return 'Click center, drag for radius · Esc to cancel';
            case 'triangle':
                return 'Click 3 points · hold Shift for equilateral · Esc to cancel';
            case 'edit':
                return 'Drag vertices to reshape · Esc when done';
            default:
                return '';
        }
    }

    /** Format a date as relative ("3 min ago", "Yesterday") for the past 24h, then absolute. */
    formatRelativeDate(date: Date): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const now = Date.now();
        const diffMs = now - d.getTime();
        const diffSec = Math.round(diffMs / 1000);
        if (diffSec < 5) return 'just now';
        if (diffSec < 60) return `${diffSec} sec ago`;
        const diffMin = Math.round(diffSec / 60);
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.round(diffMin / 60);
        if (diffHr < 24) return `${diffHr} hr ago`;
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        const startOfDate = new Date(d); startOfDate.setHours(0, 0, 0, 0);
        const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
        if (dayDiff === 1) return `Yesterday, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
        if (dayDiff < 7) return d.toLocaleDateString([], { weekday: 'short' }) + ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    activateTool(tool: 'point' | 'distance' | 'freehand-polyline' | 'rectangle' | 'area' | 'freehand-polygon' | 'circle' | 'triangle' | 'edit') {
        if (!this.state.sketchWidget) return;

        if (this.state.currentTool === tool) {
            this.setState({ currentTool: null, liveMeasurement: null, editingMeasurementId: null });
            this.state.sketchWidget.cancel();
            this.clearLiveLabel();
            if (typeof this.cleanupTriangleHandlers === 'function') {
                this.cleanupTriangleHandlers();
            }
            return;
        }

        // Cancel any existing sketch operation
        this.state.sketchWidget.cancel();
        this.clearLiveLabel();
        if (typeof this.cleanupTriangleHandlers === 'function') {
            this.cleanupTriangleHandlers();
        }

        // Check if autoClearOnToolSwitch is enabled
        const config = this.props.config || {};
        const autoClearOnToolSwitch = config.autoClearOnToolSwitch === true;

        // If switching tools and autoClearOnToolSwitch is enabled, clear all measurements
        if (this.state.currentTool && autoClearOnToolSwitch) {
            this.sketchLayer.removeAll();
            this.labelLayer.removeAll();
            this.measurementCount = 0;
            this.setState({
                measurements: [],
                expandedMeasurements: new Set()
            });
        }

        // Handle edit tool specially
        if (tool === 'edit') {
            this.setState({
                currentTool: tool,
                liveMeasurement: null,
                editingMeasurementId: null
            });
            // Edit mode: user can click on existing graphics to edit their vertices
            // The sketch widget's update events will handle the editing
            return;
        }

        // Auto-disable segment labels for freehand tools
        if ((tool === 'freehand-polyline' || tool === 'freehand-polygon') && this.state.showSegmentLabels) {
            this.setState({
                currentTool: tool,
                liveMeasurement: null,
                editingMeasurementId: null,
                showSegmentLabels: false
            }, () => {
                // Remove existing segment labels
                const segmentLabels = this.labelLayer.graphics.filter(g =>
                    g.attributes && g.attributes.labelType === 'segment'
                );
                segmentLabels.forEach(label => this.labelLayer.remove(label));
            });
        } else {
            this.setState({ currentTool: tool, liveMeasurement: null, editingMeasurementId: null });
        }

        if (tool === 'point') {
            this.state.sketchWidget.create('point');
        } else if (tool === 'distance') {
            this.state.sketchWidget.create('polyline');
        } else if (tool === 'freehand-polyline') {
            this.state.sketchWidget.create('polyline', { mode: 'freehand' });
        } else if (tool === 'rectangle') {
            this.state.sketchWidget.create('rectangle');
        } else if (tool === 'area') {
            this.state.sketchWidget.create('polygon');
        } else if (tool === 'freehand-polygon') {
            this.state.sketchWidget.create('polygon', { mode: 'freehand' });
        } else if (tool === 'circle') {
            this.state.sketchWidget.create('circle');
        } else if (tool === 'triangle') {
            this.setupTriangleDrawing();
        }
    }

    editMeasurementVertices(measurementId: string) {
        const measurement = this.state.measurements.find(m => m.id === measurementId);
        if (!measurement || !measurement.graphic || !this.state.sketchWidget) return;

        // Only allow editing lines and polygons (not points or circles)
        const geometryType = measurement.geometry?.type;
        if (geometryType !== 'polyline' && geometryType !== 'polygon') {
            console.warn('Vertex editing is only available for lines and polygons');
            return;
        }

        // For circles, don't allow vertex editing (they need special handling)
        if (measurement.type === 'circle') {
            console.warn('Vertex editing is not available for circles');
            return;
        }

        // Cancel any current drawing operation
        this.state.sketchWidget.cancel();
        this.clearLiveLabel();
        if (typeof this.cleanupTriangleHandlers === 'function') {
            this.cleanupTriangleHandlers();
        }

        // Set to edit mode
        this.setState({
            currentTool: 'edit',
            liveMeasurement: null,
            editingMeasurementId: measurementId
        });

        // Start the update/reshape operation on the graphic
        this.state.sketchWidget.update([measurement.graphic], {
            tool: 'reshape',
            enableRotation: false,
            enableScaling: false,
            reshapeOptions: {
                edgeOperation: 'split',
                shapeOperation: 'move',
                vertexOperation: 'move'
            }
        });
    }

    deleteMeasurement(id: string, opts: { showToast?: boolean } = { showToast: true }) {
        const measurement = this.state.measurements.find(m => m.id === id);
        if (!measurement) return;

        const action: HistoryAction = { type: 'DELETE', measurement: measurement };

        // Record this action in undo history BEFORE deleting
        this.recordAction(action);

        // Remove the graphic
        this.sketchLayer.remove(measurement.graphic);

        // Remove all labels associated with this measurement
        const labelsToRemove = this.labelLayer.graphics.filter(g => {
            return g.attributes && g.attributes.measurementId === id;
        });

        labelsToRemove.forEach(label => this.labelLayer.remove(label));

        // Drop ref-map entries — keeps the Maps from growing unbounded
        this.exportTriggerRefs.delete(id);
        this.overflowTriggerRefs.delete(id);
        this._statsCache = null;

        this.setState(prevState => ({
            measurements: prevState.measurements.filter(m => m.id !== id),
            expandedMeasurements: new Set(
                Array.from(prevState.expandedMeasurements).filter(expId => expId !== id)
            ),
            // If we're currently viewing this measurement in the detail pane, fall back to the list
            detailViewMeasurementId: prevState.detailViewMeasurementId === id ? null : prevState.detailViewMeasurementId,
            undoToast: opts.showToast !== false
                ? { message: `Deleted "${measurement.label}"`, action }
                : prevState.undoToast
        }));

        if (opts.showToast !== false) {
            if (this.deleteToastTimer) clearTimeout(this.deleteToastTimer);
            this.deleteToastTimer = setTimeout(() => {
                this.safeSetState({ undoToast: null });
                this.deleteToastTimer = null;
            }, 6000);
        }
    }

    /** Inline-rename a measurement label (used by the editable card title). */
    renameMeasurement(id: string, newLabel: string) {
        const trimmed = (newLabel || '').trim();
        if (!trimmed) return; // ignore empty rename — keep existing label
        this.setState(prevState => ({
            measurements: prevState.measurements.map(m => m.id === id ? { ...m, label: trimmed } : m),
            renamingMeasurementId: null,
            renamingValue: ''
        }), () => {
            // Update map labels with the new name
            const updated = this.state.measurements.find(m => m.id === id);
            if (updated) {
                this.refreshSingleMeasurementLabels(updated);
            }
        });
        this._statsCache = null;
    }

    /** Update a measurement's color (palette swatch in the card header). */
    setMeasurementColor(id: string, newColor: string) {
        const measurement = this.state.measurements.find(m => m.id === id);
        if (!measurement) return;
        // Recolor the on-map graphic symbol
        try {
            const newSymbol = this.createSymbol(measurement.geometry?.type || measurement.type, newColor);
            if (measurement.graphic && newSymbol) {
                measurement.graphic.symbol = newSymbol;
            }
            // Recolor associated labels
            this.labelLayer.graphics.forEach((g: any) => {
                if (g.attributes && g.attributes.measurementId === id && g.symbol && g.symbol.color !== undefined) {
                    const sym = g.symbol.clone ? g.symbol.clone() : g.symbol;
                    sym.color = newColor;
                    g.symbol = sym;
                }
            });
        } catch (_) { /* symbol creation can fail for unusual geometries; ignore */ }

        this.setState(prevState => ({
            measurements: prevState.measurements.map(m => m.id === id ? { ...m, color: newColor } : m),
            colorPickerForId: null
        }));
    }

    /** Duplicate a measurement (creates a new measurement record with a cloned graphic and a fresh color). */
    duplicateMeasurement(id: string) {
        const original = this.state.measurements.find(m => m.id === id);
        if (!original || !original.graphic) return;
        try {
            const clonedGraphic = original.graphic.clone();
            // Slight offset so the duplicate is visible
            const geom = clonedGraphic.geometry;
            if (geom && geom.spatialReference) {
                const offset = 100; // map units; visible at most zoom levels
                if (geom.type === 'point') {
                    clonedGraphic.geometry = geom.clone();
                    clonedGraphic.geometry.x = (geom as any).x + offset;
                    clonedGraphic.geometry.y = (geom as any).y + offset;
                } else if ((geom as any).paths) {
                    const cloned = geom.clone();
                    (cloned as any).paths = (geom as any).paths.map((path: any[]) => path.map((pt: any[]) => [pt[0] + offset, pt[1] + offset]));
                    clonedGraphic.geometry = cloned;
                } else if ((geom as any).rings) {
                    const cloned = geom.clone();
                    (cloned as any).rings = (geom as any).rings.map((ring: any[]) => ring.map((pt: any[]) => [pt[0] + offset, pt[1] + offset]));
                    clonedGraphic.geometry = cloned;
                }
            }
            // Pick a fresh color (one not currently in use, if available)
            const usedColors = new Set(this.state.measurements.map(m => m.color));
            const newColor = (this.colorPalette || []).find(c => !usedColors.has(c)) || this.colorPalette[this.state.measurements.length % this.colorPalette.length];
            const newSymbol = this.createSymbol(clonedGraphic.geometry?.type || original.type, newColor);
            if (newSymbol) clonedGraphic.symbol = newSymbol;
            this.sketchLayer.add(clonedGraphic);
            // createMeasurement assigns a fresh id, labels, and pushes into state
            this.createMeasurement(clonedGraphic);
        } catch (e) {
            console.warn('Duplicate failed:', e);
        }
    }

    /** Undo the most recent delete (called from the undo-toast button). */
    undoLastDelete() {
        const toast = this.state.undoToast;
        if (!toast) return;
        // Bulk delete: each deletion pushed its own DELETE action, so undo() once per item.
        if (toast.bulkCount && toast.bulkCount > 0) {
            for (let i = 0; i < toast.bulkCount; i++) this.undo();
            if (this.deleteToastTimer) { clearTimeout(this.deleteToastTimer); this.deleteToastTimer = null; }
            this.setState({ undoToast: null });
            return;
        }
        if (!toast.action || toast.action.type !== 'DELETE') return;
        // The unified undo() handler already knows how to revert a DELETE action,
        // but since we've already pushed it to the undo stack via recordAction,
        // just call undo() — it'll pop our action and restore.
        this.undo();
        if (this.deleteToastTimer) { clearTimeout(this.deleteToastTimer); this.deleteToastTimer = null; }
        this.setState({ undoToast: null });
    }

    clearAllMeasurements() {
        this.setState({ showClearAllDialog: true });
    }

    confirmClearAll() {
        // Clear sketch layer
        this.sketchLayer.removeAll();

        // Clear label layer
        this.labelLayer.removeAll();

        // Cancel any active sketch operation
        if (this.state.sketchWidget) {
            this.state.sketchWidget.cancel();
        }

        // Reset measurement count
        this.measurementCount = 0;

        this.setState({
            measurements: [],
            expandedMeasurements: new Set(),
            detailViewMeasurementId: null,
            currentTool: null,
            liveMeasurement: null,
            showClearAllDialog: false,
            undoStack: [],  // Clear undo history
            redoStack: []   // Clear redo history
        });
    }

    togglePrintReadyLabels() {
        const newPrintReadyState = !this.state.printReadyLabels;

        this.setState({ printReadyLabels: newPrintReadyState }, () => {
            // Refresh all labels with new offsets
            this.refreshAllLabels();
        });
    }

    refreshAllLabels() {
        // Remove all existing labels
        this.labelLayer.removeAll();

        // Recreate labels for all measurements with updated offsets
        this.state.measurements.forEach(measurement => {
            if (measurement.geometry) {
                this.addMeasurementLabel(measurement.geometry, measurement);
            }
        });
    }

    setupTriangleDrawing() {
        if (!this.state.jimuMapView || !this.state.jimuMapView.view) return;

        const view = this.state.jimuMapView.view;

        // Reset triangle state and clear live measurements
        this.setState({ trianglePoints: [], liveMeasurement: null });
        this.clearLiveLabel();

        // Disable popups while drawing
        (view.popup as any).autoOpenEnabled = false;

        let startPoint: any = null;
        let previewGraphic: any = null;

        const clickHandler = view.on('click', (event: any) => {
            event.stopPropagation();

            if (!startPoint) {
                // First click - set start point
                startPoint = event.mapPoint;
            } else {
                // Second click - complete triangle
                const endPoint = event.mapPoint;

                // Clear live measurement and label
                this.setState({ liveMeasurement: null });
                this.clearLiveLabel();

                // Remove preview
                if (previewGraphic) {
                    this.sketchLayer.remove(previewGraphic);
                    previewGraphic = null;
                }

                // Calculate final equilateral triangle
                const triangle = this.calculateEquilateralTriangle(startPoint, endPoint);

                // Create final graphic
                const color = this.colorPalette[this.measurementCount % this.colorPalette.length];
                const graphic = new this.Graphic({
                    geometry: triangle,
                    symbol: this.createSymbol('polygon', color),
                    attributes: {
                        measurementId: `triangle-${Date.now()}`
                    }
                });

                this.sketchLayer.add(graphic);
                this.createMeasurement(graphic);

                // Reset
                startPoint = null;

                // Cleanup handlers
                clickHandler.remove();
                pointerMoveHandler.remove();
                (view.popup as any).autoOpenEnabled = true;
                view.container.style.cursor = 'default';

                // Restart if continuous drawing
                const continuousDrawing = this.props.config?.continuousDrawing !== false;
                if (continuousDrawing && this.state.currentTool === 'triangle') {
                    setTimeout(() => {
                        if (this.state.currentTool === 'triangle') {
                            this.setupTriangleDrawing();
                        }
                    }, 100);
                } else {
                    this.setState({ currentTool: null });
                }
            }
        });

        const pointerMoveHandler = view.on('pointer-move', (event: any) => {
            if (!startPoint) return;

            const currentPoint = view.toMap({ x: event.x, y: event.y });
            if (!currentPoint) return;

            // Remove previous preview
            if (previewGraphic) {
                this.sketchLayer.remove(previewGraphic);
            }

            // Calculate equilateral triangle
            const triangle = this.calculateEquilateralTriangle(startPoint, currentPoint);

            // Create preview graphic
            const color = this.colorPalette[this.measurementCount % this.colorPalette.length];
            previewGraphic = new this.Graphic({
                geometry: triangle,
                symbol: this.createSymbol('polygon', color)
            });

            this.sketchLayer.add(previewGraphic);

            // Calculate and display live measurements
            try {
                const rings = triangle.rings[0];

                // Geodesic area/perimeter directly on raw JSAPI geometry
                const areaConverted = this.measureArea(triangle, this.state.currentAreaUnit);
                const perimeter = this.measureLength(triangle, this.state.currentLinearUnit);

                // Geodesic side lengths
                const side1 = this.measurePointDistance(rings[0][0], rings[0][1], rings[1][0], rings[1][1], triangle.spatialReference, this.state.currentLinearUnit);
                const side2 = this.measurePointDistance(rings[1][0], rings[1][1], rings[2][0], rings[2][1], triangle.spatialReference, this.state.currentLinearUnit);
                const side3 = this.measurePointDistance(rings[2][0], rings[2][1], rings[0][0], rings[0][1], triangle.spatialReference, this.state.currentLinearUnit);
                const avgSideLength = (side1 + side2 + side3) / 3;

                this.setState({
                    liveMeasurement: {
                        value: `Side Length: ${this.formatValue(avgSideLength)} ${this.state.currentLinearUnit}\nPerimeter: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}\nArea: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}`,
                        type: 'triangle'
                    }
                });

                // Update live label
                this.updateLiveLabel(
                    triangle,
                    `Side Length: ${this.formatValue(avgSideLength)} ${this.state.currentLinearUnit}\nPerimeter: ${this.formatValue(perimeter)} ${this.state.currentLinearUnit}\nArea: ${this.formatValue(areaConverted)} ${this.state.currentAreaUnit}`,
                    'polygon'
                );
            } catch (error) {
                // Ignore errors during live measurement
            }
        });

        // Store handlers for cleanup
        this.triangleClickHandler = {
            remove: () => {
                clickHandler.remove();
                pointerMoveHandler.remove();
                if (previewGraphic) {
                    this.sketchLayer.remove(previewGraphic);
                }
            }
        };

        view.container.style.cursor = 'crosshair';
    }

    calculateEquilateralTriangle(centerPoint: any, edgePoint: any): any {
        // Calculate radius (distance from center to edge)
        const dx = edgePoint.x - centerPoint.x;
        const dy = edgePoint.y - centerPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        // Calculate three vertices of equilateral triangle
        // First vertex points upward (north)
        const angles = [
            -Math.PI / 2,           // Top vertex (90 degrees up)
            -Math.PI / 2 + (2 * Math.PI / 3),  // Bottom-right vertex (210 degrees)
            -Math.PI / 2 + (4 * Math.PI / 3)   // Bottom-left vertex (330 degrees)
        ];

        const vertices = angles.map(angle => [
            centerPoint.x + radius * Math.cos(angle),
            centerPoint.y + radius * Math.sin(angle)
        ]);

        // Close the polygon
        vertices.push(vertices[0]);

        return new this.Polygon({
            rings: [vertices],
            spatialReference: centerPoint.spatialReference
        });
    }

    cleanupTriangleHandlers() {
        if (this.triangleClickHandler) {
            this.triangleClickHandler.remove();
            this.triangleClickHandler = null;
        }

        // Clear live measurements and labels
        this.clearLiveLabel();
        if (this.state) {
            this.setState({ liveMeasurement: null });
        }

        // Re-enable popups
        if (this.state && this.state.jimuMapView && this.state.jimuMapView.view && this.state.jimuMapView.view.popup) {
            (this.state.jimuMapView.view.popup as any).autoOpenEnabled = true;
        }

        if (this.state && this.state.jimuMapView && this.state.jimuMapView.view && this.state.jimuMapView.view.container) {
            this.state.jimuMapView.view.container.style.cursor = 'default';
        }

        if (this.state) {
            this.setState({ trianglePoints: [] });
        }
    }

    toggleMeasurementExpansion(id: string) {
        this.setState(prevState => {
            const newExpanded = new Set(prevState.expandedMeasurements);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return { expandedMeasurements: newExpanded };
        });
    }

    // ==================== Multi-select mode ====================

    /** Toggle select mode on/off. Entering clears any prior selection. */
    toggleSelectMode() {
        this.setState(prev => ({
            selectMode: !prev.selectMode,
            selectedIds: new Set<string>(),
            // Close transient UI so checkboxes render cleanly
            colorPickerForId: null,
            renamingMeasurementId: null,
            exportDropdownOpen: {},
            overflowDropdownOpen: {}
        }));
    }

    /** Toggle one measurement's checkbox. */
    toggleSelected(id: string) {
        this.setState(prev => {
            const next = new Set(prev.selectedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return { selectedIds: next };
        });
    }

    /** Select every currently visible (filtered) measurement, or clear if all are selected. */
    toggleSelectAll(visibleIds: string[]) {
        this.setState(prev => {
            const allSelected = visibleIds.length > 0 && visibleIds.every(id => prev.selectedIds.has(id));
            return { selectedIds: allSelected ? new Set<string>() : new Set(visibleIds) };
        });
    }

    /** Delete every selected measurement. Each delete goes through the normal path
     *  so undo history stays intact; the per-delete toasts are suppressed in favor
     *  of one summary toast. */
    deleteSelected() {
        const ids: string[] = Array.from(this.state.selectedIds);
        if (ids.length === 0) return;
        ids.forEach(id => this.deleteMeasurement(id, { showToast: false }));
        this.setState({
            selectMode: false,
            selectedIds: new Set<string>(),
            undoToast: {
                message: `Deleted ${ids.length} measurement${ids.length === 1 ? '' : 's'}`,
                action: null,
                bulkCount: ids.length
            }
        });
        if (this.deleteToastTimer) clearTimeout(this.deleteToastTimer);
        this.deleteToastTimer = setTimeout(() => {
            this.deleteToastTimer = null;
            this.safeSetState({ undoToast: null });
        }, 6000);
    }

    /** Export the selected measurements as one GeoJSON file. */
    exportSelectedToGeoJSON() {
        const selected = this.state.measurements.filter(m => this.state.selectedIds.has(m.id));
        if (selected.length === 0) return;
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;
        const geoJSON = this.buildGeoJSONFeatureCollection(selected);
        const dataStr = JSON.stringify(geoJSON, null, 2);
        const dataUri = 'data:application/geo+json;charset=utf-8,' + encodeURIComponent(dataStr);
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `measurements_selected${timestamp}.geojson`);
        linkElement.click();
        this.setState({ selectMode: false, selectedIds: new Set<string>() });
    }

    // ==================== Sorting ====================

    /** Sort a measurements array per the current sortOrder. Non-mutating. */
    sortMeasurements(list: MeasurementRecord[]): MeasurementRecord[] {
        const order = this.state.sortOrder;
        const sorted = [...list];
        switch (order) {
            case 'oldest':
                sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                break;
            case 'name':
                sorted.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
                break;
            case 'type':
                sorted.sort((a, b) => a.type.localeCompare(b.type) || a.timestamp.getTime() - b.timestamp.getTime());
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                break;
        }
        return sorted;
    }

    // ==================== Clipboard ====================

    /** Copy text to the clipboard and flash a "Copied" indicator keyed to the stat. */
    copyStatToClipboard(key: string, text: string) {
        const flash = () => {
            this.setState({ copiedStatKey: key });
            if (this.copiedFlashTimer) clearTimeout(this.copiedFlashTimer);
            this.copiedFlashTimer = setTimeout(() => {
                this.copiedFlashTimer = null;
                this.safeSetState({ copiedStatKey: null });
            }, 1500);
        };
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(flash).catch(() => { /* clipboard denied; no flash */ });
        } else {
            // Legacy fallback
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                flash();
            } catch (err) { /* give up quietly */ }
        }
    }

    /** Open the full-pane detail view for one measurement; captures list scroll position so we can restore it on exit. */
    openDetailView(id: string) {
        // In select mode a card click toggles selection instead of drilling in
        if (this.state.selectMode) {
            this.toggleSelected(id);
            return;
        }
        const scrollTop = this.listScrollRef ? this.listScrollRef.scrollTop : 0;
        this.setState({
            detailViewMeasurementId: id,
            listScrollTop: scrollTop,
            // Close any open inline elements so we don't carry transient UI state into the detail view
            colorPickerForId: null,
            renamingMeasurementId: null,
            exportDropdownOpen: {},
            overflowDropdownOpen: {}
        });
    }

    /** Return to the list view and restore the scroll position. */
    exitDetailView() {
        const scrollTop = this.state.listScrollTop;
        this.setState({
            detailViewMeasurementId: null,
            colorPickerForId: null,
            renamingMeasurementId: null,
            exportDropdownOpen: {},
            overflowDropdownOpen: {}
        }, () => {
            // Restore scroll on next paint so the container has time to re-render
            requestAnimationFrame(() => {
                if (this.listScrollRef) this.listScrollRef.scrollTop = scrollTop;
            });
        });
    }

    toggleSegmentLabels() {
        const newShowSegmentLabels = !this.state.showSegmentLabels;

        this.setState({ showSegmentLabels: newShowSegmentLabels }, () => {
            if (newShowSegmentLabels) {
                // Re-add segment labels for all measurements
                this.state.measurements.forEach(measurement => {
                    if (measurement.geometry.type !== 'point') {
                        this.refreshSingleMeasurementLabels(measurement);
                    }
                });
            } else {
                // Remove all segment labels
                const segmentLabels = this.labelLayer.graphics.filter(g =>
                    g.attributes && g.attributes.labelType === 'segment'
                );
                segmentLabels.forEach(label => this.labelLayer.remove(label));
            }
        });
    }

    toggleTooltips() {
        const newShowTooltips = !this.state.showTooltips;

        this.setState({ showTooltips: newShowTooltips }, () => {
            if (this.state.sketchWidget) {
                // Update the sketch widget's tooltip options
                this.state.sketchWidget.tooltipOptions = {
                    enabled: newShowTooltips
                };
            }
        });
    }

    toggleSnapping() {
        const newEnableSnapping = !this.state.enableSnapping;

        this.setState({ enableSnapping: newEnableSnapping }, () => {
            this.updateSnappingConfiguration(newEnableSnapping);
        });
    }

    zoomToMeasurement(measurement: MeasurementRecord) {
        if (this.state.jimuMapView && measurement.graphic) {
            this.state.jimuMapView.view.goTo({
                target: measurement.graphic,
                scale: this.state.jimuMapView.view.scale / 2
            });
        }
    }

    exportAllToJSON() {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        const exportData = this.state.measurements.map(m => ({
            label: m.label,
            type: m.type,
            timestamp: m.timestamp.toISOString(),
            coordinates: m.coordinates || null,
            distance: m.totalDistance,
            area: m.totalArea,
            perimeter: m.perimeter,
            radius: m.radius,
            linearUnit: m.linearUnit,
            areaUnit: m.areaUnit,
            segments: m.segments
        }));

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        const exportFileDefaultName = `measurements${timestamp}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    exportMeasurementToJSON(measurement: MeasurementRecord) {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        const exportData = {
            label: measurement.label,
            type: measurement.type,
            timestamp: measurement.timestamp.toISOString(),
            coordinates: measurement.coordinates || null,
            distance: measurement.totalDistance,
            area: measurement.totalArea,
            perimeter: measurement.perimeter,
            radius: measurement.radius,
            sideLength: measurement.sideLength,
            linearUnit: measurement.linearUnit,
            areaUnit: measurement.areaUnit,
            segments: measurement.segments
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        const exportFileDefaultName = `${measurement.label.replace(/\s+/g, '_')}${timestamp}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    getSymbologyProperties(measurement: MeasurementRecord): any {
        const symbology: any = {};
        const color = measurement.color;

        const typeLabels = {
            'point': 'Point',
            'distance': 'Line',
            'area': 'Area',
            'circle': 'Circle'
        };

        symbology.description = `${typeLabels[measurement.type] || measurement.type} measurement`;

        if (measurement.type === 'point') {
            symbology.marker_color = color;
            symbology.marker_size = 12;
            symbology.marker_symbol = 'circle';
            symbology.stroke = '#ffffff';
            symbology.stroke_width = 2;
        } else if (measurement.type === 'distance') {
            symbology.stroke = color;
            symbology.stroke_width = 3;
            symbology.stroke_opacity = 1;
        } else if (measurement.type === 'area' || measurement.type === 'circle' || measurement.type === 'triangle') {
            symbology.fill = color;
            symbology.fill_opacity = 0.3;
            symbology.stroke = color;
            symbology.stroke_width = 2;
        }

        return symbology;
    }

    /** Build the GeoJSON FeatureCollection for the given measurements.
     *  Shared by file export and session persistence so the two formats never drift. */
    buildGeoJSONFeatureCollection(measurements: MeasurementRecord[]) {
        const features = measurements.map(measurement => {
            const symbologyProps = this.getSymbologyProperties(measurement);
            return {
                type: "Feature",
                properties: {
                    id: measurement.id,
                    name: measurement.label,
                    label: measurement.label,
                    measurementType: measurement.type,
                    type: measurement.type,
                    timestamp: measurement.timestamp.toISOString(),
                    created: measurement.timestamp.toISOString(),
                    color: measurement.color,
                    linearUnit: measurement.linearUnit,
                    areaUnit: measurement.areaUnit,
                    totalDistance: measurement.totalDistance,
                    totalArea: measurement.totalArea,
                    perimeter: measurement.perimeter,
                    radius: measurement.radius,
                    sideLength: measurement.sideLength,
                    coordinates: measurement.coordinates,
                    segments: measurement.segments,
                    ...symbologyProps
                },
                geometry: measurement.geojson.geometry
            };
        });
        return {
            type: "FeatureCollection",
            features: features,
            crs: {
                type: "name",
                properties: {
                    name: "EPSG:4326"
                }
            }
        };
    }

    // ==================== Session persistence (localStorage) ====================
    // Gated behind config.enablePersistence. Measurements are stored as the same
    // GeoJSON FeatureCollection the export/import round trip already uses, under
    // a key scoped to this widget instance, so multiple widgets never collide.

    private get persistenceKey(): string {
        return `enhanced-measurement-session-${this.props.id}`;
    }

    private persistenceEnabled(): boolean {
        const config = this.props.config || {};
        return config.enablePersistence === true && typeof window !== 'undefined' && !!window.localStorage;
    }

    /** Debounced save. Called from componentDidUpdate whenever measurements change. */
    schedulePersist() {
        if (!this.persistenceEnabled()) return;
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            this.persistTimer = null;
            try {
                if (this.state.measurements.length === 0) {
                    window.localStorage.removeItem(this.persistenceKey);
                    return;
                }
                const fc = this.buildGeoJSONFeatureCollection(this.state.measurements);
                window.localStorage.setItem(this.persistenceKey, JSON.stringify(fc));
            } catch (err) {
                // Quota errors and private-browsing failures are non-fatal; persistence
                // silently degrades to session-only behavior.
                console.debug('Session persistence save failed:', err);
            }
        }, 800);
    }

    /** Check storage for a saved session; if found, surface the restore banner. */
    checkForSavedSession() {
        if (!this.persistenceEnabled()) return;
        try {
            const raw = window.localStorage.getItem(this.persistenceKey);
            if (!raw) return;
            const fc = JSON.parse(raw);
            const count = Array.isArray(fc?.features) ? fc.features.length : 0;
            if (count > 0) {
                this.safeSetState({ restoreBannerCount: count });
            }
        } catch (err) {
            console.debug('Session persistence read failed:', err);
        }
    }

    /** Restore the saved session through the normal GeoJSON import path (silently). */
    restoreSavedSession() {
        try {
            const raw = window.localStorage.getItem(this.persistenceKey);
            if (!raw) {
                this.setState({ restoreBannerCount: null });
                return;
            }
            const fc = JSON.parse(raw);
            this.setState({ restoreBannerCount: null }, () => {
                this.importGeoJSON(fc, { silent: true });
            });
        } catch (err) {
            console.debug('Session restore failed:', err);
            this.setState({ restoreBannerCount: null });
        }
    }

    /** Dismiss the banner and clear the stored session so it never re-prompts. */
    dismissSavedSession() {
        try {
            window.localStorage.removeItem(this.persistenceKey);
        } catch (err) { /* non-fatal */ }
        this.setState({ restoreBannerCount: null });
    }

    // ==================== End session persistence ====================

    exportAllToGeoJSON() {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        const geoJSON = this.buildGeoJSONFeatureCollection(this.state.measurements);

        const dataStr = JSON.stringify(geoJSON, null, 2);
        const dataUri = 'data:application/geo+json;charset=utf-8,' + encodeURIComponent(dataStr);
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        const exportFileDefaultName = `measurements${timestamp}.geojson`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    handleGeoJSONImport(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const geoJSON = JSON.parse(e.target?.result as string);
                this.importGeoJSON(geoJSON);
            } catch (error) {
                console.error('Error parsing GeoJSON:', error);
                this.safeSetState({
                    showImportErrorDialog: true,
                    importErrorMessage: 'Could not read this file. Please check that it is valid GeoJSON.'
                });
            }
        };
        reader.onerror = () => {
            this.safeSetState({
                showImportErrorDialog: true,
                importErrorMessage: 'Failed to read the file. It may be empty or unreadable.'
            });
        };
        reader.readAsText(file);

        // Clear the input so the same file can be selected again
        event.target.value = '';
    }

    async importGeoJSON(geoJSON: any, opts: { silent?: boolean } = {}) {
        try {
            let features = [];

            // Handle both FeatureCollection and single Feature
            if (geoJSON.type === 'FeatureCollection') {
                features = geoJSON.features;
            } else if (geoJSON.type === 'Feature') {
                features = [geoJSON];
            } else {
                throw new Error('Invalid GeoJSON format');
            }

            const importedMeasurements: MeasurementRecord[] = [];

            for (const feature of features) {
                const props = feature.properties;
                const geometry = feature.geometry;

                // Create Esri geometry from GeoJSON
                let esriGeometry;
                if (geometry.type === 'Point') {
                    esriGeometry = new this.Point({
                        longitude: geometry.coordinates[0],
                        latitude: geometry.coordinates[1]
                    });
                } else if (geometry.type === 'LineString') {
                    const paths = [geometry.coordinates.map(coord => [
                        this.webMercatorUtils.lngLatToXY(coord[0], coord[1])[0],
                        this.webMercatorUtils.lngLatToXY(coord[0], coord[1])[1]
                    ])];
                    esriGeometry = new this.Polyline({
                        paths,
                        spatialReference: { wkid: 102100 } // Web Mercator
                    });
                } else if (geometry.type === 'Polygon') {
                    const rings = geometry.coordinates.map(ring =>
                        ring.map(coord => [
                            this.webMercatorUtils.lngLatToXY(coord[0], coord[1])[0],
                            this.webMercatorUtils.lngLatToXY(coord[0], coord[1])[1]
                        ])
                    );
                    esriGeometry = new this.Polygon({
                        rings,
                        spatialReference: { wkid: 102100 } // Web Mercator
                    });
                }

                // Create graphic
                const graphic = new this.Graphic({
                    geometry: esriGeometry,
                    symbol: this.createSymbol(esriGeometry.type, props.color || this.colorPalette[0]),
                    attributes: {
                        measurementId: props.id
                    }
                });

                // Add to sketch layer
                this.sketchLayer.add(graphic);
                // Create measurement record
                const measurement: MeasurementRecord = {
                    id: props.id || `imported-${Date.now()}-${Math.random()}`,
                    type: props.measurementType,
                    timestamp: props.timestamp ? new Date(props.timestamp) : new Date(),
                    segments: props.segments || [],
                    totalDistance: props.totalDistance,
                    totalArea: props.totalArea,
                    perimeter: props.perimeter,
                    radius: props.radius,
                    coordinates: props.coordinates,
                    linearUnit: props.linearUnit || this.state.currentLinearUnit,
                    areaUnit: props.areaUnit || this.state.currentAreaUnit,
                    label: props.label || `Imported ${props.measurementType}`,
                    geometry: esriGeometry,
                    geojson: { type: 'Feature', geometry, properties: props },
                    graphic: graphic,
                    color: props.color || this.colorPalette[0]
                };

                importedMeasurements.push(measurement);

                // Update measurement count for future measurements
                this.measurementCount = Math.max(this.measurementCount,
                    parseInt(measurement.label.match(/\d+/)?.[0] || '0'));
            }

            // Update state with imported measurements
            this.setState(prevState => ({
                measurements: [...prevState.measurements, ...importedMeasurements]
            }), () => {
                // Always add main measurement labels for all imported measurements
                importedMeasurements.forEach(measurement => {
                    this.addMeasurementLabel(measurement.geometry, measurement);
                });

                // Zoom to extent of imported features
                if (importedMeasurements.length > 0 && this.state.jimuMapView) {
                    const graphics = importedMeasurements.map(m => m.graphic).filter(g => g);
                    if (graphics.length > 0) {
                        this.state.jimuMapView.view.goTo(graphics, {
                            duration: 1000,
                            easing: 'ease-in-out'
                        }).catch(err => {
                            console.warn('Could not zoom to imported features:', err);
                        });
                    }
                }
            });

            if (!opts.silent) {
                this.setState({
                    showImportSuccessDialog: true,
                    importSuccessMessage: `Successfully imported ${importedMeasurements.length} measurement(s)`
                });
            }

        } catch (error) {
            console.error('Error importing GeoJSON:', error);
            this.setState({
                showImportSuccessDialog: true,
                importSuccessMessage: 'Error importing GeoJSON. Please check the file format and try again.'
            });
        }
    }

    exportMeasurementToCSV(measurement: MeasurementRecord) {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        let csvContent = '';

        if (measurement.type === 'point') {
            // Header for point
            csvContent += 'Measurement Label,Type,Date,Latitude,Longitude,X,Y\n';
            csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${measurement.coordinates.lat.toFixed(6)}","${measurement.coordinates.lon.toFixed(6)}","${measurement.coordinates.x.toFixed(2)}","${measurement.coordinates.y.toFixed(2)}"\n`;
        } else if (measurement.type === 'distance') {
            // Header
            csvContent += 'Measurement Label,Type,Date,Total Distance,Unit\n';
            csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.totalDistance)}","${measurement.linearUnit}"\n\n`;

            // Segments header
            csvContent += 'Segment #,Segment Label,Distance,Start X,Start Y,End X,End Y\n';

            // Segments data
            measurement.segments.forEach((segment, index) => {
                const startX = this.getSegmentCoordValue(segment.startPoint, 'x');
                const startY = this.getSegmentCoordValue(segment.startPoint, 'y');
                const endX = this.getSegmentCoordValue(segment.endPoint, 'x');
                const endY = this.getSegmentCoordValue(segment.endPoint, 'y');
                csvContent += `${index + 1},"${segment.label}","${this.formatValue(segment.distance)}","${startX.toFixed(6)}","${startY.toFixed(6)}","${endX.toFixed(6)}","${endY.toFixed(6)}"\n`;
            });
        } else if (measurement.type === 'circle') {
            // Header for circle
            csvContent += 'Measurement Label,Type,Date,Radius,Linear Unit,Area,Area Unit,Circumference,Center Latitude,Center Longitude\n';
            csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.radius)}","${measurement.linearUnit}","${this.formatValue(measurement.totalArea)}","${measurement.areaUnit}","${this.formatValue(measurement.perimeter)}","${measurement.coordinates.lat.toFixed(6)}","${measurement.coordinates.lon.toFixed(6)}"\n`;
        } else if (measurement.type === 'triangle') {
            // Header for triangle
            csvContent += 'Measurement Label,Type,Date,Side Length,Linear Unit,Total Area,Area Unit,Perimeter\n';
            csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.sideLength)}","${measurement.linearUnit}","${this.formatValue(measurement.totalArea)}","${measurement.areaUnit}","${this.formatValue(measurement.perimeter)}"\n\n`;

            // Perimeter segments header
            if (measurement.segments && measurement.segments.length > 0) {
                csvContent += 'Edge #,Edge Label,Distance,Start X,Start Y,End X,End Y\n';

                // Segments data
                measurement.segments.forEach((segment, index) => {
                    const startX = this.getSegmentCoordValue(segment.startPoint, 'x');
                    const startY = this.getSegmentCoordValue(segment.startPoint, 'y');
                    const endX = this.getSegmentCoordValue(segment.endPoint, 'x');
                    const endY = this.getSegmentCoordValue(segment.endPoint, 'y');
                    csvContent += `${index + 1},"${segment.label}","${this.formatValue(segment.distance)}","${startX.toFixed(6)}","${startY.toFixed(6)}","${endX.toFixed(6)}","${endY.toFixed(6)}"\n`;
                });
            }
        } else {
            // Header for area
            csvContent += 'Measurement Label,Type,Date,Total Area,Area Unit,Perimeter,Linear Unit\n';
            csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.totalArea)}","${measurement.areaUnit}","${this.formatValue(measurement.perimeter)}","${measurement.linearUnit}"\n\n`;

            // Perimeter segments header
            if (measurement.segments && measurement.segments.length > 0) {
                csvContent += 'Edge #,Edge Label,Distance,Start X,Start Y,End X,End Y\n';

                // Segments data
                measurement.segments.forEach((segment, index) => {
                    const startX = this.getSegmentCoordValue(segment.startPoint, 'x');
                    const startY = this.getSegmentCoordValue(segment.startPoint, 'y');
                    const endX = this.getSegmentCoordValue(segment.endPoint, 'x');
                    const endY = this.getSegmentCoordValue(segment.endPoint, 'y');
                    csvContent += `${index + 1},"${segment.label}","${this.formatValue(segment.distance)}","${startX.toFixed(6)}","${startY.toFixed(6)}","${endX.toFixed(6)}","${endY.toFixed(6)}"\n`;
                });
            }
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        link.setAttribute('download', `${measurement.label.replace(/\s+/g, '_')}${timestamp}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    }

    exportAllToCSV() {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        let csvContent = 'Measurement Label,Type,Date,Value 1,Unit 1,Value 2,Unit 2,Segments Count\n';

        this.state.measurements.forEach(measurement => {
            const segmentCount = measurement.segments?.length || 0;
            if (measurement.type === 'point') {
                csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${measurement.coordinates.lat.toFixed(6)}","Lat","${measurement.coordinates.lon.toFixed(6)}","Lon","0"\n`;
            } else if (measurement.type === 'distance') {
                csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.totalDistance)}","${measurement.linearUnit}","","","${segmentCount}"\n`;
            } else if (measurement.type === 'circle') {
                csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.radius)}","${measurement.linearUnit} (radius)","${this.formatValue(measurement.perimeter)}","${measurement.linearUnit} (circumference)","0"\n`;
            } else {
                csvContent += `"${measurement.label}","${measurement.type}","${measurement.timestamp.toLocaleString()}","${this.formatValue(measurement.totalArea)}","${measurement.areaUnit}","${this.formatValue(measurement.perimeter)}","${measurement.linearUnit}","${segmentCount}"\n`;
            }
        });

        // Add detailed segment breakdown
        csvContent += '\n\nDETAILED SEGMENT BREAKDOWN\n';
        csvContent += 'Measurement,Segment/Edge #,Label,Distance,Start X,Start Y,End X,End Y\n';

        this.state.measurements.forEach(measurement => {
            if (measurement.segments && measurement.segments.length > 0) {
                measurement.segments.forEach((segment, index) => {
                    const startX = this.getSegmentCoordValue(segment.startPoint, 'x');
                    const startY = this.getSegmentCoordValue(segment.startPoint, 'y');
                    const endX = this.getSegmentCoordValue(segment.endPoint, 'x');
                    const endY = this.getSegmentCoordValue(segment.endPoint, 'y');
                    csvContent += `"${measurement.label}",${index + 1},"${segment.label}","${this.formatValue(segment.distance)}","${startX.toFixed(6)}","${startY.toFixed(6)}","${endX.toFixed(6)}","${endY.toFixed(6)}"\n`;
                });
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        link.setAttribute('download', `all_measurements${timestamp}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    }

    async captureMeasurementScreenshot(measurement: MeasurementRecord): Promise<string | null> {
        if (!this.state.jimuMapView || !this.state.jimuMapView.view) return null;

        const view = this.state.jimuMapView.view;
        const originalExtent = view.extent.clone();

        try {
            // Calculate extent that encompasses the measurement with padding
            let targetExtent;
            if (measurement.geometry.type === 'point') {
                targetExtent = view.extent.clone();
                targetExtent = targetExtent.centerAt(measurement.geometry);
                targetExtent = targetExtent.expand(0.2);
            } else {
                targetExtent = measurement.geometry.extent.clone();
                targetExtent = targetExtent.expand(1.5);
            }

            await view.goTo(targetExtent, { animate: false });
            await new Promise(resolve => setTimeout(resolve, 800));

            const screenshot = await view.takeScreenshot({
                format: 'png',
                quality: 100,
                width: 2400,
                height: 1400
            });

            await view.goTo(originalExtent, { animate: false });

            return screenshot.dataUrl;
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            await view.goTo(originalExtent, { animate: false });
            return null;
        }
    }

    async exportMeasurementToPDF(measurement: MeasurementRecord) {
        this.safeSetState({ isExportingPDF: true });
        await new Promise(resolve => setTimeout(resolve, 16));
        try {
            await this._doExportMeasurementToPDF(measurement);
        } finally {
            this.safeSetState({ isExportingPDF: false });
        }
    }

    async _doExportMeasurementToPDF(measurement: MeasurementRecord) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 15;

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Measurement Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Measurement Label
        doc.setFontSize(16);
        doc.setTextColor(measurement.color);
        doc.text(measurement.label, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Reset color and font
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Date and Type
        doc.text(`Date: ${measurement.timestamp.toLocaleString()}`, 20, yPos);
        yPos += 6;
        doc.text(`Type: ${measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}`, 20, yPos);
        yPos += 10;

        // Capture and add screenshot full-width
        const screenshot = await this.captureMeasurementScreenshot(measurement);
        if (screenshot) {
            const imgWidth = pageWidth - 20;
            const imgHeight = (imgWidth * 7) / 12;
            doc.addImage(screenshot, 'PNG', 10, yPos, imgWidth, imgHeight, '', 'FAST');
            yPos += imgHeight + 8;
        }

        // Measurement Details
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Measurement Details:', 20, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if (measurement.type === 'point') {
            doc.text(`Latitude: ${measurement.coordinates.lat.toFixed(6)}°`, 30, yPos);
            yPos += 6;
            doc.text(`Longitude: ${measurement.coordinates.lon.toFixed(6)}°`, 30, yPos);
            yPos += 6;
            doc.text(`X (Web Mercator): ${measurement.coordinates.x.toFixed(2)}`, 30, yPos);
            yPos += 6;
            doc.text(`Y (Web Mercator): ${measurement.coordinates.y.toFixed(2)}`, 30, yPos);
        } else if (measurement.type === 'distance') {
            doc.text(`Total Distance: ${this.formatValue(measurement.totalDistance)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Number of Segments: ${measurement.segments.length}`, 30, yPos);
            yPos += 10;

            // Segments
            if (measurement.segments.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Segments:', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');

                measurement.segments.forEach((segment, index) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(10);
                    doc.text(`${index + 1}. ${segment.label}`, 30, yPos);
                    yPos += 5;
                    doc.setFontSize(9);
                    doc.text(`Distance: ${this.formatValue(segment.distance)} ${measurement.linearUnit}`, 35, yPos);
                    yPos += 5;
                    doc.text(`Start: ${this.formatSegmentCoords(segment.startPoint)}`, 35, yPos);
                    yPos += 5;
                    doc.text(`End: ${this.formatSegmentCoords(segment.endPoint)}`, 35, yPos);
                    yPos += 7;
                });
            }
        } else if (measurement.type === 'area') {
            doc.text(`Total Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Perimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Number of Edges: ${measurement.segments.length}`, 30, yPos);
            yPos += 10;

            // Perimeter Edges
            if (measurement.segments.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Perimeter Edges:', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');

                measurement.segments.forEach((segment, index) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(10);
                    doc.text(`${index + 1}. ${segment.label}`, 30, yPos);
                    yPos += 5;
                    doc.setFontSize(9);
                    doc.text(`Distance: ${this.formatValue(segment.distance)} ${measurement.linearUnit}`, 35, yPos);
                    yPos += 5;
                    doc.text(`Start: ${this.formatSegmentCoords(segment.startPoint)}`, 35, yPos);
                    yPos += 5;
                    doc.text(`End: ${this.formatSegmentCoords(segment.endPoint)}`, 35, yPos);
                    yPos += 7;
                });
            }
        } else if (measurement.type === 'circle') {
            doc.text(`Radius: ${this.formatValue(measurement.radius)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Circumference: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Center Latitude: ${measurement.coordinates.lat.toFixed(6)}°`, 30, yPos);
            yPos += 6;
            doc.text(`Center Longitude: ${measurement.coordinates.lon.toFixed(6)}°`, 30, yPos);
        } else if (measurement.type === 'triangle') {
            doc.text(`Side Length: ${this.formatValue(measurement.sideLength)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Total Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Perimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`, 30, yPos);
            yPos += 6;
            doc.text(`Number of Edges: ${measurement.segments.length}`, 30, yPos);
            yPos += 10;

            // Perimeter Edges
            if (measurement.segments.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Perimeter Edges:', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');

                measurement.segments.forEach((segment, index) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(10);
                    doc.text(`${index + 1}. ${segment.label}`, 30, yPos);
                    yPos += 5;
                    doc.setFontSize(9);
                    doc.text(`Distance: ${this.formatValue(segment.distance)} ${measurement.linearUnit}`, 35, yPos);
                    yPos += 5;
                    doc.text(`Start: ${this.formatSegmentCoords(segment.startPoint)}`, 35, yPos);
                    yPos += 5;
                    doc.text(`End: ${this.formatSegmentCoords(segment.endPoint)}`, 35, yPos);
                    yPos += 7;
                });
            }

        }
        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }

        // Save
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        doc.save(`${measurement.label.replace(/\s+/g, '_')}${timestamp}.pdf`);
    }

    exportMeasurementToGeoJSON(measurement: MeasurementRecord) {
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;

        const symbologyProps = this.getSymbologyProperties(measurement);
        const feature = {
            type: "Feature",
            properties: {
                id: measurement.id,
                name: measurement.label,
                label: measurement.label,
                measurementType: measurement.type,
                type: measurement.type,
                timestamp: measurement.timestamp.toISOString(),
                created: measurement.timestamp.toISOString(),
                color: measurement.color,
                linearUnit: measurement.linearUnit,
                areaUnit: measurement.areaUnit,
                totalDistance: measurement.totalDistance,
                totalArea: measurement.totalArea,
                perimeter: measurement.perimeter,
                radius: measurement.radius,
                sideLength: measurement.sideLength,
                coordinates: measurement.coordinates,
                segments: measurement.segments,
                ...symbologyProps
            },
            geometry: measurement.geojson.geometry
        };

        const geoJSON = {
            type: "FeatureCollection",
            features: [feature],
            crs: {
                type: "name",
                properties: {
                    name: "EPSG:4326"
                }
            }
        };

        const dataStr = JSON.stringify(geoJSON, null, 2);
        const dataUri = 'data:application/geo+json;charset=utf-8,' + encodeURIComponent(dataStr);
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        const exportFileDefaultName = `${measurement.label.replace(/\s+/g, '_')}${timestamp}.geojson`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    async exportAllToPDF() {
        this.safeSetState({ isExportingPDF: true });
        // Yield to React so the spinner can paint before jsPDF blocks the thread
        await new Promise(resolve => setTimeout(resolve, 16));
        try {
            await this._doExportAllToPDF();
        } finally {
            this.safeSetState({ isExportingPDF: false });
        }
    }

    async _doExportAllToPDF() {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('All Measurements Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Report Date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Summary Statistics
        const stats = this.getStatistics();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Measurements: ${stats.totalMeasurements}`, 30, yPos);
        yPos += 6;

        // Build type summary only for active types
        const typeSummary = [];
        if (stats.pointMeasurements > 0) typeSummary.push(`Points: ${stats.pointMeasurements}`);
        if (stats.distanceMeasurements > 0) typeSummary.push(`Distance: ${stats.distanceMeasurements}`);
        if (stats.areaMeasurements > 0) typeSummary.push(`Area: ${stats.areaMeasurements}`);
        if (stats.circleMeasurements > 0) typeSummary.push(`Circles: ${stats.circleMeasurements}`);

        if (typeSummary.length > 0) {
            doc.text(typeSummary.join(' | '), 30, yPos);
            yPos += 6;
        }

        if (stats.totalSegments > 0) {
            doc.text(`Total Segments: ${stats.totalSegments}`, 30, yPos);
            yPos += 6;
        }

        if (stats.totalDistance > 0) {
            doc.text(`Total Distance: ${this.formatValue(stats.totalDistance)} ${this.state.currentLinearUnit}`, 30, yPos);
            yPos += 6;
        }

        if (stats.totalArea > 0) {
            doc.text(`Total Area: ${this.formatValue(stats.totalArea)} ${this.state.currentAreaUnit}`, 30, yPos);
            yPos += 6;
        }

        if (stats.totalPerimeter > 0) {
            doc.text(`Total Perimeter: ${this.formatValue(stats.totalPerimeter)} ${this.state.currentLinearUnit}`, 30, yPos);
            yPos += 6;
        }

        yPos += 9;

        // Individual Measurements
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Measurements', 20, yPos);
        yPos += 10;

        for (let idx = 0; idx < this.state.measurements.length; idx++) {
            const measurement = this.state.measurements[idx];

            // Check if we need a new page (with more buffer for larger images)
            if (yPos > 180) {
                doc.addPage();
                yPos = 20;
            }

            // Capture screenshot for this measurement
            const screenshot = await this.captureMeasurementScreenshot(measurement);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(measurement.color);
            doc.text(`${idx + 1}. ${measurement.label}`, 20, yPos);
            yPos += 7;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            // Add screenshot full-width below title
            if (screenshot) {
                const imgWidth = pageWidth - 40;
                const imgHeight = (imgWidth * 7) / 12;
                doc.addImage(screenshot, 'PNG', 20, yPos, imgWidth, imgHeight, '', 'FAST');
                yPos += imgHeight + 6;
            }

            doc.text(`Date: ${measurement.timestamp.toLocaleString()}`, 25, yPos);
            yPos += 5;
            doc.text(`Type: ${measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}`, 25, yPos);
            yPos += 5;

            if (measurement.type === 'point') {
                doc.text(`Lat: ${measurement.coordinates.lat.toFixed(6)}° | Lon: ${measurement.coordinates.lon.toFixed(6)}°`, 25, yPos);
                yPos += 5;
            } else if (measurement.type === 'distance') {
                doc.text(`Distance: ${this.formatValue(measurement.totalDistance)} ${measurement.linearUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Segments: ${measurement.segments.length}`, 25, yPos);
                yPos += 5;
            } else if (measurement.type === 'area') {
                doc.text(`Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Perimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Edges: ${measurement.segments.length}`, 25, yPos);
                yPos += 5;
            } else if (measurement.type === 'circle') {
                doc.text(`Radius: ${this.formatValue(measurement.radius)} ${measurement.linearUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 25, yPos);
                yPos += 5;
            } else if (measurement.type === 'triangle') {
                doc.text(`Side Length: ${this.formatValue(measurement.sideLength)} ${measurement.linearUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Area: ${this.formatValue(measurement.totalArea)} ${measurement.areaUnit}`, 25, yPos);
                yPos += 5;
                doc.text(`Perimeter: ${this.formatValue(measurement.perimeter)} ${measurement.linearUnit}`, 25, yPos);
                yPos += 5;

            }
            yPos += 12;
        }

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(`Enhanced Measurement Tool | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }

        // Save
        const config = this.props.config || {};
        const includeTimestamp = config.includeTimestampInExport !== false;
        const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
        doc.save(`all_measurements${timestamp}.pdf`);
    }

    getStatistics() {
        // Cache key is the measurements array reference + units. We reset
        // _statsCache to null whenever we add/delete/recolor/relabel/convert
        // (search call sites of `this._statsCache = null`).
        const token = this.state.measurements;
        if (this._statsCache && this._statsCache.token === token) {
            return this._statsCache.value;
        }
        const measurements = this.state.measurements;
        let pointCount = 0, distanceCount = 0, areaCount = 0, circleCount = 0, triangleCount = 0;
        let totalDistance = 0, totalArea = 0, totalPerimeter = 0, totalSegments = 0;
        for (const m of measurements) {
            switch (m.type) {
                case 'point': pointCount++; break;
                case 'distance':
                    distanceCount++;
                    totalDistance += (m.totalDistance || 0);
                    break;
                case 'area':
                    areaCount++;
                    totalArea += (m.totalArea || 0);
                    totalPerimeter += (m.perimeter || 0);
                    break;
                case 'circle':
                    circleCount++;
                    totalArea += (m.totalArea || 0);
                    totalPerimeter += (m.perimeter || 0);
                    break;
                case 'triangle':
                    triangleCount++;
                    totalArea += (m.totalArea || 0);
                    totalPerimeter += (m.perimeter || 0);
                    break;
            }
            totalSegments += (m.segments?.length || 0);
        }
        const areaTotalCount = areaCount + circleCount + triangleCount;
        const value = {
            totalMeasurements: measurements.length,
            pointMeasurements: pointCount,
            distanceMeasurements: distanceCount,
            areaMeasurements: areaCount,
            circleMeasurements: circleCount,
            triangleMeasurements: triangleCount,
            totalDistance,
            totalArea,
            totalPerimeter,
            avgDistance: distanceCount > 0 ? totalDistance / distanceCount : 0,
            avgArea: areaTotalCount > 0 ? totalArea / areaTotalCount : 0,
            totalSegments
        };
        this._statsCache = { token, value };
        return value;
    }

    toggleExportAllDropdown() {
        this.setState({ exportAllDropdownOpen: !this.state.exportAllDropdownOpen });
    }

    toggleExportDropdown(measurementId: string) {
        this.setState(prevState => ({
            exportDropdownOpen: {
                ...prevState.exportDropdownOpen,
                [measurementId]: !prevState.exportDropdownOpen[measurementId]
            },
            overflowDropdownOpen: {}
        }));
    }

    toggleOverflowDropdown(measurementId: string) {
        this.setState(prevState => ({
            overflowDropdownOpen: {
                ...prevState.overflowDropdownOpen,
                [measurementId]: !prevState.overflowDropdownOpen[measurementId]
            },
            exportDropdownOpen: {}
        }));
    }

    closeAllDropdowns() {
        this.setState({
            exportAllDropdownOpen: false,
            exportDropdownOpen: {},
            overflowDropdownOpen: {}
        });
    }

    /**
     * Renders the full-pane detail view for a single measurement.
     * Replaces the list when state.detailViewMeasurementId is set.
     * Layout: sticky header with back + title row + actions, then scrollable body
     * with info grid and segments list.
     */
    renderDetailView(m: MeasurementRecord, config: any) {
        const isRenaming = this.state.renamingMeasurementId === m.id;
        const canEditVertices = (config.enableVertexEditTool !== false) && m.type !== 'point' && m.type !== 'circle';
        const sr = m.coordinates?.spatialReference;
        const srLabel = sr ? this.getSpatialReferenceLabel(sr) : 'Input';
        const fmtCoord = this.formatCoordinate.bind(this);

        return (
            <div className="detail-view" key={`detail-${m.id}`}>
                <div className="detail-view-header">
                    <button
                        type="button"
                        className="detail-back-button"
                        onClick={() => this.exitDetailView()}
                        aria-label="Back to measurements list"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back</span>
                    </button>
                    <div className="detail-view-title-row">
                        <button
                            type="button"
                            className="card-color-swatch"
                            style={{ backgroundColor: m.color }}
                            onClick={(e) => {
                                e.stopPropagation();
                                this.setState(prev => ({ colorPickerForId: prev.colorPickerForId === m.id ? null : m.id }));
                            }}
                            title="Change color"
                            aria-label={`Change color for ${m.label}`}
                        />
                        <span className="detail-view-type-icon" aria-hidden="true">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                                {m.type === 'point' && <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </>}
                                {m.type === 'distance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                                {m.type === 'area' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />}
                                {m.type === 'circle' && <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />}
                                {m.type === 'triangle' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4L3 20h18L12 4z" />}
                            </svg>
                        </span>
                        {isRenaming ? (
                            <input
                                type="text"
                                className="measurement-name-input detail-view-name-input"
                                autoFocus
                                value={this.state.renamingValue}
                                onChange={(e) => this.setState({ renamingValue: e.target.value })}
                                onBlur={() => this.renameMeasurement(m.id, this.state.renamingValue)}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') { e.preventDefault(); this.renameMeasurement(m.id, this.state.renamingValue); }
                                    else if (e.key === 'Escape') { e.preventDefault(); this.setState({ renamingMeasurementId: null, renamingValue: '' }); }
                                }}
                                aria-label="Edit measurement name"
                                maxLength={80}
                            />
                        ) : (
                            <h3
                                className="detail-view-title"
                                onDoubleClick={() => this.setState({ renamingMeasurementId: m.id, renamingValue: m.label })}
                                title="Double-click to rename"
                            >
                                {m.label}
                            </h3>
                        )}
                        {this.state.colorPickerForId === m.id && (
                            <div className="color-picker-popover" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Choose color">
                                {this.colorPalette.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`color-swatch ${m.color === c ? 'is-selected' : ''}`}
                                        aria-label={`Color ${c}`}
                                        aria-pressed={m.color === c}
                                        style={{ backgroundColor: c }}
                                        onClick={() => this.setMeasurementColor(m.id, c)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="detail-view-actions">
                    <button
                        type="button"
                        className="detail-action-button"
                        onClick={() => this.zoomToMeasurement(m)}
                        title="Zoom to measurement on map"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Zoom to
                    </button>
                    <DropdownMenu>
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: this.state.exportDropdownOpen[m.id] ? 9998 : 1 }}>
                            <DropdownMenuTrigger
                                id={`detail-export-${m.id}`}
                                ref={(el) => { this.exportTriggerRefs.set(m.id, el); }}
                                className="detail-action-button"
                                isOpen={this.state.exportDropdownOpen[m.id]}
                                onClick={(e) => { e.stopPropagation(); this.toggleExportDropdown(m.id); }}
                                title="Export"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="10" height="10" style={{ opacity: 0.6 }} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </DropdownMenuTrigger>
                            {this.state.exportDropdownOpen[m.id] && (
                                <DropdownMenuContent triggerRef={this.exportTriggerRefs.get(m.id) || undefined} aria-labelledby={`detail-export-${m.id}`}>
                                    <DropdownMenuItem onClick={() => { this.exportMeasurementToCSV(m); this.closeAllDropdowns(); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4M3 3h7l4 4h7v2M3 3v18h18V9" /></svg>
                                        CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { this.closeAllDropdowns(); this.setState({ showPDFExportDialog: true, pendingPDFExport: { kind: 'one', measurement: m } }); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        PDF…
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { this.exportMeasurementToJSON(m); this.closeAllDropdowns(); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                        JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { this.exportMeasurementToGeoJSON(m); this.closeAllDropdowns(); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                        GeoJSON
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            )}
                        </div>
                    </DropdownMenu>
                    <DropdownMenu>
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: this.state.overflowDropdownOpen[m.id] ? 9998 : 1 }}>
                            <DropdownMenuTrigger
                                id={`detail-overflow-${m.id}`}
                                ref={(el) => { this.overflowTriggerRefs.set(m.id, el); }}
                                className="detail-action-button detail-action-button-icon"
                                isOpen={this.state.overflowDropdownOpen[m.id]}
                                onClick={(e) => { e.stopPropagation(); this.toggleOverflowDropdown(m.id); }}
                                title="More actions"
                                aria-label="More actions"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                </svg>
                            </DropdownMenuTrigger>
                            {this.state.overflowDropdownOpen[m.id] && (
                                <DropdownMenuContent triggerRef={this.overflowTriggerRefs.get(m.id) || undefined} aria-labelledby={`detail-overflow-${m.id}`}>
                                    <DropdownMenuItem onClick={() => { this.closeAllDropdowns(); this.setState({ renamingMeasurementId: m.id, renamingValue: m.label }); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { this.duplicateMeasurement(m.id); this.closeAllDropdowns(); }}>
                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Duplicate
                                    </DropdownMenuItem>
                                    {canEditVertices && (
                                        <DropdownMenuItem onClick={() => { this.editMeasurementVertices(m.id); this.closeAllDropdowns(); }}>
                                            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 4.121a3 3 0 114.243 4.243L7.5 19.243l-4.243 1.06 1.06-4.242L14.121 4.121z" /></svg>
                                            {this.state.editingMeasurementId === m.id ? 'Stop editing' : 'Edit vertices'}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { this.deleteMeasurement(m.id); this.closeAllDropdowns(); }}>
                                        <svg className="menu-icon" fill="none" stroke="#dc2626" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span style={{ color: '#dc2626' }}>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            )}
                        </div>
                    </DropdownMenu>
                </div>

                <div className="detail-view-body">
                    {/* Primary stats card — large readable values, each copyable */}
                    {(() => {
                        // Local helper: renders one stat card with a copy-to-clipboard button.
                        // key must be unique within this measurement's stats.
                        const stat = (key: string, label: React.ReactNode, valueNode: React.ReactNode, copyText: string, extraClass = '') => (
                            <div className={`detail-stat ${extraClass}`} key={key}>
                                <div className="detail-stat-label">{label}</div>
                                <div className={`detail-stat-value ${extraClass.includes('mono') ? 'mono' : ''}`}>{valueNode}</div>
                                <button
                                    type="button"
                                    className={`stat-copy-button ${this.state.copiedStatKey === key ? 'is-copied' : ''}`}
                                    onClick={() => this.copyStatToClipboard(key, copyText)}
                                    title={this.state.copiedStatKey === key ? 'Copied' : 'Copy value'}
                                    aria-label={`Copy ${typeof label === 'string' ? label : 'value'} to clipboard`}
                                >
                                    {this.state.copiedStatKey === key ? (
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        );
                        const cards: React.ReactNode[] = [];
                        if (m.type === 'point' && m.coordinates) {
                            const c = fmtCoord(m.coordinates.lat, m.coordinates.lon, this.state.coordinateFormat);
                            cards.push(
                                stat(`${m.id}-lat`, 'Latitude', c.lat, String(c.lat), 'mono'),
                                stat(`${m.id}-lon`, 'Longitude', c.lon, String(c.lon), 'mono'),
                                stat(`${m.id}-x`, <>X · {srLabel}</>, m.coordinates.x.toFixed(2), m.coordinates.x.toFixed(2), 'mono'),
                                stat(`${m.id}-y`, <>Y · {srLabel}</>, m.coordinates.y.toFixed(2), m.coordinates.y.toFixed(2), 'mono')
                            );
                        }
                        if (m.type === 'distance' && config.showTotalDistance !== false) {
                            cards.push(
                                stat(`${m.id}-dist`, 'Total Distance',
                                    <>{this.formatValue(m.totalDistance)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.totalDistance)} ${m.linearUnit}`,
                                    'detail-stat-primary')
                            );
                        }
                        if (m.type === 'area') {
                            cards.push(
                                stat(`${m.id}-area`, 'Area',
                                    <>{this.formatValue(m.totalArea)} <span className="detail-stat-unit">{m.areaUnit}</span></>,
                                    `${this.formatValue(m.totalArea)} ${m.areaUnit}`,
                                    'detail-stat-primary'),
                                stat(`${m.id}-perim`, 'Perimeter',
                                    <>{this.formatValue(m.perimeter)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.perimeter)} ${m.linearUnit}`)
                            );
                        }
                        if (m.type === 'circle' && m.coordinates) {
                            const c = fmtCoord(m.coordinates.lat, m.coordinates.lon, this.state.coordinateFormat);
                            cards.push(
                                stat(`${m.id}-area`, 'Area',
                                    <>{this.formatValue(m.totalArea)} <span className="detail-stat-unit">{m.areaUnit}</span></>,
                                    `${this.formatValue(m.totalArea)} ${m.areaUnit}`,
                                    'detail-stat-primary'),
                                stat(`${m.id}-radius`, 'Radius',
                                    <>{this.formatValue(m.radius)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.radius)} ${m.linearUnit}`),
                                stat(`${m.id}-circ`, 'Circumference',
                                    <>{this.formatValue(m.perimeter)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.perimeter)} ${m.linearUnit}`),
                                stat(`${m.id}-center`, <>Center · {srLabel}</>,
                                    <>{c.lat}, {c.lon}</>,
                                    `${c.lat}, ${c.lon}`,
                                    'mono detail-stat-value-sm')
                            );
                        }
                        if (m.type === 'triangle') {
                            cards.push(
                                stat(`${m.id}-area`, 'Area',
                                    <>{this.formatValue(m.totalArea)} <span className="detail-stat-unit">{m.areaUnit}</span></>,
                                    `${this.formatValue(m.totalArea)} ${m.areaUnit}`,
                                    'detail-stat-primary'),
                                stat(`${m.id}-side`, 'Side Length',
                                    <>{this.formatValue(m.sideLength)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.sideLength)} ${m.linearUnit}`),
                                stat(`${m.id}-perim`, 'Perimeter',
                                    <>{this.formatValue(m.perimeter)} <span className="detail-stat-unit">{m.linearUnit}</span></>,
                                    `${this.formatValue(m.perimeter)} ${m.linearUnit}`)
                            );
                        }
                        return <div className="detail-stats">{cards}</div>;
                    })()}

                    {/* Segments list */}
                    {m.segments && m.segments.length > 0 && (
                        <div className="detail-segments">
                            <div className="detail-segments-header">
                                <span>{m.type === 'distance' ? 'Segments' : 'Perimeter Edges'}</span>
                                <span className="segments-count">{m.segments.length}</span>
                            </div>
                            <div className="segments-list">
                                {m.segments.map((segment, index) => (
                                    <details key={segment.id} className="segment-row">
                                        <summary className="segment-row-summary">
                                            <span className="segment-number">{index + 1}</span>
                                            <span className="segment-row-label">{segment.label}</span>
                                            <span className="segment-row-value">
                                                {this.formatValue(segment.distance)} <span className="segment-row-unit">{m.linearUnit}</span>
                                            </span>
                                        </summary>
                                        <div className="segment-coords">
                                            <span className="segment-coord-pt">{this.formatSegmentCoords(segment.startPoint)}</span>
                                            <span className="segment-coord-arrow" aria-hidden="true">→</span>
                                            <span className="segment-coord-pt">{this.formatSegmentCoords(segment.endPoint)}</span>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    render() {
        const config = this.props.config || {};
        const { moduleLoadError, modulesLoaded, measurements, currentTool, showStatistics, showDisplayOptions, showUnits } = this.state;

        if (moduleLoadError) {
            return (
                <div className="enhanced-measurement-widget jimu-widget">
                    <div className="widget-content" style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div className="jimu-alert jimu-alert-error">
                            {moduleLoadError}
                        </div>
                    </div>
                </div>
            );
        }

        if (!modulesLoaded) {
            return (
                <div className="enhanced-measurement-widget jimu-widget">
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p>Loading measurement tools...</p>
                    </div>
                </div>
            );
        }

        const stats = this.getStatistics();

        return (
            <div
                className="enhanced-measurement-widget jimu-widget"
                data-em-theme={config.theme === 'dark' ? 'dark' : (config.theme === 'auto' ? 'auto' : 'light')}
                ref={(el) => {
                    this.widgetContainerRef = el;

                    // Set up ResizeObserver when ref is set
                    if (el && !this.resizeObserver && typeof ResizeObserver !== 'undefined') {
                        this.resizeObserver = new ResizeObserver((entries) => {
                            for (const entry of entries) {
                                const width = entry.contentRect.width;
                                if (width <= 400) {
                                    entry.target.classList.add('narrow-widget');
                                } else {
                                    entry.target.classList.remove('narrow-widget');
                                }
                                // Medium width for toggle options wrapping
                                if (width <= 600) {
                                    entry.target.classList.add('medium-widget');
                                } else {
                                    entry.target.classList.remove('medium-widget');
                                }
                            }
                        });
                        this.resizeObserver.observe(el);
                    }
                }}
            >
                <style>
                    {`
                    /* Enable container queries on the ROOT widget element */
                    .enhanced-measurement-widget {
                        container-type: inline-size;
                        container-name: measurement-widget;
                    }
                    
                    /* Hide icons if showIconsOnButtons is false */
                    ${config.showIconsOnButtons === false ? `
                    .enhanced-measurement-widget .tool-button svg {
                        display: none !important;
                    }
                    ` : ''}
                    
                    /* Base button-text styles */
                    .enhanced-measurement-widget .tool-button .button-text {
                        display: inline;
                        white-space: nowrap;
                        margin-left: 4px;
                    }
                    
                    /* Button base styles */
                    .enhanced-measurement-widget .tool-button {
                        white-space: nowrap;
                        display: flex !important;
                        align-items: center !important;
                        gap: 4px;
                    }
                    
                    /* At medium-narrow widths (401-550px), allow text wrapping and stack icon above text */
                    @container measurement-widget (min-width: 401px) and (max-width: 550px) {
                        .enhanced-measurement-widget .tool-button {
                            flex-direction: column !important;
                            padding: 8px 4px !important;
                            gap: 4px !important;
                            justify-content: center !important;
                        }
                        .enhanced-measurement-widget .tool-button .button-text {
                            margin-left: 0 !important;
                            white-space: normal !important;
                            word-wrap: break-word !important;
                            text-align: center !important;
                            line-height: 1.2 !important;
                            font-size: 11px !important;
                            max-width: 100% !important;
                        }
                        .enhanced-measurement-widget .tool-button svg {
                            margin: 0 !important;
                        }
                    }
                    
                    /* Fallback for browsers without container query support */
                    @media (min-width: 401px) and (max-width: 550px) {
                        .enhanced-measurement-widget .tool-button {
                            flex-direction: column !important;
                            padding: 8px 4px !important;
                            gap: 4px !important;
                            justify-content: center !important;
                        }
                        .enhanced-measurement-widget .tool-button .button-text {
                            margin-left: 0 !important;
                            white-space: normal !important;
                            word-wrap: break-word !important;
                            text-align: center !important;
                            line-height: 1.2 !important;
                            font-size: 11px !important;
                            max-width: 100% !important;
                        }
                        .enhanced-measurement-widget .tool-button svg {
                            margin: 0 !important;
                        }
                    }
                    
                    /* Hide button text on narrow containers (400px or less) - unless alwaysShowButtonText is true */
                    ${config.alwaysShowButtonText !== true ? `
                    @container measurement-widget (max-width: 400px) {
                        .enhanced-measurement-widget .tool-button .button-text {
                            display: none !important;
                        }
                        .enhanced-measurement-widget .tool-button {
                            padding: 8px !important;
                            min-width: 40px !important;
                            justify-content: center !important;
                        }
                        .enhanced-measurement-widget .tool-button svg {
                            margin: 0 !important;
                        }
                    }
                    
                    @container measurement-widget (min-width: 401px) {
                        .enhanced-measurement-widget .tool-button .button-text {
                            display: inline !important;
                        }
                    }
                    
                    /* Fallback for browsers without container query support */
                    @media (max-width: 400px) {
                        .enhanced-measurement-widget .tool-button .button-text {
                            display: none !important;
                        }
                        .enhanced-measurement-widget .tool-button {
                            padding: 8px !important;
                            min-width: 40px !important;
                            justify-content: center !important;
                        }
                        .enhanced-measurement-widget .tool-button svg {
                            margin: 0 !important;
                        }
                    }
                    
                    @media (min-width: 401px) {
                        .enhanced-measurement-widget .tool-button .button-text {
                            display: inline !important;
                        }
                    }
                    ` : '/* Button text always visible - responsive hiding disabled */'}
                    
                    /* Additional breakpoint for very narrow sidebars */
                    @container measurement-widget (max-width: 400px) {
                        .button-group {
                            grid-template-columns: repeat(4, 1fr) !important;
                            gap: 4px !important;
                        }
                    }
                    
                    @media (max-width: 400px) {
                        .enhanced-measurement-widget .button-group {
                            grid-template-columns: repeat(4, 1fr) !important;
                            gap: 4px !important;
                        }
                    }
                    `}
                </style>
                <JimuMapViewComponent
                    useMapWidgetId={this.props.useMapWidgetIds?.[0]}
                    onActiveViewChange={this.onActiveViewChange}
                />

                <div className="widget-content">
                    {config.showWidgetTitle !== false && (
                        <div style={{
                            padding: '8px 4px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b',
                            borderBottom: '1px solid #e2e8f0',
                            marginBottom: '4px',
                            flexShrink: 0
                        }}>
                            {config.widgetTitle || 'Measurement Tools'}
                        </div>
                    )}

                    {config.showHintMessage !== false && measurements.length === 0 && !currentTool && (
                        <div style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: '#64748b',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            margin: '0 0 4px 0',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0
                        }}>
                            Select a measurement tool to begin drawing on the map
                        </div>
                    )}

                    {currentTool && (
                        <div
                            className="draw-mode-banner"
                            role="status"
                            aria-live="polite"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#1e40af',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                margin: '0 0 4px 0',
                                flexShrink: 0
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                    animation: 'draw-mode-pulse 2s ease-in-out infinite'
                                }}
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </span>
                            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                                <div style={{ fontWeight: 600, color: '#1e3a8a' }}>
                                    Drawing: {this.getToolLabel(currentTool)}
                                </div>
                                <div style={{ fontSize: '11px', color: '#3b82f6', opacity: 0.9 }}>
                                    {this.getToolHint(currentTool)}
                                </div>
                                {config.showLiveMeasurement !== false && this.state.liveMeasurement && (
                                    <div className="live-readout" aria-live="polite">
                                        {this.state.liveMeasurement.value}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => this.activateTool(currentTool as any)}
                                title="Cancel drawing (Esc)"
                                aria-label="Cancel drawing"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #93c5fd',
                                    color: '#1e40af',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    flexShrink: 0
                                }}
                            >
                                Esc
                            </button>
                        </div>
                    )}

                    <div className="control-section" style={{
                        flexShrink: 0
                    }}>
                        <div className="button-group" style={{
                            display: 'grid',
                            gridTemplateColumns:
                                config.buttonLayout === '2-column' ? 'repeat(2, 1fr)' :
                                    config.buttonLayout === '3-column' ? 'repeat(3, 1fr)' :
                                        config.buttonLayout === 'vertical' ? '1fr' :
                                            'repeat(4, 1fr)', // default 4-column
                            gap: config.compactMode === true ? '4px' : '8px',
                            width: '100%'
                        }}>
                            {(config.enablePointTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'point' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('point')}
                                    title="Measure by Point"
                                    aria-label={config.pointButtonText || 'Point'}
                                    aria-pressed={currentTool === 'point'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="button-text">{config.pointButtonText || 'Point'}</span>
                                </button>
                            )}

                            {(config.enableDistanceTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'distance' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('distance')}
                                    title="Measure by Line"
                                    aria-label={config.lineButtonText || 'Line'}
                                    aria-pressed={currentTool === 'distance'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="button-text">{config.lineButtonText || 'Line'}</span>
                                </button>
                            )}

                            {(config.enableFreehandPolylineTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'freehand-polyline' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('freehand-polyline')}
                                    title="Measure by Freehand Line"
                                    aria-label={config.freehandLineButtonText || 'Freehand Line'}
                                    aria-pressed={currentTool === 'freehand-polyline'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    <span className="button-text">{config.freehandLineButtonText || 'Freehand Line'}</span>
                                </button>
                            )}

                            {(config.enableRectangleTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'rectangle' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('rectangle')}
                                    title="Measure by Rectangle"
                                    aria-label={config.rectangleButtonText || 'Rectangle'}
                                    aria-pressed={currentTool === 'rectangle'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                    </svg>
                                    <span className="button-text">{config.rectangleButtonText || 'Rectangle'}</span>
                                </button>
                            )}

                            {(config.enableAreaTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'area' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('area')}
                                    title="Measure by Area"
                                    aria-label={config.areaButtonText || 'Area'}
                                    aria-pressed={currentTool === 'area'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                                    </svg>
                                    <span className="button-text">{config.areaButtonText || 'Area'}</span>
                                </button>
                            )}

                            {(config.enableFreehandPolygonTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'freehand-polygon' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('freehand-polygon')}
                                    title="Measure by Freehand Area"
                                    aria-label={config.freehandAreaButtonText || 'Freehand Area'}
                                    aria-pressed={currentTool === 'freehand-polygon'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="button-text">{config.freehandAreaButtonText || 'Freehand Area'}</span>
                                </button>
                            )}

                            {(config.enableCircleTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'circle' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('circle')}
                                    title="Measure by Circle"
                                    aria-label={config.circleButtonText || 'Circle'}
                                    aria-pressed={currentTool === 'circle'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                    </svg>
                                    <span className="button-text">{config.circleButtonText || 'Circle'}</span>
                                </button>
                            )}

                            {(config.enableTriangleTool !== false) && (
                                <button
                                    className={`tool-button ${currentTool === 'triangle' ? 'active' : ''}`}
                                    onClick={() => this.activateTool('triangle')}
                                    title="Measure by Triangle (Hold Shift for equilateral)"
                                    aria-label={config.triangleButtonText || 'Triangle'}
                                    aria-pressed={currentTool === 'triangle'}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4L3 20h18L12 4z" />
                                    </svg>
                                    <span className="button-text">{config.triangleButtonText || 'Triangle'}</span>
                                </button>
                            )}
                        </div>

                        {(config.showSegmentLabelsToggle !== false || config.showTooltipsToggle !== false || config.showSnappingToggle !== false || config.showPrintReadyButton !== false) && (
                            <div className="collapsible-section">
                                <button
                                    type="button"
                                    className="collapsible-section-header"
                                    onClick={() => this.setState({ showDisplayOptions: !showDisplayOptions })}
                                    aria-expanded={showDisplayOptions}
                                    aria-controls="display-options-content"
                                >
                                    <span className="header-title-row">
                                        <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{config.displayOptionsHeaderText || 'Display Options'}</span>
                                    </span>
                                    <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showDisplayOptions && (
                                    <div id="display-options-content" className="collapsible-section-content">
                                        <div className="toggle-options-row">
                                            {config.showSegmentLabelsToggle !== false && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    minHeight: '40px',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <svg style={{ flexShrink: 0 }} fill="none" stroke="#64748b" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <span style={{
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: '#475569',
                                                        lineHeight: '1.3'
                                                    }}>{config.segmentLabelText || 'Show Segment Labels'}</span>
                                                    <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={this.state.showSegmentLabels}
                                                            onChange={() => this.toggleSegmentLabels()}
                                                            disabled={this.state.currentTool === 'freehand-polyline' || this.state.currentTool === 'freehand-polygon'}
                                                            aria-label={config.segmentLabelText || 'Show Segment Labels'}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            )}

                                            {config.showTooltipsToggle !== false && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    minHeight: '40px',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <svg style={{ flexShrink: 0 }} fill="none" stroke="#64748b" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span style={{
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: '#475569',
                                                        lineHeight: '1.3'
                                                    }}>{config.tooltipsToggleText || 'Show Tooltips'}</span>
                                                    <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={this.state.showTooltips}
                                                            onChange={() => this.toggleTooltips()}
                                                            aria-label={config.tooltipsToggleText || 'Show Tooltips'}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            )}

                                            {config.showSnappingToggle !== false && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    minHeight: '40px',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <svg style={{ flexShrink: 0 }} fill="none" stroke="#64748b" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                    </svg>
                                                    <span style={{
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: '#475569',
                                                        lineHeight: '1.3'
                                                    }}>{config.snappingToggleText || 'Enable Snapping'}</span>
                                                    <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={this.state.enableSnapping}
                                                            onChange={() => this.toggleSnapping()}
                                                            aria-label={config.snappingToggleText || 'Enable Snapping'}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        {config.showPrintReadyButton !== false && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                minHeight: '36px',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                                marginTop: '6px',
                                                boxSizing: 'border-box',
                                                opacity: measurements.length === 0 ? 0.5 : 1
                                            }}>
                                                <svg
                                                    fill="none"
                                                    stroke="#64748b"
                                                    viewBox="0 0 24 24"
                                                    width="14"
                                                    height="14"
                                                    aria-hidden="true"
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: '#475569',
                                                    lineHeight: '1.3'
                                                }}>Print-Ready Labels</span>
                                                <label className="toggle-switch" style={{ flexShrink: 0 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={this.state.printReadyLabels}
                                                        onChange={() => this.togglePrintReadyLabels()}
                                                        disabled={measurements.length === 0}
                                                        title={this.state.printReadyLabels ? "Disable print-ready label spacing" : "Enable print-ready label spacing for PDF export"}
                                                        aria-label="Print-Ready Labels"
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            padding: '6px 0 2px 0',
                            alignItems: 'center'
                        }}>
                            {config.enableUndoRedo !== false && (
                                <>
                                    <button
                                        type="button"
                                        className="action-button"
                                        onClick={() => this.undo()}
                                        disabled={!this.canUndo()}
                                        title={`${config.undoButtonText || 'Undo'} (Ctrl+Z)`}
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        {config.undoButtonText || 'Undo'}
                                    </button>

                                    <button
                                        type="button"
                                        className="action-button"
                                        onClick={() => this.redo()}
                                        disabled={!this.canRedo()}
                                        title={`${config.redoButtonText || 'Redo'} (Ctrl+Y)`}
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                                        </svg>
                                        {config.redoButtonText || 'Redo'}
                                    </button>
                                </>
                            )}

                            {config.showClearAllButton !== false && (
                                <button
                                    type="button"
                                    className="action-button action-button-danger"
                                    onClick={() => this.clearAllMeasurements()}
                                    disabled={measurements.length === 0}
                                    title="Clear all measurements"
                                    style={{ marginLeft: 'auto' }}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {(config.showCoordinateModeToggle !== false || config.showUnitToggle !== false) && (
                        <div className="collapsible-section">
                            <button
                                type="button"
                                className="collapsible-section-header"
                                onClick={() => this.setState({ showUnits: !showUnits })}
                                aria-expanded={showUnits}
                                aria-controls="units-content"
                            >
                                <span className="header-title-row">
                                    <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                    <span>{config.unitsHeaderText || 'Units & Coordinates'}</span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#94a3b8',
                                        marginLeft: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.03em'
                                    }}>
                                        {this.state.currentLinearUnit} / {this.state.currentAreaUnit}
                                    </span>
                                </span>
                                <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showUnits && (
                                <div id="units-content" className="collapsible-section-content">
                                    <div className="unit-selectors">
                                        {config.showCoordinateModeToggle !== false && (
                                            <>
                                                <div className="unit-group">
                                                    <label className="unit-label">Coordinate Display</label>
                                                    <select
                                                        value={this.state.coordinateDisplayMode}
                                                        onChange={(e) => {
                                                            this.setState({ coordinateDisplayMode: e.target.value as 'webmercator' | 'input' }, () => {
                                                                this.refreshPointLabels();
                                                            });
                                                        }}
                                                    >
                                                        <option value="webmercator">Web Mercator</option>
                                                        {this.state.jimuMapView && this.state.jimuMapView.view.spatialReference &&
                                                            !this.state.jimuMapView.view.spatialReference.isWebMercator && (
                                                                <option value="input">
                                                                    Input: {this.getSpatialReferenceLabel(this.state.jimuMapView.view.spatialReference)}
                                                                </option>
                                                            )}
                                                    </select>
                                                </div>

                                                {this.state.coordinateDisplayMode === 'webmercator' && (
                                                    <div className="unit-group">
                                                        <label className="unit-label">Coordinate Format</label>
                                                        <select
                                                            value={this.state.coordinateFormat}
                                                            onChange={(e) => {
                                                                this.setState({ coordinateFormat: e.target.value as 'decimal' | 'dms' | 'ddm' }, () => {
                                                                    this.refreshPointLabels();
                                                                });
                                                            }}
                                                        >
                                                            <option value="decimal">Decimal Degrees (DD)</option>
                                                            <option value="dms">Degrees Minutes Seconds (DMS)</option>
                                                            <option value="ddm">Degrees Decimal Minutes (DDM)</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {config.showUnitToggle !== false && (
                                            <>
                                                <div className="unit-group">
                                                    <label className="unit-label">Linear Unit</label>
                                                    <select
                                                        value={this.state.currentLinearUnit}
                                                        onChange={(e) => {
                                                            const newUnit = e.target.value;
                                                            this.setState({ currentLinearUnit: newUnit });
                                                            this.convertAllMeasurementsToNewLinearUnit(newUnit);
                                                        }}
                                                    >
                                                        <option value="miles">Miles</option>
                                                        <option value="kilometers">Kilometers</option>
                                                        <option value="meters">Meters</option>
                                                        <option value="feet">Feet</option>
                                                        <option value="yards">Yards</option>
                                                        {this.getCustomLinearUnits()
                                                            .filter(u => u.addToDropdown)
                                                            .map(u => (
                                                                <option key={u.name} value={u.name}>{u.label}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>

                                                <div className="unit-group">
                                                    <label className="unit-label">Area Unit</label>
                                                    <select
                                                        value={this.state.currentAreaUnit}
                                                        onChange={(e) => {
                                                            const newUnit = e.target.value;
                                                            this.setState({ currentAreaUnit: newUnit });
                                                            this.convertAllMeasurementsToNewAreaUnit(newUnit);
                                                        }}
                                                    >
                                                        <option value="square-meters">Square Meters</option>
                                                        <option value="square-kilometers">Square Kilometers</option>
                                                        <option value="square-feet">Square Feet</option>
                                                        <option value="square-miles">Square Miles</option>
                                                        <option value="acres">Acres</option>
                                                        <option value="hectares">Hectares</option>
                                                        {this.getCustomAreaUnits()
                                                            .filter(u => u.addToDropdown)
                                                            .map(u => (
                                                                <option key={u.name} value={u.name}>{u.label}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {measurements.length > 0 && config.showStatisticsToggle !== false && (
                        <div className="collapsible-section">
                            <button
                                type="button"
                                className="collapsible-section-header"
                                onClick={() => this.setState({ showStatistics: !showStatistics })}
                                aria-expanded={showStatistics}
                                aria-controls="statistics-content"
                            >
                                <span className="header-title-row">
                                    <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>{config.statisticsHeaderText || 'Summary Statistics'}</span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: '#94a3b8',
                                        marginLeft: '4px'
                                    }}>
                                        ({stats.totalMeasurements})
                                    </span>
                                </span>
                                <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showStatistics && (
                                <div id="statistics-content" className="collapsible-section-content">
                                    <div className="stats-grid" role="region" aria-label="Summary Statistics">
                                        <div className="stat-item">
                                            <div className="stat-label">Total Measurements</div>
                                            <div className="stat-value">{stats.totalMeasurements}</div>
                                        </div>
                                        {stats.totalSegments > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Total Segments</div>
                                                <div className="stat-value">{stats.totalSegments}</div>
                                            </div>
                                        )}
                                        {stats.pointMeasurements > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Point Count</div>
                                                <div className="stat-value">{stats.pointMeasurements}</div>
                                            </div>
                                        )}
                                        {stats.distanceMeasurements > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Distance Count</div>
                                                <div className="stat-value">{stats.distanceMeasurements}</div>
                                            </div>
                                        )}
                                        {stats.areaMeasurements > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Area Count</div>
                                                <div className="stat-value">{stats.areaMeasurements}</div>
                                            </div>
                                        )}
                                        {stats.circleMeasurements > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Circle Count</div>
                                                <div className="stat-value">{stats.circleMeasurements}</div>
                                            </div>
                                        )}
                                        {stats.totalDistance > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Total Distance</div>
                                                <div className="stat-value">
                                                    {this.formatValue(stats.totalDistance)} {this.state.currentLinearUnit}
                                                </div>
                                            </div>
                                        )}
                                        {stats.distanceMeasurements > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Avg Distance</div>
                                                <div className="stat-value">
                                                    {this.formatValue(stats.avgDistance)} {this.state.currentLinearUnit}
                                                </div>
                                            </div>
                                        )}
                                        {stats.totalArea > 0 && (
                                            <div className="stat-item">
                                                <div className="stat-label">Total Area</div>
                                                <div className="stat-value">
                                                    {this.formatValue(stats.totalArea)} {this.state.currentAreaUnit}
                                                </div>
                                            </div>
                                        )}
                                        {(stats.areaMeasurements > 0 || stats.circleMeasurements > 0) && (
                                            <div className="stat-item">
                                                <div className="stat-label">Avg Area</div>
                                                <div className="stat-value">
                                                    {this.formatValue(stats.avgArea)} {this.state.currentAreaUnit}
                                                </div>
                                            </div>
                                        )}
                                        {stats.totalPerimeter > 0 && (
                                            <>
                                                <div className="stat-item">
                                                    <div className="stat-label">Total Perimeter</div>
                                                    <div className="stat-value">
                                                        {this.formatValue(stats.totalPerimeter)} {this.state.currentLinearUnit}
                                                    </div>
                                                </div>
                                                {stats.totalSegments > 0 && (
                                                    <div className="stat-item">
                                                        <div className="stat-label">Avg Segment Length</div>
                                                        <div className="stat-value">
                                                            {this.formatValue((stats.totalDistance + stats.totalPerimeter) / stats.totalSegments)} {this.state.currentLinearUnit}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {this.state.restoreBannerCount !== null && (
                        <div className="restore-banner" role="status">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="restore-banner-text">
                                {this.state.restoreBannerCount} measurement{this.state.restoreBannerCount === 1 ? '' : 's'} from your last session
                            </span>
                            <button
                                type="button"
                                className="restore-banner-action"
                                onClick={() => this.restoreSavedSession()}
                            >
                                Restore
                            </button>
                            <button
                                type="button"
                                className="restore-banner-dismiss"
                                onClick={() => this.dismissSavedSession()}
                                title="Discard saved session"
                                aria-label="Discard saved session"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="measurements-section">
                        {(() => {
                            const detailMeasurement = this.state.detailViewMeasurementId
                                ? measurements.find(m => m.id === this.state.detailViewMeasurementId)
                                : null;
                            if (detailMeasurement) return this.renderDetailView(detailMeasurement, config);
                            return null;
                        })()}
                        {!this.state.detailViewMeasurementId && (<>
                            <div className="section-header" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 4px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <h3 className="section-title" style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                                    {config.measurementsHeaderText || 'Measurements'} ({(() => {
                                        const q = this.state.measurementFilter.trim().toLowerCase();
                                        const filteredCount = q ? measurements.filter(m => m.label.toLowerCase().includes(q) || m.type.toLowerCase().includes(q)).length : measurements.length;
                                        return q ? `${filteredCount} of ${measurements.length}` : measurements.length;
                                    })()})
                                </h3>
                                <div className="header-actions" style={{ display: 'flex', gap: '6px' }}>
                                    {config.enableMultiSelect !== false && measurements.length >= 2 && !this.state.selectMode && (
                                        <button
                                            type="button"
                                            className="icon-button select-mode-button"
                                            onClick={() => this.toggleSelectMode()}
                                            title="Select multiple measurements"
                                            aria-label="Enter multi-select mode"
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="icon-button shortcuts-help-button"
                                        onClick={() => this.setState({ showShortcutsHelp: true })}
                                        title="Keyboard shortcuts"
                                        aria-label="Show keyboard shortcuts"
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                    {config.showExportButton !== false && (
                                        <DropdownMenu>
                                            <div style={{
                                                position: 'relative',
                                                display: 'inline-block',
                                                zIndex: this.state.exportAllDropdownOpen ? 9998 : 1
                                            }}>
                                                <DropdownMenuTrigger
                                                    id="export-all-trigger"
                                                    ref={(el) => {
                                                        this.exportAllTriggerRef = el;
                                                    }}
                                                    className="tool-button"
                                                    isOpen={this.state.exportAllDropdownOpen}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.toggleExportAllDropdown();
                                                    }}
                                                    disabled={measurements.length === 0}
                                                    title="Export all measurements"
                                                    aria-label="Export all measurements"
                                                    style={{
                                                        padding: '6px 10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12" style={{ opacity: 0.6 }} aria-hidden="true" focusable="false">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </DropdownMenuTrigger>
                                                {this.state.exportAllDropdownOpen && (
                                                    <DropdownMenuContent triggerRef={this.exportAllTriggerRef} aria-labelledby="export-all-trigger">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                this.exportAllToCSV();
                                                                this.closeAllDropdowns();
                                                            }}
                                                        >
                                                            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4M3 3h7l4 4h7v2M3 3v18h18V9" />
                                                            </svg>
                                                            CSV
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                this.closeAllDropdowns();
                                                                this.setState({
                                                                    showPDFExportDialog: true,
                                                                    pendingPDFExport: { kind: 'all' }
                                                                });
                                                            }}
                                                        >
                                                            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            PDF…
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                this.exportAllToJSON();
                                                                this.closeAllDropdowns();
                                                            }}
                                                        >
                                                            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                            </svg>
                                                            JSON
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                this.exportAllToGeoJSON();
                                                                this.closeAllDropdowns();
                                                            }}
                                                        >
                                                            <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                            </svg>
                                                            GeoJSON
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                )}
                                            </div>
                                        </DropdownMenu>
                                    )}

                                    {config.showImportButton !== false && (
                                        <>
                                            <input
                                                type="file"
                                                id="geojson-import-input"
                                                accept=".geojson,.json"
                                                onChange={(e) => this.handleGeoJSONImport(e)}
                                                style={{
                                                    position: 'absolute',
                                                    width: '1px',
                                                    height: '1px',
                                                    padding: 0,
                                                    margin: '-1px',
                                                    overflow: 'hidden',
                                                    clip: 'rect(0, 0, 0, 0)',
                                                    whiteSpace: 'nowrap',
                                                    border: 0
                                                }}
                                                ref={(ref) => { this.fileInputRef = ref; }}
                                                aria-label="Import GeoJSON file"
                                            />
                                            <button
                                                className="tool-button"
                                                onClick={() => this.fileInputRef?.click()}
                                                title="Import GeoJSON measurements"
                                                aria-label="Import GeoJSON measurements"
                                                aria-controls="geojson-import-input"
                                                style={{
                                                    padding: '6px 10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                </svg>
                                                <span className="sr-only">Import</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {measurements.length >= 5 && (
                                <div className="search-row">
                                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Filter measurements…"
                                        value={this.state.measurementFilter}
                                        onChange={(e) => this.setState({ measurementFilter: e.target.value, visibleMeasurementCount: 50 })}
                                        aria-label="Filter measurements by name or type"
                                    />
                                    {this.state.measurementFilter && (
                                        <button
                                            type="button"
                                            className="search-clear"
                                            onClick={() => this.setState({ measurementFilter: '', visibleMeasurementCount: 50 })}
                                            title="Clear filter"
                                            aria-label="Clear filter"
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    {config.enableSortOptions !== false && (
                                        <select
                                            className="sort-select"
                                            value={this.state.sortOrder}
                                            onChange={(e) => this.setState({ sortOrder: e.target.value as any, visibleMeasurementCount: 50 })}
                                            aria-label="Sort measurements"
                                            title="Sort measurements"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="name">Name</option>
                                            <option value="type">Type</option>
                                        </select>
                                    )}
                                </div>
                            )}

                            {this.state.selectMode && (
                                <div className="select-action-bar" role="toolbar" aria-label="Bulk actions">
                                    <span className="select-count">
                                        {this.state.selectedIds.size} selected
                                    </span>
                                    <button
                                        type="button"
                                        className="select-bar-button"
                                        disabled={this.state.selectedIds.size === 0}
                                        onClick={() => this.exportSelectedToGeoJSON()}
                                        title="Export selected as GeoJSON"
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export
                                    </button>
                                    <button
                                        type="button"
                                        className="select-bar-button select-bar-button-danger"
                                        disabled={this.state.selectedIds.size === 0}
                                        onClick={() => this.deleteSelected()}
                                        title="Delete selected"
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="select-bar-button select-bar-cancel"
                                        onClick={() => this.toggleSelectMode()}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <div
                                ref={(el) => { this.listScrollRef = el; }}
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    minHeight: 0
                                }}
                            >
                                {measurements.length === 0 ? (
                                    <div className="empty-state">
                                        <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" focusable="false">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        <p>{config.emptyStateMessage || 'No measurements yet'}</p>
                                        <p className="empty-hint">{config.emptyStateHint || 'Pick a tool above to start drawing on the map'}</p>
                                    </div>
                                ) : (() => {
                                    // Filter + sort + page the list — see #11 (paged list instead of virtualization) and #23 (search)
                                    const filterQuery = this.state.measurementFilter.trim().toLowerCase();
                                    const filtered = filterQuery
                                        ? measurements.filter(m => m.label.toLowerCase().includes(filterQuery) || m.type.toLowerCase().includes(filterQuery))
                                        : measurements;
                                    if (filtered.length === 0) {
                                        return (
                                            <div className="empty-state">
                                                <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <p>No matches</p>
                                                <p className="empty-hint">No measurements match "{this.state.measurementFilter}".</p>
                                            </div>
                                        );
                                    }
                                    const sorted = this.sortMeasurements(filtered);
                                    const visible = sorted.slice(0, this.state.visibleMeasurementCount);
                                    const hidden = sorted.length - visible.length;
                                    const visibleIds = visible.map(m => m.id);
                                    const allVisibleSelected = this.state.selectMode && visibleIds.length > 0 && visibleIds.every(id => this.state.selectedIds.has(id));
                                    return (
                                        <div className="measurements-list" role="list" aria-label="Measurements">
                                            {this.state.selectMode && (
                                                <label className="select-all-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={allVisibleSelected}
                                                        onChange={() => this.toggleSelectAll(visibleIds)}
                                                        aria-label="Select all visible measurements"
                                                    />
                                                    <span>Select all visible</span>
                                                </label>
                                            )}
                                            {visible.map(measurement => {
                                                const canEditVertices = (config.enableVertexEditTool !== false) && measurement.type !== 'point' && measurement.type !== 'circle';
                                                const isChecked = this.state.selectedIds.has(measurement.id);
                                                return (
                                                    <div
                                                        key={measurement.id}
                                                        className={`measurement-card ${this.state.selectMode && isChecked ? 'is-selected' : ''}`}
                                                        role="listitem"
                                                        style={{ borderLeftColor: measurement.color, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}
                                                    >
                                                        <div
                                                            className="card-header"
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={this.state.selectMode ? `${isChecked ? 'Deselect' : 'Select'} ${measurement.label}` : `Open details for ${measurement.label}`}
                                                            onClick={() => this.openDetailView(measurement.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    this.openDetailView(measurement.id);
                                                                }
                                                            }}
                                                        >
                                                            {this.state.selectMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    className="card-select-checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => this.toggleSelected(measurement.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    aria-label={`Select ${measurement.label}`}
                                                                />
                                                            )}
                                                            <div className="card-title-row">
                                                                <button
                                                                    type="button"
                                                                    className="card-color-swatch"
                                                                    aria-label={`Change color for ${measurement.label}`}
                                                                    title="Change color"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        this.setState(prev => ({
                                                                            colorPickerForId: prev.colorPickerForId === measurement.id ? null : measurement.id,
                                                                            overflowDropdownOpen: {},
                                                                            exportDropdownOpen: {}
                                                                        }));
                                                                    }}
                                                                    style={{ backgroundColor: measurement.color }}
                                                                />
                                                                <span className="card-type-icon" aria-hidden="true">
                                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" focusable="false">
                                                                        {measurement.type === 'point' && (
                                                                            <>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            </>
                                                                        )}
                                                                        {measurement.type === 'distance' && (
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        )}
                                                                        {measurement.type === 'area' && (
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                                                                        )}
                                                                        {measurement.type === 'circle' && (
                                                                            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                                                        )}
                                                                        {measurement.type === 'triangle' && (
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4L3 20h18L12 4z" />
                                                                        )}
                                                                    </svg>
                                                                </span>
                                                                <span className="sr-only">Color: {measurement.color}</span>
                                                                {this.state.renamingMeasurementId === measurement.id ? (
                                                                    <input
                                                                        type="text"
                                                                        className="measurement-name-input"
                                                                        autoFocus
                                                                        value={this.state.renamingValue}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onChange={(e) => this.setState({ renamingValue: e.target.value })}
                                                                        onBlur={() => this.renameMeasurement(measurement.id, this.state.renamingValue)}
                                                                        onKeyDown={(e) => {
                                                                            e.stopPropagation();
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                this.renameMeasurement(measurement.id, this.state.renamingValue);
                                                                            } else if (e.key === 'Escape') {
                                                                                e.preventDefault();
                                                                                this.setState({ renamingMeasurementId: null, renamingValue: '' });
                                                                            }
                                                                        }}
                                                                        aria-label="Edit measurement name"
                                                                        maxLength={80}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="measurement-name"
                                                                        onDoubleClick={(e) => {
                                                                            e.stopPropagation();
                                                                            this.setState({ renamingMeasurementId: measurement.id, renamingValue: measurement.label });
                                                                        }}
                                                                        title="Double-click to rename"
                                                                    >
                                                                        {measurement.label}
                                                                    </span>
                                                                )}
                                                                {measurement.segments && measurement.segments.length > 0 && (
                                                                    <span className="jimu-badge jimu-badge-light" aria-label={`${measurement.segments.length} ${measurement.type === 'distance' ? 'segments' : 'edges'}`}>
                                                                        {measurement.segments.length} {measurement.type === 'distance' ? 'seg' : 'edges'}
                                                                    </span>
                                                                )}
                                                                {this.state.colorPickerForId === measurement.id && (
                                                                    <div
                                                                        className="color-picker-popover"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        role="dialog"
                                                                        aria-label="Choose color"
                                                                    >
                                                                        {this.colorPalette.map((c) => (
                                                                            <button
                                                                                key={c}
                                                                                type="button"
                                                                                className={`color-swatch ${measurement.color === c ? 'is-selected' : ''}`}
                                                                                aria-label={`Color ${c}`}
                                                                                aria-pressed={measurement.color === c}
                                                                                style={{ backgroundColor: c }}
                                                                                onClick={() => this.setMeasurementColor(measurement.id, c)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenu>
                                                                    <div style={{
                                                                        position: 'relative',
                                                                        display: 'inline-block',
                                                                        zIndex: this.state.exportDropdownOpen[measurement.id] ? 9998 : 1
                                                                    }}>
                                                                        <DropdownMenuTrigger
                                                                            id={`export-trigger-${measurement.id}`}
                                                                            ref={(el) => {
                                                                                this.exportTriggerRefs.set(measurement.id, el);
                                                                            }}
                                                                            className="icon-button"
                                                                            isOpen={this.state.exportDropdownOpen[measurement.id]}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                this.toggleExportDropdown(measurement.id);
                                                                            }}
                                                                            title="Export"
                                                                            aria-label={`Export ${measurement.label}`}
                                                                        >
                                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                        </DropdownMenuTrigger>
                                                                        {this.state.exportDropdownOpen[measurement.id] && (
                                                                            <DropdownMenuContent triggerRef={this.exportTriggerRefs.get(measurement.id) || undefined} aria-labelledby={`export-trigger-${measurement.id}`}>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.exportMeasurementToCSV(measurement);
                                                                                        this.closeAllDropdowns();
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4M3 3h7l4 4h7v2M3 3v18h18V9" />
                                                                                    </svg>
                                                                                    CSV
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.closeAllDropdowns();
                                                                                        this.setState({
                                                                                            showPDFExportDialog: true,
                                                                                            pendingPDFExport: { kind: 'one', measurement }
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                    </svg>
                                                                                    PDF…
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.exportMeasurementToJSON(measurement);
                                                                                        this.closeAllDropdowns();
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                                                    </svg>
                                                                                    JSON
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.exportMeasurementToGeoJSON(measurement);
                                                                                        this.closeAllDropdowns();
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                                                    </svg>
                                                                                    GeoJSON
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        )}
                                                                    </div>
                                                                </DropdownMenu>
                                                                <button
                                                                    className="icon-button"
                                                                    onClick={(e) => { e.stopPropagation(); this.zoomToMeasurement(measurement); }}
                                                                    title="Zoom to measurement"
                                                                    aria-label={`Zoom to ${measurement.label}`}
                                                                >
                                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                    </svg>
                                                                </button>
                                                                <DropdownMenu>
                                                                    <div style={{
                                                                        position: 'relative',
                                                                        display: 'inline-block',
                                                                        zIndex: this.state.overflowDropdownOpen[measurement.id] ? 9998 : 1
                                                                    }}>
                                                                        <DropdownMenuTrigger
                                                                            id={`overflow-trigger-${measurement.id}`}
                                                                            ref={(el) => {
                                                                                this.overflowTriggerRefs.set(measurement.id, el);
                                                                            }}
                                                                            className="icon-button"
                                                                            isOpen={this.state.overflowDropdownOpen[measurement.id]}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                this.toggleOverflowDropdown(measurement.id);
                                                                            }}
                                                                            title="More actions"
                                                                            aria-label={`More actions for ${measurement.label}`}
                                                                        >
                                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                                                            </svg>
                                                                        </DropdownMenuTrigger>
                                                                        {this.state.overflowDropdownOpen[measurement.id] && (
                                                                            <DropdownMenuContent triggerRef={this.overflowTriggerRefs.get(measurement.id) || undefined} aria-labelledby={`overflow-trigger-${measurement.id}`}>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.closeAllDropdowns();
                                                                                        this.setState({ renamingMeasurementId: measurement.id, renamingValue: measurement.label });
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                    </svg>
                                                                                    Rename
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.duplicateMeasurement(measurement.id);
                                                                                        this.closeAllDropdowns();
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                    Duplicate
                                                                                </DropdownMenuItem>
                                                                                {canEditVertices && (
                                                                                    <DropdownMenuItem
                                                                                        onClick={() => {
                                                                                            this.editMeasurementVertices(measurement.id);
                                                                                            this.closeAllDropdowns();
                                                                                        }}
                                                                                    >
                                                                                        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 4.121a3 3 0 114.243 4.243L7.5 19.243l-4.243 1.06 1.06-4.242L14.121 4.121z" />
                                                                                        </svg>
                                                                                        {this.state.editingMeasurementId === measurement.id ? 'Stop editing' : 'Edit vertices'}
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    onClick={() => {
                                                                                        this.deleteMeasurement(measurement.id);
                                                                                        this.closeAllDropdowns();
                                                                                    }}
                                                                                >
                                                                                    <svg className="menu-icon" fill="none" stroke="#dc2626" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                    <span style={{ color: '#dc2626' }}>Delete</span>
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        )}
                                                                    </div>
                                                                </DropdownMenu>
                                                                <span
                                                                    className="card-expand-chevron"
                                                                    aria-hidden="true"
                                                                >
                                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" focusable="false">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                            {hidden > 0 && (
                                                <button
                                                    type="button"
                                                    className="show-more-button"
                                                    onClick={() => this.setState(prev => ({ visibleMeasurementCount: prev.visibleMeasurementCount + 50 }))}
                                                >
                                                    Show {Math.min(50, hidden)} more measurements
                                                    <span className="show-more-hint"> · {hidden} remaining</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </>)}
                    </div>

                </div>

                {this.state.showClearAllDialog && (
                    <>
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 100000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => this.setState({ showClearAllDialog: false })}
                        />
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="clear-dialog-title"
                            aria-describedby="clear-dialog-title"
                            tabIndex={-1}
                            ref={(el) => el?.focus()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    this.setState({ showClearAllDialog: false });
                                }
                                // Focus trap
                                if (e.key === 'Tab') {
                                    const focusable = e.currentTarget.querySelectorAll('button:not([disabled])') as NodeListOf<HTMLElement>;
                                    const first = focusable[0];
                                    const last = focusable[focusable.length - 1];
                                    if (e.shiftKey && document.activeElement === first) {
                                        e.preventDefault();
                                        last?.focus();
                                    } else if (!e.shiftKey && document.activeElement === last) {
                                        e.preventDefault();
                                        first?.focus();
                                    }
                                }
                            }}
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: '#1e293b',
                                borderRadius: '8px',
                                padding: '24px',
                                minWidth: '320px',
                                maxWidth: '90%',
                                zIndex: 100001,
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                                color: 'white'
                            }}
                        >
                            <div
                                id="clear-dialog-title"
                                style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    marginBottom: '16px',
                                    color: '#f1f5f9'
                                }}
                            >
                                {config.clearDialogTitle || 'Are you sure you want to clear all measurements?'}
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => this.setState({ showClearAllDialog: false })}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#475569',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#64748b'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                                >
                                    {config.clearDialogCancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={() => this.confirmClearAll()}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                >
                                    {config.clearDialogConfirmText || 'OK'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {this.state.showImportSuccessDialog && (
                    <>
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 100000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => this.setState({ showImportSuccessDialog: false })}
                        />
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="import-dialog-title"
                            tabIndex={-1}
                            ref={(el) => el?.focus()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    this.setState({ showImportSuccessDialog: false });
                                }
                            }}
                            style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: '#1e293b',
                                borderRadius: '8px',
                                padding: '24px',
                                minWidth: '320px',
                                maxWidth: '90%',
                                zIndex: 100001,
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                                color: 'white'
                            }}
                        >
                            <div
                                id="import-dialog-title"
                                style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    marginBottom: '16px',
                                    color: '#f1f5f9'
                                }}
                            >
                                {this.state.importSuccessMessage}
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => this.setState({ showImportSuccessDialog: false })}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ============== Undo toast (after delete) ============== */}
                {this.state.undoToast && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="undo-toast"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="undo-toast-message">{this.state.undoToast.message}</span>
                        <button
                            type="button"
                            className="undo-toast-action"
                            onClick={() => this.undoLastDelete()}
                        >
                            Undo
                        </button>
                        <button
                            type="button"
                            className="undo-toast-close"
                            onClick={() => {
                                if (this.deleteToastTimer) { clearTimeout(this.deleteToastTimer); this.deleteToastTimer = null; }
                                this.setState({ undoToast: null });
                            }}
                            aria-label="Dismiss notification"
                            title="Dismiss"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* ============== PDF export progress overlay ============== */}
                {this.state.isExportingPDF && (
                    <div className="pdf-progress-overlay" role="status" aria-live="polite">
                        <div className="pdf-progress-card">
                            <div className="loading-spinner" style={{ width: '24px', height: '24px' }} aria-hidden="true"></div>
                            <div>
                                <div className="pdf-progress-title">Generating PDF…</div>
                                <div className="pdf-progress-hint">This may take a moment for many measurements.</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============== Import error dialog ============== */}
                {this.state.showImportErrorDialog && (
                    <>
                        <div
                            aria-hidden="true"
                            className="dialog-backdrop"
                            onClick={() => this.setState({ showImportErrorDialog: false })}
                        />
                        <div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="import-error-title"
                            tabIndex={-1}
                            ref={(el) => el?.focus()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') this.setState({ showImportErrorDialog: false });
                            }}
                            className="dialog-card dialog-card-danger"
                        >
                            <div className="dialog-icon dialog-icon-danger" aria-hidden="true">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div id="import-error-title" className="dialog-title">Import failed</div>
                            <div className="dialog-body">{this.state.importErrorMessage}</div>
                            <div className="dialog-actions">
                                <button
                                    className="action-button"
                                    onClick={() => this.setState({ showImportErrorDialog: false })}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ============== PDF export options dialog ============== */}
                {this.state.showPDFExportDialog && this.state.pendingPDFExport && (
                    <>
                        <div
                            aria-hidden="true"
                            className="dialog-backdrop"
                            onClick={() => this.setState({ showPDFExportDialog: false, pendingPDFExport: null })}
                        />
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="pdf-export-title"
                            tabIndex={-1}
                            ref={(el) => el?.focus()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') this.setState({ showPDFExportDialog: false, pendingPDFExport: null });
                            }}
                            className="dialog-card"
                        >
                            <div id="pdf-export-title" className="dialog-title">PDF export options</div>
                            <div className="dialog-body">
                                <label className="dialog-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={this.state.printReadyLabels}
                                        onChange={() => this.togglePrintReadyLabels()}
                                    />
                                    <span>
                                        <span className="dialog-checkbox-title">Print-ready labels</span>
                                        <span className="dialog-checkbox-hint">Adds extra spacing between segment labels so they don't overlap on printed maps.</span>
                                    </span>
                                </label>
                            </div>
                            <div className="dialog-actions">
                                <button
                                    className="action-button"
                                    onClick={() => this.setState({ showPDFExportDialog: false, pendingPDFExport: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="action-button action-button-primary"
                                    onClick={() => {
                                        const pending = this.state.pendingPDFExport;
                                        this.setState({ showPDFExportDialog: false, pendingPDFExport: null });
                                        if (pending) {
                                            if (pending.kind === 'all') this.exportAllToPDF();
                                            else if (pending.measurement) this.exportMeasurementToPDF(pending.measurement);
                                        }
                                    }}
                                >
                                    Export PDF
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ============== Keyboard shortcuts help popover ============== */}
                {this.state.showShortcutsHelp && (
                    <>
                        <div
                            aria-hidden="true"
                            className="dialog-backdrop"
                            onClick={() => this.setState({ showShortcutsHelp: false })}
                        />
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="shortcuts-help-title"
                            tabIndex={-1}
                            ref={(el) => el?.focus()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') this.setState({ showShortcutsHelp: false });
                            }}
                            className="dialog-card"
                        >
                            <div id="shortcuts-help-title" className="dialog-title">Keyboard shortcuts</div>
                            <div className="dialog-body">
                                <table className="shortcuts-table">
                                    <tbody>
                                        <tr><td><kbd>Esc</kbd></td><td>Cancel active drawing tool</td></tr>
                                        <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo last action</td></tr>
                                        <tr><td><kbd>Ctrl</kbd>+<kbd>Y</kbd></td><td>Redo</td></tr>
                                        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td><td>Redo (alt)</td></tr>
                                        <tr><td><kbd>Enter</kbd></td><td>Expand or collapse a measurement card</td></tr>
                                        <tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Move between controls</td></tr>
                                        <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Navigate within dropdown menus</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="dialog-actions">
                                <button
                                    className="action-button"
                                    onClick={() => this.setState({ showShortcutsHelp: false })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }
}