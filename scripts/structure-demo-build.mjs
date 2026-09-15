import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

/*
 * 独立文档框架避免默认主题 CSS 影响结构样式的示例结论。
 * 输出是可再生文档资源，源码和组件包始终保持分离。
 */
const directory = 'public/structure-only';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--project', 'examples/structure-only/tsconfig.json'], { stdio: 'inherit' });
await mkdir(directory, { recursive: true });
await mkdir('.artifacts', { recursive: true });
const result = await build({ entryPoints: ['examples/structure-only/App.tsx'], outdir: directory, bundle: true, minify: true, metafile: true, format: 'esm', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' } });
if (Object.keys(result.metafile.inputs).some((file) => file.endsWith('/styles/theme.css'))) throw new Error('结构示例意外引入默认主题');
await writeFile('.artifacts/structure-only-metafile.json', JSON.stringify(result.metafile, null, 2));
await writeFile(`${directory}/index.html`, '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>仅结构 CSS · 两种品牌</title><link rel="stylesheet" href="App.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="App.js"></script></body></html>');
console.log('已生成不含默认主题的独立文档示例。');
