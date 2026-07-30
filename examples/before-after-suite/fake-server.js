let running = false;

export function start() {
  running = true;
}

export function stop() {
  running = false;
}

export function ping() {
  if (!running) throw new Error('server is not running');
  return 'pong';
}
