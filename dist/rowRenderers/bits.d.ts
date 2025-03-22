import { RowRendererBase } from './base';
import type { WaveGraph } from '../waveGraph';
import type { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo } from '../data';
/**
 * A renderer for bit vector value rows.
 * Value is supposed to be a number or based string without leading 0 (eg. "x10" instead of "0x10" )
 */
export declare class RowRendererBits extends RowRendererBase {
    constructor(waveGraph: WaveGraph);
    select(typeInfo: WaveGraphSignalTypeInfo): boolean;
    isValid(d: any): boolean;
    render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)): void;
}
