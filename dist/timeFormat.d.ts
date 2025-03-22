import * as d3 from 'd3';
export declare const TIME_UNITS: [number, string][];
export declare function createTimeFormatter(divider: number, unitName: string): (d: d3.NumberValue, i: number) => string;
export declare function createTimeFormatterForTimeRange(timeRange: [number, number]): (d: d3.NumberValue, i: number) => string;
