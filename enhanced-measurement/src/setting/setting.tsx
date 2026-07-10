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

export default class Setting extends React.PureComponent<AllWidgetSettingProps<any>, SettingState> {

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
        { value: 'meters', label: 'Meters' },
        { value: 'kilometers', label: 'Kilometers' },
        { value: 'feet', label: 'Feet' },
        { value: 'miles', label: 'Miles' },
        { value: 'yards', label: 'Yards' },
        { value: 'nautical-miles', label: 'Nautical Miles' }
    ];

    areaUnitOptions = [
        { value: 'square-meters', label: 'Square Meters' },
        { value: 'square-kilometers', label: 'Square Kilometers' },
        { value: 'square-feet', label: 'Square Feet' },
        { value: 'square-miles', label: 'Square Miles' },
        { value: 'acres', label: 'Acres' },
        { value: 'hectares', label: 'Hectares' }
    ];

    defaultToolOptions = [
        { value: 'none', label: 'None (Manual Selection)' },
        { value: 'point', label: 'Point Measurement' },
        { value: 'distance', label: 'Distance Measurement' },
        { value: 'area', label: 'Area Measurement' },
        { value: 'circle', label: 'Circle Measurement' },
        { value: 'rectangle', label: 'Rectangle Measurement' },
        { value: 'triangle', label: 'Triangle Measurement' },
        { value: 'freehand-polyline', label: 'Freehand Line' },
        { value: 'freehand-polygon', label: 'Freehand Area' }
    ];

    coordinateFormatOptions = [
        { value: 'decimal', label: 'Decimal Degrees (DD)' },
        { value: 'dms', label: 'Degrees Minutes Seconds (DMS)' },
        { value: 'ddm', label: 'Degrees Decimal Minutes (DDM)' }
    ];

    exportFormatOptions = [
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' },
        { value: 'geojson', label: 'GeoJSON' },
        { value: 'pdf', label: 'PDF' }
    ];

    labelPositionOptions = [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' }
    ];

    fontFamilyOptions = [
        { value: 'Arial', label: 'Arial' },
        { value: 'Helvetica', label: 'Helvetica' },
        { value: 'Times New Roman', label: 'Times New Roman' },
        { value: 'Courier New', label: 'Courier New' },
        { value: 'Georgia', label: 'Georgia' },
        { value: 'Verdana', label: 'Verdana' },
        { value: 'Trebuchet MS', label: 'Trebuchet MS' },
        { value: 'Palatino', label: 'Palatino' },
        { value: 'Garamond', label: 'Garamond' },
        { value: 'Comic Sans MS', label: 'Comic Sans MS' },
        { value: 'Tahoma', label: 'Tahoma' },
        { value: 'Impact', label: 'Impact' }
    ];

    fontWeightOptions = [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: 'bolder', label: 'Bolder' },
        { value: 'lighter', label: 'Lighter' }
    ];

    fontStyleOptions = [
        { value: 'normal', label: 'Normal' },
        { value: 'italic', label: 'Italic' },
        { value: 'oblique', label: 'Oblique' }
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
            return { success: false, details: [], error: err?.message || 'Failed to apply imported configuration.' };
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
            this.setImportExportStatusMessage('error', err?.message || 'Failed to parse XML.');
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
        if (confirm('Are you sure you want to reset all settings to their default values?')) {
            this.props.onSettingChange({
                id: this.props.id,
                config: Immutable({})
            });
        }
    };

    render() {
        const config = this.props.config || Immutable({});

        return (
            <div className="widget-setting-measurement" css={this.getStyles()} style={{ padding: '20px' }}>
                <SettingSection title="Settings Import/Export">
                    <SettingRow flow="wrap" label="">
                        <div style={{ width: '100%' }}>
                            <p className="ie-section-description">
                                Export or import widget configuration as XML to quickly replicate settings across Experience Builder applications.
                                The Map Widget connection is not included in exports.
                            </p>

                            {/* ── Export ─────────────────────────────────────────────── */}
                            <div className="ie-subsection-label">EXPORT</div>
                            <div className="ie-button-row">
                                <button
                                    className="ie-btn ie-btn-primary"
                                    onClick={this.onExportSettingsToXml}
                                    aria-label="Download settings as XML file"
                                    title="Download an XML file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M8 1a.5.5 0 0 1 .5.5v9.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 11.293V1.5A.5.5 0 0 1 8 1z" />
                                        <path d="M2 13.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                    Download
                                </button>
                                <button
                                    className="ie-btn"
                                    onClick={this.onGenerateExportPreview}
                                    aria-label="Show XML in textarea below"
                                    title="Preview the XML"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.134 13.134 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                    </svg>
                                    Preview
                                </button>
                                {this.state.exportXmlPreview && (
                                    <button
                                        className="ie-btn"
                                        onClick={this.onCopyExportXml}
                                        aria-label="Copy XML to clipboard"
                                        title="Copy to clipboard"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg>
                                        Copy
                                    </button>
                                )}
                                {this.state.exportXmlPreview && (
                                    <button
                                        className="ie-btn ie-btn-tertiary"
                                        onClick={() => this.setState({ exportXmlPreview: '' })}
                                        aria-label="Clear preview"
                                        title="Clear preview"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {this.state.exportXmlPreview && (
                                <textarea
                                    value={this.state.exportXmlPreview}
                                    readOnly
                                    spellCheck={false}
                                    className="ie-textarea"
                                    aria-label="Generated XML"
                                />
                            )}

                            {/* ── Import ─────────────────────────────────────────────── */}
                            <div className="ie-subsection-label" style={{ marginTop: '14px' }}>IMPORT</div>
                            <div className="ie-button-row">
                                <button
                                    className="ie-btn"
                                    onClick={() => this.importInputRef?.click()}
                                    aria-label="Load XML from file"
                                    title="Read an XML file from disk"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                                        <path d="M8 15a.5.5 0 0 1-.5-.5V4.707L4.854 7.354a.5.5 0 1 1-.708-.708l3.5-3.5a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1-.708.708L8.5 4.707V14.5a.5.5 0 0 1-.5.5z" />
                                        <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                    Load
                                </button>
                                <button
                                    className="ie-btn ie-btn-primary"
                                    onClick={this.onApplyImportPaste}
                                    disabled={!this.state.importXmlPaste.trim()}
                                    aria-label="Apply pasted XML configuration"
                                    title="Parse and apply the XML below"
                                >
                                    Apply
                                </button>
                                {this.state.importXmlPaste && (
                                    <button
                                        className="ie-btn ie-btn-tertiary"
                                        onClick={this.onClearImportPaste}
                                        aria-label="Clear paste area"
                                        title="Clear"
                                    >
                                        Clear
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
                                placeholder="Paste exported XML here, or use Load File above."
                                spellCheck={false}
                                className="ie-textarea"
                                aria-label="Paste XML to import"
                            />

                            {this.state.importExportStatus && (
                                <div className={`ie-status ${this.state.importExportStatus.type === 'success' ? 'ie-status-success' : 'ie-status-error'}`}>
                                    {this.state.importExportStatus.type === 'success' ? '✓' : '✕'} {this.state.importExportStatus.message}
                                </div>
                            )}

                            <div className="ie-info-panel">
                                <strong>Exported settings include:</strong> Default units, custom units (linear &amp; area),
                                tool enablement, button text, measurement display options, label styling,
                                color palette, symbol styling, UI layout, toggle states, storage options,
                                and all other widget configuration.
                                <br /><br />
                                <strong>Not exported:</strong> Map widget connection (it stays bound to this Experience).
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>

                <SettingSection>
                    <SettingRow flow="wrap" label="Select Map Widget">
                        <MapWidgetSelector
                            onSelect={this.onMapWidgetSelected}
                            useMapWidgetIds={this.props.useMapWidgetIds}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Tool Enablement">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Enable or disable individual measurement tools. Disabled tools will not appear in the widget interface.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Point Tool">
                        <Switch
                            checked={config.enablePointTool !== false}
                            onChange={this.onEnablePointToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Distance Tool (Line)">
                        <Switch
                            checked={config.enableDistanceTool !== false}
                            onChange={this.onEnableDistanceToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Freehand Polyline Tool">
                        <Switch
                            checked={config.enableFreehandPolylineTool !== false}
                            onChange={this.onEnableFreehandPolylineToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Area Tool (Polygon)">
                        <Switch
                            checked={config.enableAreaTool !== false}
                            onChange={this.onEnableAreaToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Freehand Polygon Tool">
                        <Switch
                            checked={config.enableFreehandPolygonTool !== false}
                            onChange={this.onEnableFreehandPolygonToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Rectangle Tool">
                        <Switch
                            checked={config.enableRectangleTool !== false}
                            onChange={this.onEnableRectangleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Circle Tool">
                        <Switch
                            checked={config.enableCircleTool !== false}
                            onChange={this.onEnableCircleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Triangle Tool">
                        <Switch
                            checked={config.enableTriangleTool !== false}
                            onChange={this.onEnableTriangleToolChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Default Tool">
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

                    <SettingRow flow="wrap" label="Auto-start Default Tool">
                        <Switch
                            checked={config.autoStartTool === true}
                            onChange={this.onAutoStartToolChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Tool Button Customization">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Customize the text displayed on each tool button. Leave blank to use default values.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Point Button Text">
                        <TextInput
                            value={config.pointButtonText || 'Point'}
                            onChange={this.onPointButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Point"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Line Button Text">
                        <TextInput
                            value={config.lineButtonText || 'Line'}
                            onChange={this.onLineButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Line"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Freehand Line Button Text">
                        <TextInput
                            value={config.freehandLineButtonText || 'Freehand Line'}
                            onChange={this.onFreehandLineButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Freehand Line"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Area Button Text">
                        <TextInput
                            value={config.areaButtonText || 'Area'}
                            onChange={this.onAreaButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Area"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Freehand Area Button Text">
                        <TextInput
                            value={config.freehandAreaButtonText || 'Freehand Area'}
                            onChange={this.onFreehandAreaButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Freehand Area"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Rectangle Button Text">
                        <TextInput
                            value={config.rectangleButtonText || 'Rectangle'}
                            onChange={this.onRectangleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Rectangle"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Circle Button Text">
                        <TextInput
                            value={config.circleButtonText || 'Circle'}
                            onChange={this.onCircleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Circle"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Triangle Button Text">
                        <TextInput
                            value={config.triangleButtonText || 'Triangle'}
                            onChange={this.onTriangleButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Triangle"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Clear All Button Text">
                        <TextInput
                            value={config.clearAllButtonText || 'Clear All'}
                            onChange={this.onClearAllButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Clear All"
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Default Units">
                    <SettingRow flow="wrap" label="Default Linear Unit">
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

                    <SettingRow flow="wrap" label="Default Area Unit">
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

                    <SettingRow flow="wrap" label="Decimal Precision">
                        <NumericInput
                            value={config.decimalPrecision ?? 2}
                            onChange={this.onDecimalPrecisionChange}
                            min={0}
                            max={6}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Custom Units">
                    <SettingRow flow="wrap" label="">
                        <div style={{ width: '100%' }}>
                            <p className="custom-unit-description">
                                Define custom linear and area units with conversion factors. Units marked for dropdown will appear in the runtime unit selectors.
                            </p>

                            {/* ===== Custom Linear Units ===== */}
                            <div className="custom-unit-header">
                                <span className="custom-unit-header-label">Custom Linear Units</span>
                                <Button size="sm" type="primary" onClick={this.onAddCustomLinearUnit}>
                                    + Add Unit
                                </Button>
                            </div>

                            {(config.customLinearUnits || []).map((unit, index) => (
                                <div key={index} className="custom-unit-card">
                                    <div className="custom-unit-card-content">
                                        <div className="custom-unit-card-info">
                                            <div className="custom-unit-card-name">{unit.label || unit.name}</div>
                                            <div className="custom-unit-card-detail">
                                                {unit.name} &mdash; 1 {unit.label} = {unit.toMeters} meters
                                            </div>
                                        </div>
                                        <div className="custom-unit-card-actions">
                                            <Checkbox
                                                checked={unit.addToDropdown !== false}
                                                onChange={() => this.onToggleLinearUnitDropdown(index)}
                                                aria-label={`Show ${unit.label} in dropdown`}
                                                title="Show in dropdown"
                                            />
                                            <Button size="sm" onClick={() => this.setState({
                                                editingLinearUnit: { ...unit },
                                                editingLinearUnitIndex: index
                                            })}>
                                                Edit
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
                                        {this.state.editingLinearUnitIndex < (config.customLinearUnits || []).length ? 'Edit' : 'New'} Linear Unit
                                    </div>
                                    <div className="custom-unit-field-group">
                                        <div>
                                            <Label className="custom-unit-field-label">Unit Key (e.g., chains)</Label>
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
                                            <Label className="custom-unit-field-label">Display Label (e.g., Chains)</Label>
                                            <TextInput
                                                value={this.state.editingLinearUnit.label}
                                                onChange={(e) => this.setState({
                                                    editingLinearUnit: { ...this.state.editingLinearUnit, label: e.target.value }
                                                })}
                                                placeholder="Chains"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <Label className="custom-unit-field-label">Meters per unit (e.g., 1 chain = 20.1168 meters)</Label>
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
                                                Add to linear unit dropdown
                                            </Label>
                                        </div>
                                        <div className="custom-unit-edit-actions">
                                            <Button
                                                size="sm"
                                                type="primary"
                                                onClick={this.onSaveCustomLinearUnit}
                                                disabled={!this.state.editingLinearUnit.name || !this.state.editingLinearUnit.label}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => this.setState({ editingLinearUnit: null, editingLinearUnitIndex: -1 })}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== Custom Area Units ===== */}
                            <div className="section-spacer">
                                <div className="custom-unit-header">
                                    <span className="custom-unit-header-label">Custom Area Units</span>
                                    <Button size="sm" type="primary" onClick={this.onAddCustomAreaUnit}>
                                        + Add Unit
                                    </Button>
                                </div>

                                {(config.customAreaUnits || []).map((unit, index) => (
                                    <div key={index} className="custom-unit-card">
                                        <div className="custom-unit-card-content">
                                            <div className="custom-unit-card-info">
                                                <div className="custom-unit-card-name">{unit.label || unit.name}</div>
                                                <div className="custom-unit-card-detail">
                                                    {unit.name} &mdash; 1 {unit.label} = {unit.toSquareMeters} sq m
                                                </div>
                                            </div>
                                            <div className="custom-unit-card-actions">
                                                <Checkbox
                                                    checked={unit.addToDropdown !== false}
                                                    onChange={() => this.onToggleAreaUnitDropdown(index)}
                                                    aria-label={`Show ${unit.label} in dropdown`}
                                                    title="Show in dropdown"
                                                />
                                                <Button size="sm" onClick={() => this.setState({
                                                    editingAreaUnit: { ...unit },
                                                    editingAreaUnitIndex: index
                                                })}>
                                                    Edit
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
                                            {this.state.editingAreaUnitIndex < (config.customAreaUnits || []).length ? 'Edit' : 'New'} Area Unit
                                        </div>
                                        <div className="custom-unit-field-group">
                                            <div>
                                                <Label className="custom-unit-field-label">Unit Key (e.g., square-chains)</Label>
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
                                                <Label className="custom-unit-field-label">Display Label (e.g., Square Chains)</Label>
                                                <TextInput
                                                    value={this.state.editingAreaUnit.label}
                                                    onChange={(e) => this.setState({
                                                        editingAreaUnit: { ...this.state.editingAreaUnit, label: e.target.value }
                                                    })}
                                                    placeholder="Square Chains"
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="custom-unit-field-label">Square meters per unit (e.g., 1 sq chain = 404.6856 sq m)</Label>
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
                                                    Add to area unit dropdown
                                                </Label>
                                            </div>
                                            <div className="custom-unit-edit-actions">
                                                <Button
                                                    size="sm"
                                                    type="primary"
                                                    onClick={this.onSaveCustomAreaUnit}
                                                    disabled={!this.state.editingAreaUnit.name || !this.state.editingAreaUnit.label}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => this.setState({ editingAreaUnit: null, editingAreaUnitIndex: -1 })}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== Reference ===== */}
                            <div className="custom-unit-reference">
                                <strong>Common Historical Units Reference:</strong>
                                <div style={{ marginTop: '6px' }}>
                                    <strong>Linear:</strong> Chain = 20.1168m, Rod/Perch = 5.0292m, Link = 0.201168m, Furlong = 201.168m, Fathom = 1.8288m, League = 4828.032m
                                </div>
                                <div>
                                    <strong>Area:</strong> Sq Chain = 404.6856 sq m, Sq Rod = 25.2929 sq m, Rood = 1011.7141 sq m, Sq Link = 0.04047 sq m
                                </div>
                            </div>
                        </div>
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Measurement Display">
                    <SettingRow flow="wrap" label="Show Live Measurement">
                        <Switch
                            checked={config.showLiveMeasurement !== false}
                            onChange={this.onShowLiveMeasurementChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Auto-label Measurements">
                        <Switch
                            checked={config.autoLabelMeasurements !== false}
                            onChange={this.onAutoLabelMeasurementsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Coordinates">
                        <Switch
                            checked={config.showCoordinates !== false}
                            onChange={this.onShowCoordinatesChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Coordinate Format">
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

                    <SettingRow flow="wrap" label="Show Total Distance">
                        <Switch
                            checked={config.showTotalDistance !== false}
                            onChange={this.onShowTotalDistanceChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Continuous Drawing">
                        <Switch
                            checked={config.continuousDrawing === true}
                            onChange={this.onContinuousDrawingChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Auto-clear on Tool Switch">
                        <Switch
                            checked={config.autoClearOnToolSwitch === true}
                            onChange={this.onAutoClearOnToolSwitchChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="UI Toggle Controls Visibility">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Control which toggle switches are visible to users in the widget interface.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Segment Labels Toggle">
                        <Switch
                            checked={config.showSegmentLabelsToggle !== false}
                            onChange={this.onShowSegmentLabelsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Tooltips Toggle">
                        <Switch
                            checked={config.showTooltipsToggle !== false}
                            onChange={this.onShowTooltipsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Snapping Toggle">
                        <Switch
                            checked={config.showSnappingToggle !== false}
                            onChange={this.onShowSnappingToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Statistics Panel Toggle">
                        <Switch
                            checked={config.showStatisticsToggle !== false}
                            onChange={this.onShowStatisticsToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Unit Selector">
                        <Switch
                            checked={config.showUnitToggle !== false}
                            onChange={this.onShowUnitToggleChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Coordinate Mode Selector">
                        <Switch
                            checked={config.showCoordinateModeToggle !== false}
                            onChange={this.onShowCoordinateModeToggleChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Toggle Text Customization">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Customize the label text for toggle switches in the widget.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Segment Labels Toggle Text">
                        <TextInput
                            value={config.segmentLabelText || 'Show Segment Labels'}
                            onChange={this.onSegmentLabelTextChange}
                            style={{ width: '100%' }}
                            placeholder="Show Segment Labels"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Tooltips Toggle Text">
                        <TextInput
                            value={config.tooltipsToggleText || 'Show Tooltips'}
                            onChange={this.onTooltipsToggleTextChange}
                            style={{ width: '100%' }}
                            placeholder="Show Tooltips"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Snapping Toggle Text">
                        <TextInput
                            value={config.snappingToggleText || 'Enable Snapping'}
                            onChange={this.onSnappingToggleTextChange}
                            style={{ width: '100%' }}
                            placeholder="Enable Snapping"
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Default Toggle States">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Set the default state (on/off) for toggles when the widget loads.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Default Segment Labels State">
                        <Switch
                            checked={config.defaultSegmentLabelsState !== false}
                            onChange={this.onDefaultSegmentLabelsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Default Tooltips State">
                        <Switch
                            checked={config.defaultTooltipsState !== false}
                            onChange={this.onDefaultTooltipsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Default Snapping State">
                        <Switch
                            checked={config.defaultSnappingState === true}
                            onChange={this.onDefaultSnappingStateChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Power Features">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Advanced end-user features. Session persistence stores measurements in the browser's local storage and offers a restore prompt on reload.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Session persistence (restore after reload)">
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

                    <SettingRow flow="wrap" label="Live measurement readout while drawing">
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

                    <SettingRow flow="wrap" label="Multi-select mode (bulk delete/export)">
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

                    <SettingRow flow="wrap" label="Sort options in measurement list">
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
                </SettingSection>

                <SettingSection title="Default Panel Expansion">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Choose which collapsible panels start <em>expanded</em> when the widget loads. End users can still toggle them after.
                        </div>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Display Options panel expanded">
                        <Switch
                            checked={config.defaultDisplayOptionsState === true}
                            onChange={this.onDefaultDisplayOptionsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Units & Coordinates panel expanded">
                        <Switch
                            checked={config.defaultUnitsState === true}
                            onChange={this.onDefaultUnitsStateChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Summary Statistics panel expanded">
                        <Switch
                            checked={config.defaultStatisticsState === true}
                            onChange={this.onDefaultStatisticsStateChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Segment Label Styling">
                    <SettingRow flow="wrap" label="Enable Segment Labeling">
                        <Switch
                            checked={config.enableSegmentLabeling !== false}
                            onChange={this.onEnableSegmentLabelingChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Segment Labels by Default">
                        <Switch
                            checked={config.showSegmentLabels !== false}
                            onChange={this.onShowSegmentLabelsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Auto-save Segments">
                        <Switch
                            checked={config.autoSaveSegments === true}
                            onChange={this.onAutoSaveSegmentsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Segment Label Prefix">
                        <TextInput
                            value={config.segmentLabelPrefix || 'Segment'}
                            onChange={this.onSegmentLabelPrefixChange}
                            style={{ width: '100%' }}
                            placeholder="Segment"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Font Size">
                        <NumericInput
                            value={config.segmentLabelFontSize || 10}
                            onChange={this.onSegmentLabelFontSizeChange}
                            min={6}
                            max={32}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Font Family">
                        <Select
                            value={config.segmentLabelFontFamily || 'Arial'}
                            onChange={this.onSegmentLabelFontFamilyChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontFamilyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Font Weight">
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

                    <SettingRow flow="wrap" label="Font Style">
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

                    <SettingRow flow="wrap" label="Text Color">
                        <input
                            type="color"
                            value={config.segmentLabelColor || '#ffffff'}
                            onChange={this.onSegmentLabelColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Halo Color">
                        <input
                            type="color"
                            value={config.segmentLabelHaloColor || '#000000'}
                            onChange={this.onSegmentLabelHaloColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Halo Size">
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

                <SettingSection title="Main Label Styling">
                    <SettingRow flow="wrap" label="Font Size">
                        <NumericInput
                            value={config.labelFontSize || 12}
                            onChange={this.onLabelFontSizeChange}
                            min={6}
                            max={32}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Font Family">
                        <Select
                            value={config.labelFontFamily || 'Arial'}
                            onChange={this.onLabelFontFamilyChange}
                            style={{ width: '100%' }}
                        >
                            {this.fontFamilyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Font Weight">
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

                    <SettingRow flow="wrap" label="Font Style">
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

                    <SettingRow flow="wrap" label="Text Color">
                        <input
                            type="color"
                            value={config.labelColor || '#ffffff'}
                            onChange={this.onLabelColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Halo Color">
                        <input
                            type="color"
                            value={config.labelHaloColor || '#000000'}
                            onChange={this.onLabelHaloColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Halo Size">
                        <NumericInput
                            value={config.labelHaloSize ?? 2}
                            onChange={this.onLabelHaloSizeChange}
                            min={0}
                            max={10}
                            step={0.5}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Label Position">
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

                    <SettingRow flow="wrap" label="Show Live Labels">
                        <Switch
                            checked={config.showLiveLabels !== false}
                            onChange={this.onShowLiveLabelsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Live Label Font Size">
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
                    <SettingRow flow="wrap" label="Enable Import/Export">
                        <Switch
                            checked={config.enableImportExport !== false}
                            onChange={this.onEnableImportExportChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Export All Button">
                        <Switch
                            checked={config.showExportButton !== false}
                            onChange={this.onShowExportButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Import Button">
                        <Switch
                            checked={config.showImportButton !== false}
                            onChange={this.onShowImportButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Export Button Text">
                        <TextInput
                            value={config.exportButtonText || 'Export All'}
                            onChange={this.onExportButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Export All"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Import Button Text">
                        <TextInput
                            value={config.importButtonText || 'Import GeoJSON'}
                            onChange={this.onImportButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Import GeoJSON"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Enable Export">
                        <Switch
                            checked={config.enableExport !== false}
                            onChange={this.onEnableExportChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Default Export Format">
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

                    <SettingRow flow="wrap" label="Include Timestamp in Export">
                        <Switch
                            checked={config.includeTimestampInExport !== false}
                            onChange={this.onIncludeTimestampInExportChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Storage & Persistence">
                    <SettingRow flow="wrap" label="Enable Local Storage">
                        <Switch
                            checked={config.enableStorage === true}
                            onChange={this.onEnableStorageChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Max Stored Measurements">
                        <NumericInput
                            value={config.maxStoredMeasurements || 100}
                            onChange={this.onMaxStoredMeasurementsChange}
                            min={10}
                            max={1000}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Persist Measurements">
                        <Switch
                            checked={config.persistMeasurements === true}
                            onChange={this.onPersistMeasurementsChange}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Undo/Redo">
                    <SettingRow flow="wrap" label="Enable Undo/Redo">
                        <Switch
                            checked={config.enableUndoRedo !== false}
                            onChange={this.onEnableUndoRedoChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Undo Button Text">
                        <TextInput
                            value={config.undoButtonText || 'Undo'}
                            onChange={this.onUndoButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Undo"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Redo Button Text">
                        <TextInput
                            value={config.redoButtonText || 'Redo'}
                            onChange={this.onRedoButtonTextChange}
                            style={{ width: '100%' }}
                            placeholder="Redo"
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Color Palette">
                    <SettingRow>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: '#495057'
                        }}>
                            <strong>Note:</strong> Customize the 10 colors used for measurement graphics. These colors cycle through as measurements are created.
                        </div>
                    </SettingRow>

                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => {
                        const defaultColors = [
                            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                            '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
                        ];
                        const palette = config.colorPalette || defaultColors;
                        return (
                            <SettingRow key={index} flow="wrap" label={`Color ${index + 1}`}>
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

                <SettingSection title="Symbol Styling">
                    <SettingRow flow="wrap" label="Point Size (pixels)">
                        <NumericInput
                            value={config.pointSize || 8}
                            onChange={this.onPointSizeChange}
                            min={4}
                            max={20}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Point Color">
                        <input
                            type="color"
                            value={config.pointColor || '#3b82f6'}
                            onChange={this.onPointColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Point Outline Width (pixels)">
                        <NumericInput
                            value={config.pointOutlineWidth || 2}
                            onChange={this.onPointOutlineWidthChange}
                            min={0}
                            max={10}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Point Outline Color">
                        <input
                            type="color"
                            value={config.pointOutlineColor || '#ffffff'}
                            onChange={this.onPointOutlineColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Polygon Outline Width (pixels)">
                        <NumericInput
                            value={config.outlineWidth || 2}
                            onChange={this.onOutlineWidthChange}
                            min={1}
                            max={10}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Polygon Outline Color">
                        <input
                            type="color"
                            value={config.outlineColor || '#000000'}
                            onChange={this.onOutlineColorChange}
                            style={{ width: '100%', height: '32px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Fill Opacity (%)">
                        <NumericInput
                            value={Math.round((config.fillOpacity ?? 0.3) * 100)}
                            onChange={this.onFillOpacityChange}
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="User Interface">
                    <SettingRow flow="wrap" label="Always Show Button Text">
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

                    <SettingRow flow="wrap" label="Show Widget Title">
                        <Switch
                            checked={config.showWidgetTitle !== false}
                            onChange={this.onShowWidgetTitleChange}
                        />
                    </SettingRow>

                    {config.showWidgetTitle !== false && (
                        <SettingRow flow="wrap" label="Widget Title">
                            <TextInput
                                value={config.widgetTitle || 'Measurement Tools'}
                                onChange={this.onWidgetTitleChange}
                                style={{ width: '100%' }}
                                placeholder="Measurement Tools"
                            />
                        </SettingRow>
                    )}

                    <SettingRow flow="wrap" label="Show Hint Message">
                        <Switch
                            checked={config.showHintMessage !== false}
                            onChange={this.onShowHintMessageChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Clear All Button">
                        <Switch
                            checked={config.showClearAllButton !== false}
                            onChange={this.onShowClearAllButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Print-Ready Button">
                        <Switch
                            checked={config.showPrintReadyButton !== false}
                            onChange={this.onShowPrintReadyButtonChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Compact Mode">
                        <Switch
                            checked={config.compactMode === true}
                            onChange={this.onCompactModeChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Button Layout">
                        <Select
                            value={config.buttonLayout || '4-column'}
                            onChange={this.onButtonLayoutChange}
                            style={{ width: '100%' }}
                        >
                            <option value="2-column">2 Columns</option>
                            <option value="3-column">3 Columns</option>
                            <option value="4-column">4 Columns</option>
                            <option value="vertical">Vertical (1 Column)</option>
                        </Select>
                    </SettingRow>

                    <SettingRow flow="wrap" label="Show Icons on Buttons">
                        <Switch
                            checked={config.showIconsOnButtons !== false}
                            onChange={this.onShowIconsOnButtonsChange}
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Measurements Header Text">
                        <TextInput
                            value={config.measurementsHeaderText || 'Measurements'}
                            onChange={this.onMeasurementsHeaderTextChange}
                            style={{ width: '100%' }}
                            placeholder="Measurements"
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Empty State Customization">
                    <SettingRow flow="wrap" label="Empty State Message">
                        <TextInput
                            value={config.emptyStateMessage || 'No measurements yet'}
                            onChange={this.onEmptyStateMessageChange}
                            style={{ width: '100%' }}
                            placeholder="No measurements yet"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Empty State Hint">
                        <TextInput
                            value={config.emptyStateHint || 'Click a measurement tool to begin'}
                            onChange={this.onEmptyStateHintChange}
                            style={{ width: '100%' }}
                            placeholder="Click a measurement tool to begin"
                        />
                    </SettingRow>
                </SettingSection>

                <SettingSection title="Dialog Customization">
                    <SettingRow flow="wrap" label="Clear Dialog Title">
                        <TextInput
                            value={config.clearDialogTitle || 'Are you sure you want to clear all measurements?'}
                            onChange={this.onClearDialogTitleChange}
                            style={{ width: '100%' }}
                            placeholder="Are you sure you want to clear all measurements?"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Clear Dialog Cancel Text">
                        <TextInput
                            value={config.clearDialogCancelText || 'Cancel'}
                            onChange={this.onClearDialogCancelTextChange}
                            style={{ width: '100%' }}
                            placeholder="Cancel"
                        />
                    </SettingRow>

                    <SettingRow flow="wrap" label="Clear Dialog Confirm Text">
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
                            Reset All Settings to Defaults
                        </Button>
                    </SettingRow>
                </SettingSection>

                <SettingSection>
                    <div style={{ padding: '10px', fontSize: '12px', color: '#666', background: '#f8f9fa', borderRadius: '4px' }}>
                        <p style={{ marginTop: 0, fontWeight: 'bold' }}>
                            Enhanced Measurement Widget v3.3 - Custom Units Support
                        </p>
                        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>Custom linear and area units with developer-configurable conversion factors</li>
                            <li>XML settings import/export for easy transfer between Experience Builder apps</li>
                            <li>Individual tool enablement (8 measurement tools with independent controls)</li>
                            <li>Complete UI customization with text overrides for all buttons and messages</li>
                            <li>Print-Ready Labels mode for optimized PDF/print export spacing</li>
                            <li>Full control over tool visibility and button layout (2/3/4 column or vertical)</li>
                            <li>Comprehensive color palette with 10 customizable colors</li>
                            <li>Advanced label styling and positioning with font size controls</li>
                            <li>Toggle visibility controls for Segment Labels, Tooltips, Snapping, and Statistics</li>
                            <li>Default state configuration for all toggles</li>
                            <li>Configurable dialogs, empty states, and measurement headers</li>
                            <li>Complete symbol styling (size, color, opacity, outlines)</li>
                            <li>Enhanced segment labeling with customizable prefix and font sizes</li>
                            <li>Flexible import/export with format selection and button customization</li>
                            <li>Storage and persistence options with configurable limits</li>
                            <li>Undo/Redo support with custom button text</li>
                        </ul>
                    </div>
                </SettingSection>
            </div>
        );
    }
}