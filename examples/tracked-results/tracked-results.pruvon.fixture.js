import * as trackedResults from './tracked-results.js';

export function isEven(args) {
  return trackedResults.isEven(Number(args[0]));
}
