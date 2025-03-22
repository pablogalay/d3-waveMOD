import * as d3 from 'd3';
import { RowRendererBase } from './base';
export class RowRendererBit extends RowRendererBase {
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
                if (val.indexOf('X') >= 0) {
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
        var line = d3.line()
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
            .curve(d3.curveStepAfter);
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
//# sourceMappingURL=bit.js.map