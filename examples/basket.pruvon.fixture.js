import * as basket from './basket.js';

export function sum(args) {
  return basket.sum(args.map(Number));
}

export function sub(args) {
  return basket.sub(...args.map(Number));
}
