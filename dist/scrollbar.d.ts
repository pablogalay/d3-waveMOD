import * as d3 from 'd3';
import { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';
/**
 * Implementation of SVG based scrollbar component which has a histogram like columns which are showing the
 * depth of the items in signal list.
 */
export declare class Scrollbar {
    barHeight: number;
    selectorWidth: number;
    _onDrag: ((startPerc: number) => void) | null;
    scrollbarG: d3.Selection<SVGGElement, any, any, any>;
    moverElm: d3.Selection<SVGRectElement, null, SVGGElement, any> | null;
    width: number;
    height: number;
    _isScrollDisplayed: boolean;
    flatenedData: HierarchyNodeWaveGraphSignalWithXYId[];
    maxDepth: number;
    _startPerc: number;
    constructor(barHeight: number, _scrollbarG: d3.Selection<SVGGElement, any, any, any>);
    onDrag(fn: ((startPerc: number) => void) | null): this | ((startPerc: number) => void) | null;
    render(): void;
    registerWheel(elm: d3.Selection<any, any, any, any>): this;
    size(_width: number, _height: number): this;
    isScrollDisplayed(): boolean;
    data(_flatenedData: HierarchyNodeWaveGraphSignalWithXYId[], _maxDepth: number): this;
    startPerc(): number;
}
