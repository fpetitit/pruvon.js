import * as basket from '../src/basket.js';

export function sum(args) {
  return basket.sum(args.map(Number));
}

export function sub(args) {
  return basket.sub(...args.map(Number));
}
