import * as d3 from 'd3';
import './d3-context-menu.css';
declare type ValOrGetter<T, retT> = retT | ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<T>, index: number) => retT);
export declare class ContextMenuItem<T> {
    title: ValOrGetter<T, string>;
    data: T;
    children: ValOrGetter<T, ContextMenuItem<any>[]>;
    divider: ValOrGetter<T, boolean>;
    disabled: ValOrGetter<T, boolean>;
    action: null | ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<T>, index: number) => void);
    constructor(title: ValOrGetter<T, string>, data: T, children: ValOrGetter<T, ContextMenuItem<any>[]>, divider: ValOrGetter<T, boolean>, disabled: ValOrGetter<T, boolean>, action: null | ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<T>, index: number) => void));
}
export declare class LeftTop {
    left: number;
    top: number;
    constructor(left: number, top: number);
}
export declare class ContextMenu<T> {
    constructor();
    static isFn(value: any): boolean;
    getMenuItems(d: ContextMenuItem<T>): ContextMenuItem<any>[];
    onOpen(element: SVGGElement, data: T): boolean;
    onClose(): void;
    getTheme(element: SVGGElement, data: T): string;
    getPosition(element: SVGGElement, data: T): LeftTop | undefined;
    closeMenu(): void;
    /**
     * Context menu event handler
     * @param {*} data
     */
    render(element: SVGGElement, ev: any, data: T): void;
    _renderNestedMenu(parent: d3.Selection<HTMLUListElement, any, any, any>, root: SVGGElement, depth?: number): void;
}
export {};
