export class WaveGraphSizesRow {
    constructor() {
        this.range = [0, 1];
        this.height = 20;
        this.ypadding = 5;
    }
}
export class WaveGraphSizesMargin {
    constructor() {
        this.top = 20;
        this.right = 20;
        this.bottom = 20;
        this.left = 180;
    }
}
export class WaveGraphSizes {
    constructor() {
        this.row = new WaveGraphSizesRow();
        this.margin = new WaveGraphSizesMargin();
        this.dragWidth = 5;
        this.width = -1;
        this.height = -1;
    }
}
;
//# sourceMappingURL=sizes.js.map