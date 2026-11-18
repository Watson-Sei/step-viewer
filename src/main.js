import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
const $ = (id) => document.getElementById(id);
const openControl=document.querySelector('.open');openControl.tabIndex=0;openControl.setAttribute('role','button');openControl.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click();}};
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100000);
let renderer, controls, model = new THREE.Group(), worker, request = 0, radius = 10;
let showEdges = true;
scene.add(model, new THREE.HemisphereLight(0xc6e2ff, 0x384043, 2.5));
for (const [position, intensity] of [[[1,2,3],3],[[-2,1,-1],2]]) { const light = new THREE.DirectionalLight(0xffffff,intensity); light.position.set(...position); scene.add(light); }
function error(message) { $('error').textContent = message; $('error').hidden = false; }
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0,0);
  $('canvas').append(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
  new ResizeObserver(() => { const {width,height} = $('canvas').getBoundingClientRect(); camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height); }).observe($('canvas'));
  renderer.setAnimationLoop(() => {controls.update();renderer.render(scene,camera);});
} catch { error('WebGLを開始できませんでした。対応ブラウザでハードウェアアクセラレーションを有効にしてください。'); }
function clear(group) { group.traverse(o => { o.geometry?.dispose(); (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose()); }); }
function view(direction = [1,-1,0.8]) {
  if (!controls) return;
  const box = new THREE.Box3().setFromObject(model); if(box.isEmpty()) return;
  const center=box.getCenter(new THREE.Vector3()); radius=Math.max(box.getSize(new THREE.Vector3()).length()/2,0.01);
  const vertical=THREE.MathUtils.degToRad(camera.fov/2), horizontal=Math.atan(Math.tan(vertical)*camera.aspect);
  const distance=radius/Math.sin(Math.min(vertical,horizontal))*1.15;
  camera.up.set(0,0,1); camera.position.copy(center).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance));
  camera.near=Math.max(radius/10000,0.000001);camera.far=distance+radius*1000;camera.updateProjectionMatrix();
  controls.target.copy(center);controls.minDistance=radius*.02;controls.maxDistance=radius*100;controls.update();
}
function display(result, name, size) {
  const next=new THREE.Group(); let triangles=0;
  try {
    for(const source of result.meshes) {
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(source.attributes.position.array,3));
      geometry.setIndex(source.index.array);
      if(source.attributes.normal) geometry.setAttribute('normal',new THREE.Float32BufferAttribute(source.attributes.normal.array,3)); else geometry.computeVertexNormals();
      const makeMaterial = color => new THREE.MeshStandardMaterial({color:new THREE.Color(...(color||[.65,.79,.78])),metalness:.25,roughness:.48,side:THREE.DoubleSide});
      const materials=[makeMaterial(source.color)];
      // Preserve face colours while keeping uncoloured spans on the base material.
      let cursor=0;
      for(const face of source.brep_faces||[]) {
        const start=face.first*3,count=(face.last-face.first+1)*3;
        if(start>cursor) geometry.addGroup(cursor,start-cursor,0);
        let index=0;if(face.color){index=materials.length;materials.push(makeMaterial(face.color));}
        geometry.addGroup(start,count,index);cursor=start+count;
      }
      if(cursor<source.index.array.length)geometry.addGroup(cursor,source.index.array.length-cursor,0);
      const mesh=new THREE.Mesh(geometry,materials);next.add(mesh);
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial({color:0x203a43,transparent:true,opacity:.55}));edges.userData.edge=true;edges.visible=showEdges;next.add(edges);
      triangles+=source.index.array.length/3;
    }
    const box=new THREE.Box3().setFromObject(next);const center=box.getCenter(new THREE.Vector3());next.position.sub(center);
    const dimensions=box.getSize(new THREE.Vector3());
    scene.remove(model);clear(model);model=next;scene.add(model);
    $('filename').textContent=name;$('stats').textContent=`${result.meshes.length} メッシュ · ${triangles.toLocaleString()} 三角形 · ${(size/1024/1024).toFixed(2)} MB`;
    $('dimensions').textContent=`X ${dimensions.x.toFixed(2)} × Y ${dimensions.y.toFixed(2)} × Z ${dimensions.z.toFixed(2)} mm`;
    $('info').hidden=false;$('welcome').hidden=true;view();
  } catch(e) {clear(next);throw e;}
}
function cancel() {request++;worker?.terminate();worker=null;$('loading').hidden=true;$('file').value='';}
async function open(file) {
  if(!renderer){error('WebGLが利用できないためモデルを表示できません。');return;}
  if(!/\.(step|stp)$/i.test(file.name)){error('.step または .stp ファイルを選択してください。');return;}
  if(file.size>200*1024*1024){error('200 MB以下のファイルを選択してください。');return;}
  cancel();const id=request;$('error').hidden=true;$('loading').hidden=false;
  try {
    const buffer=await file.arrayBuffer();if(id!==request)return;
    worker=new Worker(new URL('step-worker.js', document.baseURI));
    worker.onmessage=({data})=>{if(id!==request)return;try{if(data.error)throw new Error(data.error);display(data.result,file.name,file.size);}catch(e){error(e.message);}finally{cancel();}};
    worker.onerror=()=>{if(id===request){error('読み込みエンジンが停止しました。ファイルを小さくするか、再度お試しください。');cancel();}};
    worker.postMessage(buffer,[buffer]);
  } catch(e){if(id===request){error(e.message);cancel();}}
}
$('file').onchange=()=>{if($('file').files[0])open($('file').files[0]);};
$('cancel').onclick=cancel;
$('fit').onclick=()=>view();$('iso').onclick=()=>view();$('top').onclick=()=>view([0,-.0001,1]);$('front').onclick=()=>view([0,-1,0]);
$('edges').onclick=()=>{showEdges=!showEdges;$('edges').setAttribute('aria-pressed',String(showEdges));model.traverse(o=>{if(o.userData.edge)o.visible=showEdges;});};
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f'&&!['INPUT','TEXTAREA'].includes(e.target.tagName))view();});
let dragDepth=0;
window.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;$('viewport').classList.add('drag');});
window.addEventListener('dragover',e=>e.preventDefault());
window.addEventListener('dragleave',e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;$('viewport').classList.remove('drag');}});
window.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('viewport').classList.remove('drag');if(e.dataTransfer.files[0])open(e.dataTransfer.files[0]);});
$('demo').onclick=async()=>{try{const response=await fetch(new URL('sample.step',document.baseURI));if(!response.ok)throw new Error('サンプルを取得できませんでした。');open(new File([await response.blob()],'sample.step'));}catch(e){error(e.message);}};
