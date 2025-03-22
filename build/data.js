export class WaveGraphSignalTypeInfo {
    constructor(name, width) {
        this.name = name;
        this.width = width;
    }
}
;
/**
 * Class for signal data which is used as an input to the signal wave graph.
 */
export class WaveGraphSignal {
    constructor(name, type, data, children = undefined, expanded = true) {
        this.name = name;
        this.type = type;
        this.data = data;
        if (expanded) {
            this.children = children;
        }
        else {
            this.children = children;
        }
    }
}
;
//# sourceMappingURL=data.js.map