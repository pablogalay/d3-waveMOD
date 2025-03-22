import * as d3 from 'd3';
import { RowRendererBase } from './base';
import { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo } from '../data';
export declare class RowRendererBit extends RowRendererBase {
    select(typeInfo: WaveGraphSignalTypeInfo): boolean;
    render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)): void;
}
