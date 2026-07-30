export function beforeExample() {
  throw new Error('beforeExample kaboom');
}

export function add(args) {
  return Number(args[0]) + Number(args[1]);
}
