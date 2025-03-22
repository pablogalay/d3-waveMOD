import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo } from '../data';
export declare class RowRendererBase {
    waveGraph: WaveGraph;
    FORMATTERS: {
        [formatName: string]: (d: any) => string;
    };
    DEFAULT_FORMAT?: string | ((d: AnyWaveGraphValue) => string);
    constructor(waveGraph: WaveGraph);
    select(typeInfo: WaveGraphSignalTypeInfo): boolean;
    render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)): void;
}
