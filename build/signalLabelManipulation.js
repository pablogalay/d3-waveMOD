import * as d3 from 'd3';
;
export class SignalLabelManipulation {
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
        labels.call(d3.drag()
            .on('start', function (ev, d) {
            return _this.dragStarted(ev, d3.select(this), d);
        })
            .on('drag', function (ev, d) {
            return _this.dragged(ev, d3.select(this), d);
        })
            .on('end', function (ev, d) {
            return _this.dragEnded(ev, d3.select(this), d);
        }));
    }
}
//# sourceMappingURL=signalLabelManipulation.js.map