import type { WaveGraph } from '../waveGraph';
import { WaveGraphSignalTypeInfo } from '../data';
import { RowRendererBits } from './bits';
/**
 * A renderer for value rows with data of array type.
 * The record of data is of following format: [[<indexes>], <new value>]
 */
export declare class RowRendererArray extends RowRendererBits {
    constructor(waveGraph: WaveGraph);
    select(typeInfo: WaveGraphSignalTypeInfo): boolean;
    isValid(d: any): boolean;
}
