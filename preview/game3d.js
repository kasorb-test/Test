/* เกม 3D น้องดินสอ 2B: เดินไปตามทางเก็บเหรียญ เจอจุดคำถามแล้วกระโดดขึ้นแท่นคำตอบ
   ตอบถูกมีเหรียญโบนัสเรียงให้เก็บ ตอบผิดแท่นร่วงเสียหัวใจ ตอบถูกครบด่านผ่านซุ้มประตูเข้าด่านถัดไป
   หน้าเว็บส่ง api มาให้: question(st) best() clear(st) -> {gain,note} exit() coins() */
import * as THREE from "./vendor/three.module.min.js";

const LANES=[-1.6,0,1.6],PADX=[-3.3,-1.1,1.1,3.3];
const SKY=[[0x8fd3ff,0xe8f7ff,0x7ccf3a],[0xffb36b,0xfff0d6,0x8ccf45],[0xa89cff,0xe6e0ff,0x6fc46a],[0x1f2a63,0x4b5bb0,0x3f9a62]];
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];

function txt(text,{size=96,color="#6d28d9",bg="#ffffff",w=256,h=128,radius=40,border="#ffb84d"}={}){
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");
  x.fillStyle=bg;x.strokeStyle=border;x.lineWidth=10;x.beginPath();x.roundRect(6,6,w-12,h-12,radius);x.fill();x.stroke();
  let fs=size;x.font=`900 ${fs}px "Noto Sans Thai",sans-serif`;while(x.measureText(text).width>w-36&&fs>30){fs-=6;x.font=`900 ${fs}px "Noto Sans Thai",sans-serif`}
  x.fillStyle=color;x.textAlign="center";x.textBaseline="middle";x.fillText(text,w/2,h/2+4);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.75,metalness:0,flatShading:!!o.flat,...o});

/* น้องดินสอ: ตัวหกเหลี่ยมสีเหลือง ยางลบชมพู ปลอกเงิน ปลายไม้กับไส้ดินสอ หน้า แขน ขา */
function makePencil(){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const yellow=M(0xffb21e,{flat:true}),pink=M(0xf7a8b8),silver=M(0xc9ced6,{metalness:.5,roughness:.35}),wood=M(0xf3d3a6,{flat:true}),lead=M(0x2b2b2b),dark=M(0x3a2a1a),navy=M(0x16305f),white=M(0xffffff);
  const hex=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.25,6),yellow);hex.position.y=1.15;hex.castShadow=true;body.add(hex);
  const fer=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.22,24),silver);fer.position.y=1.88;body.add(fer);
  for(const dy of[-.06,.06]){const r=new THREE.Mesh(new THREE.TorusGeometry(.43,.018,6,24),M(0xaab1bc));r.rotation.x=Math.PI/2;r.position.y=1.88+dy;body.add(r)}
  const er=new THREE.Mesh(new THREE.CylinderGeometry(.4,.42,.3,24),pink);er.position.y=2.14;er.castShadow=true;body.add(er);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.4,24,12,0,Math.PI*2,0,Math.PI/2),pink);top.position.y=2.29;top.scale.y=.45;body.add(top);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.42,.5,6),wood);cone.rotation.x=Math.PI;cone.position.y=.28;cone.castShadow=true;body.add(cone);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.12,.16,12),lead);tip.rotation.x=Math.PI;tip.position.y=.06;body.add(tip);
  /* หน้า: หันไปทาง -z (ทิศที่เดิน) แต่กล้องอยู่ด้านหลัง จึงวาดหน้าไว้ทั้งสองด้าน ให้เห็นหน้าตอนหันกลับมามอง */
  const face=new THREE.Group();face.position.set(0,1.45,0);body.add(face);
  for(const sx of[-.14,.14]){const e=new THREE.Mesh(new THREE.SphereGeometry(.07,16,12),M(0x2b1d10));e.position.set(sx,.05,.37);e.scale.set(.85,1.15,.5);face.add(e);
    const s=new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),white);s.position.set(sx+.025,.09,.4);face.add(s);
    const ch=new THREE.Mesh(new THREE.CircleGeometry(.06,16),new THREE.MeshBasicMaterial({color:0xff8fa3,transparent:true,opacity:.6}));ch.position.set(sx*1.55,-.08,.4);face.add(ch)}
  const sm=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,6,16,Math.PI),dark);sm.rotation.z=Math.PI;sm.position.set(0,-.08,.4);face.add(sm);
  g.userData.face=face;
  const limb=(len,mat)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.055,len,4,8),mat);m.geometry.translate(0,-len/2,0);m.castShadow=true;return m};
  const arms=[],legs=[];
  for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.45,1.35,0);const arm=limb(.42,dark);a.add(arm);const hand=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),white);hand.position.y=-.5;a.add(hand);a.rotation.z=s*.35;body.add(a);arms.push(a);
    const l=new THREE.Group();l.position.set(s*.2,.48,0);const leg=limb(.34,dark);l.add(leg);const shoe=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),navy);shoe.scale.set(1,.6,1.4);shoe.position.set(0,-.46,-.04);l.add(shoe);g.add(l);legs.push(l)}
  body.position.y=.12;
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.18}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;g.add(sh);
  g.userData={...g.userData,body,arms,legs,shadow:sh};return g;
}
function tree(autumn){
  const g=new THREE.Group(),s=rand(.8,1.3);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.14*s,.22*s,1.4*s,7),M(0x8b5a2b,{flat:true}));tr.position.y=.7*s;tr.castShadow=true;g.add(tr);
  const cols=autumn?[0xff9f1c,0xf57c00,0xffc04d]:[0x5cb82f,0x4caf32,0x8bd650];
  for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.6,.85)*s,1),M(cols[i],{flat:true}));b.position.set(rand(-.35,.35)*s,(1.6+i*.35)*s,rand(-.3,.3)*s);b.castShadow=true;g.add(b)}
  return g;
}
function bush(){const g=new THREE.Group();for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.3,.45),1),M(pick([0x5cb82f,0x6cc43a,0x4caf32]),{flat:true}));b.position.set(i*.4-.4,.25,rand(-.1,.1));b.castShadow=true;g.add(b)}return g}
function flower(){const g=new THREE.Group(),st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.4,5),M(0x4caf32));st.position.y=.2;g.add(st);const h=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,0),M(pick([0xff6fa5,0xa78bfa,0xffe066,0xff8a65]),{flat:true}));h.position.y=.45;g.add(h);return g}
function fence(){const g=new THREE.Group(),w=M(0xe0954d,{flat:true});for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),w);p.position.set(i*.5,.35,0);p.castShadow=true;g.add(p)}for(const y of[.25,.5]){const r=new THREE.Mesh(new THREE.BoxGeometry(1.7,.08,.06),w);r.position.set(.75,y,0);g.add(r)}g.rotation.y=Math.PI/2;return g}
function rock(){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.2,.4),0),M(0xb8b2a8,{flat:true}));r.position.y=.12;r.castShadow=true;return r}
function cloud(){const g=new THREE.Group(),m=M(0xffffff,{roughness:1});for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(rand(1,1.8),12,10),m);b.position.set(i*1.4-2.8,rand(-.3,.4),rand(-.6,.6));g.add(b)}g.scale.setScalar(rand(.8,1.4));return g}
function coinMesh(){const c=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.08,24),M(0xffc400,{metalness:.6,roughness:.25,emissive:0x664400,emissiveIntensity:.25}));c.rotation.x=Math.PI/2;const s=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.1,5),M(0xffe066,{metalness:.5,roughness:.3}));s.rotation.x=Math.PI/2;const g=new THREE.Group();g.add(c);c.add(s);g.castShadow=true;return g}
function pad(label){
  const g=new THREE.Group();
  const dirt=new THREE.Mesh(new THREE.CylinderGeometry(.85,.45,.7,8),M(0xb8642b,{flat:true}));dirt.position.y=-.35;dirt.castShadow=true;g.add(dirt);
  const grass=new THREE.Mesh(new THREE.CylinderGeometry(.92,.9,.2,10),M(0x7ccf3a,{flat:true}));grass.position.y=.05;grass.receiveShadow=true;g.add(grass);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:txt(label),depthTest:true}));sp.scale.set(1.5,.75,1);sp.position.y=.85;g.add(sp);
  g.userData={grass,sp,dirt};return g;
}
function arch(st){
  const g=new THREE.Group(),w=M(0xff7043,{flat:true});
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,3.2,8),w);p.position.set(s*2.6,1.6,0);p.castShadow=true;g.add(p)}
  const top=new THREE.Mesh(new THREE.BoxGeometry(5.8,.7,.4),M(0x7b2ff7));top.position.y=3.3;top.castShadow=true;g.add(top);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:txt(`ด่าน ${st}`,{color:"#ffffff",bg:"#7b2ff7",border:"#ffd23f",size:80})}));sp.scale.set(2.4,1.2,1);sp.position.y=4.2;g.add(sp);
  return g;
}

export function startGame(root,api){
  const W=()=>root.clientWidth,H=()=>root.clientHeight;
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.setSize(W(),H());
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  root.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,W()/H(),.1,220);
  const hemi=new THREE.HemisphereLight(0xffffff,0x88aa66,1.1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff2d6,1.9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:60});scene.add(sun);scene.add(sun.target);
  const skyC=document.createElement("canvas");skyC.width=2;skyC.height=256;const skyT=new THREE.CanvasTexture(skyC);skyT.colorSpace=THREE.SRGBColorSpace;scene.background=skyT;
  scene.fog=new THREE.Fog(0xe8f7ff,40,120);
  const groundMat=M(0x7ccf3a),ground=new THREE.Mesh(new THREE.PlaneGeometry(240,400),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const pathMat=M(0xf2c98a,{roughness:.95}),edgeMat=M(0xc9783a,{flat:true});
  function setSky(st){const k=SKY[Math.floor((st-1)/3)%SKY.length],x=skyC.getContext("2d"),gr=x.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,"#"+k[0].toString(16).padStart(6,"0"));gr.addColorStop(.7,"#"+k[1].toString(16).padStart(6,"0"));x.fillStyle=gr;x.fillRect(0,0,2,256);skyT.needsUpdate=true;
    scene.fog.color.setHex(k[1]);groundMat.color.setHex(k[2]);sun.intensity=st>9&&Math.floor((st-1)/3)%4===3?.9:1.9}
  /* ชิ้นทาง ยาว 10 หน่วย สร้างเพิ่มข้างหน้า ลบชิ้นที่เดินผ่านไปแล้ว */
  const SEG=10,world=new THREE.Group();scene.add(world);
  const segs=[];let segZ=10;
  function addSeg(){
    const g=new THREE.Group(),z=segZ;g.position.z=z;
    const p=new THREE.Mesh(new THREE.BoxGeometry(4.4,.1,SEG),pathMat);p.position.set(0,.05,-SEG/2);p.receiveShadow=true;g.add(p);
    for(const s of[-1,1])for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.45,.22,1.8),edgeMat);b.position.set(s*2.4,.11,-i*2-1);b.rotation.y=rand(-.05,.05);b.castShadow=true;b.receiveShadow=true;g.add(b)}
    for(let i=0;i<5;i++){const side=Math.random()<.5?-1:1,x=side*rand(3.6,12),zz=-rand(0,SEG),r=Math.random();
      const o=r<.4?tree(Math.random()<.55):r<.6?bush():r<.75?flower():r<.88?rock():fence();o.position.set(o.type==="Group"&&r>=.88?side*3.4:x,0,zz);if(r>=.88)o.position.x=side*3.3;g.add(o)}
    if(Math.random()<.4){const c=cloud();c.position.set(rand(-30,30),rand(14,22),-rand(0,SEG));g.add(c)}
    world.add(g);segs.push(g);segZ-=SEG;
  }
  for(let i=0;i<14;i++)addSeg();
  for(let i=0;i<10;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(rand(14,26),18,12),M(0x9ad0a0,{roughness:1}));h.position.set(rand(-90,90),-rand(6,12),-rand(80,140));h.userData.hill=1;scene.add(h)}
  const hills=scene.children.filter(o=>o.userData.hill);

  const P=makePencil();scene.add(P);
  const S={st:api.best()+1,z:0,x:0,lane:1,y:0,vy:0,hearts:3,pts:0,mode:"walk",need:0,done:0,nextQ:0,coins:[],pads:[],q:null,qT:0,qMax:10,arch:null,archZ:0,jump:null,speed:4.2,t:0,fall:null};
  const ui=api.ui;
  function stage(st){S.st=st;S.need=Math.min(8,4+Math.floor(st/3));S.done=0;S.qMax=Math.max(6,13-Math.floor(st/2));S.nextQ=S.z-14;setSky(st);ui.stage(st,S.need,S.done);
    for(let i=0;i<6;i++)coinRow(S.z-4-i*1.4,1)}
  function coinRow(z,lane){const c=coinMesh();c.position.set(LANES[lane],.75,z);c.userData.lane=lane;world.add(c);S.coins.push(c)}
  function spawnCoins(z0,n,bonus){let lane=Math.floor(Math.random()*3);for(let i=0;i<n;i++){if(i&&i%4===0)lane=Math.max(0,Math.min(2,lane+pick([-1,1])));const c=coinMesh();c.position.set(LANES[lane],.75,z0-i*1.3);c.userData.lane=lane;c.userData.bonus=bonus;world.add(c);S.coins.push(c)}}
  function ask(){
    S.mode="ask";S.q=api.question(S.st);S.qT=S.qMax;const z=S.z-4.2;
    S.pads=S.q.opts.map((o,i)=>{const p=pad(o);p.position.set(PADX[i],1.3+(i%2)*.55,z-(i%2)*.4);p.userData.i=i;p.userData.base=p.position.y;p.scale.setScalar(.01);world.add(p);return p});
    ui.ask(S.q.q);
  }
  function choose(i){
    if(S.mode!=="ask")return;S.mode="jumping";ui.hideQ();const ok=i===S.q.ans;
    if(i<0){S.pads[S.q.ans].userData.grass.material=M(0x22c55e);hurt();setTimeout(()=>clearPads(),500);return}
    const p=S.pads[i],from=new THREE.Vector3(S.x,0,S.z),to=new THREE.Vector3(p.position.x,p.position.y+.1,p.position.z);
    S.jump={from,to,t:0,dur:.6,done:()=>{
      if(ok){p.userData.grass.material=M(0x22c55e,{emissive:0x22c55e,emissiveIntensity:.3});burst(p.position);S.done++;S.pts+=5;ui.pts(S.pts);ui.stage(S.st,S.need,S.done);
        setTimeout(()=>{S.jump={from:P.position.clone(),to:new THREE.Vector3(LANES[1],0,p.position.z-2.2),t:0,dur:.6,done:()=>{S.lane=1;S.x=LANES[1];clearPads();S.mode="walk";afterAnswer(true)}};S.mode="jumping"},350)}
      else{p.userData.grass.material=M(0xef4444);S.pads[S.q.ans].userData.grass.material=M(0x22c55e);p.userData.falling=true;
        S.fall={vy:0};S.mode="falling"}
    }};
  }
  function afterAnswer(ok){
    if(ok){spawnCoins(S.z-2,10,true);if(S.done>=S.need){S.archZ=S.z-18;S.arch=arch(S.st);S.arch.position.z=S.archZ;world.add(S.arch)}else S.nextQ=S.z-16}
    else S.nextQ=S.z-10;
  }
  function clearPads(){for(const p of S.pads)p.userData.gone=true}
  function hurt(){S.hearts--;ui.hearts(S.hearts);ui.shake();if(S.hearts<=0){S.mode="dead";ui.lose(S.st,()=>{S.hearts=3;ui.hearts(3);S.mode="walk";clearPads();stage(S.st)})}else if(S.mode!=="falling"){S.mode="walk";S.x=LANES[S.lane];afterAnswer(false)}}
  const bursts=[];
  function burst(pos){for(let i=0;i<14;i++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),M(pick([0xffd400,0xff6fa5,0x7dd3fc,0xa3e635]),{emissive:0x332200}));s.position.copy(pos).add(new THREE.Vector3(0,.6,0));s.userData.v=new THREE.Vector3(rand(-2,2),rand(2,5),rand(-2,2));s.userData.life=1;world.add(s);bursts.push(s)}}
  async function passArch(){
    S.mode="cheer";const st=S.st;burst(new THREE.Vector3(0,2,S.archZ));
    const r=await api.clear(st);ui.toast(st,r);if(S.hearts<3){S.hearts++;ui.hearts(S.hearts)}
    setTimeout(()=>{S.arch=null;stage(st+1);S.mode="walk"},900);
  }
  /* ควบคุม: แตะแท่นคำตอบ หรือกด 1-4, ตอนเดินแตะซ้าย/ขวาของจอหรือปัด หรือกดลูกศร เพื่อเปลี่ยนเลนเก็บเหรียญ */
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();let sx0=null;
  function tap(e){
    const r=renderer.domElement.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    if(S.mode==="ask"){ray.setFromCamera(v2,cam);const hit=ray.intersectObjects(S.pads,true)[0];if(hit){let o=hit.object;while(o&&o.userData.i===undefined)o=o.parent;if(o)choose(o.userData.i)}return}
    if(S.mode==="walk")S.lane=Math.max(0,Math.min(2,S.lane+(v2.x<0?-1:1)));
  }
  renderer.domElement.addEventListener("pointerdown",e=>{sx0=e.clientX});
  renderer.domElement.addEventListener("pointerup",e=>{if(sx0!==null&&Math.abs(e.clientX-sx0)>40&&S.mode==="walk"){S.lane=Math.max(0,Math.min(2,S.lane+(e.clientX>sx0?1:-1)))}else tap(e);sx0=null});
  function key(e){if(S.mode==="ask"&&/^[1-4]$/.test(e.key))choose(+e.key-1);if(S.mode==="walk"){if(e.key==="ArrowLeft")S.lane=Math.max(0,S.lane-1);if(e.key==="ArrowRight")S.lane=Math.min(2,S.lane+1)}}
  document.addEventListener("keydown",key);
  function resize(){renderer.setSize(W(),H());cam.aspect=W()/H();cam.fov=W()<600?68:55;cam.updateProjectionMatrix()}
  addEventListener("resize",resize);resize();

  stage(S.st);ui.hearts(3);ui.pts(0);
  let last=performance.now(),raf=0;
  function tick(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;S.t+=dt;
    const walking=S.mode==="walk"||S.mode==="cheer";
    if(walking){S.z-=S.speed*dt;S.x+=(LANES[S.lane]-S.x)*Math.min(1,dt*10);
      if(S.mode==="walk"&&!S.arch&&S.z<=S.nextQ)ask();
      if(S.arch&&S.mode==="walk"&&S.z<=S.archZ+.5)passArch()}
    if(S.mode==="jumping"&&S.jump){const j=S.jump;j.t+=dt/j.dur;const t=Math.min(1,j.t);S.x=j.from.x+(j.to.x-j.from.x)*t;S.z=j.from.z+(j.to.z-j.from.z)*t;S.y=j.from.y+(j.to.y-j.from.y)*t+Math.sin(Math.PI*t)*1.6;if(t>=1){S.jump=null;S.y=j.to.y;j.done()}}
    if(S.mode==="falling"){S.fall.vy-=18*dt;S.y=Math.max(0,S.y+S.fall.vy*dt);if(S.y<=0){S.mode="hurt";hurt();if(S.mode!=="dead"){S.mode="walk";S.lane=1;clearPads();afterAnswer(false)}}}
    if(S.mode==="ask"){S.qT-=dt;ui.timer(Math.max(0,S.qT/S.qMax));if(S.qT<=0)choose(-1)}
    if(S.mode==="walk"&&S.y>0){S.y=Math.max(0,S.y-6*dt)}
    P.position.set(S.x,S.y,S.z);
    /* ท่าเดิน: แขนขาแกว่ง ตัวโยก */
    const ud=P.userData,sw=walking?Math.sin(S.t*11):0,air=S.mode==="jumping"||S.mode==="falling";
    ud.legs[0].rotation.x=air?-.6:sw*.7;ud.legs[1].rotation.x=air?.3:-sw*.7;ud.arms[0].rotation.x=air?-2.2:-sw*.6;ud.arms[1].rotation.x=air?-2.2:sw*.6;
    ud.body.position.y=.12+(walking?Math.abs(Math.sin(S.t*11))*.08:Math.sin(S.t*3)*.03);ud.body.rotation.z=walking?sw*.05:0;
    P.rotation.y=S.mode==="ask"?Math.PI*.12+Math.sin(S.t*2)*.1:S.mode==="cheer"?S.t*8:Math.PI;
    ud.shadow.position.y=.02-S.y;ud.shadow.scale.setScalar(Math.max(.4,1-S.y*.25));
    /* เหรียญหมุน เก็บเมื่อเดินผ่านเลนเดียวกัน */
    for(let i=S.coins.length-1;i>=0;i--){const c=S.coins[i];c.rotation.y+=dt*3;
      if(c.userData.got){c.position.y+=dt*6;c.scale.multiplyScalar(1-dt*4);if(c.scale.x<.1){world.remove(c);S.coins.splice(i,1)}continue}
      if(Math.abs(c.position.z-S.z)<.6&&Math.abs(c.position.x-S.x)<.8&&S.y<1.2){c.userData.got=1;S.pts+=1;ui.pts(S.pts)}
      else if(c.position.z>S.z+8){world.remove(c);S.coins.splice(i,1)}}
    for(const p of S.pads){if(!p.userData.gone&&!p.userData.falling)p.scale.setScalar(Math.min(1,p.scale.x+dt*5));p.position.y=(p.userData.falling||p.userData.gone)?p.position.y-dt*(p.userData.falling?6:3):p.userData.base+Math.sin(S.t*2+p.userData.i)*.06;
      if(p.userData.gone)p.scale.multiplyScalar(1-dt*3)}
    S.pads=S.pads.filter(p=>{if(p.position.y<-6||p.scale.x<.05){world.remove(p);return false}return true});
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.userData.v.y-=9*dt;b.position.addScaledVector(b.userData.v,dt);b.rotation.x+=dt*6;b.userData.life-=dt;if(b.userData.life<=0){world.remove(b);bursts.splice(i,1)}}
    if(S.arch)S.arch.children[3].position.y=4.2+Math.sin(S.t*3)*.1;
    while(segZ>S.z-130)addSeg();
    while(segs.length&&segs[0].position.z-SEG>S.z+20){const g=segs.shift();world.remove(g)}
    for(const h of hills)if(h.position.z>S.z-40)h.position.z-=rand(150,200);
    /* กล้อง: อยู่ด้านหลังสูง ๆ มองไปข้างหน้า ตอนถามคำถามถอยให้เห็นแท่นครบ */
    const back=S.mode==="ask"||S.mode==="jumping"||S.mode==="falling"?7.5:6,up=S.mode==="ask"?4.6:3.8;
    cam.position.lerp(new THREE.Vector3(S.x*.4,up+S.y*.3,S.z+back),Math.min(1,dt*4));cam.lookAt(S.x*.3,1.2+S.y*.3,S.z-6);
    sun.position.set(S.x+8,16,S.z+6);sun.target.position.set(S.x,0,S.z-4);
    renderer.render(scene,cam);raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
  return {stop(){cancelAnimationFrame(raf);document.removeEventListener("keydown",key);removeEventListener("resize",resize);renderer.dispose();renderer.domElement.remove()},debug:()=>({...S,hasArch:!!S.arch})};
}
