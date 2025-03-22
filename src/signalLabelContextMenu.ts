import type { WaveGraph } from './waveGraph';
import { ContextMenu, ContextMenuItem } from './contextMenu';
import type { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';

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
		
		// Helper function to check if signal is multi-bit
		function isMultiBitSignal(signal: HierarchyNodeWaveGraphSignalWithXYId): boolean {
			//check if the "data" section has a b at the start of the string
			return typeof signal.data === 'string' && (signal.data as string).startsWith('b');
		}

		function breakDownSignal(){

		}
		/*
		// Helper function to parse binary string (e.g., "b00101") to decimal
		function parseBinaryString(binaryStr: string): number {
			// Remove the 'b' prefix and convert to decimal
			if (binaryStr.startsWith('b')) {
				return parseInt(binaryStr.substring(1), 2);
			}
			// Handle 'X' values (undefined/don't care) as 0 or however you want to represent them
			if (binaryStr.includes('X')) {
				return -1; // Or another special value to indicate "don't care"
			}
			return parseInt(binaryStr, 2);
		}
		
		// Function to break down a multi-bit signal into individual bits
		function breakDownSignal(cm: ContextMenu<HierarchyNodeWaveGraphSignalWithXYId>,
			elm: SVGGElement,
			data: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>,
			index: number) {
			
			const signal = data.data;
			const signalWidth = signal.data.data.type.width;
			
			if (!isMultiBitSignal(signal)) {
				return; // Don't process single-bit signals
			}
			
			// Create individual bit signals for each bit position
			for (let i = 0; i < signalWidth; i++) {
				// Create a new signal for this bit
				const bitSignal = structuredClone(signal); // Deep clone the signal
				
				// Update properties for this specific bit
				bitSignal.data.id = `${signal.data.id}_bit${i}`; // Unique ID
				bitSignal.data.name = `${signal.data.name}[${i}]`; // Add bit index to name
				bitSignal.data.data.type.width = 1; // Set width to 1 bit
				bitSignal.data.data.originalSignal = signal.data.id; // Store reference to parent
				bitSignal.data.data.bitIndex = i; // Store bit index
				
				// Process data points for this bit
				const newData = [];
				for (const dataPoint of signal.data.data.data) {
					const time = dataPoint[0];
					let value = dataPoint[1];
					
					// Handle different data formats
					let bitValue;
					if (typeof value === 'string' && value.startsWith('b')) {
						// Handle binary string (e.g., "b00101")
						const binaryStr = value.substring(1); // Remove 'b' prefix
						const padded = binaryStr.padStart(signalWidth, '0');
						// Extract the specific bit (reverse order since LSB is rightmost)
						const bit = padded[padded.length - 1 - i];
						bitValue = bit === 'X' ? 'X' : bit; // Preserve 'X' if present
					} else if (typeof value === 'number') {
						// Handle numeric value
						bitValue = ((value >> i) & 1).toString();
					} else {
						// Handle any other format (e.g., if data is already in bit form)
						bitValue = value;
					}
					
					newData.push([time, bitValue]);
				}
				
				// Set the processed data for this bit
				bitSignal.data.data.data = newData;
				
				// Add the bit signal to the waveGraph tree
				waveGraph.addSignal(bitSignal);
			}
			
			waveGraph.draw();
		}*/
		
		return [
			new ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>(
				'Remove',
				d.data,
				[], false, false,
				/*action*/(cm: ContextMenu<HierarchyNodeWaveGraphSignalWithXYId>,
					elm: SVGGElement,
					data: ContextMenuItem<HierarchyNodeWaveGraphSignalWithXYId>,
					index: number) => {
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
				[], // No children
				false, // No divider
				!isMultiBitSignal(d.data), // Disable if not multi-bit
				breakDownSignal // Action to perform
			)
		];
		
	}
}