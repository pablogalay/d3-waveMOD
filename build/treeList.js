import * as d3 from 'd3';
import { Scrollbar } from './scrollbar';
import { SignalLabelManipulation } from './signalLabelManipulation';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
export class TreeList {
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
    }
    static getExpandCollapseIcon(d) {
        if (d.data.children || d.data._children) {
            var ico = faChevronRight;
            if (d.children != null) {
                ico = faChevronDown;
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
            d3.select(elm.parentElement)
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
        this.root = d3.hierarchy(_data, function (d) { return d.children; });
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
            .attr('transform', 'translate(0,' + -(barHeight / 2) + ')' + ' scale(' + (barHeight / faChevronDown.icon[1] * 0.5) + ')')
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
            d3.select(this)
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
//# sourceMappingURL=treeList.js.map