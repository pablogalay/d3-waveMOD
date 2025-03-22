import type { NumbericDataValue, NumbericDataVectorValue, WaveGraphSignal } from './data';
export declare const PREVIEW_TYPE: {
    HEX_BYTES: (d: NumbericDataVectorValue, size: number) => string[];
    ASCII: string;
};
export declare class HexEdit {
    addrRange: [number, number];
    addrStep: number;
    addrPos: number;
    dataWordCellCnt: number;
    dataAreas: d3.Selection<HTMLTableCellElement, any, any, any>[];
    currentTime: number;
    parent: d3.Selection<any, any, any, any>;
    mainTable: d3.Selection<HTMLTableElement, any, any, any> | null;
    _data: WaveGraphSignal | null;
    currentData: NumbericDataValue[];
    constructor(parent: d3.Selection<any, any, any, any>);
    /**
    * Get or set data to this viewer
    */
    data(data: WaveGraphSignal): WaveGraphSignal | null | undefined;
    setTime(newTime: number): void;
    draw(): void;
}
