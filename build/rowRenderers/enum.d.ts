import { RowRendererBits } from './bits';
import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, WaveGraphSignalTypeInfo } from '../data';
export declare const STRING_FORMAT: {
    [formatName: string]: (d: AnyWaveGraphValue) => string;
};
/**
 * A renderer for enum value rows, enum value is a string, "" is resolved as invalid value
 * and is rendered with red color
 */
export declare class RowRendererEnum extends RowRendererBits {
    constructor(waveGraph: WaveGraph);
    select(typeInfo: WaveGraphSignalTypeInfo): boolean;
    isValid(d: any): boolean;
}
