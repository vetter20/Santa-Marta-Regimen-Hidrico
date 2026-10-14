import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js';

const host=document.getElementById('terrain');
const scene=new THREE.Scene();
scene.background=new THREE.Color('#e5f0ec');
const camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,120);
camera.position.set(10,8.2,12);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(host.clientWidth,host.clientHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.prepend(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.target.set(0,.45,0);controls.minDistance=7;controls.maxDistance=22;
scene.add(new THREE.HemisphereLight(0xeaf8ff,0x5e7664,2));
const sun=new THREE.DirectionalLight(0xffffff,2.8);sun.position.set(5,11,7);sun.castShadow=true;scene.add(sun);
const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
const waterMat=new THREE.MeshStandardMaterial({color:'#35aec8',roughness:.25,transparent:true,opacity:.94});
const riverMat=new THREE.MeshStandardMaterial({color:'#43c4df',roughness:.2,emissive:'#073b46',emissiveIntensity:.15});

// Physical-maquette base: land, coastal shelf and Caribbean.
const base=new THREE.Mesh(new THREE.BoxGeometry(10.4,.5,6.2),material('#5f7879'));
base.position.y=-.45;base.receiveShadow=true;scene.add(base);
const land=new THREE.Mesh(new THREE.BoxGeometry(10,.14,4.45),material('#87b977'));
land.position.set(0,-.1,-.62);land.receiveShadow=true;scene.add(land);
const coast=new THREE.Mesh(new THREE.BoxGeometry(10,.1,.62),material('#d8c98e'));
coast.position.set(0,-.015,1.63);scene.add(coast);
const sea=new THREE.Mesh(new THREE.BoxGeometry(10,.18,1.85),waterMat);
sea.position.set(0,-.01,2.55);scene.add(sea);

// Relief is intentionally stylised until a DEM is supplied. It is arranged as a coherent Sierra rather than isolated cones.
function ridge(x,z,sx,sy,sz,color,rot=.15){
  const geo=new THREE.ConeGeometry(1,1,9,3);
  const m=new THREE.Mesh(geo,material(color,.96));
  m.position.set(x,sy/2-.04,z);m.scale.set(sx,sy,sz);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
ridge(-3.35,-1.5,1.75,3.15,1.55,'#537f59',.3);
ridge(-2.15,-1.4,2.15,4.65,1.85,'#5d8861',-.12);
ridge(-.75,-1.36,2.05,5.25,1.85,'#678f65',.18);
ridge(.65,-1.38,1.75,3.95,1.6,'#759c68',-.2);
ridge(1.85,-1.42,1.35,2.75,1.35,'#709764',.15);
// High-elevation caps give the scale-model appearance without claiming a DEM.
function summit(x,z,sx,sy,sz){
  const c=new THREE.Mesh(new THREE.ConeGeometry(.65,.8,8,2),material('#dbe7df',.94));
  c.position.set(x,sy-.03,z);c.scale.set(sx,.72,sz);c.rotation.y=.2;c.castShadow=true;scene.add(c);
}
summit(-2.2,-1.4,1.1,3.92,.92);summit(-.75,-1.36,1.18,4.48,1.0);

// Drainage basins: translucent terrain patches show the approximate conceptual catchments.
function basin(x,z,sx,sz,rot,color){
  const g=new THREE.CircleGeometry(1,32);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,transparent:true,opacity:.13,roughness:1,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.scale.set(sx,sz,1);m.position.set(x,.055,z);scene.add(m);
}
basin(-2.0,-.72,2.2,1.55,.15,'#157e84');
basin(-.2,-.48,2.0,1.7,-.1,'#157e84');
basin(1.35,-.38,1.6,1.45,.18,'#157e84');

// Water courses are conceptual traces based on the documented coastal river system.
function river(name,points,radius=.045){
  const curve=new THREE.CatmullRomCurve3(points);
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,70,radius,7,false),riverMat);
  mesh.userData.name=name;mesh.castShadow=true;scene.add(mesh);return curve;
}
const rivers=[
  {name:'Río Manzanares',curve:river('Río Manzanares',[new THREE.Vector3(-1.7,1.35,-1.65),new THREE.Vector3(-1.55,1.0,-1.1),new THREE.Vector3(-1.72,.65,-.55),new THREE.Vector3(-1.4,.32,.18),new THREE.Vector3(-1.25,.11,.95),new THREE.Vector3(-1.05,.06,1.95)],.065)},
  {name:'Río Gaira',curve:river('Río Gaira',[new THREE.Vector3(-.35,1.15,-1.55),new THREE.Vector3(-.25,.85,-1.05),new THREE.Vector3(-.05,.5,-.55),new THREE.Vector3(.18,.25,.15),new THREE.Vector3(.45,.09,.9),new THREE.Vector3(.55,.06,1.92)],.06)},
  {name:'Río Piedras',curve:river('Río Piedras',[new THREE.Vector3(1.0,1.0,-1.45),new THREE.Vector3(1.12,.75,-.95),new THREE.Vector3(1.0,.46,-.48),new THREE.Vector3(1.18,.22,.1),new THREE.Vector3(1.55,.08,.82),new THREE.Vector3(1.75,.06,1.9)],.05)},
  {name:'Río Córdoba',curve:river('Río Córdoba',[new THREE.Vector3(2.15,.8,-1.15),new THREE.Vector3(2.0,.55,-.72),new THREE.Vector3(2.2,.3,-.25),new THREE.Vector3(2.45,.1,.48),new THREE.Vector3(2.55,.06,1.55)],.042)}
];

// City footprint and major infrastructure.
const cityMat=material('#d3dddd',.82);
for(let row=0;row<4;row++) for(let col=0;col<11;col++){
  if((row===0&&col<2)||(row===3&&col>8))continue;
  const w=.27+Math.random()*.12,d=.22+Math.random()*.09,h=.09+Math.random()*.24;
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),cityMat);
  b.position.set(-3.55+col*.62,h/2+.01,-.18+row*.42);b.castShadow=true;b.receiveShadow=true;scene.add(b);
}
const roadMat=material('#ddd7c8',1);
const road1=new THREE.Mesh(new THREE.BoxGeometry(7.2,.028,.13),roadMat);road1.position.set(-.45,.04,.18);scene.add(road1);
const road2=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,2.1),roadMat);road2.position.set(-1.35,.05,.45);scene.add(road2);
const airportPad=new THREE.Mesh(new THREE.BoxGeometry(1.05,.035,.42),material('#e4e1d7',1));airportPad.position.set(2.35,.045,.72);scene.add(airportPad);
const runway=new THREE.Mesh(new THREE.BoxGeometry(.82,.045,.09),material('#8d9895',1));runway.position.set(2.35,.075,.72);scene.add(runway);

// Rain + runoff particles. Rain remains a visualisation of monthly precipitation; runoff follows the stylised rivers.
const rainCount=1500,runoffCount=260;
const rainPos=new Float32Array(rainCount*3),rainVel=new Float32Array(rainCount);
for(let i=0;i<rainCount;i++){rainPos[i*3]=(Math.random()-.5)*10;rainPos[i*3+1]=Math.random()*7+1;rainPos[i*3+2]=(Math.random()-.5)*5.7;rainVel[i]=.035+Math.random()*.055;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:'#70cce4',size:.045,transparent:true,opacity:.8}));rain.visible=false;scene.add(rain);

const runoffGroup=new THREE.Group();scene.add(runoffGroup);
const runoffMeshes=[];
for(let i=0;i<runoffCount;i++){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.032,6,6),new THREE.MeshBasicMaterial({color:'#b6f3ff'}));
  mesh.userData={river:Math.floor(Math.random()*rivers.length),t:Math.random()};runoffGroup.add(mesh);runoffMeshes.push(mesh);
}

let rainOn=false,intensity=3,monthly=0;
const button=document.getElementById('rainToggle');
button.onclick=()=>{rainOn=!rainOn;rain.visible=rainOn&&monthly>0;runoffGroup.visible=rainOn&&monthly>0;button.textContent=rainOn?'Ⅱ Pausar simulación':'▶ Simular lluvia';};
document.getElementById('rainIntensity').oninput=e=>{intensity=+e.target.value;rain.material.size=.025+intensity*.008;};
window.addEventListener('rain-month-selected',e=>{
  monthly=e.detail.value;intensity=e.detail.level;
  document.getElementById('rainIntensity').value=Math.max(1,intensity);
  rain.material.size=.025+Math.max(1,intensity)*.008;
  rain.visible=rainOn&&monthly>0;runoffGroup.visible=rainOn&&monthly>0;
});

function loop(){
  requestAnimationFrame(loop);
  if(rainOn&&monthly>0){
    const a=rainGeo.attributes.position;
    for(let i=0;i<rainCount;i++){
      a.array[i*3+1]-=rainVel[i]*intensity;
      if(a.array[i*3+1]<0){a.array[i*3+1]=7+Math.random()*2;a.array[i*3]=(Math.random()-.5)*10;a.array[i*3+2]=(Math.random()-.5)*5.7;}
    }
    a.needsUpdate=true;
    runoffMeshes.forEach(p=>{
      const r=rivers[p.userData.river];
      p.userData.t+=.0018*intensity;
      if(p.userData.t>1)p.userData.t-=1;
      const pos=r.curve.getPointAt(p.userData.t);p.position.copy(pos);
    });
  }
  controls.update();renderer.render(scene,camera);
}
loop();
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(host);
