import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js';

const host=document.getElementById('terrain');
const scene=new THREE.Scene();
scene.background=new THREE.Color('#e6f1ed');
const camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,100);
camera.position.set(9,7.5,11);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(host.clientWidth,host.clientHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.prepend(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.target.set(0,.45,0);controls.minDistance=7;controls.maxDistance=20;
scene.add(new THREE.HemisphereLight(0xeaf8ff,0x617a68,2));
const sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(5,10,7);sun.castShadow=true;scene.add(sun);

const material=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
const waterMat=new THREE.MeshStandardMaterial({color:'#43b9cf',roughness:.3,transparent:true,opacity:.9});

// Base isometric-style block: territory sits above the sea like a physical scale model.
const base=new THREE.Mesh(new THREE.BoxGeometry(10,.5,6),material('#617b7d'));
base.position.y=-.43;base.receiveShadow=true;scene.add(base);
const land=new THREE.Mesh(new THREE.BoxGeometry(9.8,.14,4.35),material('#8dbd79'));
land.position.set(0,-.1,-.65);land.receiveShadow=true;scene.add(land);
const sea=new THREE.Mesh(new THREE.BoxGeometry(9.8,.18,1.6),waterMat);
sea.position.set(0,-.03,2.25);scene.add(sea);

// Sierra: overlapping irregular masses instead of four identical cones.
function mountain(x,z,sx,sy,sz,color,rotation=.2){
  const geo=new THREE.ConeGeometry(1,1,8,2);
  const m=new THREE.Mesh(geo,material(color,.96));
  m.position.set(x,sy/2-.02,z);m.scale.set(sx,sy,sz);m.rotation.y=rotation;
  m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
mountain(-3.0,-1.45,2.25,3.9,1.85,'#4e7c57',.25);
mountain(-1.75,-1.35,2.55,4.8,2.05,'#5e8962',-.15);
mountain(-.55,-1.35,2.15,3.7,1.85,'#729b69',.28);
mountain(.75,-1.35,1.75,2.9,1.6,'#7da66e',-.2);
mountain(1.85,-1.4,1.35,2.25,1.45,'#709b66',.15);

// Upper slopes: lighter caps make the relief readable without pretending this is a DEM.
function cap(x,z,sx,sy,sz){
  const c=new THREE.Mesh(new THREE.ConeGeometry(.62,.72,8,1),material('#dfeae5',.95));
  c.position.set(x,sy-.02,z);c.scale.set(sx,.75,sz);c.rotation.y=.2;c.castShadow=true;scene.add(c);
}
cap(-1.75,-1.35,1.35,4.0,1.15);cap(-3.0,-1.45,1.15,3.2,.95);

// Main drainage line descending from the high relief toward the Caribbean.
const riverCurve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.55,1.65,-1.8),new THREE.Vector3(-1.1,1.25,-1.35),
  new THREE.Vector3(-1.3,.78,-.65),new THREE.Vector3(-.85,.35,.05),
  new THREE.Vector3(-.45,.16,.75),new THREE.Vector3(-.2,.06,1.65)
]);
const river=new THREE.Mesh(new THREE.TubeGeometry(riverCurve,70,.055,8,false),waterMat);
river.castShadow=true;scene.add(river);

// Urban footprint: compact blocks rather than a random carpet of cubes.
const cityMat=material('#d2dddd',.82);
for(let row=0;row<4;row++){
  for(let col=0;col<11;col++){
    if((row===0&&col<2)||(row===3&&col>8))continue;
    const w=.27+Math.random()*.12,d=.22+Math.random()*.09,h=.09+Math.random()*.24;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),cityMat);
    b.position.set(-3.65+col*.62,h/2+.01,-.2+row*.42);b.castShadow=true;b.receiveShadow=true;scene.add(b);
  }
}
const roadMat=material('#ddd7c8',1);
const road1=new THREE.Mesh(new THREE.BoxGeometry(7.2,.028,.13),roadMat);road1.position.set(-.45,.04,.2);scene.add(road1);
const road2=new THREE.Mesh(new THREE.BoxGeometry(.13,.03,2.1),roadMat);road2.position.set(-1.35,.05,.45);scene.add(road2);

// Conceptual airport marker on the coastal plain.
const airportPad=new THREE.Mesh(new THREE.BoxGeometry(1.05,.035,.42),material('#e4e1d7',1));
airportPad.position.set(2.25,.045,.72);scene.add(airportPad);
const runway=new THREE.Mesh(new THREE.BoxGeometry(.82,.045,.09),material('#8d9895',1));runway.position.set(2.25,.075,.72);scene.add(runway);

// Rain particles. Their density is driven by the selected monthly record.
const rainCount=1400;
const pos=new Float32Array(rainCount*3),vel=new Float32Array(rainCount);
for(let i=0;i<rainCount;i++){
  pos[i*3]=(Math.random()-.5)*10;pos[i*3+1]=Math.random()*7+1;pos[i*3+2]=(Math.random()-.5)*6;
  vel[i]=.035+Math.random()*.055;
}
const rainGeo=new THREE.BufferGeometry();
rainGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:'#70cce4',size:.05,transparent:true,opacity:.78}));
rain.visible=false;scene.add(rain);

let rainOn=false,intensity=3,monthly=0;
const button=document.getElementById('rainToggle');
button.onclick=()=>{
  rainOn=!rainOn;rain.visible=rainOn&&monthly>0;
  button.textContent=rainOn?'Ⅱ Pausar simulación':'▶ Simular lluvia';
};
document.getElementById('rainIntensity').oninput=e=>{
  intensity=+e.target.value;rain.material.size=.025+intensity*.008;
};
window.addEventListener('rain-month-selected',e=>{
  monthly=e.detail.value;intensity=e.detail.level;
  document.getElementById('rainIntensity').value=Math.max(1,intensity);
  rain.material.size=.025+Math.max(1,intensity)*.008;
  rain.visible=rainOn&&monthly>0;
});

function loop(){
  requestAnimationFrame(loop);
  if(rainOn&&monthly>0){
    const a=rainGeo.attributes.position;
    for(let i=0;i<rainCount;i++){
      a.array[i*3+1]-=vel[i]*intensity;
      if(a.array[i*3+1]<0){
        a.array[i*3+1]=7+Math.random()*2;
        a.array[i*3]=(Math.random()-.5)*10;
        a.array[i*3+2]=(Math.random()-.5)*6;
      }
    }
    a.needsUpdate=true;
  }
  controls.update();renderer.render(scene,camera);
}
loop();
new ResizeObserver(()=>{
  const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
}).observe(host);