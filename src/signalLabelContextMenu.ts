import { WaveGraph } from './waveGraph';
import { ContextMenu, ContextMenuItem } from './contextMenu';
import type { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';
import { WaveGraphSignal, SignalDataValueTuple } from './data'
import { Sign } from 'crypto';
import { format } from 'path';


export class SignalContextMenu extends ContextMenu<HierarchyNodeWaveGraphSignalWithXYId> {
	waveGraph: WaveGraph;
	removedSignals: string[] = [];
	constructor(waveGraph: WaveGraph) {
		super();
		this.waveGraph = waveGraph;
	}

	autoBreakDownSignals() {
		const targets = ["S", "S*"];
		this.waveGraph.treelist?.visibleNodes().forEach((node) => {
			if (targets.some(target => node.data.name === target) && !node.data.isBrokenDown && node.data.type.name !== "array") {
				const parentType = node.data.type;
				const parentData = node.data.data;
				const parentSignalName = node.data.name;
				const parentIsBrokenDown = true;

				const newSignalData: WaveGraphSignal = {
					name: `${parentSignalName} Child`,
					type: parentType,
					data: parentData,
					isBrokenDown: parentIsBrokenDown,
				};

				this.waveGraph.addChildSignal(parentSignalName, newSignalData, this.removedSignals);
				node.data.isBrokenDown = true;
			}
		});
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
				[], false, 
				/* disabled */ d.data.data.name.match(/Child_bit\d+/) !== null,
				/*action*/(cm: ContextMenu<HierarchyNodeWaveGraphSignalWithXYId>,
					elm: SVGGElement,
					data: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>,
					index: number) => {
					console.log('Remove signal type', d.data.data.type);
					console.log('Remove signal type', d.data.data.type.name);
					this.removedSignals.push(d.data.data.name);
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
				/* disabled */ (d.data.data.isBrokenDown || (d.data.data.type.name == 'array')) || formatOptions.length == 0,
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

					waveGraph.addChildSignal(parentSignalName, newSignalData, this.removedSignals);
					d.data.data.isBrokenDown = true;

					// Check for related signals with or without '*'
					const relatedSignalName = parentSignalName.endsWith('*')
						? parentSignalName.slice(0, -1)
						: `${parentSignalName}*`;

					waveGraph.treelist?.visibleNodes().forEach((node) => {
						if (node.data.name === relatedSignalName && !node.data.isBrokenDown) {
							const relatedSignalData: WaveGraphSignal = {
								name: `${relatedSignalName} Child`,
								type: node.data.type,
								data: node.data.data,
								isBrokenDown: true,
							};

							waveGraph.addChildSignal(relatedSignalName, relatedSignalData, this.removedSignals);
							node.data.isBrokenDown = true;
						}
					});
				}
			),
		];
		
	}
}