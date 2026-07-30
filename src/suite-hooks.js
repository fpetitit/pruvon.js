import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadSuiteHooks(cwd) {
  const suiteHooksPath = path.join(cwd, 'pruvon.suite.js');
  if (!fs.existsSync(suiteHooksPath)) return {};
  return import(pathToFileURL(suiteHooksPath).href);
}
