import type { TreeList, HierarchyNodeWaveGraphSignalWithXYId } from './treeList';
import * as d3 from 'd3';
export declare class SignalLabelManipulation {
    ROW_Y: number;
    signalList: TreeList;
    previouslyClicked: HierarchyNodeWaveGraphSignalWithXYId | null;
    labels: d3.Selection<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, HTMLDivElement, any> | null;
    dropLocator: d3.Selection<SVGGElement, undefined, HTMLDivElement, any> | null;
    constructor(ROW_Y: number, signalList: TreeList);
    resolveInsertTarget(y: number): [HierarchyNodeWaveGraphSignalWithXYId | undefined, number | undefined];
    dragStarted(ev: d3.D3DragEvent<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any>, elm: d3.Selection<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any, any>, d: HierarchyNodeWaveGraphSignalWithXYId): void;
    _getXYforItemOnIndex(parentItem: HierarchyNodeWaveGraphSignalWithXYId, i: number): (number | undefined)[];
    dragged(ev: d3.D3DragEvent<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any>, elm: d3.Selection<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any, any>, d: HierarchyNodeWaveGraphSignalWithXYId): void;
    regenerateDepth(d: HierarchyNodeWaveGraphSignalWithXYId): void;
    dragEnded(ev: d3.D3DragEvent<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any>, elm: d3.Selection<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any, any>, d: HierarchyNodeWaveGraphSignalWithXYId): void;
    registerDrag(labels: d3.Selection<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId, any, any>): void;
}
