import {transform} from 'esbuild';
import {transformAsync} from '@babel/core';
import amd from '@babel/plugin-transform-modules-amd';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile, readdir} from 'node:fs/promises';
execFileSync('python3', ['tools/build-icons.py']);
// The vendored adapter is already an ES module; copying preserves readable source and provenance.
const siennaSource = await readFile('thirdparty/sienna/src/sienna.js', 'utf8');
await writeFile('amd/src/sienna.js', siennaSource.replace('/*!', '/* @preserve'));
for (const filename of (await readdir('amd/src')).filter(name => name.endsWith('.js'))) {
    const source = await readFile(`amd/src/${filename}`, 'utf8');
    const moduleName = `local_sis_accessibility/${filename.slice(0, -3)}`;
    const converted = await transformAsync(source, {babelrc: false, configFile: false,
        plugins: [[amd, {moduleId: moduleName}]], moduleIds: true, moduleId: moduleName,
        sourceMaps: true, sourceFileName: `../src/${filename}`});
    const input = converted.code + '\n//# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(JSON.stringify(converted.map)).toString('base64');
    const result = await transform(input, {minify: true, target: 'es2018', legalComments: 'inline',
        sourcemap: 'external', sourcefile: filename});
    const output = `${filename.slice(0, -3)}.min.js`;
    await writeFile(`amd/build/${output}`, result.code + `//# sourceMappingURL=${output}.map\n`);
    await writeFile(`amd/build/${output}.map`, result.map);
}
