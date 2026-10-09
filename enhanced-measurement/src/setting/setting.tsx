/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { React, jsx, css, Immutable } from 'jimu-core';
import type { AllWidgetSettingProps } from 'jimu-for-builder';
import {
    MapWidgetSelector,
    SettingSection,
    SettingRow
} from 'jimu-ui/advanced/setting-components';
import {
    Switch,
    Select,
    NumericInput,
    Label,
    TextInput,
    Checkbox,
    Radio,
    Button,
    Icon,
    CollapsablePanel,
    Alert,
    Card,
    CardBody,
    Tooltip
} from 'jimu-ui';
import __i18nDefaults from './translations/default'
import { __setIntl, __tc } from './i18n-t'
let __i18nIntl: any = null
/** Module translator: app language via the widget intl, English from default.ts, {name} values filled. */
const __t = (id: string, values?: { [key: string]: any }): string => {
  const msg: string = (__i18nDefaults as any)[id] ?? id
  if (__i18nIntl && typeof __i18nIntl.formatMessage === 'function') {
    try { return __i18nIntl.formatMessage({ id, defaultMessage: msg }, values) } catch (e) { }
  }
  return msg.replace(/\{(\w+)\}/g, (m: string, k: string) => (values && values[k] != null ? String(values[k]) : m))
}


interface CustomLinearUnit {
    name: string;
    label: string;
    toMeters: number;
    addToDropdown: boolean;
}

interface CustomAreaUnit {
    name: string;
    label: string;
    toSquareMeters: number;
    addToDropdown: boolean;
}

interface SettingState {
    showAdvancedOptions: boolean;
    editingLinearUnit: CustomLinearUnit | null;
    editingLinearUnitIndex: number;
    editingAreaUnit: CustomAreaUnit | null;
    editingAreaUnitIndex: number;
    importExportStatus: { type: 'success' | 'error'; message: string } | null;
    /** Generated XML shown in the export textarea preview. Empty until Generate XML is clicked. */
    exportXmlPreview: string;
    /** XML pasted by the user into the import textarea. */
    importXmlPaste: string;
}

// EB 1.21 type-only fix: the 1.21 AllWidgetSettingProps type does not surface the
// builder-injected id/useMapWidgetIds props even though the builder still provides
// them at runtime. Intersection keeps the editor clean with zero runtime impact.
type SettingProps = AllWidgetSettingProps<any> & {
    id: string;
    useMapWidgetIds?: string[] | any;
};

export default class Setting extends React.PureComponent<SettingProps, SettingState> {
    // EB 1.21 editor fallback: see the matching note in widget.tsx. Type-only,
    // zero runtime impact.
    declare props: Readonly<SettingProps>;
    declare state: Readonly<SettingState>;
    declare setState: <K extends keyof SettingState>(
        state: ((prevState: Readonly<SettingState>, props: Readonly<SettingProps>) => Pick<SettingState, K> | SettingState | null) | Pick<SettingState, K> | SettingState | null,
        callback?: () => void
    ) => void;
    declare forceUpdate: (callback?: () => void) => void;


    constructor(props) {
        super(props);
        this.state = {
            showAdvancedOptions: false,
            editingLinearUnit: null,
            editingLinearUnitIndex: -1,
            editingAreaUnit: null,
            editingAreaUnitIndex: -1,
            importExportStatus: null,
            exportXmlPreview: '',
            importXmlPaste: ''
        };
    }

    private importInputRef: HTMLInputElement | null = null;
    private importExportStatusTimer: any = null;


    getStyles = () => {
        return css`
            .custom-unit-description {
                font-size: 12px;
                color: var(--sys-color-text-regular, var(--dark-500, #a8a8a8));
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .custom-unit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .custom-unit-header-label {
                font-size: 13px;
                font-weight: 600;
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
            }

            .custom-unit-card {
                border: 1px solid var(--sys-color-divider-tertiary, var(--light-500, rgba(255,255,255,0.12)));
                border-radius: var(--sys-shape-0, 4px);
                padding: 10px 12px;
                margin-bottom: 8px;
                background: var(--sys-color-surface-paper, var(--light-100, rgba(255,255,255,0.04)));
                transition: border-color 0.15s ease;
            }

            .custom-unit-card:hover {
                border-color: var(--sys-color-primary-light, var(--primary-300, rgba(255,255,255,0.2)));
            }

            .custom-unit-card-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }

            .custom-unit-card-info {
                flex: 1;
                min-width: 0;
            }

            .custom-unit-card-name {
                font-size: 13px;
                font-weight: 600;
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
            }

            .custom-unit-card-detail {
                font-size: 11px;
                color: var(--sys-color-text-disabled, var(--dark-400, #888));
                margin-top: 2px;
            }

            .custom-unit-card-actions {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }

            .custom-unit-edit-form {
                border: 2px solid var(--sys-color-primary-main, #3b82f6);
                border-radius: var(--sys-shape-1, 6px);
                padding: 14px;
                margin-top: 10px;
                background: var(--sys-color-surface-paper, var(--light-100, rgba(255,255,255,0.04)));
            }

            .custom-unit-edit-title {
                font-size: 13px;
                font-weight: 600;
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .custom-unit-edit-title svg {
                color: var(--sys-color-primary-main, #3b82f6);
            }

            .custom-unit-field-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .custom-unit-field-label {
                font-size: 11px;
                font-weight: 500;
                color: var(--sys-color-text-regular, var(--dark-500, #a8a8a8));
                margin-bottom: 4px;
            }

            .custom-unit-edit-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .custom-unit-reference {
                font-size: 11px;
                color: var(--sys-color-text-regular, var(--dark-500, #a8a8a8));
                line-height: 1.6;
                padding: 10px 12px;
                background: var(--sys-color-surface-background, var(--light-100, rgba(255,255,255,0.03)));
                border-radius: var(--sys-shape-0, 4px);
                border: 1px solid var(--sys-color-divider-tertiary, var(--light-500, rgba(255,255,255,0.08)));
                margin-top: 12px;
            }

            .custom-unit-reference strong {
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
            }

            .ie-section-description {
                font-size: 12px;
                color: var(--sys-color-text-regular, var(--dark-500, #a8a8a8));
                line-height: 1.5;
                margin-bottom: 12px;
            }

            .ie-button-row {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 10px;
            }

            .ie-btn {
                flex: 1 1 calc(50% - 3px);
                min-width: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 8px 10px;
                border: 1px solid var(--sys-color-primary-main, #3b82f6);
                border-radius: var(--sys-shape-1, 4px);
                background: var(--sys-color-surface-paper, transparent);
                color: var(--sys-color-primary-main, #3b82f6);
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .ie-btn:hover {
                background: var(--sys-color-primary-main, #3b82f6);
                color: #fff;
            }

            .ie-btn:hover svg {
                color: #fff;
            }

            .ie-btn svg {
                width: 16px;
                height: 16px;
                transition: color 0.15s ease;
            }

            .ie-btn-primary {
                background: var(--sys-color-primary-main, #3b82f6);
                color: #fff;
            }

            .ie-btn-primary:hover {
                opacity: 0.9;
            }

            .ie-info-panel {
                font-size: 11px;
                color: var(--sys-color-text-regular, var(--dark-500, #a8a8a8));
                line-height: 1.5;
                padding: 10px 12px;
                background: var(--sys-color-surface-background, var(--light-100, rgba(255,255,255,0.03)));
                border-radius: var(--sys-shape-0, 4px);
                border: 1px solid var(--sys-color-divider-tertiary, var(--light-500, rgba(255,255,255,0.08)));
            }

            .ie-info-panel strong {
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
            }

            .ie-status {
                padding: 10px 12px;
                border-radius: var(--sys-shape-0, 4px);
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
            }

            .ie-status-success {
                background: rgba(74, 222, 128, 0.1);
                border: 1px solid rgba(74, 222, 128, 0.3);
                color: #4ade80;
            }

            .ie-status-error {
                background: rgba(248, 113, 113, 0.1);
                border: 1px solid rgba(248, 113, 113, 0.3);
                color: #f87171;
            }

            .ie-subsection-label {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: var(--sys-color-text-secondary, var(--dark-500, #94a3b8));
                margin-bottom: 6px;
                margin-top: 4px;
            }

            .ie-btn-tertiary {
                background: transparent;
                border-color: transparent;
                color: var(--sys-color-text-secondary, var(--dark-500, #94a3b8));
            }
            .ie-btn-tertiary:hover {
                background: var(--sys-color-action-hover, rgba(255,255,255,0.05));
                color: var(--sys-color-text-title, #e0e0e0);
            }

            .ie-btn:disabled {
                opacity: 0.45;
                cursor: not-allowed;
            }

            .ie-textarea {
                width: 100%;
                min-height: 140px;
                margin-top: 8px;
                margin-bottom: 4px;
                padding: 8px 10px;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 11px;
                line-height: 1.5;
                color: var(--sys-color-text-title, var(--dark-800, #e0e0e0));
                background: var(--sys-color-surface-background, var(--light-100, rgba(255,255,255,0.03)));
                border: 1px solid var(--sys-color-divider-secondary, var(--light-500, rgba(255,255,255,0.12)));
                border-radius: var(--sys-shape-0, 4px);
                resize: vertical;
                box-sizing: border-box;
                outline: none;
                tab-size: 2;
            }
            .ie-textarea:focus {
                border-color: var(--sys-color-primary-main, #3b82f6);
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
            }
            .ie-textarea::placeholder {
                color: var(--sys-color-text-placeholder, rgba(255,255,255,0.3));
            }

            .section-spacer {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid var(--sys-color-divider-tertiary, var(--light-500, rgba(255,255,255,0.08)));
            }
        `;
    };

    linearUnitOptions = [
        { value: 'meters', get label () { return __t("meters") } },
        { value: 'kilometers', get label () { return __t("kilometers") } },
        { value: 'feet', get label () { return __t("feet") } },
        { value: 'miles', get label () { return __t("miles") } },
        { value: 'yards', get label () { return __t("yards") } },
        { value: 'nautical-miles', get label () { return __t("nauticalMiles") } }
    ];

    areaUnitOptions = [
        { value: 'square-meters', get label () { return __t("squareMeters") } },
        { value: 'square-kilometers', get label () { return __t("squareKilometers") } },
        { value: 'square-feet', get label () { return __t("squareFeet") } },
        { value: 'square-miles', get label () { return __t("squareMiles") } },
        { value: 'acres', get label () { return __t("acres") } },
        { value: 'hectares', get label () { return __t("hectares") } }
    ];

    defaultToolOptions = [
        { value: 'none', get label () { return __t("noneManualSelection") } },
        { value: 'point', get label () { return __t("pointMeasurement") } },
        { value: 'distance', get label () { return __t("distanceMeasurement") } },
        { value: 'area', get label () { return __t("areaMeasurement") } },
        { value: 'circle', get label () { return __t("circleMeasurement") } },
        { value: 'rectangle', get label () { return __t("rectangleMeasurement") } },
        { value: 'triangle', get label () { return __t("triangleMeasurement") } },
        { value: 'freehand-polyline', get label () { return __t("uiFreehandLine") } },
        { value: 'freehand-polygon', get label () { return __t("uiFreehandArea") } }
    ];

    coordinateFormatOptions = [
        { value: 'decimal', get label () { return __t("decimalDegreesDd") } },
        { value: 'dms', get label () { return __t("degreesMinutesSecondsDms") } },
        { value: 'ddm', get label () { return __t("degreesDecimalMinutesDdm") } }
    ];

    exportFormatOptions = [
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' },
        { value: 'geojson', get label () { return __t("geoJSON") } },
        { value: 'pdf', label: 'PDF' }
    ];

    labelPositionOptions = [
        { value: 'center', get label () { return __t("center") } },
        { value: 'top', get label () { return __t("top") } },
        { value: 'bottom', get label () { return __t("bottom") } }
    ];

    fontFamilyOptions = [
        { value: 'Arial', get label () { return __t("arial") } },
        { value: 'Helvetica', get label () { return __t("helvetica") } },
        { value: 'Times New Roman', get label () { return __t("timesNewRoman") } },
        { value: 'Courier New', get label () { return __t("courierNew") } },
        { value: 'Georgia', get label () { return __t("georgia") } },
        { value: 'Verdana', get label () { return __t("verdana") } },
        { value: 'Trebuchet MS', get label () { return __t("trebuchetMs") } },
        { value: 'Palatino', get label () { return __t("palatino") } },
        { value: 'Garamond', get label () { return __t("garamond") } },
        { value: 'Comic Sans MS', get label () { return __t("comicSansMs") } },
        { value: 'Tahoma', get label () { return __t("tahoma") } },
        { value: 'Impact', get label () { return __t("impact") } }
    ];

    fontWeightOptions = [
        { value: 'normal', get label () { return __t("normal") } },
        { value: 'bold', get label () { return __t("bold") } },
        { value: 'bolder', get label () { return __t("bolder") } },
        { value: 'lighter', get label () { return __t("lighter") } }
    ];

    fontStyleOptions = [
        { value: 'normal', get label () { return __t("normal") } },
        { value: 'italic', get label () { return __t("italic") } },
        { value: 'oblique', get label () { return __t("oblique") } }
    ];

    onMapWidgetSelected = (useMapWidgetIds: string[]) => {
        this.props.onSettingChange({
            id: this.props.id,
            useMapWidgetIds: useMapWidgetIds
        });
    };

    onLinearUnitChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultLinearUnit', evt.target.value)
        });
    };

    onAreaUnitChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultAreaUnit', evt.target.value)
        });
    };

    onDefaultToolChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultTool', evt.target.value)
        });
    };

    onAutoStartToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('autoStartTool', evt.target.checked)
        });
    };

    onContinuousDrawingChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('continuousDrawing', evt.target.checked)
        });
    };

    onAutoClearOnToolSwitchChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('autoClearOnToolSwitch', evt.target.checked)
        });
    };

    onEnableStorageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableStorage', evt.target.checked)
        });
    };

    onMaxStoredMeasurementsChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('maxStoredMeasurements', value)
        });
    };

    onPersistMeasurementsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('persistMeasurements', evt.target.checked)
        });
    };

    onShowStatisticsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showStatistics', evt.target.checked)
        });
    };

    onEnableSegmentLabelingChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableSegmentLabeling', evt.target.checked)
        });
    };

    onShowSegmentLabelsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showSegmentLabels', evt.target.checked)
        });
    };

    onAutoSaveSegmentsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('autoSaveSegments', evt.target.checked)
        });
    };

    onShowTotalDistanceChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showTotalDistance', evt.target.checked)
        });
    };

    onShowLiveMeasurementChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showLiveMeasurement', evt.target.checked)
        });
    };

    onShowCoordinatesChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showCoordinates', evt.target.checked)
        });
    };

    onCoordinateFormatChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('coordinateFormat', evt.target.value)
        });
    };

    onEnableExportChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableExport', evt.target.checked)
        });
    };

    onDefaultExportFormatChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultExportFormat', evt.target.value)
        });
    };

    onIncludeTimestampInExportChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('includeTimestampInExport', evt.target.checked)
        });
    };

    onColorPaletteChange = (index: number, color: string) => {
        const config = this.props.config;
        const currentPalette = config.colorPalette || [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];
        const newPalette = [...currentPalette];
        newPalette[index] = color;
        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('colorPalette', newPalette)
        });
    };

    onPointButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('pointButtonText', evt.target.value)
        });
    };

    onLineButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('lineButtonText', evt.target.value)
        });
    };

    onAreaButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('areaButtonText', evt.target.value)
        });
    };

    onCircleButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('circleButtonText', evt.target.value)
        });
    };

    onRectangleButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('rectangleButtonText', evt.target.value)
        });
    };

    onTriangleButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('triangleButtonText', evt.target.value)
        });
    };

    onFreehandLineButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('freehandLineButtonText', evt.target.value)
        });
    };

    onFreehandAreaButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('freehandAreaButtonText', evt.target.value)
        });
    };

    onClearAllButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('clearAllButtonText', evt.target.value)
        });
    };

    onEnableCircleToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableCircleTool', evt.target.checked)
        });
    };

    onEnableRectangleToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableRectangleTool', evt.target.checked)
        });
    };

    onEnableTriangleToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableTriangleTool', evt.target.checked)
        });
    };

    onEnableFreehandPolylineToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableFreehandPolylineTool', evt.target.checked)
        });
    };

    onEnableFreehandPolygonToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableFreehandPolygonTool', evt.target.checked)
        });
    };

    onEnablePointToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enablePointTool', evt.target.checked)
        });
    };

    onEnableDistanceToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableDistanceTool', evt.target.checked)
        });
    };

    onEnableAreaToolChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableAreaTool', evt.target.checked)
        });
    };

    onShowUnitToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showUnitToggle', evt.target.checked)
        });
    };

    onShowCoordinateModeToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showCoordinateModeToggle', evt.target.checked)
        });
    };

    onShowSegmentLabelsToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showSegmentLabelsToggle', evt.target.checked)
        });
    };

    onShowTooltipsToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showTooltipsToggle', evt.target.checked)
        });
    };

    onShowSnappingToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showSnappingToggle', evt.target.checked)
        });
    };

    onShowStatisticsToggleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showStatisticsToggle', evt.target.checked)
        });
    };

    onSegmentLabelTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelText', evt.target.value)
        });
    };

    onTooltipsToggleTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('tooltipsToggleText', evt.target.value)
        });
    };

    onSnappingToggleTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('snappingToggleText', evt.target.value)
        });
    };

    onEnableUndoRedoChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableUndoRedo', evt.target.checked)
        });
    };

    onUndoButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('undoButtonText', evt.target.value)
        });
    };

    onRedoButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('redoButtonText', evt.target.value)
        });
    };

    onEnableImportExportChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('enableImportExport', evt.target.checked)
        });
    };

    onShowExportButtonChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showExportButton', evt.target.checked)
        });
    };

    onShowImportButtonChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showImportButton', evt.target.checked)
        });
    };

    onExportButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('exportButtonText', evt.target.value)
        });
    };

    onImportButtonTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('importButtonText', evt.target.value)
        });
    };

    onSegmentLabelPrefixChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelPrefix', evt.target.value)
        });
    };

    onSegmentLabelFontSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelFontSize', value)
        });
    };

    onLabelFontSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelFontSize', value)
        });
    };

    onLabelColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelColor', evt.target.value)
        });
    };

    onLabelHaloColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelHaloColor', evt.target.value)
        });
    };

    onLabelHaloSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelHaloSize', value)
        });
    };

    onLabelPositionChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelPosition', evt.target.value)
        });
    };

    // Main Label Font Controls
    onLabelFontFamilyChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelFontFamily', evt.target.value)
        });
    };

    onLabelFontWeightChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelFontWeight', evt.target.value)
        });
    };

    onLabelFontStyleChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('labelFontStyle', evt.target.value)
        });
    };

    // Segment Label Font Controls
    onSegmentLabelFontFamilyChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelFontFamily', evt.target.value)
        });
    };

    onSegmentLabelFontWeightChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelFontWeight', evt.target.value)
        });
    };

    onSegmentLabelFontStyleChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelFontStyle', evt.target.value)
        });
    };

    onSegmentLabelColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelColor', evt.target.value)
        });
    };

    onSegmentLabelHaloColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelHaloColor', evt.target.value)
        });
    };

    onSegmentLabelHaloSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('segmentLabelHaloSize', value)
        });
    };

    onShowLiveLabelsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showLiveLabels', evt.target.checked)
        });
    };

    onLiveLabelFontSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('liveLabelFontSize', value)
        });
    };

    onAutoLabelMeasurementsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('autoLabelMeasurements', evt.target.checked)
        });
    };

    onDecimalPrecisionChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('decimalPrecision', value)
        });
    };

    onPointSizeChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('pointSize', value)
        });
    };

    onPointColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('pointColor', evt.target.value)
        });
    };

    onPointOutlineWidthChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('pointOutlineWidth', value)
        });
    };

    onPointOutlineColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('pointOutlineColor', evt.target.value)
        });
    };

    onOutlineWidthChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('outlineWidth', value)
        });
    };

    onOutlineColorChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('outlineColor', evt.target.value)
        });
    };

    onFillOpacityChange = (value: number) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('fillOpacity', value / 100)
        });
    };

    onShowWidgetTitleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showWidgetTitle', evt.target.checked)
        });
    };

    onWidgetTitleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('widgetTitle', evt.target.value)
        });
    };

    onShowHintMessageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showHintMessage', evt.target.checked)
        });
    };

    onShowClearAllButtonChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showClearAllButton', evt.target.checked)
        });
    };

    onShowPrintReadyButtonChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showPrintReadyButton', evt.target.checked)
        });
    };

    onCompactModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('compactMode', evt.target.checked)
        });
    };

    onButtonLayoutChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('buttonLayout', evt.target.value)
        });
    };

    onShowIconsOnButtonsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('showIconsOnButtons', evt.target.checked)
        });
    };

    onMeasurementsHeaderTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('measurementsHeaderText', evt.target.value)
        });
    };

    onEmptyStateMessageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('emptyStateMessage', evt.target.value)
        });
    };

    onEmptyStateHintChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('emptyStateHint', evt.target.value)
        });
    };

    onClearDialogTitleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('clearDialogTitle', evt.target.value)
        });
    };

    onClearDialogCancelTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('clearDialogCancelText', evt.target.value)
        });
    };

    onClearDialogConfirmTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('clearDialogConfirmText', evt.target.value)
        });
    };

    onDefaultTooltipsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultTooltipsState', evt.target.checked)
        });
    };

    onDefaultSnappingStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultSnappingState', evt.target.checked)
        });
    };

    onDefaultSegmentLabelsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultSegmentLabelsState', evt.target.checked)
        });
    };

    onDefaultStatisticsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultStatisticsState', evt.target.checked)
        });
    };

    onDefaultDisplayOptionsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultDisplayOptionsState', evt.target.checked)
        });
    };

    onDefaultUnitsStateChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onSettingChange({
            id: this.props.id,
            config: this.props.config.set('defaultUnitsState', evt.target.checked)
        });
    };


    // ==================== Custom Unit Management ====================

    onAddCustomLinearUnit = () => {
        const config = this.props.config;
        const currentUnits = config.customLinearUnits ? [...config.customLinearUnits] : [];
        const newUnit: CustomLinearUnit = {
            name: '',
            label: '',
            toMeters: 1,
            addToDropdown: true
        };
        this.setState({
            editingLinearUnit: newUnit,
            editingLinearUnitIndex: currentUnits.length
        });
    };

    onSaveCustomLinearUnit = () => {
        const { editingLinearUnit, editingLinearUnitIndex } = this.state;
        if (!editingLinearUnit || !editingLinearUnit.name || !editingLinearUnit.label || !editingLinearUnit.toMeters) {
            return;
        }
        // Sanitize name to be a valid key
        const sanitizedName = editingLinearUnit.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const unit = { ...editingLinearUnit, name: sanitizedName };

        const config = this.props.config;
        const currentUnits = config.customLinearUnits ? [...config.customLinearUnits] : [];

        if (editingLinearUnitIndex >= 0 && editingLinearUnitIndex < currentUnits.length) {
            currentUnits[editingLinearUnitIndex] = unit;
        } else {
            currentUnits.push(unit);
        }

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('customLinearUnits', currentUnits)
        });
        this.setState({ editingLinearUnit: null, editingLinearUnitIndex: -1 });
    };

    onRemoveCustomLinearUnit = (index: number) => {
        const config = this.props.config;
        const currentUnits = config.customLinearUnits ? [...config.customLinearUnits] : [];
        currentUnits.splice(index, 1);
        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('customLinearUnits', currentUnits)
        });
    };

    onToggleLinearUnitDropdown = (index: number) => {
        const config = this.props.config;
        const currentUnits = config.customLinearUnits ? [...config.customLinearUnits] : [];
        if (currentUnits[index]) {
            currentUnits[index] = { ...currentUnits[index], addToDropdown: !currentUnits[index].addToDropdown };
            this.props.onSettingChange({
                id: this.props.id,
                config: config.set('customLinearUnits', currentUnits)
            });
        }
    };

    onAddCustomAreaUnit = () => {
        const config = this.props.config;
        const currentUnits = config.customAreaUnits ? [...config.customAreaUnits] : [];
        const newUnit: CustomAreaUnit = {
            name: '',
            label: '',
            toSquareMeters: 1,
            addToDropdown: true
        };
        this.setState({
            editingAreaUnit: newUnit,
            editingAreaUnitIndex: currentUnits.length
        });
    };

    onSaveCustomAreaUnit = () => {
        const { editingAreaUnit, editingAreaUnitIndex } = this.state;
        if (!editingAreaUnit || !editingAreaUnit.name || !editingAreaUnit.label || !editingAreaUnit.toSquareMeters) {
            return;
        }
        const sanitizedName = editingAreaUnit.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const unit = { ...editingAreaUnit, name: sanitizedName };

        const config = this.props.config;
        const currentUnits = config.customAreaUnits ? [...config.customAreaUnits] : [];

        if (editingAreaUnitIndex >= 0 && editingAreaUnitIndex < currentUnits.length) {
            currentUnits[editingAreaUnitIndex] = unit;
        } else {
            currentUnits.push(unit);
        }

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('customAreaUnits', currentUnits)
        });
        this.setState({ editingAreaUnit: null, editingAreaUnitIndex: -1 });
    };

    onRemoveCustomAreaUnit = (index: number) => {
        const config = this.props.config;
        const currentUnits = config.customAreaUnits ? [...config.customAreaUnits] : [];
        currentUnits.splice(index, 1);
        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('customAreaUnits', currentUnits)
        });
    };

    onToggleAreaUnitDropdown = (index: number) => {
        const config = this.props.config;
        const currentUnits = config.customAreaUnits ? [...config.customAreaUnits] : [];
        if (currentUnits[index]) {
            currentUnits[index] = { ...currentUnits[index], addToDropdown: !currentUnits[index].addToDropdown };
            this.props.onSettingChange({
                id: this.props.id,
                config: config.set('customAreaUnits', currentUnits)
            });
        }
    };

    // ==================== End Custom Unit Management ====================


    // ==================== XML Import/Export ====================

    escapeXml = (str: string): string => {
        if (typeof str !== 'string') return String(str || '');
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    valueToXml = (key: string, value: any, indent: string = ''): string => {
        if (value === null || value === undefined) {
            return `${indent}<${key} />\n`;
        }

        if (Array.isArray(value) || (value && typeof value.asMutable === 'function')) {
            const arr = typeof value.asMutable === 'function' ? value.asMutable({ deep: true }) : value;
            if (arr.length === 0) {
                return `${indent}<${key}></${key}>\n`;
            }
            let xml = `${indent}<${key}>\n`;
            arr.forEach((item: any) => {
                xml += this.valueToXml('item', item, indent + '  ');
            });
            xml += `${indent}</${key}>\n`;
            return xml;
        }

        if (typeof value === 'object') {
            const obj = typeof value.asMutable === 'function' ? value.asMutable({ deep: true }) : value;
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return `${indent}<${key}></${key}>\n`;
            }
            let xml = `${indent}<${key}>\n`;
            keys.forEach((k: string) => {
                xml += this.valueToXml(k, obj[k], indent + '  ');
            });
            xml += `${indent}</${key}>\n`;
            return xml;
        }

        if (typeof value === 'boolean') {
            return `${indent}<${key}>${value ? 'true' : 'false'}</${key}>\n`;
        }

        if (typeof value === 'number') {
            return `${indent}<${key}>${value}</${key}>\n`;
        }

        return `${indent}<${key}>${this.escapeXml(String(value))}</${key}>\n`;
    };

    parseXmlElement = (element: Element, parentKey?: string): any => {
        const children = Array.from(element.children);
        const tagName = element.tagName;

        // Keys that must always remain strings
        const stringOnlyKeys = new Set([
            'name', 'label', 'value', 'defaultLinearUnit', 'defaultAreaUnit',
            'defaultTool', 'coordinateFormat', 'defaultExportFormat',
            'buttonLayout', 'labelPosition', 'fontFamily', 'fontWeight', 'fontStyle',
            'widgetTitle', 'measurementsHeaderText', 'emptyStateMessage', 'emptyStateHint',
            'clearDialogTitle', 'clearDialogCancelText', 'clearDialogConfirmText',
            'pointButtonText', 'lineButtonText', 'areaButtonText',
            'circleButtonText', 'rectangleButtonText', 'triangleButtonText',
            'freehandLineButtonText', 'freehandAreaButtonText', 'clearAllButtonText',
            'exportButtonText', 'importButtonText', 'segmentLabelPrefix',
            'statisticsToggleText', 'segmentLabelsToggleText', 'tooltipToggleText',
            'snappingToggleText', 'undoButtonText', 'redoButtonText',
            'printReadyToggleText', 'mainLabelFontFamily', 'mainLabelFontWeight',
            'mainLabelFontStyle', 'segmentLabelFontFamily', 'segmentLabelFontWeight',
            'segmentLabelFontStyle'
        ]);

        // No children - return text content
        if (children.length === 0) {
            const text = element.textContent?.trim() || '';
            if (text === '') return null;

            if (stringOnlyKeys.has(tagName)) return text;
            if (tagName === 'item' && parentKey && (parentKey === 'colorPalette')) return text;

            if (text === 'true') return true;
            if (text === 'false') return false;
            if (/^-?\d+(\.\d+)?$/.test(text)) return parseFloat(text);
            return text;
        }

        // Check if all children are 'item' elements (array)
        const allItems = children.every(child => child.tagName === 'item');
        if (allItems && children.length > 0) {
            return children.map(child => this.parseXmlElement(child, tagName));
        }

        // Object with named properties
        const obj: any = {};
        children.forEach(child => {
            const key = child.tagName;
            obj[key] = this.parseXmlElement(child, key);
        });
        return obj;
    };

    setImportExportStatusMessage = (type: 'success' | 'error', message: string, duration: number = 5000) => {
        if (this.importExportStatusTimer) {
            clearTimeout(this.importExportStatusTimer);
        }
        this.setState({ importExportStatus: { type, message } });
        this.importExportStatusTimer = setTimeout(() => {
            this.setState({ importExportStatus: null });
        }, duration);
    };

    /**
     * Build the full XML string for the current config without triggering a download.
     * Used by both the file download flow and the textarea preview flow.
     */
    buildExportXml = (): string => {
        const config = this.props.config;
        const configToExport: any = {};
        const configObj = typeof (config as any).asMutable === 'function'
            ? (config as any).asMutable({ deep: true })
            : { ...config };

        // Don't export environment-specific keys that shouldn't transfer across Experiences
        const skipKeys = new Set(['useMapWidgetIds']);
        Object.keys(configObj).forEach((key: string) => {
            if (!skipKeys.has(key)) configToExport[key] = configObj[key];
        });

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<!-- Enhanced Measurement Widget Settings -->\n';
        xml += `<!-- Exported: ${new Date().toISOString()} -->\n`;
        xml += '<WidgetSettings version="3.3">\n';
        Object.keys(configToExport).forEach((key: string) => {
            xml += this.valueToXml(key, configToExport[key], '  ');
        });
        xml += '</WidgetSettings>\n';
        return xml;
    };

    /** Apply a parsed config object (preserving useMapWidgetIds), used by both file and paste import. */
    applyImportedSettings = (importedSettings: any): { success: boolean; details: string[]; error?: string } => {
        if (!importedSettings || typeof importedSettings !== 'object' || Array.isArray(importedSettings)) {
            return { success: false, details: [], error: 'Imported XML did not contain a configuration object.' };
        }

        // Preserve useMapWidgetIds binding for this Experience
        const currentMapWidgetIds = (this.props.config as any)?.useMapWidgetIds;
        if (currentMapWidgetIds !== undefined) {
            importedSettings.useMapWidgetIds = typeof currentMapWidgetIds.asMutable === 'function'
                ? currentMapWidgetIds.asMutable()
                : (Array.isArray(currentMapWidgetIds) ? [...currentMapWidgetIds] : currentMapWidgetIds);
        }

        let newConfig = this.props.config;
        Object.keys(importedSettings).forEach((key: string) => {
            newConfig = newConfig.set(key, importedSettings[key]);
        });

        try {
            this.props.onSettingChange({ id: this.props.id, config: newConfig });
        } catch (err: any) {
            return { success: false, details: [], error: __tc(err?.message, "failedToApplyImportedConfiguration") };
        }

        const details: string[] = [];
        if (importedSettings.customLinearUnits?.length) details.push(`${importedSettings.customLinearUnits.length} custom linear units`);
        if (importedSettings.customAreaUnits?.length) details.push(`${importedSettings.customAreaUnits.length} custom area units`);
        if (importedSettings.colorPalette?.length) details.push('color palette');
        if (importedSettings.defaultLinearUnit) details.push(`linear: ${importedSettings.defaultLinearUnit}`);
        if (importedSettings.defaultAreaUnit) details.push(`area: ${importedSettings.defaultAreaUnit}`);
        return { success: true, details };
    };

    /** Generate XML and show it in the export textarea (no download). */
    onGenerateExportPreview = () => {
        try {
            const xml = this.buildExportXml();
            this.setState({ exportXmlPreview: xml });
        } catch (error) {
            console.error('Error generating export XML:', error);
            this.setImportExportStatusMessage('error', 'Failed to generate XML.');
        }
    };

    /** Copy the generated XML to the clipboard (generates fresh if none cached). */
    onCopyExportXml = async () => {
        try {
            const xml = this.state.exportXmlPreview || this.buildExportXml();
            if (!this.state.exportXmlPreview) this.setState({ exportXmlPreview: xml });
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(xml);
                this.setImportExportStatusMessage('success', 'Copied to clipboard.', 2500);
            } else {
                this.setImportExportStatusMessage('error', 'Clipboard API unavailable in this browser.');
            }
        } catch (error) {
            this.setImportExportStatusMessage('error', 'Failed to copy to clipboard.');
        }
    };

    /** Apply pasted XML from the import textarea. */
    onApplyImportPaste = () => {
        const text = (this.state.importXmlPaste || '').trim();
        if (!text) {
            this.setImportExportStatusMessage('error', 'Paste XML or use Load File first.');
            return;
        }
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'application/xml');
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) throw new Error('Invalid XML — the document is not well-formed.');

            const root = xmlDoc.documentElement;
            if (!root || root.tagName !== 'WidgetSettings') {
                throw new Error(`Expected root element <WidgetSettings>, got <${root?.tagName || 'unknown'}>.`);
            }

            const importedSettings: any = {};
            Array.from(root.children).forEach(child => {
                importedSettings[child.tagName] = this.parseXmlElement(child, child.tagName);
            });

            const result = this.applyImportedSettings(importedSettings);
            if (!result.success) {
                this.setImportExportStatusMessage('error', result.error || 'Import failed.');
                return;
            }

            const detailsText = result.details.length ? ` (${result.details.join(', ')})` : '';
            this.setImportExportStatusMessage('success', `Settings imported${detailsText}.`);
            this.setState({ importXmlPaste: '' });
        } catch (err: any) {
            this.setImportExportStatusMessage('error', __tc(err?.message, "failedToParseXml"));
        }
    };

    /** Clear the import paste textarea. */
    onClearImportPaste = () => {
        this.setState({ importXmlPaste: '' });
    };

    onExportSettingsToXml = () => {
        try {
            const xml = this.buildExportXml();

            // Download
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            a.download = `enhanced-measurement-settings-${ts}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.setImportExportStatusMessage('success', 'Settings exported.', 3000);
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.setImportExportStatusMessage('error', 'Failed to export settings.');
        }
    };

    onImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input to allow importing the same file again
        event.target.value = '';

        if (!file.name.endsWith('.xml')) {
            this.setImportExportStatusMessage('error', 'Please select an XML file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlText = e.target?.result as string;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

                const parseError = xmlDoc.querySelector('parsererror');
                if (parseError) {
                    throw new Error('Invalid XML file format');
                }

                const root = xmlDoc.documentElement;
                if (root.tagName !== 'WidgetSettings') {
                    throw new Error('Invalid settings file — missing WidgetSettings root element');
                }

                const version = root.getAttribute('version') || '1.0';
                console.log(`Importing enhanced-measurement settings from version ${version}`);

                // Parse all settings
                const importedSettings: any = {};
                let importedCount = 0;

                Array.from(root.children).forEach(child => {
                    const key = child.tagName;
                    importedSettings[key] = this.parseXmlElement(child, key);
                    importedCount++;
                });

                console.log(`Parsed ${importedCount} settings:`, Object.keys(importedSettings));

                // Apply imported settings
                let newConfig = this.props.config;
                Object.keys(importedSettings).forEach((key: string) => {
                    newConfig = newConfig.set(key, importedSettings[key]);
                });

                this.props.onSettingChange({
                    id: this.props.id,
                    config: newConfig
                });

                // Build detail message
                const details: string[] = [];
                if (importedSettings.customLinearUnits?.length) {
                    details.push(`${importedSettings.customLinearUnits.length} custom linear units`);
                }
                if (importedSettings.customAreaUnits?.length) {
                    details.push(`${importedSettings.customAreaUnits.length} custom area units`);
                }
                if (importedSettings.colorPalette?.length) {
                    details.push('color palette');
                }
                if (importedSettings.defaultLinearUnit) details.push(`linear: ${importedSettings.defaultLinearUnit}`);
                if (importedSettings.defaultAreaUnit) details.push(`area: ${importedSettings.defaultAreaUnit}`);
                const boolSettings = [
                    'enableCircleTool', 'enableRectangleTool', 'enableTriangleTool',
                    'enableFreehandPolylineTool', 'enableFreehandPolygonTool',
                    'enableStorage', 'persistMeasurements', 'compactMode',
                    'enableSegmentLabeling', 'showSegmentLabels'
                ];
                const enabledCount = boolSettings.filter(k => importedSettings[k] !== undefined).length;
                if (enabledCount > 0) details.push(`${enabledCount} tool/feature toggles`);

                const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
                this.setImportExportStatusMessage(
                    'success',
                    `Settings imported successfully from v${version}!${detailStr}`
                );

            } catch (error) {
                console.error('Error importing settings:', error);
                this.setImportExportStatusMessage(
                    'error',
                    `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        };

        reader.onerror = () => {
            this.setImportExportStatusMessage('error', 'Failed to read file.');
        };

        reader.readAsText(file);
    };

    // ==================== End XML Import/Export ====================

    onResetToDefaults = () => {
        if (confirm(__t("uiAreYouSureYouWantTo"))) {
            this.props.onSettingChange({
                id: this.props.id,
                config: Immutable({})
            });
        }
    };

    render() {
    __setIntl((this.props as any).intl)
    __i18nIntl = (this.props as any).intl
        const config = this.props.config || Immutable({});

        return (
            <div className="widget-setting-measurement" css={this.getStyles()} style={{ padding: '20px' }}>
                <SettingSection title={__t("uiSettingsImportExport")}>
                    <SettingRow flow="wrap" label="">
                        <div style={{ width: '100%' }}>
                            <p className="ie-section-description">
                                {__t("uiExportOrImportWidgetConfigurationAs")}
                            </p>

                            {/* ── Export ─────────────────────────────────────────────── */}
                            <div className="ie-subsection-label">{__t("uiExport")}</div>
                            <div className="ie-button-row">
                                <button
                                    className="ie-btn ie-btn-primary"
                                    onClick={this.onExportSettingsToXml}
                                    aria-label={__t("uiDownloadSettingsAsXmlFile")}
                                    title={__t("uiDownloadAnXmlFile")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M8 1a.5.5 0 0 1 .5.5v9.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 11.293V1.5A.5.5 0 0 1 8 1z" />
                                        <path d="M2 13.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                    {__t("uiDownload")}
                                </button>
                                <button
                                    className="ie-btn"
                                    onClick={this.onGenerateExportPreview}
                                    aria-label={__t("uiShowXmlInTextareaBelow")}
                                    title={__t("uiPreviewTheXml")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.134 13.134 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                    </svg>
                                    {__t("uiPreview")}
                                </button>
                                {this.state.exportXmlPreview && (
                                    <button
                                        className="ie-btn"
                                        onClick={this.onCopyExportXml}
                                        aria-label={__t("uiCopyXmlToClipboard")}
                                        title={__t("uiCopyToClipboard")}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg>
                                        {__t("uiCopy")}
                                    </button>
                                )}
                                {this.state.exportXmlPreview && (
                                    <button
                                        className="ie-btn ie-btn-tertiary"
                                        onClick={() => this.setState({ exportXmlPreview: '' })}
                                        aria-label={__t("uiClearPreview")}
                                        title={__t("uiClearPreview")}
                                    >
                                        {__t("uiClear")}
                                    </button>
                                )}
                            </div>

                            {this.state.exportXmlPreview && (
                                <textarea
                                    value={this.state.exportXmlPreview}
                                    readOnly
                                    spellCheck={false}
                                    className="ie-textarea"
                                    aria-label={__t("uiGeneratedXml")}
                                />
                            )}

                            {/* ── Import ─────────────────────────────────────────────── */}
                            <div className="ie-subsection-label" style={{ marginTop: '14px' }}>{__t("uiImport")}</div>
                            <div className="ie-button-row">
                                <button
                                    className="ie-btn"
                                    onClick={() => this.importInputRef?.click()}
                                    aria-label={__t("uiLoadXmlFromFile")}
                                    title={__t("uiReadAnXmlFileFromDisk")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M8 15a.5.5 0 0 1-.5-.5V4.707L4.854 7.354a.5.5 0 1 1-.708-.708l3.5-3.5a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1-.708.708L8.5 4.707V14.5a.5.5 0 0 1-.5.5z" />
                                        <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                    {__t("uiLoad")}
                                </button>
                                <button
                                    className="ie-btn ie-btn-primary"
                                    onClick={this.onApplyImportPaste}
                                    disabled={!this.state.importXmlPaste.trim()}
                                    aria-label={__t("uiApplyPastedXmlConfiguration")}
                                    title={__t("uiParseAndApplyTheXmlBelow")}
                                >
                                    {__t("uiApply")}
                                </button>
                                {this.state.importXmlPaste && (
                                    <button
                                        className="ie-btn ie-btn-tertiary"
                                        onClick={this.onClearImportPaste}
                                        aria-label={__t("uiClearPasteArea")}
                                        title={__t("uiClear")}
                                    >
                                        {__t("uiClear")}
                                    </button>
                                )}
                                <input
                                    ref={(el) => { this.importInputRef = el; }}
                                    type="file"
                                    accept=".xml,application/xml,text/xml"
                                    onChange={this.onImportSettings}
                                    style={{ display: 'none' }}
                                    aria-hidden="true"
                                />
                            </div>
                            <textarea
                                value={this.state.importXmlPaste}
                                onChange={(e) => this.setState({ importXmlPaste: e.target.value })}
                                placeholder={__t("uiPasteExportedXmlHereOrUse")}
                                spellCheck={false}
                                className="ie-textarea"
                                aria-label={__t("uiPasteXmlToImport")}
                            />

                            {this.state.importExportStatus && (
                                <div className={`ie-status ${this.state.importExportStatus.type === 'success' ? 'ie-status-success' : 'ie-status-error'}`}>
                                    {this.state.importExportStatus.type === 'success' ? '✓' : '✕'} {this.state.importExportStatus.message}
                                </div>
                            )}

                            <div className="ie-info-panel">
                                <strong>{__t("uiExportedSettingsInclude")}</strong> {__t("uiDefaultUnitsCustomUnitsLinearArea")}
                                <br /><br />
                                <strong>{__t("uiNotExported")}</strong> {__t("uiMapWidgetConnectionItStaysBound")}
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>

                <SettingSection>
                    <SettingRow flow="wrap" label={__t("uiSelectMapWidget")}>
                        <MapWidgetSelector
                            onSelect={this.onMapWidgetSelected}
                            useMapWidgetIds={this.props.useMapWidgetIds}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiToolEnablement")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiEnableOrDisableIndividualMeasurementTools")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnablePointTool")}>
                        <Switch
                            checked={config.enablePointTool !== false}
                            onChange={this.onEnablePointToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableDistanceToolLine")}>
                        <Switch
                            checked={config.enableDistanceTool !== false}
                            onChange={this.onEnableDistanceToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableFreehandPolylineTool")}>
                        <Switch
                            checked={config.enableFreehandPolylineTool !== false}
                            onChange={this.onEnableFreehandPolylineToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableAreaToolPolygon")}>
                        <Switch
                            checked={config.enableAreaTool !== false}
                            onChange={this.onEnableAreaToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableFreehandPolygonTool")}>
                        <Switch
                            checked={config.enableFreehandPolygonTool !== false}
                            onChange={this.onEnableFreehandPolygonToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableRectangleTool")}>
                        <Switch
                            checked={config.enableRectangleTool !== false}
                            onChange={this.onEnableRectangleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableCircleTool")}>
                        <Switch
                            checked={config.enableCircleTool !== false}
                            onChange={this.onEnableCircleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableTriangleTool")}>
                        <Switch
                            checked={config.enableTriangleTool !== false}
                            onChange={this.onEnableTriangleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultTool")}>
                        <Select
                            value={config.defaultTool || 'none'}
                            onChange={this.onDefaultToolChange}
                            style={{ width: '100%' }}
                        >
                            {this.defaultToolOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiAutoStartDefaultTool")}>
                        <Switch
                            checked={config.autoStartTool === true}
                            onChange={this.onAutoStartToolChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiToolButtonCustomization")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiCustomizeTheTextDisplayedOnEach")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPointButtonText")}>
                        <TextInput
                            value={__tc(config.pointButtonText, "uiPoint")}
                            onChange={this.onPointButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiPoint")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiLineButtonText")}>
                        <TextInput
                            value={__tc(config.lineButtonText, "uiLine")}
                            onChange={this.onLineButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiLine")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFreehandLineButtonText")}>
                        <TextInput
                            value={__tc(config.freehandLineButtonText, "uiFreehandLine")}
                            onChange={this.onFreehandLineButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiFreehandLine")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiAreaButtonText")}>
                        <TextInput
                            value={__tc(config.areaButtonText, "uiArea")}
                            onChange={this.onAreaButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiArea")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFreehandAreaButtonText")}>
                        <TextInput
                            value={__tc(config.freehandAreaButtonText, "uiFreehandArea")}
                            onChange={this.onFreehandAreaButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiFreehandArea")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiRectangleButtonText")}>
                        <TextInput
                            value={__tc(config.rectangleButtonText, "uiRectangle")}
                            onChange={this.onRectangleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiRectangle")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiCircleButtonText")}>
                        <TextInput
                            value={__tc(config.circleButtonText, "uiCircle")}
                            onChange={this.onCircleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiCircle")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiTriangleButtonText")}>
                        <TextInput
                            value={__tc(config.triangleButtonText, "uiTriangle")}
                            onChange={this.onTriangleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiTriangle")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiClearAllButtonText")}>
                        <TextInput
                            value={__tc(config.clearAllButtonText, "uiClearAll")}
                            onChange={this.onClearAllButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiClearAll")}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiDefaultUnits")}>
                    <SettingRow flow="wrap" label={__t("uiDefaultLinearUnit")}>
                        <Select
                            value={config.defaultLinearUnit || 'miles'}
                            onChange={this.onLinearUnitChange}
                            style={{ width: '100%' }}
                        >
                            {this.linearUnitOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                            {(config.customLinearUnits || []).filter((u: any) => u.addToDropdown).map((u: any) => (
                                <option key={u.name} value={u.name}>{u.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultAreaUnit")}>
                        <Select
                            value={config.defaultAreaUnit || 'acres'}
                            onChange={this.onAreaUnitChange}
                            style={{ width: '100%' }}
                        >
                            {this.areaUnitOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                            {(config.customAreaUnits || []).filter((u: any) => u.addToDropdown).map((u: any) => (
                                <option key={u.name} value={u.name}>{u.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDecimalPrecision")}>
                        <NumericInput
                            value={config.decimalPrecision ?? 2}
                            onChange={this.onDecimalPrecisionChange}
                            min={0}
                            max={6}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiCustomUnits")}>
                    <SettingRow flow="wrap" label="">
                        <div style={{ width: '100%' }}>
                            <p className="custom-unit-description">
                                {__t("uiDefineCustomLinearAndAreaUnits")}
                            </p>

                            {/* ===== Custom Linear Units ===== */}
                            <div className="custom-unit-header">
                                <span className="custom-unit-header-label">{__t("uiCustomLinearUnits")}</span>
                                <Button size="sm" type="primary" onClick={this.onAddCustomLinearUnit}>
                                    {__t("uiAddUnit")}
                                </Button>
                            </div>

                            {(config.customLinearUnits || []).map((unit, index) => (
                                <div key={index} className="custom-unit-card">
                                    <div className="custom-unit-card-content">
                                        <div className="custom-unit-card-info">
                                            <div className="custom-unit-card-name">{unit.label || unit.name}</div>
                                            <div className="custom-unit-card-detail">
                                                {unit.name} &mdash; 1 {unit.label} = {unit.toMeters} {__t("uiMeters")}
                                            </div>
                                        </div>
                                        <div className="custom-unit-card-actions">
                                            <Checkbox
                                                checked={unit.addToDropdown !== false}
                                                onChange={() => this.onToggleLinearUnitDropdown(index)}
                                                aria-label={__t("uiShowInDropdown", { label: unit.label })}
                                                title={__t("uiShowInDropdown2")}
                                            />
                                            <Button size="sm" onClick={() => this.setState({
                                                editingLinearUnit: { ...unit },
                                                editingLinearUnitIndex: index
                                            })}>
                                                {__t("uiEdit")}
                                            </Button>
                                            <Button size="sm" type="danger" onClick={() => this.onRemoveCustomLinearUnit(index)}>
                                                &times;
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {this.state.editingLinearUnit && (
                                <div className="custom-unit-edit-form">
                                    <div className="custom-unit-edit-title">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" />
                                        </svg>
                                        {this.state.editingLinearUnitIndex < (config.customLinearUnits || []).length ? __t("uiEdit") : __t("new")} {__t("uiLinearUnit")}
                                    </div>
                                    <div className="custom-unit-field-group">
                                        <div>
                                            <Label className="custom-unit-field-label">{__t("uiUnitKeyEGChains")}</Label>
                                            <TextInput
                                                value={this.state.editingLinearUnit.name}
                                                onChange={(e) => this.setState({
                                                    editingLinearUnit: { ...this.state.editingLinearUnit, name: e.target.value }
                                                })}
                                                placeholder="chains"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <Label className="custom-unit-field-label">{__t("uiDisplayLabelEGChains")}</Label>
                                            <TextInput
                                                value={this.state.editingLinearUnit.label}
                                                onChange={(e) => this.setState({
                                                    editingLinearUnit: { ...this.state.editingLinearUnit, label: e.target.value }
                                                })}
                                                placeholder={__t("uiChains")}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <Label className="custom-unit-field-label">{__t("uiMetersPerUnitEG1")}</Label>
                                            <NumericInput
                                                value={this.state.editingLinearUnit.toMeters}
                                                onChange={(val) => this.setState({
                                                    editingLinearUnit: { ...this.state.editingLinearUnit, toMeters: val }
                                                })}
                                                min={0.000001}
                                                step={0.0001}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <Checkbox
                                                checked={this.state.editingLinearUnit.addToDropdown !== false}
                                                onChange={(e) => this.setState({
                                                    editingLinearUnit: { ...this.state.editingLinearUnit, addToDropdown: (e.target as HTMLInputElement).checked }
                                                })}
                                            />
                                            <Label className="custom-unit-field-label" style={{ display: 'inline', marginLeft: '6px' }}>
                                                {__t("uiAddToLinearUnitDropdown")}
                                            </Label>
                                        </div>
                                        <div className="custom-unit-edit-actions">
                                            <Button
                                                size="sm"
                                                type="primary"
                                                onClick={this.onSaveCustomLinearUnit}
                                                disabled={!this.state.editingLinearUnit.name || !this.state.editingLinearUnit.label}
                                            >
                                                {__t("uiSave")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => this.setState({ editingLinearUnit: null, editingLinearUnitIndex: -1 })}
                                            >
                                                {__t("uiCancel")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== Custom Area Units ===== */}
                            <div className="section-spacer">
                                <div className="custom-unit-header">
                                    <span className="custom-unit-header-label">{__t("uiCustomAreaUnits")}</span>
                                    <Button size="sm" type="primary" onClick={this.onAddCustomAreaUnit}>
                                        {__t("uiAddUnit")}
                                    </Button>
                                </div>

                                {(config.customAreaUnits || []).map((unit, index) => (
                                    <div key={index} className="custom-unit-card">
                                        <div className="custom-unit-card-content">
                                            <div className="custom-unit-card-info">
                                                <div className="custom-unit-card-name">{unit.label || unit.name}</div>
                                                <div className="custom-unit-card-detail">
                                                    {unit.name} &mdash; 1 {unit.label} = {unit.toSquareMeters} {__t("uiSqM")}
                                                </div>
                                            </div>
                                            <div className="custom-unit-card-actions">
                                                <Checkbox
                                                    checked={unit.addToDropdown !== false}
                                                    onChange={() => this.onToggleAreaUnitDropdown(index)}
                                                    aria-label={__t("uiShowInDropdown", { label: unit.label })}
                                                    title={__t("uiShowInDropdown2")}
                                                />
                                                <Button size="sm" onClick={() => this.setState({
                                                    editingAreaUnit: { ...unit },
                                                    editingAreaUnitIndex: index
                                                })}>
                                                    {__t("uiEdit")}
                                                </Button>
                                                <Button size="sm" type="danger" onClick={() => this.onRemoveCustomAreaUnit(index)}>
                                                    &times;
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {this.state.editingAreaUnit && (
                                    <div className="custom-unit-edit-form">
                                        <div className="custom-unit-edit-title">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10z" />
                                            </svg>
                                            {this.state.editingAreaUnitIndex < (config.customAreaUnits || []).length ? __t("uiEdit") : __t("new")} {__t("uiAreaUnit")}
                                        </div>
                                        <div className="custom-unit-field-group">
                                            <div>
                                                <Label className="custom-unit-field-label">{__t("uiUnitKeyEGSquareChains")}</Label>
                                                <TextInput
                                                    value={this.state.editingAreaUnit.name}
                                                    onChange={(e) => this.setState({
                                                        editingAreaUnit: { ...this.state.editingAreaUnit, name: e.target.value }
                                                    })}
                                                    placeholder="square-chains"
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="custom-unit-field-label">{__t("uiDisplayLabelEGSquareChains")}</Label>
                                                <TextInput
                                                    value={this.state.editingAreaUnit.label}
                                                    onChange={(e) => this.setState({
                                                        editingAreaUnit: { ...this.state.editingAreaUnit, label: e.target.value }
                                                    })}
                                                    placeholder={__t("uiSquareChains")}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="custom-unit-field-label">{__t("uiSquareMetersPerUnitEG")}</Label>
                                                <NumericInput
                                                    value={this.state.editingAreaUnit.toSquareMeters}
                                                    onChange={(val) => this.setState({
                                                        editingAreaUnit: { ...this.state.editingAreaUnit, toSquareMeters: val }
                                                    })}
                                                    min={0.000001}
                                                    step={0.0001}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div>
                                                <Checkbox
                                                    checked={this.state.editingAreaUnit.addToDropdown !== false}
                                                    onChange={(e) => this.setState({
                                                        editingAreaUnit: { ...this.state.editingAreaUnit, addToDropdown: (e.target as HTMLInputElement).checked }
                                                    })}
                                                />
                                                <Label className="custom-unit-field-label" style={{ display: 'inline', marginLeft: '6px' }}>
                                                    {__t("uiAddToAreaUnitDropdown")}
                                                </Label>
                                            </div>
                                            <div className="custom-unit-edit-actions">
                                                <Button
                                                    size="sm"
                                                    type="primary"
                                                    onClick={this.onSaveCustomAreaUnit}
                                                    disabled={!this.state.editingAreaUnit.name || !this.state.editingAreaUnit.label}
                                                >
                                                    {__t("uiSave")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => this.setState({ editingAreaUnit: null, editingAreaUnitIndex: -1 })}
                                                >
                                                    {__t("uiCancel")}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== Reference ===== */}
                            <div className="custom-unit-reference">
                                <strong>{__t("uiCommonHistoricalUnitsReference")}</strong>
                                <div style={{ marginTop: '6px' }}>
                                    <strong>{__t("uiLinear")}</strong> {__t("uiChain201168mRodPerch5")}
                                </div>
                                <div>
                                    <strong>{__t("uiArea2")}</strong> {__t("uiSqChain4046856SqM")}
                                </div>
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiMeasurementDisplay")}>
                    <SettingRow flow="wrap" label={__t("uiShowLiveMeasurement")}>
                        <Switch
                            checked={config.showLiveMeasurement !== false}
                            onChange={this.onShowLiveMeasurementChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiAutoLabelMeasurements")}>
                        <Switch
                            checked={config.autoLabelMeasurements !== false}
                            onChange={this.onAutoLabelMeasurementsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowCoordinates")}>
                        <Switch
                            checked={config.showCoordinates !== false}
                            onChange={this.onShowCoordinatesChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiCoordinateFormat")}>
                        <Select
                            value={config.coordinateFormat || 'decimal'}
                            onChange={this.onCoordinateFormatChange}
                            style={{ width: '100%' }}
                        >
                            {this.coordinateFormatOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowTotalDistance")}>
                        <Switch
                            checked={config.showTotalDistance !== false}
                            onChange={this.onShowTotalDistanceChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiContinuousDrawing")}>
                        <Switch
                            checked={config.continuousDrawing === true}
                            onChange={this.onContinuousDrawingChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiAutoClearOnToolSwitch")}>
                        <Switch
                            checked={config.autoClearOnToolSwitch === true}
                            onChange={this.onAutoClearOnToolSwitchChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiUiToggleControlsVisibility")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiControlWhichToggleSwitchesAreVisible")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowSegmentLabelsToggle")}>
                        <Switch
                            checked={config.showSegmentLabelsToggle !== false}
                            onChange={this.onShowSegmentLabelsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowOffsetLabelsToggle")}>
                        <Switch
                            checked={config.showOffsetLabelsToggle !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('showOffsetLabelsToggle', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowTooltipsToggle")}>
                        <Switch
                            checked={config.showTooltipsToggle !== false}
                            onChange={this.onShowTooltipsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowSnappingToggle")}>
                        <Switch
                            checked={config.showSnappingToggle !== false}
                            onChange={this.onShowSnappingToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowStatisticsPanelToggle")}>
                        <Switch
                            checked={config.showStatisticsToggle !== false}
                            onChange={this.onShowStatisticsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowUnitSelector")}>
                        <Switch
                            checked={config.showUnitToggle !== false}
                            onChange={this.onShowUnitToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowCoordinateModeSelector")}>
                        <Switch
                            checked={config.showCoordinateModeToggle !== false}
                            onChange={this.onShowCoordinateModeToggleChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiToggleTextCustomization")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiCustomizeTheLabelTextForToggle")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSegmentLabelsToggleText")}>
                        <TextInput
                            value={__tc(config.segmentLabelText, "uiShowSegmentLabels")}
                            onChange={this.onSegmentLabelTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiShowSegmentLabels")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiTooltipsToggleText")}>
                        <TextInput
                            value={__tc(config.tooltipsToggleText, "uiShowTooltips")}
                            onChange={this.onTooltipsToggleTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiShowTooltips")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSnappingToggleText")}>
                        <TextInput
                            value={__tc(config.snappingToggleText, "uiEnableSnapping")}
                            onChange={this.onSnappingToggleTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiEnableSnapping")}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiDefaultToggleStates")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiSetTheDefaultStateOnOff")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultSegmentLabelsState")}>
                        <Switch
                            checked={config.defaultSegmentLabelsState !== false}
                            onChange={this.onDefaultSegmentLabelsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultTooltipsState")}>
                        <Switch
                            checked={config.defaultTooltipsState !== false}
                            onChange={this.onDefaultTooltipsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultSnappingState")}>
                        <Switch
                            checked={config.defaultSnappingState === true}
                            onChange={this.onDefaultSnappingStateChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiPowerFeatures")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiAdvancedEndUserFeaturesSessionPersistence")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSessionPersistenceRestoreAfterReload")}>
                        <Switch
                            checked={config.enablePersistence === true}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('enablePersistence', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiLiveMeasurementReadoutWhileDrawing")}>
                        <Switch
                            checked={config.showLiveMeasurement !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('showLiveMeasurement', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiMultiSelectModeBulkDeleteExport")}>
                        <Switch
                            checked={config.enableMultiSelect !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('enableMultiSelect', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSortOptionsInMeasurementList")}>
                        <Switch
                            checked={config.enableSortOptions !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('enableSortOptions', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiHighlightASegmentOnTheMap")}>
                        <Switch
                            checked={config.enableSegmentHighlight !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('enableSegmentHighlight', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDeleteSegmentsFromDrawnLinesAnd")}>
                        <Switch
                            checked={config.enableSegmentDelete !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('enableSegmentDelete', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiDefaultPanelExpansion")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiChooseWhichCollapsiblePanelsStart")} <em>{__t("uiExpanded")}</em> {__t("uiWhenTheWidgetLoadsEndUsers")}
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDisplayOptionsPanelExpanded")}>
                        <Switch
                            checked={config.defaultDisplayOptionsState === true}
                            onChange={this.onDefaultDisplayOptionsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiUnitsCoordinatesPanelExpanded")}>
                        <Switch
                            checked={config.defaultUnitsState === true}
                            onChange={this.onDefaultUnitsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSummaryStatisticsPanelExpanded")}>
                        <Switch
                            checked={config.defaultStatisticsState === true}
                            onChange={this.onDefaultStatisticsStateChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiSegmentLabelStyling")}>
                    <SettingRow flow="wrap" label={__t("uiEnableSegmentLabeling")}>
                        <Switch
                            checked={config.enableSegmentLabeling !== false}
                            onChange={this.onEnableSegmentLabelingChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowSegmentLabelsByDefault")}>
                        <Switch
                            checked={config.showSegmentLabels !== false}
                            onChange={this.onShowSegmentLabelsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiOffsetLabelsOnByDefaultSegment")}>
                        <Switch
                            checked={config.offsetSegmentLabels !== false}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('offsetSegmentLabels', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiAutoSaveSegments")}>
                        <Switch
                            checked={config.autoSaveSegments === true}
                            onChange={this.onAutoSaveSegmentsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiSegmentLabelPrefix")}>
                        <TextInput
                            value={__tc(config.segmentLabelPrefix, "uiSegment")}
                            onChange={this.onSegmentLabelPrefixChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiSegment")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontSize")}>
                        <NumericInput
                            value={config.segmentLabelFontSize || 10}
                            onChange={this.onSegmentLabelFontSizeChange}
                            min={6}
                            max={32}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontFamily")}>
                        <Select
                            value={__tc(config.segmentLabelFontFamily, "arial")}
                            onChange={this.onSegmentLabelFontFamilyChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontFamilyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontWeight")}>
                        <Select
                            value={config.segmentLabelFontWeight || 'normal'}
                            onChange={this.onSegmentLabelFontWeightChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontWeightOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontStyle")}>
                        <Select
                            value={config.segmentLabelFontStyle || 'normal'}
                            onChange={this.onSegmentLabelFontStyleChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontStyleOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiTextColor")}>
                        <input
                            type="color"
                            value={config.segmentLabelColor || '#ffffff'}
                            onChange={this.onSegmentLabelColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiHaloColor")}>
                        <input
                            type="color"
                            value={config.segmentLabelHaloColor || '#000000'}
                            onChange={this.onSegmentLabelHaloColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiHaloSize")}>
                        <NumericInput
                            value={config.segmentLabelHaloSize ?? 1.5}
                            onChange={this.onSegmentLabelHaloSizeChange}
                            min={0}
                            max={10}
                            step={0.5}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiMainLabelStyling")}>
                    <SettingRow flow="wrap" label={__t("uiFontSize")}>
                        <NumericInput
                            value={config.labelFontSize || 12}
                            onChange={this.onLabelFontSizeChange}
                            min={6}
                            max={32}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontFamily")}>
                        <Select
                            value={__tc(config.labelFontFamily, "arial")}
                            onChange={this.onLabelFontFamilyChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontFamilyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontWeight")}>
                        <Select
                            value={config.labelFontWeight || 'bold'}
                            onChange={this.onLabelFontWeightChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontWeightOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFontStyle")}>
                        <Select
                            value={config.labelFontStyle || 'normal'}
                            onChange={this.onLabelFontStyleChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontStyleOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiTextColor")}>
                        <input
                            type="color"
                            value={config.labelColor || '#ffffff'}
                            onChange={this.onLabelColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiHaloColor")}>
                        <input
                            type="color"
                            value={config.labelHaloColor || '#000000'}
                            onChange={this.onLabelHaloColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiHaloSize")}>
                        <NumericInput
                            value={config.labelHaloSize ?? 2}
                            onChange={this.onLabelHaloSizeChange}
                            min={0}
                            max={10}
                            step={0.5}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiLabelPosition")}>
                        <Select
                            value={config.labelPosition || 'center'}
                            onChange={this.onLabelPositionChange}
                            style={{ width: '100%' }}
                        >
                            {this.labelPositionOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowLiveLabels")}>
                        <Switch
                            checked={config.showLiveLabels !== false}
                            onChange={this.onShowLiveLabelsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiLiveLabelFontSize")}>
                        <NumericInput
                            value={config.liveLabelFontSize || 14}
                            onChange={this.onLiveLabelFontSizeChange}
                            min={8}
                            max={32}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Import/Export">
                    <SettingRow flow="wrap" label={__t("uiEnableImportExport")}>
                        <Switch
                            checked={config.enableImportExport !== false}
                            onChange={this.onEnableImportExportChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowExportAllButton")}>
                        <Switch
                            checked={config.showExportButton !== false}
                            onChange={this.onShowExportButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowImportButton")}>
                        <Switch
                            checked={config.showImportButton !== false}
                            onChange={this.onShowImportButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiExportButtonText")}>
                        <TextInput
                            value={__tc(config.exportButtonText, "uiExportAll")}
                            onChange={this.onExportButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiExportAll")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiImportButtonText")}>
                        <TextInput
                            value={__tc(config.importButtonText, "uiImportGeojson")}
                            onChange={this.onImportButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiImportGeojson")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEnableExport")}>
                        <Switch
                            checked={config.enableExport !== false}
                            onChange={this.onEnableExportChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiDefaultExportFormat")}>
                        <Select
                            value={config.defaultExportFormat || 'geojson'}
                            onChange={this.onDefaultExportFormatChange}
                            style={{ width: '100%' }}
                        >
                            {this.exportFormatOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiIncludeTimestampInExport")}>
                        <Switch
                            checked={config.includeTimestampInExport !== false}
                            onChange={this.onIncludeTimestampInExportChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiStoragePersistence")}>
                    <SettingRow flow="wrap" label={__t("uiEnableLocalStorage")}>
                        <Switch
                            checked={config.enableStorage === true}
                            onChange={this.onEnableStorageChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiMaxStoredMeasurements")}>
                        <NumericInput
                            value={config.maxStoredMeasurements || 100}
                            onChange={this.onMaxStoredMeasurementsChange}
                            min={10}
                            max={1000}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPersistMeasurements")}>
                        <Switch
                            checked={config.persistMeasurements === true}
                            onChange={this.onPersistMeasurementsChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Undo/Redo">
                    <SettingRow flow="wrap" label={__t("uiEnableUndoRedo")}>
                        <Switch
                            checked={config.enableUndoRedo !== false}
                            onChange={this.onEnableUndoRedoChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiUndoButtonText")}>
                        <TextInput
                            value={__tc(config.undoButtonText, "uiUndo")}
                            onChange={this.onUndoButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiUndo")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiRedoButtonText")}>
                        <TextInput
                            value={__tc(config.redoButtonText, "uiRedo")}
                            onChange={this.onRedoButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiRedo")}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiColorPalette")}>
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>{__t("uiNote")}</strong> {__t("uiCustomizeThe10ColorsUsedFor")}
                        </div>
                    </SettingRow>

                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => {
                        const defaultColors = [
                            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                            '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
                        ];
                        const palette = config.colorPalette || defaultColors;
                        return (
                            <SettingRow key={index} flow="wrap" label={__t("uiColor", { value: index + 1 })}>
                                <input
                                    type="color"
                                    value={palette[index] || defaultColors[index]}
                                    onChange={(e) => this.onColorPaletteChange(index, e.target.value)}
                                    style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </SettingRow>
                        );
                    })}
                </SettingSection>

                <SettingSection title={__t("uiSymbolStyling")}>
                    <SettingRow flow="wrap" label={__t("uiPointSizePixels")}>
                        <NumericInput
                            value={config.pointSize || 8}
                            onChange={this.onPointSizeChange}
                            min={4}
                            max={20}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPointColor")}>
                        <input
                            type="color"
                            value={config.pointColor || '#3b82f6'}
                            onChange={this.onPointColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPointOutlineWidthPixels")}>
                        <NumericInput
                            value={config.pointOutlineWidth || 2}
                            onChange={this.onPointOutlineWidthChange}
                            min={0}
                            max={10}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPointOutlineColor")}>
                        <input
                            type="color"
                            value={config.pointOutlineColor || '#ffffff'}
                            onChange={this.onPointOutlineColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPolygonOutlineWidthPixels")}>
                        <NumericInput
                            value={config.outlineWidth || 2}
                            onChange={this.onOutlineWidthChange}
                            min={1}
                            max={10}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiPolygonOutlineColor")}>
                        <input
                            type="color"
                            value={config.outlineColor || '#000000'}
                            onChange={this.onOutlineColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiFillOpacity")}>
                        <NumericInput
                            value={Math.round((config.fillOpacity ?? 0.3) * 100)}
                            onChange={this.onFillOpacityChange}
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiUserInterface")}>
                    <SettingRow flow="wrap" label={__t("uiAlwaysShowButtonText")}>
                        <Switch
                            checked={config.alwaysShowButtonText === true}
                            onChange={(evt) => {
                                this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('alwaysShowButtonText', evt.target.checked)
                                });
                            }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowWidgetTitle")}>
                        <Switch
                            checked={config.showWidgetTitle !== false}
                            onChange={this.onShowWidgetTitleChange}
                        />
                    </SettingRow>

                    {config.showWidgetTitle !== false && (
                        <SettingRow flow="wrap" label={__t("uiWidgetTitle")}>
                            <TextInput
                                value={__tc(config.widgetTitle, "uiMeasurementTools")}
                                onChange={this.onWidgetTitleChange}
                                style={{ width: '100%' }}
                                placeholder={__t("uiMeasurementTools")}
                            />
                        </SettingRow>
                    )}

                    <SettingRow flow="wrap" label={__t("uiShowHintMessage")}>
                        <Switch
                            checked={config.showHintMessage !== false}
                            onChange={this.onShowHintMessageChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowClearAllButton")}>
                        <Switch
                            checked={config.showClearAllButton !== false}
                            onChange={this.onShowClearAllButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowPrintReadyButton")}>
                        <Switch
                            checked={config.showPrintReadyButton !== false}
                            onChange={this.onShowPrintReadyButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiCompactMode")}>
                        <Switch
                            checked={config.compactMode === true}
                            onChange={this.onCompactModeChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiButtonLayout")}>
                        <Select
                            value={config.buttonLayout || '4-column'}
                            onChange={this.onButtonLayoutChange}
                            style={{ width: '100%' }}
                        >
                            <option value="2-column">{__t("ui2Columns")}</option>
                            <option value="3-column">{__t("ui3Columns")}</option>
                            <option value="4-column">{__t("ui4Columns")}</option>
                            <option value="vertical">{__t("uiVertical1Column")}</option>
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiShowIconsOnButtons")}>
                        <Switch
                            checked={config.showIconsOnButtons !== false}
                            onChange={this.onShowIconsOnButtonsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiMeasurementsHeaderText")}>
                        <TextInput
                            value={__tc(config.measurementsHeaderText, "uiMeasurements")}
                            onChange={this.onMeasurementsHeaderTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiMeasurements")}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiEmptyStateCustomization")}>
                    <SettingRow flow="wrap" label={__t("uiEmptyStateMessage")}>
                        <TextInput
                            value={__tc(config.emptyStateMessage, "uiNoMeasurementsYet")}
                            onChange={this.onEmptyStateMessageChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiNoMeasurementsYet")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiEmptyStateHint")}>
                        <TextInput
                            value={__tc(config.emptyStateHint, "uiClickAMeasurementToolToBegin")}
                            onChange={this.onEmptyStateHintChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiClickAMeasurementToolToBegin")}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title={__t("uiDialogCustomization")}>
                    <SettingRow flow="wrap" label={__t("uiClearDialogTitle")}>
                        <TextInput
                            value={__tc(config.clearDialogTitle, "uiAreYouSureYouWantTo2")}
                            onChange={this.onClearDialogTitleChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiAreYouSureYouWantTo2")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiClearDialogCancelText")}>
                        <TextInput
                            value={__tc(config.clearDialogCancelText, "uiCancel")}
                            onChange={this.onClearDialogCancelTextChange}
                            style={{ width: '100%' }}
                            placeholder={__t("uiCancel")}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label={__t("uiClearDialogConfirmText")}>
                        <TextInput
                            value={config.clearDialogConfirmText || 'OK'}
                            onChange={this.onClearDialogConfirmTextChange}
                            style={{ width: '100%' }}
                            placeholder="OK"
                        />
                    </SettingRow>
                </SettingSection>


                <SettingSection>
                    <SettingRow>
                        <Button
                            type="danger"
                            onClick={this.onResetToDefaults}
                            style={{ width: '100%' }}
                        >
                            {__t("uiResetAllSettingsToDefaults")}
                        </Button>
                    </SettingRow>
                </SettingSection>

                <SettingSection>
                    <div style={{ padding: '10px', fontSize: '12px', color: '#666', background: '#f8f9fa', borderRadius: '4px' }}>
                        <p style={{ marginTop: 0, fontWeight: 'bold' }}>
                            {__t("uiEnhancedMeasurementWidgetV33Custom")}
                        </p>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>{__t("uiCustomLinearAndAreaUnitsWith")}</li>
                            <li>{__t("uiXmlSettingsImportExportForEasy")}</li>
                            <li>{__t("uiIndividualToolEnablement8MeasurementTools")}</li>
                            <li>{__t("uiCompleteUiCustomizationWithTextOverrides")}</li>
                            <li>{__t("uiPrintReadyLabelsModeForOptimized")}</li>
                            <li>{__t("uiFullControlOverToolVisibilityAnd")}</li>
                            <li>{__t("uiComprehensiveColorPaletteWith10Customizable")}</li>
                            <li>{__t("uiAdvancedLabelStylingAndPositioningWith")}</li>
                            <li>{__t("uiToggleVisibilityControlsForSegmentLabels")}</li>
                            <li>{__t("uiDefaultStateConfigurationForAllToggles")}</li>
                            <li>{__t("uiConfigurableDialogsEmptyStatesAndMeasurement")}</li>
                            <li>{__t("uiCompleteSymbolStylingSizeColorOpacity")}</li>
                            <li>{__t("uiEnhancedSegmentLabelingWithCustomizablePrefix")}</li>
                            <li>{__t("uiFlexibleImportExportWithFormatSelection")}</li>
                            <li>{__t("uiStorageAndPersistenceOptionsWithConfigurable")}</li>
                            <li>{__t("uiUndoRedoSupportWithCustomButton")}</li>
                        </ul>
                    </div>
                </SettingSection>
                <SettingSection title={__t("uiHelp")}>
                  <SettingRow tag='label' label={__t("uiShowHelpGuide")}>
                    <Switch
                      checked={this.props.config?.showHelp !== false}
                      onChange={(evt) => { this.props.onSettingChange({ id: this.props.id, config: (this.props.config as any).set('showHelp', evt.target.checked) }) }}
                      aria-label={__t("uiShowTheQuestionMarkButtonThat")}
                    />
                  </SettingRow>
                </SettingSection>
            </div>
        );
    }
}