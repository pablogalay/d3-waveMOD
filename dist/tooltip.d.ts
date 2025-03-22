import * as d3 from 'd3';
export declare class Tooltip {
    tooltipHtmlGetter: (d: any) => string;
    tooltipDiv: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    constructor(tooltipHtmlGetter: (d: any) => string);
    addToElm(selection: d3.Selection<any, any, any, any>): d3.Selection<any, any, any, any>;
}
