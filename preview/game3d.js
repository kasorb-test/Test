/* เกม 3D น้องดินสอ 2B: เดินไปตามทางเก็บเหรียญ เจอจุดคำถามแล้วกระโดดขึ้นแท่นคำตอบ
   ตอบถูกมีเหรียญโบนัสเรียงให้เก็บ ตอบผิดแท่นร่วงเสียหัวใจ ตอบถูกครบด่านผ่านซุ้มประตูเข้าด่านถัดไป
   หน้าเว็บส่ง api มาให้: question(st) best() clear(st) -> {gain,note} exit() coins() */
import * as THREE from "./vendor/three.module.min.js";

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
/* ต้นแอปเปิ้ล: พุ่มใบเขียวหลายก้อน มีลูกแอปเปิ้ลแดงติดรอบพุ่ม */
function appleTree(){
  const g=new THREE.Group(),s=rand(.85,1.25),leaf=[0x4caf32,0x5cb82f,0x43a12a,0x6cc43a],red=M(0xe53935,{roughness:.4}),stem=M(0x5d3a1a);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.24*s,1.5*s,8),M(0x8b5a2b,{flat:true}));tr.position.y=.75*s;tr.castShadow=true;g.add(tr);
  const blobs=[[0,2.1,0,.95],[-.55,1.8,.15,.7],[.55,1.85,-.1,.72],[0,2.55,-.1,.7],[.1,1.75,.45,.6]];
  for(const[x,y,z,r]of blobs){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),M(pick(leaf),{flat:true}));b.position.set(x*s,y*s,z*s);b.castShadow=true;g.add(b)}
  for(let k=0;k<9;k++){const[x,y,z,r]=pick(blobs),th=rand(0,Math.PI*2),ph=rand(.2,1.4),ap=new THREE.Group();
    const a=new THREE.Mesh(new THREE.SphereGeometry(.12*s,12,10),red);a.scale.y=.9;ap.add(a);const st=new THREE.Mesh(new THREE.CylinderGeometry(.012*s,.012*s,.08*s,4),stem);st.position.y=.12*s;ap.add(st);
    ap.position.set((x+Math.cos(th)*Math.sin(ph)*r*.95)*s,(y+Math.cos(ph)*r*.8)*s,(z+Math.sin(th)*Math.sin(ph)*r*.95)*s);g.add(ap)}
  return g;
}
function bush(){const g=new THREE.Group();for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.3,.45),1),M(pick([0x5cb82f,0x6cc43a,0x4caf32]),{flat:true}));b.position.set(i*.4-.4,.25,rand(-.1,.1));b.castShadow=true;g.add(b)}return g}
function flower(){const g=new THREE.Group(),st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.4,5),M(0x4caf32));st.position.y=.2;g.add(st);const h=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,0),M(pick([0xff6fa5,0xa78bfa,0xffe066,0xff8a65]),{flat:true}));h.position.y=.45;g.add(h);return g}
function fence(){const g=new THREE.Group(),w=M(0xe0954d,{flat:true});for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),w);p.position.set(i*.5,.35,0);p.castShadow=true;g.add(p)}for(const y of[.25,.5]){const r=new THREE.Mesh(new THREE.BoxGeometry(2.2,.08,.06),w);r.position.set(1,y,0);g.add(r)}return g}
function cloud(){const g=new THREE.Group(),m=M(0xffffff,{roughness:1,emissive:0xffffff,emissiveIntensity:.55});for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(rand(1,1.8),12,10),m);b.position.set(i*1.4-2.8,rand(-.3,.4),rand(-.6,.6));g.add(b)}g.scale.setScalar(rand(.8,1.4));return g}
function coinMesh(){const c=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.08,24),M(0xffc400,{metalness:.6,roughness:.25,emissive:0x664400,emissiveIntensity:.25}));c.rotation.x=Math.PI/2;const s=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.1,5),M(0xffe066,{metalness:.5,roughness:.3}));s.rotation.x=Math.PI/2;const g=new THREE.Group();g.add(c);c.add(s);return g}
/* ตัวเลขคำตอบลอย: ตัวหนังสือสีสดขอบขาว ไม่มีแท่น */
function numTex(text,color){
  const c=document.createElement("canvas");c.width=320;c.height=160;const x=c.getContext("2d");let fs=120;
  x.font=`900 ${fs}px "Noto Sans Thai",sans-serif`;while(x.measureText(text).width>290&&fs>40){fs-=8;x.font=`900 ${fs}px "Noto Sans Thai",sans-serif`}
  x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";x.lineWidth=22;x.strokeStyle="#ffffff";x.strokeText(text,160,84);
  x.lineWidth=8;x.strokeStyle="rgba(0,0,0,.18)";x.strokeText(text,160,90);x.fillStyle=color;x.fillText(text,160,84);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const NUMC=["#7b2ff7","#ff4fa3","#ff8a00","#0ea5e9"];
function answer(label,i){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:numTex(label,NUMC[i%4]),depthWrite:false}));sp.scale.set(2,1,1);const g=new THREE.Group();g.add(sp);g.userData={sp,label,i};return g}
function arch(st){
  const g=new THREE.Group(),w=M(0xff7043,{flat:true});
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,3.2,8),w);p.position.set(0,1.6,s*1.9);p.castShadow=true;g.add(p)}
  const top=new THREE.Mesh(new THREE.BoxGeometry(.4,.6,4.4),M(0x7b2ff7));top.position.y=3.3;top.castShadow=true;g.add(top);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:txt(`ด่าน ${st}`,{color:"#ffffff",bg:"#7b2ff7",border:"#ffd23f",size:80})}));sp.scale.set(2.4,1.2,1);sp.position.y=4.2;g.add(sp);
  return g;
}

export function startGame(root,api){
  const W=()=>root.clientWidth,H=()=>root.clientHeight;
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.setSize(W(),H());
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  root.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,W()/H(),.1,240);
  scene.add(new THREE.HemisphereLight(0xffffff,0x88aa66,1.1));
  const sun=new THREE.DirectionalLight(0xfff2d6,1.9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:1,far:60});scene.add(sun);scene.add(sun.target);
  const skyC=document.createElement("canvas");skyC.width=2;skyC.height=256;const skyT=new THREE.CanvasTexture(skyC);skyT.colorSpace=THREE.SRGBColorSpace;scene.background=skyT;
  scene.fog=new THREE.Fog(0xe8f7ff,45,130);
  const groundMat=M(0x7ccf3a),ground=new THREE.Mesh(new THREE.PlaneGeometry(400,240),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const pathMat=M(0xf2c98a,{roughness:.95});
  function setSky(st){const k=SKY[Math.floor((st-1)/3)%SKY.length],x=skyC.getContext("2d"),gr=x.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,"#"+k[0].toString(16).padStart(6,"0"));gr.addColorStop(.7,"#"+k[1].toString(16).padStart(6,"0"));x.fillStyle=gr;x.fillRect(0,0,2,256);skyT.needsUpdate=true;
    scene.fog.color.setHex(k[1]);groundMat.color.setHex(k[2]);sun.intensity=Math.floor((st-1)/3)%4===3?.9:1.9}
  /* โลกเลื่อนไปทางขวา (+x): ชิ้นทางยาว 10 หน่วย ต้นแอปเปิ้ล พุ่มไม้ ดอกไม้ รั้ว อยู่ด้านหลังทาง */
  const SEG=10,world=new THREE.Group();scene.add(world);const segs=[];let segX=-20;
  function addSeg(){
    const g=new THREE.Group();g.position.x=segX;
    const p=new THREE.Mesh(new THREE.BoxGeometry(SEG,.06,2.6),pathMat);p.position.set(SEG/2,.03,0);p.receiveShadow=true;g.add(p);
    for(let i=0;i<4;i++){const r=Math.random(),z=-rand(2.6,14),x=rand(0,SEG);const o=r<.55?appleTree():r<.75?bush():r<.9?flower():fence();o.position.set(x,0,r>=.9?-2.2:z);g.add(o)}
    if(Math.random()<.5){const f=flower();f.position.set(rand(0,SEG),0,rand(1.8,3));g.add(f)}
    if(Math.random()<.45){const c=cloud();c.position.set(rand(0,SEG),rand(11,16),-rand(25,45));g.add(c)}
    world.add(g);segs.push(g);segX+=SEG;
  }
  for(let i=0;i<9;i++)addSeg();
  const hills=[];for(let i=0;i<9;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(rand(12,22),18,12),M(0x9ad0a0,{roughness:1}));h.position.set(-40+i*22+rand(-6,6),-rand(5,9),-rand(55,80));scene.add(h);hills.push(h)}

  const P=makePencil();scene.add(P);
  const S={st:api.best()+1,x:0,y:0,vy:0,hearts:3,pts:0,mode:"walk",need:0,done:0,nextQ:0,coins:[],ans:[],q:null,qT:0,qMax:10,arch:null,archX:0,jump:null,speed:3.4,t:0,fall:null,hop:null};
  const ui=api.ui;
  function stage(st){S.st=st;S.need=Math.min(8,4+Math.floor(st/3));S.done=0;S.qMax=Math.max(6,13-Math.floor(st/2));S.nextQ=S.x+10;setSky(st);ui.stage(st,S.need,S.done);spawnCoins(S.x+3,6,false)}
  /* เหรียญเรียงตามทาง บางช่วงลอยสูงต้องแตะให้กระโดดเก็บ */
  function spawnCoins(x0,n,bonus){const arc=Math.random()<.5;for(let i=0;i<n;i++){const c=coinMesh();const h=arc&&i>1&&i<n-1?1.9+Math.sin((i-1)/(n-3)*Math.PI)*.6:.8;c.position.set(x0+i*1.1,h,0);c.userData.bonus=bonus;world.add(c);S.coins.push(c)}}
  function ask(){
    S.mode="ask";S.q=api.question(S.st);S.qT=S.qMax;
    S.ans=S.q.opts.map((o,i)=>{const a=answer(o,i);a.position.set(S.x+2.6+i*1.9,2.2+(i%2)*1.1,0);a.userData.base=a.position.y;a.scale.setScalar(.01);world.add(a);return a});
    ui.ask(S.q.q);
  }
  function choose(i){
    if(S.mode!=="ask")return;S.mode="jumping";ui.hideQ();const ok=i===S.q.ans;
    if(i<0){mark(S.ans[S.q.ans],"#22c55e");hurt();setTimeout(clearAns,600);return}
    const a=S.ans[i],to=new THREE.Vector3(a.position.x,a.position.y-.9,0);
    S.jump={from:new THREE.Vector3(S.x,S.y,0),to,t:0,dur:.55,done:()=>{
      if(ok){mark(a,"#22c55e");burst(a.position);a.userData.gone=true;S.done++;S.pts+=5;ui.pts(S.pts);ui.stage(S.st,S.need,S.done);
        S.fall={vy:2};S.mode="falling";S.afterFall=()=>{clearAns();S.mode="walk";afterAnswer(true)}}
      else{mark(a,"#ef4444");a.userData.drop=true;mark(S.ans[S.q.ans],"#22c55e");S.fall={vy:0};S.mode="falling";S.afterFall=()=>{hurt();if(S.mode!=="dead"){clearAns();S.mode="walk";afterAnswer(false)}}}
    }};
  }
  function mark(a,color){if(!a)return;a.userData.sp.material.map=numTex(a.userData.label,color);a.userData.sp.material.needsUpdate=true}
  function afterAnswer(ok){
    if(ok){spawnCoins(S.x+2,9,true);if(S.done>=S.need){S.archX=S.x+14;S.arch=arch(S.st);S.arch.position.x=S.archX;world.add(S.arch)}else S.nextQ=S.x+14}
    else S.nextQ=S.x+8;
  }
  function clearAns(){for(const a of S.ans)a.userData.gone=true}
  function hurt(){S.hearts--;ui.hearts(S.hearts);ui.shake();if(S.hearts<=0){S.mode="dead";ui.lose(S.st,()=>{S.hearts=3;ui.hearts(3);clearAns();S.mode="walk";stage(S.st)})}else if(S.mode==="jumping"){S.mode="walk";afterAnswer(false)}}
  const bursts=[];
  function burst(pos){for(let i=0;i<16;i++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),M(pick([0xffd400,0xff6fa5,0x7dd3fc,0xa3e635]),{emissive:0x332200}));s.position.copy(pos);s.userData.v=new THREE.Vector3(rand(-2.5,2.5),rand(2,5),rand(-1.5,1.5));s.userData.life=1;world.add(s);bursts.push(s)}}
  async function passArch(){
    S.mode="cheer";const st=S.st;burst(new THREE.Vector3(S.archX,2.5,0));
    const r=await api.clear(st);ui.toast(st,r);if(S.hearts<3){S.hearts++;ui.hearts(S.hearts)}
    setTimeout(()=>{if(S.mode==="dead")return;S.arch=null;stage(st+1);S.mode="walk"},900);
  }
  /* ควบคุม: ตอนมีคำถามแตะตัวเลข (หรือกด 1-4) ตอนเดินแตะจอ/เว้นวรรค/ลูกศรขึ้น เพื่อกระโดดเก็บเหรียญที่ลอยสูง */
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
  function hop(){if(S.mode==="walk"&&S.y<=0.01){S.hop={vy:7.5}}}
  function tap(e){
    const r=renderer.domElement.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    if(S.mode==="ask"){ray.setFromCamera(v2,cam);const hit=ray.intersectObjects(S.ans.filter(a=>!a.userData.gone),true)[0];
      if(hit){let o=hit.object;while(o&&o.userData.i===undefined)o=o.parent;if(o)choose(o.userData.i)}
      else{let best=-1,bd=1e9;S.ans.forEach((a,i)=>{const p=a.position.clone();world.localToWorld(p);p.project(cam);const d=Math.hypot(p.x-v2.x,p.y-v2.y);if(d<bd){bd=d;best=i}});if(bd<.25)choose(best)}
      return}
    hop();
  }
  renderer.domElement.addEventListener("pointerup",tap);
  function key(e){if(S.mode==="ask"&&/^[1-4]$/.test(e.key))choose(+e.key-1);if(e.key===" "||e.key==="ArrowUp"){e.preventDefault();hop()}}
  document.addEventListener("keydown",key);
  function resize(){renderer.setSize(W(),H());cam.aspect=W()/H();cam.fov=W()<600?62:45;cam.updateProjectionMatrix()}
  addEventListener("resize",resize);resize();

  stage(S.st);ui.hearts(3);ui.pts(0);
  let last=performance.now(),raf=0;
  function tick(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;S.t+=dt;
    const walking=S.mode==="walk"||S.mode==="cheer";
    if(walking){S.x+=S.speed*dt;
      if(S.mode==="walk"&&!S.arch&&S.x>=S.nextQ&&!S.hop)ask();
      if(S.arch&&S.mode==="walk"&&S.x>=S.archX-.3)passArch()}
    if(S.hop){S.hop.vy-=20*dt;S.y=Math.max(0,S.y+S.hop.vy*dt);if(S.y<=0)S.hop=null}
    if(S.mode==="jumping"&&S.jump){const j=S.jump;j.t+=dt/j.dur;const t=Math.min(1,j.t);S.x=j.from.x+(j.to.x-j.from.x)*t;S.y=j.from.y+(j.to.y-j.from.y)*t+Math.sin(Math.PI*t)*1.4;if(t>=1){S.jump=null;S.y=j.to.y;j.done()}}
    if(S.mode==="falling"){S.fall.vy-=18*dt;S.y=Math.max(0,S.y+S.fall.vy*dt);if(S.y<=0){S.mode="landed";S.afterFall&&S.afterFall()}}
    if(S.mode==="ask"){S.qT-=dt;ui.timer(Math.max(0,S.qT/S.qMax));if(S.qT<=0)choose(-1)}
    P.position.set(S.x,S.y,0);
    const ud=P.userData,sw=walking&&!S.hop?Math.sin(S.t*11):0,air=S.mode==="jumping"||S.mode==="falling"||!!S.hop;
    ud.legs[0].rotation.x=air?-.6:sw*.7;ud.legs[1].rotation.x=air?.3:-sw*.7;ud.arms[0].rotation.x=air?-2.2:-sw*.6;ud.arms[1].rotation.x=air?-2.2:sw*.6;
    ud.body.position.y=.12+(walking?Math.abs(Math.sin(S.t*11))*.08:Math.sin(S.t*3)*.03);ud.body.rotation.z=walking?sw*.05:0;
    const face=S.mode==="ask"||S.mode==="dead"?.35:S.mode==="cheer"?S.t*8:Math.PI/2;P.rotation.y+=(face-P.rotation.y)*(S.mode==="cheer"?1:Math.min(1,dt*8));
    ud.shadow.position.y=.02-S.y;ud.shadow.scale.setScalar(Math.max(.4,1-S.y*.25));
    for(let i=S.coins.length-1;i>=0;i--){const c=S.coins[i];c.rotation.y+=dt*3;
      if(c.userData.got){c.position.y+=dt*6;c.scale.multiplyScalar(1-dt*4);if(c.scale.x<.1){world.remove(c);S.coins.splice(i,1)}continue}
      if(Math.abs(c.position.x-S.x)<.55&&Math.abs(c.position.y-(S.y+1.1))<1){c.userData.got=1;S.pts+=1;ui.pts(S.pts)}
      else if(c.position.x<S.x-10){world.remove(c);S.coins.splice(i,1)}}
    for(const a of S.ans){const u=a.userData;
      if(u.gone){a.scale.multiplyScalar(1-dt*5)}else if(u.drop){a.position.y-=dt*7;a.rotation.z+=dt*4}
      else{a.scale.setScalar(Math.min(1,a.scale.x+dt*5));a.position.y=u.base+Math.sin(S.t*2.4+u.i)*.12}}
    S.ans=S.ans.filter(a=>{if(a.scale.x<.04||a.position.y<-4){world.remove(a);return false}return true});
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.userData.v.y-=9*dt;b.position.addScaledVector(b.userData.v,dt);b.rotation.x+=dt*6;b.userData.life-=dt;if(b.userData.life<=0){world.remove(b);bursts.splice(i,1)}}
    while(segX<S.x+60)addSeg();
    while(segs.length&&segs[0].position.x+SEG<S.x-25){world.remove(segs.shift())}
    for(const h of hills)if(h.position.x<S.x-60)h.position.x+=200;
    /* กล้องมองจากด้านข้าง ตามน้องดินสอไปทางขวา ให้ตัวอยู่ค่อนซ้ายของจอ */
    const narrow=W()<600,asking=S.mode==="ask"||S.mode==="jumping"||S.mode==="falling";
    const lead=narrow?(asking?4.2:2.2):(asking?4:3),dist=narrow?(asking?14:11):(asking?12:10.5);
    const ly=narrow?4.2:1.9;cam.position.lerp(new THREE.Vector3(S.x+lead,(narrow?3.6:3.2)+S.y*.2,dist),Math.min(1,dt*3));cam.lookAt(cam.position.x,ly,0);
    sun.position.set(S.x-4,16,10);sun.target.position.set(S.x+4,0,0);
    renderer.render(scene,cam);raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
  return {stop(){cancelAnimationFrame(raf);document.removeEventListener("keydown",key);removeEventListener("resize",resize);renderer.dispose();renderer.domElement.remove()},debug:()=>({...S,hasArch:!!S.arch,np:S.ans.length})};
}
