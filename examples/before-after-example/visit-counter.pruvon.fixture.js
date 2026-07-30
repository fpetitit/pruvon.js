import * as visitCounter from './visit-counter.js';

export function beforeExample() {
  visitCounter.resetVisits();
}

export function record(args) {
  return visitCounter.recordVisit(args[0]);
}
