(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3'), require('@fortawesome/free-solid-svg-icons')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3', '@fortawesome/free-solid-svg-icons'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.d3 = global.d3 || {}, global.d3, global["free-solid-svg-icons"]));
})(this, (function (exports, d3, freeSolidSvgIcons) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

    class RowRendererBase {
        constructor(waveGraph) {
            this.waveGraph = waveGraph;
            this.FORMATTERS = {};
            this.DEFAULT_FORMAT = undefined;
        }
        /*eslint no-unused-vars: ["error", { "args": "none" }]*/
        select(typeInfo) {
            throw new Error('Should be overriden in class implementation');
        }
        render(parent, data, typeInfo, formatter) {
            var waveRowHeight = this.waveGraph.sizes.row.height;
            // var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
            var waveRowX = this.waveGraph.waveRowX;
            if (!waveRowX)
                throw new Error("waveRowX on waveGraph must be initialized");
            parent
                .selectAll('.value-background')
                .remove()
                .exit()
                .data([typeInfo])
                .enter()
                .append("rect")
                .attr('class', 'value-background')
                .attr('x', -2)
                .attr('width', this.waveGraph.sizes.width)
                .attr('height', waveRowHeight + 4)
                .classed('selected', (d) => !!d.isSelected);
        }
    }

    const NUM_FORMATS = {
        'b': 2,
        'o': 8,
        'd': 10,
        'x': 16
    };
    function genFormatter(newBase) {
        return function (d) {
            if (typeof d === 'number')
                return d.toString(newBase);
            if (d === "X" || d === "Z" || d === "W" || d === "U" || d === "L" || d === "H" || d === "_") {
                return d;
            }
            let baseChar = d[0];
            d = d.substring(1);
            let base = NUM_FORMATS[baseChar];
            if (base === newBase) {
                return d;
            }
            d = d.toUpperCase();
            let containsXZWULH_ = /[XZWULH_]/.test(d);
            if (containsXZWULH_ && newBase === 10) {
                return d;
            }
            let origD = d;
            if (containsXZWULH_) {
                // remove XZWULH_ chars from d
                d = d.replace(/X|Z|W|U|L|H|_/g, '');
                if (d === '') {
                    return 'X';
                } // all invalid digits
            }
            let num = BigInt('0' + baseChar + d).toString(newBase);
            if (newBase === 2) {
                newBase = 1;
            }
            if (base === 2) {
                base = 1;
            }
            if (containsXZWULH_) {
                let _num = [];
                for (let i = 0; i < num.length; i++) {
                    _num.push(num[i]);
                }
                // set digits which are not valid to X
                if (base < newBase) {
                    // e.g. bin -> hex
                    let digitRatio = newBase / base;
                    for (let i = 0; i < num.length; i++) {
                        let offset = i * digitRatio;
                        for (var i2 = 0; i2 < digitRatio; i2++) {
                            if (origD[offset + i2] === 'X') {
                                // invalidate corresponding digit if there was a X in original value
                                _num[i] = 'X';
                                break;
                            }
                        }
                    }
                }
                else {
                    // e.g. hex -> bin
                    let digitRatio = base / newBase;
                    for (let i = 0; i < origD.length; i++) {
                        if (origD[i] === 'X') {
                            let end = i * digitRatio;
                            // invalidate all corresponding digits if there was a X in original value
                            for (let i2 = i * digitRatio; i2 < end; i2++) {
                                _num[i2] = 'X';
                            }
                        }
                    }
                }
                num = _num.join('');
            }
            return num;
        };
    }
    function genVectorFormatter(newBase) {
        var itemFormat = genFormatter(newBase);
        return function (d) {
            if (typeof d === 'string')
                return itemFormat(d);
            // @param d: [[index list], value]
            var buff = [];
            var indexes = d[0];
            indexes.forEach(function (i) {
                buff.push("[");
                buff.push(i);
                buff.push("]");
            });
            buff.push("=");
            buff.push(itemFormat(d[1]));
            return buff.join("");
        };
    }
    const SCALAR_FORMAT = {
        "UINT_BIN": genFormatter(2),
        "UINT_OCT": genFormatter(8),
        "UINT_DEC": genFormatter(10),
        "UINT_HEX": genFormatter(16),
    };
    const VECTOR_FORMAT = {
        "UINT_BIN": genVectorFormatter(2),
        "UINT_OCT": genVectorFormatter(8),
        "UINT_DEC": genVectorFormatter(10),
        "UINT_HEX": genVectorFormatter(16)
    };

    /**
     * A renderer for bit vector value rows.
     * Value is supposed to be a number or based string without leading 0 (eg. "x10" instead of "0x10" )
     */
    class RowRendererBits extends RowRendererBase {
        constructor(waveGraph) {
            super(waveGraph);
            this.FORMATTERS = SCALAR_FORMAT;
            this.DEFAULT_FORMAT = SCALAR_FORMAT.UINT_HEX;
        }
        select(typeInfo) {
            return typeInfo.name === 'wire' && typeInfo.width > 1;
        }
        isValid(d) {
            return !/[XZWULH_]/.test(d[1]);
        }
        /*eslint no-unused-vars: ["error", { "args": "none" }]*/
        render(parent, data, typeInfo, formatter) {
            super.render(parent, data, typeInfo, formatter);
            var waveRowHeight = this.waveGraph.sizes.row.height;
            var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
            var waveRowX = this.waveGraph.waveRowX;
            if (!waveRowX)
                throw new Error("waveRowX on waveGraph must be initialized");
            if (!formatter || typeof formatter === 'string')
                throw new Error("Unsupported formater");
            var rect = parent.selectAll('g .value-rect')
                .remove()
                .exit()
                .data(data);
            var newRects = rect.enter()
                .append('g');
            var renderer = this;
            newRects
                .attr('transform', function (d) {
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                var t = waveRowX(d[0]);
                return 'translate(' + [t, 0] + ')';
            })
                .attr('class', function (d) {
                if (renderer.isValid(d)) {
                    return 'value-rect value-rect-valid';
                }
                return 'value-rect value-rect-invalid';
            });
            var x0 = waveRowX.domain()[0];
            // can not use index from d function because it is always 0
            newRects.append('path')
                .attr('d', function (d) {
                var duration = d[2];
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                var right = waveRowX(x0 + duration);
                var top = waveRowHeight;
                if (right < 0) {
                    throw new Error(`${right}, ${d}`);
                }
                //  <==> like shape
                var edgeW = 2;
                return 'M ' + [0, top / 2] +
                    ' L ' + [edgeW, top] +
                    ' L ' + [right - edgeW, top] +
                    ' L ' + [right, top / 2] +
                    ' L ' + [right - edgeW, 0] +
                    ' L ' + [edgeW, 0] + ' Z';
            });
            // can not use index from d function because it is always 0
            newRects.append('text')
                .attr('x', function (d) {
                var duration = d[2];
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                var x = waveRowX(x0 + duration / 2);
                if (x < 0) {
                    throw new Error(x.toString());
                }
                return x;
            })
                .attr('y', waveRowHeight / 2 + waveRowYpadding)
                .text(function (d) {
                let fontSizeStr = window.getComputedStyle(this).fontSize;
                let fontSize = NaN;
                if (fontSizeStr === "") {
                    // default font size
                    fontSize = 16;
                }
                else if (fontSizeStr.substr(fontSizeStr.length - 2) !== "px") {
                    throw new Error(fontSizeStr);
                }
                else {
                    fontSize = Number(fontSizeStr.substr(0, fontSizeStr.length - 2));
                }
                var formatedText = formatter(d[1]);
                var duration = d[2];
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                var width = waveRowX(x0 + duration) - waveRowX(x0);
                if (width < 0) {
                    throw new Error(`${x0}, ${duration}, ${width}`);
                }
                if (formatedText.length * fontSize > width) {
                    var chars = Math.ceil(width / fontSize);
                    return formatedText.substr(0, chars);
                }
                return formatedText;
            });
        }
    }

    const STRING_FORMAT = {
        "STRING": (d) => d.toString(),
    };
    /**
     * A renderer for enum value rows, enum value is a string, "" is resolved as invalid value
     * and is rendered with red color
     */
    class RowRendererEnum extends RowRendererBits {
        constructor(waveGraph) {
            super(waveGraph);
            this.FORMATTERS = STRING_FORMAT;
            this.DEFAULT_FORMAT = STRING_FORMAT.STRING;
        }
        select(typeInfo) {
            return typeInfo.name === 'enum';
        }
        isValid(d) {
            return d[1] !== '';
        }
    }

    /**
     * A renderer for a label which poses no data and it is only a form of separator between value rows
     */
    class RowRendererLabel extends RowRendererBase {
        select(typeInfo) {
            return typeInfo.name === 'label';
        }
    }

    /**
     * Reneers nothig, it is used for hierarchical signals as a parent container.
     */
    class RowRendererStruct extends RowRendererBase {
        select(typeInfo) {
            return typeInfo.name === 'struct';
        }
    }

    class SignalLabelManipulation {
        constructor(ROW_Y, signalList) {
            this.previouslyClicked = null;
            this.signalList = signalList;
            this.labels = null;
            this.ROW_Y = ROW_Y;
            this.dropLocator = null;
        }
        resolveInsertTarget(y) {
            var _a;
            let targetParentNode = null;
            let onParentI = 0;
            const nodes = this.signalList.visibleNodes();
            if (y < 0) {
                throw new Error();
            }
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                const isUpperHalfOfTheRow = y > n.y && y <= n.y + this.ROW_Y * 0.5;
                if (isUpperHalfOfTheRow && n.parent) {
                    // position in upper half of the row
                    // insert before n (parent is checked to exists)
                    const siblings = n.parent.children;
                    targetParentNode = n.parent;
                    if (!siblings)
                        throw new Error("siblings must be specified because we are searching in siblings");
                    onParentI = siblings.indexOf(n);
                    break;
                }
                else if (y <= n.y + this.ROW_Y) {
                    // insert after
                    // if n is hierarchical insert into
                    if (n.children) {
                        targetParentNode = n;
                        onParentI = 0;
                        break;
                    }
                    else {
                        targetParentNode = n.parent;
                        if (!targetParentNode)
                            throw new Error("Parent must be specified because we are searching in siblings");
                        const siblings = targetParentNode.children;
                        if (!siblings)
                            throw new Error("siblings must be specified because we are searching in siblings");
                        onParentI = siblings.indexOf(n) + 1;
                        break;
                    }
                }
            }
            if (!targetParentNode) {
                targetParentNode = nodes[0];
                onParentI = ((_a = targetParentNode.children) === null || _a === void 0 ? void 0 : _a.length) || 0;
            }
            return [targetParentNode, onParentI];
        }
        // select and de-select all "g"
        // signal labels dragging, reordering
        dragStarted(ev, elm, d) {
            // move to front to make it virtually on top of all others
            elm.raise();
            // d = index of clicked signal
            var current = d;
            var currentlySelected = current.data.type.isSelected;
            var shiftKey = ev.sourceEvent.shiftKey;
            if (shiftKey && this.previouslyClicked) {
                // select all between last selected and clicked
                // de-select all
                if (this.signalList) {
                    var prevId = this.previouslyClicked.id;
                    this.signalList.visibleNodes().forEach(function (d) {
                        const i = d.id;
                        const curId = current.id;
                        if (prevId < curId) {
                            d.data.type.isSelected = prevId <= i && i <= curId;
                        }
                        else {
                            d.data.type.isSelected = prevId >= i && i >= curId;
                        }
                    });
                }
                if (this.labels)
                    this.labels.classed('selected', (d) => !!d.data.type.isSelected);
                return;
            }
            var altKey = ev.sourceEvent.altKey;
            if (!altKey) {
                if (this.signalList) {
                    this.signalList.visibleNodes().forEach(function (d) {
                        d.data.type.isSelected = false;
                    });
                }
            }
            // toggle selection
            current.data.type.isSelected = !currentlySelected;
            if (this.labels) {
                this.labels.classed('selected', (d) => !!d.data.type.isSelected);
            }
        }
        /* take ale  */
        _getXYforItemOnIndex(parentItem, i) {
            var _a;
            const children = parentItem.children;
            if (!children || children.length == 0 || i == 0)
                return [parentItem.x, parentItem.y];
            else if (i < children.length) {
                const c = children[i];
                return [c.x, c.y];
            }
            else {
                if (i != children.length)
                    throw new Error("Must be append or in children");
                let lastItem = children[children.length - 1];
                while ((_a = lastItem.children) === null || _a === void 0 ? void 0 : _a.length) {
                    lastItem = lastItem.children[lastItem.children.length - 1];
                }
                return [parentItem.x, (lastItem.y || 0) + this.ROW_Y];
            }
        }
        dragged(ev, elm, d) {
            const labelG = this.signalList.labelG;
            if (!labelG)
                throw new Error("labelG must be constructed before labels");
            let dropLocator = this.dropLocator;
            if (!dropLocator) {
                this.dropLocator = dropLocator = labelG.append("g");
                dropLocator.attr('class', 'drop-locator');
                const rect = dropLocator.append('rect');
                rect.attr('height', 4)
                    .attr('width', this.signalList.width || 10)
                    .style('fill', 'blue');
            }
            const [insParent, insIndex] = this.resolveInsertTarget(ev.y);
            let [insPointX, insPointY] = this._getXYforItemOnIndex(insParent ? insParent : this.signalList.root, insIndex || 0);
            dropLocator.attr('transform', `translate(${insPointX}, ${insPointY})`);
            elm.attr('transform', `translate(${d.x}, ${ev.y})`);
        }
        regenerateDepth(d) {
            var offset = d.depth;
            (d.children || []).forEach((d2) => {
                d2.depth = offset + 1;
                this.regenerateDepth(d2);
            });
        }
        dragEnded(ev, elm, d) {
            var _a;
            // move to front to make it virtually on top of all others
            elm.lower();
            let dropLocator = this.dropLocator;
            if (dropLocator) {
                dropLocator.remove();
                this.dropLocator = null;
            }
            const insertTarget = this.resolveInsertTarget(ev.y);
            const shiftKey = ev.sourceEvent.shiftKey;
            if (!(this.previouslyClicked != null && shiftKey) && d.data.type.isSelected) {
                this.previouslyClicked = d;
            }
            else {
                this.previouslyClicked = null;
            }
            // check if inserting to it self
            var newParent = insertTarget[0];
            var newIndex = insertTarget[1];
            var _newParent = newParent;
            var insertingToItself = false;
            while (_newParent) {
                if (_newParent === d) {
                    insertingToItself = true;
                    break;
                }
                _newParent = _newParent.parent;
            }
            if (!insertingToItself && (newParent !== d.parent ||
                (d.parent && d.parent.children && newIndex !== d.parent.children.indexOf(d)))) {
                // moving on new place
                elm.classed('selected', false);
                d.data.type.isSelected = false;
                // insert on new place (we do it first, because we do not want to break indexing)
                var oldSiblings = ((_a = d.parent) === null || _a === void 0 ? void 0 : _a.children) || [];
                var oldIndex = oldSiblings.indexOf(d);
                var newSiblings = insertTarget[0].children || [];
                newSiblings.splice(newIndex, 0, d);
                // remove from original possition
                if (newSiblings === oldSiblings && newIndex < oldIndex) {
                    oldIndex += 1;
                }
                oldSiblings.splice(oldIndex, 1);
                d.parent = insertTarget[0];
                d.depth = d.parent.depth + 1;
                this.regenerateDepth(d);
                if (this.signalList) {
                    this.signalList.update();
                }
            }
            else {
                // put label back to it's original possition
                elm.attr('transform', `translate(${d.x}, ${d.y})`);
            }
        }
        registerDrag(labels) {
            var _this = this;
            this.labels = labels;
            labels.call(d3__namespace.drag()
                .on('start', function (ev, d) {
                return _this.dragStarted(ev, d3__namespace.select(this), d);
            })
                .on('drag', function (ev, d) {
                return _this.dragged(ev, d3__namespace.select(this), d);
            })
                .on('end', function (ev, d) {
                return _this.dragEnded(ev, d3__namespace.select(this), d);
            }));
        }
    }

    const TIME_UNITS = [
        [1, 'ps'],
        [1000, 'ns'],
        [1000000, 'us'],
        [1000000000, 'ms'],
        [1000000000000, 's']
    ];
    function createTimeFormatter(divider, unitName) {
        return function (d, i) {
            var v = d / divider;
            if (Number.isInteger(v)) {
                return v + ' ' + unitName;
            }
            return v.toFixed(2) + ' ' + unitName;
        };
    }
    function createTimeFormatterForTimeRange(timeRange) {
        const _timeRange = timeRange[1] - timeRange[0];
        for (var i = 0; i < TIME_UNITS.length; i++) {
            var u = TIME_UNITS[i];
            if (_timeRange < 1000 * u[0] || i === TIME_UNITS.length - 1) {
                return createTimeFormatter(u[0], u[1]);
            }
        }
        throw new Error("Time out of range of defined units");
    }

    /**
     * @param compareFn: example (a, b) => { return a - b; }
     * @param boundaryCheckFn: a function used to check array boundaris
     *        before main alg, example:
     *        function (ar, el) {
     *           if (el < ar[0]) { return 0; }
     *           if (el > ar[ar.length - 1]) { return ar.length; }
     *           return -1;
     *        }
     */
    function binarySearch(ar, el, compareFn, boundaryCheckFn) {
        if (ar.length === 0)
            return -1;
        var res = boundaryCheckFn(ar, el);
        if (res >= 0)
            return res;
        var m = 0;
        var n = ar.length - 1;
        while (m <= n) {
            var k = (n + m) >> 1; // floor(n+m/2)
            var cmp = compareFn(el, ar[k]);
            if (cmp > 0) {
                m = k + 1;
            }
            else if (cmp < 0) {
                n = k - 1;
            }
            else {
                return k;
            }
        }
        return m - 1;
    }

    function filterDataByTime(data, rowRange) {
        // return list ([time, value, duration])
        var min = rowRange[0];
        if (min < 0) {
            throw new Error('min time has to be >= 0');
        }
        var max = rowRange[1];
        var _data = [];
        function boundaryCheckFn(ar, el) {
            if (el[0] < ar[0][0]) {
                return 0;
            }
            if (el[0] > ar[ar.length - 1][0]) {
                return ar.length;
            }
            return -1;
        }
        for (var i = binarySearch(data, [min, "", 0], (a, b) => { return a[0] - b[0]; }, boundaryCheckFn); i < data.length; i++) {
            if (i < 0)
                break;
            var d = data[i];
            var t = d[0];
            if (t < min) ;
            else if (t <= max) {
                let prev = data[i - 1];
                if (_data.length === 0 && t !== min) {
                    // first data, unaligned
                    let prevVal;
                    if (!prev) {
                        prevVal = 'bX';
                    }
                    else {
                        prevVal = prev[1];
                    }
                    _data.push([min, prevVal, t - min]);
                }
                // normal data in range
                var next = data[i + 1];
                var nextTime;
                if (next) {
                    nextTime = Math.min(max, next[0]);
                }
                else {
                    nextTime = max;
                }
                _data.push([t, d[1], nextTime - t]);
            }
            else {
                if (_data.length === 0) {
                    // selection range smaller than one data item
                    let prev = data[i - 1];
                    let prevVal;
                    if (!prev) {
                        prevVal = 'bX';
                    }
                    else {
                        prevVal = prev[1];
                    }
                    _data.push([min, prevVal, max - min]);
                }
                // after selected range
                break;
            }
        }
        if (_data.length === 0) {
            // no new data after selected range
            var last = data[data.length - 1];
            var lastVal;
            if (!last) {
                lastVal = 'bX';
            }
            else {
                lastVal = last[1];
            }
            _data.push([min, lastVal, max - min]);
        }
        return _data;
    }

    class RowRendererBit extends RowRendererBase {
        select(typeInfo) {
            return typeInfo.name === 'wire' && typeInfo.width === 1;
        }
        render(parent, data, typeInfo, formatter) {
            super.render(parent, data, typeInfo, formatter);
            var waveRowHeight = this.waveGraph.sizes.row.height;
            // var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
            var waveRowX = this.waveGraph.waveRowX;
            var waveRowY = this.waveGraph.waveRowY;
            if (!waveRowX)
                throw new Error("waveRowX on waveGraph must be initialized");
            if (!waveRowY)
                throw new Error("waveRowY on waveGraph must be initialized");
            const linePoints = [];
            const invalidRanges = [];
            data.forEach(function (d) {
                let val = d[1];
                let valInt = NaN;
                if (typeof val === 'string') {
                    if (val.indexOf('X') >= 0 || val.indexOf('Z') >= 0 || val.indexOf('W') >= 0 || val.indexOf('U') >= 0 || val.indexOf('L') >= 0 || val.indexOf('H') >= 0 || val.indexOf('_') >= 0) {
                        d[1] = 'X';
                        invalidRanges.push(d);
                        return;
                    }
                    else {
                        valInt = Number.parseInt(val);
                    }
                }
                else {
                    valInt = val;
                }
                linePoints.push([d[0], valInt]);
                linePoints.push([d[0] + d[2], valInt]);
            });
            var line = d3__namespace.line()
                .x(function (d) {
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                return waveRowX(d[0]);
            })
                .y(function (d) {
                if (!waveRowY)
                    throw new Error("waveRowY on waveGraph must be initialized");
                return waveRowY(d[1]);
            })
                .curve(d3__namespace.curveStepAfter);
            // wave line
            parent.attr('clip-path', 'url(#clip)');
            var lines = parent.selectAll('path')
                .data([linePoints]);
            lines.enter()
                .append('path')
                .attr('class', 'value-line')
                .merge(lines)
                .attr('d', line);
            // Add the scatterplot for invalid values
            parent.selectAll('.value-rect-invalid')
                .remove()
                .exit()
                .data(invalidRanges)
                .enter()
                .append('g')
                .attr('class', 'value-rect-invalid')
                .append('rect')
                .attr('height', waveRowHeight)
                .attr('width', function (d) {
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                return waveRowX(waveRowX.domain()[0] + d[2]);
            })
                .attr('x', function (d) {
                if (!waveRowX)
                    throw new Error("waveRowX on waveGraph must be initialized");
                return waveRowX(d[0]);
            })
                .attr('y', function () {
                if (!waveRowY)
                    throw new Error("waveRowY on waveGraph must be initialized");
                return waveRowY(1);
            });
        }
    }

    /**
     * A renderer for value rows with data of array type.
     * The record of data is of following format: [[<indexes>], <new value>]
     */
    class RowRendererArray extends RowRendererBits {
        constructor(waveGraph) {
            super(waveGraph);
            this.FORMATTERS = VECTOR_FORMAT;
            this.DEFAULT_FORMAT = VECTOR_FORMAT.UINT_HEX;
        }
        select(typeInfo) {
            return typeInfo.name === 'array';
        }
        isValid(d) {
            if (typeof d === 'string')
                return d.indexOf('X') < 0;
            else
                return d[1][1].indexOf('X') < 0;
        }
    }

    class RowRendererAnnotation extends RowRendererBase {
        constructor(waveGraph) {
            super(waveGraph);
            this.DEFAULT_FORMAT = (d) => String(d);
            this.FORMATTERS = {
                'default': this.DEFAULT_FORMAT
            };
        }
        select(typeInfo) {
            // This renderer is specialized for annotation rendering
            // It would be called explicitly rather than through type selection
            return false;
        }
        render(parent, data, typeInfo, formatter) {
            // First call parent renderer to get the background
            super.render(parent, data, typeInfo, formatter);
            const waveRowX = this.waveGraph.waveRowX;
            if (!waveRowX) {
                return;
            }
            const signal = parent.datum();
            if (!signal.annotations || signal.annotations.length === 0) {
                return;
            }
            // Eliminar anotaciones anteriores
            parent.selectAll('.signal-annotation').remove();
            // Crear grupo para las anotaciones
            const annotationsGroup = parent.append('g')
                .attr('class', 'signal-annotation');
            // Obtener la altura de la fila
            const waveRowHeight = this.waveGraph.sizes.row.height;
            // Dibujar las anotaciones según el tipo de señal
            signal.annotations.forEach(annotation => {
                const x = waveRowX(annotation.time);
                if (annotation.startTime !== undefined && annotation.endTime !== undefined) {
                    const startX = Math.max(waveRowX(annotation.startTime), 0);
                    const endX = waveRowX(annotation.endTime);
                    // Determinar el tipo de anotación según el ancho de la señal
                    const isMultiBit = signal.type.width != 1;
                    const lineY = signal.type.name === 'wire' ? -5 : -10;
                    const textWidth = 20;
                    if (startX < endX) {
                        if (isMultiBit) {
                            // Para señales multi-bit, usar líneas diagonales
                            const patternId = `diagonalHatch_${Math.random().toString(36).substr(2, 9)}`;
                            // Definir el patrón de líneas diagonales en el SVG
                            const defs = annotationsGroup.append('defs');
                            const pattern = defs.append('pattern')
                                .attr('id', patternId)
                                .attr('patternUnits', 'userSpaceOnUse')
                                .attr('width', 8)
                                .attr('height', 8)
                                .attr('patternTransform', 'rotate(45)');
                            pattern.append('line')
                                .attr('x1', 0)
                                .attr('y1', 0)
                                .attr('x2', 0)
                                .attr('y2', 8)
                                .attr('stroke', annotation.color)
                                .attr('stroke-width', 2);
                            // Crear un rectángulo con el patrón de líneas diagonales
                            annotationsGroup.append('rect')
                                .attr('x', startX)
                                .attr('y', 0)
                                .attr('width', endX - startX)
                                .attr('height', waveRowHeight)
                                .attr('fill', `url(#${patternId})`)
                                .attr('fill-opacity', 1)
                                .attr('pointer-events', 'none');
                        }
                        else {
                            // Para señales de un bit, usar líneas horizontales
                            // Línea antes de la palabra
                            annotationsGroup.append('line')
                                .attr('x1', startX)
                                .attr('y1', lineY + 15)
                                .attr('x2', x - textWidth / 2)
                                .attr('y2', lineY + 15)
                                .attr('stroke', annotation.color)
                                .attr('stroke-width', 2);
                            // Línea después de la palabra
                            annotationsGroup.append('line')
                                .attr('x1', x + textWidth / 2)
                                .attr('y1', lineY + 15)
                                .attr('x2', endX)
                                .attr('y2', lineY + 15)
                                .attr('stroke', annotation.color)
                                .attr('stroke-width', 2);
                        }
                        // Añadir la etiqueta de texto en el centro del rango
                        annotationsGroup.append('text')
                            .attr('x', x)
                            .attr('y', isMultiBit ? waveRowHeight / 2 : lineY + 18)
                            .attr('text-anchor', 'middle')
                            .attr('font-size', '10px')
                            .attr('fill', annotation.color)
                            .attr('font-weight', 'bold')
                            .text(annotation.text);
                    }
                }
            });
        }
    }

    /**
     * Implementation of SVG based scrollbar component which has a histogram like columns which are showing the
     * depth of the items in signal list.
     */
    class Scrollbar {
        constructor(barHeight, _scrollbarG) {
            this.barHeight = barHeight;
            this.selectorWidth = 20;
            this._onDrag = null;
            this.scrollbarG = _scrollbarG;
            this.moverElm = null;
            this.width = 0;
            this.height = 0;
            this._isScrollDisplayed = false;
            this.flatenedData = [];
            this.maxDepth = -1;
            this._startPerc = 0.0;
        }
        onDrag(fn) {
            if (arguments.length) {
                this._onDrag = fn;
                return this;
            }
            return this._onDrag;
        }
        ;
        render() {
            if (this._isScrollDisplayed) {
                var numBars = Math.round(this.height / this.barHeight);
                var xOverview = d3__namespace.scaleLinear()
                    .domain([0, this.maxDepth + 1])
                    .range([0, this.selectorWidth]);
                var yOverview = d3__namespace.scaleLinear()
                    .domain([0, this.flatenedData.length])
                    .range([0, this.height]);
                var subBars = this.scrollbarG.selectAll('.subBar')
                    .data(this.flatenedData);
                const _this = this;
                subBars.exit().remove();
                // small rectangles in scroll preview representing the values on that posssion
                subBars.enter()
                    .append('rect')
                    .classed('subBar', true)
                    .merge(subBars)
                    .attr('height', function () {
                    return yOverview(1);
                })
                    .attr('width', function (d) {
                    return xOverview(d.depth + 1);
                })
                    .attr('x', function () {
                    return _this.width - _this.selectorWidth;
                })
                    .attr('y', function (d, i) {
                    return yOverview(i);
                });
                // dragable rect representing currently viewed window
                if (!this.moverElm) {
                    this.moverElm = this.scrollbarG.selectAll('.mover')
                        .data([null])
                        .enter()
                        .append('rect');
                }
                this.moverElm
                    .classed('mover', true)
                    .attr('transform', 'translate(' + (this.width - this.selectorWidth) + ',0)')
                    .attr('class', 'mover')
                    .attr('x', 0)
                    .attr('y', this._startPerc * this.height)
                    .attr('height', Math.round((numBars / this.flatenedData.length) * this.height))
                    .attr('width', this.selectorWidth);
                this.moverElm.call(d3__namespace.drag().on('drag', function (ev) {
                    var moverElm = d3__namespace.select(this);
                    var y = parseInt(moverElm.attr('y'));
                    var ny = y + ev.dy;
                    var h = parseInt(moverElm.attr('height'));
                    if (ny < 0 || ny + h > _this.height) {
                        // out of range
                        return;
                    }
                    moverElm.attr('y', ny);
                    _this._startPerc = ny / _this.height;
                    if (_this._onDrag) {
                        _this._onDrag(_this._startPerc);
                    }
                }));
            }
            else {
                this.moverElm = null;
                this.scrollbarG.selectAll('*').remove();
            }
        }
        registerWheel(elm) {
            const _this = this;
            elm.on('wheel', function (ev) {
                if (!_this.moverElm)
                    return;
                var step = ev.deltaY > 0 ? 1 : -1;
                ev.preventDefault();
                ev.stopPropagation();
                var y = parseInt(_this.moverElm.attr('y'));
                var ny = Math.max(0, y + _this.barHeight * step);
                var h = parseInt(_this.moverElm.attr('height'));
                if (ny < 0 || ny + h > _this.height) {
                    // out of range
                    return;
                }
                _this.moverElm.attr('y', ny);
                _this._startPerc = ny / _this.height;
                if (_this._onDrag) {
                    _this._onDrag(_this._startPerc);
                }
            });
            return this;
        }
        ;
        size(_width, _height) {
            this.width = _width;
            this.height = _height;
            if (!Number.isFinite(this.height)) {
                throw new Error('Can not resolve height of scrollbar');
            }
            if (!Number.isFinite(this.width)) {
                throw new Error('Can not resolve width of scrollbar');
            }
            this.isScrollDisplayed();
            if (this.scrollbarG) {
                // redraw on size change
                this.render();
            }
            if (this._onDrag) {
                this._onDrag(this._startPerc);
            }
            return this;
        }
        isScrollDisplayed() {
            if (this.flatenedData) {
                this._isScrollDisplayed = this.barHeight * this.flatenedData.length > this.height;
            }
            return this._isScrollDisplayed;
        }
        data(_flatenedData, _maxDepth) {
            this.flatenedData = _flatenedData;
            this.maxDepth = _maxDepth;
            this.isScrollDisplayed();
            if (this.scrollbarG) {
                // redraw on size change
                this.render();
            }
            return this;
        }
        startPerc() {
            return this._startPerc;
        }
    }

    /*
     * :ivar barHeight: Height of a single item in the list.
     * :ivar labelMoving: Object which is implementing moving of bars (drag&drop)
     * :ivar width: total width of a whole emement with a tree list
     * :ivar height: total height of a whole emement with a tree list
     * :ivar root: object whith hierarchical data which is displayed
     * :ivar rootElm: element where this element is placed
     * :ivar labelG: main SVG G
     *
     **/
    class TreeList {
        constructor(barHeight, contextMenu) {
            this.barHeight = barHeight;
            this.contextMenu = contextMenu;
            this.root = null;
            this.rootElm = null;
            this.labelG = null;
            this.scrollbarG = null;
            this.scroll = null;
            this.width = undefined;
            this.height = undefined;
            this._onChange = null;
            this.nodes = [];
            this.labelMoving = new SignalLabelManipulation(barHeight, this);
            this.currentFilter = null;
        }
        static getExpandCollapseIcon(d) {
            if (d.data.children || d.data._children) {
                var ico = freeSolidSvgIcons.faChevronRight;
                if (d.children != null) {
                    ico = freeSolidSvgIcons.faChevronDown;
                }
                return ico.icon[4];
            }
            return '';
        }
        registerExpandHandler(elm) {
            var clickExpandCollapse = this.clickExpandCollapse.bind(this);
            elm.on('click', function (ev, d) { clickExpandCollapse(ev, d, this); })
                .on('mousedown', function (ev) { ev.stopPropagation(); })
                .on('mouseup', function (ev) { ev.stopPropagation(); });
            return elm;
        }
        clickExpandCollapse(ev, d, elm) {
            ev.stopPropagation();
            if (d.children || d._children) {
                if (d.children) {
                    d._children = d.children;
                    d.children = undefined;
                }
                else {
                    d.children = d._children;
                    d._children = undefined;
                }
                d3__namespace.select(elm.parentElement)
                    .select('path')
                    .attr('d', TreeList.getExpandCollapseIcon);
                this.update();
            }
        }
        resolveSelection() {
            // Compute the flattened node list.
            if (!this.root) {
                // no data
                return;
            }
            const barHeight = this.barHeight;
            const nodeTotalCnt = this.root.value;
            const scrollPerc = this.scroll ? this.scroll.startPerc() : 0;
            const start = Math.round(scrollPerc * nodeTotalCnt);
            const end = Math.min(start + this.height / barHeight, nodeTotalCnt);
            let index = -1;
            let i = 0;
            const nodes = this.nodes;
            nodes.splice(0, nodes.length); // clear
            this.root.eachBefore((n) => {
                if (i >= start && i <= end) {
                    n.x = n.depth * 20;
                    n.y = ++index * barHeight;
                    nodes.push(n);
                }
                i++;
            });
        }
        draw(_rootElm) {
            this.rootElm = _rootElm;
            this.labelG = _rootElm.append('g');
            this.update();
            // construct scrollbar after main list in order to have in top
            this.scrollbarG = this.rootElm.append('g')
                .attr('class', 'scrollbar');
            this.scroll = new Scrollbar(this.barHeight, this.scrollbarG);
            this._bindScrollData();
            var update = this.update.bind(this);
            this.scroll
                .registerWheel(this.rootElm)
                .onDrag(function (startPrec) { update(); });
            this.scroll.size(this.width, this.height);
        }
        _setLabelWidth(_width) {
            var barHeight = this.barHeight;
            // udpate width on all labels
            if (this.labelG) {
                this.labelG.selectAll('.labelcell rect')
                    .attr('width', function (d) {
                    return _width - d.depth * 20 - barHeight / 2;
                });
                this.labelG.selectAll(".labelcell")
                    .style("clip-path", function (d) {
                    var width = _width - d.depth * 20 - barHeight / 2;
                    return ["polygon(", 0, "px ", 0, "px, ",
                        0, "px ", barHeight, "px, ",
                        width, "px ", barHeight, "px, ",
                        width, "px ", 0, "px)"].join("");
                });
            }
        }
        size(_width, _height) {
            if (!arguments.length) {
                return [this.width, this.height];
            }
            if (this.labelG && this.width !== _width) {
                this._setLabelWidth(_width);
            }
            this.width = _width;
            this.height = _height;
            if (this.scroll) {
                // also automatically renders also this list
                this.scroll.size(this.width, this.height);
            }
            return this;
        }
        _bindScrollData() {
            if (!this.root)
                throw new Error("this.root should be already initialized");
            if (this.scroll) {
                const flatenedData = [];
                let maxDepth = 0;
                this.root.eachBefore(function (d) {
                    flatenedData.push(d);
                    maxDepth = Math.max(maxDepth, d.depth);
                });
                this.scroll.data(flatenedData, maxDepth);
            }
        }
        data(_data) {
            this.root = d3__namespace.hierarchy(_data, function (d) { return d.children; });
            // Compute the flattened node list.
            this.root.sum(() => 1);
            var i = 0;
            this.root.eachBefore((n) => {
                n.id = i++;
            });
            this._bindScrollData();
            if (this.rootElm) {
                // update rendered
                if (this.labelG)
                    this.labelG.selectAll('.labelcell').remove();
                this.update();
            }
            else {
                // update before rendering
                this.resolveSelection();
                if (this._onChange) {
                    this._onChange(this.nodes);
                }
            }
            return this;
        }
        onChange(fn) {
            if (arguments.length) {
                this._onChange = fn;
                return this;
            }
            return this._onChange;
        }
        visibleNodes() {
            return this.nodes;
        }
        filter(predicate) {
            if (!this.root)
                return;
            this.currentFilter = predicate;
            function remove(d) {
                if (d.parent) {
                    if (!d.parent.children) {
                        throw new Error("Parent must have children because we are searching it because of children");
                    }
                    const index = d.parent.children.indexOf(d);
                    if (index < 0) {
                        throw new Error("Deleting something which is not there");
                    }
                    // remove an item from a children on parent
                    d.parent.children.splice(index, 1);
                }
            }
            var updated = false;
            this.root.eachBefore(function (d) {
                if (!predicate(d.data)) {
                    remove(d);
                    updated = true;
                }
            });
            if (updated) {
                this.update();
            }
        }
        getFilter() {
            return this.currentFilter;
        }
        resetFilter() {
            // Eliminar el filtro actual
            this.currentFilter = null;
            // Si tenemos datos originales, reconstruir la jerarquía
            if (this.root && this.root.data) {
                // Reconstruir el árbol completo
                this.data(this.root.data);
            }
        }
        update() {
            this.resolveSelection();
            if (!this.labelG)
                return;
            // Update the nodes
            var node = this.labelG.selectAll('.labelcell')
                .data(this.nodes, (d) => {
                var _a;
                return (_a = d.id) === null || _a === void 0 ? void 0 : _a.toString();
            });
            var nodeEnter = node.enter().append('g')
                .classed('labelcell', true)
                // .attr("transform", () => "translate(" + source.y0 + "," + source.x0 + ")") // for transition
                .classed('selected', function (d) {
                return !!d.data.type.isSelected;
            });
            var barHeight = this.barHeight;
            // background rectangle for highlight
            nodeEnter.append('rect')
                .attr('height', barHeight)
                .attr('x', barHeight / 2)
                .attr('y', -0.5 * barHeight);
            // adding arrows
            nodeEnter.append('path')
                .attr('transform', 'translate(0,' + -(barHeight / 2) + ')' + ' scale(' + (barHeight / freeSolidSvgIcons.faChevronDown.icon[1] * 0.5) + ')')
                .attr('d', TreeList.getExpandCollapseIcon)
                .call(this.registerExpandHandler.bind(this));
            // background for expand arrow
            nodeEnter.append('rect')
                .classed('expandable', function (d) {
                return !!(d.data.children || d.data._children);
            })
                .attr('width', barHeight / 2)
                .attr('height', barHeight)
                .attr('transform', 'translate(0,' + -(barHeight / 2) + ')')
                .style('opacity', 0)
                .call(this.registerExpandHandler.bind(this));
            // adding file or folder names
            nodeEnter.append('text')
                .attr('dy', 3.5)
                .attr('dx', 15)
                .text((d) => d.data.name);
            nodeEnter
                .on('mouseover', function (event, d) {
                if (!this)
                    return;
                d3__namespace.select(this)
                    .classed('highlight', true);
            })
                .on('mouseout', function (event, d) {
                nodeEnter.classed('highlight', false);
            });
            // Transition nodes to their new position.
            nodeEnter.attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')');
            node.attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')');
            node.exit()
                .remove();
            const contextmenu = this.contextMenu.render.bind(this.contextMenu);
            nodeEnter.on('contextmenu', function (ev, d) {
                contextmenu(this, ev, d);
            });
            this._setLabelWidth(this.width);
            if (this._onChange) {
                this._onChange(this.nodes);
            }
            this.labelMoving.registerDrag(this.labelG.selectAll('.labelcell'));
        }
    }

    // http://bl.ocks.org/mccannf/1629464
    class DragBarVertical {
        constructor(parentGElm, size, range, init_pos) {
            this._onDrag = undefined;
            [this.xMin, this.xMax] = range;
            [this.x, this.y] = init_pos;
            this.dragBehavior = d3__namespace.drag()
                .on('drag', this._onDragDelegate.bind(this));
            this.dragHandle = parentGElm.append("rect")
                .data([this,])
                .classed('dragbar-vertical', true)
                .attr("fill", "lightblue")
                .attr("fill-opacity", .5)
                .attr("cursor", "ew-resize")
                .call(this.dragBehavior);
            this._size = [size[0], size[1]];
            this.size(size[0], size[1]);
        }
        range(xMin, xMax) {
            if (arguments.length) {
                [this.xMin, this.xMax] = [xMin, xMax];
            }
            else {
                return [this.xMin, this.xMax];
            }
        }
        size(width, height) {
            if (arguments.length) {
                this._size = [width, height];
                if (width > 0 && height > 0) {
                    this.dragHandle
                        .attr("x", function (d) { return d.x - (width / 2); })
                        .attr("y", function (d) { return d.y; })
                        .attr("height", height)
                        .attr("width", width);
                }
            }
            else {
                return this._size;
            }
        }
        _onDragDelegate(ev, d) {
            var width = this._size[0];
            var dragx = Math.max(this.xMin + (width / 2), Math.min(this.xMax, d.x + ev.dx + (width / 2)));
            this.x = dragx - (width / 2);
            this.dragHandle
                .attr("x", function (d) { return d.x; });
            if (this._onDrag)
                this._onDrag(this);
        }
        onDrag(_onDrag) {
            if (arguments.length) {
                this._onDrag = _onDrag;
                return this;
            }
            else {
                return this._onDrag;
            }
        }
    }

    // https://stackoverflow.com/questions/15181452/how-to-save-export-inline-svg-styled-with-css-from-browser-to-image-file
    function inlineStylesToSvgCopy(parentNode, origData, CONTAINER_ELEMENTS, RELEVANT_STYLES) {
        if (parentNode.tagName in RELEVANT_STYLES) {
            var StyleDef = window.getComputedStyle(origData);
            var styleStrBuff = [];
            var relStyles = RELEVANT_STYLES[parentNode.tagName];
            for (var st = 0; st < relStyles.length; st++) {
                styleStrBuff.push(relStyles[st]);
                styleStrBuff.push(':');
                styleStrBuff.push(StyleDef.getPropertyValue(relStyles[st]));
                styleStrBuff.push('; ');
            }
            parentNode.setAttribute('style', styleStrBuff.join(''));
        }
        if (CONTAINER_ELEMENTS.indexOf(parentNode.tagName) === -1)
            return;
        const children = parentNode.childNodes;
        const origChildDat = origData.childNodes;
        for (let cd = 0; cd < children.length; cd++) {
            const c = children[cd];
            inlineStylesToSvgCopy(c, origChildDat[cd], CONTAINER_ELEMENTS, RELEVANT_STYLES);
        }
    }
    const CONTAINER_ELEMENTS = ['svg', 'g'];
    const RELEVANT_STYLES = {
        'svg': ['background-color',],
        'rect': ['fill', 'stroke', 'stroke-width', 'opacity'],
        'path': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
        'circle': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
        'line': ['stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
        'text': ['fill', 'font-size', 'text-anchor', 'opacity'],
        'polygon': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity']
    };
    function exportStyledSvgToBlob(svgElm) {
        const oDOM = svgElm.cloneNode(true);
        inlineStylesToSvgCopy(oDOM, svgElm, CONTAINER_ELEMENTS, RELEVANT_STYLES);
        const data = new XMLSerializer().serializeToString(oDOM);
        const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        return svg;
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$1 = "/* Layout\r\n------------ */\r\n\r\n.d3-context-menu {\r\n\tposition: absolute;\r\n\tmin-width: 150px;\r\n\tz-index: 1200;\r\n}\r\n\r\n.d3-context-menu ul,\r\n.d3-context-menu ul li {\r\n\tmargin: 0;\r\n\tpadding: 0;\r\n}\r\n\r\n.d3-context-menu ul {\r\n\tlist-style-type: none;\r\n\tcursor: default;\r\n}\r\n\r\n.d3-context-menu ul li {\r\n\t-webkit-touch-callout: none; /* iOS Safari */\r\n\t-webkit-user-select: none;   /* Chrome/Safari/Opera */\r\n\t-khtml-user-select: none;    /* Konqueror */\r\n\t-moz-user-select: none;      /* Firefox */\r\n\t-ms-user-select: none;       /* Internet Explorer/Edge */\r\n\tuser-select: none;\r\n}\r\n\r\n/*\r\n\tDisabled\r\n*/\r\n\r\n.d3-context-menu ul li.is-disabled,\r\n.d3-context-menu ul li.is-disabled:hover {\r\n\tcursor: not-allowed;\r\n}\r\n\r\n/*\r\n\tDivider\r\n*/\r\n\r\n.d3-context-menu ul li.is-divider {\r\n\tpadding: 0;\r\n}\r\n\r\n/* Theming\r\n------------ */\r\n\r\n.d3-context-menu-theme {\r\n\tbackground-color: #f2f2f2;\r\n\tborder-radius: 4px;\r\n\r\n\tfont-family: Arial, sans-serif;\r\n\tfont-size: 14px;\r\n\tborder: 1px solid #d4d4d4;\r\n}\r\n\r\n.d3-context-menu-theme ul {\r\n\tmargin: 4px 0;\r\n}\r\n\r\n.d3-context-menu-theme ul li {\r\n\tpadding: 4px 16px;\r\n}\r\n\r\n.d3-context-menu-theme ul li:hover {\r\n\tbackground-color: #4677f8;\r\n\tcolor: #fefefe;\r\n}\r\n\r\n/*\r\n\tHeader\r\n*/\r\n\r\n.d3-context-menu-theme ul li.is-header,\r\n.d3-context-menu-theme ul li.is-header:hover {\r\n\tbackground-color: #f2f2f2;\r\n\tcolor: #444;\r\n\tfont-weight: bold;\r\n\tfont-style: italic;\r\n}\r\n\r\n/*\r\n\tDisabled\r\n*/\r\n\r\n.d3-context-menu-theme ul li.is-disabled,\r\n.d3-context-menu-theme ul li.is-disabled:hover {\r\n\tbackground-color: #f2f2f2;\r\n\tcolor: #888;\r\n}\r\n\r\n/*\r\n\tDivider\r\n*/\r\n\r\n.d3-context-menu-theme ul li.is-divider:hover {\r\n\tbackground-color: #f2f2f2;\r\n}\r\n\r\n.d3-context-menu-theme ul hr {\r\n\tborder: 0;\r\n\theight: 0;\r\n\tborder-top: 1px solid rgba(0, 0, 0, 0.1);\r\n\tborder-bottom: 1px solid rgba(255, 255, 255, 0.3);\r\n}\r\n\r\n/*\r\n\tNested Menu\r\n*/\r\n.d3-context-menu-theme ul li.is-parent:after {\r\n\tborder-left: 7px solid transparent;\r\n\tborder-top: 7px solid red;\r\n\tcontent: \"\";\r\n\theight: 0;\r\n\tposition: absolute;\r\n\tright: 8px;\r\n\ttop: 35%;\r\n\ttransform: rotate(45deg);\r\n\twidth: 0;\r\n}\r\n\r\n.d3-context-menu-theme ul li.is-parent {\r\n\tpadding-right: 20px;\r\n\tposition: relative;\r\n}\r\n\r\n.d3-context-menu-theme ul.is-children {\r\n\tbackground-color: #f2f2f2;\r\n\tborder: 1px solid #d4d4d4;\r\n\tcolor: black;\r\n\tdisplay: none;\r\n\tleft: 100%;\r\n\tmargin: -5px 0;\r\n\tpadding: 4px 0;\r\n\tposition: absolute;\r\n\ttop: 0;\r\n\twidth: 100%;\r\n}\r\n\r\n.d3-context-menu-theme li.is-parent:hover > ul.is-children {\r\n\tdisplay: block;\r\n}\r\n";
    styleInject(css_248z$1);

    // https://github.com/patorjk/d3-context-menu v1.1.2 modified to be bundable
    class ContextMenuItem {
        constructor(title, data, children, divider, disabled, action) {
            this.title = title;
            this.children = children;
            this.divider = divider;
            this.disabled = disabled;
            this.action = action;
            this.data = data;
        }
    }
    let ContextMenu_currentlyShownInstance = null;
    class ContextMenu {
        constructor() {
        }
        //public static noop() { }
        static isFn(value) {
            return typeof value === 'function';
        }
        //public static const(value: any): () => any {
        //	return function() { return value; };
        //}
        //public static toFactory<T>(value: T, fallback: T): T {
        //	value = (value === undefined) ? fallback : value;
        //	return ContextMenu.isFn(value) ? value : ContextMenu.const(value) as T;
        //}
        getMenuItems(d) {
            throw new Error("Override this method in your implementation of this class");
        }
        onOpen(element, data) {
            return true;
        }
        onClose() {
        }
        getTheme(element, data) {
            return 'd3-context-menu-theme';
        }
        getPosition(element, data) {
            return undefined;
        }
        closeMenu() {
            // global state is populated if a menu is currently opened
            if (ContextMenu_currentlyShownInstance) {
                d3__namespace.select('.d3-context-menu').remove();
                d3__namespace.select('body').on('mousedown.d3-context-menu', null);
                ContextMenu_currentlyShownInstance.onClose();
                ContextMenu_currentlyShownInstance = null;
            }
        }
        /**
         * Context menu event handler
         * @param {*} data
         */
        render(element, ev, data) {
            // close any menu that's already opened
            this.closeMenu();
            // store close callback already bound to the correct args and scope
            ContextMenu_currentlyShownInstance = this;
            // create the div element that will hold the context menu
            d3__namespace.selectAll('.d3-context-menu').data([new ContextMenuItem("", data, [], false, false, null)])
                .enter()
                .append('div')
                .attr('class', 'd3-context-menu ' + this.getTheme(element, data));
            const closeMenu = this.closeMenu.bind(this);
            // close menu on mousedown outside
            d3__namespace.select('body').on('mousedown.d3-context-menu', closeMenu);
            d3__namespace.select('body').on('click.d3-context-menu', closeMenu);
            const parent = d3__namespace.selectAll('.d3-context-menu')
                .on('contextmenu', function (ev) {
                closeMenu();
                ev.preventDefault();
                ev.stopPropagation();
            })
                .append('ul');
            parent.call(this._renderNestedMenu.bind(this), element);
            // the openCallback allows an action to fire before the menu is displayed
            // an example usage would be closing a tooltip
            if (this.onOpen(element, data) === false) {
                return;
            }
            // Use this if you want to align your menu from the containing element, otherwise aligns towards center of window
            //console.log(this.parentNode.parentNode.parentNode);//.getBoundingClientRect());
            // get position
            const position = this.getPosition(element, data);
            const doc = document.documentElement;
            const pageWidth = window.innerWidth || doc.clientWidth;
            const pageHeight = window.innerHeight || doc.clientHeight;
            let horizontalAlignment = 'left';
            let horizontalAlignmentReset = 'right';
            let horizontalValue = position ? position.left : ev.pageX - 2;
            if (ev.pageX > pageWidth / 2) {
                horizontalAlignment = 'right';
                horizontalAlignmentReset = 'left';
                horizontalValue = position ? pageWidth - position.left : pageWidth - ev.pageX - 2;
            }
            let verticalAlignment = 'top';
            let verticalAlignmentReset = 'bottom';
            let verticalValue = position ? position.top : ev.pageY - 2;
            if (ev.pageY > pageHeight / 2) {
                verticalAlignment = 'bottom';
                verticalAlignmentReset = 'top';
                verticalValue = position ? pageHeight - position.top : pageHeight - ev.pageY - 2;
            }
            // display context menu
            d3__namespace.select('.d3-context-menu')
                .style(horizontalAlignment, (horizontalValue) + 'px')
                .style(horizontalAlignmentReset, null)
                .style(verticalAlignment, (verticalValue) + 'px')
                .style(verticalAlignmentReset, null)
                .style('display', 'block');
            ev.preventDefault();
            ev.stopPropagation();
        }
        _renderNestedMenu(parent, root, depth = 0) {
            const _this = this;
            function resolve(value, data, index) {
                if (ContextMenu.isFn(value)) {
                    const valFn = value;
                    return valFn(_this, root, data, index);
                }
                else {
                    return value;
                }
            }
            const closeMenu = this.closeMenu.bind(this);
            parent.selectAll('li')
                .data((d) => {
                if (depth == 0) {
                    return _this.getMenuItems(d);
                }
                else {
                    return resolve(d.children, d, 0);
                }
            })
                .enter()
                .append('li')
                .each(function (d, i) {
                // get value of each data
                var isDivider = !!resolve(d.divider, d, i);
                var isDisabled = !!resolve(d.disabled, d, i);
                var hasChildren = resolve(d.children, d, i).length != 0;
                var hasAction = !!d.action;
                var text = isDivider ? '<hr/>' : resolve(d.title, d, i);
                var listItem = d3__namespace.select(this)
                    .classed('is-divider', isDivider)
                    .classed('is-disabled', isDisabled)
                    .classed('is-header', !hasChildren && !hasAction)
                    .classed('is-parent', hasChildren)
                    .html(text)
                    .on('click', function (ev, data) {
                    // do nothing if disabled or no action
                    if (isDisabled || !hasAction)
                        return;
                    if (!d.action)
                        return;
                    d.action(_this, root, data, 0);
                    closeMenu();
                });
                if (!isDisabled && hasChildren) {
                    // create children(`next parent`) and call recursive
                    var children = listItem.append('ul')
                        .classed('is-children', true);
                    _this._renderNestedMenu(children, root, ++depth);
                }
            });
        }
    }

    class SignalContextMenu extends ContextMenu {
        constructor(waveGraph) {
            super();
            this.removedSignals = [];
            this.waveGraph = waveGraph;
        }
        autoBreakDownSignals() {
            var _a;
            const targets = ["S", "S*"];
            (_a = this.waveGraph.treelist) === null || _a === void 0 ? void 0 : _a.visibleNodes().forEach((node) => {
                if (targets.some(target => node.data.name === target) && !node.data.isBrokenDown && node.data.type.name !== "array") {
                    const parentType = node.data.type;
                    const parentData = node.data.data;
                    const parentSignalName = node.data.name;
                    const parentIsBrokenDown = true;
                    const newSignalData = {
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
        getMenuItems(d) {
            var _a;
            let waveGraph = this.waveGraph;
            let formatOptions = [];
            // construct format options from values in formatters dictionary
            var formatters = ((_a = d.data.data.type.renderer) === null || _a === void 0 ? void 0 : _a.FORMATTERS) || {};
            function formatChanger(cm, elm, data, index) {
                var _a;
                const key = data.data;
                // function which switches data format function on every currently selected signals
                const newFormatter = formatters[key];
                d.data.data.type.formatter = newFormatter;
                const currentRenderrer = d.data.data.type.renderer;
                (_a = waveGraph.treelist) === null || _a === void 0 ? void 0 : _a.visibleNodes().forEach(function (d) {
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
                    formatOptions.push(new ContextMenuItem(
                    /*title*/ key, key, [], 
                    /* divider */ false, 
                    /* disabled */ false, 
                    /*action*/ formatChanger));
                }
            }
            return [
                new ContextMenuItem('Remove', d.data, [], false, 
                /* disabled */ d.data.data.name.match(/Child_bit\d+/) !== null, 
                /*action*/ (cm, elm, data, index) => {
                    var _a;
                    console.log('Remove signal type', d.data.data.type);
                    console.log('Remove signal type', d.data.data.type.name);
                    this.removedSignals.push(d.data.data.name);
                    d.data.data.type.isSelected = true;
                    return (_a = waveGraph.treelist) === null || _a === void 0 ? void 0 : _a.filter((d) => {
                        return !d.type.isSelected;
                    });
                }),
                new ContextMenuItem('Format', d.data, 
                /* children */ formatOptions, 
                /* divider */ false, 
                /* disabled */ formatOptions.length == 0, 
                /*action*/ null),
                new ContextMenuItem('Break down', d.data, [], 
                /* divider */ false, 
                /* disabled */ (d.data.data.isBrokenDown || (d.data.data.type.name == 'array')) || formatOptions.length == 0, 
                /*action*/ (cm, elm, data, index) => {
                    if (d.data.data.isBrokenDown) {
                        console.log('Signal has already been broken down', d.data.data.name);
                        return;
                    }
                    const parentType = d.data.data.type;
                    const parentData = d.data.data.data;
                    const parentSignalName = d.data.data.name;
                    const parentIsBrokenDown = true;
                    const newSignalData = {
                        name: `${parentSignalName} Child`,
                        type: parentType,
                        data: parentData,
                        isBrokenDown: parentIsBrokenDown,
                    };
                    waveGraph.addChildSignal(parentSignalName, newSignalData, this.removedSignals);
                    d.data.data.isBrokenDown = true;
                }),
            ];
        }
    }

    class Tooltip {
        constructor(tooltipHtmlGetter) {
            this.tooltipHtmlGetter = tooltipHtmlGetter;
            this.tooltipDiv = d3__namespace.select('body').append('div')
                .attr('class', 'd3-wave tooltip')
                .style('opacity', 0)
                .style('display', 'none');
        }
        addToElm(selection) {
            var tooltipDiv = this.tooltipDiv;
            var tooltipHtmlGetter = this.tooltipHtmlGetter;
            return selection
                .on('mouseover', function (ev, d) {
                tooltipDiv.transition()
                    .duration(200)
                    .style('display', 'block')
                    .style('opacity', 0.9);
                var tootipHtml = tooltipHtmlGetter(d);
                tooltipDiv.html(tootipHtml)
                    .style('left', (ev.pageX) + 'px')
                    .style('top', (ev.pageY - 28) + 'px');
            })
                .on('mouseout', function () {
                tooltipDiv.transition()
                    .duration(500)
                    .style('opacity', 0)
                    .style('display', 'none');
            });
        }
    }

    class WaveGraphSizesRow {
        constructor() {
            this.range = [0, 1];
            this.height = 20;
            this.ypadding = 5;
        }
    }
    class WaveGraphSizesMargin {
        constructor() {
            this.top = 20;
            this.right = 20;
            this.bottom = 20;
            this.left = 180;
        }
    }
    class WaveGraphSizes {
        constructor() {
            this.row = new WaveGraphSizesRow();
            this.margin = new WaveGraphSizesMargin();
            this.dragWidth = 5;
            this.width = -1;
            this.height = -1;
        }
    }

    class SignalFilterPanel {
        constructor(graph) {
            this.filterPanel = null;
            this.isOpen = false;
            this.signalCheckboxes = new Map();
            this.originalFilter = null;
            this.allSignalsList = []; // Para almacenar todas las señales disponibles
            this.graph = graph;
            this.container = graph.svg.append('g')
                .attr('class', 'filter-panel-container');
        }
        // Método para mostrar/ocultar el panel
        toggle() {
            if (this.isOpen) {
                this.close();
            }
            else {
                this.open();
            }
        }
        // Método para abrir el panel
        open() {
            var _a;
            const graph = this.graph;
            // Guardar el filtro original
            this.originalFilter = ((_a = graph.treelist) === null || _a === void 0 ? void 0 : _a.getFilter()) || null;
            // Crear el div del panel si no existe
            if (!this.filterPanel) {
                // Usamos foreignObject para incluir elementos HTML dentro del SVG
                const foreignObject = this.container.append("foreignObject")
                    .attr("width", 300)
                    .attr("height", 400)
                    .attr("x", graph.sizes.margin.left + 50)
                    .attr("y", graph.sizes.margin.top + 20);
                this.filterPanel = foreignObject.append("xhtml:div")
                    .style("background-color", "white")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "5px")
                    .style("padding", "10px")
                    .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
                    .style("max-height", "350px")
                    .style("overflow-y", "auto");
                // Añadir título
                this.filterPanel.append("h3")
                    .style("margin-top", "0")
                    .style("border-bottom", "1px solid #eee")
                    .style("padding-bottom", "8px")
                    .text("Filter Signals");
                // Contenedor para los checkboxes
                const checkboxContainer = this.filterPanel.append("div")
                    .style("margin-bottom", "10px");
                // Añadir botones de acción
                const buttonContainer = this.filterPanel.append("div")
                    .style("display", "flex")
                    .style("justify-content", "space-between")
                    .style("margin-top", "10px");
                buttonContainer.append("button")
                    .style("padding", "4px 8px")
                    .style("background-color", "#f1f1f1")
                    .style("border", "1px solid #ddd")
                    .style("border-radius", "3px")
                    .style("cursor", "pointer")
                    .text("Select All")
                    .on("click", () => this.selectAll(true));
                buttonContainer.append("button")
                    .style("padding", "4px 8px")
                    .style("background-color", "#f1f1f1")
                    .style("border", "1px solid #ddd")
                    .style("border-radius", "3px")
                    .style("cursor", "pointer")
                    .text("Deselect All")
                    .on("click", () => this.selectAll(false));
                buttonContainer.append("button")
                    .style("padding", "4px 8px")
                    .style("background-color", "#4CAF50")
                    .style("color", "white")
                    .style("border", "none")
                    .style("border-radius", "3px")
                    .style("cursor", "pointer")
                    .text("Apply")
                    .on("click", () => this.applyFilter());
                buttonContainer.append("button")
                    .style("padding", "4px 8px")
                    .style("background-color", "#f44336")
                    .style("color", "white")
                    .style("border", "none")
                    .style("border-radius", "3px")
                    .style("cursor", "pointer")
                    .text("Cancel")
                    .on("click", () => this.close());
                // Poblar con checkboxes
                this.populateCheckboxes(checkboxContainer);
            }
            // Mostrar el panel
            this.container.style("display", "block");
            this.isOpen = true;
        }
        // Método para cerrar el panel
        close() {
            if (this.container) {
                this.container.style("display", "none");
            }
            this.isOpen = false;
        }
        // Método para poblar la lista de checkboxes con las señales disponibles
        populateCheckboxes(container) {
            // Limpiar contenedor
            container.html("");
            // Obtener todas las señales disponibles y almacenarlas
            this.allSignalsList = this.getAllSignals(this.graph._allData);
            // Crear un conjunto de señales actualmente visibles
            const visibleSignals = new Set();
            if (this.graph.data) {
                this.graph.data.forEach((signal) => {
                    visibleSignals.add(signal.name);
                });
            }
            // Crear checkboxes para cada señal
            this.allSignalsList.forEach(signal => {
                const isChecked = visibleSignals.has(signal);
                this.signalCheckboxes.set(signal, isChecked);
                const label = container.append("label")
                    .style("display", "block")
                    .style("margin", "5px 0")
                    .style("cursor", "pointer");
                const checkbox = label.append("input")
                    .attr("type", "checkbox")
                    .attr("name", "signal")
                    .attr("value", signal)
                    .property("checked", isChecked)
                    .style("margin-right", "8px")
                    .on("change", () => {
                    const isChecked = checkbox.node().checked;
                    this.signalCheckboxes.set(signal, isChecked);
                });
                label.append("span")
                    .text(signal);
            });
        }
        // Método para seleccionar/deseleccionar todos los checkboxes
        selectAll(select) {
            if (!this.filterPanel)
                return;
            // Actualizar los checkboxes en el DOM
            this.filterPanel.selectAll("input[type=checkbox]")
                .property("checked", select);
            // Actualizar el mapa de señales
            this.signalCheckboxes.forEach((_, key) => {
                this.signalCheckboxes.set(key, select);
            });
        }
        // Método para aplicar el filtro basado en los checkboxes seleccionados
        applyFilter() {
            if (!this.graph.treelist)
                return;
            // Paso 1: Quitar cualquier filtro existente para mostrar todas las señales primero
            this.graph.treelist.resetFilter();
            // Reconstruir el árbol completo de señales
            if (this.graph._allData) {
                // Crear una nueva jerarquía con todos los datos originales
                this.graph.treelist.data(this.graph._allData);
                this.graph.draw();
            }
            // Paso 2: Crear un conjunto de señales seleccionadas
            const selectedSignals = new Set();
            this.signalCheckboxes.forEach((isSelected, signalName) => {
                if (isSelected) {
                    selectedSignals.add(signalName);
                }
            });
            // Paso 3: Aplicar el filtro al TreeList después de haber mostrado todas las señales
            this.graph.treelist.filter((d) => {
                // Si es una señal derivada de descomposición, buscar su padre
                if (d.isBrokenDown && d.name.includes('_bit')) {
                    const parentName = d.name.split('_bit')[0];
                    return selectedSignals.has(parentName);
                }
                return selectedSignals.has(d.name);
            });
            // Redibuja el gráfico
            this.graph.draw();
            // Cierra el panel
            this.close();
        }
        // Método para obtener todas las señales disponibles del árbol
        getAllSignals(signal) {
            if (!signal)
                return [];
            let signals = [];
            // Añadir la señal actual si no es una señal derivada automáticamente
            if (!signal.isBrokenDown) {
                signals.push(signal.name);
            }
            // Recorrer los hijos recursivamente
            if (signal.children) {
                signal.children.forEach(child => {
                    signals = signals.concat(this.getAllSignals(child));
                });
            }
            // También recorrer los _children (nodos colapsados)
            if (signal._children) {
                signal._children.forEach(child => {
                    signals = signals.concat(this.getAllSignals(child));
                });
            }
            return signals;
        }
    }

    class HelpPanel {
        constructor(waveGraph) {
            this.helpDialogId = 'd3-wave-help-dialog';
            this.helpDialog = null;
            /**
             * Cierra el panel de ayuda al hacer clic fuera de él
             */
            this.closeOnClickOutside = (event) => {
                if (this.helpDialog && event.target &&
                    !this.helpDialog.contains(event.target) &&
                    event.target !== this.helpDialog) {
                    this.toggle();
                    document.removeEventListener('click', this.closeOnClickOutside);
                }
            };
            this.waveGraph = waveGraph;
        }
        /**
         * Muestra u oculta el panel de ayuda
         */
        toggle() {
            console.log('Toggle help panel');
            // Si el diálogo ya existe, lo elimina (lo cierra)
            const existingDialog = document.getElementById(this.helpDialogId);
            if (existingDialog) {
                document.body.removeChild(existingDialog);
                this.helpDialog = null;
                return;
            }
            // Si no existe, lo crea y muestra
            this.showHelpDialog();
        }
        /**
         * Crea y muestra el panel de ayuda
         */
        showHelpDialog() {
            var _a;
            // Crear un nuevo diálogo
            this.helpDialog = document.createElement('div');
            this.helpDialog.id = this.helpDialogId;
            this.helpDialog.style.position = 'fixed';
            this.helpDialog.style.top = '50%';
            this.helpDialog.style.left = '50%';
            this.helpDialog.style.transform = 'translate(-50%, -50%)';
            this.helpDialog.style.backgroundColor = '#fff';
            this.helpDialog.style.padding = '20px';
            this.helpDialog.style.border = '1px solid #ccc';
            this.helpDialog.style.borderRadius = '5px';
            this.helpDialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            this.helpDialog.style.zIndex = '1000';
            this.helpDialog.style.maxWidth = '800px';
            this.helpDialog.style.maxHeight = '80vh';
            this.helpDialog.style.overflow = 'auto';
            // Contenido de la ayuda
            this.helpDialog.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">D3-Wave Help</h2>
      
      <h3>Navigation</h3>
      <ul>
        <li><strong>Pan:</strong> Click and drag on the main area to move the view horizontally.</li>
        <li><strong>Zoom:</strong> Use mouse wheel or pinch gesture to zoom in and out.</li>
        <li><strong>Reset View:</strong> Click the arrows icon in the toolbar to reset zoom and fit the content to the screen.</li>
      </ul>
      
      <h3>Signal Management</h3>
      <ul>
        <li><strong>Filter Signals:</strong> Click the filter icon to open the signal filter panel.</li>
        <li><strong>Expand/Collapse:</strong> Click the arrow next to a signal name to expand or collapse its children.</li>
        <li><strong>Context Menu:</strong> Right-click on a signal name to access formatting options and other actions.</li>
        <li><strong>Signal Breakdown:</strong> Right-click on multi-bit signals and select "Break down" to display individual bits.</li>
      </ul>
      
      <h3>Signal Comparison</h3>
      <ul>
        <li><strong>Signals S and S*:</strong> These signals are automatically compared, and differences are highlighted.</li>
        <li><strong>Bit-level Comparison:</strong> For multi-bit signals, individual bits are compared when broken down.</li>
        <li><strong>Difference Highlighting:</strong>
          <ul>
            <li>Single-bit signals: Differences are marked with horizontal red lines.</li>
            <li>Multi-bit signals: Differences are marked with diagonal red stripes.</li>
          </ul>
        </li>
      </ul>
      
      <h3>Visual Elements</h3>
      <ul>
        <li><strong>Red Markings:</strong> Indicate differences between signals S and S*.</li>
        <li><strong>Gray Areas:</strong> Represent invalid or unknown values (X, Z, etc.).</li>
        <li><strong>Vertical Help Line:</strong> A guideline that follows your cursor for time reference.</li>
      </ul>
      
      <h3>Other Features</h3>
      <ul>
        <li><strong>Download SVG:</strong> Click the download icon to save the current view as an SVG image.</li>
        <li><strong>Regenerate Signals:</strong> Click the refresh icon to restore any signals that were removed.</li>
        <li><strong>Resize Panels:</strong> Drag the divider between the signal names and waveforms to adjust the width.</li>
      </ul>
      
      <div style="text-align: center; margin-top: 20px;">
        <button id="closeHelpButton" style="padding: 8px 16px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
            // Añadir el diálogo al body
            document.body.appendChild(this.helpDialog);
            // Agregar event listener para cerrar el diálogo
            (_a = document.getElementById('closeHelpButton')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                this.toggle();
            });
            // También cerrar al hacer clic fuera del diálogo
        }
    }

    var css_248z = ".d3-wave .value-line {\r\n\tfill: none;\r\n\tstroke: lime;\r\n\tstroke-width: 1.5px;\r\n}\r\n\r\n.d3-wave .grid-line-x {\r\n\tstroke: lightgrey;\r\n\topacity: 0.7;\r\n\tstroke-dasharray: 5, 5;\r\n}\r\n\r\n.d3-wave .grid path {\r\n\tstroke-width: 0;\r\n}\r\n\r\n.d3-wave .value-rect-invalid path {\r\n\t/* fill: darkred; */\r\n\t/* stroke: red; */\r\n\tfill : rgb(82, 82, 82);\r\n\tstroke: gray;\r\n}\r\n\r\n.d3-wave .value-rect-invalid rect {\r\n\t/* fill: darkred; */\r\n\t/* stroke: red; */\r\n\tfill : rgb(82, 82, 82);\r\n\tstroke: gray;\r\n}\r\n\r\n.d3-wave .value-diff rect {\r\n\tfill: darkred; \r\n\tstroke: red; \r\n}\r\n\r\n.d3-wave .value-rect-valid path {\r\n\tfill: green;\r\n\tstroke: lime;\r\n}\r\n\r\n.d3-wave .value-rect-valid text {\r\n\ttext-anchor: middle;\r\n\tfill: white;\r\n}\r\n\r\n.d3-wave .value-rect-invalid text {\r\n\ttext-anchor: middle;\r\n\tfill: white;\r\n}\r\n\r\n.d3-wave {\r\n\tbackground-color: black;\r\n}\r\n\r\n.d3-wave .domain {\r\n\tstroke: yellow;\r\n\tstroke-width: 1.5px;\r\n\tshape-rendering: crispEdges;\r\n\tvector-effect: non-scaling-stroke;\r\n}\r\n\r\n.d3-wave .tick line {\r\n\tstroke-width: 1.5px;\r\n\tstroke: yellow;\r\n}\r\n\r\n.d3-wave .axis text {\r\n\tshape-rendering: crispEdges;\r\n\tfill: yellow;\r\n}\r\n\r\n\r\n.d3-wave .axis-y path {\r\n\tshape-rendering: crispEdges;\r\n\tfill: yellow;\r\n}\r\n\r\n.d3-wave .axis-y .highlight text {\r\n    fill: #ff751a;\r\n    font-weight: bold;\r\n}\r\n\r\n.d3-wave .scrollbar .mover {\r\n  fill: steelblue;\r\n  pointer-events: all;\r\n  cursor: ns-resize;\r\n  opacity: 0.5;\r\n}\r\n\r\n.d3-wave .scrollbar .subBar { \r\n  fill: gray;\r\n  opacity: 0.5;\r\n}\r\n\r\n.d3-wave .vertical-help-line {\r\n\tstroke: white;\r\n\tstroke-width: 2;\r\n}\r\n\r\n.d3-wave .labelcell.selected rect {\r\n\topacity: 30%;\r\n\tfill: aqua;\r\n}\r\n\r\n.d3-wave .labelcell text {\r\n\tcursor:grabbing;\r\n}\r\n\r\n.d3-wave .labelcell .expandable {\r\n\tcursor:pointer;\r\n}\r\n\r\n.d3-wave.tooltip {\t\r\n    position: absolute;\t\t\t\r\n    text-align: center;\t\t\t\r\n    width: 80px;\t\t\t\t\t\r\n    height: 40px;\t\t\t\t\t\r\n    padding: 2px;\t\t\t\t\r\n    font: 12px sans-serif;\t\t\r\n    background-color: lightsteelblue;\t\r\n    border: 0px;\t\t\r\n    border-radius: 8px;\t\t\t\r\n    pointer-events: none;\t\t\t\r\n}\r\n\r\n.d3-wave .axis .icons {\r\n    fill: white;\r\n}\r\n\r\n.d3-wave .value-background {\r\n\topacity: 0%;\r\n}\r\n.d3-wave .value-background.selected {\r\n\topacity: 30%;\r\n\tfill: aqua;\r\n}\r\n\r\n.filter-panel-container {\r\n\tposition: absolute;\r\n\tz-index: 1000;\r\n\tpointer-events: all;\r\n  }\r\n  \r\n  .filter-panel-container foreignObject {\r\n\toverflow: visible;\r\n  }\r\n  \r\n  .filter-panel-container div {\r\n\tfont-family: Arial, sans-serif;\r\n\tcolor: #333;\r\n  }\r\n  \r\n  .filter-panel-container h3 {\r\n\tfont-size: 14px;\r\n\tmargin-top: 0;\r\n\tmargin-bottom: 10px;\r\n  }\r\n  \r\n  .filter-panel-container label {\r\n\tfont-size: 13px;\r\n\ttransition: background-color 0.2s;\r\n  }\r\n  \r\n  .filter-panel-container label:hover {\r\n\tbackground-color: #f5f5f5;\r\n  }\r\n  \r\n  .filter-panel-container button {\r\n\ttransition: opacity 0.2s;\r\n  }\r\n  \r\n  .filter-panel-container button:hover {\r\n\topacity: 0.9;\r\n  }\r\n  \r\n  /* Estilo para señales seleccionadas/no seleccionadas */\r\n  .signal-filtered {\r\n\topacity: 0.4;\r\n  }\r\n\r\n";
    styleInject(css_248z);

    // main class which constructs the signal wave viewer
    class WaveGraph {
        constructor(svg) {
            this.is_first_draw = true; // flag which indicates if the graph was already drawn
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
            this.timeZoom = d3__namespace.zoom()
                .scaleExtent([1 / Math.max(1, timeRange[1]), 1.1])
                .translateExtent([[timeRange[0], 0], [timeRange[1], 0]])
                .on('zoom', this._zoomed.bind(this));
            this.dataG.call(this.timeZoom);
        }
        _zoomed(ev) {
            // https://stackoverflow.com/questions/69109270/updating-d3-zoom-behavior-from-v3
            var range = this.xRange;
            var t = ev.transform;
            range[1] - range[0];
            if (!this.xAxisG)
                return;
            const domainElm = this.xAxisG.select('.domain');
            if (!domainElm)
                return;
            const domainElmNode = domainElm.node();
            if (!domainElmNode)
                return;
            const sizes = this.sizes;
            const xAxisScale = d3__namespace.scaleLinear()
                .domain(this.xRange)
                .range([0, sizes.width]);
            let zoomedScale = t.rescaleX(xAxisScale);
            const xAxis = this.xAxis;
            if (!xAxis)
                return;
            xAxis.scale(zoomedScale);
            this.sizes.row.range = zoomedScale.domain();
            // update tick formatter becase time range has changed
            // and we may want to use a different time unit
            xAxis.tickFormat(createTimeFormatterForTimeRange(this.sizes.row.range));
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
            const xAxisScale = this.waveRowX = d3__namespace.scaleLinear()
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
                this.xAxis = d3__namespace.axisTop(xAxisScale)
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
                    'icon': freeSolidSvgIcons.faQuestion,
                    'tooltip': 'd3-wave help placeholder',
                    'onclick': function () {
                        _this.helpPanel.toggle();
                    }
                },
                {
                    'icon': freeSolidSvgIcons.faDownload,
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
                    'icon': freeSolidSvgIcons.faArrowsH,
                    'tooltip': 'Reset time zoom to fit screen',
                    'onclick': function () {
                        _this.zoomReset();
                    }
                },
                {
                    'icon': freeSolidSvgIcons.faFilter,
                    'tooltip': 'Filter signals to display',
                    'onclick': function () {
                        // Implement filtering
                        _this.filterPanel.toggle();
                    }
                },
                {
                    'icon': freeSolidSvgIcons.faRefresh,
                    'tooltip': 'Regenerate deleted signals',
                    'onclick': function () {
                        if (_this._allData) {
                            _this.bindData(_this._allData);
                        }
                        else {
                            console.error("No data available to bind");
                        }
                        _this.draw();
                    }
                },
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
            this.waveRowY = d3__namespace.scaleLinear()
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
                        const parent = d3__namespace.select(this);
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
        addChildSignal(parentSignalName, newSignalData, removedSignals) {
            var _a, _b, _c, _d;
            if (!this._allData) {
                //console.error("No data available to add a child signal");
                throw new Error("No data available to add a child signal");
            }
            //console.log(`Searching for parent signal with name: ${parentSignalName}`);
            function findSignalByName(signal, name) {
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
            let bitSignals = [];
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
                const binaryValue = (_a = dataEntries[i + 1]) === null || _a === void 0 ? void 0 : _a.substring(1); // Remueve la 'b'
                if (binaryValue) {
                    for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
                        const bitValue = (_b = binaryValue[bitCount - 1 - bitIndex]) !== null && _b !== void 0 ? _b : 'X'; // Manejar valores desconocidos
                        bitSignals[bitIndex].data.push([time, bitValue, 0]);
                    }
                }
                else {
                    console.warn(`Missing binary value for time: ${time}`);
                }
            }
            // Agregar las señales hijas al padre
            parentSignal.children.push(...bitSignals);
            this.data.push(...bitSignals);
            //search in this.data the parent signal and add the new bitSignals
            console.warn(`removedSignals: ${removedSignals.toString()}`);
            let _allData2 = this._allData;
            (_c = this.treelist) === null || _c === void 0 ? void 0 : _c.data(this._allData);
            //filter the removed data by using the function treelist.filter
            (_d = this.treelist) === null || _d === void 0 ? void 0 : _d.filter((d) => {
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
            this.labelContextMenu.autoBreakDownSignals();
            this.labelContextMenu.autoBreakDownSignals();
        }
        zoomReset() {
            if (!this.timeZoom)
                throw new Error("timeZoom was not initialized");
            this.dataG.call(this.timeZoom.transform, d3__namespace.zoomIdentity);
        }
        //zoomToTimeRange(start: number, end: number) {
        //	if (!this.timeZoom)
        //		throw new Error("timeZoom was not initialized");
        //	d3.zoomTransform
        //	this.dataG.call(this.timeZoom.scaleBy, d3.zoomIdentity)
        //}
        // Modifica el método compareAndAnnotateSignals para detectar rangos de diferencias
        compareAndAnnotateSignals() {
            if (!this._allData) {
                console.error("No data available to compare signals");
                return;
            }
            // Función para encontrar señales por nombre
            const findSignalByName = (signal, name) => {
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
            };
            // Buscar las señales S y S*
            const signalS = findSignalByName(this._allData, 'S');
            const signalStar = findSignalByName(this._allData, 'S*');
            if (!signalS || !signalStar) {
                console.error("Could not find both S and S* signals");
                return;
            }
            if (signalS.type.width == 1 && signalStar.type.width == 1) {
                // Reiniciar las anotaciones anteriores
                signalS.annotations = [];
                // Asegurarnos de que tenemos datos
                if (!signalS.data.length || !signalStar.data.length) {
                    console.warn("One or both signals have no data points");
                    return;
                }
                // Encontrar el tiempo final (máximo) del rango visible
                // Usamos explícitamente el tiempo final que se muestra en la gráfica
                signalS.data[signalS.data.length - 1][0];
                signalStar.data[signalStar.data.length - 1][0];
                // Usar el rango de tiempo actual para extender el último diff correctamente
                const visibleEndTime = this.sizes.row.range[1];
                // Crear un mapa de valores para búsqueda rápida
                const sStarValueMap = new Map();
                signalStar.data.forEach(dataPoint => {
                    sStarValueMap.set(dataPoint[0], dataPoint[1]);
                });
                let inDiffRange = false;
                let diffStartTime = 0;
                // Verificar cada punto de datos de la señal S
                for (let i = 0; i < signalS.data.length; i++) {
                    const timeS = signalS.data[i][0];
                    const valueS = signalS.data[i][1];
                    // Obtener el valor correspondiente de S*
                    let valueStar = sStarValueMap.get(timeS);
                    if (valueStar === undefined) {
                        // Si no hay un valor exacto, buscar el valor más cercano
                        valueStar = this.findClosestValueBefore(signalStar.data, timeS);
                    }
                    const isDifferent = valueS !== valueStar;
                    // Comenzar un nuevo rango de diferencia
                    if (isDifferent && !inDiffRange) {
                        diffStartTime = timeS;
                        inDiffRange = true;
                    }
                    // Finalizar un rango de diferencia existente
                    else if (!isDifferent && inDiffRange) {
                        // Add a CSS class to indicate an invalid signal
                        //mark the signal as .d3-wave .value-diff rect  for the range 
                        signalS.annotations.push({
                            time: (diffStartTime + timeS) / 2,
                            startTime: diffStartTime,
                            endTime: timeS,
                            text: "diff",
                            color: "#FF0000"
                        });
                        inDiffRange = false;
                    }
                    // Si es el último punto y todavía estamos en un rango de diferencia,
                    // extenderlo hasta el final del rango visible
                    if (i === signalS.data.length - 1 && inDiffRange) {
                        signalS.annotations.push({
                            time: (diffStartTime + visibleEndTime) / 2,
                            startTime: diffStartTime,
                            endTime: visibleEndTime,
                            text: "diff",
                            color: "#FF0000"
                        });
                    }
                }
                // Si no hemos añadido ninguna anotación pero sabemos que el último punto de S
                // es diferente del último punto de S*, agregar una anotación final
                if (signalS.annotations.length === 0) {
                    const lastValueS = signalS.data[signalS.data.length - 1][1];
                    const lastValueStar = signalStar.data[signalStar.data.length - 1][1];
                    if (lastValueS !== lastValueStar) {
                        const lastTimeS = signalS.data[signalS.data.length - 1][0];
                        signalS.annotations.push({
                            time: (lastTimeS + visibleEndTime) / 2,
                            startTime: lastTimeS,
                            endTime: visibleEndTime,
                            text: "diff",
                            color: "#FF0000"
                        });
                    }
                }
                // Asegurarse de que las anotaciones no comiencen antes del primer punto visible
                const visibleStartTime = Math.max(0, this.sizes.row.range[0]);
                signalS.annotations = signalS.annotations.map(annotation => {
                    if (annotation.startTime !== undefined && annotation.startTime < visibleStartTime) {
                        annotation.startTime = visibleStartTime;
                    }
                    return annotation;
                });
            }
            else {
                // Si las señales son diferente, se marcan con lineas rojas diagonales 
                // Reiniciar las anotaciones anteriores
                signalS.annotations = [];
                // Asegurarnos de que tenemos datos
                if (!signalS.data.length || !signalStar.data.length) {
                    console.warn("One or both signals have no data points");
                    return;
                }
                // Encontrar el tiempo final (máximo) del rango visible
                // Usamos explícitamente el tiempo final que se muestra en la gráfica
                signalS.data[signalS.data.length - 1][0];
                signalStar.data[signalStar.data.length - 1][0];
                // Usar el rango de tiempo actual para extender el último diff correctamente
                const visibleEndTime = this.sizes.row.range[1];
                // Crear un mapa de valores para búsqueda rápida
                const sStarValueMap = new Map();
                signalStar.data.forEach(dataPoint => {
                    sStarValueMap.set(dataPoint[0], dataPoint[1]);
                });
                let inDiffRange = false;
                let diffStartTime = 0;
                // Verificar cada punto de datos de la señal S
                for (let i = 0; i < signalS.data.length; i++) {
                    const timeS = signalS.data[i][0];
                    const valueS = signalS.data[i][1];
                    // Obtener el valor correspondiente de S*
                    let valueStar = sStarValueMap.get(timeS);
                    if (valueStar === undefined) {
                        // Si no hay un valor exacto, buscar el valor más cercano
                        valueStar = this.findClosestValueBefore(signalStar.data, timeS);
                    }
                    const isDifferent = valueS !== valueStar;
                    // Comenzar un nuevo rango de diferencia
                    if (isDifferent && !inDiffRange) {
                        diffStartTime = timeS;
                        inDiffRange = true;
                    }
                    // Finalizar un rango de diferencia existente
                    else if (!isDifferent && inDiffRange) {
                        // Add a CSS class to indicate an invalid signal
                        //mark the signal as .d3-wave .value-diff rect  for the range 
                        signalS.annotations.push({
                            time: (diffStartTime + timeS) / 2,
                            startTime: diffStartTime,
                            endTime: timeS,
                            text: "",
                            color: "#FF0000"
                        });
                        inDiffRange = false;
                    }
                    // Si es el último punto y todavía estamos en un rango de diferencia,
                    // extenderlo hasta el final del rango visible
                    if (i === signalS.data.length - 1 && inDiffRange) {
                        signalS.annotations.push({
                            time: (diffStartTime + visibleEndTime) / 2,
                            startTime: diffStartTime,
                            endTime: visibleEndTime,
                            text: "",
                            color: "#FF0000"
                        });
                    }
                }
                // Si no hemos añadido ninguna anotación pero sabemos que el último punto de S
                // es diferente del último punto de S*, agregar una anotación final
                if (signalS.annotations.length === 0) {
                    const lastValueS = signalS.data[signalS.data.length - 1][1];
                    const lastValueStar = signalStar.data[signalStar.data.length - 1][1];
                    if (lastValueS !== lastValueStar) {
                        const lastTimeS = signalS.data[signalS.data.length - 1][0];
                        signalS.annotations.push({
                            time: (lastTimeS + visibleEndTime) / 2,
                            startTime: lastTimeS,
                            endTime: visibleEndTime,
                            text: "",
                            color: "#FF0000"
                        });
                    }
                }
                // Asegurarse de que las anotaciones no comiencen antes del primer punto visible
                const visibleStartTime = Math.max(0, this.sizes.row.range[0]);
                signalS.annotations = signalS.annotations.map(annotation => {
                    if (annotation.startTime !== undefined && annotation.startTime < visibleStartTime) {
                        annotation.startTime = visibleStartTime;
                    }
                    return annotation;
                });
                this.compareChildSignals(signalS, signalStar);
            }
        }
        compareChildSignals(signalS, signalStar) {
            if (!signalS.children || !signalStar.children) {
                return;
            }
            // Comparar cada señal bit a bit
            for (let i = 0; i < signalS.children.length; i++) {
                const bitSignalS = signalS.children[i];
                // Buscar la señal correspondiente en S*
                const bitIndexMatch = bitSignalS.name.match(/_bit(\d+)$/);
                if (!bitIndexMatch)
                    continue;
                const bitIndex = bitIndexMatch[1];
                const bitSignalStar = signalStar.children.find(child => child.name.includes(`_bit${bitIndex}`));
                if (!bitSignalStar)
                    continue;
                // Reiniciar las anotaciones
                bitSignalS.annotations = [];
                // Crear un mapa de valores para búsqueda rápida
                const sStarValueMap = new Map();
                bitSignalStar.data.forEach(dataPoint => {
                    sStarValueMap.set(dataPoint[0], dataPoint[1]);
                });
                let inDiffRange = false;
                let diffStartTime = 0;
                const visibleEndTime = this.sizes.row.range[1];
                // Verificar cada punto de datos del bit
                for (let j = 0; j < bitSignalS.data.length; j++) {
                    const timeS = bitSignalS.data[j][0];
                    const valueS = bitSignalS.data[j][1];
                    // Obtener el valor correspondiente de S* bit
                    let valueStar = sStarValueMap.get(timeS);
                    if (valueStar === undefined) {
                        // Si no hay un valor exacto, buscar el valor más cercano
                        valueStar = this.findClosestValueBefore(bitSignalStar.data, timeS);
                    }
                    const isDifferent = valueS !== valueStar;
                    // Comenzar un nuevo rango de diferencia
                    if (isDifferent && !inDiffRange) {
                        diffStartTime = timeS;
                        inDiffRange = true;
                    }
                    // Finalizar un rango de diferencia existente
                    else if (!isDifferent && inDiffRange) {
                        bitSignalS.annotations.push({
                            time: (diffStartTime + timeS) / 2,
                            startTime: diffStartTime,
                            endTime: timeS,
                            text: "diff",
                            color: "#FF0000"
                        });
                        inDiffRange = false;
                    }
                    // Si es el último punto y todavía estamos en un rango de diferencia
                    if (j === bitSignalS.data.length - 1 && inDiffRange) {
                        bitSignalS.annotations.push({
                            time: (diffStartTime + visibleEndTime) / 2,
                            startTime: diffStartTime,
                            endTime: visibleEndTime,
                            text: "diff",
                            color: "#FF0000"
                        });
                    }
                }
            }
        }
        // Método auxiliar para encontrar el valor más cercano antes de un tiempo dado
        findClosestValueBefore(data, time) {
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
    }

    /**
     * Returns an array with strings of the given size.
     *
     * @param str  string to split
     * @param chunkSize Size of every group
     */
    function chunkString(str, chunkSize) {
        return Array(Math.ceil(str.length / chunkSize)).fill(undefined).map(function (_, i) {
            return str.slice(i * chunkSize, i * chunkSize + chunkSize);
        });
    }
    const PREVIEW_TYPE = Object.assign({ HEX_BYTES: function (d, size) {
            var res = SCALAR_FORMAT.UINT_HEX(d[1]);
            var extend = '0';
            if (res[0] == 'X') {
                extend = 'X';
            }
            res = res.padStart(2 * size, extend);
            return chunkString(res, 2);
        }, ASCII: "ASCII" }, SCALAR_FORMAT);
    class HexEdit {
        constructor(parent) {
            // view config
            this.addrRange = [0, 8 * 4];
            this.addrStep = 4;
            this.addrPos = 0;
            this.dataWordCellCnt = 4;
            // data
            this._data = null;
            this.currentData = [];
            this.currentTime = 0;
            // html elements
            this.parent = parent;
            this.mainTable = null;
            this.dataAreas = []; // list of td elements in the rows which are displaying the data
        }
        /**
        * Get or set data to this viewer
        */
        data(data) {
            if (arguments.length) {
                var w = data.type.width;
                if (!w || w.length != 2)
                    throw new Error("NotImplementedv (only 1 level of index and width of element)");
                this.dataWordCellCnt = this.addrStep = Math.ceil(w[w.length - 1] / 8);
                this.addrRange = [0, w[0] * this.addrStep];
                this._data = data;
            }
            else {
                return this._data;
            }
        }
        // update select of data based on time
        setTime(newTime) {
            if (this.currentTime === newTime) {
                return;
            }
            // build currentData from update informations from data
            let cd = this.currentData;
            const t = this.currentTime;
            if (!this._data)
                return;
            const data = this._data.data;
            let startI = 0;
            if (newTime > t) {
                // update current data
                startI = binarySearch(data, [t, "", 0], (el0, el1) => { return (el0[0] > el1[0]); }, function (ar, el) {
                    if (el < ar[0]) {
                        return 0;
                    }
                    if (el > ar[ar.length - 1]) {
                        return ar.length;
                    }
                    return -1;
                });
            }
            else {
                // create completly new data
                cd = this.currentData = [];
            }
            for (var i = startI; i < data.length && data[i][0] <= newTime; i++) {
                const d = data[i][1]; // [0] is time, 
                const addr = d[0];
                const val = d[1];
                if (typeof addr === 'number')
                    cd[addr] = val;
                else {
                    if (addr.length != 1)
                        throw new Error("NotImplemented - array with multiple dimensions");
                    cd[addr[0]] = val;
                }
            }
        }
        draw() {
            if (!this.mainTable) {
                const t = this.mainTable = this.parent.append("table")
                    .classed("d3-wave-hexedit", true);
                var inWordAddrTitles = [];
                for (var i = 0; i < this.dataWordCellCnt + 1; i++) {
                    // the first one is padding for address column
                    var title;
                    if (i == 0) {
                        title = "";
                    }
                    else {
                        title = (i - 1).toString(16).padStart(2, "0");
                    }
                    inWordAddrTitles.push(title);
                }
                t.append("tr")
                    .selectAll('td')
                    .data(inWordAddrTitles).enter()
                    .append('td')
                    .classed("word-addr", true)
                    .text(function (d) {
                    return d;
                });
                this.dataAreas = [];
                var first = true;
                for (var a = this.addrRange[0]; a < this.addrRange[1]; a += this.addrStep) {
                    // construct the rows of the table
                    var tr = t.append("tr");
                    // print first column with address
                    tr.append("td")
                        .classed("addr", true)
                        .text("0x" + a.toString(16).padStart(2, "0"));
                    if (first) {
                        // first row contains the dell with data which spans over whole table
                        // the data is in another table because we want to exclude the address
                        // column from text selection in data area
                        first = false;
                        const da = tr.append("td");
                        da.classed("data", true)
                            .attr("colspan", this.dataWordCellCnt)
                            .attr("rowspan", (this.addrRange[1] - this.addrRange[0]) / this.addrStep);
                        this.dataAreas.push(da);
                    }
                }
                const dtable = this.dataAreas[this.dataAreas.length - 1].append("table");
                this.dataAreas[0];
                const maxI = this.addrRange[1] / this.addrStep;
                for (var i = this.addrRange[0] / this.addrStep; i < maxI; i++) {
                    let d = this.currentData[i];
                    if (d === undefined) {
                        d = "X";
                    }
                    var byteStrings = PREVIEW_TYPE.HEX_BYTES(d, this.dataWordCellCnt).reverse();
                    dtable.append("tr")
                        .selectAll("td")
                        .data(byteStrings)
                        .enter()
                        .append("td")
                        .classed("invalid", (d) => d.indexOf("X") >= 0)
                        .text((d) => d);
                }
            }
        }
    }

    exports.HexEdit = HexEdit;
    exports.RowRendererBit = RowRendererBit;
    exports.RowRendererBits = RowRendererBits;
    exports.WaveGraph = WaveGraph;
    exports.filterDataByTime = filterDataByTime;

}));
//# sourceMappingURL=d3-wave.js.map
