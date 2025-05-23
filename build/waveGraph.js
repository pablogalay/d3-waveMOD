import * as d3 from 'd3';
import { filterDataByTime } from './filterData';
import { RowRendererBit } from './rowRenderers/bit';
import { RowRendererBits } from './rowRenderers/bits';
import { RowRendererEnum } from './rowRenderers/enum';
import { RowRendererLabel } from './rowRenderers/label';
import { RowRendererStruct } from './rowRenderers/struct';
import { RowRendererArray } from './rowRenderers/array';
import { createTimeFormatterForTimeRange } from './timeFormat';
import { TreeList } from './treeList';
import { faQuestion, faDownload, faArrowsH, faFilter } from '@fortawesome/free-solid-svg-icons';
import { DragBarVertical } from './dragBar';
import { exportStyledSvgToBlob } from './exportSvg';
import { SignalContextMenu } from './signalLabelContextMenu';
import { Tooltip } from './tooltip';
import { WaveGraphSizes } from './sizes';
import './d3-wave.css';
// main class which constructs the signal wave viewer
export class WaveGraph {
    constructor(svg) {
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
        ];
        this.timeZoom = null;
        this.labelAreaSizeDragBar = null;
        this.labelContextMenu = new SignalContextMenu(this);
        this.setSizes();
        this.treelist = null;
    }
    _setZoom() {
        const timeRange = this.xRange;
        const _thisWaveGraph = this;
        this.timeZoom = d3.zoom()
            .scaleExtent([1 / Math.max(1, timeRange[1]), 1.1])
            .translateExtent([[timeRange[0], 0], [timeRange[1], 0]])
            .on('zoom', this._zoomed.bind(this));
        this.dataG.call(this.timeZoom);
    }
    _zoomed(ev) {
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
        //if (zoomedScale.domain()[0] < 0) {
        //	zoomedScale.domain([0, Math.max(zoomedScale.domain()[1], 0)])
        //}
        const xAxis = this.xAxis;
        if (!xAxis)
            return;
        xAxis.scale(zoomedScale);
        this.sizes.row.range = zoomedScale.domain();
        // update tick formatter becase time range has changed
        // and we may want to use a different time unit
        xAxis.tickFormat(createTimeFormatterForTimeRange(this.sizes.row.range));
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
        this.dataG.attr('transform', 'translate(' + s.margin.left + ',' + s.margin.top + ')');
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
        function moveVerticalHelpLine(ev) {
            const svgNode = svg.node();
            if (!svgNode) {
                throw new Error("SVG Node should be constructed");
            }
            var boundingRect = svgNode.getBoundingClientRect();
            var xPos = ev.clientX - boundingRect.left - graph.sizes.margin.left; //x position within the element.
            if (xPos < 0) {
                xPos = 0;
            }
            svg.select('.vertical-help-line')
                .attr('transform', function () {
                return 'translate(' + xPos + ',0)';
            })
                .attr('y2', graph.sizes.height);
        }
        if (vhl) {
            vhl.attr('y2', height);
        }
        else {
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
            .map(function (d) {
            return xAxisScale(d);
        });
        // add the X gridlines (parallel with x axis)
        let gridLines = this.dataG.selectAll('.grid-line-x')
            .data(xValues);
        if (!gridLines)
            throw new Error("Can not find grid-line-x");
        gridLines
            .enter()
            .append('line')
            .attr('class', 'grid-line-x')
            .merge(gridLines)
            .attr('x1', function (d) { return d; })
            .attr('y1', 0)
            .attr('x2', function (d) { return d; })
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
        }
        else {
            // create xaxisG
            this.xAxis = d3.axisTop(xAxisScale)
                .tickFormat(createTimeFormatterForTimeRange(this.sizes.row.range));
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
                'tooltip': 'd3-wave help placeholder[TODO]',
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
                'onclick': function () {
                }
            }
        ];
        const tooltip = new Tooltip((d) => d.tooltip);
        if (!this.yAxisG)
            throw new Error("The yAxisG should be constructed at this point");
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
            this.yAxisG.attr('transform', 'translate(0,' + (sizes.margin.top + ROW_Y / 2) + ')');
            this.drawControlIcons();
            if (this.treelist)
                this.yAxisG.call(this.treelist.draw.bind(this.treelist));
        }
        if (!this.labelAreaSizeDragBar) {
            var graph = this;
            this.labelAreaSizeDragBar = new DragBarVertical(this.yAxisG, [sizes.dragWidth, sizes.height], [0, sizes.width + sizes.margin.left], [sizes.margin.left, sizes.margin.top]);
            this.labelAreaSizeDragBar.onDrag(function (drag) {
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
        var valueRows = this.dataG.selectAll('.value-row')
            .data(graph.data);
        function renderWaveRows(selection) {
            // Select correct renderer function based on type of data series
            selection.each(function (d) {
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
                }
            });
        }
        // move value row to it's possition
        var ROW_Y = sizes.row.height + sizes.row.ypadding;
        valueRows.enter()
            .append('g')
            .attr('class', 'value-row')
            .merge(valueRows)
            .call(renderWaveRows)
            .attr('transform', (d, i) => 'translate(0,' + (i * ROW_Y) + ')');
    }
    bindData(_signalData) {
        if (_signalData.constructor !== Object) {
            throw new Error('Data in invalid format (should be dictionary and is ' + _signalData + ')');
        }
        this._allData = _signalData;
        var maxT = 0;
        const rowRenderers = this.rowRenderers;
        function findRendererAndDiscoverMaxT(d) {
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
                    }
                    else if (typeof formatter === 'string') {
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
                .onChange(function (selection) {
                graph.data = selection.map((d) => { return d.data; });
                graph.draw();
            });
        }
        this.setSizes();
        if (!this.treelist)
            throw new Error("treelist should be already allocated");
        this.treelist.data(this._allData);
    }
    zoomReset() {
        if (!this.timeZoom)
            throw new Error("timeZoom was not initialized");
        this.dataG.call(this.timeZoom.transform, d3.zoomIdentity);
    }
}
//# sourceMappingURL=waveGraph.js.map