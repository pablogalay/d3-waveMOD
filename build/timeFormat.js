export const TIME_UNITS = [
    [1, 'ps'],
    [1000, 'ns'],
    [1000000, 'us'],
    [1000000000, 'ms'],
    [1000000000000, 's']
];
export function createTimeFormatter(divider, unitName) {
    return function (d, i) {
        var v = d / divider;
        if (Number.isInteger(v)) {
            return v + ' ' + unitName;
        }
        return v.toFixed(2) + ' ' + unitName;
    };
}
export function createTimeFormatterForTimeRange(timeRange) {
    const _timeRange = timeRange[1] - timeRange[0];
    for (var i = 0; i < TIME_UNITS.length; i++) {
        var u = TIME_UNITS[i];
        if (_timeRange < 1000 * u[0] || i === TIME_UNITS.length - 1) {
            return createTimeFormatter(u[0], u[1]);
        }
    }
    throw new Error("Time out of range of defined units");
}
//# sourceMappingURL=timeFormat.js.map