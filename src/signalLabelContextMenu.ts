import { WaveGraph } from './waveGraph';
import { ContextMenu, ContextMenuItem } from './contextMenu';
import type { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';
import { WaveGraphSignal, SignalDataValueTuple } from './data'
import { Sign } from 'crypto';


export class SignalContextMenu extends ContextMenu<HierarchyNodeWaveGraphSignalWithXYId> {
	waveGraph: WaveGraph;
	constructor(waveGraph: WaveGraph) {
		super();
		this.waveGraph = waveGraph;
	}

	getMenuItems(d: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>): ContextMenuItem<any>[] {
		let waveGraph = this.waveGraph;
		let formatOptions: ContextMenuItem<string>[] = [];
		// construct format options from values in formatters dictionary

		var formatters = d.data.data.type.renderer?.FORMATTERS || {};
		function formatChanger(cm: ContextMenu<string>,
			elm: SVGGElement,
			data: ContextMenuItem<string>,
			index: number) {
			const key = data.data;
			// function which switches data format function on every currently selected signals
			const newFormatter = formatters[key];
			d.data.data.type.formatter = newFormatter;
			const currentRenderrer = d.data.data.type.renderer;
			waveGraph.treelist?.visibleNodes().forEach(function (d: HierarchyNodeWaveGraphSignalWithXYId) {
				if (d.data.type.isSelected && d.data.type.renderer === currentRenderrer) {
					// === currentRenderrer because we do not want to change format on signals
					// which do not support this format option
					d.data.type.formatter = newFormatter;
				}
			});
			waveGraph.draw();
		}

		for (var key in formatters) {
			if (formatters.hasOwnProperty(key)) {
				formatOptions.push(new ContextMenuItem<string>(
					/*title*/ key,
					key,
					[],
					/* divider */ false,
					/* disabled */ false,
					/*action*/ formatChanger,
				));
			}
		}
		
		
		return [
			new ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>(
				'Remove',
				d.data,
				[], false, false,
				/*action*/(cm: ContextMenu<HierarchyNodeWaveGraphSignalWithXYId>,
					elm: SVGGElement,
					data: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>,
					index: number) => {
					console.log('Remove signal type', d.data.data.type);
					console.log('Remove signal type', d.data.data.type.name);
					d.data.data.type.isSelected = true;
					return waveGraph.treelist?.filter((d) => {
						return !d.type.isSelected;
					});
				}
			),
			new ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>(
				'Format',
				d.data,
				/* children */ formatOptions,
				/* divider */ false,
				/* disabled */ formatOptions.length == 0,
				/*action*/ null,
			),
			new ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>(
				'Break down',
				d.data,
				[],
				/* divider */ false,
				/* disabled */ d.data.data.isBrokenDown || formatOptions.length == 0,
				/*action*/(cm: ContextMenu<HierarchyNodeWaveGraphSignalWithXYId>,
					elm: SVGGElement,
					data: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>,
					index: number) => {
					if (d.data.data.isBrokenDown) {
						console.log('Signal has already been broken down', d.data.data.name);
						return;
					}
					const parentType = d.data.data.type;
					const parentData = d.data.data.data;
					const parentSignalName = d.data.data.name;
					const parentIsBrokenDown = true;
					const newSignalData: WaveGraphSignal = {
						name: `${parentSignalName} Child`,
						type: parentType,
						data: parentData,
						isBrokenDown: parentIsBrokenDown,
					};

					waveGraph.addChildSignal(parentSignalName, newSignalData);
					d.data.data.isBrokenDown = true;
				}
			),
		];
		
	}
}