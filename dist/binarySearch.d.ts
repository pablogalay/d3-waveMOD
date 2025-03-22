/**
 * @param compareFn: example (a, b) => { return a - b; }
 * @param boundaryCheckFn: a function used to check array boundaris
 *        before main alg, example:
 *        function (ar, el) {
 *           if (el < ar[0]) { return 0; }
 *           if (el > ar[ar.length - 1]) { return ar.length; }
 *           return -1;
 *        }
 */
export declare function binarySearch<T>(ar: T[], el: T, compareFn: (a: T, b: T) => number, boundaryCheckFn: (arr: T[], elm: T) => number): number;
