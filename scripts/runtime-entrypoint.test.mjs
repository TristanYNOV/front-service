import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Execute the actual entrypoint in a disposable /app layout. Only its fixed
// filesystem location is remapped; runtime generation and the final exec run.
const shell = process.env.BASH_BIN || (process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/sh');
for (const override of [undefined, '/auth,/analysis/api,/custom']) {
  test(`entrypoint generates usable browser config (${override ? 'override' : 'defaults'})`, () => {
    const root = mkdtempSync(join(tmpdir(), 'actionboard-entrypoint-'));
    try {
      mkdirSync(join(root, 'browser'));
      mkdirSync(join(root, 'server'));
      writeFileSync(join(root, 'server/server.mjs'), '');
      const source = readFileSync(new URL('../docker/entrypoint.sh', import.meta.url), 'utf8');
      const unixRoot = root.replaceAll('\\', '/');
      const script = join(root, 'entrypoint.sh');
      writeFileSync(script, source.replaceAll('/app/', `${unixRoot}/`).replaceAll('\r\n', '\n'));
      const env = { ...process.env };
      for (const key of Object.keys(env)) {
        if (key.startsWith('AUTH_') || key === 'API_ALLOWED_PREFIXES') delete env[key];
      }
      if (override) env.API_ALLOWED_PREFIXES = override;
      const result = spawnSync(shell, [resolve(script).replaceAll('\\', '/')], { env, encoding: 'utf8', timeout: 15000 });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
      const context = { window: {} };
      vm.runInNewContext(readFileSync(join(root, 'browser/runtime-config.js'), 'utf8'), context);
      const config = context.window.__RUNTIME_CONFIG__;
      assert.ok(config.apiAllowedPrefixes.includes('/analysis/api'));
      assert.equal(config.authEndpoints.refresh, '/auth/refresh');
      if (override) assert.deepEqual(Array.from(config.apiAllowedPrefixes), override.split(','));
    } finally {
      const relativeRoot = relative(resolve(tmpdir()), resolve(root));
      assert.ok(relativeRoot && !relativeRoot.startsWith('..') && !isAbsolute(relativeRoot));
      rmSync(root, { recursive: true, force: true });
    }
  });
}
