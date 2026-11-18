# STEP Viewer

STEP / STP files in a browser, hosted on GitHub Pages. Japanese UI, drag and drop, orbit/pan/zoom, fit, front/top views, face colours and edge toggle. Geometry processing runs in a cancellable Web Worker. Files stay in browser memory; there is no upload endpoint, analytics, or storage.

Select a `.step` or `.stp` file (up to 200 MB). Actual capacity depends on the device and model complexity. Dimensions show the axis-aligned bounding box in millimetres, not precision CAD measurements. Requires WebGL and WebAssembly. Sample is a 300 mm cube from occt-import-js.

## Develop

Node.js 22 or later: `npm ci`, then `npm run dev`. `npm run build` produces `dist/`. The relative Vite base supports GitHub Pages subdirectories. Vendor assets and their licences are copied by `prebuild` / `predev`; no CDN is required at runtime.

GitHub Pages serves the built `docs/` directory on main. To update: `npm ci`, `npm run build`, replace `docs/` with the build output, commit and push.

## Dependencies

Rendering: Three.js (MIT). STEP tessellation: [occt-import-js](https://github.com/kovacsv/occt-import-js) (LGPL-2.1), based on [Open CASCADE Technology](https://dev.opencascade.org/) (LGPL-2.1 with additional exception). The distributed WASM is unmodified. See `public/licenses/` for licences and source links. occt-import-js can be replaced by rebuilding with a compatible library in `node_modules`.

