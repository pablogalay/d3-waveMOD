
export function filterDataByTime (data, rowRange) {
    // return list ([time, value, duration])
    var min = rowRange[0];
    if (min < 0) { throw new Error('min time has to be >= 0'); }
    var max = rowRange[1];
    var _data = [];

    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var t = d[0];

        if (t < min) {
            // data before actual dataset
        } else if (t <= max) {
            let prev = data[i - 1];
            if (_data.length === 0 && t !== min) {
                // first data, unaligned
                let prevVal;
                if (!prev) {
                    prevVal = 'bX';
                } else {
                    prevVal = prev[1];
                }
                _data.push([min, prevVal, d[0] - min]);
            }
            // normal data in range
            var next = data[i + 1];
            var nextTime;
            if (next) {
                nextTime = next[0];
            } else {
                nextTime = max;
            }

            _data.push([d[0], d[1], nextTime - d[0]]);
        } else {
            if (_data.length === 0) {
                // selection range smaller than one data item
                let prev = data[i - 1];
                let prevVal;
                if (!prev) {
                    prevVal = 'bX';
                } else {
                    prevVal = prev[1];
                }
                _data.push([min, prevVal, max]);
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
        } else {
            lastVal = last[1];
        }
        _data.push([min, lastVal, max]);
    }

    return _data;
}
