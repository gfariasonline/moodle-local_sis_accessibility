import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, readdirSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const out = mkdtempSync(join(tmpdir(), 'sis-a11y-tests-'));
try {
    const files = readdirSync('tests/js').filter(name => name.endsWith('.test.mjs'));
    await build({entryPoints: files.map(name => 'tests/js/' + name), bundle: true,
        plugins: [{name: 'test-source-url', setup(build) {
            build.onLoad({filter: /\.test\.mjs$/}, args => ({
                contents: readFileSync(args.path, 'utf8').replaceAll('import.meta.url', JSON.stringify(pathToFileURL(args.path).href)),
                loader: 'js',
            }));
        }}],
        platform: 'node', format: 'cjs', packages: 'external', outdir: out, outExtension: {'.js': '.cjs'},
        alias: Object.fromEntries(readdirSync('amd/src').filter(name => name.endsWith('.js')).map(name => name.slice(0, -3)).map(name => ['local_sis_accessibility/' + name, './amd/src/' + name + '.js']))});
    // Resolve jsdom from this project while executing temporary bundles.
    const run = spawnSync(process.execPath, ['--test', ...files.map(name => join(out, name.replace('.mjs', '.cjs')))],
        {stdio: 'inherit', env: {...process.env, NODE_PATH: process.cwd() + '/node_modules'}});
    if (run.error) { throw run.error; }
    process.exitCode = run.status ?? 1;
} finally { rmSync(out, {recursive: true, force: true}); }
