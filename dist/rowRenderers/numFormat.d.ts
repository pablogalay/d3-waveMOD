import type { NumbericDataValue, NumbericDataVectorValue } from '../data';
export declare const SCALAR_FORMAT: {
    [formatName: string]: (d: NumbericDataValue) => string;
};
export declare const VECTOR_FORMAT: {
    [formatName: string]: (d: NumbericDataVectorValue) => string;
};
