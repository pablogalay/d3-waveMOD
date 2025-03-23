import { WaveGraph } from './waveGraph';
import { ContextMenu, ContextMenuItem } from './contextMenu';
import type { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';
export declare class SignalContextMenu extends ContextMenu<HierarchyNodeWaveGraphSignalWithXYId> {
    waveGraph: WaveGraph;
    constructor(waveGraph: WaveGraph);
    getMenuItems(d: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>): ContextMenuItem<any>[];
}
