import * as d3 from 'd3';
import { RowRendererBase } from './rowRenderers/base';
import { TreeList } from './treeList';
import { DragBarVertical } from './dragBar';
import { SignalContextMenu } from './signalLabelContextMenu';
import { WaveGraphSignal } from './data';
import { WaveGraphSizes } from './sizes';
import './d3-wave.css';
declare module './data' {
    interface WaveGraphSignal {
        annotations?: Array<{
            time: number;
            text: string;
            color: string;
            startTime?: number;
            endTime?: number;
        }>;
        __signal?: WaveGraphSignal;
    }
}
export declare class WaveGraph {
    svg: d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>;
    dataG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined>;
    waveRowX: d3.ScaleLinear<number, number, never> | null;
    waveRowY: d3.ScaleLinear<number, number, never> | null;
    xAxis: d3.Axis<d3.NumberValue> | null;
    yAxisG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
    xAxisG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
    xRange: [number, number];
    sizes: WaveGraphSizes;
    TICKS_PER_X_AXIS: number;
    rowRenderers: RowRendererBase[];
    timeZoom: d3.ZoomBehavior<SVGGElement, undefined> | null;
    treelist: TreeList | null;
    verticalHelpLine: d3.Selection<SVGLineElement, undefined, HTMLDivElement, undefined> | null;
    labelAreaSizeDragBar: DragBarVertical | null;
    labelContextMenu: SignalContextMenu;
    data: WaveGraphSignal[];
    _allData?: WaveGraphSignal;
    is_first_draw: boolean;
    private filterPanel;
    private helpPanel;
    constructor(svg: d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>);
    _setZoom(): void;
    _zoomed(ev: d3.D3ZoomEvent<SVGGElement, any>): void;
    setSizes(): void;
    drawYHelpLine(): void;
    drawGridLines(): void;
    drawXAxis(): void;
    drawControlIcons(): void;
    drawYAxis(): void;
    draw(): void;
    addChildSignal(parentSignalName: string, newSignalData: WaveGraphSignal, removedSignals: string[]): void;
    bindData(_signalData: WaveGraphSignal): void;
    zoomReset(): void;
    compareAndAnnotateSignals(): void;
    compareChildSignals(signalS: WaveGraphSignal, signalStar: WaveGraphSignal): void;
    findClosestValueBefore(data: any[], time: number): any;
}
