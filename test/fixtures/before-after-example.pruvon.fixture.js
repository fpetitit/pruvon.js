export const calls = [];

export function beforeExample({ fnName, args }) {
  calls.push({ hook: 'before', fnName, args });
}

export function afterExample({ fnName, args, passed }) {
  calls.push({ hook: 'after', fnName, args, passed });
}

export function add(args) {
  return Number(args[0]) + Number(args[1]);
}
