import * as d3 from 'd3';
export declare class DragBarVertical {
    x: number;
    y: number;
    xMin: number;
    xMax: number;
    dragBehavior: d3.DragBehavior<SVGRectElement, any, any>;
    dragHandle: d3.Selection<SVGRectElement, this, any, any>;
    _size: [number, number];
    _onDrag?: (drag: DragBarVertical) => void;
    constructor(parentGElm: d3.Selection<SVGGElement, any, any, any>, size: [number, number], range: [number, number], init_pos: [number, number]);
    range(xMin: number, xMax: number): number[] | undefined;
    size(width: number, height: number): [number, number] | undefined;
    _onDragDelegate(ev: d3.D3DragEvent<SVGRectElement, this, any>, d: this): void;
    onDrag(_onDrag?: (drag: DragBarVertical) => void): this | ((drag: DragBarVertical) => void) | undefined;
}
