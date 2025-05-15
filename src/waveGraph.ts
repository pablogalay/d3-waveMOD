import * as d3 from 'd3';
import { filterDataByTime } from './filterData';
import { RowRendererBase } from './rowRenderers/base';
import { RowRendererBit } from './rowRenderers/bit';
import { RowRendererBits } from './rowRenderers/bits';
import { RowRendererEnum } from './rowRenderers/enum';
import { RowRendererLabel } from './rowRenderers/label';
import { RowRendererStruct } from './rowRenderers/struct';
import { RowRendererArray } from './rowRenderers/array';
import { createTimeFormatterForTimeRange } from './timeFormat';
import { RowRendererAnnotation } from './rowRenderers/annotation';
import { TreeList } from './treeList';
import { faQuestion, faDownload, faArrowsH, faFilter, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { DragBarVertical } from './dragBar';
import { exportStyledSvgToBlob } from './exportSvg'
import { SignalContextMenu } from './signalLabelContextMenu';
import { Tooltip } from './tooltip';
import { WaveGraphSignal } from './data'
import { WaveGraphSizes } from './sizes';
import { SignalFilterPanel } from './signalFilterPanel';
import { HelpPanel } from './helpPanel';

import './d3-wave.css';
import { sign } from 'crypto';

//extend the interface of waveGraphSignal to add the __signal property	
declare module './data' {
	interface WaveGraphSignal {
	  annotations?: Array<{
		time: number, 
		text: string, 
		color: string,
		startTime?: number,  // Tiempo de inicio de la diferencia
		endTime?: number     // Tiempo de fin de la diferencia
	  }>;
	  __signal?: WaveGraphSignal;
	}
  }


// main class which constructs the signal wave viewer
export class WaveGraph {
	svg: d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>; // main SVG element where this graph is rendered
	dataG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined>; // main svg g where signal values are rendered

	waveRowX: d3.ScaleLinear<number, number, never> | null; // stace to resolve X position from time in dataG
	waveRowY: d3.ScaleLinear<number, number, never> | null; // scale to resolve Y position from signal list index in dataG
	xAxis: d3.Axis<d3.NumberValue> | null;
	yAxisG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
	xAxisG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
	xRange: [number, number]; // range of x axis (time)

	sizes: WaveGraphSizes; // container of all sizes, padings, margings etc. 
	TICKS_PER_X_AXIS: number;
	rowRenderers: RowRendererBase[]; // renderers which are used to convert signal values to a displayed graphical element

	timeZoom: d3.ZoomBehavior<SVGGElement, undefined> | null; // zoom in time axis for displayed signal values
	treelist: TreeList | null; // tree list which displays signal hiearchy an implements signal manimulations
	verticalHelpLine: d3.Selection<SVGLineElement, undefined, HTMLDivElement, undefined> | null; // line which appears under cursor an can be used as a ruler
	labelAreaSizeDragBar: DragBarVertical | null; // dragbar which can be used to make signal label section wider
	labelContextMenu: SignalContextMenu; // menu which appears on RMB click on signal label, containing formating options, delete etc. 

	data: WaveGraphSignal[]; // flattened list of all displayed signals
	_allData?: WaveGraphSignal; // all data which were originaly assigned to this graph

	is_first_draw: boolean = true; // flag which indicates if the graph was already drawn

	private filterPanel: SignalFilterPanel;
	private helpPanel: HelpPanel;

	constructor(svg: d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>) {
		this.svg = svg;
		svg.classed('d3-wave', true);
		this.dataG = svg.append('g');
		this.xAxis = null;
		this.yAxisG = null;
		this.xAxisG = null;
		this.waveRowX = null;
		this.waveRowY = null;
		this.verticalHelpLine = null;

		// total time range
		this.xRange = [0, 1];
		this.sizes = new WaveGraphSizes();
		this.TICKS_PER_X_AXIS = 10; // number of ticks in X (time) axis
		this.data = [];
		this._allData = undefined;

		// list of renderers for value rows
		this.rowRenderers = [
			new RowRendererBit(this),
			new RowRendererBits(this),
			new RowRendererEnum(this),
			new RowRendererLabel(this),
			new RowRendererStruct(this),
			new RowRendererArray(this),
			new RowRendererAnnotation(this),
		];
		this.timeZoom = null;
		this.labelAreaSizeDragBar = null;
		this.labelContextMenu = new SignalContextMenu(this);
		this.setSizes();
		this.treelist = null;
		this.filterPanel = new SignalFilterPanel(this);
		this.helpPanel = new HelpPanel(this);


	}

	_setZoom() {
		const timeRange = this.xRange;
		const _thisWaveGraph = this;
		this.timeZoom = d3.zoom<SVGGElement, undefined>()
			.scaleExtent([1 / Math.max(1, timeRange[1]), 1.1])
			.translateExtent([[timeRange[0], 0], [timeRange[1], 0]])
			.on('zoom', this._zoomed.bind(this));
		this.dataG.call(this.timeZoom);
	}
	_zoomed(ev: d3.D3ZoomEvent<SVGGElement, any>) {
		// https://stackoverflow.com/questions/69109270/updating-d3-zoom-behavior-from-v3
		var range = this.xRange;
		var t = ev.transform;
		var totalRange = range[1] - range[0];
		if (!this.xAxisG)
		  return;
		const domainElm = this.xAxisG.select('.domain');
		if (!domainElm)
		  return;
		const domainElmNode = domainElm.node();
		if (!domainElmNode)
		  return;
		const sizes = this.sizes;
		const xAxisScale = d3.scaleLinear()
		  .domain(this.xRange)
		  .range([0, sizes.width]);
	
		let zoomedScale = t.rescaleX(xAxisScale);
		
		const xAxis = this.xAxis;
		if (!xAxis)
		  return;
		xAxis.scale(zoomedScale);
	
		this.sizes.row.range = zoomedScale.domain() as [number, number];
		// update tick formatter becase time range has changed
		// and we may want to use a different time unit
		xAxis.tickFormat(
		  createTimeFormatterForTimeRange(this.sizes.row.range)
		);
		
		// Redibujar todo el gráfico para actualizar también las anotaciones
		this.draw();
	  }
	/*
	 * extract width/height from svg and apply margin to main "g"
	 */
	setSizes() {
		var svg = this.svg;
		var s = this.sizes;
		const _w = svg.style('width') || svg.attr('width');
		const w = parseInt(_w);
		if (!Number.isFinite(w)) {
			throw new Error('Can not resolve width of main SVG element');
		}
		var h = parseInt(svg.style('height') || svg.attr('height'));
		if (!Number.isFinite(h)) {
			throw new Error('Can not resolve height of main SVG element');
		}
		s.width = w - s.margin.left - s.margin.right;
		if (s.width <= 0) {
			throw new Error('Width too small for main SVG element ' + s.width);
		}
		s.height = h - s.margin.top - s.margin.bottom;
		if (s.height <= 0) {
			throw new Error('Height too small for main SVG element ' + s.height);
		}
		this.dataG.attr('transform',
			'translate(' + s.margin.left + ',' + s.margin.top + ')');

		if (this.treelist) {
			this.treelist.size(s.margin.left, s.height);
		}
		if (this.labelAreaSizeDragBar)
			this.labelAreaSizeDragBar.size(s.dragWidth, s.height);

	}

	drawYHelpLine() {
		const height = this.sizes.height;
		const vhl = this.verticalHelpLine;
		const svg = this.svg;
		const graph = this;

		function moveVerticalHelpLine(ev: any) {
			const svgNode = svg.node();
			if (!svgNode) {
				throw new Error("SVG Node should be constructed");
			}

			var boundingRect = svgNode.getBoundingClientRect();
			var xPos = ev.clientX - boundingRect.left - graph.sizes.margin.left; //x position within the element.
			if (xPos < 0) { xPos = 0; }
			svg.select('.vertical-help-line')
				.attr('transform', function () {
					return 'translate(' + xPos + ',0)';
				})
				.attr('y2', graph.sizes.height);
		}

		if (vhl) {
			vhl.attr('y2', height);
		} else {
			// construct new help line
			this.verticalHelpLine = this.dataG.append('line')
				.attr('class', 'vertical-help-line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x2', 0)
				.attr('y2', height);

			svg.on('mousemove', moveVerticalHelpLine);
		}
	}

	drawGridLines() {
		// simple graph with grid lines in d3v4
		// https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
		const height = this.sizes.height;
		const xAxisScale = this.waveRowX;
		if (!xAxisScale)
			return;
		const xValues = xAxisScale.ticks(this.TICKS_PER_X_AXIS)
			.map(function (d: number) {
				return xAxisScale(d);
			});
		// add the X gridlines (parallel with x axis)
		let gridLines = this.dataG.selectAll<SVGLineElement, number>('.grid-line-x')
			.data(xValues);
		if (!gridLines)
			throw new Error("Can not find grid-line-x");
		gridLines
			.enter()
			.append('line')
			.attr('class', 'grid-line-x')
			.merge(gridLines)
			.attr('x1', function (d: number) { return d; })
			.attr('y1', 0)
			.attr('x2', function (d: number) { return d; })
			.attr('y2', height);

		gridLines.exit().remove();
	}

	drawXAxis() {
		const sizes = this.sizes;
		const xAxisScale = this.waveRowX = d3.scaleLinear()
			.domain(sizes.row.range)
			.range([0, sizes.width]);

		// var axisX = g.selectAll(".axis-x")
		// https://bl.ocks.org/HarryStevens/54d01f118bc8d1f2c4ccd98235f33848
		// General Update Pattern, I https://bl.ocks.org/mbostock/3808218
		// http://bl.ocks.org/nnattawat/9054068
		var xaxisG = this.xAxisG;
		if (xaxisG) {
			// update xaxisG
			var xAxis = this.xAxis;
			if (!xAxis) {
				throw new Error("xAxis should exists if xAxisG exists");
			}
			xaxisG.call(xAxis.scale(xAxisScale));
		} else {
			// create xaxisG
			this.xAxis = d3.axisTop(xAxisScale)
				.tickFormat(
					createTimeFormatterForTimeRange(this.sizes.row.range)
				);
			this.xAxisG = this.dataG.append('g')
				.attr('class', 'axis axis-x')
				.call(this.xAxis);
		}
	}

	drawControlIcons() {
		const _this = this;
		const sizes = this.sizes;
		const ROW_Y = sizes.row.height + sizes.row.ypadding;
		// Define the div for the tooltip

		const icons = [
			{
				'icon': faQuestion,
				'tooltip': 'd3-wave help placeholder',
				'onclick': function () {
					_this.helpPanel.toggle();
				}
			},
			{
				'icon': faDownload,
				'tooltip': 'Download current screen as SVG image',
				'onclick': function () {
					const svgNode = _this.svg.node();
					if (!svgNode) {
						throw new Error("svgNode should exist");
					}
					const svg = exportStyledSvgToBlob(svgNode);
					const url = URL.createObjectURL(svg);
					window.open(url);
				}
			},
			{
				'icon': faArrowsH,
				'tooltip': 'Reset time zoom to fit screen',
				'onclick': function () {
					_this.zoomReset();
				}
			},
			{
				'icon': faFilter,
				'tooltip': 'Filter signals to display',
				'onclick': function() {
					// Implement filtering
					_this.filterPanel.toggle();
				}
			},
			{
				'icon': faRefresh,
				'tooltip': 'Regenerate deleted signals',
				'onclick': function () {
					if (_this._allData) {
						_this.bindData(_this._allData);
					} else {
						console.error("No data available to bind");
					}
					_this.draw();
				}
			},

		];

		const tooltip = new Tooltip((d) => d.tooltip);
		if (!this.yAxisG)
			throw new Error("The yAxisG should be constructed at this point")
		this.yAxisG.selectAll('text')
			.data(icons).enter()
			.append("g")
			.attr("transform", function (d, i) {
				return 'translate(' + (i * ROW_Y) + ',' + (-ROW_Y * 1) + ') scale(' + (ROW_Y / d.icon.icon[1] * 0.5) + ')';
			})
			.call(tooltip.addToElm.bind(tooltip))
			.on('click', function (ev, d) {
				if (d.onclick) {
					return d.onclick();
				}
				return null;
			})
			.append('path')
			.classed('icons', true)
			.attr('d', function (d) {
				return d.icon.icon[4];
			});
	}
	drawYAxis() {
		var sizes = this.sizes;
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		// drawWaveLabels
		this.waveRowY = d3.scaleLinear()
			.domain([0, 1])
			.range([sizes.row.height, 0]);
		// y axis
		if (!this.yAxisG) {
			// this.yaxisG.remove();
			this.yAxisG = this.svg.append('g')
				.classed('axis axis-y', true);
			this.yAxisG.attr('transform',
				'translate(0,' + (sizes.margin.top + ROW_Y / 2) + ')');
			this.drawControlIcons();

			if (this.treelist)
				this.yAxisG.call(this.treelist.draw.bind(this.treelist));
		}
		if (!this.labelAreaSizeDragBar) {
			var graph = this;
			this.labelAreaSizeDragBar = new DragBarVertical(
				this.yAxisG,
				[sizes.dragWidth, sizes.height],
				[0, sizes.width + sizes.margin.left],
				[sizes.margin.left, sizes.margin.top]
			);
			this.labelAreaSizeDragBar.onDrag(function (drag: DragBarVertical) {
				sizes.margin.left = drag.x;
				graph.setSizes();
			});
		}
	}
	// draw whole graph
	draw() {
		this.drawXAxis();
		this.drawGridLines();
		this.drawYHelpLine();
		this.drawYAxis();
	
		var sizes = this.sizes;
		var graph = this;
		// drawWaves
		// remove previously rendered row data
		this.dataG.selectAll('.value-row')
		  .remove();
	
		var valueRows = this.dataG.selectAll<SVGGElement, WaveGraphSignal>('.value-row')
		  .data(graph.data);
	
		function renderWaveRows(selection: d3.Selection<SVGGElement, WaveGraphSignal, any, any>) {
		  // Select correct renderer function based on type of data series
		  selection.each(function (this: SVGGElement, d) {
			// var name = d[0];
			const signalType = d.type;
			let data = d.data;
			if (data && data.length) {
			  const parent = d3.select(this);
			  const range = graph.sizes.row.range;
			  data = filterDataByTime(data, [Math.max(range[0], 0), Math.max(range[1], 1)]);
			  if (!signalType.renderer) {
				throw new Error("Signal must have renderer already assinged");
			  }
			  signalType.renderer.render(parent, data, signalType, signalType.formatter);

			  if (d.annotations && d.annotations.length > 0) {
				const annotationRenderer = new RowRendererAnnotation(graph);
				annotationRenderer.render(parent, data, signalType, signalType.formatter);
			  }
			  
			}
		  });
		}
		

		// move value row to it's possitionF
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		valueRows.enter()
		  .append('g')
		  .attr('class', 'value-row')
		  .merge(valueRows)
		  .call(renderWaveRows)
		  .attr('transform', (d, i) => 'translate(0,' + (i * ROW_Y) + ')');
		
		this.compareAndAnnotateSignals();


	}

	addChildSignal(parentSignalName: string, newSignalData: WaveGraphSignal, removedSignals: string[]) {
		if (!this._allData) {
			//console.error("No data available to add a child signal");
			throw new Error("No data available to add a child signal");
		}

	
		//console.log(`Searching for parent signal with name: ${parentSignalName}`);
	
		function findSignalByName(signal: WaveGraphSignal, name: string): WaveGraphSignal | null {
			if (signal.name === name) {
				return signal;
			}
			if (signal.children) {
				for (const child of signal.children) {
					const found = findSignalByName(child, name);
					if (found) {
						return found;
					}
				}
			}
			return null;
		}
	
		const parentSignal = findSignalByName(this._allData, parentSignalName);
		if (!parentSignal) {
			//console.error(`Parent signal with name ${parentSignalName} not found`);
			throw new Error(`Parent signal with name ${parentSignalName} not found`);
		}
	
		//console.log(`Parent signal found: ${parentSignal.name}`);
	
		if (!parentSignal.children) {
			parentSignal.children = [];
		}
	
		// Extraer los valores de la señal
		const signalDataString = newSignalData.data.toString();
		const dataEntries = signalDataString.split(',');
	
		// Determinar la cantidad de bits en los valores binarios
		const firstBinaryValue = dataEntries.find(entry => entry.startsWith('b'));
		if (!firstBinaryValue) {
			console.error("No valid binary signal data found.");
			return;
		}
		const bitCount = firstBinaryValue.length - 1;

	
		// Crear estructuras para cada señal de bit
		let bitSignals: WaveGraphSignal[] = [];
		for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
			bitSignals.push({
				name: `${newSignalData.name}_bit${bitIndex}`,
				data: [],
				type: {
					width: 1,
					name: 'wire',
					formatter: undefined,
					renderer: new RowRendererBit(this)
				},
				isBrokenDown: true,
			});
		}
	
		// Llenar los datos de cada bit con [time, bitValue, 0]
		for (let i = 0; i < dataEntries.length; i += 2) {
			const time = Number(dataEntries[i]);
			const binaryValue = dataEntries[i + 1]?.substring(1); // Remueve la 'b'
	
			if (binaryValue) {
				for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
					const bitValue = binaryValue[bitCount - 1 - bitIndex] ?? 'X'; // Manejar valores desconocidos
					bitSignals[bitIndex].data.push([time, bitValue, 0]);
				}
			} else {
				console.warn(`Missing binary value for time: ${time}`);
			}
		}
		

		// Agregar las señales hijas al padre
		parentSignal.children.push(...bitSignals);

		this.data.push(...bitSignals);
		//search in this.data the parent signal and add the new bitSignals

		//console.warn(`removedSignals: ${removedSignals.toString()}`);

		let _allData2 = this._allData;
		
		this.treelist?.data(this._allData);
		//filter the removed data by using the function treelist.filter
		this.treelist?.filter((d) => {
			return !removedSignals.includes(d.name);
		});
		this._allData = _allData2;
		this.draw();
	
		// Mostrar los datos generados
		/*bitSignals.forEach(sig => {
			console.log(`Generated signal: ${sig.name}`);
			console.log(`Data: ${JSON.stringify(sig.data)}`);
		});*/
		// Actualizar los datos en la visualización
		//this.bindData(this._allData);
	}
		
	
	
	bindData(_signalData: WaveGraphSignal) {
		if (_signalData.constructor !== Object) {
			throw new Error('Data in invalid format (should be dictionary and is ' + _signalData + ')');
		}
		this._allData = _signalData;
		var maxT = 0;
		const rowRenderers = this.rowRenderers;
		function findRendererAndDiscoverMaxT(d: WaveGraphSignal) {
			const dData = d.data;
			if (dData && dData.length) {
				const lastTimeInData = dData[dData.length - 1][0];
				maxT = Math.max(maxT, lastTimeInData);
			}
			const signalType = d.type;
			for (const renderer of rowRenderers) {
				if (renderer.select(signalType)) {
					var formatter = signalType.formatter;
					if (!formatter) {
						formatter = renderer.DEFAULT_FORMAT;
					} else if (typeof formatter === 'string') {
						formatter = renderer.FORMATTERS[formatter];
						if (!formatter) {
							throw new Error("Formatter value invalid " + signalType.formatter + "(" + d.name + ")");
						}
					}
					signalType.formatter = formatter;
					signalType.renderer = renderer;
					break;
				}
			}
			if (!signalType.renderer) {
				throw new Error('None of installed renderers supports signalType:' + signalType);
			}

			(d.children || d._children || []).forEach(findRendererAndDiscoverMaxT);
		}
		findRendererAndDiscoverMaxT(this._allData);

		var sizes = this.sizes;
		this.xRange[1] = sizes.row.range[1] = maxT;
		this._setZoom();
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		var graph = this;
		if (!this.treelist) {
			this.treelist = new TreeList(ROW_Y, this.labelContextMenu);
			this.treelist
				.onChange(function (selection: d3.HierarchyNode<WaveGraphSignal>[]) {
					graph.data = selection.map((d) => { return d.data; });
					graph.draw();
				});
		}
		this.setSizes();
		if (!this.treelist)
			throw new Error("treelist should be already allocated");
		this.treelist.data(this._allData);

		//this.labelContextMenu.autoBreakDownSignals();
		//this.labelContextMenu.autoBreakDownSignals();
		
	}
	zoomReset() {
		if (!this.timeZoom)
			throw new Error("timeZoom was not initialized");
		this.dataG.call(this.timeZoom.transform, d3.zoomIdentity)
	}
	//zoomToTimeRange(start: number, end: number) {
	//	if (!this.timeZoom)
	//		throw new Error("timeZoom was not initialized");
	//	d3.zoomTransform
	//	this.dataG.call(this.timeZoom.scaleBy, d3.zoomIdentity)
	//}
	// Modifica el método compareAndAnnotateSignals para detectar rangos de diferencias

	compareAndAnnotateSignals(): void {
		if (!this._allData) {
			console.error("No data available to compare signals");
			return;
		}
	  
		// Recopilar todas las señales
		const allSignals = this.getAllSignals(this._allData);
		
		// Buscar todas las señales con asterisco en su nombre
		const starSignals = allSignals.filter(signal => signal.name.endsWith('*'));
		
		// Para cada señal con asterisco, encontrar su correspondiente sin asterisco
		starSignals.forEach(starSignal => {
			const baseName = starSignal.name.substring(0, starSignal.name.length - 1);
			const baseSignal = allSignals.find(signal => signal.name === baseName);
			
			if (baseSignal) {
				//console.log(`Comparing signals: ${baseSignal.name} and ${starSignal.name}`);
				// Comparar y anotar las diferencias entre las señales
				this.compareSignalPair(baseSignal, starSignal);
			}
		});
	}
	
	// Método para obtener todas las señales en una estructura plana
	private getAllSignals(signal: WaveGraphSignal): WaveGraphSignal[] {
		let result: WaveGraphSignal[] = [signal];
		
		if (signal.children) {
			for (const child of signal.children) {
				result = result.concat(this.getAllSignals(child));
			}
		}
		
		return result;
	}
	
	// Método para comparar una pareja de señales
	private compareSignalPair(signalBase: WaveGraphSignal, signalStar: WaveGraphSignal): void {
		// Reiniciar las anotaciones anteriores para S* en lugar de S
		signalStar.annotations = [];
	
		// Asegurarnos de que tenemos datos
		if (!signalBase.data.length || !signalStar.data.length) {
			console.warn(`One or both signals have no data points: ${signalBase.name}, ${signalStar.name}`);
			return;
		}
	
		if (signalBase.type.width == 1 && signalStar.type.width == 1) {
			this.compareUnibitSignals(signalBase, signalStar);
		} else {
			this.compareMultibitSignals(signalBase, signalStar);
		}
	}
	
	// Método para comparar señales de un solo bit
	private compareUnibitSignals(signalBase: WaveGraphSignal, signalStar: WaveGraphSignal): void {
			// Usar el rango de tiempo actual para extender el último diff correctamente
			const visibleEndTime = this.sizes.row.range[1];
		
			if(signalStar.annotations === undefined) {
				signalStar.annotations = [];
			}
			
			// Crear una lista combinada de todos los puntos de tiempo donde hay cambios en cualquier señal
			const allTimePoints = new Set<number>();
			signalBase.data.forEach(d => allTimePoints.add(d[0]));
			signalStar.data.forEach(d => allTimePoints.add(d[0]));
			
			// Ordenar los puntos de tiempo
			const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
			
			let inDiffRange = false;
			let diffStartTime = 0;
			
			// Para cada punto de tiempo, obtener el valor de cada señal en ese momento
			for (let i = 0; i < sortedTimePoints.length; i++) {
				const currentTime = sortedTimePoints[i];
				
				// Obtener el valor de la señal base en este punto de tiempo
				const valueBase = this.getValueAtTime(signalBase.data, currentTime);
				
				// Obtener el valor de la señal star en este punto de tiempo
				const valueStar = this.getValueAtTime(signalStar.data, currentTime);
				
				const isDifferent = valueBase !== valueStar;
				
				// Comenzar un nuevo rango de diferencia
				if (isDifferent && !inDiffRange) {
					diffStartTime = currentTime;
					inDiffRange = true;
				}
				// Finalizar un rango de diferencia existente
				else if (!isDifferent && inDiffRange) {
					signalStar.annotations.push({
						time: (diffStartTime + currentTime) / 2,
						startTime: diffStartTime,
						endTime: currentTime,
						text: "",
						color: "#FF0000"
					});
					inDiffRange = false;
				}
				
				// Si es el último punto y todavía estamos en un rango de diferencia
				if (i === sortedTimePoints.length - 1 && inDiffRange) {
					signalStar.annotations.push({
						time: (diffStartTime + visibleEndTime) / 2,
						startTime: diffStartTime,
						endTime: visibleEndTime,
						text: "",
						color: "#FF0000"
					});
				}
			}
			
			// Ajustar las anotaciones al rango visible
			this.adjustAnnotationsToVisibleRange(signalStar.annotations);
		}
	
	// Método para comparar señales multi-bit
	private compareMultibitSignals(signalBase: WaveGraphSignal, signalStar: WaveGraphSignal): void {
		// Reiniciar las anotaciones anteriores
		signalStar.annotations = [];
	
		// Usar el rango de tiempo actual para extender el último diff correctamente
		const visibleEndTime = this.sizes.row.range[1];
		
		// Crear una lista combinada de todos los puntos de tiempo donde hay cambios en cualquier señal
		const allTimePoints = new Set<number>();
		signalBase.data.forEach(d => allTimePoints.add(d[0]));
		signalStar.data.forEach(d => allTimePoints.add(d[0]));
		
		// Ordenar los puntos de tiempo
		const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
		
		let inDiffRange = false;
		let diffStartTime = 0;
		
		// Para cada punto de tiempo, obtener el valor de cada señal en ese momento
		for (let i = 0; i < sortedTimePoints.length; i++) {
			const currentTime = sortedTimePoints[i];
			
			// Obtener el valor de la señal base en este punto de tiempo
			const valueBase = this.getValueAtTime(signalBase.data, currentTime);
			
			// Obtener el valor de la señal star en este punto de tiempo
			const valueStar = this.getValueAtTime(signalStar.data, currentTime);
			
			const isDifferent = valueBase !== valueStar;
			
			// Comenzar un nuevo rango de diferencia
			if (isDifferent && !inDiffRange) {
				diffStartTime = currentTime;
				inDiffRange = true;
			}
			// Finalizar un rango de diferencia existente
			else if (!isDifferent && inDiffRange) {
				signalStar.annotations.push({
					time: (diffStartTime + currentTime) / 2,
					startTime: diffStartTime,
					endTime: currentTime,
					text: "", // Texto vacío para señales multi-bit
					color: "#FF0000"
				});
				inDiffRange = false;
			}
			
			// Si es el último punto y todavía estamos en un rango de diferencia
			if (i === sortedTimePoints.length - 1 && inDiffRange) {
				signalStar.annotations.push({
					time: (diffStartTime + visibleEndTime) / 2,
					startTime: diffStartTime,
					endTime: visibleEndTime,
					text: "",
					color: "#FF0000"
				});
			}
		}
		
		// Ajustar las anotaciones al rango visible
		this.adjustAnnotationsToVisibleRange(signalStar.annotations);
		
		// Comparar las señales hijas si ambas tienen hijos
		if (signalBase.children && signalStar.children) {
			this.compareChildSignals(signalBase, signalStar);
		}
	}
	
	// Método para ajustar las anotaciones al rango visible
	private adjustAnnotationsToVisibleRange(annotations: Array<{time: number, text: string, color: string, startTime?: number, endTime?: number}>): void {
		const visibleStartTime = Math.max(0, this.sizes.row.range[0]);
		
		annotations.forEach(annotation => {
			if (annotation.startTime !== undefined && annotation.startTime < visibleStartTime) {
				annotation.startTime = visibleStartTime;
			}
		});
	}
	
	compareChildSignals(signalS: WaveGraphSignal, signalStar: WaveGraphSignal): void {

		if (!signalS.children || !signalStar.children) {
			return;
		}
		
		// Comparar cada señal bit a bit
		for (let i = 0; i < signalStar.children.length; i++) {
			const bitSignalStar = signalStar.children[i];
			// Buscar la señal correspondiente en S
			const bitIndexMatch = bitSignalStar.name.match(/_bit(\d+)$/);
			if (!bitIndexMatch) continue;
			
			const bitIndex = bitIndexMatch[1];
			const bitSignalS = signalS.children.find(child => 
				child.name.includes(`_bit${bitIndex}`)
			);
			
			if (!bitSignalS) continue;
			
			// Reiniciar las anotaciones
			bitSignalStar.annotations = [];
			
			// Crear una lista combinada de todos los puntos de tiempo
			const allTimePoints = new Set<number>();
			bitSignalS.data.forEach(d => allTimePoints.add(d[0]));
			bitSignalStar.data.forEach(d => allTimePoints.add(d[0]));
			
			// Ordenar los puntos de tiempo
			const sortedTimePoints = Array.from(allTimePoints).sort((a, b) => a - b);
			
			let inDiffRange = false;
			let diffStartTime = 0;
			const visibleEndTime = this.sizes.row.range[1];
			
			// Para cada punto de tiempo, obtener el valor de cada señal
			for (let j = 0; j < sortedTimePoints.length; j++) {
				const currentTime = sortedTimePoints[j];
				
				// Obtener el valor de la señal base en este punto de tiempo
				const valueS = this.getValueAtTime(bitSignalS.data, currentTime);
				
				// Obtener el valor de la señal star en este punto de tiempo
				const valueStar = this.getValueAtTime(bitSignalStar.data, currentTime);
				
				const isDifferent = valueS !== valueStar;
				
				// Comenzar un nuevo rango de diferencia
				if (isDifferent && !inDiffRange) {
					diffStartTime = currentTime;
					inDiffRange = true;
				}
				// Finalizar un rango de diferencia existente
				else if (!isDifferent && inDiffRange) {
					bitSignalStar.annotations.push({
						time: (diffStartTime + currentTime) / 2,
						startTime: diffStartTime,
						endTime: currentTime,
						text: "",
						color: "#FF0000"
					});
					inDiffRange = false;
				}
				
				// Si es el último punto y todavía estamos en un rango de diferencia
				if (j === sortedTimePoints.length - 1 && inDiffRange) {
					bitSignalStar.annotations.push({
						time: (diffStartTime + visibleEndTime) / 2,
						startTime: diffStartTime,
						endTime: visibleEndTime,
						text: "",
						color: "#FF0000"
					});
				}
			}
		}
	}
	  
	  // Método auxiliar para encontrar el valor más cercano antes de un tiempo dado
	  findClosestValueBefore(data: any[], time: number): any {
		let closestTime = -Infinity;
		let closestValue = null;
		
		for (const point of data) {
		  if (point[0] <= time && point[0] > closestTime) {
			closestTime = point[0];
			closestValue = point[1];
		  }
		}
		
		return closestValue;
	  }
  
	  // Método para obtener el valor de una señal en un tiempo específico
	  private getValueAtTime(data: any[], time: number): any {
		// Si el tiempo es exactamente igual a un punto de datos, devolver ese valor
		const exactMatch = data.find(d => d[0] === time);
		if (exactMatch) {
			return exactMatch[1];
		}
		
		// Si no hay un punto exacto, buscar el valor más reciente antes de ese tiempo
		return this.findClosestValueBefore(data, time);
	}
  
  
}