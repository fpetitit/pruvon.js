import * as fakeServer from './fake-server.js';

export function beforeSuite() {
  fakeServer.start();
}

export function afterSuite() {
  fakeServer.stop();
}
