import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('public/vendor',{recursive:true});await mkdir('public/licenses',{recursive:true});
for(const name of ['occt-import-js.js','occt-import-js.wasm'])await copyFile('node_modules/occt-import-js/dist/'+name,'public/vendor/'+name);
await copyFile('node_modules/occt-import-js/LICENSE.md','public/licenses/occt-import-js-LICENSE.md');
await copyFile('node_modules/three/LICENSE','public/licenses/three-LICENSE.txt');
await writeFile('public/licenses/NOTICE.txt',`STEP Viewer third-party notices\n\nThree.js — MIT; https://github.com/mrdoob/three.js\nocct-import-js — LGPL-2.1; https://github.com/kovacsv/occt-import-js\nOpen CASCADE Technology — LGPL-2.1 with additional exception; https://dev.opencascade.org/resources/licensing\nUnmodified WASM distributed by occt-import-js. Source and build scripts: https://github.com/kovacsv/occt-import-js\nOCCT source: https://github.com/Open-Cascade-SAS/OCCT\nReplace vendor files and rebuild to use a modified compatible version.\nSample: occt-import-js test/testfiles/simple-basic-cube/cube.stp\n`);
