import { RowRendererBits } from './bits';
export const STRING_FORMAT = {
    "STRING": (d) => d.toString(),
};
/**
 * A renderer for enum value rows, enum value is a string, "" is resolved as invalid value
 * and is rendered with red color
 */
export class RowRendererEnum extends RowRendererBits {
    constructor(waveGraph) {
        super(waveGraph);
        this.FORMATTERS = STRING_FORMAT;
        this.DEFAULT_FORMAT = STRING_FORMAT.STRING;
    }
    select(typeInfo) {
        return typeInfo.name === 'enum';
    }
    isValid(d) {
        return d[1] !== '';
    }
}
//# sourceMappingURL=enum.js.map