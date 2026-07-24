import { splitName } from './name-splitter.js';

export function firstName(args) {
  return splitName(args[0]).firstName;
}

export function lastName(args) {
  return splitName(args[0]).lastName;
}
