import type { RowRendererBase } from "./rowRenderers/base";
export type NumbericDataValue = string | number;
export type NumbericDataVectorValue = string | [number[], NumbericDataValue];
export type AnyWaveGraphValue = NumbericDataValue | NumbericDataVectorValue;
export type SignalDataValueTuple = [number, AnyWaveGraphValue, number];
export declare class WaveGraphSignalTypeInfo {
    name: string;
    width?: number | number[];
    formatter?: string | ((d: AnyWaveGraphValue) => string);
    renderer: RowRendererBase | undefined;
    isSelected?: boolean;
    constructor(name: string, width: number | undefined);
}
/**
 * Class for signal data which is used as an input to the signal wave graph.
 */
export declare class WaveGraphSignal {
    name: string;
    type: WaveGraphSignalTypeInfo;
    data: SignalDataValueTuple[];
    children?: WaveGraphSignal[];
    _children?: WaveGraphSignal[];
    constructor(name: string, type: WaveGraphSignalTypeInfo, data: SignalDataValueTuple[], children?: WaveGraphSignal[] | undefined, expanded?: boolean);
}
