import esbuild from 'esbuild';
import browserConfig from './esbuild-browser-config.cjs';
import packageJson from './package.json' assert { type: 'json' };

// list of dependencies that _dont_ ship cjs
const includeList = new Set([
  'multiformats'
]);

// create list of dependencies that we _do not_ want to include in our bundle
const excludeList = [];
for (const dependency in packageJson.dependencies) {
  if (includeList.has(dependency)) {
    continue;
  } else {
    excludeList.push(dependency);
  }
}

esbuild.build({
  entryPoints    : [ './src/main.ts' ],
  bundle         : true,
  external       : excludeList,
  format         : 'cjs',
  sourcemap      : true,
  platform       : 'node',
  outfile        : 'dist/cjs/main.js',
  allowOverwrite : true
});

// esm polyfilled bundle for browser
esbuild.build({
  ...browserConfig,
  outfile: 'dist/browser.mjs',
});

// iife polyfilled bundle for browser
esbuild.build({
  ...browserConfig,
  format     : 'iife',
  globalName : 'Web5Common',
  outfile    : 'dist/browser.js',
});