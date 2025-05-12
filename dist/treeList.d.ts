import * as d3 from 'd3';
import { Scrollbar } from './scrollbar';
import { SignalLabelManipulation } from './signalLabelManipulation';
import type { SignalContextMenu } from './signalLabelContextMenu';
import { WaveGraphSignal } from './data';
export interface HierarchyNodeWaveGraphSignalWithXYId extends d3.HierarchyNode<WaveGraphSignal> {
    x?: number;
    y?: number;
    _children?: this[];
}
export declare class TreeList {
    barHeight: number;
    labelMoving: SignalLabelManipulation;
    width: number | undefined;
    height: number | undefined;
    root: HierarchyNodeWaveGraphSignalWithXYId | null;
    rootElm: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
    labelG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
    scrollbarG: d3.Selection<SVGGElement, any, any, any> | null;
    scroll: Scrollbar | null;
    contextMenu: SignalContextMenu;
    nodes: HierarchyNodeWaveGraphSignalWithXYId[];
    _onChange: ((nodes: HierarchyNodeWaveGraphSignalWithXYId[]) => void) | null;
    currentFilter: ((d: WaveGraphSignal) => boolean) | null;
    constructor(barHeight: number, contextMenu: SignalContextMenu);
    static getExpandCollapseIcon(d: HierarchyNodeWaveGraphSignalWithXYId): import("@fortawesome/fontawesome-common-types").IconPathData;
    registerExpandHandler<GElement extends SVGElement, PElement extends SVGElement, PDatum>(elm: d3.Selection<GElement, HierarchyNodeWaveGraphSignalWithXYId, PElement, PDatum>): d3.Selection<GElement, HierarchyNodeWaveGraphSignalWithXYId, PElement, PDatum>;
    clickExpandCollapse(ev: any, d: HierarchyNodeWaveGraphSignalWithXYId, elm: SVGElement): void;
    resolveSelection(): void;
    draw(_rootElm: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined>): void;
    _setLabelWidth(_width: number): void;
    size(_width: number, _height: number): this | (number | undefined)[];
    _bindScrollData(): void;
    data(_data: WaveGraphSignal): this;
    onChange(fn: ((nodes: HierarchyNodeWaveGraphSignalWithXYId[]) => void) | null): this | ((nodes: HierarchyNodeWaveGraphSignalWithXYId[]) => void) | null;
    visibleNodes(): HierarchyNodeWaveGraphSignalWithXYId[];
    filter(predicate: (d: WaveGraphSignal) => boolean): void;
    getFilter(): ((d: WaveGraphSignal) => boolean) | null;
    resetFilter(): void;
    update(): void;
}
export { WaveGraphSignal };
