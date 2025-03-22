// https://github.com/patorjk/d3-context-menu v1.1.2 modified to be bundable
import * as d3 from 'd3';
import './d3-context-menu.css';
export class ContextMenuItem {
    constructor(title, data, children, divider, disabled, action) {
        this.title = title;
        this.children = children;
        this.divider = divider;
        this.disabled = disabled;
        this.action = action;
        this.data = data;
    }
}
;
export class LeftTop {
    constructor(left, top) {
        this.left = left;
        this.top = top;
    }
}
let ContextMenu_currentlyShownInstance = null;
export class ContextMenu {
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
            d3.select('.d3-context-menu').remove();
            d3.select('body').on('mousedown.d3-context-menu', null);
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
        d3.selectAll('.d3-context-menu').data([new ContextMenuItem("", data, [], false, false, null)])
            .enter()
            .append('div')
            .attr('class', 'd3-context-menu ' + this.getTheme(element, data));
        const closeMenu = this.closeMenu.bind(this);
        // close menu on mousedown outside
        d3.select('body').on('mousedown.d3-context-menu', closeMenu);
        d3.select('body').on('click.d3-context-menu', closeMenu);
        const parent = d3.selectAll('.d3-context-menu')
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
        d3.select('.d3-context-menu')
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
        ;
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
            var listItem = d3.select(this)
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
//# sourceMappingURL=contextMenu.js.map