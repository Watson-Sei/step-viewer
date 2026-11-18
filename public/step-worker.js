importScripts('./vendor/occt-import-js.js');
let engine;
self.onmessage = async ({ data }) => {
  try {
    engine ||= occtimportjs({ locateFile: (name) => new URL('./vendor/' + name, self.location.href).href });
    const occt = await engine;
    const result = occt.ReadStepFile(new Uint8Array(data), { linearUnit: 'millimeter' });
    if (!result.success || !result.meshes?.length) throw new Error('表示できる形状がありません。STEP形式のファイルを確認してください。');
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message || 'STEPの読み込みに失敗しました。' }); }
};
