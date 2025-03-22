export class RowRendererBase {
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
//# sourceMappingURL=base.js.map