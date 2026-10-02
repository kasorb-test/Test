/* เกม 3D น้องดินสอ 2B: เดินไปตามทางเก็บเหรียญ เจอจุดคำถามแล้วกระโดดขึ้นแท่นคำตอบ
   ตอบถูกมีเหรียญโบนัสเรียงให้เก็บ ตอบผิดแท่นร่วงเสียหัวใจ ตอบถูกครบด่านผ่านซุ้มประตูเข้าด่านถัดไป
   หน้าเว็บส่ง api มาให้: question(st) best() clear(st) -> {gain,note} exit() coins() */
import * as THREE from "./vendor/three.module.min.js";

/* ช่วงเวลาและฤดูตามเวลาประเทศไทย (UTC+7) */
const NIGHT={sky:["#0f1840","#1f2f6e","#33489a","#4d64b0"],fog:0x2c3a72,ground:0x4a8a4a,path:0xb8a882,pathEdge:0x958566,hill1:0x3d7048,hill2:0x45608a,mount:0x3a4c80,mounts:[0x3a4c80,0x43568c,0x34467a,0x4a5d92],snow:false,water:0x2a4a8a,tuft:0x2f5a2a,
  hemi:[0x9aa8e8,0x3a4a3a],hemiI:1.05,light:0xc8d4ff,sunI:1,sunCore:"#fdfcf2",sunGlow:"#b9c8ff",sunPos:[-18,44],flowers:3,birds:false,birdColor:0x000000,night:true};
const DAWN={sky:["#5f74c6","#c79ac2","#ffc4a0","#fff0d6"],fog:0xf3d6c8,ground:0x7fc24c,path:0xecd0a0,pathEdge:0xd2ae7c,hill1:0x5ca848,hill2:0x93b88a,mount:0x8c9cc8,mounts:[0x8c9cc8,0x9aa6cf,0x8494c0,0xa4a9cf],snow:false,water:0x8fb7ff,tuft:0x5aa832,
  hemi:[0xffe2d0,0x7a9a6a],hemiI:1,light:0xffcfa0,sunI:1.4,sunCore:"#fff6dc",sunGlow:"#ffc38a",sunPos:[-22,12],flowers:3,birds:true,birdColor:0x3a3a5a};
const SEASON=[["cool","ฤดูหนาว"],["cool","ฤดูหนาว"],["hot","ฤดูร้อน"],["hot","ฤดูร้อน"],["hot","ฤดูร้อน"],["rain","ฤดูฝน"],["rain","ฤดูฝน"],["rain","ฤดูฝน"],["rain","ฤดูฝน"],["rain","ฤดูฝน"],["cool","ฤดูหนาว"],["cool","ฤดูหนาว"]];
export function thaiClock(now=Date.now()){const d=new Date(now+7*3600e3),h=d.getUTCHours()+d.getUTCMinutes()/60,mo=d.getUTCMonth();
  const part=h>=5&&h<7?"dawn":h>=7&&h<16?"day":h>=16&&h<18.6?"sunset":"night",sea=SEASON[mo];
  const w=weatherNow();return {d,h,part,season:sea[0],seasonTh:sea[1],temp:w?w.temp:null,cloudy:w?w.cloudy:false,partTh:{dawn:"เช้าตรู่",day:h<12?"ช่วงเช้า":"ช่วงบ่าย",sunset:"ยามเย็น",night:h>=18.6&&h<22?"หัวค่ำ":"กลางคืน"}[part],rain:w?!!w.rain:sea[0]==="rain"&&h>=14&&h<19,mist:sea[0]==="cool"&&h>=5&&h<9.5};}
/* สภาพอากาศจริงกรุงเทพฯ จาก Open-Meteo (ฟรี ไม่ต้องใช้คีย์) โหลดใหม่ทุก 10 นาที ถ้าโหลดไม่ได้ใช้ค่าตามฤดูแทน */
let WX=null,wxAt=0;
const RAIN_CODES=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
export async function loadWeather(){if(Date.now()-wxAt<6e5&&WX)return WX;wxAt=Date.now();
  try{const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,precipitation,weather_code,cloud_cover&timezone=Asia%2FBangkok");
    const c=(await r.json()).current;WX={rain:(c.precipitation||0)>0.05||RAIN_CODES.includes(c.weather_code),storm:c.weather_code>=95,cloudy:(c.cloud_cover||0)>=70,temp:Math.round(c.temperature_2m)}}catch(e){}
  return WX}
export const weatherNow=()=>window.__advWeather||WX;
const mixHex=(a,b,k)=>new THREE.Color(a).lerp(new THREE.Color(b),k).getHex(),mixStr=(a,b,k)=>"#"+new THREE.Color(a).lerp(new THREE.Color(b),k).getHexString();
const themeCache={};
function themeFor(c){const key=[c.part,c.season,c.rain,c.mist,c.cloudy].join("-");if(themeCache[key])return themeCache[key];
  const B={dawn:DAWN,day:THEMES.day,sunset:THEMES.sunset,night:NIGHT}[c.part],T={...B,key};
  if(c.season==="rain"||c.rain||c.cloudy){const k=c.rain?.45:c.cloudy?.22:.18;T.sky=B.sky.map(x=>mixStr(x,c.part==="night"?"#0d1226":"#8a95a6",k));T.fog=mixHex(B.fog,0x9aa4b2,k);T.ground=mixHex(B.ground,0x3f9d3a,.35);T.light=mixHex(B.light,0xb8c4d6,k);T.sunI=B.sunI*(1-k*.8);T.hemiI=B.hemiI*(1-k*.3);T.cloudGray=k}
  if(c.season==="hot"){T.sunI=B.sunI*1.12;T.ground=mixHex(B.ground,0xa9c24a,.25);T.flowers=4}
  if(c.season==="cool"){T.ground=mixHex(B.ground,0xa8c070,.25);T.flowers=8}
  T.fogNear=c.mist?12:c.rain?30:50;T.fogFar=c.mist?80:c.rain?120:190;if(c.mist)T.fog=mixHex(T.fog,0xf2f4f6,.6);
  T.rain=c.rain;T.stars=c.part==="night";return themeCache[key]=T}
const THEMES={
  day:{sky:["#3d9be9","#7cc4f5","#c8e9ff","#f2fbff"],fog:0xd9efff,ground:0x86cf4a,path:0xf0d29c,pathEdge:0xd9b47a,hill1:0x63b844,hill2:0x8fca73,mount:0x86a9c6,mounts:[0x86a9c6,0x7fa3bf,0x93b6cf,0x8fb8a8],snow:true,water:0x4fb3ff,tuft:0x5aa832,
    hemi:[0xffffff,0x8aa86a],hemiI:1.1,light:0xfff2d6,sunI:1.9,sunCore:"#fffbe6",sunGlow:"#fff3a8",sunPos:[18,46],flowers:3,birds:true,birdColor:0x34495e},
  sunset:{sky:["#5b4a9e","#c8669a","#ff8f6b","#ffd29a"],fog:0xffc79a,ground:0x86b84a,path:0xe9c28e,pathEdge:0xc99a66,hill1:0x5e9a46,hill2:0x8d8a72,mount:0x7b6a96,mounts:[0x7b6a96,0x8a6f98,0x6f6390,0x9a7a9e],snow:true,water:0xff9e7a,tuft:0x5a9032,
    hemi:[0xffc8a8,0x6a7a5a],hemiI:1,light:0xffa66b,sunI:1.6,sunCore:"#fff1c4",sunGlow:"#ff9d5c",sunPos:[10,14],flowers:3,birds:true,birdColor:0x3a2a3a},
  spring:{sky:["#6ec3ff","#a8dcff","#e3f4ff","#fff6fb"],fog:0xeaf6ff,ground:0x9ddb5c,path:0xf6dcaa,pathEdge:0xe2be86,hill1:0x7bcf5e,hill2:0xaee08e,mount:0x9fbde0,mounts:[0x9fbde0,0xa9c9e6,0x9ccbb8,0xb3cde8],snow:false,water:0x6fd3ff,tuft:0x6cc43a,
    hemi:[0xffffff,0x9cc47a],hemiI:1.2,light:0xfff6e6,sunI:1.7,sunCore:"#ffffff",sunGlow:"#fff6c2",sunPos:[-14,40],flowers:12,birds:true,birdColor:0x546e7a}};
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
/* ===== เสียงเกม: สังเคราะห์ด้วย Web Audio ไม่ต้องโหลดไฟล์ เสียงเบา ๆ เปิดปิดได้ (จำไว้ในเครื่อง) ===== */
export const SND=(()=>{let ctx=null,master=null,bgmG=null,on=true,bgmT=0,step=0,mode="day",nb=null;
  try{on=localStorage.getItem("advSound")!=="0"}catch(e){}
  const init=()=>{if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=on?.9:0;master.connect(ctx.destination);bgmG=ctx.createGain();bgmG.gain.value=.5;bgmG.connect(master)};
  const tone=(f,d,{type="triangle",v=.2,to=null,at=0,dest=null}={})=>{if(!ctx||!on)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+d+.05)};
  const noise=(d,{v=.2,f=1200,q=1,at=0,type="bandpass"}={})=>{if(!ctx||!on)return;if(!nb){nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
    const t=ctx.currentTime+at,sr=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();sr.buffer=nb;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);sr.connect(fl);fl.connect(g);g.connect(master);sr.start(t,Math.random()*.5);sr.stop(t+d+.05)};
  const N=n=>440*Math.pow(2,(n-69)/12);
  const fx={coin:()=>{tone(N(88),.07,{type:"square",v:.05});tone(N(93),.16,{type:"square",v:.05,at:.06})},
    jump:()=>tone(330,.18,{type:"sine",v:.12,to:720}),
    ok:()=>[72,76,79,84].forEach((n,i)=>tone(N(n),.18,{v:.14,at:i*.07})),
    wrong:()=>{tone(220,.18,{type:"sawtooth",v:.06,to:180});tone(165,.35,{type:"sawtooth",v:.06,to:110,at:.16})},
    clap:()=>{for(let i=0;i<28;i++)noise(.06,{v:.22,f:900+Math.random()*1300,q:.8,at:i*.045+Math.random()*.03})},
    sparkle:()=>[84,88,91,96,100,103,108].forEach((n,i)=>tone(N(n),.35,{type:"sine",v:.07,at:.05+i*.06})),
    chest:()=>[67,72,76,79,84].forEach((n,i)=>tone(N(n),.22,{v:.12,at:i*.08})),
    splash:()=>{noise(.9,{v:.7,f:900,q:.4,type:"lowpass"});noise(.5,{v:.45,f:2600,q:.7,at:.03});tone(420,.35,{type:"sine",v:.16,to:90});for(let i=0;i<5;i++)tone(600+Math.random()*500,.08,{type:"sine",v:.07,to:1200,at:.45+i*.12})},
    fall:()=>tone(900,.45,{type:"sine",v:.08,to:250}),
    plunge:()=>{noise(.9,{v:.9,f:1500,q:.45,type:"lowpass"});noise(.4,{v:.75,f:3200,q:.6});noise(.6,{v:.4,f:5200,q:.8,at:.08});tone(560,.28,{type:"sine",v:.24,to:110});for(let i=0;i<7;i++)tone(500+Math.random()*700,.07,{type:"sine",v:.1,to:1400,at:.35+i*.09})},
    chant:()=>{if(!ctx||!on)return;const t=ctx.currentTime,g=ctx.createGain(),f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=650;f.Q.value=2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.14,t+.4);g.gain.setValueAtTime(.14,t+3.2);g.gain.linearRampToValueAtTime(0,t+4.2);f.connect(g);g.connect(ctx.destination);
      for(const[fr,ty]of[[98,"sawtooth"],[147,"triangle"],[196,"sine"]]){const o=ctx.createOscillator(),lf=ctx.createOscillator(),lg=ctx.createGain();o.type=ty;o.frequency.value=fr;lf.frequency.value=4.5;lg.gain.value=1.2;lf.connect(lg);lg.connect(o.frequency);o.connect(f);o.start(t);lf.start(t);o.stop(t+4.3);lf.stop(t+4.3)}},
    paddle:()=>{noise(.22,{v:.38,f:1300+Math.random()*900,q:.7});tone(280+Math.random()*200,.09,{type:"sine",v:.08,to:700,at:.03})},
    drip:()=>tone(1500+Math.random()*700,.05,{type:"sine",v:.09,to:2600}),
    thaighost:()=>{if(!ctx||!on)return;const t=ctx.currentTime;for(let k=0;k<3;k++){const o=ctx.createOscillator(),lf=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.setValueAtTime(380+k*6,t);o.frequency.linearRampToValueAtTime(620,t+.6);o.frequency.linearRampToValueAtTime(300,t+2.2);
      lf.frequency.value=6+k;lg.gain.value=25;lf.connect(lg);lg.connect(o.frequency);f.type="bandpass";f.frequency.value=900;f.Q.value=3;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.2);g.gain.linearRampToValueAtTime(.04,t+1.6);g.gain.linearRampToValueAtTime(0,t+2.3);
      o.connect(f);f.connect(g);g.connect(master);o.start(t);lf.start(t);o.stop(t+2.4);lf.stop(t+2.4)}
      [0,.35,.7].forEach(a=>tone(260,.25,{type:"triangle",v:.05,to:200,at:1.4+a}))},
    ghost:()=>{tone(520,1.1,{type:"sine",v:.09,to:260});tone(530,1.1,{type:"sine",v:.07,to:250,at:.05});noise(.9,{v:.08,f:400,q:2})},
    tap:()=>tone(N(84),.06,{type:"sine",v:.08}),
    buy:()=>{[79,84,88].forEach((n,i)=>tone(N(n),.15,{v:.12,at:i*.06}));noise(.15,{v:.1,f:5000,at:.2})},
    heart:()=>[76,81,88].forEach((n,i)=>tone(N(n),.2,{type:"sine",v:.1,at:i*.08})),
    chomp:()=>{noise(.12,{v:.3,f:300,q:.7,type:"lowpass"});tone(140,.15,{type:"square",v:.06,to:80})},
    peck:()=>{for(let i=0;i<6;i++)noise(.03,{v:.18,f:2500,q:3,at:i*.09})},
    hen:()=>{for(let i=0;i<4;i++){const f=650+Math.random()*250;tone(f,.09,{type:"sawtooth",v:.06,to:f*1.25,at:i*.13});tone(f*1.5,.05,{type:"square",v:.025,at:i*.13+.02})}tone(900,.35,{type:"sawtooth",v:.06,to:600,at:.55})},
    pinch:()=>{tone(900,.08,{type:"square",v:.05});tone(700,.12,{type:"square",v:.05,at:.1})},
    squish:()=>{noise(.25,{v:.15,f:500,q:4});tone(200,.25,{type:"sine",v:.06,to:120})},
    tsk:()=>{for(let i=0;i<2;i++)noise(.05,{v:.2,f:4000,q:2,at:i*.16});tone(330,.5,{type:"triangle",v:.05,to:260,at:.35})},
    whoosh:()=>{for(let i=0;i<4;i++)noise(.25,{v:.12,f:1500,q:1,at:i*.25})},
    splat:()=>{noise(.12,{v:.3,f:600,q:.8,type:"lowpass"});tone(180,.12,{type:"sine",v:.08,to:90})},
    gasp:()=>{tone(700,.12,{type:"triangle",v:.1,to:1200});tone(1100,.25,{type:"triangle",v:.08,to:1500,at:.12})},
    bell:()=>[79,86,91].forEach((n,i)=>tone(N(n),1.2,{type:"sine",v:.08,at:i*.35}))};
  /* เพลงประกอบเบา ๆ วนไป (บ้านผีสิงเปลี่ยนเป็นทำนองไมเนอร์ช้า ๆ) */
  const THAI=[72,74,76,79,81,84,81,79,76,79,81,76,74,72,74,76,72,0,79,81,84,86,84,81,79,76,74,76,79,76,74,0];
  const MEL={thai:THAI,day:[72,0,76,79,76,0,74,72,69,0,72,74,76,0,74,0,72,0,76,79,81,79,76,74,72,0,69,72,74,0,72,0],haunt:[69,0,0,72,0,71,0,0,68,0,0,71,0,69,0,0,64,0,0,65,0,64,0,0,63,0,0,64,0,0,0,0]};
  const BASS={thai:[48,0,55,0,52,0,55,0],day:[48,55,52,55,45,52,48,55],haunt:[45,0,44,0,41,0,40,0]};
  const tick=()=>{if(!ctx||!on||ctx.state!=="running")return;const m=MEL[mode],b=BASS[mode],n=m[step%m.length];if(n){if(mode==="thai"){tone(N(n),.35,{type:"triangle",v:.05,dest:bgmG});tone(N(n+12),.12,{type:"sine",v:.02,dest:bgmG})}else tone(N(n),mode==="haunt"?.6:.28,{type:mode==="haunt"?"sine":"triangle",v:.03,dest:bgmG})}if(mode==="thai"&&step%2===0)tone(step%4?2600:1800,.05,{type:"square",v:step%4?.012:.02,dest:bgmG});
    if(step%4===0){const bn=b[(step/4|0)%b.length];if(bn)tone(N(bn),.5,{type:"sine",v:.045,dest:bgmG})}step++};
  /* เสียงบรรยากาศประจำด่าน: เสียงพื้นหลังต่อเนื่อง (น้ำไหล คลื่น ลม คนคุยกัน) + เสียงแทรกเป็นระยะ (นก ผึ้ง นกนางนวล สัตว์ ไก่ขัน นกฮูก ระฆังวัด) */
  let amb=null,ambName="",ambT=0;
  const bed=(f,q,v,type="bandpass",lfo=0)=>{if(!ctx)return null;if(!nb){nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const a=nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
    const sr=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();sr.buffer=nb;sr.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.value=v;sr.connect(fl);fl.connect(g);g.connect(master);sr.start();
    let lo=null;if(lfo){lo=ctx.createOscillator();const lg=ctx.createGain();lo.frequency.value=lfo;lg.gain.value=v*.9;lo.connect(lg);lg.connect(g.gain);lo.start()}return {stop(){try{sr.stop();lo&&lo.stop()}catch(e){}}}};
  const ev={
    bird:()=>{const b=2400+Math.random()*1500;for(let i=0;i<3+Math.random()*3;i++)tone(b+Math.random()*600,.08,{type:"sine",v:.03,to:b*1.3,at:i*.11})},
    bee:()=>{tone(190,1.2,{type:"sawtooth",v:.012,to:210})},
    chime:()=>[84,88,91,96].forEach((n,i)=>Math.random()<.7&&tone(N(n),.9,{type:"sine",v:.025,at:i*.18+Math.random()*.1})),
    gull:()=>{tone(1300,.35,{type:"sine",v:.035,to:900});tone(1250,.3,{type:"sine",v:.03,to:850,at:.4})},
    elephant:()=>{tone(420,.9,{type:"sawtooth",v:.035,to:620})},
    bigroar:()=>{noise(.9,{v:.55,f:520,q:.6,type:"lowpass"});noise(.7,{v:.3,f:1400,q:1.2,at:.05});for(let i=0;i<6;i++)tone(150-i*9,.22,{type:"sawtooth",v:.16,to:120-i*9,at:i*.13});tone(110,1.1,{type:"sawtooth",v:.12,to:65})},
    growl:()=>{for(let i=0;i<9;i++)noise(.09,{v:.4,f:380,q:1.5,type:"lowpass",at:i*.08});tone(72,.9,{type:"sawtooth",v:.16,to:55});noise(.35,{v:.35,f:2600,q:.8,at:.6})},
    roar:()=>{noise(1,{v:.08,f:220,q:.8,type:"lowpass"});tone(95,1,{type:"sawtooth",v:.035,to:70})},
    monkey:()=>{for(let i=0;i<4;i++)tone(900+i*120,.12,{type:"square",v:.02,to:1300,at:i*.14})},
    rooster:()=>{[[520,.15],[700,.15],[880,.18],[760,.5]].reduce((t,[f,d])=>{tone(f,d,{type:"sawtooth",v:.03,to:f*1.08,at:t});return t+d},0)},
    cluck:()=>{for(let i=0;i<3;i++)tone(620,.06,{type:"square",v:.02,at:i*.12})},
    bell:()=>tone(N(76+[0,3,7][Math.floor(Math.random()*3)]),1.4,{type:"sine",v:.04}),
    owl:()=>{tone(380,.35,{type:"sine",v:.045});tone(340,.6,{type:"sine",v:.045,at:.45})},
    howl:()=>{if(!ctx||!on)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),lf=ctx.createOscillator(),lg=ctx.createGain();o.type="sawtooth";o.frequency.setValueAtTime(420,t);o.frequency.linearRampToValueAtTime(760,t+.8);o.frequency.linearRampToValueAtTime(700,t+2);o.frequency.linearRampToValueAtTime(380,t+2.8);
      lf.frequency.value=5;lg.gain.value=12;lf.connect(lg);lg.connect(o.frequency);const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=1400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.4);g.gain.linearRampToValueAtTime(.045,t+2.2);g.gain.linearRampToValueAtTime(0,t+2.9);
      o.connect(f);f.connect(g);g.connect(master);o.start(t);lf.start(t);o.stop(t+3);lf.stop(t+3)},
    whisper:()=>{for(let i=0;i<5;i++)noise(.35,{v:.05,f:3000+Math.random()*2000,q:4,at:i*.3})},
    drone:()=>{tone(55,4,{type:"sine",v:.05});tone(58,4,{type:"sine",v:.04})},
    creak:()=>{tone(180,.8,{type:"sawtooth",v:.02,to:120})},
    gong:()=>{tone(110,3,{type:"sine",v:.06});tone(165,2.4,{type:"sine",v:.025})},
    splashS:()=>noise(.3,{v:.05,f:900,q:.6,type:"lowpass"}),
    frog:()=>{for(let i=0;i<2;i++)tone(220,.1,{type:"square",v:.025,to:160,at:i*.18})}};
  const AMB={meadow:{bed:[1800,.4,.006],ev:["bird","bird","bee"],gap:3},flowers:{bed:[1800,.4,.006],ev:["bee","bee","bird"],gap:2.5},canal:{bed:[900,.6,.02],ev:["chime","bird","splashS","frog"],gap:4},
    farm:{bed:[1500,.4,.006],ev:["elephant","roar","monkey","bird"],gap:5},beach:{bed:[500,.5,.06,"lowpass",.12],ev:["gull","gull"],gap:4},waterfall:{bed:[1200,.3,.07,"lowpass"],ev:["bird","frog"],gap:5},
    village:{bed:[1800,.4,.006],ev:["rooster","cluck","cluck","bird"],gap:4},market:{bed:[900,1.2,.03,"bandpass",.7],ev:["bell","cluck"],gap:6},haunted:{bed:[500,2,.04,"bandpass",.08],ev:["howl","owl","creak","whisper","howl","drone"],gap:4},
    thai:{bed:[700,.5,.008],ev:["bell","gong","bird","chime"],gap:5}};
  const ambTick=()=>{const a=AMB[ambName];if(!a||!ctx||!on||ctx.state!=="running")return;const k=a.ev[Math.floor(Math.random()*a.ev.length)];try{ev[k]()}catch(e){}};
  function ambient(name){if(name===ambName&&amb)return;ambName=name;if(amb){amb.stop();amb=null}clearInterval(ambT);ambT=0;if(!ctx||!on)return;const a=AMB[name];if(!a)return;
    amb=bed(...a.bed);ambT=setInterval(()=>{if(Math.random()<.6)ambTick()},a.gap*1000)}
  /* iPad/iPhone: เสียงจาก Web Audio ถูกปิดเมื่อเปิดโหมดเงียบ จึงบอก Safari ว่าเป็นเสียงสื่อ (playback) และเล่นไฟล์เสียงเงียบค้างไว้เพื่อปลดล็อก */
  let silentEl=null;
  const iosUnlock=()=>{try{if(navigator.audioSession)navigator.audioSession.type="playback"}catch(e){}
    try{if(!silentEl){const n=4410,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
      w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,44100,true);v.setUint32(28,88200,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
      silentEl=new Audio(URL.createObjectURL(new Blob([b],{type:"audio/wav"})));silentEl.loop=true;silentEl.setAttribute("playsinline","");silentEl.volume=.01}
      const p=silentEl.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}};
  /* เสียงพูดป้าข้างบ้าน: ใช้เสียงอ่านภาษาไทยที่มีในเครื่อง (ฟรี ไม่ต้องใช้คีย์) เสียงสูงพูดเร็วนิดหน่อย ถ้าเครื่องไม่มีเสียงไทยจะข้ามไป */
  let ttsOk=false;const thVoice=()=>{try{const vs=speechSynthesis.getVoices();return vs.find(v=>/^th/i.test(v.lang)&&/female|kanya|narisa|premwadee|pattara/i.test(v.name))||vs.find(v=>/^th/i.test(v.lang))}catch(e){return null}};
  try{if(window.speechSynthesis){speechSynthesis.getVoices();speechSynthesis.addEventListener?.("voiceschanged",()=>speechSynthesis.getVoices())}}catch(e){}
  const speak=(t,force,o={})=>{try{if((!on&&!force)||!window.speechSynthesis)return false;const ss=speechSynthesis;if(ss.speaking||ss.pending)ss.cancel();ss.resume();
    const u=new SpeechSynthesisUtterance(t);u.lang="th-TH";const v=thVoice();if(v)u.voice=v;u.pitch=o.pitch??.8;u.rate=o.rate??.92;u.volume=1;if(o.onend){u.onend=o.onend;u.onerror=o.onend}setTimeout(()=>{try{ss.speak(u)}catch(e){}},60);return true}catch(e){return false}};
  /* เสียงพูดภาษาอังกฤษสั้น ๆ (แม่ค้าตลาดคำศัพท์) ไม่ตัดเสียงที่กำลังพูด เข้าคิวต่อกันไป */
  const enVoice=()=>{try{const vs=speechSynthesis.getVoices();return vs.find(v=>/^en/i.test(v.lang)&&/female|samantha|karen|zira|susan|victoria|google us/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))}catch(e){return null}};
  const speakEn=(t,o={})=>{try{if(!on||!window.speechSynthesis)return false;const u=new SpeechSynthesisUtterance(t);u.lang="en-US";const v=enVoice();if(v)u.voice=v;u.pitch=o.pitch??1.15;u.rate=o.rate??1.1;u.volume=1;speechSynthesis.resume();speechSynthesis.speak(u);return true}catch(e){return false}};
  return {speak,speakEn,hasThai:()=>!!thVoice(),unlock(){if(!ttsOk&&window.speechSynthesis){try{const u=new SpeechSynthesisUtterance("ก");u.lang="th-TH";u.volume=0;u.rate=2;speechSynthesis.speak(u);ttsOk=true}catch(e){}}iosUnlock();init();if(ctx&&ctx.state!=="running")ctx.resume();if(!bgmT)bgmT=setInterval(tick,230);if(ambName&&!amb){const n=ambName;ambName="";ambient(n)}},play(k){try{fx[k]&&fx[k]()}catch(e){}},ambient(n){try{ambient(n)}catch(e){}},
    setOn(v){on=!!v;try{localStorage.setItem("advSound",on?"1":"0")}catch(e){}if(master)master.gain.value=on?.9:0;if(on&&ambName&&!amb){const n=ambName;ambName="";ambient(n)}},isOn:()=>on,state:()=>ctx?ctx.state:"none",
    mode(m){mode=m==="haunt"?"haunt":m==="thai"?"thai":"day"},stop(){try{silentEl&&silentEl.pause()}catch(e){}clearInterval(bgmT);bgmT=0;clearInterval(ambT);ambT=0;if(amb){amb.stop();amb=null}ambName=""}}})();

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
  /* สีหน้าตามเหตุการณ์: ปกติ ดีใจ กลัว เจ็บ */
  const eyes=face.children.filter(m=>m.geometry&&m.geometry.parameters&&m.geometry.parameters.radius===.07),shines=face.children.filter(m=>m.geometry&&m.geometry.parameters&&m.geometry.parameters.radius===.025);
  const blk=new THREE.MeshBasicMaterial({color:0x2b1d10}),mO=new THREE.Mesh(new THREE.CircleGeometry(.065,18),blk);mO.position.set(0,-.12,.405);mO.scale.y=1.35;face.add(mO);
  const tongue=new THREE.Mesh(new THREE.CircleGeometry(.035,12),new THREE.MeshBasicMaterial({color:0xe57373}));tongue.position.set(0,-.16,.407);face.add(tongue);
  const frown=new THREE.Mesh(new THREE.TorusGeometry(.08,.018,6,16,Math.PI),dark);frown.position.set(0,-.16,.4);face.add(frown);
  const sq=[],brows=[],scl=[];for(const sx of[-.14,.14]){const gq=new THREE.Group();gq.position.set(sx,.05,.4);for(const a of[.55,-.55]){const b=new THREE.Mesh(new THREE.BoxGeometry(.11,.024,.01),blk);b.position.y=a>0?.022:-.022;b.rotation.z=(sx<0?1:-1)*a;b.position.x=(sx<0?-.02:.02);gq.add(b)}face.add(gq);sq.push(gq);
    const br=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.01),blk);br.position.set(sx,.17,.4);face.add(br);brows.push(br);
    const w=new THREE.Mesh(new THREE.CircleGeometry(.1,18),new THREE.MeshBasicMaterial({color:0xffffff}));w.position.set(sx,.05,.383);face.add(w);scl.push(w)}
  const tear=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),new THREE.MeshBasicMaterial({color:0x7cc8ff,transparent:true,opacity:.9}));tear.scale.y=1.5;tear.position.set(-.2,-.04,.41);face.add(tear);
  let cur="";g.userData.expr=e=>{if(e===cur)return;cur=e;const sc=e==="scared",hu=e==="hurt",ha=e==="happy";
    eyes.forEach(m=>{m.visible=!hu;m.scale.set(sc?.6:.85,sc?.75:1.15,.5)});shines.forEach(m=>m.visible=!hu);sq.forEach(m=>m.visible=hu);scl.forEach(m=>m.visible=sc);
    sm.visible=e==="normal";mO.visible=sc||ha;mO.scale.set(ha?1.3:1,ha?.8:1.35,1);mO.position.y=ha?-.1:-.12;tongue.visible=ha;frown.visible=hu;tear.visible=hu;
    brows.forEach((b,i)=>{const s2=i?1:-1;b.visible=sc||hu;b.position.y=sc?.2:.15;b.rotation.z=sc?-s2*.35:s2*.4})};
  g.userData.expr("normal");
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
  const g=new THREE.Group(),s=rand(1.55,2.15),leaf=[0x4caf32,0x5cb82f,0x43a12a,0x6cc43a],red=M(0xe53935,{roughness:.4}),stem=M(0x5d3a1a);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.24*s,1.5*s,8),M(0x8b5a2b,{flat:true}));tr.position.y=.75*s;tr.castShadow=true;g.add(tr);
  const blobs=[[0,2.1,0,.95],[-.55,1.8,.15,.7],[.55,1.85,-.1,.72],[0,2.55,-.1,.7],[.1,1.75,.45,.6]];
  for(const[x,y,z,r]of blobs){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),M(pick(leaf),{flat:true}));b.position.set(x*s,y*s,z*s);b.castShadow=true;g.add(b)}
  for(let k=0;k<9;k++){const[x,y,z,r]=pick(blobs),th=rand(0,Math.PI*2),ph=rand(.2,1.4),ap=new THREE.Group();
    const a=new THREE.Mesh(new THREE.SphereGeometry(.12*s,12,10),red);a.scale.y=.9;ap.add(a);const st=new THREE.Mesh(new THREE.CylinderGeometry(.012*s,.012*s,.08*s,4),stem);st.position.y=.12*s;ap.add(st);
    ap.position.set((x+Math.cos(th)*Math.sin(ph)*r*.95)*s,(y+Math.cos(ph)*r*.8)*s,(z+Math.sin(th)*Math.sin(ph)*r*.95)*s);g.add(ap)}
  return g;
}
/* ต้นไม้ใหญ่ทรงโอ๊ก: ลำต้นหนาโคนบาน รากแผ่ กิ่งแตกหลายทาง พุ่มใบกลมกว้างเป็นก้อน ๆ ด้านบนสว่าง ด้านล่างเข้ม */
const _up=new THREE.Vector3(0,1,0);
function limbBetween(a,b,r0,r1,mat){const d=new THREE.Vector3().subVectors(b,a),len=d.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,len,7),mat);
  m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(_up,d.normalize());m.castShadow=true;return m}
function oakTree(){
  const g=new THREE.Group(),s=rand(.9,1.25),bark=M(0x6b4a2f,{flat:true,roughness:1}),barkD=M(0x55391f,{flat:true,roughness:1});
  const top=new THREE.Vector3(rand(-.1,.1),2.3*s,0);
  g.add(limbBetween(new THREE.Vector3(0,0,0),top,.42*s,.3*s,bark));
  const flare=new THREE.Mesh(new THREE.CylinderGeometry(.34*s,.62*s,.5*s,8),bark);flare.position.y=.25*s;g.add(flare);
  for(let k=0;k<6;k++){const an=k/6*Math.PI*2+rand(-.3,.3),L=rand(.6,1)*s;g.add(limbBetween(new THREE.Vector3(Math.cos(an)*.25*s,.18*s,Math.sin(an)*.25*s),new THREE.Vector3(Math.cos(an)*L,-.02,Math.sin(an)*L),.13*s,.04*s,barkD))}
  const tips=[];const nb=5;
  for(let k=0;k<nb;k++){const an=k/nb*Math.PI*2+rand(-.4,.4),out=rand(1,1.6)*s,up=rand(1.3,2.1)*s;
    const mid=new THREE.Vector3(top.x+Math.cos(an)*out*.55,top.y+up*.5,Math.sin(an)*out*.55),tip=new THREE.Vector3(top.x+Math.cos(an)*out,top.y+up,Math.sin(an)*out);
    g.add(limbBetween(top,mid,.22*s,.14*s,bark));g.add(limbBetween(mid,tip,.14*s,.06*s,bark));tips.push(tip)}
  g.add(limbBetween(top,new THREE.Vector3(top.x,top.y+2*s,0),.2*s,.08*s,bark));
  const cy=top.y+2*s,rx=2.5*s,ry=1.85*s,greens=[0x3a8a2a,0x4c9e34,0x5fb33f,0x76c452,0x92d468];
  const n=28;for(let k=0;k<n;k++){const u=Math.random()*Math.PI*2,v=Math.acos(rand(-.35,1)),r=rand(.55,.95);
    const x=Math.cos(u)*Math.sin(v)*rx*.85,y=Math.cos(v)*ry*.8,z=Math.sin(u)*Math.sin(v)*rx*.75;
    const h=(y/ry+1)/2,c=greens[Math.min(4,Math.max(0,Math.floor(h*4.2+rand(-.6,.6))))];
    const b=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),M(c,{flat:true,roughness:.9}));b.position.set(top.x+x,cy+y,z);b.scale.y=.85;b.castShadow=true;g.add(b)}
  for(const t of tips){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.6,.85)*s,1),M(pick([0x3b8f2c,0x4ea336]),{flat:true}));b.position.copy(t).add(new THREE.Vector3(0,.3*s,0));b.castShadow=true;g.add(b)}
  const core=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),M(0x3a8a2a,{roughness:1}));core.scale.set(rx*.8,ry*.75,rx*.65);core.position.set(top.x,cy-.1*s,0);g.add(core);
  return g;
}
/* ต้นพุ่มกลม: ลำต้นตรง พุ่มกลมใหญ่ก้อนเดียวมีก้อนเล็กรอบ */
function roundTree(){const g=new THREE.Group(),s=rand(.8,1.2);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.13*s,.2*s,1.6*s,7),M(0x7a5230,{flat:true}));tr.position.y=.8*s;tr.castShadow=true;g.add(tr);
  const c=pick([0x4caf32,0x5cb82f,0x6cc43a]);const b=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1*s,1),M(c,{flat:true}));b.position.y=2.3*s;b.castShadow=true;g.add(b);
  for(let k=0;k<4;k++){const a=k/4*Math.PI*2,m=new THREE.Mesh(new THREE.IcosahedronGeometry(.55*s,1),M(c,{flat:true}));m.position.set(Math.cos(a)*.8*s,2*s+rand(-.2,.3),Math.sin(a)*.6*s);m.castShadow=true;g.add(m)}return g}
/* ต้นสนสูง: ชั้นกรวยซ้อน */
function pineTree(){const g=new THREE.Group(),s=rand(.9,1.4);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.1*s,.16*s,.9*s,6),M(0x6b4a2f,{flat:true}));tr.position.y=.45*s;tr.castShadow=true;g.add(tr);
  const c=pick([0x2e7d32,0x388e3c,0x43a047]);for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.ConeGeometry((1-k*.25)*s,1.4*s,7),M(c,{flat:true}));m.position.y=(1.3+k*.75)*s;m.castShadow=true;g.add(m)}return g}
const TREES=[[appleTree,1]];
function anyTree(){let t=Math.random()*TREES.reduce((a,b)=>a+b[1],0);for(const[f,w]of TREES){if((t-=w)<0)return f()}return appleTree()}
function bush(){const g=new THREE.Group();for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.3,.45),1),M(pick([0x5cb82f,0x6cc43a,0x4caf32]),{flat:true}));b.position.set(i*.4-.4,.25,rand(-.1,.1));b.castShadow=true;g.add(b)}return g}
/* ดอกไม้: ก้าน ใบ กลีบ 5-6 กลีบรอบเกสรเหลือง หลายสี */
const PETALS=[0xff6fa5,0xff8fb8,0xffffff,0xffd23f,0xa78bfa,0xff7a59,0x7dd3fc,0xf472b6];
/* ดอกไม้หลายพันธุ์: daisy (กลีบกลม 5-6) cosmos (กลีบเรียว 8) tulip (ทิวลิปกลีบห่อ) sun (ทานตะวัน) lav (ลาเวนเดอร์ช่อยาว) */
const FLOWER_T=["daisy","daisy","cosmos","tulip","tulip","sun","lav"];
const FCOL={daisy:PETALS,cosmos:[0xff8fc8,0xffffff,0xe0559a,0xffc1dc],tulip:[0xe53935,0xff5c8a,0xffd23f,0xff8a3d,0xffffff,0xb04de0],sun:[0xffc400],lav:[0x9c6ade,0x8e7cf0]};
const flowerCol=t=>pick(FCOL[t]||PETALS);
function flower(col,type){const t=type||pick(FLOWER_T),c0=col??flowerCol(t),g=new THREE.Group(),h=t==="sun"?rand(.75,1):t==="lav"?rand(.45,.65):rand(.35,.6);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,h,5),M(0x3f9a2a));st.position.y=h/2;g.add(st);
  const lm=M(0x4caf32,{flat:true});
  if(t==="tulip"){for(const sx of[-1,1]){const lf=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),lm);lf.scale.set(.6,3.2,.35);lf.position.set(sx*.04,h*.3,0);lf.rotation.z=-sx*.35;g.add(lf)}}
  else{const lf=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),lm);lf.scale.set(1.6,.35,.7);lf.position.set(.06,h*.4,0);lf.rotation.z=-.5;g.add(lf)}
  const head=new THREE.Group();head.position.y=h;g.add(head);
  const pm=M(c0,{roughness:.6});
  if(t==="tulip"){for(let k=0;k<3;k++){const a=k/3*Math.PI*2,p=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),pm);p.scale.set(.75,1.5,.55);p.position.set(Math.cos(a)*.03,.07,Math.sin(a)*.03);p.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25);head.add(p)}}
  else if(t==="lav"){for(let k=0;k<8;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(.032*(1-k*.07),6,5),pm);b.position.set(rand(-.008,.008),k*.035,rand(-.008,.008));b.scale.y=1.3;head.add(b)}}
  else if(t==="sun"){head.rotation.x=Math.PI/2-rand(.15,.4);const n=13;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,p=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),pm);p.scale.set(1,.22,.4);p.position.set(Math.cos(a)*.13,0,Math.sin(a)*.13);p.rotation.y=-a;head.add(p)}
    const c=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),M(0x5d3a1a,{roughness:.9}));c.scale.y=.35;c.position.y=.01;head.add(c)}
  else{head.rotation.x=rand(-.5,.2);const thin=t==="cosmos",n=thin?8:Math.random()<.5?5:6;
    for(let k=0;k<n;k++){const a=k/n*Math.PI*2,p=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),pm);p.scale.set(thin?1.15:1,.3,thin?.38:.6);p.position.set(Math.cos(a)*(thin?.095:.08),0,Math.sin(a)*(thin?.095:.08));p.rotation.y=-a;head.add(p)}
    const c=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),M(0xffc400,{roughness:.5}));c.scale.y=.6;c.position.y=.02;head.add(c)}
  g.rotation.y=t==="sun"?rand(-.4,.4):rand(0,6);return g}
/* เห็ด: หมวกครึ่งวงกลม สีแดงจุดขาว หรือสีน้ำตาล ขึ้นเป็นกอ 2-4 ดอก */
const shroomCap=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),shroomSpot=new THREE.SphereGeometry(1,6,4);
function mushroom(kind){const g=new THREE.Group(),red=kind==="red",s=rand(.8,1.2),h=.18*s;
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.045*s,.06*s,h,10),M(0xfff4e0,{roughness:.8}));st.position.y=h/2;st.castShadow=true;g.add(st);
  const r=(red?.15:.13)*s,cap=new THREE.Mesh(shroomCap,M(red?0xe53935:pick([0xa86b3c,0x8d5a2b,0xc8894a]),{roughness:.55}));cap.scale.set(r,r*(red?.75:.6),r);cap.position.y=h*.92;cap.castShadow=true;g.add(cap);
  if(red){const wm=M(0xffffff,{roughness:.6});for(let k=0;k<7;k++){const a=rand(0,6.28),e=rand(.25,1.2),sp=new THREE.Mesh(shroomSpot,wm),sz=rand(.018,.03)*s;
    sp.position.set(Math.cos(a)*Math.sin(e)*r,h*.92+Math.cos(e)*r*.75,Math.sin(a)*Math.sin(e)*r);sp.scale.set(sz,sz*.45,sz);sp.lookAt(sp.position.clone().multiplyScalar(2).setY(sp.position.y*2-h*.92));g.add(sp)}}
  return g}
function mushroomPatch(){const g=new THREE.Group(),kind=Math.random()<.6?"red":"brown",n=2+Math.floor(Math.random()*3);
  for(let k=0;k<n;k++){const m=mushroom(kind);m.scale.setScalar(k===0?1.25:rand(.55,.9));m.position.set(rand(-.25,.25),0,rand(-.18,.18));m.rotation.set(rand(-.12,.12),rand(0,6),rand(-.12,.12));g.add(m)}return g}
function fence(){const g=new THREE.Group(),w=M(0xe0954d,{flat:true});for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),w);p.position.set(i*.5,.35,0);p.castShadow=true;g.add(p)}for(const y of[.25,.5]){const r=new THREE.Mesh(new THREE.BoxGeometry(2.2,.08,.06),w);r.position.set(1,y,0);g.add(r)}return g}
function cloud(){const g=new THREE.Group(),m=M(0xffffff,{roughness:1,emissive:0xffffff,emissiveIntensity:.55});for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(rand(1,1.8),12,10),m);b.position.set(i*1.4-2.8,rand(-.3,.4),rand(-.6,.6));g.add(b)}g.scale.setScalar(rand(.8,1.4));return g}
/* ดาวให้เก็บระหว่างทาง (นับเป็นคะแนนดาว ไม่ใช่เหรียญ) */
const starGeo=(()=>{const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.14:.34;i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r)}const g=new THREE.ExtrudeGeometry(sh,{depth:.08,bevelEnabled:true,bevelThickness:.04,bevelSize:.03,bevelSegments:1});g.center();return g})();
function starMesh(){const m=new THREE.Mesh(starGeo,M(0xffd21f,{metalness:.2,roughness:.3,emissive:0xffb300,emissiveIntensity:.45}));const g=new THREE.Group();g.add(m);return g}
function coinMesh(){const c=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.08,24),M(0xffcf1a,{metalness:.15,roughness:.35,emissive:0xffa000,emissiveIntensity:.35}));c.rotation.x=Math.PI/2;const s=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.1,5),M(0xfff2a0,{metalness:.1,roughness:.3,emissive:0xffd54a,emissiveIntensity:.3}));s.rotation.x=Math.PI/2;const g=new THREE.Group();g.add(c);c.add(s);return g}
/* ตัวเลขคำตอบลอย: ตัวหนังสือสีสดขอบขาว ไม่มีแท่น */
/* ตัวเลือกคำตอบลอย 3 สไตล์: ป้ายไม้ (wood) ฟองสีสด (bubble) ปุ่มลูกอม (candy) เลือกได้ที่ window.__ansStyle หรือค่าที่จำไว้ */
const ANS_STYLE=()=>"wood";
function numTex(text,color){
  const st=ANS_STYLE(),c=document.createElement("canvas");c.width=320;c.height=160;const x=c.getContext("2d");let fs=st==="plain"?120:84;
  const font=()=>x.font=`900 ${fs}px "Noto Sans Thai",sans-serif`;font();while(x.measureText(text).width>(st==="plain"?290:250)&&fs>34){fs-=6;font()}
  const tw=Math.max(110,Math.min(300,x.measureText(text).width+60)),L=160-tw/2,R=160+tw/2,T=24,B=136;
  const rr=(l,t,r,b,rad)=>{x.beginPath();x.roundRect(l,t,r-l,b-t,rad)};x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";
  if(st==="wood"){x.fillStyle="rgba(0,0,0,.25)";rr(L,T+8,R,B+8,14);x.fill();x.fillStyle="#5a3412";rr(L,T,R,B,14);x.fill();
    const gr=x.createLinearGradient(0,T,0,B);gr.addColorStop(0,"#e3b077");gr.addColorStop(1,"#c98a4a");x.fillStyle=gr;rr(L+6,T+6,R-6,B-6,10);x.fill();
    x.strokeStyle="rgba(120,70,30,.35)";x.lineWidth=2;for(let y=T+22;y<B-10;y+=16){x.beginPath();x.moveTo(L+10,y);x.lineTo(R-10,y);x.stroke()}
    x.fillStyle="#3b2109";for(const[px,py]of[[L+16,T+16],[R-16,T+16],[L+16,B-16],[R-16,B-16]]){x.beginPath();x.arc(px,py,5,0,7);x.fill()}
    x.lineWidth=10;x.strokeStyle="#fff8e6";x.strokeText(text,160,82);x.fillStyle=color;x.fillText(text,160,82)}
  else if(st==="bubble"){x.fillStyle="rgba(0,0,0,.22)";rr(L,T+8,R,B+8,56);x.fill();const gr=x.createLinearGradient(0,T,0,B);gr.addColorStop(0,"#ffffff");gr.addColorStop(.12,color);gr.addColorStop(1,color);
    x.fillStyle=gr;rr(L,T,R,B,56);x.fill();x.lineWidth=7;x.strokeStyle="#ffffff";x.stroke();x.fillStyle="rgba(255,255,255,.35)";rr(L+18,T+10,R-18,T+40,20);x.fill();
    x.lineWidth=8;x.strokeStyle="rgba(0,0,0,.25)";x.strokeText(text,160,86);x.fillStyle="#ffffff";x.fillText(text,160,84)}
  else if(st==="candy"){x.fillStyle=color;rr(L,T+12,R,B+10,24);x.fill();x.fillStyle="rgba(0,0,0,.25)";rr(L,T+12,R,B+10,24);x.fill();
    const gr=x.createLinearGradient(0,T,0,B);gr.addColorStop(0,"#fff");gr.addColorStop(1,"#f1f5f9");x.fillStyle=gr;rr(L,T,R,B,24);x.fill();x.lineWidth=8;x.strokeStyle=color;x.stroke();
    x.fillStyle=color;x.fillText(text,160,82)}
  else{x.lineWidth=22;x.strokeStyle="#ffffff";x.strokeText(text,160,84);x.lineWidth=8;x.strokeStyle="rgba(0,0,0,.18)";x.strokeText(text,160,90);x.fillStyle=color;x.fillText(text,160,84)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const NUMC=["#7b2ff7","#ff4fa3","#ff8a00","#0ea5e9"];
function answer(label,i){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:numTex(label,NUMC[i%4]),depthWrite:false,depthTest:false}));sp.renderOrder=20;sp.scale.set(2,1,1);const g=new THREE.Group();g.add(sp);g.userData={sp,label,i};return g}
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
  /* ===== บรรยากาศ: เลือกธีมได้ (กลางวัน / เย็น / ทุ่งดอกไม้) ท้องฟ้าไล่สี พระอาทิตย์ ภูเขาไกล เนินสองชั้น กังหันลม บ้านไร่ บ่อน้ำ นก ===== */
  /* ธีมสลับตามด่าน ทุก 3 ด่าน: กลางวัน > ยามเย็น > ทุ่งดอกไม้ (ล็อกธีมได้ผ่าน api.theme สำหรับทดสอบ) */
  const nowMs=()=>window.__advNow||Date.now(),curTheme=()=>THEMES[api.theme||window.__advTheme]||themeFor(thaiClock(nowMs())),themeNow=()=>typeof curBiome!=="undefined"&&biomeOf(S.st)==="haunted"?HAUNT:curTheme();
  let TH=curTheme();
  const hemi=new THREE.HemisphereLight(TH.hemi[0],TH.hemi[1],TH.hemiI);scene.add(hemi);
  const sun=new THREE.DirectionalLight(TH.light,TH.sunI);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:1,far:60});scene.add(sun);scene.add(sun.target);
  const skyC=document.createElement("canvas");skyC.width=4;skyC.height=512;const drawSky=cols=>{const x=skyC.getContext("2d"),gr=x.createLinearGradient(0,0,0,512);cols.forEach((c,k)=>gr.addColorStop(k/(cols.length-1),"#"+c.getHexString()));x.fillStyle=gr;x.fillRect(0,0,4,512)};drawSky(TH.sky.map(c=>new THREE.Color(c)));
  const skyT=new THREE.CanvasTexture(skyC);skyT.colorSpace=THREE.SRGBColorSpace;scene.background=skyT;
  scene.fog=new THREE.Fog(TH.fog,TH.fogNear||50,TH.fogFar||190);
  const groundMat=M(TH.ground,{roughness:1}),ground=new THREE.Mesh(new THREE.PlaneGeometry(600,300),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const pathMat=M(TH.path,{roughness:.95}),pathEdge=M(TH.pathEdge,{roughness:1});
  function setSky(){}
  /* พระอาทิตย์: แผ่นเรืองแสงไกล ๆ ตามกล้อง */
  const sunC=document.createElement("canvas");sunC.width=sunC.height=256;
  const drawSun=(core,glow)=>{const x=sunC.getContext("2d"),g=x.createRadialGradient(128,128,10,128,128,128);x.clearRect(0,0,256,256);g.addColorStop(0,core);g.addColorStop(.28,core);g.addColorStop(.36,glow+"cc");g.addColorStop(1,glow+"00");x.fillStyle=g;x.fillRect(0,0,256,256)};
  const sunSp=(()=>{const c=sunC;const x=c.getContext("2d"),g=x.createRadialGradient(128,128,10,128,128,128);
    g.addColorStop(0,TH.sunCore);g.addColorStop(.28,TH.sunCore);g.addColorStop(.36,TH.sunGlow+"cc");g.addColorStop(1,TH.sunGlow+"00");x.fillStyle=g;x.fillRect(0,0,256,256);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,fog:false,depthWrite:false,transparent:true}));sp.scale.set(70,70,1);scene.add(sp);return sp})();
  /* ชั้นฉากหลังวนซ้ำตามตำแหน่งตัวละคร (parallax): ภูเขา > เนินไกล > เนินใกล้ */
  const layers=[];
  function layer(make,n,span,z,kind){const items=[];for(let k=0;k<n;k++){const m=make(k);m.position.x=-span/2+k*span/n+rand(-4,4);m.position.z=z+rand(-6,6);scene.add(m);items.push(m)}layers.push({items,span,kind:kind!=null?kind:layers.length})}
  /* ภูเขาโค้งแบบธรรมชาติ: โปรไฟล์ทรงระฆังหมุนรอบแกน สูงต่ำสลับกัน บางลูกยอดเอียง */
  let mk=0;
  layer(()=>{const big=mk++%2===0,h=big?rand(30,46):rand(14,24),r=h*rand(1.1,1.6),pts=[];
    const ex=rand(1.2,2.4);for(let k=0;k<=20;k++){const t=k/20,y=h*Math.pow(Math.cos(t*Math.PI/2),ex);pts.push(new THREE.Vector2(Math.max(.01,r*t),y))}
    const geo=new THREE.LatheGeometry(pts.reverse(),22);const m=new THREE.Mesh(geo,M(pick(TH.mounts||[TH.mount]),{roughness:1}));
    m.scale.set(rand(.9,1.3),1,rand(.6,.9));m.rotation.z=rand(-.06,.06);m.position.y=-3;const g=new THREE.Group();g.add(m);
    return g},14,340,-150);
  layer(()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(16,26),2),M(TH.hill2,{flat:true,roughness:1}));m.scale.y=rand(.35,.5);m.position.y=-2;return m},10,260,-75);
  layer(()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(9,15),2),M(TH.hill1,{flat:true,roughness:1}));m.scale.y=rand(.3,.45);m.position.y=-1.5;return m},12,200,-40);
  /* ฝั่งตรงข้าม (หมุนกล้องดูรอบตัว 360 องศา): ภูเขาและเนินอีกชุดด้านหน้า */
  {const L0=layers[0],L1=layers[1],L2=layers[2];let mk2=0;
    layer(()=>{const big=mk2++%2===0,h=big?rand(26,40):rand(12,20),r=h*rand(1.1,1.6),pts=[],ex=rand(1.2,2.4);for(let k=0;k<=20;k++){const t=k/20,y=h*Math.pow(Math.cos(t*Math.PI/2),ex);pts.push(new THREE.Vector2(Math.max(.01,r*t),y))}
      const m=new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(),22),M(pick(TH.mounts||[TH.mount]),{roughness:1}));m.scale.set(rand(.9,1.3),1,rand(.6,.9));m.position.y=-3;const g=new THREE.Group();g.add(m);return g},14,340,150,0);
    layer(()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(16,26),2),M(TH.hill2,{flat:true,roughness:1}));m.scale.y=rand(.35,.5);m.position.y=-2;return m},10,260,80,1);
    layer(()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(9,15),2),M(TH.hill1,{flat:true,roughness:1}));m.scale.y=rand(.3,.45);m.position.y=-1.5;return m},12,200,48,2)}
  /* นกบินเป็นฝูงเล็ก ๆ */
  const birds=[];if(TH.birds){const bm=new THREE.MeshBasicMaterial({color:TH.birdColor,side:THREE.DoubleSide});for(let k=0;k<6;k++){const g=new THREE.Group();for(const sgn of[-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(.9,.18),bm);w.position.x=sgn*.42;w.userData.s=sgn;g.add(w)}g.position.set(rand(-20,20),rand(12,18),-rand(30,45));g.userData.ph=rand(0,6);scene.add(g);birds.push(g)}}
  const spinners=[];
  function windmill(){const g=new THREE.Group(),t=new THREE.Mesh(new THREE.CylinderGeometry(.6,1,5,8),M(0xfff4e0,{flat:true}));t.position.y=2.5;t.castShadow=true;g.add(t);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1,1.2,8),M(0xd84315,{flat:true}));roof.position.y=5.6;g.add(roof);
    const hub=new THREE.Group();hub.position.set(0,4.6,.9);for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.35,2.6,.05),M(0xffffff));b.position.y=1.3;const a=new THREE.Group();a.rotation.z=k*Math.PI/2;a.add(b);hub.add(a)}g.add(hub);spinners.push(hub);return g}
  function house(){const g=new THREE.Group(),c=pick([0xfff1d6,0xffe0e6,0xe3f2ff]);const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.8,2),M(c,{flat:true}));b.position.y=.9;b.castShadow=true;g.add(b);
    const r=new THREE.Mesh(new THREE.CylinderGeometry(.01,1.7,1.3,4,1),M(pick([0xe53935,0x1e88e5,0x8e24aa]),{flat:true}));r.rotation.y=Math.PI/4;r.scale.set(1.15,1,.85);r.position.y=2.45;r.castShadow=true;g.add(r);
    const d=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,.05),M(0x8b5a2b));d.position.set(0,.45,1.01);g.add(d);
    for(const sx of[-.8,.8]){const w=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.05),M(0x9ad7ff,{emissive:TH.night?0xffd27a:0,emissiveIntensity:.8}));w.position.set(sx,1.05,1.01);g.add(w)}return g}
  function pond(){const g=new THREE.Group(),w=new THREE.Mesh(new THREE.CircleGeometry(rand(2,3),20),M(TH.water,{roughness:.15,metalness:.1}));w.rotation.x=-Math.PI/2;w.position.y=.04;w.scale.y=.55;g.add(w);
    for(let k=0;k<5;k++){const r=new THREE.Mesh(new THREE.ConeGeometry(.05,.8,4),M(0x3f8f2a));const a=rand(0,6);r.position.set(Math.cos(a)*2.2,.4,Math.sin(a)*1.1);g.add(r)}return g}
  function tuft(){const g=new THREE.Group(),m=M(TH.tuft,{flat:true});for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.06,.35,3),m);c.position.set(k*.08-.08,.17,0);c.rotation.z=(k-1)*.3;g.add(c)}return g}
  /* โลกเลื่อนไปทางขวา (+x): ชิ้นทางยาว 10 หน่วย */
    /* ทุ่งดอกไม้: ดอกไม้ขึ้นเป็นกอ ๆ สีเดียวกันในกอ ทั้งหน้าและหลังทาง */
  function addFlowerField(g,n){let k=0;while(k<n){const front=Math.random()<.22,cx=rand(0,SEG),cz=front?rand(1.7,2.6):-rand(1.7,11),ft=front?pick(["daisy","cosmos","tulip"]):pick(FLOWER_T),col=flowerCol(ft),m=Math.min(n-k,6+Math.floor(Math.random()*6));
    for(let j=0;j<m;j++){const f=flower(col,ft);f.position.set(cx+rand(-.9,.9),0,cz+rand(-.4,.4));f.scale.setScalar(front?rand(.9,1.2):rand(1.5,2.4));g.add(f)}k+=m}}
  const SEG=10,world=new THREE.Group();scene.add(world);const segs=[];let segX=-20,segN=0;
  /* ===== ฉากตามด่าน 10 แบบ: 1 ทุ่งหญ้า 2 ทุ่งดอกไม้ 3 คลองสะพานหินสไตล์วัดจีน 4 ฟาร์ม 5 ชายทะเล 6 น้ำตก 7 หมู่บ้าน 8 ตลาด 9 บ้านผีสิง 10 ศาลาไทย ===== */
  const BIOMES=["meadow","flowers","canal","farm","beach","waterfall","village","market","haunted","thai"],biomeOf=st=>BIOMES[Math.min(10,Math.max(1,st))-1];
  const firstSt=()=>Math.min(api.start?api.start():api.best()+1,api.maxStage?api.maxStage():10);
  let curBiome=biomeOf(firstSt()),lastB=null;
  const anim=[],bridges=[],chests=[],shops=[];   // anim: {seg,obj,kind,...} ของที่ขยับได้, bridges: ช่วงสะพาน (พิกัดโลก)
  const live=a=>a.seg.parent===world;
  const sandMat=M(0xf3dca2,{roughness:1}),wetSand=M(0xe0c48a,{roughness:1}),waterMat=M(0x3fb6e8,{roughness:.2,metalness:.1,transparent:true,opacity:.92}),canalMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.2,metalness:.1});
  const clearWater=new THREE.MeshStandardMaterial({color:0xbff2ff,emissive:0x2fb8e8,emissiveIntensity:.35,transparent:true,opacity:.45,roughness:.05,metalness:0,depthWrite:false}),bedMatC=M(0xe6d6a8,{roughness:1});
  /* คลอง: ผิวน้ำไล่สีฟ้าใส (ขอบเขียวอมฟ้า กลางฟ้าเข้ม) ลายระลอกขาวไหล  พื้นคลองทรายขอบ กลางคลองเข้ม */
  const canvasTex0=(w,h,draw)=>{const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const canalRip=canvasTex0(128,256,x=>{x.fillStyle="#ffffff";x.fillRect(0,0,128,256);for(let i=0;i<90;i++){const y=Math.random()*256,X=Math.random()*128,L=10+Math.random()*30;x.strokeStyle=`rgba(${Math.random()<.6?'255,255,255':'170,215,235'},${(.35+Math.random()*.5).toFixed(2)})`;x.lineWidth=1+Math.random()*1.6;x.beginPath();x.moveTo(X,y);x.quadraticCurveTo(X+L/2,y-3,X+L,y);x.stroke()}
    for(let i=0;i<40;i++){x.fillStyle="rgba(200,230,245,.5)";x.fillRect(Math.random()*128,Math.random()*256,1.5,1.5)}});
  canalRip.wrapS=canalRip.wrapT=THREE.RepeatWrapping;
  const canalWater=new THREE.MeshStandardMaterial({vertexColors:true,map:canalRip,transparent:true,opacity:.6,roughness:.06,metalness:.05,emissive:0x1565c0,emissiveIntensity:.2,depthWrite:false}),canalBed=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  /* ผิวน้ำไหล: ลายระลอกคลื่นเลื่อนตามทางน้ำ */
  {const c=document.createElement("canvas");c.width=64;c.height=128;const x=c.getContext("2d");x.fillStyle="#3da5d6";x.fillRect(0,0,64,128);for(let i=0;i<70;i++){x.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'120,210,245'},${(.15+Math.random()*.45).toFixed(2)})`;x.fillRect(Math.random()*64,Math.random()*128,4+Math.random()*14,1.5+Math.random()*2)}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;canalMat.map=t}
  function fish(){const g=new THREE.Group(),c=pick([0xff8a3d,0xffc400,0x7dd3fc,0xff6fa5]);const b=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),M(c,{roughness:.4}));b.scale.set(1.6,1,.6);g.add(b);
    const t=new THREE.Mesh(new THREE.ConeGeometry(.14,.22,4),M(c));t.rotation.z=Math.PI/2;t.position.x=-.36;g.add(t);const e=new THREE.Mesh(new THREE.SphereGeometry(.03,6,4),M(0x111111));e.position.set(.17,.05,.09);g.add(e);return g}
  function quad(body,head,legC,{wool=false,spots=false}={}){const g=new THREE.Group(),bm=M(body,{flat:true});
    const b=wool?new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),bm):new THREE.Mesh(new THREE.BoxGeometry(1.25,.6,.62),bm);if(wool)b.scale.set(1.25,.9,.85);b.position.y=.75;b.castShadow=true;g.add(b);
    if(spots)for(let k=0;k<4;k++){const sp=new THREE.Mesh(new THREE.CircleGeometry(rand(.1,.16),8),M(0x222222));const side=k%2?1:-1;sp.position.set(rand(-.45,.45),.75+rand(-.15,.15),side*.315);if(side<0)sp.rotation.y=Math.PI;g.add(sp)}
    for(const[x,z]of[[.42,.2],[.42,-.2],[-.42,.2],[-.42,-.2]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.5,6),M(legC));l.position.set(x,.25,z);g.add(l)}
    const hp=new THREE.Group();hp.position.set(.6,.85,0);g.add(hp);const h=new THREE.Mesh(new THREE.BoxGeometry(.38,.32,.32),M(head,{flat:true}));h.position.set(.2,-.05,0);hp.add(h);
    if(!wool){const sn=new THREE.Mesh(new THREE.BoxGeometry(.12,.18,.28),M(0xf4a3b4));sn.position.set(.42,-.12,0);hp.add(sn);for(const z of[-.16,.16]){const hn=new THREE.Mesh(new THREE.ConeGeometry(.04,.16,5),M(0xeeeeee));hn.position.set(.12,.18,z);hp.add(hn)}}
    for(const z of[-.12,.12]){const e=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),M(0x111111));e.position.set(.36,.05,z);hp.add(e)}
    g.userData.head=hp;return g}
  const cow=()=>quad(0xffffff,0xffffff,0x444444,{spots:true}),sheep=()=>sheep2(),goat=()=>quad(0xc8a27a,0xb48a60,0x6b4a2f);
  function palm(){const g=new THREE.Group(),s=rand(1,1.4),tm=M(0xa0743f,{flat:true});let x=0,y=0;for(let k=0;k<6;k++){const seg=new THREE.Mesh(new THREE.CylinderGeometry(.13*s,.16*s,.55*s,7),tm);x+=.07*k*s;y+=.52*s;seg.position.set(x,y,0);seg.rotation.z=-.12*k;seg.castShadow=true;g.add(seg)}
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2,lf=new THREE.Mesh(new THREE.ConeGeometry(.28*s,1.9*s,4),M(pick([0x3f9a2a,0x4caf32,0x5cb82f]),{flat:true}));lf.scale.z=.25;lf.position.set(x+Math.cos(a)*.75*s,y+.15*s,Math.sin(a)*.75*s);lf.rotation.set(Math.sin(a)*1.1,0,-Math.cos(a)*1.1);lf.castShadow=true;g.add(lf)}
    for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.SphereGeometry(.12*s,8,6),M(0x6b4a1f));c.position.set(x+rand(-.15,.15),y-.1,rand(-.15,.15));g.add(c)}return g}
  function boat(){const g=new THREE.Group(),hc=pick([0xd84315,0x1e88e5,0xffffff,0x43a047]);const h=new THREE.Mesh(new THREE.CylinderGeometry(.9,.5,.5,4,1),M(hc,{flat:true}));h.rotation.y=Math.PI/4;h.scale.set(2,1,.7);h.position.y=.15;g.add(h);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.4,6),M(0x8b5a2b));m.position.y=1.5;g.add(m);const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(0,2);sh.lineTo(1.3,0);sh.lineTo(0,0);
    const sl=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({color:pick([0xffffff,0xfff3c4,0xffd0d8]),side:THREE.DoubleSide}));sl.position.set(.06,.45,0);g.add(sl);return g}
  function crab(){const g=new THREE.Group(),m=M(0xe53935,{flat:true});const b=new THREE.Mesh(new THREE.SphereGeometry(.22,10,6),m);b.scale.set(1.3,.6,1);b.position.y=.16;g.add(b);
    for(const z of[-1,1]){for(let k=0;k<3;k++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.22,4),m);l.position.set(-.12+k*.12,.08,z*.24);l.rotation.x=z*.8;g.add(l)}
      const cl=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),m);cl.scale.set(1.3,.8,1);cl.position.set(.3,.2,z*.18);g.add(cl);const ey=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),M(0x111111));ey.position.set(.14,.3,z*.07);g.add(ey)}
    g.rotation.y=Math.PI/2;return g}
  function squid(){const g=new THREE.Group(),c=pick([0xff8fb8,0xb48ce8,0xff9e6b]),m=M(c,{roughness:.5});const b=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),m);b.scale.set(1,1.3,1);b.position.y=.62;g.add(b);
    for(const z of[-.11,.11]){const e=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0xffffff));e.position.set(.25,.6,z);g.add(e);const pu=new THREE.Mesh(new THREE.SphereGeometry(.03,6,4),M(0x111111));pu.position.set(.3,.6,z);g.add(pu)}
    const ts=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2,t=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.32,3,6),m);t.position.set(Math.cos(a)*.18,.2,Math.sin(a)*.18);t.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(t);ts.push(t)}g.userData.ts=ts;return g}
  function bridge(g,x0,L){const deck=M(0xb27a45,{flat:true}),rail=M(0x8b5a2b,{flat:true}),n=10;
    for(let k=0;k<n;k++){const t=(k+.5)/n,y=.32*Math.sin(Math.PI*t);const pl=new THREE.Mesh(new THREE.BoxGeometry(L/n*.92,.1,2.6),deck);pl.position.set(x0+t*L,y+.05,0);pl.rotation.z=-Math.cos(Math.PI*t)*.12;pl.castShadow=true;pl.receiveShadow=true;g.add(pl)}
    for(const z of[-1.35,1.35]){for(let k=0;k<=4;k++){const t=k/4,y=.32*Math.sin(Math.PI*t);const po=new THREE.Mesh(new THREE.BoxGeometry(.12,.7,.12),rail);po.position.set(x0+t*L,y+.4,z);g.add(po)}
      for(let k=0;k<8;k++){const t=(k+.5)/8,y=.32*Math.sin(Math.PI*t);const r=new THREE.Mesh(new THREE.BoxGeometry(L/8,.08,.08),rail);r.position.set(x0+t*L,y+.68,z);r.rotation.z=-Math.cos(Math.PI*t)*.12;g.add(r)}}}
  /* ===== ของตกแต่งรอบใหม่ ===== */
  /* แถบริบบอนตามเส้นโค้ง (ใช้ทำคลองคดเคี้ยว ตลิ่ง) fx(z)=จุดกึ่งกลาง */
  /* ทางน้ำ 3 แนว (ขอบ-กลาง-ขอบ) ไล่สีตื้นที่ขอบเข้มที่กลางคลอง */
  function ribbon3(fx,z0,z1,half,y,mat,cE,cM,steps=90){const pos=[],idx=[],uv=[],col=[],E=new THREE.Color(cE),Mc=new THREE.Color(cM);for(let k=0;k<=steps;k++){const z=z0+(z1-z0)*k/steps,c=fx(z);pos.push(c-half,y,z,c,y,z,c+half,y,z);uv.push(0,z/4,.5,z/4,1,z/4);col.push(E.r,E.g,E.b,Mc.r,Mc.g,Mc.b,E.r,E.g,E.b);
      if(k){const a=(k-1)*3;for(const o of[0,1])idx.push(a+o,a+o+1,a+o+3,a+o+1,a+o+4,a+o+3)}}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));gm.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));gm.setAttribute("color",new THREE.Float32BufferAttribute(col,3));gm.setIndex(idx);gm.computeVertexNormals();
    const m=new THREE.Mesh(gm,mat);m.receiveShadow=true;return m}
  function ribbon(fx,z0,z1,half,y,mat,steps=60){const pos=[],idx=[],uv=[];for(let k=0;k<=steps;k++){const z=z0+(z1-z0)*k/steps,c=fx(z);pos.push(c-half,y,z,c+half,y,z);uv.push(0,z/4,half/2,z/4);if(k){const a=(k-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));gm.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));gm.setIndex(idx);gm.computeVertexNormals();const m=new THREE.Mesh(gm,mat);m.receiveShadow=true;return m}
  /* สะพานหินโค้ง: พื้นสะพานโค้งปูหิน ราวหินเตี้ย ช่องโค้งใต้สะพาน เสาหัวสะพานมีโคมไฟจีน */
  const BR_H=.72,stoneM=M(0xcbbfa8,{flat:true,roughness:1}),stoneD=M(0xa99c84,{flat:true,roughness:1});
  const stoneTex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d");x.fillStyle="#8f8372";x.fillRect(0,0,128,128);
    for(let r=0;r<4;r++)for(let k=-1;k<4;k++){const ox=k*40+(r%2)*20+2,oy=r*32+2,l=170+Math.random()*40|0;x.fillStyle=`rgb(${l+12},${l+2},${l-18})`;x.fillRect(ox,oy,36,28);x.fillStyle="rgba(255,255,255,.12)";x.fillRect(ox,oy,36,4)}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.6,1.6);t.colorSpace=THREE.SRGBColorSpace;return t})();
  const brickM=new THREE.MeshStandardMaterial({map:stoneTex,roughness:1});
  function stoneBridge(g,x0,L){const yb=t=>BR_H*Math.sin(Math.PI*t),N=24;
    const band=(top,bot)=>{const sh=new THREE.Shape();sh.moveTo(0,bot(0));for(let k=0;k<=N;k++){const t=k/N;sh.lineTo(t*L,top(t))}for(let k=N;k>=0;k--){const t=k/N;sh.lineTo(t*L,bot(t))}return sh};
    const deck=new THREE.Mesh(new THREE.ExtrudeGeometry(band(t=>yb(t)+.04,t=>yb(t)-.14),{depth:2.3,bevelEnabled:false}),stoneM);deck.position.set(x0,0,-1.15);deck.receiveShadow=true;deck.castShadow=true;g.add(deck);
    const wall=new THREE.Shape();wall.moveTo(-.3,-.5);wall.lineTo(-.3,.05);for(let k=0;k<=N;k++){const t=k/N;wall.lineTo(t*L,yb(t)-.1)}wall.lineTo(L+.3,.05);wall.lineTo(L+.3,-.5);
    for(let k=0;k<=16;k++){const a=k/16*Math.PI;wall.lineTo(L/2+Math.cos(a)*L*.33,-.5+Math.sin(a)*(BR_H+.18))}wall.lineTo(-.3,-.5);
    const wg=new THREE.ExtrudeGeometry(wall,{depth:.26,bevelEnabled:false});for(const z of[1.12,-1.38]){const w=new THREE.Mesh(wg,brickM);w.position.set(x0,0,z);w.castShadow=true;g.add(w)}
    const pg=new THREE.ExtrudeGeometry(band(t=>yb(t)+.42,t=>yb(t)-.05),{depth:.18,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1});
    for(const z of[1.1,-1.28]){const pr=new THREE.Mesh(pg,brickM);pr.position.set(x0,0,z);pr.castShadow=true;g.add(pr);
      for(const xe of[x0-.18,x0+L+.18]){const po=new THREE.Mesh(new THREE.BoxGeometry(.34,.85,.34),stoneD);po.position.set(xe,.42,z+.09);po.castShadow=true;g.add(po);const cap=new THREE.Mesh(new THREE.ConeGeometry(.26,.22,4),stoneM);cap.rotation.y=Math.PI/4;cap.position.set(xe,.96,z+.09);g.add(cap);const lt=lantern();lt.position.set(xe,1.05,z+.09);lt.scale.setScalar(.8);g.add(lt)}}}
  function lantern(){const g=new THREE.Group(),l=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),M(0xe53935,{emissive:0x8a1010,emissiveIntensity:.5}));l.scale.y=.8;l.position.y=.2;g.add(l);
    for(const y of[.06,.34]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.04,8),M(0xffc400));c.position.y=y;g.add(c)}return g}
  /* วัดจีน: ฐานหิน เสาแดง ผนัง หลังคาสองชั้นปลายงอน ช่อฟ้าทอง และเจดีย์จีนหลายชั้น */
  function roof(w,d,h,col){const g=new THREE.Group(),r=new THREE.Mesh(new THREE.CylinderGeometry(.01,1,h,4,1),M(col,{flat:true}));r.rotation.y=Math.PI/4;r.scale.set(w*.75,1,d*.75);r.position.y=h/2;r.castShadow=true;g.add(r);
    for(const[sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const c=new THREE.Mesh(new THREE.ConeGeometry(.08,.5,5),M(col,{flat:true}));c.position.set(sx*w*.52,.08,sz*d*.52);c.rotation.set(sz*-.9,0,sx*.9);g.add(c)}
    const rid=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M(0xffc400,{metalness:.4,roughness:.4}));rid.position.y=h+.05;g.add(rid);return g}
  function temple(){const g=new THREE.Group(),red=M(0xc62828,{flat:true}),wall=M(0xfff3e0,{flat:true});
    const base=new THREE.Mesh(new THREE.BoxGeometry(5.2,.5,3.6),stoneM);base.position.y=.25;base.castShadow=true;g.add(base);
    for(const x of[-2,-.7,.7,2])for(const z of[-1.3,1.3]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.9,8),red);p.position.set(x,1.45,z);p.castShadow=true;g.add(p)}
    const w=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.7,2.2),wall);w.position.y=1.35;g.add(w);const dr=new THREE.Mesh(new THREE.BoxGeometry(.9,1.2,.05),red);dr.position.set(0,1.1,1.11);g.add(dr);
    const r1=roof(6,4.4,1,0x2e7d6b);r1.position.y=2.4;g.add(r1);const r2=roof(4,3,.9,0x2e7d6b);r2.position.y=3.35;g.add(r2);
    const bn=new THREE.Mesh(new THREE.BoxGeometry(5.6,.18,4),red);bn.position.y=2.42;g.add(bn);
    for(const x of[-1.6,1.6]){const lt=lantern();lt.position.set(x,1.85,1.6);g.add(lt)}return g}
  function pagoda(){const g=new THREE.Group(),red=M(0xc62828,{flat:true});let y=0,w=2.4;const base=new THREE.Mesh(new THREE.BoxGeometry(2.8,.4,2.8),stoneM);base.position.y=.2;g.add(base);y=.4;
    for(let k=0;k<5;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(w*.7,1,w*.7),k%2?M(0xfff3e0,{flat:true}):red);b.position.y=y+.5;b.castShadow=true;g.add(b);const r=roof(w*1.25,w*1.25,.55,0xd84315);r.position.y=y+1;g.add(r);y+=1.35;w*=.84}
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(.04,.08,.9,6),M(0xffc400,{metalness:.4}));sp.position.y=y+.4;g.add(sp);return g}
  /* แกะขนฟู: ขนเป็นปุยกลมหลายก้อน หน้าเรียวสีเข้ม หูกาง ขาเล็ก */
  function sheep2(){const g=new THREE.Group(),wool=M(0xf4f1e8,{roughness:1}),woolS=M(0xe6e1d3,{roughness:1}),dark=M(0x2f2a26,{roughness:.8});
    const core=new THREE.Mesh(new THREE.SphereGeometry(.5,14,10),wool);core.scale.set(1.35,.95,1);core.position.y=.82;core.castShadow=true;g.add(core);
    for(let k=0;k<22;k++){const u=rand(0,Math.PI*2),v=rand(.2,2.4),r=rand(.17,.25);const b=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),k%3?wool:woolS);b.position.set(Math.cos(u)*Math.sin(v)*.62,.82+Math.cos(v)*.42,Math.sin(u)*Math.sin(v)*.46);b.castShadow=true;g.add(b)}
    for(const[x,z]of[[.38,.2],[.38,-.2],[-.4,.2],[-.4,-.2]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.045,.04,.5,6),dark);l.position.set(x,.25,z);g.add(l);const hf=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.06,6),M(0x111111));hf.position.set(x,.03,z);g.add(hf)}
    const hp=new THREE.Group();hp.position.set(.62,.98,0);g.add(hp);const hd=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),dark);hd.scale.set(1.45,1,.9);hd.position.set(.18,-.05,0);hd.castShadow=true;hp.add(hd);
    const tf=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),wool);tf.position.set(.05,.12,0);hp.add(tf);
    for(const z of[-1,1]){const ea=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),dark);ea.scale.set(.6,.35,1.4);ea.position.set(.05,.02,z*.2);ea.rotation.x=z*.4;hp.add(ea);const e=new THREE.Mesh(new THREE.SphereGeometry(.03,6,4),M(0x111111));e.position.set(.3,.03,z*.12);hp.add(e)}
    g.userData.head=hp;return g}
  /* ต้นมะพร้าว: ลำต้นโค้งเป็นปล้องเรียว ทางใบโค้งห้อยมีใบย่อยสองข้าง ลูกมะพร้าวเป็นพวง */
  function frondGeo(len){const pos=[],N=16;const sp=s=>new THREE.Vector3(s*len,.7*s*len*.5-1.3*s*s*len*.5,0);
    for(let k=0;k<N;k++){const s0=k/N,s1=(k+1)/N,a=sp(s0),b=sp(s1),w=.55*(1-s0*.6)*(s0<.08?s0/.08:1);
      for(const side of[-1,1]){const tip=a.clone().add(new THREE.Vector3(.12,-.28,side*w));pos.push(a.x,a.y,a.z,b.x,b.y,b.z,tip.x,tip.y,tip.z)}}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));gm.computeVertexNormals();return gm}
  const frondMats=[0x3f8f2a,0x4c9e34,0x5aa83c].map(c=>new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,flatShading:true,roughness:.8}));
  function palm2(){const g=new THREE.Group(),s=rand(1.1,1.5),lean=rand(.2,.45),n=12;let p=new THREE.Vector3();
    for(let k=0;k<n;k++){const t=k/n,r=(.2-.07*t)*s,h=.42*s;const sgm=new THREE.Mesh(new THREE.CylinderGeometry(r*.92,r,h,8),M(k%2?0x9a7a58:0x8a6b4b,{flat:true}));
      const dx=Math.sin(t*1.6)*lean*h*2.2;sgm.position.set(p.x+dx/2,p.y+h/2,0);sgm.rotation.z=-Math.atan2(dx,h);sgm.castShadow=true;g.add(sgm);p.x+=dx;p.y+=h*.97}
    const crown=new THREE.Group();crown.position.copy(p);g.add(crown);
    for(let k=0;k<10;k++){const f=new THREE.Mesh(frondGeo(rand(2,2.6)*s),pick(frondMats));f.rotation.y=k/10*Math.PI*2+rand(-.2,.2);f.rotation.z=rand(-.1,.25);f.castShadow=true;crown.add(f)}
    for(let k=0;k<5;k++){const c=new THREE.Mesh(new THREE.SphereGeometry(.13*s,10,8),M(k%2?0x5d7a2a:0x6b4a1f,{roughness:.6}));const a=k/5*Math.PI*2;c.position.set(Math.cos(a)*.16*s,-.18*s,Math.sin(a)*.16*s);crown.add(c)}
    return g}
  function umbrella(){const g=new THREE.Group(),cols=pick([[0xe53935,0xffffff],[0x1e88e5,0xffffff],[0xffb300,0xff7043],[0x43a047,0xfff3c4]]);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.3,6),M(0xdddddd,{metalness:.3}));pole.position.y=1.15;pole.rotation.z=.12;g.add(pole);
    const top=new THREE.Group();top.position.set(-.14,2.25,0);top.rotation.z=.12;g.add(top);
    for(let k=0;k<8;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(1.3,.55,2,1,true,k/8*Math.PI*2,Math.PI*2/8),new THREE.MeshStandardMaterial({color:cols[k%2],side:THREE.DoubleSide,roughness:.7}));c.castShadow=true;top.add(c)}return g}
  function lounger(){const g=new THREE.Group(),wood=M(0xd7a86e,{flat:true}),cloth=M(pick([0x1e88e5,0xe53935,0xffb300,0x26a69a]),{flat:true});
    const seat=new THREE.Mesh(new THREE.BoxGeometry(1.2,.08,.6),cloth);seat.position.set(0,.35,0);seat.castShadow=true;g.add(seat);
    const back=new THREE.Mesh(new THREE.BoxGeometry(.6,.08,.6),cloth);back.position.set(-.78,.58,0);back.rotation.z=.75;back.castShadow=true;g.add(back);
    for(const[x,z]of[[.5,.26],[.5,-.26],[-.5,.26],[-.5,-.26]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.35,.06),wood);l.position.set(x,.17,z);g.add(l)}return g}
  /* ทะเล: ชายฝั่งโค้งเป็นคลื่น สีไล่จากเขียวอมฟ้าตรงน้ำตื้นไปน้ำเงินเข้ม ผิวน้ำเป็นลอนเคลื่อนไหว ฟองคลื่นตามแนวชายฝั่ง */
  const CORAL=[0xff6f91,0xff9671,0xffc75f,0xc34ad6,0xf9f871,0x4ecdc4];
  function coral(){const g=new THREE.Group(),c=pick(CORAL),m=M(c,{flat:true,roughness:.7});const kind=Math.floor(Math.random()*3);
    if(kind===0)for(let k=0;k<6;k++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.06,rand(.4,.8),5),m);b.position.set(rand(-.2,.2),.25,rand(-.2,.2));b.rotation.set(rand(-.6,.6),0,rand(-.6,.6));g.add(b);const t=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),m);t.position.copy(b.position).add(new THREE.Vector3(0,.3,0));g.add(t)}
    else if(kind===1){const b=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),m);b.scale.y=.6;b.position.y=.15;g.add(b);for(let k=0;k<5;k++){const s2=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M(pick(CORAL)));s2.position.set(rand(-.3,.3),.28,rand(-.3,.3));g.add(s2)}}
    else for(let k=0;k<4;k++){const f=new THREE.Mesh(new THREE.CircleGeometry(rand(.25,.4),8,0,Math.PI),new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,flatShading:true}));f.position.set(rand(-.2,.2),.02,rand(-.2,.2));f.rotation.y=rand(0,6);g.add(f)}
    return g}
  const weedMat=new THREE.MeshStandardMaterial({color:0x2e9e4f,side:THREE.DoubleSide,flatShading:true});
  function seaweed(){const g=new THREE.Group();for(let k=0;k<4;k++){const h=rand(.6,1.1),geo=new THREE.PlaneGeometry(.12,h,1,5);geo.translate(0,h/2,0);const m=new THREE.Mesh(geo,weedMat);m.position.set(rand(-.15,.15),0,rand(-.15,.15));m.rotation.y=rand(0,3);g.add(m)}return g}
  function starfish(){const g=new THREE.Group(),m=M(pick([0xff7043,0xffb300,0xe53935]),{flat:true});for(let k=0;k<5;k++){const a=new THREE.Mesh(new THREE.ConeGeometry(.06,.26,4),m);a.rotation.z=-Math.PI/2;a.position.x=.12;const p=new THREE.Group();p.rotation.y=k/5*Math.PI*2;p.add(a);g.add(p)}g.scale.y=.4;return g}
  /* ของบนหาด: เรือพายไม้ ถังไม้ ลอบดักปู ตาข่าย เปลือกหอย ก้อนกรวดสี */
  function rowboat(){const g=new THREE.Group(),wd=M(pick([0x8d5a2b,0x9c6b3a,0x7a4a22]),{flat:true});const h=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,2.4,12,1,true,Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:wd.color,side:THREE.DoubleSide,flatShading:true}));
    h.rotation.z=Math.PI/2;h.scale.set(1,1,.8);h.position.y=.5;h.castShadow=true;g.add(h);for(const x of[-1.2,1.2]){const e=new THREE.Mesh(new THREE.CircleGeometry(.55,12,Math.PI,Math.PI),wd);e.position.set(x,.5,0);e.rotation.y=Math.PI/2;e.scale.x=.8;g.add(e)}
    const rim=new THREE.Mesh(new THREE.BoxGeometry(2.45,.06,.08),M(0x5d3a1a));for(const z of[-.44,.44]){const r=rim.clone();r.position.set(0,.5,z);g.add(r)}
    for(const x of[-.4,.45]){const st=new THREE.Mesh(new THREE.BoxGeometry(.2,.05,.86),M(0xb07a4a));st.position.set(x,.32,0);g.add(st)}
    const oar=new THREE.Mesh(new THREE.BoxGeometry(1.8,.04,.08),M(0xc49a6c));oar.position.set(.2,.55,.5);oar.rotation.y=.2;g.add(oar);g.rotation.z=.06;return g}
  function barrel(){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.6,12),M(0xa0682e,{flat:true}));b.position.y=.3;b.scale.set(1,1,1);b.castShadow=true;g.add(b);
    for(const y of[.1,.5]){const r=new THREE.Mesh(new THREE.TorusGeometry(.245,.02,4,16),M(0x444444,{metalness:.5}));r.rotation.x=Math.PI/2;r.position.y=y;g.add(r)}return g}
  let netTexC=null;const netTex=()=>netTexC||(netTexC=canvasTex(64,64,(x,w,h)=>{x.strokeStyle="rgba(120,100,70,.95)";x.lineWidth=2;for(let i=0;i<=64;i+=8){x.beginPath();x.moveTo(i,0);x.lineTo(i,64);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(64,i);x.stroke()}},3,3));
  function trap(){const g=new THREE.Group(),f=new THREE.Mesh(new THREE.BoxGeometry(.8,.45,.5),new THREE.MeshStandardMaterial({map:netTex(),transparent:true,alphaTest:.3,side:THREE.DoubleSide}));f.position.y=.23;g.add(f);
    const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8,.45,.5)),new THREE.LineBasicMaterial({color:0x5d3a1a}));fr.position.y=.23;g.add(fr);return g}
  function shell(){const m=new THREE.Mesh(new THREE.ConeGeometry(.08,.05,8),M(pick([0xffffff,0xffd6e0,0xffe9b0,0xf8bbd0,0xd7ccc8])));m.scale.set(1,.6,.8);m.position.y=.03;return m}
  function pebble(){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.04,.08),0),M(pick([0x8d8478,0xb0a99f,0x6f675e,0x4db6ac,0x80cbc4,0xa1887f])));m.scale.y=.5;m.position.y=.03;return m}
  /* เกาะกลางทะเลไกล ๆ กับเรือใบลำใหญ่ */
  function island(){const g=new THREE.Group(),r=rand(4,9);const b=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),pick(rockM));b.scale.set(1.4,.45,1);g.add(b);const t=new THREE.Mesh(new THREE.IcosahedronGeometry(r*.8,1),pick(mossM));t.scale.set(1.3,.4,.9);t.position.y=r*.2;g.add(t);
    for(let k=0;k<3;k++){const p=palm2();p.scale.setScalar(2.2);p.position.set(rand(-r*.6,r*.6),r*.45,rand(-r*.3,r*.3));g.add(p)}return g}
  const shoreZ=wx=>-6.2+.9*Math.sin(wx*.33)+.45*Math.sin(wx*.91+1.3);
  /* ทะเลใส: น้ำตื้นริมหาดโปร่งเห็นพื้นทรายใต้น้ำ ปะการัง สาหร่าย ปลา แล้วค่อย ๆ เข้มเป็นน้ำเงินลึก (สีน้ำมีความโปร่งต่อจุด) */
  const seaMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.18,metalness:.15,transparent:true,flatShading:true});
  const bedMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
  const bedY=(wx,z)=>.02-Math.min(3.5,Math.max(0,shoreZ(wx)-z)*.24);
  function seaChunk(g,gx){const cols=24,rows=30,pos=[],col=[],idx=[],C=c=>new THREE.Color(c),cS=C(0x8ff0e0),cT=C(0x2fc4d0),cM=C(0x1f9bd6),cD=C(0x1a5fa6);
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const lx=c/cols*SEG,sz=shoreZ(gx+lx),t=r/rows,z=sz-.4-Math.pow(t,1.7)*230;pos.push(lx,.12,z);
      const cc=t<.05?cS.clone().lerp(cT,t/.05):t<.16?cT.clone().lerp(cM,(t-.05)/.11):cM.clone().lerp(cD,Math.min(1,(t-.16)/.45)),al=t<.03?.32:t<.14?.32+(t-.03)/.11*.5:.9;col.push(cc.r,cc.g,cc.b,al)}
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;idx.push(a,a+1,b,b,a+1,b+1)}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));gm.setAttribute("color",new THREE.Float32BufferAttribute(col,4));gm.setIndex(idx);gm.computeVertexNormals();
    const m=new THREE.Mesh(gm,seaMat);m.receiveShadow=true;m.renderOrder=2;g.add(m);anim.push({seg:g,obj:m,kind:"sea",gx,base:Float32Array.from(pos)});
    /* พื้นใต้น้ำ: ทรายเปียกไล่ลงลึก สีทรายอ่อน > ฟ้าอมเขียว > น้ำเงินเข้ม */
    const bp=[],bc=[],bi=[],bR=16,bS=C(0xe4cf98),bW=C(0xcdb27a),bG=C(0x6fbfae),bK=C(0x1d4f7a);
    for(let r=0;r<=bR;r++)for(let c=0;c<=cols;c++){const lx=c/cols*SEG,z=-4.6-Math.pow(r/bR,1.5)*40,wx=gx+lx,y=bedY(wx,z),d=Math.max(0,shoreZ(wx)-z);bp.push(lx,y+(r&&c%3===0?rand(-.04,.04):0),z);
      const cc=d<=0?bS:d<2?bW.clone().lerp(bG,d/2):bG.clone().lerp(bK,Math.min(1,(d-2)/9));bc.push(cc.r,cc.g,cc.b)}
    for(let r=0;r<bR;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;bi.push(a,a+1,b,b,a+1,b+1)}
    const bg=new THREE.BufferGeometry();bg.setAttribute("position",new THREE.Float32BufferAttribute(bp,3));bg.setAttribute("color",new THREE.Float32BufferAttribute(bc,3));bg.setIndex(bi);bg.computeVertexNormals();
    const bed=new THREE.Mesh(bg,bedMat);bed.receiveShadow=true;g.add(bed);
    /* ใต้น้ำตื้น: ปะการังหลากสี สาหร่ายโบกไปมา ปลาว่ายวน ดาวทะเล ก้อนหิน */
    for(let k=0;k<4;k++){const lx=rand(.5,9.5),z=shoreZ(gx+lx)-rand(2.4,6),cr=coral(),by=bedY(gx+lx,z);cr.position.set(lx,by,z);cr.scale.setScalar(Math.min(1.2,(.08-by)/.45));cr.rotation.y=rand(0,6);g.add(cr)}
    for(let k=0;k<4;k++){const lx=rand(.5,9.5),z=shoreZ(gx+lx)-rand(2.6,6),sw=seaweed(),by=bedY(gx+lx,z);sw.position.set(lx,by,z);sw.scale.y=Math.min(1,(.02-by)/1.1);g.add(sw);anim.push({seg:g,obj:sw,kind:"weed",ph:rand(0,6)})}
    for(let k=0;k<3;k++){const lx=rand(1,9),z=shoreZ(gx+lx)-rand(2.5,5.5),f=fish();f.scale.setScalar(.8);f.position.set(lx,Math.min(-.15,bedY(gx+lx,z)+.3),z);g.add(f);anim.push({seg:g,obj:f,kind:"swim",ph:rand(0,6),x0:lx,z0:z,y0:f.position.y,r:rand(.6,1.4),sp:rand(.4,.8)})}
    if(Math.random()<.6){const lx=rand(1,9),z=shoreZ(gx+lx)-rand(.8,3),st=starfish();st.position.set(lx,bedY(gx+lx,z)+.02,z);st.rotation.y=rand(0,6);g.add(st)}
    for(let k=0;k<2;k++){const lx=rand(0,10),z=shoreZ(gx+lx)-rand(1,6),rk=rock(rand(.25,.6),Math.random()<.4);rk.position.set(lx,bedY(gx+lx,z),z);g.add(rk)}
    /* แนวคลื่นหัวขาวม้วนเข้าหาฝั่ง 3 แนว */
    for(let r=0;r<3;r++){const bp=[],bi=[],st=30;for(let k=0;k<=st;k++){const lx=k/st*SEG,z=shoreZ(gx+lx)-1.2;bp.push(lx,.16,z,lx,.16,z-.35);if(k){const a=(k-1)*2;bi.push(a,a+1,a+2,a+2,a+1,a+3)}}
      const bg=new THREE.BufferGeometry();bg.setAttribute("position",new THREE.Float32BufferAttribute(bp,3));bg.setIndex(bi);const br=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
      g.add(br);anim.push({seg:g,obj:br,kind:"breaker",ph:r/3})}
    const fp=[],steps=40;for(let k=0;k<=steps;k++){const lx=k/steps*SEG,z=shoreZ(gx+lx);fp.push(lx,.13,z+.05,lx,.13,z-.3)}const fi=[];for(let k=0;k<steps;k++){const a=k*2;fi.push(a,a+1,a+2,a+2,a+1,a+3)}
    const fg=new THREE.BufferGeometry();fg.setAttribute("position",new THREE.Float32BufferAttribute(fp,3));fg.setIndex(fi);fg.computeVertexNormals();
    const foam=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,side:THREE.DoubleSide}));g.add(foam);anim.push({seg:g,obj:foam,kind:"foam2",ph:gx});
    const wet=ribbonX(gx,.9,wetSand);g.add(wet)}
  function ribbonX(gx,w,mat){const pos=[],idx=[],steps=40;for(let k=0;k<=steps;k++){const lx=k/steps*SEG,z=shoreZ(gx+lx);pos.push(lx,.035,z+w,lx,.035,z);if(k){const a=(k-1)*2;idx.push(a,a+2,a+1,a+2,a+3,a+1)}}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));gm.setIndex(idx);gm.computeVertexNormals();return new THREE.Mesh(gm,mat)}
  /* ===== ของตกแต่งด่าน 6-10 ===== */
  const HAUNT={sky:["#120a24","#2a1440","#45215a","#5a2d63"],fog:0x2a1838,fogNear:14,fogFar:90,ground:0x34402c,path:0x6e6152,pathEdge:0x51473b,hill1:0x26331f,hill2:0x2e2440,mount:0x2a2040,mounts:[0x2a2040,0x30254a,0x251c38,0x372a50],snow:false,water:0x2a2850,tuft:0x2a3a22,
    hemi:[0x9a8ac8,0x1a1420],hemiI:.85,light:0xb8a8ff,sunI:.75,sunCore:"#f4f1d0",sunGlow:"#9b8cff",sunPos:[-16,40],flowers:0,birds:false,birdColor:0,night:true,stars:true};
  const canvasTex=(w,h,draw,rx=1,ry=1)=>{const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;return t};
  const plankTex=canvasTex(128,128,(x,w)=>{for(let i=0;i<8;i++){const l=115+Math.random()*30|0;x.fillStyle=`rgb(${l+45},${l+5},${l-35})`;x.fillRect(0,i*16,w,15);x.fillStyle="rgba(60,30,10,.45)";x.fillRect(0,i*16+15,w,1)}});
  const woodM=new THREE.MeshStandardMaterial({map:plankTex,roughness:.9});
  const leafMat=new THREE.MeshStandardMaterial({color:0x5fae3a,side:THREE.DoubleSide,flatShading:true,roughness:.8}),fernMat=new THREE.MeshStandardMaterial({color:0x3f8f2a,side:THREE.DoubleSide,flatShading:true,roughness:.85});
  /* ใบไม้โค้ง: แผ่นยาวงอขึ้นแล้วห้อยลงที่ปลาย */
  function archLeaf(L,w,mat,up=.5,droop=.45){const geo=new THREE.PlaneGeometry(L,w,6,1);geo.rotateX(-Math.PI/2);geo.translate(L/2,0,0);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,x*up-x*x*droop/L);p.setZ(i,z*(1-.75*x/L))}geo.computeVertexNormals();return new THREE.Mesh(geo,mat)}
  /* ต้นไผ่: ลำเรียวสูงมีข้อ เอนออกจากกอ กิ่งแตกตามข้อ ใบเรียวยาวเป็นพุ่มแน่น (รวมใบทั้งกอเป็นชิ้นเดียวให้ลื่น) */
  const culmTex=canvasTex(32,128,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,"#4a8526");gr.addColorStop(.45,"#93cf52");gr.addColorStop(1,"#447c22");x.fillStyle=gr;x.fillRect(0,0,w,h);x.fillStyle="#dfe9b0";x.fillRect(0,h-11,w,3);x.fillStyle="#3a6a1c";x.fillRect(0,h-8,w,5)});
  const culmMat=new THREE.MeshStandardMaterial({map:culmTex,roughness:.55}),bLeafMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.8});
  const LEAFC=[0x5aa62c,0x6cb83a,0x7cc449,0x4c9424,0x8dcc55,0x9fbf3a].map(c=>new THREE.Color(c));
  function bamboo(sc=1){const g=new THREE.Group(),n=8+Math.floor(Math.random()*7),lp=[],lc=[],V=THREE.Vector3,up=new V(0,1,0);
    const leaf=(B,dir,L,w,col)=>{const s=new V().crossVectors(dir,up);if(s.lengthSq()<1e-4)s.set(1,0,0);s.normalize().multiplyScalar(w);const T=B.clone().addScaledVector(dir,L),M1=B.clone().addScaledVector(dir,L*.35).add(s),M2=B.clone().addScaledVector(dir,L*.35).sub(s);
      lp.push(B.x,B.y,B.z,M1.x,M1.y,M1.z,T.x,T.y,T.z,B.x,B.y,B.z,T.x,T.y,T.z,M2.x,M2.y,M2.z);for(let i=0;i<6;i++)lc.push(col.r,col.g,col.b)};
    for(let k=0;k<n;k++){const h=rand(4.5,8)*sc,r=rand(.045,.075)*sc,geo=new THREE.CylinderGeometry(r*.8,r,h,7,1,true),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*h/.6);
      const c=new THREE.Mesh(geo,culmMat),bx=rand(-.6,.6),bz=rand(-.6,.6);c.position.set(bx,h/2,bz);c.rotation.set(bz*.22,0,-bx*.22);c.castShadow=true;c.updateMatrix();g.add(c);
      for(let j=0;j<7;j++){const y=h*rand(.38,.98),P0=new V(0,y-h/2,0).applyMatrix4(c.matrix),a=rand(0,6.28),bl=rand(.4,.9)*sc,bd=new V(Math.cos(a),rand(.15,.5),Math.sin(a)).normalize();
        const tw=new THREE.Mesh(new THREE.CylinderGeometry(.008,.014,bl,3),culmMat);tw.position.copy(P0).addScaledVector(bd,bl/2);tw.quaternion.setFromUnitVectors(up,bd);g.add(tw);
        for(let q=0;q<3;q++){const C=P0.clone().addScaledVector(bd,bl*(.4+q*.3));for(let f=0;f<6;f++){const b=rand(0,6.28),dir=new V(Math.cos(b),-rand(.15,.95),Math.sin(b)).normalize();leaf(C,dir,rand(.32,.52)*sc,rand(.035,.06)*sc,pick(LEAFC))}}}
      const tp=new V(0,h/2,0).applyMatrix4(c.matrix);for(let f=0;f<5;f++){const b=rand(0,6.28);leaf(tp,new V(Math.cos(b),rand(-.6,.3),Math.sin(b)).normalize(),rand(.3,.45)*sc,.04*sc,pick(LEAFC))}}
    for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.ConeGeometry(.07,rand(.3,.6),6),M(0x9a8a4a,{flat:true}));s.position.set(rand(-.7,.7),.2,rand(-.7,.7));g.add(s)}
    const gm=new THREE.BufferGeometry();gm.setAttribute("position",new THREE.Float32BufferAttribute(lp,3));gm.setAttribute("color",new THREE.Float32BufferAttribute(lc,3));gm.computeVertexNormals();const lm=new THREE.Mesh(gm,bLeafMat);lm.castShadow=true;g.add(lm);return g}
  /* คน: ขา แขน ตัว หัว ผม บางคนใส่งอบ ถือตะกร้า (หันหน้าไปทาง +x) */
  const SKIN=[0xf1c27d,0xe0ac69,0xc68642,0xffdbac],SHIRT=[0xe53935,0x1e88e5,0x43a047,0xfdd835,0x8e24aa,0xff7043,0x26a69a,0xffffff,0x5c6bc0],PANTS=[0x37474f,0x5d4037,0x283593,0x212121,0x6d4c41];
  function person(o={}){const g=new THREE.Group(),skin=M(pick(SKIN)),shirt=M(o.shirt??pick(SHIRT),{flat:true}),pants=M(o.pants??pick(PANTS),{flat:true}),legs=[],arms=[];
    for(const z of[-.1,.1]){const p=new THREE.Group();p.position.set(0,.76,z);const l=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.72,8),pants);l.position.y=-.36;l.castShadow=true;p.add(l);const f=new THREE.Mesh(new THREE.BoxGeometry(.2,.08,.12),M(0x3e2723));f.position.set(.04,-.73,0);p.add(f);g.add(p);legs.push(p)}
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.19,.23,.68,10),shirt);body.position.y=1.1;body.castShadow=true;g.add(body);
    if(o.skirt){const sk=new THREE.Mesh(new THREE.CylinderGeometry(.23,.32,.55,10),M(o.skirt,{flat:true}));sk.position.y=.66;g.add(sk)}
    for(const z of[-.26,.26]){const p=new THREE.Group();p.position.set(0,1.38,z);const a=new THREE.Mesh(new THREE.CylinderGeometry(.058,.05,.58,8),shirt);a.position.y=-.27;p.add(a);const hd=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),skin);hd.position.y=-.58;p.add(hd);g.add(p);arms.push(p)}
    const head=new THREE.Group();head.position.y=1.66;g.add(head);const hd=new THREE.Mesh(new THREE.SphereGeometry(.21,14,12),skin);hd.castShadow=true;head.add(hd);
    const hm=M(o.hair??pick([0x1b1b1b,0x2b1d14,0x3e2723,0x1b1b1b,0xa0a0a0]));if(!o.bald){const hr=new THREE.Mesh(new THREE.SphereGeometry(.225,14,10,0,Math.PI*2,0,Math.PI*.55),hm);hr.rotation.z=.35;hr.position.x=-.02;head.add(hr)}
    if(o.long&&!o.bald){const lh=new THREE.Mesh(new THREE.BoxGeometry(.16,.5,.4),hm);lh.position.set(-.13,-.2,0);head.add(lh)}
    for(const z of[-.08,.08]){const e=new THREE.Mesh(new THREE.SphereGeometry(.026,6,4),M(0x111111));e.position.set(.195,.03,z);head.add(e)}
    const mo=new THREE.Mesh(new THREE.BoxGeometry(.02,.022,.08),M(0x8d3b2b));mo.position.set(.2,-.08,0);head.add(mo);
    if(o.hat){const h=new THREE.Mesh(new THREE.ConeGeometry(.44,.26,18),M(0xd9b56a,{flat:true}));h.position.y=.25;h.castShadow=true;head.add(h)}
    if(o.basket){const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.15,.2,10,1,true),new THREE.MeshStandardMaterial({color:0xb07a3a,side:THREE.DoubleSide}));b.position.set(.05,.85,.38);g.add(b)}
    g.userData={legs,arms,head};return g}
  function chicken(){const g=new THREE.Group(),c=pick([0xffffff,0xb5651d,0x8d4b1f,0xffffff]);const b=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),M(c));b.scale.set(1.2,1,.9);b.position.y=.28;b.castShadow=true;g.add(b);
    const tl=new THREE.Mesh(new THREE.ConeGeometry(.08,.22,6),M(c===0xffffff?0x333333:0x1b3a1b));tl.position.set(-.22,.4,0);tl.rotation.z=.8;g.add(tl);
    const hp=new THREE.Group();hp.position.set(.17,.42,0);g.add(hp);hp.add(new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),M(c)));
    const cm=new THREE.Mesh(new THREE.BoxGeometry(.09,.07,.03),M(0xe53935));cm.position.set(.01,.09,0);hp.add(cm);const bk=new THREE.Mesh(new THREE.ConeGeometry(.03,.08,4),M(0xffb300));bk.rotation.z=-Math.PI/2;bk.position.set(.11,0,0);hp.add(bk);
    for(const z of[-.06,.06]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.18,4),M(0xffb300));l.position.set(0,.09,z);g.add(l)}g.userData.head=hp;return g}
  /* บ้านไม้ใต้ถุนสูง หลังคาจั่วสูง ป้านลม บันไดขึ้นบ้าน */
  function stiltHouse(){const g=new THREE.Group(),W=4,D=3,H=1.7,F=1.6,post=M(0x5d4037);
    for(const x of[-W/2+.15,0,W/2-.15])for(const z of[-D/2+.15,D/2-.15]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,F,6),post);p.position.set(x,F/2,z);p.castShadow=true;g.add(p)}
    const fl=new THREE.Mesh(new THREE.BoxGeometry(W+.8,.14,D+.6),woodM);fl.position.y=F;fl.castShadow=true;g.add(fl);
    const b=new THREE.Mesh(new THREE.BoxGeometry(W,H,D),woodM);b.position.y=F+H/2;b.castShadow=true;g.add(b);
    const sh=new THREE.Shape();sh.moveTo(-W/2-.6,0);sh.lineTo(0,1.9);sh.lineTo(W/2+.6,0);sh.lineTo(-W/2-.6,0);
    const rf=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:D+.9,bevelEnabled:false}),M(pick([0x8d3b2b,0x6d4c41,0xa0522d,0x7a4a2a]),{flat:true}));rf.position.set(0,F+H,-(D+.9)/2);rf.castShadow=true;g.add(rf);
    const gab=new THREE.Shape();gab.moveTo(-W/2,0);gab.lineTo(0,1.75);gab.lineTo(W/2,0);gab.lineTo(-W/2,0);const gb=new THREE.Mesh(new THREE.ShapeGeometry(gab),woodM);gb.position.set(0,F+H,D/2+.47);g.add(gb);
    for(const s of[-1,1]){const pl=new THREE.Mesh(new THREE.BoxGeometry(.12,2.9,.08),post);pl.position.set(s*.98,F+H+1.15,D/2+.5);pl.rotation.z=s*1.0;g.add(pl)}
    for(const x of[-1.2,1.2]){const w=new THREE.Mesh(new THREE.BoxGeometry(.7,.75,.05),M(0x3e2a1a));w.position.set(x,F+H*.55,D/2+.01);g.add(w);for(const s of[-1,1]){const sh2=new THREE.Mesh(new THREE.BoxGeometry(.35,.75,.04),woodM);sh2.position.set(x+s*.55,F+H*.55,D/2+.04);g.add(sh2)}}
    const dr=new THREE.Mesh(new THREE.BoxGeometry(.75,1.25,.05),M(0x4e342e));dr.position.set(0,F+.65,D/2+.01);g.add(dr);
    for(let k=0;k<6;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(.9,.07,.28),woodM);st.position.set(0,.2+k*.25,D/2+.3+1.4-k*.25);g.add(st)}
    for(const s of[-1,1]){const rl=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,1.9),post);rl.position.set(s*.47,.95,D/2+1.05);rl.rotation.x=.78;g.add(rl)}
    return g}
  function jar(){const j=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10),M(0x6d3b1a,{roughness:.3,metalness:.1}));j.scale.set(1,1.15,1);j.position.y=.36;j.castShadow=true;const g=new THREE.Group();g.add(j);const rim=new THREE.Mesh(new THREE.TorusGeometry(.2,.04,6,14),j.material);rim.rotation.x=Math.PI/2;rim.position.y=.74;g.add(rim);return g}
  function bananaTree(){const g=new THREE.Group(),h=rand(1.6,2.3);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,h,8),M(0x7d9a4a,{flat:true}));tr.position.y=h/2;tr.castShadow=true;g.add(tr);
    for(let k=0;k<7;k++){const l=archLeaf(rand(1.2,1.7),.45,leafMat,.9,1.1);l.position.y=h-.05;l.rotation.y=k/7*Math.PI*2+rand(-.2,.2);l.castShadow=true;g.add(l)}return g}
  /* น้ำตก: หน้าผาหิน ตะไคร่ ต้นไม้บนผา สายน้ำไหลลงแอ่ง ฟองน้ำและละอองหมอก */
  const fallTex=canvasTex(64,256,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,"#3f9fd8");gr.addColorStop(.5,"#6cc4ee");gr.addColorStop(1,"#3f9fd8");x.fillStyle=gr;x.fillRect(0,0,w,h);for(let i=0;i<110;i++){x.fillStyle=`rgba(255,255,255,${(.3+Math.random()*.6).toFixed(2)})`;x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,20+Math.random()*60)}},1,1.5);
  const fallMat=new THREE.MeshStandardMaterial({map:fallTex,transparent:true,opacity:.95,roughness:.2,emissive:0x2a7fb8,emissiveIntensity:.35,side:THREE.DoubleSide});
  const mistTex=canvasTex(64,64,(x)=>{const gr=x.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,"rgba(255,255,255,.9)");gr.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=gr;x.fillRect(0,0,64,64)});
  const rockM=[0x8d8478,0x7a7268,0x9a9184,0x6f675e].map(c=>M(c,{flat:true,roughness:1})),mossM=[0x4f9a3a,0x5aa843,0x3f8a30].map(c=>M(c,{flat:true,roughness:1}));
  function rock(r,moss){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),moss?pick(mossM):pick(rockM));m.scale.set(rand(.8,1.3),rand(.65,1),rand(.8,1.2));m.rotation.set(rand(0,3),rand(0,3),rand(0,3));m.castShadow=true;m.receiveShadow=true;return m}
  /* น้ำตกสมจริง: หน้าผาหินสีเข้มเป็นชั้น ๆ มีตะไคร่ สายน้ำขาวหลายสายไหลจากขอบผา ละอองหมอกที่ฐาน แอ่งน้ำสีเขียวมรกต */
  const fallTexA=canvasTex(128,512,(x,w,h)=>{x.clearRect(0,0,w,h);const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,"rgba(200,235,250,0)");gr.addColorStop(.18,"rgba(205,238,252,.55)");gr.addColorStop(.5,"rgba(225,246,255,.75)");gr.addColorStop(.82,"rgba(205,238,252,.55)");gr.addColorStop(1,"rgba(200,235,250,0)");x.fillStyle=gr;x.fillRect(0,0,w,h);
      for(let i=0;i<260;i++){const X=Math.random()*w,edge=Math.min(X,w-X)/(w/2);x.fillStyle=`rgba(255,255,255,${((.25+Math.random()*.6)*Math.min(1,edge*1.6)).toFixed(2)})`;x.fillRect(X,Math.random()*h,1+Math.random()*2.5,30+Math.random()*120)}},1,1);
  const fallMatA=new THREE.MeshBasicMaterial({map:fallTexA,transparent:true,depthWrite:false,side:THREE.DoubleSide}),fallTexB=fallTexA.clone();fallTexB.needsUpdate=true;fallTexB.repeat.set(1,1.6);
  const fallMatB=new THREE.MeshBasicMaterial({map:fallTexB,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide});
  const cliffM=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1});
  function fallSheet(w,h,lip){const gm=new THREE.PlaneGeometry(w,h,4,24),p=gm.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),t=(h/2-y)/h;p.setZ(i,lip*Math.sin(Math.min(1,t*4)*Math.PI/2)*(1-t*.3)+Math.sin(p.getX(i)*3+y)*.04);p.setX(i,p.getX(i)*(1+t*.25))}gm.computeVertexNormals();
    const g=new THREE.Group(),a=new THREE.Mesh(gm,fallMatA),b=new THREE.Mesh(gm,fallMatB);b.position.z=.06;b.scale.x=.85;g.add(a);g.add(b);return g}
  function waterfall(){const g=new THREE.Group(),Hf=rand(8.5,10),W=13,falls=[];
    /* จุดน้ำตก 2-3 สาย กว้างไม่เท่ากัน */
    const nF=Math.random()<.5?2:3;for(let k=0;k<nF;k++)falls.push({x:-W/2+1.8+(W-3.6)*(nF===1?.5:k/(nF-1))+rand(-.6,.6),w:k===Math.floor(nF/2)?rand(2.4,3.4):rand(1,1.8)});
    /* หน้าผา: ก้อนหินใหญ่เหลี่ยมชัดซ้อนเป็นชั้น ๆ สีหินแต่ละก้อนต่างกันเล็กน้อย ตะไคร่เฉพาะด้านบน หลังสายน้ำเป็นหินเปียกสีเข้ม */
    const back=new THREE.Mesh(new THREE.PlaneGeometry(W+2,Hf-.6),M(0x2f2c28,{roughness:1}));back.position.set(0,(Hf-.6)/2,-1.2);g.add(back);
    const RC=[0x6b6358,0x5e574d,0x766d60,0x544e46,0x82786a,0x4a453f],WET=[0x3a3631,0x2f2c28,0x403b35],MO=[0x4a7a33,0x55883a,0x3f6e2c],pos=[];
    for(let y=.5;y<Hf+.3;y+=rand(1.05,1.35))for(let x=-W/2-.3;x<W/2+.6;x+=rand(1.15,1.5)){const inF=falls.find(f=>Math.abs(x-f.x)<f.w*.6),top=y>Hf-1;
      pos.push({x:x+rand(-.2,.2),y:y+rand(-.15,.15),z:inF?-.95:rand(-.25,.15),s:rand(.8,1.1)*(inF?.9:1),c:inF?pick(WET):top&&Math.random()<.7?pick(MO):Math.random()<.12?pick(MO):pick(RC)})}
    {const rk=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({roughness:.92,flatShading:true}),pos.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),col=new THREE.Color();
      pos.forEach((b,k)=>{e.set(rand(-.25,.25),rand(-.4,.4),rand(-.3,.3));q.setFromEuler(e);m4.compose(new THREE.Vector3(b.x,b.y,b.z),q,new THREE.Vector3(b.s*1.05,b.s*.72,b.s*.7));rk.setMatrixAt(k,m4);rk.setColorAt(k,col.set(b.c).offsetHSL(0,0,rand(-.03,.03)))});
      rk.instanceColor.needsUpdate=true;rk.castShadow=true;rk.receiveShadow=true;g.add(rk)}
    /* ชั้นหินยื่น (ledge) มีตะไคร่ด้านบน ให้หน้าผาดูเป็นชั้น */
    for(let k=0;k<5;k++){const y=rand(2,Hf-1.5),x=rand(-W/2+1,W/2-1);if(falls.some(f=>Math.abs(x-f.x)<f.w*.6+1))continue;const w=rand(1.4,2.6),l=new THREE.Mesh(new THREE.BoxGeometry(w,.28,.9),M(pick(RC),{flat:true,roughness:.95}));l.position.set(x,y,.45);l.rotation.z=rand(-.08,.08);l.castShadow=true;g.add(l);
      const mt=new THREE.Mesh(new THREE.BoxGeometry(w*.95,.08,.85),M(pick(MO),{flat:true}));mt.position.set(x,y+.17,.45);mt.rotation.z=l.rotation.z;g.add(mt)}
    /* ขอบบนผา: พุ่มไม้ ต้นไม้ เฟิร์นห้อย */
    for(let k=0;k<6;k++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(.6,1.1),1),M(pick([0x2f6b24,0x3a7d2b,0x2b5e22]),{flat:true}));b.position.set(rand(-W/2,W/2),Hf+.5,rand(-.6,.4));if(falls.some(f=>Math.abs(b.position.x-f.x)<f.w*.6))continue;g.add(b)}
    for(let k=0;k<3;k++){const t=roundTree(),x=pick([-W/2+1,W/2-1,rand(-W/2,W/2)]);if(falls.some(f=>Math.abs(x-f.x)<f.w))continue;t.position.set(x,Hf+.3,-.8);g.add(t)}
    for(let k=0;k<7;k++){const f=fern();f.scale.setScalar(rand(.6,1));f.rotation.x=rand(.4,.9);f.position.set(rand(-W/2,W/2),rand(1.5,Hf),.5);if(falls.some(q=>Math.abs(f.position.x-q.x)<q.w*.7))continue;g.add(f)}
    /* สายน้ำ: ไหลจากขอบผา โค้งออกนิดหน่อย กว้างขึ้นตอนล่าง */
    for(const f of falls){const h=Hf+.3,sh=fallSheet(f.w,h,.55);sh.position.set(f.x,h/2,.35);g.add(sh);
      const lip=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,f.w*.95,8,1,false,0,Math.PI),new THREE.MeshBasicMaterial({color:0xeaf8ff,transparent:true,opacity:.8,depthWrite:false}));lip.rotation.z=Math.PI/2;lip.position.set(f.x,Hf+.15,.25);g.add(lip);
      /* ฟองขาวตรงที่น้ำตกกระทบ + หมอกลอย */
      const fm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,depthWrite:false});for(let k=0;k<7;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(rand(.25,.5)*f.w/2,10,8),fm);b.scale.y=.4;b.position.set(f.x+rand(-f.w/2,f.w/2),.15,.9+rand(0,.8));g.add(b)}
      for(let k=0;k<Math.round(2+f.w);k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,transparent:true,opacity:.45,depthWrite:false}));sp.position.set(f.x+rand(-f.w*.5,f.w*.5),rand(.2,1),1.2+rand(0,1));sp.scale.setScalar(rand(1,1.8)*(.6+f.w*.2));g.add(sp);anim.push({seg:null,obj:sp,kind:"mist",ph:rand(0,6),y0:sp.position.y})}}
    /* แอ่งน้ำสีเขียวมรกต มีระลอก ขอบหินมีตะไคร่ */
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(W+1,7),new THREE.MeshStandardMaterial({color:0x3fb7b0,map:canalRip,roughness:.1,metalness:.1,emissive:0x0d4f55,emissiveIntensity:.25,transparent:true,opacity:.92}));pool.rotation.x=-Math.PI/2;pool.position.set(0,.06,3.6);g.add(pool);
    for(let k=0;k<16;k++){const rr=rock(rand(.35,.75),Math.random()<.5);rr.position.set(rand(-W/2,W/2),.1,7+rand(-.2,.4));g.add(rr)}
    for(let k=0;k<5;k++){const rr=rock(rand(.4,.8),true);rr.position.set(rand(-W/2,W/2),.15,rand(1.2,6));if(falls.some(f=>Math.abs(rr.position.x-f.x)<f.w*.7))continue;g.add(rr)}
    const rb=new THREE.Mesh(new THREE.TorusGeometry(2.4,.14,6,24,Math.PI),new THREE.MeshBasicMaterial({color:0xffe9a8,transparent:true,opacity:.18,depthWrite:false}));rb.position.set(falls[0].x+1,1.4,2.6);g.add(rb);
    return g}
  function fern(){const g=new THREE.Group();for(let k=0;k<9;k++){const f=archLeaf(rand(.7,1.1),.24,fernMat,.9,1);f.rotation.y=k/9*Math.PI*2+rand(-.2,.2);g.add(f)}return g}
  /* ตลาด: แผงร้านหลังคาผ้าใบลายทาง ผลไม้ผักกองบนโต๊ะ แม่ค้า ป้ายชื่อร้าน ธงราว */
  const awnTex=(a,b)=>canvasTex(64,16,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?a:b;x.fillRect(i*8,0,8,h)}},2,1);
  const AWN=[["#e53935","#ffffff"],["#1e88e5","#ffffff"],["#43a047","#fff59d"],["#ff9800","#fff3e0"],["#8e24aa","#f3e5f5"]].map(([a,b])=>new THREE.MeshStandardMaterial({map:awnTex(a,b),side:THREE.DoubleSide,roughness:.8}));
  const SHOP=[["ผลไม้",[0xff9800,0xe53935,0xffeb3b,0x7cb342]],["ผักสด",[0x43a047,0x7cb342,0xff7043,0xffffff]],["ขนมไทย",[0xf48fb1,0xfff59d,0x81c784,0xffffff]],["ดอกไม้",[0xe91e63,0xffeb3b,0xffffff,0xab47bc]],["ปลาสด",[0x90a4ae]],["เนื้อสด",[0xc62828]]];
  const SHOP_EN={"ผลไม้":"Fruit","ผักสด":"Vegetables","ขนมไทย":"Sweets","ดอกไม้":"Flowers","ปลาสด":"Fish","เนื้อสด":"Meat"};
  function stall(o={}){const g=new THREE.Group(),W=3,D=1.3,[nm,cols]=o.name?[o.name,[0x222222]]:pick(SHOP);
    const tb=new THREE.Mesh(new THREE.BoxGeometry(W,.12,D),woodM);tb.position.y=.85;tb.castShadow=true;g.add(tb);
    const sk=new THREE.Mesh(new THREE.BoxGeometry(W,.8,.05),M(pick([0xfff3e0,0xe3f2fd,0xfce4ec,0xf1f8e9])));sk.position.set(0,.42,D/2);g.add(sk);
    for(const x of[-W/2+.08,W/2-.08])for(const z of[-D/2,D/2+.5]){const h=z>0?2.15:2.65,p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,h,6),M(0x8d6e63));p.position.set(x,h/2,z);g.add(p)}
    const am=pick(AWN),aw=new THREE.Mesh(new THREE.PlaneGeometry(W+.3,1.95),am);aw.rotation.x=-Math.PI/2+.26;aw.position.set(0,2.42,.25);aw.castShadow=true;g.add(aw);
    const va=new THREE.Mesh(new THREE.BoxGeometry(W+.3,.22,.03),am);va.position.set(0,2.06,1.2);g.add(va);
    for(let t=0;t<3;t++){const cx=-1+t,col=cols[t%cols.length],r=nm==="ปลาสด"?.0:.11;const tray=new THREE.Mesh(new THREE.CylinderGeometry(.42,.36,.08,12),M(0xb07a3a));tray.position.set(cx,.95,.05);g.add(tray);
      if(o.umb){for(let f=0;f<2;f++){const u=new THREE.Group(),c=new THREE.Mesh(new THREE.ConeGeometry(.24,.16,8,1,true),new THREE.MeshStandardMaterial({color:pick([0xff7043,0x1e88e5,0xffca28,0xab47bc,0x43a047]),side:THREE.DoubleSide,flatShading:true}));c.position.y=.32;u.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.34,5),M(0x5d4037));st.position.y=.16;u.add(st);u.position.set(cx+(f-.5)*.3,.98,.05);u.rotation.z=(f-.5)*.4;g.add(u)}}
      else if(o.warm){const cm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.24,6),M(pick([0xd32f2f,0x1565c0,0x6d4c41]),{flat:true}));cm.position.set(cx-.13,1.1,.05);g.add(cm);const sc=new THREE.Mesh(new THREE.TorusGeometry(.1,.035,6,14),M(pick([0xffeb3b,0xec407a,0x43a047,0x29b6f6])));sc.rotation.x=Math.PI/2;sc.position.set(cx+.17,1.02,.05);g.add(sc)}
      else if(o.shades){for(let f=0;f<3;f++){const sg=shadesMini(pick([0xe53935,0x1e88e5,0xffb300,0x8e24aa,0x111111]));sg.position.set(cx+(f-1)*.24,1.05,.05+(f%2)*.12);g.add(sg)}}
      else g.add(goods(nm,cx,.98,.05))}
    /* ร้านเสื้อกันหนาว: ราวแขวนเสื้อข้างร้าน มีเสื้อฮู้ดกับผ้าพันคอแขวนบนไม้แขวน */
    if(o.warm){const rk=new THREE.Group(),mt=M(0x9e9e9e,{metalness:.6,roughness:.35});for(const x of[-.85,.85]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2,8),mt);p.position.set(x,1,0);rk.add(p);const ft=new THREE.Mesh(new THREE.BoxGeometry(.08,.04,.6),mt);ft.position.set(x,.02,0);rk.add(ft)}
      const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8,8),mt);bar.rotation.z=Math.PI/2;bar.position.y=1.95;rk.add(bar);
      [0xd32f2f,0x1565c0,0x2e7d32,0xf9a825].forEach((c,k)=>{const x=-.6+k*.4,hg=new THREE.Group();hg.position.set(x,1.95,0);
        const hk=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,4,10,Math.PI*1.4),mt);hk.position.y=.03;hk.rotation.z=-.3;hg.add(hk);
        const sh=new THREE.Mesh(new THREE.BoxGeometry(.34,.025,.03),M(0x8d6e63));sh.position.y=-.08;hg.add(sh);
        if(k===3){const sf=new THREE.Mesh(new THREE.BoxGeometry(.1,.7,.04),M(0xec407a));sf.position.y=-.45;hg.add(sf);const sf2=sf.clone();sf2.position.x=.12;hg.add(sf2)}
        else{const cm=M(c,{roughness:.85}),bd=new THREE.Mesh(new THREE.BoxGeometry(.3,.5,.12),cm);bd.position.y=-.36;hg.add(bd);for(const sx of[-1,1]){const sl=new THREE.Mesh(new THREE.BoxGeometry(.08,.42,.1),cm);sl.position.set(sx*.19,-.35,0);sl.rotation.z=sx*.12;hg.add(sl)}
          const hd=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8,0,Math.PI*2,0,Math.PI/2),cm);hd.position.set(0,-.13,-.05);hd.rotation.x=-.6;hg.add(hd);const zp=new THREE.Mesh(new THREE.BoxGeometry(.015,.46,.01),M(0xd9d9d9));zp.position.set(0,-.36,.065);hg.add(zp)}
        rk.add(hg)});
      rk.position.set(W/2+1.1,0,.3);rk.rotation.y=-.35;g.add(rk)}
    if(nm==="เนื้อสด")for(let k=0;k<3;k++){const hk=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,4,8,Math.PI),M(0x9e9e9e,{metalness:.7}));hk.position.set(-1+k,2.05,.5);g.add(hk);const mt=new THREE.Mesh(new THREE.BoxGeometry(.22,.4,.12),M(0xb71c1c,{roughness:.5}));mt.position.set(-1+k,1.78,.5);g.add(mt)}
    const v=person({hat:Math.random()<.3,long:Math.random()<.5});v.rotation.y=-Math.PI/2;v.position.set(rand(-.8,.8),0,-D/2-.45);g.add(v);anim.push({seg:null,obj:v,kind:"wave",ph:rand(0,6)});
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.5),new THREE.MeshBasicMaterial({map:txt(SHOP_EN[nm]||nm,{size:70,color:"#7a3b00",bg:"#fff8e1",border:"#8d5a2b",w:300,h:100,radius:20}),transparent:true}));sg.position.set(0,2.3,1.23);g.add(sg);
    return g}
  function shadesMini(col,s=1){const g=new THREE.Group(),fr=M(col,{metalness:.3,roughness:.4}),ln=M(0x111111,{metalness:.6,roughness:.15});
    for(const x of[-.07,.07]){const l=new THREE.Mesh(new THREE.CircleGeometry(.055,14),ln);l.position.set(x*s,0,.006);l.scale.setScalar(s);g.add(l);const r=new THREE.Mesh(new THREE.TorusGeometry(.057*s,.009*s,6,14),fr);r.position.x=x*s;g.add(r)}
    const b=new THREE.Mesh(new THREE.BoxGeometry(.04*s,.01*s,.01*s),fr);b.position.y=.02*s;g.add(b);return g}
  /* หีบสมบัติข้างทาง: เดินผ่านแล้วฝาเปิด มีเหรียญเด้งออกมา บางทีได้หัวใจ */
  function chest(){const g=new THREE.Group(),wd=M(0x9c5b26,{flat:true}),gold=M(0xffc107,{metalness:.6,roughness:.3});
    const b=new THREE.Mesh(new THREE.BoxGeometry(.8,.45,.5),wd);b.position.y=.23;b.castShadow=true;g.add(b);
    for(const x of[-.3,.3]){const st=new THREE.Mesh(new THREE.BoxGeometry(.07,.47,.52),gold);st.position.set(x,.23,0);g.add(st)}
    const lid=new THREE.Group();lid.position.set(0,.45,-.25);g.add(lid);const l=new THREE.Mesh(new THREE.BoxGeometry(.82,.18,.52),wd);l.position.set(0,.09,.25);l.castShadow=true;lid.add(l);
    for(const x of[-.3,.3]){const st=new THREE.Mesh(new THREE.BoxGeometry(.07,.2,.54),gold);st.position.set(x,.09,.25);lid.add(st)}
    const lk=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,.04),gold);lk.position.set(0,.4,.27);g.add(lk);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0xfff2a0,transparent:true,opacity:.8,depthWrite:false}));glow.position.y=.7;glow.scale.setScalar(.9);g.add(glow);
    g.userData={lid,glow,lk};return g}
  function bunting(L){const g=new THREE.Group(),cl=[0xe53935,0xffeb3b,0x1e88e5,0x43a047,0xff9800,0xab47bc];for(const x of[0,L]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.6,6),M(0x8d6e63));p.position.set(x,1.8,0);g.add(p)}
    const tri=new THREE.Shape();tri.moveTo(-.16,0);tri.lineTo(.16,0);tri.lineTo(0,-.36);const tg=new THREE.ShapeGeometry(tri);for(let k=1;k<16;k++){const t=k/16,f=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({color:cl[k%cl.length],side:THREE.DoubleSide}));f.position.set(t*L,3.5-.5*Math.sin(Math.PI*t),0);g.add(f)}return g}
  /* บ้านผีสิง: ต้นไม้แห้ง ป้ายหลุมศพ รั้วเหล็ก บ้านร้างหน้าต่างเรืองแสง ไฟผี ค้างคาว */
  const darkWood=M(0x2b2119,{flat:true});
  function deadTree(){const g=new THREE.Group(),h=rand(2.6,3.8);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.09,.24,h,6),darkWood);tr.position.y=h/2;tr.rotation.z=rand(-.12,.12);tr.castShadow=true;g.add(tr);
    for(let k=0;k<6;k++){const L=rand(.8,1.6),br=new THREE.Group();br.position.y=h*rand(.5,.95);br.rotation.set(0,rand(0,6.28),rand(.6,1.2));const b=new THREE.Mesh(new THREE.CylinderGeometry(.025,.07,L,5),darkWood);b.position.y=L/2;br.add(b);
      const tw=new THREE.Group();tw.position.y=L*.8;tw.rotation.z=rand(-.9,.9);const t2=new THREE.Mesh(new THREE.CylinderGeometry(.01,.03,L*.5,4),darkWood);t2.position.y=L*.25;tw.add(t2);br.add(tw);g.add(br)}return g}
  function grave(){const g=new THREE.Group(),m=M(pick([0x8a8a94,0x7a7a84,0x9a98a0]),{flat:true});
    if(Math.random()<.65){const s=new THREE.Mesh(new THREE.BoxGeometry(.6,.75,.16),m);s.position.y=.37;g.add(s);const t=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.16,14),m);t.rotation.x=Math.PI/2;t.position.y=.75;g.add(t)}
    else{const v=new THREE.Mesh(new THREE.BoxGeometry(.14,1.05,.14),m);v.position.y=.52;g.add(v);const hz=new THREE.Mesh(new THREE.BoxGeometry(.6,.14,.14),m);hz.position.y=.75;g.add(hz)}
    const md=new THREE.Mesh(new THREE.SphereGeometry(.45,10,6),M(0x3b3024,{flat:true}));md.scale.set(1,.25,1.6);md.position.set(0,0,.75);g.add(md);g.rotation.z=rand(-.15,.15);g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
  function ironFence(L){const g=new THREE.Group(),m=M(0x1a1a1f,{metalness:.5,roughness:.5});for(let x=0;x<=L;x+=.35){const b=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.2,4),m);b.position.set(x,.6,0);g.add(b);const t=new THREE.Mesh(new THREE.ConeGeometry(.045,.14,4),m);t.position.set(x,1.25,0);g.add(t)}
    for(const y of[.25,1])  {const r=new THREE.Mesh(new THREE.BoxGeometry(L,.04,.04),m);r.position.set(L/2,y,0);g.add(r)}return g}
  function hauntedHouse(){const g=new THREE.Group(),wall=M(0x3e3344,{flat:true}),rfm=M(0x1d1424,{flat:true}),glow=M(0xd4ff6a,{emissive:0xb8ff3a,emissiveIntensity:1.3}),dark=M(0x120c14);
    const b=new THREE.Mesh(new THREE.BoxGeometry(4.4,3.2,3),wall);b.position.y=1.6;b.rotation.z=.03;b.castShadow=true;g.add(b);
    const r=new THREE.Mesh(new THREE.ConeGeometry(3.3,2.2,4),rfm);r.rotation.y=Math.PI/4;r.position.y=4.25;r.scale.z=.75;r.rotation.z=-.04;g.add(r);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(1.3,5.2,1.3),wall);tw.position.set(1.8,2.6,.3);tw.rotation.z=-.05;tw.castShadow=true;g.add(tw);
    const tr=new THREE.Mesh(new THREE.ConeGeometry(1.15,2.4,4),rfm);tr.rotation.y=Math.PI/4;tr.position.set(1.95,6.3,.3);tr.rotation.z=-.15;g.add(tr);
    for(const[x,y]of[[-1.3,2.2],[-.1,2.2],[-1.3,.9]]){const w=new THREE.Mesh(new THREE.BoxGeometry(.7,.8,.05),glow);w.position.set(x,y,1.52);g.add(w);const c1=new THREE.Mesh(new THREE.BoxGeometry(.06,.8,.06),dark);c1.position.set(x,y,1.55);g.add(c1);const c2=new THREE.Mesh(new THREE.BoxGeometry(.7,.06,.06),dark);c2.position.set(x,y,1.55);g.add(c2)}
    const tw2=new THREE.Mesh(new THREE.CircleGeometry(.3,12),glow);tw2.position.set(1.8,4.3,.96);g.add(tw2);
    const dr=new THREE.Mesh(new THREE.BoxGeometry(.8,1.4,.05),dark);dr.position.set(.3,.7,1.52);g.add(dr);
    for(let k=0;k<4;k++){const bd=new THREE.Mesh(new THREE.BoxGeometry(rand(.6,1),.12,.05),darkWood);bd.position.set(rand(-1.8,.8),rand(.5,2.6),1.56);bd.rotation.z=rand(-.6,.6);g.add(bd)}
    return g}
  const wispMat=new THREE.MeshBasicMaterial({color:0x9dff8a,transparent:true,opacity:.85});
  function bat(){const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0x111111,side:THREE.DoubleSide});const b=new THREE.Mesh(new THREE.SphereGeometry(.08,6,4),m);g.add(b);
    const wing=new THREE.Shape();wing.moveTo(0,0);wing.lineTo(.45,.1);wing.lineTo(.38,-.05);wing.lineTo(.28,.0);wing.lineTo(.2,-.08);wing.lineTo(0,-.04);const wg=new THREE.ShapeGeometry(wing);
    const ws=[];for(const s of[-1,1]){const w=new THREE.Mesh(wg,m);w.scale.x=s;g.add(w);ws.push(w)}g.userData.ws=ws;return g}
  /* ผีออกมาหลอกเมื่อตอบผิด (ข้อละตัว 5 แบบ): ผีผ้าขาว ผีเขียว ผีผมยาว ผีม่วงแลบลิ้น ผีหัวกะโหลก */
  function ghost(v){const g=new THREE.Group(),C=[0xffffff,0x9dff8a,0xf5f5f5,0xc59bff,0xfff8e7][v],mat=new THREE.MeshStandardMaterial({color:C,emissive:C,emissiveIntensity:.45,transparent:true,opacity:.92,roughness:.6,side:THREE.DoubleSide});
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.55,18,14),mat);hd.position.y=1.25;g.add(hd);
    const sk=new THREE.CylinderGeometry(.55,.8,1.2,20,3,true),p=sk.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)<-.55){const a=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,p.getY(i)+.13*Math.sin(a*7))}}sk.computeVertexNormals();
    const body=new THREE.Mesh(sk,mat);body.position.y=.65;g.add(body);
    for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.7,8),mat);a.position.set(s*.55,.95,.35);a.rotation.set(1.2,0,-s*.3);g.add(a)}
    const eyeC=v===1||v===2?0xff1744:0x111111,eye=new THREE.MeshBasicMaterial({color:eyeC,transparent:true});
    for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(v===4?.16:.11,10,8),eye);e.scale.set(1,1.35,.5);e.position.set(s*.2,1.33,.5);g.add(e)}
    const mo=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0x220000,transparent:true}));mo.scale.set(1,1.3,.4);mo.position.set(0,1.05,.52);g.add(mo);
    if(v===2){const hm=new THREE.MeshStandardMaterial({color:0x0a0a0a,transparent:true});const hr=new THREE.Mesh(new THREE.SphereGeometry(.6,16,12,0,Math.PI*2,0,Math.PI*.6),hm);hr.position.y=1.3;g.add(hr);
      for(const s of[-1,1]){const lh=new THREE.Mesh(new THREE.BoxGeometry(.28,1.5,.2),hm);lh.position.set(s*.42,.65,.2);g.add(lh)}const bk=new THREE.Mesh(new THREE.BoxGeometry(1,1.6,.25),hm);bk.position.set(0,.65,-.35);g.add(bk)}
    if(v===3){const tg=new THREE.Mesh(new THREE.BoxGeometry(.14,.32,.06),new THREE.MeshBasicMaterial({color:0xff4081,transparent:true}));tg.position.set(0,.88,.56);tg.rotation.x=-.4;g.add(tg)}
    if(v===4)for(const s of[-1,0,1]){const t=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.04),new THREE.MeshBasicMaterial({color:0x111111,transparent:true}));t.position.set(s*.09,.96,.55);g.add(t)}
    return g}
  /* ด่านสุดท้าย สำนวนไทย: ศาลาไทยหลังคาซ้อนชั้น ช่อฟ้า ใบระกา สระบัว ต้นลีลาวดี เจดีย์ทอง */
  const goldM=M(0xffc107,{metalness:.55,roughness:.35});
  function gable(w,h,d,col){const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(0,h);sh.lineTo(w/2,0);sh.lineTo(-w/2,0);const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false}),M(col,{flat:true}));m.position.z=-d/2;m.castShadow=true;return m}
  function seatedMonk(s=1){const g=new THREE.Group();const lap=new THREE.Mesh(new THREE.SphereGeometry(.38,12,8),robeM);lap.scale.set(1,.3,.75);lap.position.y=.12;g.add(lap);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.17,.27,.6,10),robeM);b.position.y=.45;b.castShadow=true;g.add(b);const sh=new THREE.Mesh(new THREE.BoxGeometry(.36,.08,.42),robeD);sh.position.y=.68;sh.rotation.x=.6;g.add(sh);
    const h=new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),M(pick(SKIN)));h.position.y=.88;g.add(h);for(const z of[-.06,.06]){const e=new THREE.Mesh(new THREE.BoxGeometry(.01,.008,.04),M(0x222222));e.position.set(.145,.9,z);g.add(e)}
    const hands=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),M(pick(SKIN)));hands.scale.set(1.3,.5,1);hands.position.set(.12,.27,0);g.add(hands);g.scale.setScalar(s);return g}
  function salaThai(){const g=new THREE.Group(),white=M(0xfaf6ee,{flat:true});
    const base=new THREE.Mesh(new THREE.BoxGeometry(5.4,.55,3.8),white);base.position.y=.27;base.castShadow=true;g.add(base);for(let k=0;k<3;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(1.4,.18,.3),white);st.position.set(0,.09+k*.18,2.2-k*.3);g.add(st)}
    for(const x of[-2.2,-.75,.75,2.2])for(const z of[-1.5,1.5]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,2.4,10),white);p.position.set(x,.55+1.2,z);p.castShadow=true;g.add(p);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.18,.12,.2,10),goldM);cap.position.set(x,2.9,z);g.add(cap)}
    for(let k=0;k<3;k++){const m=seatedMonk(k===1?1.05:.95);m.position.set(-1.4+k*1.4,.55,-.3+(k%2)*.4);m.rotation.y=-Math.PI/2;g.add(m)}
    const y0=2.95;const r1=gable(6.4,1.6,4.6,0x1b5e20);r1.position.y=y0;g.add(r1);const r2=gable(5.9,1.75,4.7,0xc62828);r2.position.y=y0+.12;g.add(r2);
    const r3=gable(4.4,2.3,3.4,0xd84315);r3.position.y=y0+.9;g.add(r3);const r4=gable(4.1,2.4,3.5,0xc62828);r4.position.y=y0+1;g.add(r4);
    const pn=new THREE.Shape();pn.moveTo(-1.9,0);pn.lineTo(0,2.2);pn.lineTo(1.9,0);pn.lineTo(-1.9,0);const pnl=new THREE.Mesh(new THREE.ShapeGeometry(pn),goldM);pnl.position.set(0,y0+1.02,1.78);g.add(pnl);
    for(const z of[-1.8,1.8]){const cf=new THREE.Mesh(new THREE.TorusGeometry(.28,.06,6,12,Math.PI*1.2),goldM);cf.position.set(0,y0+3.55,z);cf.rotation.z=-.4;g.add(cf);
      for(let k=1;k<8;k++)for(const s of[-1,1]){const t=k/8,br=new THREE.Mesh(new THREE.ConeGeometry(.06,.26,4),goldM);br.position.set(s*(2.05*(1-t)),y0+1+2.4*t+.12,z);br.rotation.z=-s*.6;g.add(br)}}
    return g}
  function lotusPond(){const g=new THREE.Group(),w=new THREE.Mesh(new THREE.CircleGeometry(2.8,28),canalMat);w.rotation.x=-Math.PI/2;w.position.y=.04;w.scale.y=.6;g.add(w);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(2.8,.12,6,32),M(0xd7ccc8,{flat:true}));rim.rotation.x=Math.PI/2;rim.scale.y=.6;rim.position.y=.05;g.add(rim);
    for(let k=0;k<7;k++){const a=rand(0,6.28),r=rand(.3,2.2),x=Math.cos(a)*r,z=Math.sin(a)*r*.55;const pad=new THREE.Mesh(new THREE.CircleGeometry(.32,12,.3,5.8),M(0x4caf50,{side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(x,.06,z);g.add(pad);
      if(k%2===0){const fl=new THREE.Group();fl.position.set(x+.1,.08,z);for(let p=0;p<8;p++){const pt=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),M(p<4?0xf06292:0xf8bbd0));pt.scale.set(.6,1.6,.4);const a2=p/8*Math.PI*2;pt.position.set(Math.cos(a2)*.09,.14,Math.sin(a2)*.09);pt.rotation.set(Math.sin(a2)*.5,0,-Math.cos(a2)*.5);fl.add(pt)}const c=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0xffd54f));c.position.y=.12;fl.add(c);g.add(fl)}}
    return g}
  function frangipani(){const g=new THREE.Group(),bm=M(0x8d7a66,{flat:true}),tr=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,1.6,7),bm);tr.position.y=.8;tr.castShadow=true;g.add(tr);
    for(let k=0;k<5;k++){const br=new THREE.Group();br.position.y=1.5;br.rotation.set(0,k/5*Math.PI*2+rand(-.3,.3),rand(.5,.9));const b=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,1.2,6),bm);b.position.y=.6;br.add(b);
      const tip=new THREE.Group();tip.position.y=1.2;br.add(tip);for(let l=0;l<7;l++){const lf=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M(0x2e7d32,{flat:true}));lf.scale.set(.6,.3,2.4);lf.position.set(0,.05,0);lf.rotation.set(rand(-.6,.6),l/7*Math.PI*2,0);lf.translateZ(.25);tip.add(lf)}
      for(let f=0;f<5;f++){const fl=new THREE.Group();fl.position.set(rand(-.18,.18),.22,rand(-.18,.18));for(let p=0;p<5;p++){const pt=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),M(0xffffff));pt.scale.set(1.6,.4,.9);const a=p/5*Math.PI*2;pt.position.set(Math.cos(a)*.06,0,Math.sin(a)*.06);pt.rotation.y=-a;fl.add(pt)}const cc=new THREE.Mesh(new THREE.SphereGeometry(.03,6,4),M(0xffc107));cc.position.y=.02;fl.add(cc);tip.add(fl)}
      g.add(br)}return g}
  function stupa(){const g=new THREE.Group();let y=0;for(const[r,h]of[[1.3,.4],[1.1,.3],[.9,.3]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),goldM);c.position.y=y+h/2;c.castShadow=true;g.add(c);y+=h}
    const bell=new THREE.Mesh(new THREE.SphereGeometry(.8,18,12,0,Math.PI*2,0,Math.PI/2),goldM);bell.scale.y=1.4;bell.position.y=y;g.add(bell);y+=1.1;
    for(let k=0;k<6;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(.32-k*.04,.05,6,14),goldM);r.rotation.x=Math.PI/2;r.position.y=y+k*.16;g.add(r)}const sp=new THREE.Mesh(new THREE.ConeGeometry(.1,1.4,10),goldM);sp.position.y=y+1.6;g.add(sp);return g}
  /* แหลมหินคั่นระหว่างทุ่งกับชายหาด ไม่ให้เห็นรอยต่อเป็นเส้นตรง */
  function headland(g,x){for(let k=0;k<10;k++){const r=rand(3.4,5.5)*(1+k*.12),z=-2.8-r*.9-k*6.5,m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),k%4===1?pick(rockM):pick(mossM));m.scale.set(.85,rand(.55,.85),.9);m.position.set(x+rand(-1,1),r*.1,z);m.castShadow=true;m.receiveShadow=true;g.add(m);
      if(k>=1&&k<=3&&Math.random()<.8){const h=house();h.scale.setScalar(.9);h.position.set(x+rand(-1,1),r*.1+r*.55*.85-.2,z+rand(-.5,.5));h.rotation.y=rand(-.5,.5);g.add(h)}
      if(k<4&&Math.random()<.7){const t=Math.random()<.5?palm2():roundTree();t.position.set(x+rand(-1.5,1.5),r*.1+r*.55*.85,z+rand(-1,1));g.add(t)}}
    for(let k=0;k<5;k++){const rr=rock(rand(.5,1.1));rr.position.set(x+rand(-1.4,1.4),.2,rand(2.2,9));g.add(rr)}
    for(let k=0;k<3;k++){const b=bush();b.position.set(x+rand(-2,2),0,rand(2.4,6));g.add(b)}}
  /* ===== สวนสัตว์: ช้าง ยีราฟ ม้าลาย สิงโต ลิง กระต่าย เพนกวิน จระเข้ (หันหน้าไปทาง +x มี userData.head ให้ก้มกินได้) ===== */
  const patTex=(base,dot,kind)=>canvasTex(64,64,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);x.fillStyle=dot;
    if(kind==="stripe")for(let i=0;i<8;i++){x.save();x.translate(i*8+4,0);x.rotate(.15);x.fillRect(-2,-4,4,72);x.restore()}
    else for(let i=0;i<9;i++){x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,5+Math.random()*5,4+Math.random()*4,Math.random()*3,0,Math.PI*2);x.fill()}},2,2);
  const giraffeM=new THREE.MeshStandardMaterial({map:patTex("#f2c14e","#9c5b1f","spot"),roughness:.8}),zebraM=new THREE.MeshStandardMaterial({map:patTex("#f5f5f5","#1a1a1a","stripe"),roughness:.8});
  const legs4=(g,m,h,r,dx,dz)=>{for(const[x,z]of[[dx,dz],[dx,-dz],[-dx,dz],[-dx,-dz]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.85,h,7),m);l.position.set(x,h/2,z);l.castShadow=true;g.add(l)}};
  const eyes=(hp,x,y,z,r=.035)=>{for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(r,6,4),M(0x111111));e.position.set(x,y,s*z);hp.add(e)}};
  function elephant(){const g=new THREE.Group(),m=M(0x9e9e9e,{flat:true});const b=new THREE.Mesh(new THREE.SphereGeometry(.9,14,10),m);b.scale.set(1.4,1,1);b.position.y=1.5;b.castShadow=true;g.add(b);legs4(g,m,1.1,.22,.7,.45);
    const hp=new THREE.Group();hp.position.set(1.15,1.75,0);g.add(hp);const h=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),m);hp.add(h);
    for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.CircleGeometry(.55,12),new THREE.MeshStandardMaterial({color:0x8d8d8d,side:THREE.DoubleSide}));e.position.set(-.15,.05,s*.5);e.rotation.y=s*.4;e.scale.x=.8;hp.add(e)}
    let p=new THREE.Vector3(.45,-.1,0);for(let k=0;k<7;k++){const r=.18-k*.018,t=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),m);p=p.clone().add(new THREE.Vector3(.12-k*.02,-.16,0));t.position.copy(p);hp.add(t)}
    for(const s of[-1,1]){const tk=new THREE.Mesh(new THREE.ConeGeometry(.06,.45,6),M(0xfffde7));tk.position.set(.5,-.35,s*.22);tk.rotation.z=-2.2;hp.add(tk)}eyes(hp,.42,.15,.28,.05);g.userData.head=hp;return g}
  function giraffe(){const g=new THREE.Group(),lm=M(0xd9a441);const b=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),giraffeM);b.scale.set(1.5,.9,.8);b.position.y=1.9;b.castShadow=true;g.add(b);legs4(g,lm,1.7,.08,.55,.25);
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,2,8),giraffeM);nk.position.set(.75,2.95,0);nk.rotation.z=-.35;nk.castShadow=true;g.add(nk);
    const hp=new THREE.Group();hp.position.set(1.12,3.9,0);g.add(hp);const h=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),giraffeM);h.scale.set(1.6,1,1);h.position.x=.15;hp.add(h);
    for(const s of[-1,1]){const o=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.25,5),lm);o.position.set(0,.25,s*.08);hp.add(o);const k=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),M(0x5d3a1a));k.position.set(0,.38,s*.08);hp.add(k)}eyes(hp,.22,.08,.17);g.userData.head=hp;return g}
  function zebra(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.5,12,10),zebraM);b.scale.set(1.6,.9,.75);b.position.y=1.15;b.castShadow=true;g.add(b);legs4(g,zebraM,.9,.08,.55,.22);
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.22,.75,8),zebraM);nk.position.set(.75,1.55,0);nk.rotation.z=-.7;g.add(nk);const mn=new THREE.Mesh(new THREE.BoxGeometry(.6,.12,.05),M(0x111111));mn.position.set(.72,1.72,0);mn.rotation.z=-.7;g.add(mn);
    const hp=new THREE.Group();hp.position.set(1.05,1.75,0);g.add(hp);const h=new THREE.Mesh(new THREE.BoxGeometry(.55,.26,.26),zebraM);h.position.set(.2,-.12,0);h.rotation.z=-.5;hp.add(h);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.ConeGeometry(.06,.18,5),M(0xffffff));e.position.set(-.02,.12,s*.1);hp.add(e)}eyes(hp,.12,0,.14);g.userData.head=hp;return g}
  function lion(){const g=new THREE.Group(),m=M(0xd9a35b,{flat:true});const b=new THREE.Mesh(new THREE.SphereGeometry(.5,12,10),m);b.scale.set(1.5,.8,.75);b.position.y=.95;b.castShadow=true;g.add(b);legs4(g,m,.7,.1,.5,.22);
    const tl=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.8,5),m);tl.position.set(-.95,1,0);tl.rotation.z=1;g.add(tl);const tf=new THREE.Mesh(new THREE.SphereGeometry(.09,6,4),M(0x7a3e10));tf.position.set(-1.3,.8,0);g.add(tf);
    const hp=new THREE.Group();hp.position.set(.8,1.25,0);g.add(hp);const mane=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1),M(0xa0521d,{flat:true}));mane.scale.x=.7;hp.add(mane);const h=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),m);h.position.x=.22;hp.add(h);
    const sn=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),M(0xf1d7a8));sn.position.set(.45,-.08,0);hp.add(sn);const ns=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),M(0x3e2723));ns.position.set(.58,-.02,0);hp.add(ns);eyes(hp,.45,.1,.12);g.userData.head=hp;return g}
  function monkey(){const g=new THREE.Group(),m=M(0x6d4c41,{flat:true}),f=M(0xf1c9a0);const b=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),m);b.scale.y=1.2;b.position.y=.5;g.add(b);
    const hp=new THREE.Group();hp.position.set(.05,.95,0);g.add(hp);hp.add(new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),m));const fc=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),f);fc.position.set(.1,-.03,0);fc.scale.x=.7;hp.add(fc);
    for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),f);e.position.set(0,.02,s*.22);e.scale.z=.5;hp.add(e)}eyes(hp,.2,.05,.07,.03);
    const tl=new THREE.Mesh(new THREE.TorusGeometry(.3,.035,6,14,Math.PI*1.3),m);tl.position.set(-.3,.45,0);g.add(tl);for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.5,6),m);a.position.set(.1,.55,s*.25);a.rotation.x=s*.5;g.add(a)}g.userData.head=hp;return g}
  function rabbit(){const g=new THREE.Group(),m=M(pick([0xffffff,0xd7ccc8,0xbcaaa4]));const b=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),m);b.scale.set(1.3,1,1);b.position.y=.24;g.add(b);
    const hp=new THREE.Group();hp.position.set(.24,.42,0);g.add(hp);hp.add(new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),m));for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.25,4,6),m);e.position.set(-.02,.25,s*.06);e.rotation.x=s*.2;hp.add(e)}eyes(hp,.12,.04,.08,.025);
    const tl=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),M(0xffffff));tl.position.set(-.3,.28,0);g.add(tl);g.userData.head=hp;return g}
  function penguin(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),M(0x1c1c22));b.scale.y=1.5;b.position.y=.45;g.add(b);const bl=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),M(0xffffff));bl.scale.set(.6,1.4,1);bl.position.set(.14,.42,0);g.add(bl);
    const hp=new THREE.Group();hp.position.set(0,.88,0);g.add(hp);hp.add(new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),M(0x1c1c22)));const bk=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,6),M(0xff9800));bk.rotation.z=-Math.PI/2;bk.position.set(.22,0,0);hp.add(bk);eyes(hp,.15,.05,.08,.025);
    for(const s of[-1,1]){const ft=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,.08),M(0xff9800));ft.position.set(.06,.02,s*.1);g.add(ft)}g.userData.head=hp;return g}
  function croc(){const g=new THREE.Group(),m=M(0x4e7d32,{flat:true});const b=new THREE.Mesh(new THREE.BoxGeometry(1.6,.35,.6),m);b.position.y=.3;b.castShadow=true;g.add(b);
    const tl=new THREE.Mesh(new THREE.ConeGeometry(.3,1.4,4),m);tl.rotation.z=Math.PI/2;tl.position.set(-1.45,.28,0);tl.scale.z=.6;g.add(tl);for(let k=0;k<7;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.06,.14,4),M(0x33691e));c.position.set(.6-k*.3,.52,0);g.add(c)}
    for(const[x,z]of[[.5,.32],[.5,-.32],[-.5,.32],[-.5,-.32]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.14,.25,.14),m);l.position.set(x,.12,z);g.add(l)}
    const hp=new THREE.Group();hp.position.set(.8,.3,0);g.add(hp);const low=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,.4),m);low.position.set(.45,-.08,0);hp.add(low);const jaw=new THREE.Group();hp.add(jaw);const up=new THREE.Mesh(new THREE.BoxGeometry(.95,.15,.42),m);up.position.set(.47,.06,0);jaw.add(up);
    for(let k=0;k<6;k++)for(const s of[-1,1]){const t=new THREE.Mesh(new THREE.ConeGeometry(.025,.08,4),M(0xffffff));t.rotation.x=Math.PI;t.position.set(.15+k*.14,-.03,s*.18);jaw.add(t)}
    for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),M(0xfff59d));e.position.set(.1,.17,s*.14);jaw.add(e);const pu=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),M(0x111111));pu.position.set(.15,.18,s*.15);jaw.add(pu)}
    g.userData.head=hp;g.userData.jaw=jaw;return g}
  function zooFence(L){const g=new THREE.Group(),m=M(0x8d6e63,{flat:true});for(let x=0;x<=L;x+=1){const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1,6),m);p.position.set(x,.5,0);g.add(p)}for(const y of[.35,.8]){const r=new THREE.Mesh(new THREE.BoxGeometry(L,.06,.06),m);r.position.set(L/2,y,0);g.add(r)}return g}
  const ZOO=[elephant,giraffe,zebra,lion,monkey,rabbit,penguin,sheep2,()=>quad(0xc8a27a,0xb48a60,0x6b4a2f)];
  /* พระพุทธรูปปางสมาธิสีทองในซุ้ม มีธูปเทียน พวงมาลัย ก่อนผ่านด่านสุดท้ายให้ไหว้พระขอพร */
  function buddha(){const g=new THREE.Group(),gold=M(0xffc93c,{metalness:.65,roughness:.28}),white=M(0xfaf6ee,{flat:true});
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.25,.7,16),white);ped.position.y=.35;ped.castShadow=true;g.add(ped);
    for(let k=0;k<14;k++){const a=k/14*Math.PI*2,pt=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),gold);pt.scale.set(.6,1,.35);pt.position.set(Math.cos(a)*.95,.85,Math.sin(a)*.95);pt.rotation.y=-a;g.add(pt)}
    const lap=new THREE.Mesh(new THREE.SphereGeometry(.7,16,10),gold);lap.scale.set(1,.38,.72);lap.position.y=1.05;lap.castShadow=true;g.add(lap);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.34,.52,1.05,16),gold);body.position.y=1.65;body.castShadow=true;g.add(body);
    for(const s of[-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.55,4,8),gold);arm.position.set(s*.45,1.55,.1);arm.rotation.set(.5,0,s*.25);g.add(arm)}
    const hands=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),gold);hands.scale.set(1.4,.5,1);hands.position.set(0,1.2,.38);g.add(hands);
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.18,10),gold);nk.position.y=2.22;g.add(nk);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),gold);hd.scale.y=1.12;hd.position.y=2.52;hd.castShadow=true;g.add(hd);
    for(const s of[-1,1]){const ea=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.28,4,6),gold);ea.position.set(s*.3,2.45,0);g.add(ea)}
    const us=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),gold);us.position.y=2.85;g.add(us);const fl=new THREE.Mesh(new THREE.ConeGeometry(.08,.35,8),gold);fl.position.y=3.1;g.add(fl);
    const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0xffe082,transparent:true,opacity:.75,depthWrite:false}));aura.scale.setScalar(3.6);aura.position.set(0,2.2,-.4);g.add(aura);g.userData.aura=aura;
    const red=M(0xb71c1c,{flat:true});for(const x of[-2,2])for(const z of[-1.1,.9]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,3.4,8),red);p.position.set(x,1.7,z);p.castShadow=true;g.add(p)}
    const rf=gable(5,1.7,2.6,0xc62828);rf.position.set(0,3.4,-.1);g.add(rf);const rg=gable(5.3,1.6,2.7,0x1b5e20);rg.position.set(0,3.32,-.1);g.add(rg);
    for(const x of[-.75,.75]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.45,8),M(0xfff8e1));c.position.set(x,.92,1.05);g.add(c);const f=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0xffb300,transparent:true,depthWrite:false}));f.scale.setScalar(.28);f.position.set(x,1.2,1.05);g.add(f)}
    const gar=new THREE.Group();for(let k=0;k<16;k++){const a=k/16*Math.PI*2,fb=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),M(k%2?0xffffff:0xffc107));fb.position.set(Math.cos(a)*.3,Math.sin(a)*.3,0);gar.add(fb)}gar.position.set(0,.72,1.12);g.add(gar);
    const smoke=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0xe0e0e0,transparent:true,opacity:.5,depthWrite:false}));smoke.scale.setScalar(.6);smoke.position.set(0,1.2,1.1);g.add(smoke);g.userData.smoke=smoke;
    return g}
  /* เส้นชัยแบบงานวิ่ง: เสาลายแดงขาว ป้าย FINISH ลายตารางหมากรุก เทปเส้นชัยขาดเมื่อวิ่งผ่าน แถบตารางบนพื้น */
  const checkC=(w,h,sz)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");for(let i=0;i<w/sz;i++)for(let j=0;j<h/sz;j++){x.fillStyle=(i+j)%2?"#111":"#fff";x.fillRect(i*sz,j*sz,sz,sz)}return {c,x}};
  function finishGate(st){const g=new THREE.Group(),poleT=canvasTex(16,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?"#ffffff":"#e53935";x.fillRect(0,i*8,w,8)}},1,3);
    for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,3.8,12),new THREE.MeshStandardMaterial({map:poleT}));p.position.set(0,1.9,s*1.8);p.castShadow=true;g.add(p);
      const fl=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,8),M(0xffd600));fl.position.set(0,3.95,s*1.8);g.add(fl)}
    const {c,x}=checkC(512,176,22);x.fillStyle="#ffffff";x.fillRect(0,44,512,88);x.fillStyle="#111";x.textAlign="center";x.textBaseline="middle";x.font='900 62px "Noto Sans Thai",sans-serif';x.fillText(`FINISH · STAGE ${st}`,256,90);
    const bt=new THREE.CanvasTexture(c);bt.colorSpace=THREE.SRGBColorSpace;const ban=new THREE.Sprite(new THREE.SpriteMaterial({map:bt}));ban.scale.set(4.2,1.45,1);ban.position.y=4.2;g.add(ban);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.12,.5,3.7),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(checkC(256,32,16).c)}));bar.position.y=3.6;g.add(bar);
    const tape=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,3.6),M(0xe53935,{emissive:0x550000}));tape.position.y=1.15;g.add(tape);g.userData.tape=tape;
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(.6,2.4),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(checkC(64,256,16).c)}));gl.rotation.x=-Math.PI/2;gl.position.y=.08;g.add(gl);
    return g}
  /* ตอบผิดแล้วมีตัวมาแกล้ง: จระเข้/สิงโตงับ (สวนสัตว์) ทากเกาะ (น้ำตก) ไก่รุมจิก (หมู่บ้าน) ปูหนีบ (ทะเล) */
  function leech(){const g=new THREE.Group(),m=M(0x2f2a14,{roughness:.15,metalness:.2}),st=M(0x6b5a1a,{roughness:.3});const segs=[];
    for(let k=0;k<9;k++){const r=.055*Math.sin(Math.PI*(k+.5)/9)+.03,sg=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),k%2?st:m);sg.scale.set(1,1,1.3);g.add(sg);segs.push(sg)}
    const mouth=new THREE.Mesh(new THREE.CircleGeometry(.03,8),M(0x8b0000));g.add(mouth);g.userData.segs=segs;g.userData.mouth=mouth;return g}
  /* ===== ด่านสุดท้าย: โบสถ์ พระสงฆ์ สามเณร ชาวบ้านใส่บาตร ===== */
  const robeM=M(0xe8862a,{flat:true}),robeD=M(0xc96a12,{flat:true});
  function monk(s=1){const g=person({shirt:0xe8862a,pants:0xe8862a,bald:true});const robe=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,.95,12),robeM);robe.position.y=.5;robe.castShadow=true;g.add(robe);
    const sash=new THREE.Mesh(new THREE.BoxGeometry(.42,.1,.5),robeD);sash.position.y=1.18;sash.rotation.x=.7;g.add(sash);
    const bowl=new THREE.Mesh(new THREE.SphereGeometry(.16,14,8,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:.45,roughness:.3,side:THREE.DoubleSide}));bowl.position.set(.34,1.02,0);g.add(bowl);
    for(const a of g.userData.arms)a.rotation.z=.95;g.scale.setScalar(s);return g}
  function almsTable(){const g=new THREE.Group(),t=new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.5),woodM);t.position.y=.55;g.add(t);for(const[x,z]of[[.4,.2],[.4,-.2],[-.4,.2],[-.4,-.2]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.05,.55,.05),woodM);l.position.set(x,.27,z);g.add(l)}
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.2,14),M(0xc0c0c0,{metalness:.8,roughness:.25}));pot.position.set(-.2,.68,0);g.add(pot);const rice=new THREE.Mesh(new THREE.SphereGeometry(.15,10,6,0,Math.PI*2,0,Math.PI/2),M(0xffffff));rice.position.set(-.2,.76,0);rice.scale.y=.5;g.add(rice);
    for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(.14,.08,.1),M(pick([0xff7043,0x66bb6a,0xffca28,0xec407a])));b.position.set(.15+k*.07,.62+k*.02,rand(-.1,.1));g.add(b)}return g}
  /* พระกวาดลานวัด: ถือไม้กวาดทางมะพร้าว กวาดใบไม้เป็นกอง */
  function sweepScene(g){for(let k=0;k<2;k++){const m=monk(k?.8:1);m.children.forEach(c=>{if(c.geometry&&c.geometry.type==="SphereGeometry"&&c.position.x>.3&&c.position.y>.9)c.visible=false});
      const br=new THREE.Group(),st=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,6),M(0x8d6e63));st.position.y=.75;br.add(st);for(let j=0;j<14;j++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.006,.012,.45,3),M(0xc9a26a));b.position.set(rand(-.06,.06),-.15,rand(-.12,.12));b.rotation.x=rand(-.5,.5);br.add(b)}
      br.position.set(.05,-1.25,.1);br.rotation.set(0,0,.25);m.userData.arms[1].add(br);m.userData.arms[1].rotation.z=.55;m.userData.arms[0].rotation.z=.75;m.position.set(2.5+k*4,0,-3.4-k*.8);m.rotation.y=rand(-.6,.6);g.add(m);anim.push({seg:g,obj:m,kind:"sweep",ph:k*2,br,ry:m.rotation.y})
      const pile=new THREE.Group();for(let j=0;j<18;j++){const l=new THREE.Mesh(new THREE.CircleGeometry(.07,5),M(pick([0xc68a2e,0xa1662f,0xd9a441,0x8d5a2b]),{side:THREE.DoubleSide}));l.rotation.x=-Math.PI/2+rand(-.3,.3);l.rotation.z=rand(0,6);l.position.set(rand(-.35,.35),.02+j*.004,rand(-.25,.25));pile.add(l)}pile.position.set(3.4+k*4,0,-3.1-k*.8);g.add(pile)}
    for(let j=0;j<25;j++){const l=new THREE.Mesh(new THREE.CircleGeometry(.06,5),M(pick([0xc68a2e,0xa1662f,0xd9a441]),{side:THREE.DoubleSide}));l.rotation.x=-Math.PI/2;l.rotation.z=rand(0,6);l.position.set(rand(0,SEG),.02,-rand(2,6));g.add(l)}}
  function almsScene(g){for(let k=0;k<3;k++){const m=monk(k===2?.78:1);m.position.set(2.2+k*1.5,0,-3.6);m.rotation.y=-Math.PI/2;g.add(m);anim.push({seg:g,obj:m,kind:"monk",ph:rand(0,6)})}
    for(let k=0;k<2;k++){const v=person({basket:true,long:Math.random()<.6,skirt:pick([0x8e24aa,0x1565c0,0x6d4c41]),shirt:pick([0xffffff,0xfff3e0,0xe3f2fd])});v.position.set(2.6+k*2.1,0,-2.45);v.rotation.y=Math.PI/2;v.scale.setScalar(.95);g.add(v);anim.push({seg:g,obj:v,kind:"offer",ph:k*1.3})}
    const t=almsTable();t.position.set(7.8,0,-2.6);g.add(t)}
  function ubosot(){const g=new THREE.Group(),white=M(0xfdfaf2,{flat:true}),red=M(0x8e1b1b,{flat:true});
    const base=new THREE.Mesh(new THREE.BoxGeometry(5.6,.8,8.6),white);base.position.y=.4;base.castShadow=true;g.add(base);
    for(let k=0;k<4;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(2.2,.2,.35),white);st.position.set(0,.1+k*.2,4.8-k*.35);g.add(st)}
    const wall=new THREE.Mesh(new THREE.BoxGeometry(4.4,2.8,7.4),white);wall.position.y=2.2;wall.castShadow=true;g.add(wall);
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.2,2,.06),red);door.position.set(0,1.8,3.72);g.add(door);const df=new THREE.Mesh(new THREE.BoxGeometry(1.45,2.25,.04),goldM);df.position.set(0,1.85,3.7);g.add(df);
    for(const x of[-1.5,1.5]){const w=new THREE.Mesh(new THREE.BoxGeometry(.6,1.1,.06),red);w.position.set(x,2.3,3.72);g.add(w);const fr=new THREE.Mesh(new THREE.BoxGeometry(.75,1.25,.04),goldM);fr.position.set(x,2.3,3.7);g.add(fr)}
    for(const z of[-2.4,-.8,.8,2.4])for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(.06,1.1,.6),red);w.position.set(s*2.22,2.3,z);g.add(w)}
    for(const x of[-2.1,-.7,.7,2.1]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,2.9,10),white);c.position.set(x,2.25,4.1);c.castShadow=true;g.add(c);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.24,.16,.25,10),goldM);cap.position.set(x,3.75,4.1);g.add(cap)}
    const y0=3.6,r0=gable(6.2,2.3,7.6,0x1b5e20);r0.position.y=y0;g.add(r0);const r1=gable(5.7,2.5,7.9,0xc62828);r1.position.y=y0+.2;g.add(r1);
    const r2=gable(4.6,3.1,8.4,0xd84315);r2.position.set(0,y0+.6,.25);g.add(r2);const r3=gable(4.3,3.2,8.5,0xc62828);r3.position.set(0,y0+.7,.25);g.add(r3);
    const pn=new THREE.Shape();pn.moveTo(-1.95,0);pn.lineTo(0,2.85);pn.lineTo(1.95,0);pn.lineTo(-1.95,0);const pnl=new THREE.Mesh(new THREE.ShapeGeometry(pn),goldM);pnl.position.set(0,y0+.72,4.52);g.add(pnl);
    for(const z of[-4,4.5]){const cf=new THREE.Mesh(new THREE.TorusGeometry(.35,.08,6,12,Math.PI*1.2),goldM);cf.position.set(0,y0+4.05,z);cf.rotation.z=-.4;g.add(cf);
      for(let k=1;k<9;k++)for(const s of[-1,1]){const t=k/9,br=new THREE.Mesh(new THREE.ConeGeometry(.07,.3,4),goldM);br.position.set(s*2.15*(1-t),y0+.7+3.2*t+.14,z);br.rotation.z=-s*.6;g.add(br)}}
    for(const[x,z]of[[-3.3,-4.8],[3.3,-4.8],[-3.3,5.3],[3.3,5.3],[0,-5.3],[0,5.9],[-3.6,0],[3.6,0]]){const sm=new THREE.Mesh(new THREE.ConeGeometry(.22,.7,4),white);sm.position.set(x,.35,z);sm.scale.z=.35;g.add(sm);const sb=new THREE.Mesh(new THREE.BoxGeometry(.5,.15,.5),white);sb.position.set(x,.07,z);g.add(sb)}
    return g}
  /* พุ่มดอกไม้: พุ่มกลมเรียบสีเขียว มีดอก 5 กลีบสีเดียวกันประดับด้านบนชัด ๆ (ใช้ InstancedMesh ให้ลื่น) */
  const BUSHC=[0xff4f8b,0xe53935,0xffffff,0xffd23f,0xab47bc,0xff8a3d,0x7dd3fc];
  const bushBlob=new THREE.SphereGeometry(1,18,14),petalB=new THREE.SphereGeometry(1,10,6),centerB=new THREE.SphereGeometry(1,8,6);
  function flowerBush(){const g=new THREE.Group(),c1=pick(BUSHC),s=rand(.9,1.3),blobs=[],gm=M(pick([0x3f8f3a,0x469c3e,0x3a8a45]),{roughness:.85});
    for(const[x,y,z,r]of[[0,.5,0,.62],[-.5,.36,.1,.45],[.5,.38,-.05,.48],[.05,.42,.32,.4]]){const R=r*s*rand(.92,1.08),b=new THREE.Mesh(bushBlob,gm);b.scale.set(R,R*.85,R);b.position.set(x*s,y*s,z*s);b.castShadow=true;g.add(b);blobs.push([b.position.clone(),R])}
    const up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),qa=new THREE.Quaternion(),pts=[];
    for(let t=0;t<200&&pts.length<14;t++){const[bp,r]=pick(blobs),d=new THREE.Vector3(rand(-1,1),rand(.05,1),rand(-.6,1)).normalize(),p=new THREE.Vector3(bp.x+d.x*r*1.02,bp.y+d.y*r*.87,bp.z+d.z*r*1.02);
      if(blobs.some(([o,R])=>o!==bp&&p.distanceTo(o)<R*.95))continue;if(pts.some(([o])=>o.distanceTo(p)<.24*s))continue;pts.push([p,d])}
    const np=pts.length*5,pet=new THREE.InstancedMesh(petalB,M(c1,{roughness:.55}),np),cen=new THREE.InstancedMesh(centerB,M(0xffc400,{roughness:.5}),pts.length);let i=0;
    pts.forEach(([p,d],f)=>{q.setFromUnitVectors(up,d);const sz=rand(.09,.12)*s;
      for(let k=0;k<5;k++){const a=k/5*Math.PI*2+f,off=new THREE.Vector3(Math.cos(a)*sz*.75,0,Math.sin(a)*sz*.75).applyQuaternion(q);qa.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(up,-a));
        m4.compose(p.clone().add(off),qa,new THREE.Vector3(sz*.62,sz*.16,sz*.4));pet.setMatrixAt(i++,m4)}
      m4.compose(p.clone().addScaledVector(d,sz*.12),q,new THREE.Vector3(sz*.32,sz*.2,sz*.32));cen.setMatrixAt(f,m4)});
    g.add(pet);g.add(cen);return g}
  /* ===== ชาวบ้านทำงาน: ทำไร่ (จอบ) ปักดำนา รดน้ำแปลงผัก หาบน้ำใส่ตุ่ม กวาดบ้าน นั่งซักผ้าข้างโอ่ง ===== */
  const tool=(len,head,hc)=>{const g=new THREE.Group(),st=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,len,6),M(0x8d6e63));st.position.y=-len/2;g.add(st);if(head){head.position.y=-len;g.add(head)}return g};
  function farmer(o={}){return person({hat:true,shirt:pick([0x5c6bc0,0x6d4c41,0x2e7d32,0x795548]),pants:pick([0x212121,0x3e2723]),...o})}
  function hoeWorker(g,x,z){const p=farmer();p.position.set(x,0,z);p.rotation.y=rand(-.4,.4);const blade=new THREE.Mesh(new THREE.BoxGeometry(.22,.04,.16),M(0x9e9e9e,{metalness:.6}));const h=tool(1.3,blade);h.position.set(.05,-.5,0);p.userData.arms[1].add(h);g.add(p);anim.push({seg:g,obj:p,kind:"hoe",ph:rand(0,6)});
    for(let r=0;r<4;r++){const row=new THREE.Mesh(new THREE.BoxGeometry(3,.12,.3),M(0x6d4c2f,{flat:true}));row.position.set(x+1.6,.06,z-.6+r*.45);g.add(row)}}
  function paddy(g,x,z){const w=new THREE.Mesh(new THREE.PlaneGeometry(4.5,3),M(0x7fb3a6,{roughness:.2,metalness:.1}));w.rotation.x=-Math.PI/2;w.position.set(x,.04,z);g.add(w);
    const dyke=M(0x8a7a5a,{flat:true});for(const[dx,dz,sx,sz]of[[0,1.55,4.7,.2],[0,-1.55,4.7,.2],[2.35,0,.2,3.1],[-2.35,0,.2,3.1]]){const d=new THREE.Mesh(new THREE.BoxGeometry(sx,.15,sz),dyke);d.position.set(x+dx,.07,z+dz);g.add(d)}
    for(let i=0;i<7;i++)for(let j=0;j<5;j++){if(Math.random()<.15)continue;const t=new THREE.Group();for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.ConeGeometry(.02,.4,3),M(0x7cb342));b.position.y=.2;b.rotation.set(rand(-.3,.3),0,rand(-.3,.3));t.add(b)}t.position.set(x-2+i*.6,.04,z-1.1+j*.55);g.add(t)}
    for(let k=0;k<2;k++){const p=farmer({skirt:k?0x1565c0:null,long:!!k});p.position.set(x-1+k*1.6,0,z+rand(-.6,.6));p.rotation.y=Math.PI/2+rand(-.4,.4);g.add(p);anim.push({seg:g,obj:p,kind:"plant",ph:k*1.7})}}
  function vegPlot(g,x,z){for(let r=0;r<3;r++){const row=new THREE.Mesh(new THREE.BoxGeometry(2.6,.14,.4),M(0x5d4037,{flat:true}));row.position.set(x,.07,z+r*.6);g.add(row);
      for(let i=0;i<6;i++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),M(pick([0x7cb342,0x9ccc65,0x558b2f]),{flat:true}));c.scale.y=.8;c.position.set(x-1.1+i*.44,.22,z+r*.6);g.add(c)}}
    const p=farmer({hat:false,long:true,skirt:0x8e24aa});p.position.set(x+1.7,0,z+.6);p.rotation.y=Math.PI;const can=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.2,10),M(0x43a047,{metalness:.3}));const sp=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.3,5),M(0x43a047));sp.rotation.z=1.2;sp.position.set(.15,.05,0);can.add(sp);can.position.y=-.62;p.userData.arms[1].add(can);g.add(p);anim.push({seg:g,obj:p,kind:"water",ph:rand(0,6)})}
  function waterCarrier(g,x,z){const p=farmer({hat:false});const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.6,6),M(0xc49a6c));pole.rotation.x=Math.PI/2;pole.position.y=1.48;p.add(pole);
    for(const s of[-1,1]){const rope=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.5,4),M(0x5d4037));rope.position.set(0,1.23,s*.75);p.add(rope);const b=new THREE.Mesh(new THREE.CylinderGeometry(.15,.12,.25,10),M(0x90a4ae,{metalness:.5}));b.position.set(0,.9,s*.75);p.add(b)}
    for(const a of p.userData.arms)a.rotation.x=a.position.z>0?-2.6:2.6;
    p.position.set(x,0,z);g.add(p);const j1=jar();j1.position.set(x+2.6,0,z-.4);g.add(j1);const j2=jar();j2.position.set(x+3.2,0,z-.2);j2.scale.setScalar(.85);g.add(j2);
    const well=new THREE.Mesh(new THREE.CylinderGeometry(.5,.55,.6,14),M(0x9e9e9e,{flat:true}));well.position.set(x-1.6,.3,z-.3);g.add(well);
    anim.push({seg:g,obj:p,kind:"walker",x0:x+.6,ph:rand(0,6),sp:.35,rg:1.6})}
  function houseSweeper(g,x,z){const p=farmer({hat:false,long:true,skirt:0x6d4c41,shirt:0xffffff});const br=tool(1.1,null);for(let j=0;j<14;j++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.006,.012,.4,3),M(0xc9a26a));b.position.set(rand(-.05,.05),-1.25,rand(-.12,.12));b.rotation.x=rand(-.4,.4);br.add(b)}
    br.position.set(.1,-.45,0);br.rotation.z=-.6;p.userData.arms[1].add(br);p.position.set(x,0,z);g.add(p);anim.push({seg:g,obj:p,kind:"broom",ph:rand(0,6),br});
    for(let j=0;j<10;j++){const d=new THREE.Mesh(new THREE.CircleGeometry(.05,5),M(0xa1887f,{side:THREE.DoubleSide}));d.rotation.x=-Math.PI/2;d.position.set(x+rand(.3,1.3),.02,z+rand(-.4,.4));g.add(d)}}
  function washer(g,x,z){const p=farmer({hat:false,long:true,skirt:pick([0x1565c0,0x8e24aa]),shirt:pick([0xffffff,0xffcc80])});for(const l of p.userData.legs)l.rotation.z=-1.45;p.position.set(x,-.55,z);p.rotation.y=-Math.PI/2+.3;
    for(const a of p.userData.arms)a.rotation.z=1.1;g.add(p);const basin=new THREE.Mesh(new THREE.CylinderGeometry(.42,.32,.22,16,1,true),new THREE.MeshStandardMaterial({color:0xb0bec5,metalness:.6,side:THREE.DoubleSide}));basin.position.set(x+.7,.11,z+.25);g.add(basin);
    const wtr=new THREE.Mesh(new THREE.CircleGeometry(.38,16),M(0xd6eef8));wtr.rotation.x=-Math.PI/2;wtr.position.set(x+.7,.17,z+.25);g.add(wtr);for(let k=0;k<4;k++){const f=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),M(0xffffff));f.position.set(x+.7+rand(-.2,.2),.2,z+.25+rand(-.2,.2));g.add(f)}
    const j=jar();j.position.set(x+.1,0,z-.75);g.add(j);const line=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,3,4),M(0x5d4037));line.rotation.z=Math.PI/2;line.position.set(x+1.2,1.7,z-1.4);g.add(line);
    for(const px of[-.3,2.7]){const po=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.75,6),M(0x8d6e63));po.position.set(x+px,.87,z-1.4);g.add(po)}
    for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.PlaneGeometry(.4,.5),new THREE.MeshStandardMaterial({color:pick([0xe53935,0x1e88e5,0xffeb3b,0xffffff,0x43a047]),side:THREE.DoubleSide}));c.position.set(x+k*.65,1.43,z-1.4);g.add(c);anim.push({seg:g,obj:c,kind:"cloth",ph:k})}
    anim.push({seg:g,obj:p,kind:"scrub",ph:rand(0,6)})}
  /* ตลาด: แม่ค้าโยนผักผลไม้ใส่ ติดตามตัวจนกว่าจะตอบถูก */
  const VEGTHROW=[()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),M(0xe53935,{roughness:.4}));return m},()=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.16,1),M(0x7cb342,{flat:true}));return m},
    ()=>{const m=new THREE.Mesh(new THREE.ConeGeometry(.07,.4,8),M(0xff7043));m.rotation.z=Math.PI/2;return m},()=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.3,4,8),M(0xffeb3b));m.rotation.z=1;return m},
    ()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),M(0x6a1b9a,{roughness:.3}));m.scale.set(1,1,1.8);return m},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),M(0xff9800));return m}];
  /* ผักใบ: กะหล่ำปลี ผักกาดกวางตุ้ง ผักบุ้งมัดกำ ต้นหอม (ใบแบนสองหน้า เห็นเป็นใบ ๆ ตอนลอยมา) */
  const leafM=c=>M(c,{roughness:.7,side:THREE.DoubleSide}),leafG=new THREE.SphereGeometry(1,10,8);
  const leaf=(c,w,l,t=.12)=>{const m=new THREE.Mesh(leafG,leafM(c));m.scale.set(w,t*w,l);return m};
  const VEGLEAF=[
    ()=>{const g=new THREE.Group(),core=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),M(0xc5e1a5,{roughness:.6}));g.add(core);
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2,lf=leaf(k%2?0x8bc34a:0x9ccc65,.12,.15,.25);lf.position.set(Math.cos(a)*.1,rand(-.04,.04),Math.sin(a)*.1);lf.lookAt(Math.cos(a)*.4,.05,Math.sin(a)*.4);lf.rotateX(-.5);g.add(lf)}return g},
    ()=>{const g=new THREE.Group();for(let k=0;k<5;k++){const a=k/5*Math.PI*2+rand(-.2,.2),b=new THREE.Group();b.rotation.set(Math.sin(a)*.3,0,-Math.cos(a)*.3);
      const st=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,.2,6),M(0xf1f8e9));st.position.y=.1;b.add(st);const lf=leaf(0x2e7d32,.09,.16,.1);lf.rotation.x=Math.PI/2;lf.position.y=.32;b.add(lf);g.add(b)}return g},
    ()=>{const g=new THREE.Group(),sm=M(0x7cb342);for(let k=0;k<9;k++){const st=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.55,5),sm);st.position.set(rand(-.04,.04),0,rand(-.04,.04));st.rotation.set(rand(-.15,.15),0,rand(-.15,.15));g.add(st);
      for(let j=0;j<2;j++){const lf=leaf(0x43a047,.035,.08,.15);lf.position.set(st.position.x+rand(-.05,.05),rand(.05,.28),st.position.z+rand(-.05,.05));lf.rotation.set(rand(-1,1),rand(0,6),rand(-1,1));g.add(lf)}}
      const tie=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,6,14),M(0xd32f2f));tie.rotation.x=Math.PI/2;tie.position.y=-.1;g.add(tie);g.rotation.z=1.1;return g},
    ()=>{const g=new THREE.Group();for(let k=0;k<5;k++){const x=rand(-.04,.04),z=rand(-.04,.04),bl=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),M(0xfafafa));bl.position.set(x,-.2,z);g.add(bl);
      const tb=new THREE.Mesh(new THREE.CylinderGeometry(.012,.02,.45,6),M(0x66bb6a));tb.position.set(x,.03,z);tb.rotation.z=rand(-.15,.15);g.add(tb)}g.rotation.z=1;return g}];
  /* ของในร้านตลาดให้ตรงกับชื่อร้าน */
  function goods(nm,cx,y,z){const g=new THREE.Group();g.position.set(cx,y,z);const add=(m,x,yy,zz)=>{m.position.set(x,yy,zz);m.castShadow=true;g.add(m)};
    if(nm==="ผลไม้"){for(let k=0;k<5;k++)add(new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),M(pick([0xe53935,0xff9800,0x7cb342]),{roughness:.4})),rand(-.22,.22),.1,rand(-.18,.18));
      const bn=new THREE.Group();for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.22,4,6),M(0xffeb3b));b.rotation.z=.9;b.position.set(k*.06-.09,0,0);bn.add(b)}add(bn,.05,.25,0);
      const pa=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),M(0xd4a017,{flat:true}));pa.scale.y=1.4;add(pa,-.2,.3,.1);const cr=new THREE.Mesh(new THREE.ConeGeometry(.08,.18,6),M(0x2e7d32));add(cr,-.2,.48,.1)}
    else if(nm==="ผักสด"){for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,1),M(pick([0x9ccc65,0x7cb342]),{flat:true}));add(c,rand(-.2,.2),.1,rand(-.15,.15))}
      for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.ConeGeometry(.035,.25,8),M(0xff7043));c.rotation.z=Math.PI/2;add(c,rand(-.15,.15),.22,rand(-.15,.15))}
      for(let k=0;k<5;k++){const c=new THREE.Mesh(new THREE.CapsuleGeometry(.015,.09,3,5),M(0xd32f2f));c.rotation.z=1.4;add(c,rand(-.2,.2),.27,rand(-.15,.15))}}
    else if(nm==="ปลาสด"){for(let k=0;k<4;k++){const f=fish();f.scale.setScalar(.75);f.rotation.y=rand(-.3,.3);add(f,rand(-.15,.15),.1+k*.03,(k-1.5)*.12)}const ice=new THREE.Mesh(new THREE.BoxGeometry(.6,.05,.55),M(0xe3f2fd,{roughness:.2}));add(ice,0,.04,0)}
    else if(nm==="เนื้อสด"){for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.BoxGeometry(.22,.06,.15),M(0xc62828,{roughness:.5}));add(s,(k-1)*.17,.06,rand(-.1,.1));const f=new THREE.Mesh(new THREE.BoxGeometry(.22,.02,.03),M(0xfff3e0));add(f,(k-1)*.17,.1,.06)}
      for(let k=0;k<3;k++){const d=new THREE.Group(),m=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),M(0xd88b5a));m.scale.y=1.5;d.add(m);const b=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.12,5),M(0xfff8e1));b.position.y=.13;d.add(b);add(d,(k-1)*.15,.18,-.15)}}
    else if(nm==="ขนมไทย"){for(let k=0;k<8;k++){const c=new THREE.Mesh(k%2?new THREE.BoxGeometry(.08,.05,.08):new THREE.CylinderGeometry(.045,.045,.05,10),M(pick([0xf48fb1,0x81c784,0xfff59d,0xce93d8,0xffffff])));add(c,rand(-.22,.22),.05+(k>4?.05:0),rand(-.18,.18))}}
    else if(nm==="ดอกไม้"){for(let k=0;k<5;k++){const f=flower();f.scale.setScalar(.6);add(f,rand(-.2,.2),.02,rand(-.15,.15))}}
    return g}
  /* ===== ผีไทยและบ้านร้างแบบไทย ===== */
  /* ผีกระสือ: หัวผู้หญิงผมยาวลอยได้ มีไส้และอวัยวะห้อยเรืองแสงสีเขียว */
  /* ผีผู้หญิงชุดขาว ผมยาวดำปิดหน้า ยื่นมือ ลอยตัว ชายชุดจางหาย */
  function ladyGhost(){const g=new THREE.Group(),white=new THREE.MeshStandardMaterial({color:0xf5f5f0,emissive:0xdfe8ee,emissiveIntensity:.35,roughness:.8,transparent:true,opacity:.95,side:THREE.DoubleSide}),
      skin=M(0xe8e4dc,{emissive:0x9aa4ac,emissiveIntensity:.25}),hair=M(0x060606,{roughness:.9,side:THREE.DoubleSide});
    const prof=[];for(let k=0;k<=12;k++){const t=k/12;prof.push(new THREE.Vector2(.2+t*t*.38+Math.sin(t*9)*.015,1.5-t*1.45))}
    const dress=new THREE.Mesh(new THREE.LatheGeometry(prof,18),white);g.add(dress);
    const hem=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.58,.06),new THREE.Vector2(.66,-.12)],18),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xdfe8ee,emissiveIntensity:.3,transparent:true,opacity:.35,side:THREE.DoubleSide}));g.add(hem);
    const chest=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),white);chest.scale.set(1,1.1,.75);chest.position.y=1.45;g.add(chest);
    for(const s2 of[-1,1]){const a=new THREE.Group();a.position.set(s2*.2,1.5,0);a.rotation.x=-1.25;a.rotation.z=s2*.12;const sl=new THREE.Mesh(new THREE.CylinderGeometry(.065,.1,.6,8),white);sl.position.y=-.3;a.add(sl);
      const hd=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),skin);hd.scale.set(.8,1.4,.5);hd.position.y=-.66;a.add(hd);for(let f=0;f<3;f++){const fn=new THREE.Mesh(new THREE.CylinderGeometry(.012,.008,.14,4),skin);fn.position.set((f-1)*.03,-.78,0);a.add(fn)}g.add(a)}
    const head=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),skin);head.scale.y=1.15;head.position.y=1.86;g.add(head);
    for(const s2 of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),new THREE.MeshBasicMaterial({color:0x000000}));e.scale.set(1.2,.7,.5);e.position.set(s2*.075,1.9,.18);g.add(e);const gl=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),new THREE.MeshBasicMaterial({color:0xff2a2a}));gl.position.set(s2*.075,1.9,.2);g.add(gl)}
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.225,16,10,0,Math.PI*2,0,Math.PI*.55),hair);cap.position.y=1.9;g.add(cap);
    const back=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,1.1,14,1,true,Math.PI*.2,Math.PI*1.6),hair);back.position.set(0,1.38,-.02);g.add(back);
    for(let k=0;k<9;k++){const x=-.17+k*.0425;if(Math.abs(x)<.09)continue;const st=new THREE.Mesh(new THREE.BoxGeometry(.045,rand(.75,1.05),.02),hair);st.position.set(x,1.55-rand(0,.08),.2+Math.cos(x*6)*.02);st.rotation.z=rand(-.05,.05);g.add(st)}
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0xd8f0ff,transparent:true,opacity:.5,depthWrite:false}));halo.scale.setScalar(2.4);halo.position.y=1.1;g.add(halo);
    g.userData.thai=2;g.userData.halo=halo;return g}
  function krasue(){const g=new THREE.Group(),skin=M(0xf0dcc8,{emissive:0x3a2a20,emissiveIntensity:.25}),hair=M(0x050505);
    const h=new THREE.Mesh(new THREE.SphereGeometry(.42,18,14),skin);h.scale.y=1.12;h.position.y=1.9;g.add(h);
    const hr=new THREE.Mesh(new THREE.SphereGeometry(.45,18,12,0,Math.PI*2,0,Math.PI*.58),hair);hr.position.y=1.95;g.add(hr);
    for(let k=0;k<8;k++){const a=Math.PI*.75+k/7*Math.PI*1.5,st=new THREE.Mesh(new THREE.BoxGeometry(.09,rand(.5,.8),.05),hair);st.position.set(Math.cos(a)*.36,1.62,Math.sin(a)*.3-.04);g.add(st)}
    for(const s2 of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),new THREE.MeshBasicMaterial({color:0xff1744}));e.position.set(s2*.15,1.95,.38);g.add(e)}
    const mo=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.04),new THREE.MeshBasicMaterial({color:0x5a0000}));mo.position.set(0,1.72,.4);g.add(mo);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.05,.18,8),M(0x8b1a1a));neck.position.y=1.48;g.add(neck);
    /* อวัยวะห้อยใต้คอ: หัวใจ ปอด ไส้ขด เรืองแสงกะพริบวิบ ๆ */
    const glows=[],lit=(c)=>{const m=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.2,transparent:true,opacity:.95});glows.push(m);return m};
    const heart=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),lit(0xff3d3d));heart.scale.y=1.3;heart.position.set(.05,1.27,.04);g.add(heart);
    for(const s2 of[-1,1]){const lu=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),lit(0xff7aa0));lu.scale.set(.8,1.5,.7);lu.position.set(s2*.13,1.3,0);g.add(lu)}
    const pts=[];for(let k=0;k<=40;k++){const t=k/40;pts.push(new THREE.Vector3(Math.sin(t*14)*.12*(1-t*.4),1.2-t*1.05,Math.cos(t*11)*.07))}
    const gut=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,.035,6),lit(0x9dff5a));g.add(gut);
    for(let k=0;k<3;k++){const p2=[];const ox=rand(-.12,.12);for(let j=0;j<=12;j++){const t=j/12;p2.push(new THREE.Vector3(ox+Math.sin(t*6+k)*.05,1.22-t*rand(.5,.8),rand(-.04,.04)))}g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2),24,.02,5),lit(0xc6ff7a)))}
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTex,color:0x8dff6a,transparent:true,opacity:.6,depthWrite:false}));halo.scale.setScalar(2.2);halo.position.y=1.1;g.add(halo);
    const light=new THREE.PointLight(0x8dff6a,4,6,1.5);light.position.y=1;g.add(light);
    g.userData.thai=1;g.userData.glows=glows;g.userData.halo=halo;g.userData.light=light;return g}
  /* ผีกระหัง: ชายตัวผอมผิวคล้ำ เอากระด้งสองใบเป็นปีก สากตำข้าวเป็นหาง กระพือบิน */
  function krahang(){const g=new THREE.Group(),skin=M(0x6d4c41,{flat:true}),cloth=M(0x3e2723,{flat:true});
    const b=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.75,10),skin);b.position.y=1.5;g.add(b);
    const pa=new THREE.Mesh(new THREE.CylinderGeometry(.23,.25,.3,10),cloth);pa.position.y=1.05;g.add(pa);
    for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.7,6),skin);l.position.set(s*.1,.6,0);l.rotation.z=s*.2;g.add(l)}
    const h=new THREE.Mesh(new THREE.SphereGeometry(.24,14,10),skin);h.position.y=2.05;g.add(h);
    for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffeb3b}));e.position.set(s*.09,2.08,.21);g.add(e)}
    const mo=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,.03),new THREE.MeshBasicMaterial({color:0x1a0000}));mo.position.set(0,1.95,.23);g.add(mo);
    const weave=canvasTex(64,64,(x,w,h)=>{x.fillStyle="#c9a26a";x.fillRect(0,0,w,h);x.strokeStyle="rgba(110,70,30,.7)";x.lineWidth=2;for(let i=-64;i<128;i+=6){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();x.beginPath();x.moveTo(i,64);x.lineTo(i+64,0);x.stroke()}});
    const wm=new THREE.MeshStandardMaterial({map:weave,side:THREE.DoubleSide,roughness:.9}),wings=[];
    for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.2,1.65,-.05);const d=new THREE.Mesh(new THREE.CircleGeometry(.8,24),wm);d.position.x=s*.8;d.rotation.y=Math.PI/2*0;p.add(d);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.8,.04,6,24),M(0x8d6e63));rim.position.x=s*.8;p.add(rim);g.add(p);wings.push(p)}
    const pestle=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.4,8),M(0x5d4037));pestle.position.set(0,1.05,-.35);pestle.rotation.x=.7;g.add(pestle);
    g.userData.wings=wings;g.userData.thai=2;return g}
  /* เรือนไทยร้าง: ใต้ถุนสูง หลังคาจั่วทรงสูงปั้นลม ไม้ผุ ป้ายปิดหน้าต่าง แสงเขียวเรือง ๆ */
  function thaiHauntedHouse(){const g=new THREE.Group(),wd=M(0x3a2f26,{flat:true}),wd2=M(0x2b221b,{flat:true}),glow=M(0xd4ff6a,{emissive:0xb8ff3a,emissiveIntensity:1.1});
    for(const x of[-2,-.7,.7,2])for(const z of[-1.3,1.3]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,2,6),wd2);p.position.set(x,1,z);p.rotation.z=rand(-.06,.06);p.castShadow=true;g.add(p)}
    const fl=new THREE.Mesh(new THREE.BoxGeometry(4.8,.16,3.2),wd);fl.position.y=2;g.add(fl);const w=new THREE.Mesh(new THREE.BoxGeometry(4.2,2,2.7),wd);w.position.y=3.05;w.castShadow=true;g.add(w);
    const r=gable(5.4,2.8,3.4,0x241a14);r.position.y=4;r.rotation.z=.04;g.add(r);
    for(const s of[-1,1]){const pl=new THREE.Mesh(new THREE.BoxGeometry(.14,3.3,.1),wd2);pl.position.set(s*1.3,5.4,1.75);pl.rotation.z=s*.9;g.add(pl);const tip=new THREE.Mesh(new THREE.ConeGeometry(.08,.4,5),wd2);tip.position.set(s*.25,6.6,1.75);tip.rotation.z=-s*.5;g.add(tip)}
    for(const x of[-1.2,1.2]){const wn=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.05),x>0?glow:M(0x120c08));wn.position.set(x,3.1,1.37);g.add(wn);const bd=new THREE.Mesh(new THREE.BoxGeometry(.9,.1,.05),wd2);bd.position.set(x,3.1,1.4);bd.rotation.z=.6;g.add(bd)}
    for(let k=0;k<7;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(.9,.07,.28),wd);st.position.set(0,.2+k*.27,1.6+1.7-k*.25);st.rotation.z=rand(-.15,.15);g.add(st)}
    const j=jar();j.position.set(1.6,0,1.9);g.add(j);return g}
  /* เถียงนาร้างกลางทุ่ง หลังคามุงจาก */
  function fieldHut(){const g=new THREE.Group(),wd=M(0x4e3b2a,{flat:true});for(const x of[-.8,.8])for(const z of[-.6,.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,1.3,6),wd);p.position.set(x,.65,z);g.add(p)}
    const fl=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1.5),wd);fl.position.y=1.1;g.add(fl);const r=gable(2.6,1.3,2,0x6b5b3a);r.position.y=2.4;r.rotation.z=-.08;g.add(r);
    for(const x of[-.8,.8]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.3,6),wd);p.position.set(x,1.75,0);g.add(p)}
    for(let k=0;k<18;k++){const t=new THREE.Mesh(new THREE.ConeGeometry(.04,rand(.4,.7),3),M(0x5a6b2a));t.position.set(rand(-3,3),.25,rand(-2,2));g.add(t)}return g}
  /* บ้านไม้สองชั้นเก่า ระเบียงชั้นบน ไม้ผุ ประตูเปิดแง้ม */
  function oldTwoStorey(){const g=new THREE.Group(),wd=M(0x4a3d33,{flat:true}),wd2=M(0x33281f,{flat:true}),glow=M(0xffe082,{emissive:0xffb300,emissiveIntensity:.8});
    const b1=new THREE.Mesh(new THREE.BoxGeometry(4,2.2,2.8),wd);b1.position.y=1.1;b1.castShadow=true;g.add(b1);const b2=new THREE.Mesh(new THREE.BoxGeometry(3.8,2,2.6),wd2);b2.position.y=3.2;b2.rotation.z=-.02;b2.castShadow=true;g.add(b2);
    const bal=new THREE.Mesh(new THREE.BoxGeometry(4.2,.12,.8),wd);bal.position.set(0,2.25,1.7);g.add(bal);for(let k=0;k<9;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(.05,.6,.05),wd2);p.position.set(-2+k*.5,2.6,2.05);p.rotation.z=k===4?.6:0;g.add(p)}
    const r=new THREE.Mesh(new THREE.ConeGeometry(3.1,1.4,4),M(0x2a2a2e,{flat:true}));r.rotation.y=Math.PI/4;r.scale.z=.7;r.position.y=4.9;g.add(r);
    const dr=new THREE.Mesh(new THREE.BoxGeometry(.8,1.5,.05),M(0x120c08));dr.position.set(-.6,.75,1.41);dr.rotation.y=.4;g.add(dr);
    for(const x of[-1.1,1.1]){const wn=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,.05),x<0?glow:M(0x0e0a08));wn.position.set(x,3.3,1.31);g.add(wn)}
    const wn1=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,.05),M(0x0e0a08));wn1.position.set(1.1,1.2,1.41);g.add(wn1);return g}
  const groundY=x=>{for(const b of bridges){if(x>b.x0&&x<b.x1&&b.seg.parent===world)return BR_H*Math.sin(Math.PI*(x-b.x0)/(b.x1-b.x0))+.06}return 0};
  function addSeg(){
    const g=new THREE.Group();g.position.x=segX;segN++;const B=curBiome;g.userData.beach=B==="beach";g.userData.B=B;
    if((B==="beach")!==(lastB==="beach")&&lastB)headland(g,0);lastB=B;
    const pathPiece=(a,b)=>{const p=new THREE.Mesh(new THREE.BoxGeometry(b-a,.06,2.4),B==="beach"?wetSand:pathMat);p.position.set((a+b)/2,.04,0);p.receiveShadow=true;g.add(p);if(B!=="beach")for(const zz of[-1.3,1.3]){const e=new THREE.Mesh(new THREE.BoxGeometry(b-a,.05,.22),pathEdge);e.position.set((a+b)/2,.03,zz);g.add(e)}};
    const ph=rand(0,6),cxz=z=>5+1.5*Math.sin(z*.17+ph)-1.5*Math.sin(ph),w=4.0;
    if(B==="canal"&&segN%2===0){
      /* คลองคดเคี้ยว ตลิ่งดินกับหญ้า สะพานหินโค้งข้ามคลอง ปลากระโดด */
      pathPiece(0,5-w/2-1.5);pathPiece(5+w/2+1.5,SEG);
      g.add(ribbon(cxz,40,-45,w/2+.32,.022,M(0x6a5638,{roughness:1}),90));g.add(ribbon3(cxz,40,-45,w/2,.03,canalBed,0xd9cc9c,0x3f9cc9));{const wm=ribbon3(cxz,40,-45,w/2,.17,canalWater,0x6fd0ff,0x1a86e0);g.add(wm);anim.push({seg:g,obj:wm,kind:"wave",ph:0})}
      /* ขอบคลองเรียงหินก้อนแบน มีตะไคร่ */
      {const n=150,kb=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({roughness:.95,flatShading:true}),n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),col=new THREE.Color(),KC=[0x8d8d86,0x7b8077,0x9a958a,0x6f7a5e,0x868e78];
        for(let k=0;k<n;k++){const side=k%2?1:-1,z=36-(k>>1)*1.05+rand(-.2,.2),sz=rand(.2,.32);e.set(rand(-.3,.3),rand(0,6),rand(-.3,.3));q.setFromEuler(e);m4.compose(new THREE.Vector3(cxz(z)+side*(w/2+rand(.02,.14)),.08,z),q,new THREE.Vector3(sz*1.3,sz*.5,sz));kb.setMatrixAt(k,m4);kb.setColorAt(k,col.set(pick(KC)))}
        kb.instanceColor.needsUpdate=true;kb.castShadow=true;g.add(kb)}
      for(let k=0;k<7;k++){const z=-rand(2,24),lp=new THREE.Mesh(new THREE.CircleGeometry(rand(.22,.34),12,.3,Math.PI*1.85),M(pick([0x3f9a35,0x4caf50,0x5aa83a]),{side:THREE.DoubleSide}));lp.rotation.x=-Math.PI/2;lp.position.set(cxz(z)+(Math.random()<.5?-1:1)*rand(.8,1.6),.18,z);g.add(lp);
        if(Math.random()<.45){const fl=new THREE.Group();for(let j=0;j<6;j++){const pt=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0xff8fb8,{roughness:.5}));pt.scale.set(.6,1.4,.4);const a=j/6*Math.PI*2;pt.position.set(Math.cos(a)*.04,.06,Math.sin(a)*.04);pt.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);fl.add(pt)}fl.position.copy(lp.position);fl.position.y=.18;g.add(fl)}}
      /* ใต้น้ำใส: กรวด สาหร่าย ใบไม้ร่วง  ริมตลิ่ง: โขดหินมีตะไคร่ ต้นกก */
      for(let k=0;k<18;k++){const z=rand(-30,10),x=cxz(z)+rand(-w/2+.2,w/2-.2),pb=new THREE.Mesh(new THREE.DodecahedronGeometry(rand(.05,.14),0),M(pick([0x9e9e9e,0x8d6e63,0xbcaaa4,0x78909c]),{flat:true}));pb.scale.y=.5;pb.position.set(x,.05,z);g.add(pb)}
      for(let k=0;k<7;k++){const z=rand(-25,8),sw=seaweed();sw.scale.set(.8,.16,.8);sw.position.set(cxz(z)+rand(-w/2+.3,w/2-.3),.03,z);g.add(sw);anim.push({seg:g,obj:sw,kind:"weed",ph:rand(0,6)})}
      for(let k=0;k<22;k++){const z=rand(-30,12),side=Math.random()<.5?-1:1,r=rock(rand(.25,.6),Math.random()<.45);r.position.set(cxz(z)+side*(w/2+rand(.05,.45)),.08,z);g.add(r)}
      for(let k=0;k<6;k++){const z=rand(-20,6),side=Math.random()<.5?-1:1,rd=new THREE.Group();for(let j=0;j<6;j++){const c=new THREE.Mesh(new THREE.ConeGeometry(.03,rand(.7,1.2),4),M(pick([0x5a8f2a,0x6b9e33,0x4c7f22])));c.position.set(rand(-.15,.15),.45,rand(-.15,.15));c.rotation.set(rand(-.2,.2),0,rand(-.2,.2));rd.add(c)}rd.position.set(cxz(z)+side*(w/2+.3),0,z);g.add(rd)}
      for(let k=0;k<14;k++){const f=fish();f.scale.setScalar(rand(.8,1.2));g.add(f);anim.push({seg:g,obj:f,kind:"koi",fx:cxz,off:rand(-1.3,1.3),ph:rand(0,330),sp:rand(.003,.006),y:rand(.11,.13),z0:-30,len:62})}
      /* กอหญ้าริมตลิ่งเป็นบางจุด */
      for(let k=0;k<16;k++){const z=rand(-28,28),side=Math.random()<.5?-1:1,tf=new THREE.Group(),gm=M(pick([0x5fae3a,0x6cbf45,0x4f9a30,0x7cc24f]),{side:THREE.DoubleSide,roughness:.9});
        for(let j=0;j<9;j++){const h=rand(.28,.55),bl=new THREE.Mesh(new THREE.ConeGeometry(.035,h,3),gm);const a=rand(0,6.28),r=rand(0,.12);bl.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);bl.rotation.set(Math.sin(a)*rand(.2,.5),0,-Math.cos(a)*rand(.2,.5));tf.add(bl)}
        tf.scale.setScalar(rand(1.5,2.2));tf.position.set(cxz(z)+side*(w/2+rand(.35,.75)),0,z);g.add(tf)}
      /* ใต้น้ำใส: ปะการังกิ่ง ดอกไม้น้ำ กรวดสี มองเห็นผ่านผิวน้ำ */
      for(let k=0;k<14;k++){const z=rand(-28,28),cr=new THREE.Group(),cc=pick([0xff7a59,0xff5c8a,0xffa64d,0xe05cff,0xff8fab]),cm=M(cc,{roughness:.7});
        for(let j=0;j<5;j++){const br=new THREE.Mesh(new THREE.CylinderGeometry(.012,.026,rand(.08,.13),5),cm);br.position.set(rand(-.06,.06),.05,rand(-.06,.06));br.rotation.set(rand(-.6,.6),0,rand(-.6,.6));cr.add(br);const tip=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),cm);tip.position.set(br.position.x+Math.sin(br.rotation.z)*-.05,.1,br.position.z+Math.sin(br.rotation.x)*.05);cr.add(tip)}
        cr.scale.setScalar(rand(1.3,1.9));cr.position.set(cxz(z)+rand(-w/2+.4,w/2-.4),.03,z);g.add(cr)}
      for(let k=0;k<16;k++){const z=rand(-28,28),fw=new THREE.Group(),st=new THREE.Mesh(new THREE.CylinderGeometry(.008,.01,.1,4),M(0x3f9a35));st.position.y=.05;fw.add(st);const pc=pick([0xffffff,0xfff176,0xff8fb8,0x9fd4ff]);
        for(let j=0;j<5;j++){const pt=new THREE.Mesh(new THREE.SphereGeometry(.018,6,4),M(pc,{roughness:.5}));const a=j/5*Math.PI*2;pt.position.set(Math.cos(a)*.022,.11,Math.sin(a)*.022);fw.add(pt)}
        const cen=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),M(0xffc400));cen.position.y=.115;fw.add(cen);fw.scale.setScalar(rand(1.2,1.6));fw.position.set(cxz(z)+rand(-w/2+.3,w/2-.3),.03,z);g.add(fw);anim.push({seg:g,obj:fw,kind:"weed",ph:rand(0,6)})}
      {const n=90,pb=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({roughness:.9,flatShading:true}),n),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),col=new THREE.Color(),PC=[0xd7ccc8,0xbcaaa4,0x90a4ae,0xffe0b2,0xa1887f,0xcfd8dc];
        for(let k=0;k<n;k++){const z=rand(-30,30),sz=rand(.04,.11);e.set(rand(0,3),rand(0,6),rand(0,3));q.setFromEuler(e);m4.compose(new THREE.Vector3(cxz(z)+rand(-w/2+.15,w/2-.15),.04,z),q,new THREE.Vector3(sz*1.3,sz*.55,sz));pb.setMatrixAt(k,m4);pb.setColorAt(k,col.set(pick(PC)))}pb.instanceColor.needsUpdate=true;g.add(pb)}
      stoneBridge(g,5-w/2-1.5,w+3);{const sx=segX;bridges.push({seg:g,x0:sx+5-w/2-1.5,x1:sx+5+w/2+1.5,wx:z=>sx+cxz(z)})}
      for(let k=0;k<3;k++){const f=fish(),z=-rand(3,14);g.add(f);anim.push({seg:g,obj:f,kind:"fish",x:cxz(z),z,ph:rand(0,30),sp:rand(.06,.1)})}
      for(let k=0;k<6;k++){const z=-rand(2,26),r=new THREE.Mesh(new THREE.ConeGeometry(.05,.9,4),M(0x3f8f2a));r.position.set(cxz(z)+(Math.random()<.5?-1:1)*(w/2+.35),.45,z);g.add(r)}
      for(let k=0;k<2;k++){const z=-rand(4,20),lp=new THREE.Mesh(new THREE.CircleGeometry(.28,10),M(0x4caf32));lp.rotation.x=-Math.PI/2;lp.position.set(cxz(z)+rand(-.8,.8),.05,z);g.add(lp)}
    }else pathPiece(0,SEG);
    const wet=B==="canal"&&segN%2===0,okX=(z=0)=>{let x,n=0;do{x=rand(0,SEG)}while(wet&&Math.abs(x-cxz(z))<3&&n++<20);return x};
    if(B==="beach"){
      /* ชายหาด: ทรายเต็มพื้น ทะเลด้านหลังทาง คลื่นซัด เรือลอย ปูเดินข้าง หมึกยืนริมน้ำ ต้นมะพร้าว */
      const sand=new THREE.Mesh(new THREE.BoxGeometry(SEG,.03,14.1),sandMat);sand.position.set(SEG/2,.015,2.45);sand.receiveShadow=true;g.add(sand);
      seaChunk(g,segX);
      if(segN%2===0){const b=boat();b.position.set(rand(1,9),0,-rand(16,32));b.rotation.y=rand(-.4,.4);g.add(b);anim.push({seg:g,obj:b,kind:"boat",ph:rand(0,6)})}
      for(let k=0;k<2;k++){const c=crab(),x=rand(1,9),z=Math.random()<.5?rand(1.8,3):Math.min(-1.8,shoreZ(segX+x)+rand(.8,2.5));c.position.set(x,0,z);g.add(c);anim.push({seg:g,obj:c,kind:"crab",x0:x,ph:rand(0,6)})}
      if(Math.random()<.7){const x=rand(1,9),q=squid();q.position.set(x,0,shoreZ(segX+x)+.5);q.rotation.y=rand(0,6);g.add(q);anim.push({seg:g,obj:q,kind:"squid",ph:rand(0,6)})}
      for(let k=0;k<2;k++){if(Math.random()<.3)continue;const x=rand(0,SEG),z=Math.min(-2.4,shoreZ(segX+x)+rand(1.4,2.8));const pm=palm2();pm.position.set(x,0,z);pm.rotation.y=rand(0,6);g.add(pm)}
      if(segN%2===1){const x=rand(2,8),z=Math.min(-2.6,shoreZ(segX+x)+2);const u=umbrella();u.position.set(x,0,z);g.add(u);for(const dx of[-.7,.7]){const l=lounger();l.position.set(x+dx,0,z+.9);l.rotation.y=Math.PI/2+rand(-.15,.15);g.add(l)}}
      for(let k=0;k<10;k++){const lx=rand(0,SEG),o=Math.random()<.5?shell():pebble(),near=Math.random()<.6,z=near?shoreZ(segX+lx)+rand(.1,1.4):rand(1.6,5);o.position.x=lx;o.position.z=z;o.rotation.y=rand(0,6);g.add(o)}
      if(segN%2===0){const lx=rand(1.5,8.5),z=shoreZ(segX+lx)+1.4,rb=rowboat();rb.position.set(lx,0,Math.min(-2.8,z));rb.rotation.y=rand(-.5,.5);g.add(rb);
        const br=barrel();br.position.set(lx+1.7,0,Math.min(-2.6,z+.3));g.add(br);if(Math.random()<.6){const b2=barrel();b2.position.set(lx+2.1,0,Math.min(-2.9,z));g.add(b2)}
        const tp=trap();tp.position.set(lx-1.8,0,Math.min(-2.7,z+.4));tp.rotation.y=rand(-.4,.4);g.add(tp);
        const v=person({hat:Math.random()<.4,long:Math.random()<.5,shirt:pick([0x795548,0x1565c0,0xffffff,0x8d6e63])});v.rotation.y=-Math.PI/2;v.position.set(lx+.4,0,Math.min(-3.6,z-.6));g.add(v);anim.push({seg:g,obj:v,kind:"wave",ph:rand(0,6)})}
      if(segN%3===1){const is=island();is.position.set(rand(-5,15),-.5,-rand(70,140));g.add(is)}
      if(Math.random()<.35){const sb=boat();sb.scale.setScalar(rand(2,3));sb.position.set(rand(0,10),0,-rand(40,90));sb.rotation.y=rand(-.5,.5);g.add(sb);anim.push({seg:g,obj:sb,kind:"boat",ph:rand(0,6)})}
    }else if(B==="waterfall"){
      /* น้ำตก: ผาหินกับสายน้ำทุก 3 ชิ้น ที่เหลือเป็นหิน เฟิร์น ต้นไม้ กอไผ่ */
      {const wf=waterfall();wf.position.set(5,0,-15);g.add(wf)}
      for(let k=0;k<5;k++){const fr=Math.random()<.25,r=rock(fr?rand(.2,.4):rand(.3,.8),Math.random()<.4);r.position.set(rand(0,SEG),.1,fr?rand(2,4):-rand(2,8));g.add(r)}
      for(let k=0;k<4;k++){const f=fern();f.position.set(rand(0,SEG),0,Math.random()<.7?-rand(1.8,7):rand(1.8,3.5));g.add(f)}
      for(let k=0;k<5;k++){const t=tuft();t.position.set(rand(0,SEG),0,rand(-4,4)*(Math.random()<.5?1:-1));g.add(t)}
    }else if(B==="village"){
      /* หมู่บ้าน: บ้านไม้ใต้ถุนสูง ชาวบ้านเดินไปมา โบกมือ ไก่จิกอาหาร ต้นกล้วย โอ่งน้ำ */
      if(segN%2===0){const h=stiltHouse();h.position.set(rand(3,7),0,-rand(9,12));h.rotation.y=rand(-.25,.25);g.add(h);const j=jar();j.position.set(h.position.x+2.8,0,h.position.z+2.4);g.add(j)}
      else{const b=bananaTree();b.position.set(rand(1,9),0,-rand(5,9));g.add(b);const t=Math.random()<.5?palm2():bamboo(.85);t.position.set(rand(0,SEG),0,-rand(9,14));g.add(t)}
      {const job=segN%6;if(job===0)hoeWorker(g,2.5,-4.6);else if(job===1)paddy(g,5,-5.6);else if(job===2)vegPlot(g,3.5,-4.6);else if(job===3)waterCarrier(g,3,-3.8);else if(job===4)houseSweeper(g,4,-3.9);else washer(g,4,-4.2)}
      if(Math.random()<.5){const p=person({hat:Math.random()<.5,long:Math.random()<.5}),x=rand(1,9);p.position.set(x,0,-2.9);p.rotation.y=-Math.PI/2;g.add(p);anim.push({seg:g,obj:p,kind:"wave",ph:rand(0,6)})}
      for(let k=0;k<2;k++){const c=chicken();c.position.set(rand(0,SEG),0,Math.random()<.5?-rand(1.8,4):rand(1.8,3));c.rotation.y=rand(0,6);g.add(c);anim.push({seg:g,obj:c,kind:"graze",ph:rand(0,6)})}
      for(let k=0;k<5;k++){const t=tuft();t.position.set(rand(0,SEG),0,rand(1.6,4)*(Math.random()<.5?1:-1));g.add(t)}
      if(Math.random()<.5){const f=fence();f.position.set(rand(0,7),0,-2.4);g.add(f)}
    }else if(B==="market"){
      /* ตลาด: แผงร้านสองแถว คนเดินซื้อของ ธงราว */
      const s1=stall();s1.position.set(2.5,0,-3.6);g.add(s1);const s2=stall();s2.position.set(7.5,0,-3.6);g.add(s2);
      if(segN%2===0){const s3=stall();s3.position.set(5,0,-9);g.add(s3)}
      const bt=bunting(SEG);bt.position.set(0,0,-2.4);g.add(bt);
      for(let k=0;k<2;k++){const p=person({basket:Math.random()<.6,long:Math.random()<.5,hat:Math.random()<.2}),x=rand(1,9),z=-rand(6,7.5);p.position.set(x,0,z);g.add(p);anim.push({seg:g,obj:p,kind:"walker",x0:x,ph:rand(0,6),sp:rand(.25,.45),rg:rand(1,2.5)})}
    }else if(B==="haunted"){
      /* บ้านผีสิง: บ้านร้างทุก 3 ชิ้น ต้นไม้แห้ง หลุมศพ รั้วเหล็ก ไฟผีลอย ค้างคาวบิน */
      {const hk=segN%8;if(hk===0){const h=hauntedHouse();h.position.set(5,0,-12);h.rotation.y=rand(-.2,.2);g.add(h)}else if(hk===2){const h=thaiHauntedHouse();h.position.set(5,0,-11);h.rotation.y=rand(-.15,.15);g.add(h)}else if(hk===4){const h=fieldHut();h.position.set(rand(3,7),0,-8);h.rotation.y=rand(-.4,.4);g.add(h)}else if(hk===6){const h=oldTwoStorey();h.position.set(5,0,-11);h.rotation.y=rand(-.2,.2);g.add(h)}}
      for(let k=0;k<2;k++){const t=deadTree();t.position.set(rand(0,SEG),0,-rand(4,10));t.rotation.y=rand(0,6);g.add(t)}
      for(let k=0;k<3;k++){const gr=grave();gr.position.set(rand(0,SEG),0,-rand(3,8));gr.rotation.y=rand(-.3,.3);g.add(gr)}
      if(segN%2===1){const f=ironFence(SEG);f.position.set(0,0,-2.5);g.add(f)}
      for(let k=0;k<2;k++){const w=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),wispMat);w.position.set(rand(0,SEG),rand(1,2.4),-rand(2.5,8));g.add(w);anim.push({seg:g,obj:w,kind:"wisp",ph:rand(0,6),y0:w.position.y,x0:w.position.x})}
      if(Math.random()<.6){const b=bat();b.position.set(rand(0,SEG),rand(3,5),-rand(3,7));g.add(b);anim.push({seg:g,obj:b,kind:"bat",ph:rand(0,6),x0:b.position.x,y0:b.position.y,z0:b.position.z})}
      for(let k=0;k<4;k++){const t=tuft();t.position.set(rand(0,SEG),0,rand(1.6,4)*(Math.random()<.5?1:-1));g.add(t)}
    }else if(B==="thai"){
      /* ศาลาไทย สระบัว ต้นลีลาวดี เจดีย์ทอง */
      if(segN%3===0){const s=salaThai();s.position.set(5,0,-11);g.add(s);const lp=lotusPond();lp.position.set(rand(2,8),0,-5.5);g.add(lp)}
      else if(segN%3===1){const ub=ubosot();ub.position.set(4,0,-16);g.add(ub);const st=stupa();st.position.set(9.5,0,-20);g.add(st)}
      else if(segN%6===2)almsScene(g);else sweepScene(g);
      for(let k=0;k<2;k++){const f=frangipani();f.position.set(rand(0,SEG),0,-rand(3.5,8));f.rotation.y=rand(0,6);g.add(f)}
      const nf=8;for(let k=0;k<nf;k++){const f=flower(),fz=Math.random()<.7?-rand(1.8,6):rand(1.8,3.5);f.position.set(rand(0,SEG),0,fz);f.scale.setScalar(rand(1.2,1.7));g.add(f)}
      for(let k=0;k<5;k++){const t=tuft();t.position.set(rand(0,SEG),0,rand(1.6,4)*(Math.random()<.5?1:-1));g.add(t)}
    }else{
      for(let k=0;k<4;k++){const r=Math.random(),x=rand(0,SEG);if(r<.3)continue;const tz=r>=.85?-2.2:r<.6?-rand(4.5,13):-rand(2.5,8);if(wet&&Math.abs(x-cxz(tz))<3.8)continue;const o=r<.6?(B==="canal"?bamboo():anyTree()):r<.85?bush():(B==="canal"?bamboo():fence());o.position.set(x,0,tz);o.rotation.y=rand(0,6);g.add(o)}
      const nf=TH.flowers;for(let k=0;k<nf;k++){const f=flower(),fz=Math.random()<.7?-rand(1.8,9):rand(1.8,4);f.position.set(okX(fz),0,fz);f.scale.setScalar(rand(1.3,1.9));g.add(f)}
      if(B==="flowers"){for(let k=0;k<3;k++){const r=rock(rand(.25,.7),Math.random()<.5);r.position.set(rand(0,SEG),.1,Math.random()<.8?-rand(2.5,9):rand(2.6,4));g.add(r)}addFlowerField(g,60);for(let k=0;k<3;k++){const mp=mushroomPatch(),fr=Math.random()<.35;mp.position.set(rand(0,SEG),0,fr?rand(1.8,2.8):-rand(1.8,6));mp.scale.setScalar(fr?rand(1,1.3):rand(1.4,2));g.add(mp)}for(let k=0;k<4;k++){const fb=flowerBush();fb.position.set(rand(0,SEG),0,-rand(2.6,10));fb.rotation.y=rand(0,6);g.add(fb)}if(Math.random()<.5){const fb=flowerBush();fb.scale.setScalar(.75);fb.position.set(rand(0,SEG),0,rand(2.6,3.6));g.add(fb)}}
      for(let k=0;k<6;k++){const t=tuft(),tz=Math.random()<.5?rand(1.6,4):-rand(1.6,4);t.position.set(okX(tz),0,tz);g.add(t)}
      if(B==="canal"){if(segN%2===1){const o=Math.random()<.5?temple():pagoda();o.position.set(rand(3,7),0,-rand(13,18));o.rotation.y=rand(-.3,.3);g.add(o)}for(let k=0;k<4;k++){const bz=-rand(3.5,13),bm=bamboo(rand(.8,1.1));bm.position.set(okX(bz),0,bz);g.add(bm)}}
      if(B==="farm"){
        /* ฟาร์ม: วัว แกะ แพะ ก้มกินหญ้า มีรั้วล้อม */
        /* สวนสัตว์: สัตว์หลายชนิดในคอก รั้วไม้ พุ่มไม้เยอะ */
        for(let k=0;k<3;k++){const mk=pick(ZOO),a=mk(),big=mk===elephant||mk===giraffe;a.position.set(rand(.8,9.2),0,big?-rand(7,12):-rand(3.2,6.5));a.rotation.y=rand(-1.2,1.2)+(Math.random()<.5?0:Math.PI);g.add(a);anim.push({seg:g,obj:a,kind:"graze",ph:rand(0,6)})}
        const zf=zooFence(SEG);zf.position.set(0,0,-2.6);if(segN%2)g.add(zf);for(let k=0;k<4;k++){const b=bush();b.scale.setScalar(rand(1.1,1.8));b.position.set(rand(0,SEG),0,-rand(2.9,9));g.add(b)}
        if(Math.random()<.6){const b=bush();b.position.set(rand(0,SEG),0,rand(2.4,3.4));g.add(b)}
      }
      if(segN%3===0&&B!=="canal"){const o=pick(B==="farm"?[pond,pond,house]:[windmill,house,house,pond])();o.position.set(rand(2,8),0,-rand(16,24));o.rotation.y=rand(-.4,.4);g.add(o)}
    }
    if(Math.random()<.5){const c=cloud();c.position.set(rand(0,SEG),rand(13,19),-rand(30,55));g.add(c)}
    {/* ของฝั่งหลังกล้อง เห็นเมื่อหมุนกล้อง */const put=(o,x,z)=>{o.position.set(x,0,z);o.rotation.y=rand(0,6);g.add(o)},F=()=>rand(17,40);
      for(let k=0;k<3;k++){const x=rand(0,SEG),z=F();
        if(B==="canal"&&segN%2===0&&Math.abs(x-cxz(z))<3.6)continue;
        const o=B==="canal"?bamboo(rand(.8,1.1)):B==="beach"?(Math.random()<.6?palm2():bush()):B==="waterfall"?(Math.random()<.5?roundTree():rock(rand(.8,1.6),true)):B==="village"?(k===0&&segN%2?stiltHouse():Math.random()<.5?bananaTree():palm2()):
          B==="market"?(k===0?stall():roundTree()):B==="haunted"?(Math.random()<.5?deadTree():grave()):B==="thai"?(k===0&&segN%3===2?stupa():frangipani()):B==="farm"&&k===0?pick(ZOO)():B==="farm"?bush():anyTree();
        put(o,x,z);if(B==="market"&&k===0)o.rotation.y=Math.PI}
      if(B==="flowers"){const fb=flowerBush();put(fb,rand(0,SEG),F())}
      if(B==="flowers")for(let k=0;k<3;k++){const ft=pick(FLOWER_T),col=flowerCol(ft),cx=rand(0,SEG),cz=F();for(let j=0;j<8;j++){const f=flower(col,ft);f.position.set(cx+rand(-.9,.9),0,cz+rand(-.5,.5));f.scale.setScalar(rand(1.4,2.2));g.add(f)}}
      if(segN%4===1&&B!=="haunted"&&B!=="beach"){const h=house();put(h,rand(2,8),rand(24,36))}}
    if(Math.random()<.32&&!(B==="canal"&&segN%2===0)){const c=chest(),cx=rand(2,8);c.position.set(cx,0,-1.75);c.rotation.y=rand(-.25,.25);g.add(c);chests.push({seg:g,o:c,x:cx,open:0})}
    if(B==="beach"&&segN%4===2){const sh=stall({name:"ร้านแว่น",shades:true});sh.position.set(5,0,-3.6);g.add(sh);shops.push({seg:g,x:5,id:"shades",shown:false})}
    else if(!(B==="canal"&&segN%2===0)&&B!=="market"&&rainNow()&&!owns("umbrella")&&segN%4===1){const sh=stall({name:"ร้านร่ม",umb:true});sh.position.set(6,0,-3.6);g.add(sh);shops.push({seg:g,x:6,id:"umbrella",shown:false})}
    else if(!(B==="canal"&&segN%2===0)&&B!=="market"&&coldNow()&&(!owns("coat")||!owns("scarf"))&&segN%5===3){const sh=stall({name:"ร้านเสื้อกันหนาว",warm:true});sh.position.set(6,0,-3.6);g.add(sh);shops.push({seg:g,x:6,id:owns("coat")?"scarf":"coat",shown:false})}
    for(const a of anim)if(!a.seg)a.seg=g;
    world.add(g);segs.push(g);segX+=SEG;
  }
  /* เปลี่ยนฉากเมื่อขึ้นด่านใหม่: สร้างชิ้นทางข้างหน้าใหม่ (เฉพาะส่วนที่ยังไม่เห็นบนจอ) */
  function setBiome(st){const nb=biomeOf(st);if(nb===curBiome)return;curBiome=nb;
    const cut=S.x+14;while(segs.length&&segs[segs.length-1].position.x>=cut){const g=segs.pop();freeObj(g);segX-=SEG}lastB=segs.length?segs[segs.length-1].userData.B:null;
    for(let i=anim.length-1;i>=0;i--)if(!live(anim[i]))anim.splice(i,1);for(let i=bridges.length-1;i>=0;i--)if(bridges[i].seg.parent!==world)bridges.splice(i,1);
    while(segX<S.x+60)addSeg()}
  for(let i=0;i<9;i++)addSeg();
  const hills=[];
  /* เปลี่ยนธีมแบบค่อย ๆ ไล่สี 2 วินาที: ท้องฟ้า หมอก พื้น ทาง แสง พระอาทิตย์ ภูเขา เนิน */
  let fade=null;const C=v=>new THREE.Color(v);
  function snapshot(){return{sky:(fade?fade.cur.sky:TH.sky.map(C)),fog:scene.fog.color.clone(),ground:groundMat.color.clone(),path:pathMat.color.clone(),edge:pathEdge.color.clone(),
    fn:scene.fog.near,ff:scene.fog.far,hs:hemi.color.clone(),hg:hemi.groundColor.clone(),hi:hemi.intensity,lc:sun.color.clone(),li:sun.intensity,sp:fade?fade.cur.sp:TH.sunPos.slice(),
    lay:layers.map(L=>L.items.map(g=>{const m=g.isMesh?g:g.children[0];return m.material.color.clone()}))}}
  function target(T){const wf=curBiome==="waterfall";return{fn:Math.max(T.fogNear||50,wf?45:0),ff:Math.max(T.fogFar||190,wf?160:0),sky:T.sky.map(C),fog:C(T.fog),ground:C(T.ground),path:C(T.path),edge:C(T.pathEdge),hs:C(T.hemi[0]),hg:C(T.hemi[1]),hi:T.hemiI,lc:C(T.light),li:T.sunI,sp:T.sunPos.slice(),
    lay:layers.map(L=>L.items.map(()=>C(L.kind===0?pick(T.mounts||[T.mount]):L.kind===1?T.hill2:T.hill1)))}}
  function fadeTo(T){const from=snapshot();TH=T;fade={s0:starMat.opacity,r0:rainMat.opacity,t:0,from,to:target(T),cur:{sky:from.sky.map(c=>c.clone()),sp:from.sp.slice()}}}
  function stepFade(dt){if(!fade)return;fade.t=Math.min(1,fade.t+dt/2);const k=fade.t*fade.t*(3-2*fade.t),f=fade.from,t=fade.to,cur=fade.cur;
    cur.sky=f.sky.map((c,i)=>c.clone().lerp(t.sky[i],k));drawSky(cur.sky);skyT.needsUpdate=true;
    scene.fog.color.copy(f.fog).lerp(t.fog,k);scene.fog.near=f.fn+(t.fn-f.fn)*k;scene.fog.far=f.ff+(t.ff-f.ff)*k;starMat.opacity=fade.s0+((TH.stars?1:0)-fade.s0)*k;rainMat.opacity=fade.r0+((TH.rain?.55:0)-fade.r0)*k;groundMat.color.copy(f.ground).lerp(t.ground,k);pathMat.color.copy(f.path).lerp(t.path,k);pathEdge.color.copy(f.edge).lerp(t.edge,k);
    hemi.color.copy(f.hs).lerp(t.hs,k);hemi.groundColor.copy(f.hg).lerp(t.hg,k);hemi.intensity=f.hi+(t.hi-f.hi)*k;sun.color.copy(f.lc).lerp(t.lc,k);sun.intensity=f.li+(t.li-f.li)*k;
    cur.sp=[f.sp[0]+(t.sp[0]-f.sp[0])*k,f.sp[1]+(t.sp[1]-f.sp[1])*k];
    layers.forEach((L,li)=>L.items.forEach((g,ii)=>{const m=g.isMesh?g:g.children[0];m.material.color.copy(f.lay[li][ii]).lerp(t.lay[li][ii],k)}));
    if(fade.t>=1){drawSun(TH.sunCore,TH.sunGlow);sunSp.material.map.needsUpdate=true;fade=null}}
  /* ดาวกลางคืน และสายฝนช่วงบ่ายฤดูฝน */
  const starGeo=new THREE.BufferGeometry(),sp=[];for(let k=0;k<500;k++){const a=rand(-1.3,1.3),e=rand(.12,1.2),r=200;sp.push(Math.sin(a)*r*Math.cos(e),Math.sin(e)*r*.9+10,-Math.cos(a)*r*Math.cos(e))}
  starGeo.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));const starMat=new THREE.PointsMaterial({color:0xffffff,size:1.4,sizeAttenuation:false,transparent:true,opacity:TH.stars?1:0,fog:false,depthWrite:false});
  const stars=new THREE.Points(starGeo,starMat);scene.add(stars);
  const RN=900,rainGeo=new THREE.BufferGeometry(),rp=new Float32Array(RN*6);for(let k=0;k<RN;k++){const x=rand(-20,30),y=rand(0,18),z=rand(-14,8);rp.set([x,y,z,x-.15,y-.7,z],k*6)}
  rainGeo.setAttribute("position",new THREE.BufferAttribute(rp,3));const rainMat=new THREE.LineBasicMaterial({color:0xcfe3ff,transparent:true,opacity:TH.rain?.55:0,depthWrite:false});
  const rain=new THREE.LineSegments(rainGeo,rainMat);scene.add(rain);
  let themeCheck=0;loadWeather().then(()=>{const T=themeNow();if(T!==TH)fadeTo(T)});
  /* ประกายแดดระยิบบนผิวน้ำทะเล เป็นทางยาวไปหาพระอาทิตย์ */
  const GN=420,glitGeo=new THREE.BufferGeometry();glitGeo.setAttribute("position",new THREE.Float32BufferAttribute(new Float32Array(GN*3),3));
  const glitMat=new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});
  const glit=new THREE.Points(glitGeo,glitMat);glit.renderOrder=3;glit.frustumCulled=false;scene.add(glit);
  const lamp=new THREE.PointLight(0xfff0c8,0,14,1.6);scene.add(lamp);
  const P=makePencil();scene.add(P);
  /* ไอเทมติดตัวน้องดินสอ: ร่ม หมวกแก๊ป หมวกชาวนา พัด เสื้อกันหนาว แว่นกันแดด */
  let HATM=null;const GEAR={};{const b=P.userData.body,face=P.userData.face;
    const cap=new THREE.Group(),capM=M(0x1c1c1f,{roughness:.6}),capB=M(0x111114,{roughness:.6});const cw=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.34,24,1,true),capM);cw.position.y=.17;cap.add(cw);const cd=new THREE.Mesh(new THREE.SphereGeometry(.47,24,12,0,Math.PI*2,0,Math.PI/2),capM);cd.scale.y=.55;cd.position.y=.34;cd.castShadow=true;cap.add(cd);
    const lg=new THREE.Mesh(new THREE.CircleGeometry(.09,16),M(0xffffff));lg.position.set(0,.3,.475);cap.add(lg);
    const cb=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.04,20,1,false,-Math.PI/2,Math.PI),capB);cb.scale.z=1.25;cb.position.set(0,.02,.3);cb.castShadow=true;cap.add(cb);const bt=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),capB);bt.position.y=.6;cap.add(bt);cap.position.y=1.98;b.add(cap);GEAR.cap=cap;
    const st=new THREE.Group(),sm=M(0xd9b56a,{flat:true});const brim=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.04,28),sm);brim.castShadow=true;st.add(brim);const cr=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.32,20),sm);cr.position.y=.17;st.add(cr);
    const bandM=M(0xe53935),bd=new THREE.Mesh(new THREE.CylinderGeometry(.425,.425,.08,20),bandM);bd.position.y=.06;st.add(bd);st.scale.setScalar(1.32);st.position.y=2.06;b.add(st);GEAR.straw=st;HATM={cap:capM,straw:bandM};
    const sh=shadesMini(0x111111,2.1);sh.position.set(0,.06,.43);face.add(sh);GEAR.shades=sh;
    /* เสื้อกันหนาวมีฮู้ด: ตัวเสื้อยาวคลุมลำตัวช่วงล่าง แขนยาวถึงข้อมือ ฮู้ดพับอยู่ด้านหลัง ซิปหน้า กระเป๋าสองข้าง ขอบแขนกับชายเสื้อสีเข้ม */
    const coat=new THREE.Group(),coatM=M(0xd32f2f,{roughness:.85}),rib=M(0x2b2b2b,{roughness:.9}),zipM=M(0xd9d9d9,{metalness:.6,roughness:.3});
    const cBody=new THREE.Mesh(new THREE.CylinderGeometry(.47,.53,.72,16),coatM);cBody.position.y=.92;cBody.castShadow=true;coat.add(cBody);
    const hem=new THREE.Mesh(new THREE.CylinderGeometry(.535,.535,.08,16),rib);hem.position.y=.57;coat.add(hem);
    const zip=new THREE.Mesh(new THREE.BoxGeometry(.035,.7,.02),zipM);zip.position.set(0,.93,.5);zip.rotation.x=-.08;coat.add(zip);
    const pull=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.02),zipM);pull.position.set(.03,1.22,.49);coat.add(pull);
    for(const sx of[-1,1]){const pk=new THREE.Mesh(new THREE.BoxGeometry(.2,.16,.03),M(0x000000,{transparent:true,opacity:.18}));pk.position.set(sx*.25,.78,.48);pk.rotation.y=sx*.45;coat.add(pk)}
    const hood=new THREE.Mesh(new THREE.SphereGeometry(.36,16,10,0,Math.PI,0,Math.PI*.6),coatM);hood.rotation.y=Math.PI;hood.scale.set(1.3,1,.8);hood.position.set(0,1.3,-.32);hood.castShadow=true;coat.add(hood);
    const hoodIn=new THREE.Mesh(new THREE.SphereGeometry(.33,16,10,0,Math.PI,0,Math.PI*.6),M(0xf5e6d3,{side:THREE.BackSide}));hoodIn.rotation.y=Math.PI;hoodIn.scale.set(1.3,1,.8);hoodIn.position.set(0,1.31,-.31);coat.add(hoodIn);
    const coll=new THREE.Mesh(new THREE.TorusGeometry(.46,.06,8,24),coatM);coll.rotation.x=Math.PI/2;coll.position.y=1.27;coat.add(coll);
    const extra=[];for(const a of P.userData.arms){const sl=new THREE.Group(),sv=new THREE.Mesh(new THREE.CylinderGeometry(.095,.1,.42,10),coatM);sv.position.y=-.22;sv.castShadow=true;sl.add(sv);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.07,10),rib);cuff.position.y=-.42;sl.add(cuff);sl.visible=false;a.add(sl);extra.push(sl)}
    coat.userData.extra=extra;b.add(coat);GEAR.coat=coat;HATM.coat=coatM;
    const scarf=new THREE.Group(),scM=M(0xec407a,{roughness:.8});HATM.scarf=scM;const _sc=0,stp=M(0xffffff,{roughness:.8});const ring=new THREE.Mesh(new THREE.TorusGeometry(.44,.09,8,24),scM);ring.rotation.x=Math.PI/2;ring.position.y=1.29;ring.scale.set(1.04,1.04,1);scarf.add(ring);
    for(let k=0;k<2;k++){const t=new THREE.Mesh(new THREE.BoxGeometry(.15,.42,.06),scM);t.position.set(.16+k*.12,1.05,.47);t.rotation.z=.12+k*.1;scarf.add(t);const bd=new THREE.Mesh(new THREE.BoxGeometry(.155,.05,.065),stp);bd.position.set(.16+k*.12+Math.sin(.12+k*.1)*.13,.92,.47);bd.rotation.z=t.rotation.z;scarf.add(bd)}
    b.add(scarf);GEAR.scarf=scarf;
    const um=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.9,6),M(0x5d4037));pole.position.y=2.25;um.add(pole);
    const umM=new THREE.MeshStandardMaterial({color:0xff7043,side:THREE.DoubleSide,flatShading:true});HATM.umbrella=umM;const can=new THREE.Mesh(new THREE.ConeGeometry(1.05,.5,8,1,true),umM);can.position.y=3.85;can.castShadow=true;um.add(can);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),M(0x5d4037));tip.position.y=4.12;um.add(tip);const hk=new THREE.Mesh(new THREE.TorusGeometry(.08,.02,6,12,Math.PI),M(0x5d4037));hk.position.set(.08,.8,0);hk.rotation.z=Math.PI;um.add(hk);um.position.set(.62,0,0);b.add(um);GEAR.umbrella=um;
    const fan=new THREE.Mesh(new THREE.CircleGeometry(.34,14,Math.PI/6,Math.PI*2/3),new THREE.MeshStandardMaterial({color:0xec407a,side:THREE.DoubleSide}));fan.position.set(0,-.55,.05);P.userData.arms[0].add(fan);GEAR.fan=fan;
    for(const k in GEAR)GEAR[k].visible=false;for(const k in HATM)HATM[k].userData.def="#"+HATM[k].color.getHexString()}
  let gearT=1,gearKey="";
  /* ไอเทมมีหลายสีได้: รหัส "cap" (สีเริ่มต้น) หรือ "cap@1e3a8a" ใส่ได้ทีละสีต่อชนิด */
  function gearList(){return api.gear?api.gear():[]}
  function owns(id){return gearList().some(g=>g.split("@")[0]===id)}function pref(id){return (api.gearPref?api.gearPref():{})[id]}
  function wornVar(id){return gearList().find(g=>g.split("@")[0]===id&&pref(g)===1)}
  /* ไอเทมที่ซื้อแล้ว ผู้เล่นเลือกใส่เองทั้งหมด (แตะที่แถบด้านขวา) ไม่ใส่ให้อัตโนมัติ */
  function wantGear(id){return !!wornVar(id)}
  function rainNow(){const c=thaiClock(nowMs());return !!(c.rain||TH.rain)}function coldNow(){const c=thaiClock(nowMs());return c.season==="cool"||(c.temp!=null&&c.temp<=22)}
  function applyGear(){const on={};for(const k in GEAR)on[k]=wantGear(k);if(on.straw)on.cap=false;for(const k in GEAR)GEAR[k].visible=on[k];P.userData.avY=on.straw?3.4:on.cap?3.35:3.15;{const H=HATM;if(H)for(const k in H){const v=wornVar(k),c=v&&v.includes("@")?"#"+v.split("@")[1]:H[k].userData.def;H[k].color.set(c)}}
    /* แขนเสื้อกันหนาวอยู่ที่แขน ต้องซ่อน/แสดงตามเสื้อ */
    for(const sl of GEAR.coat.userData.extra||[])sl.visible=on.coat
    const key=JSON.stringify(on);if(key!==gearKey){gearKey=key;ui.gear&&ui.gear(on)}
    /* ฝนตก: ถามว่าจะกางร่มไหม ถ้ายังไม่มีร่ม บอกว่าข้างหน้ามีร้านขายร่ม */
    if(rainNow()&&!on.umbrella&&!S.rainAsked&&S.mode==="walk"){S.rainAsked=true;if(owns("umbrella"))ui.rain&&ui.rain(true);else ui.rain&&ui.rain(false)}}
  /* รูปประจำตัวของนักเรียน ลอยอยู่บนหัวน้องดินสอ */
  if(api.avatar){const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d");
      x.fillStyle="#fff";x.beginPath();x.arc(128,118,112,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(104,222);x.lineTo(152,222);x.lineTo(128,252);x.fill();
      x.save();x.beginPath();x.arc(128,118,100,0,Math.PI*2);x.clip();const sd=Math.min(im.naturalWidth,im.naturalHeight);x.drawImage(im,(im.naturalWidth-sd)/2,(im.naturalHeight-sd)/2,sd,sd,28,18,200,200);x.restore();
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false}));sp.scale.set(.95,.95,1);sp.position.y=3.15;sp.material.depthTest=false;sp.renderOrder=25;P.add(sp);P.userData.av=sp};
    im.onerror=()=>{if(!im._f){im._f=1;im.src="avatar20.png"}};im.src=api.avatar}
  const S={st:firstSt(),z:0,bq:false,qn:0,qBr:null,spl:null,x:0,y:0,vy:0,hearts:3,pts:0,mode:"walk",need:0,done:0,nextQ:0,coins:[],ans:[],q:null,qT:0,qMax:10,arch:null,archX:0,jump:null,speed:3.6,t:0,fall:null,hop:null,dir:0,face:1,paused:false};
  const ui=api.ui;
  function stage(st){
    setBiome(st);
    S.st=st;S.bq=false;SND.ambient(biomeOf(st));if(S.shrine){freeObj(S.shrine);S.shrine=null}S.prayed=false;S.rainAsked=false;S.got=0;ui.pts&&ui.pts(0);clearCritters();S.inWater=null;S.z=0;S.spl=null;S.qBr=null;S.climb=null;S.wet=0;P.rotation.z=0;SND.mode(biomeOf(st)==="haunted"?"haunt":biomeOf(st)==="thai"?"thai":"day");gearT=1;{const T=themeNow();if(T!==TH)fadeTo(T)}S.need=8;S.done=0;S.qMax=Math.max(6,13-Math.floor(st/2));S.nextQ=S.x+10;setSky(st);ui.stage(st,S.need,S.done);spawnCoins(S.x+3,6,false)}
  /* เหรียญเรียงตามทาง บางช่วงลอยสูงต้องแตะให้กระโดดเก็บ */
  function spawnCoins(x0,n,bonus){const arc=Math.random()<.5;for(let i=0;i<n;i++){const c=coinMesh();const h=arc&&i>1&&i<n-1?1.9+Math.sin((i-1)/(n-3)*Math.PI)*.6:.8;c.position.set(x0+i*1.1,h,0);c.userData.bonus=bonus;world.add(c);S.coins.push(c)}}
  function ask(br,water){
    for(const o of S.ans)freeObj(o);S.ans=[];
    S.mode="ask";S.q=api.question(S.st);S.qT=S.qMax+(S.q.box?4:0);S.qn++;S.qBr=br||null;
    const mid=br?(br.x0+br.x1)/2:0,mk=biomeOf(S.st)==="market"&&!water&&!br,xs=[0,1,2,3].map(i=>water?S.x-2.7+i*1.8:br?mid-2.7+i*1.8:mk?S.x+(W()<600?1.8+i*1.7:2.8+i*2.7):W()<600?S.x+1.5+i*1.45:S.x+2.6+i*1.9);
    S.ans=S.q.opts.map((o,i)=>{const a=answer(S.q.box?String(i+1):o,i);const low=biomeOf(S.st)==="market"&&!water&&!br;if(S.q.box&&W()<600)a.visible=false;a.position.set(xs[i],water?1.5+(i%2)*1:low?.75:(br?groundY(xs[i]):0)+2.2+(i%2)*1.1,water?.9:low?.6:0);a.userData.base=a.position.y;a.scale.setScalar(.01);world.add(a);return a});
    ui.ask(S.q);
  }
  /* ตกน้ำแล้วต้องตอบข้อใหม่ให้ถูกก่อนถึงจะปีนขึ้นสะพานได้ ตอบผิดเสียหัวใจแล้วได้ข้อใหม่ */
  /* ปีนกลับขึ้นสะพานเสมอ: เป้าหมายคือกลางสะพานที่ตกลงไป */
  function climbOut(){const br=S.inWater.br||S.qBr,mid=(br.x0+br.x1)/2;S.mode="climb";S.climb={t:0,x0:S.inWater.x,tx:br.x0-.3}}
  function waterChoose(i){if(S.mode!=="ask")return;ui.hideQ();const ok=i===S.q.ans,a=S.ans[i];
    if(ok){S.joy=1.6;SND.play("ok");mark(a,"#22c55e");burst(a.position);a.userData.gone=true;S.done++;ui.stage(S.st,S.need,S.done);S.bq=true;
      climbOut();setTimeout(clearAns,400)}
    else{SND.play("wrong");if(a){mark(a,"#ef4444");a.userData.drop=true}mark(S.ans[S.q.ans],"#22c55e");ui.say&&ui.say("ยังไม่ถูก ลองข้อใหม่นะ");S.mode="wet";hurt();
      setTimeout(()=>{if(S.mode!=="wet"||!S.inWater)return;clearAns();ask(S.inWater.br,true)},1300)}}
  function choose(i){
    if(S.inWater){waterChoose(i);return}
    if(S.mode!=="ask")return;S.mode="jumping";ui.hideQ();const ok=i===S.q.ans;
    if(i<0){mark(S.ans[S.q.ans],"#22c55e");SND.play("wrong");if(S.qBr){S.mode="splash";S.spl={t:0,x:S.x,y:S.y+groundY(S.x),br:S.qBr};return}punish();hurt();setTimeout(clearAns,600);return}
    const a=S.ans[i],to=a.visible?new THREE.Vector3(a.position.x,Math.max(0,a.position.y-.9-groundY(a.position.x)),0):new THREE.Vector3(S.x,0,0);
    S.jump={from:new THREE.Vector3(S.x,S.y,0),to,t:0,dur:.55,done:()=>{
      if(ok){S.joy=1.6;SND.play("ok");for(const l of leeches)l.drop=1;for(const c of critters)if(c.kind==="crab")c.off=1;S.crabHits=0;mark(a,"#22c55e");burst(a.position);a.userData.gone=true;S.done++;if(S.qBr)S.bq=true;ui.stage(S.st,S.need,S.done);
        S.fall={vy:2};S.mode="falling";S.afterFall=()=>{clearAns();S.mode="walk";afterAnswer(true)}}
      else if(S.qBr){SND.play("wrong");mark(a,"#ef4444");a.userData.drop=true;mark(S.ans[S.q.ans],"#22c55e");S.mode="splash";S.spl={t:0,x:S.x,y:S.y+groundY(S.x),br:S.qBr}}
      else{SND.play("wrong");mark(a,"#ef4444");a.userData.drop=true;mark(S.ans[S.q.ans],"#22c55e");S.fall={vy:0};S.mode="falling";S.afterFall=()=>{punish();hurt();if(S.mode!=="dead"){clearAns();S.mode="walk";afterAnswer(false)}}}
    }};
  }
  function mark(a,color){if(!a)return;const om=a.userData.sp.material.map;a.userData.sp.material.map=numTex(a.userData.label,color);if(om)om.dispose();a.userData.sp.material.needsUpdate=true}
  function afterAnswer(ok){
    if(ok){spawnCoins(S.x+2,9,true);if(S.done>=S.need){S.archX=S.x+14;
      if(biomeOf(S.st)==="thai"&&!S.prayed){S.shrineX=S.x+9;S.shrine=buddha();S.shrine.position.set(S.shrineX+2.2,0,-3.3);world.add(S.shrine);S.archX=S.x+16}
      S.arch=finishGate(S.st);S.arch.position.x=S.archX;world.add(S.arch)}else S.nextQ=S.x+14}
    else S.nextQ=S.x+8;
  }
  function clearAns(){for(const a of S.ans)a.userData.gone=true}
  function hurt(){S.hearts--;ui.hearts(S.hearts);ui.shake();if(S.hearts<=0){S.mode="dead";const w=critters.some(c=>c.kind!=="veg")||S.scared>0?(critters.some(c=>c.kind==="auntie")?4800:2600):600;const wb=S.inWater?(S.inWater.br||S.qBr):null;setTimeout(()=>ui.lose(S.st,()=>{clearCritters();S.hearts=3;ui.hearts(3);clearAns();S.mode="walk";stage(S.st);if(wb){S.x=wb.x0-.3;S.y=0;P.rotation.z=0;held.l=held.r=0;setDir();S.wait=1;S.face=1}}),w)}else if(S.mode==="jumping"){S.mode="walk";afterAnswer(false)}}
  const bursts=[];
  /* ฟองน้ำ หยดน้ำ ใช้รูปทรงกับวัสดุร่วมกัน ไม่สร้างใหม่ทุกเม็ด (เกิดหลายเม็ดต่อวินาที) */
  const bubG=new THREE.SphereGeometry(1,6,4),bubM=M(0xffffff,{transparent:true,opacity:.8}),dripM=M(0x9fdcff,{transparent:true,opacity:.85,emissive:0x2a6a8a});
  const pooled=(mat,r)=>{const m=new THREE.Mesh(bubG,mat);m.scale.setScalar(r);m.userData.keep=1;return m};
  function burst(pos){for(let i=0;i<16;i++){const s=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),M(pick([0xffd400,0xff6fa5,0x7dd3fc,0xa3e635]),{emissive:0x332200}));s.position.copy(pos);s.userData.v=new THREE.Vector3(rand(-2.5,2.5),rand(2,5),rand(-1.5,1.5));s.userData.life=1;world.add(s);bursts.push(s)}}
  /* ตอบผิดในบ้านผีสิง: ผีโผล่จากพื้นพุ่งเข้าหาจอ (ข้อละตัว) */
  const ghosts=[],ripples=[];
  function scare(){if(biomeOf(S.st)!=="haunted")return;const n=Math.max(0,S.qn-1),cyc=["lady","krasue","west","krahang","lady","west"][n%6],gh=cyc==="lady"?ladyGhost():cyc==="krasue"?krasue():cyc==="krahang"?krahang():ghost(Math.floor(n/3)%5);if(cyc!=="west"){setTimeout(()=>SND.play("thaighost"),250);setTimeout(()=>SND.play("howl"),450)}gh.position.set(S.x+1.4,-1.6,-.4);gh.scale.setScalar(.3);world.add(gh);ghosts.push({o:gh,t:0});SND.play("ghost");S.freeze=2.2;S.scared=2;setTimeout(()=>SND.play("gasp"),350);ui.scare&&ui.scare()}
  const critters=[],leeches=[];
  function punish(){const b=biomeOf(S.st);if(b==="haunted")return scare();if(b==="village")return critter("auntie");if(b==="farm")critter("bite","lion");else if(b==="waterfall")critter("bite","croc");else if(b==="thai")critter("chicks");else if(b==="beach")critter("crab");else if(b==="market")critter("pelt")}
  function critter(kind,only){const x0=S.x;
    if(kind==="pelt"){S.freeze=3;const parts=[P.userData.body,P.userData.arms[0],P.userData.arms[1],P.userData.legs[0],P.userData.legs[1]];for(let k=0;k<4;k++){const v=(k%2===0?pick(VEGLEAF):pick(VEGTHROW))();v.scale.setScalar(2.2);v.position.set(x0+2.6,1.4,-1.6);world.add(v);
        const part=parts[k===0?0:1+Math.floor(Math.random()*4)],lp=part===P.userData.body?new THREE.Vector3(rand(-.3,.3),k===0?2.35:rand(.9,1.6),.42):new THREE.Vector3(0,-rand(.2,.5),.12);critters.push({o:v,kind:"veg",t:-k*.6,from:v.position.clone(),part,lp})}
      {const vd=person({long:true,skirt:0x8e24aa,shirt:0xffcc80,basket:true});vd.position.set(x0+2.8,0,-1.8);vd.rotation.y=Math.PI+.6;world.add(vd);critters.push({o:vd,kind:"vendor",t:0,x0})}SND.play("whoosh");return}
    S.freeze=kind==="leech"?0:kind==="auntie"?4.4:kind==="chicks"?3:kind==="crab"?3.2:2.4;
    if(kind==="leech"){const l=leech(),a=-Math.PI/2+rand(-.5,.5);l.scale.setScalar(1.6);l.position.set(Math.sin(a)*.47,rand(.6,1.1),Math.cos(a)*.47);l.rotation.set(0,a,rand(-.4,.4));P.userData.body.add(l);leeches.push({o:l,t:0});SND.play("squish");return}
    if(kind==="chicks"){SND.play("hen");setTimeout(()=>SND.play("hen"),900);setTimeout(()=>SND.play("hen"),1800);for(let k=0;k<5;k++){const c=chicken(),a=k/5*Math.PI*2+rand(-.3,.3);c.scale.setScalar(1.3);c.position.set(x0+Math.cos(a)*6,0,Math.sin(a)*4);world.add(c);critters.push({o:c,kind,t:0,a,x0})}return}
    if(kind==="auntie"){const o=auntie();o.position.set(x0+1.4,0,-7);o.rotation.y=Math.PI/2;world.add(o);critters.push({o,kind,t:0,x0});SND.play("tsk");setTimeout(()=>SND.speak(o.userData.line),900);return}
    /* ปู: หนีบแขนทั้ง 2 ข้าง ถ้ายังผิดซ้ำก่อนตอบถูก มีปูมาหนีบขาทั้ง 2 ข้างด้วย */
    if(kind==="crab"){const u=P.userData;S.crabHits=(S.crabHits||0)+1;const want=[[u.arms[0],"arm",-1],[u.arms[1],"arm",1]];if(S.crabHits>=2)want.push([u.legs[0],"leg",-1],[u.legs[1],"leg",1]);let n=0;
      for(const[part,pk,side]of want){if(critters.some(c=>c.kind==="crab"&&c.part===part&&!c.off))continue;const o=crab();o.scale.setScalar(2.2);o.position.set(x0+7,0,.5+side*.35);o.rotation.y=Math.PI;world.add(o);critters.push({o,kind,t:-n*.35,x0,part,pk,side});n++}
      SND.play("pinch");return}
    const o=only==="croc"?croc():lion();setTimeout(()=>SND.play(o.userData.jaw?"growl":"bigroar"),150);o.position.set(x0+7,0,kind==="crab"?.5:.3);o.rotation.y=Math.PI;world.add(o);critters.push({o,kind,t:0,x0});
    }
  /* ด่านภาษาไทย ตอบผิด: ป้าข้างบ้านเดินมาเปรียบเทียบกับลูกป้า ข้อละประโยค ไม่ซ้ำจนครบ */
  const AUNT=["ลูกป้าจบปริญญาตรีแล้วนะ","ลูกป้าทำงานได้เงินเดือนสองหมื่นแล้วนะ","ลูกป้าแต่งงานแล้วนะ","ลูกป้าไม่อ่านก็สอบติด","ลูกป้าได้เกรดสี่ทุกวิชา",
    "ลูกป้าสอบติดตั้งแต่ครั้งแรกเลยนะ","ลูกป้าซื้อรถให้ป้าแล้วนะ","ลูกป้าเป็นตำรวจแล้วนะ","ลูกป้าตอบข้อนี้ได้ตั้งแต่ปอสี่","ลูกป้าอ่านหนังสือวันละสิบชั่วโมง","ลูกป้าซื้อบ้านแล้วนะ"];let auntDeck=[];
  function auntie(){const a=person({skirt:pick([0x8e24aa,0xd81b60,0x6d4c41]),shirt:pick([0xf8bbd0,0xfff176,0x80deea]),hair:0x9e9e9e,long:false});
    const bun=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),M(0x9e9e9e));bun.position.set(-.16,.16,0);a.userData.head.add(bun);
    const bag=new THREE.Mesh(new THREE.BoxGeometry(.28,.22,.1),M(0xc62828));bag.position.set(0,.85,-.36);a.add(bag);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:txt("ป้าข้างบ้าน",{size:60,color:"#ffffff",bg:"#d81b60",border:"#ffd23f",w:320,h:110,radius:30}),depthTest:false}));tag.scale.set(1.5,.52,1);tag.position.y=2.35;tag.renderOrder=21;a.add(tag);
    if(!auntDeck.length){const L=(api.aunt&&api.aunt())||AUNT;auntDeck=L.slice().sort(()=>Math.random()-.5)}const line=auntDeck.pop();
    const say=new THREE.Sprite(new THREE.SpriteMaterial({map:txt(line,{size:52,color:"#4a148c",bg:"#ffffff",border:"#d81b60",w:760,h:120,radius:44}),depthTest:false}));say.scale.set(3.4,.54,1);say.position.set(0,3.95,0);say.renderOrder=21;say.visible=false;a.add(say);
    a.userData.say=say;a.userData.line=line;return a}
  /* คืนหน่วยความจำการ์ดจอเมื่อเอาของออกจากฉาก (ไม่งั้นเล่นนาน ๆ บนมือถือหน่วยความจำเต็ม ของที่มีลายผิวจะกลายเป็นสีดำ) */
  function freeObj(o){if(!o)return;o.parent&&o.parent.remove(o);o.traverse(m=>{if(m.geometry)m.geometry.dispose();const ms=m.material?(Array.isArray(m.material)?m.material:[m.material]):[];for(const mt of ms){for(const k of["map","alphaMap","emissiveMap"])if(mt[k]&&mt[k]!==skyT)mt[k].dispose();mt.dispose()}})}
  function clearCritters(){S.scared=0;if(S.bang)S.bang.visible=false;P.userData.face.scale.set(1,1,1);for(const c of critters)freeObj(c.o);P.userData.arms[1].rotation.z=0;S.freeze=0;critters.length=0;for(const l of leeches)freeObj(l.o);leeches.length=0}
  function ripple(pos,r=.35){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,4,24),M(0xffffff,{transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;ring.position.copy(pos);world.add(ring);ripples.push({o:ring,t:0})}
  function splash(pos){const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.06,6,24),M(0xffffff,{transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;ring.position.copy(pos);world.add(ring);ripples.push({o:ring,t:0});for(let i=0;i<40;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(rand(.05,.11),6,4),M(pick([0xffffff,0xbfe9ff,0x7dd3fc]),{emissive:0x335566}));s.position.copy(pos);s.userData.v=new THREE.Vector3(rand(-1.6,1.6),rand(2.5,5),rand(-1,1.2));s.userData.life=.9;world.add(s);bursts.push(s)}}
  async function passArch(){
    S.mode="cheer";const st=S.st;burst(new THREE.Vector3(S.archX,2.5,0));if(S.arch&&S.arch.userData.tape)S.arch.userData.tape.visible=false;SND.play("clap");SND.play("sparkle");
    const r=await api.clear(st,S.got||0);S.got=0;ui.pts(0);ui.toast(st,r);if(S.hearts<3){S.hearts++;ui.hearts(S.hearts)}
    if(st>=(api.maxStage?api.maxStage():10)){setTimeout(()=>{S.mode="done";ui.finish&&ui.finish(st)},900);return}
    setTimeout(()=>{if(S.mode==="dead")return;const ga=S.arch;S.arch=null;if(ga){const sg=segs.find(g=>ga.position.x>=g.position.x&&ga.position.x<g.position.x+SEG);if(sg)sg.attach(ga)}stage(st+1);S.mode="walk"},900);
  }
  /* ควบคุม: ตอนมีคำถามแตะตัวเลข (หรือกด 1-4) ตอนเดินแตะจอ/เว้นวรรค/ลูกศรขึ้น เพื่อกระโดดเก็บเหรียญที่ลอยสูง */
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
  function hop(){S.wait=0;if(S.mode==="walk"&&S.y<=0.01&&!S.paused){S.hop={vy:7.5};SND.play("jump")}}
  function tap(e){
    const r=renderer.domElement.getBoundingClientRect();v2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    if(S.mode==="ask"){ray.setFromCamera(v2,cam);const hit=ray.intersectObjects(S.ans.filter(a=>!a.userData.gone),true)[0];
      if(hit){let o=hit.object;while(o&&o.userData.i===undefined)o=o.parent;if(o)choose(o.userData.i)}
      else{let best=-1,bd=1e9;S.ans.forEach((a,i)=>{const p=a.position.clone();world.localToWorld(p);p.project(cam);const d=Math.hypot(p.x-v2.x,p.y-v2.y);if(d<bd){bd=d;best=i}});if(bd<.25)choose(best)}
      return}
    hop();
  }
  /* ลากบนจอเพื่อหมุนกล้องดูรอบตัว 360 องศา ปล่อยแล้วค่อย ๆ กลับมุมเดิม แตะสั้น ๆ ยังเป็นการกระโดด/ตอบคำถาม */
  const view={yaw:0,pitch:0,drag:null,idle:0},camPiv=new THREE.Vector3(3,1.9,0),camS={lead:3,dist:10.5,ly:1.9,h:3.2};
  renderer.domElement.addEventListener("pointerdown",e=>{view.drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,moved:false,id:e.pointerId}});
  renderer.domElement.addEventListener("pointermove",e=>{const d=view.drag;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)>10)d.moved=true;
    if(d.moved){view.yaw=d.yaw-dx*.008;view.pitch=Math.max(-.25,Math.min(.6,d.pitch+dy*.004));view.idle=0}});
  renderer.domElement.addEventListener("pointerup",e=>{const d=view.drag;view.drag=null;if(d&&d.moved)return;tap(e)});
  renderer.domElement.addEventListener("pointercancel",()=>{view.drag=null});
  renderer.domElement.style.touchAction="none";
  const held={l:0,r:0};const setDir=()=>{S.dir=(held.r?1:0)-(held.l?1:0);if(S.dir)S.wait=0};
  function key(e){if(S.paused)return;if(S.mode==="ask"&&/^[1-4]$/.test(e.key))choose(+e.key-1);if(e.key===" "||e.key==="ArrowUp"){e.preventDefault();hop()}
    if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();held[e.key==="ArrowLeft"?"l":"r"]=1;setDir()}}
  function keyUp(e){if(e.key==="ArrowLeft"||e.key==="ArrowRight"){held[e.key==="ArrowLeft"?"l":"r"]=0;setDir()}}
  document.addEventListener("keyup",keyUp);
  document.addEventListener("keydown",key);
  function resize(){renderer.setSize(W(),H());cam.aspect=W()/H();cam.fov=W()<600?62:45;cam.updateProjectionMatrix()}
  addEventListener("resize",resize);resize();

  stage(S.st);ui.hearts(3);ui.pts(0);
  let last=performance.now(),raf=0;
  function tick(now){
    const dt0=Math.min(.05,(now-last)/1000);last=now;if(S.paused){raf=requestAnimationFrame(tick);return}const dt=dt0;S.t+=dt;
    /* เดินเอง: กดค้าง ◀ ▶ หรือลูกศรซ้ายขวา ถอยกลับไปเก็บเหรียญได้ แต่ไม่เกินจุดเริ่มด่านของฉากที่ยังโหลดอยู่ */
    if(S.freeze>0)S.freeze-=dt;const mv=S.mode==="cheer"?1:S.mode==="walk"&&!(S.freeze>0)&&!(S.wait&&!S.dir)?(S.dir<0?-1:S.dir>0?1.6:1):0,walking=mv!==0;if(mv)S.face=Math.sign(mv);
    if(walking){const minX=(segs.length?segs[0].position.x:S.x)+4;S.x=Math.max(minX,S.x+mv*S.speed*dt);if(mv>0)S.face=1;
      if(S.mode==="walk"&&!S.arch&&!S.hop&&!S.bq&&S.done<S.need&&biomeOf(S.st)==="canal"){const br=bridges.find(b=>b.seg.parent===world&&S.x>b.x0+.7&&S.x<b.x0+2);if(br)ask(br)}
      if(S.mode==="walk"&&!S.arch&&S.x>=S.nextQ&&!S.hop&&groundY(S.x)<.01&&!(S.freeze>0)&&!critters.some(c=>c.kind==="auntie"||c.kind==="chicks"||c.kind==="vendor"))ask();
      if(S.shrine&&!S.prayed&&S.mode==="walk"&&S.x>=S.shrineX+2.2){S.x=S.shrineX+2.2;S.mode="pray";ui.pray&&ui.pray(()=>{if(S.mode==="pray"){S.mode="bow";S.bow={t:0,rang:0}}})}
      if(S.arch&&S.mode==="walk"&&S.x>=S.archX-.3)passArch()}
    if(S.hop){S.hop.vy-=20*dt;S.y=Math.max(0,S.y+S.hop.vy*dt);if(S.y<=0)S.hop=null}
    if(S.mode==="jumping"&&S.jump){const j=S.jump;j.t+=dt/j.dur;const t=Math.min(1,j.t);S.x=j.from.x+(j.to.x-j.from.x)*t;S.y=j.from.y+(j.to.y-j.from.y)*t+Math.sin(Math.PI*t)*1.4;if(t>=1){S.jump=null;S.y=j.to.y;j.done()}}
    if(S.mode==="falling"){S.fall.vy-=18*dt;S.y=Math.max(0,S.y+S.fall.vy*dt);if(S.y<=0){S.mode="landed";S.afterFall&&S.afterFall()}}
    /* กันค้าง: อยู่ในน้ำแต่สถานะหลุดไปเป็นอย่างอื่น ให้ปีนขึ้นสะพาน  รอข้อใหม่ในน้ำนานเกินไป ให้ถามใหม่  ปีนนานเกินไป ให้จบการปีน */
    if(S.inWater&&S.mode!=="ask"&&S.mode!=="wet"&&S.mode!=="climb"&&S.mode!=="dead"&&S.mode!=="splash")climbOut();
    if(S.mode==="wet"&&S.inWater){S.wetT=(S.wetT||0)+dt;if(S.wetT>3){S.wetT=0;clearAns();ask(S.inWater.br,true)}}else S.wetT=0;
    if(S.mode==="climb"&&!S.climb&&S.inWater)climbOut();
    if(S.mode==="ask"){S.qT-=dt;ui.timer(Math.max(0,S.qT/S.qMax));if(S.qT<=0)choose(-1)}
    if(S.mode==="splash"){const sp=S.spl;sp.t+=dt;const t=sp.t,fy=sp.y+2.6*t-11*t*t,y=sp.hit?-.75+Math.sin(t*5)*.08:fy;S.z=Math.min(1,t/.6)*2.2;const mid=(sp.br.x0+sp.br.x1)/2,wc=sp.br.wx?sp.br.wx(2.2):mid,tx=Math.max(wc-.8,Math.min(wc+.8,sp.x)),fx=sp.x+(tx-sp.x)*Math.min(1,t/.6);P.position.set(fx,Math.max(-.75,y),S.z);P.rotation.z=sp.hit?Math.sin(t*4)*.25:Math.min(1,t*1.6)*.8;
      if(!sp.fs){sp.fs=1;SND.play("fall")}if(fy<.05&&!sp.hit){sp.hit=1;SND.play("plunge");splash(new THREE.Vector3(fx,.15,S.z));ui.say&&ui.say("ตกน้ำ! ตอบข้อใหม่ให้ถูกเพื่อขึ้นจากน้ำ");hurt()}
      if(sp.hit&&t>1.3&&!sp.asked&&S.mode==="splash"){sp.asked=1;S.x=fx;S.inWater={x:fx,br:sp.br};clearAns();ask(sp.br,true)}
      if(sp.hit){S.padT=(S.padT||0)+dt;if(S.padT>.6){S.padT=0;ripple(new THREE.Vector3(fx,.19,S.z));SND.play("paddle")}}
      if(sp.hit&&Math.random()<dt*6){const b=pooled(bubM,rand(.04,.08));b.position.set(fx+rand(-.4,.4),.1,S.z+rand(-.3,.3));b.userData.v=new THREE.Vector3(0,rand(.6,1.2),0);b.userData.life=.6;world.add(b);bursts.push(b)}}
    else if(S.mode==="climb"){const c=S.climb;c.t+=dt;const k=Math.min(1,c.t/1),x=c.x0+(c.tx-c.x0)*k;P.position.set(x,-.75+(groundY(x)+.75)*k+Math.sin(Math.PI*k)*1.6,2.2*(1-k));P.rotation.z=.25*(1-k);
      if(k>=1){S.x=c.tx;S.y=0;S.z=0;S.inWater=null;S.qBr=null;S.spl=null;P.rotation.z=0;S.mode="walk";held.l=held.r=0;setDir();S.wait=1;S.face=1;S.wet=4;SND.play("paddle");afterAnswer(true)}}
    else if(S.inWater){P.position.set(S.inWater.x,-.75+Math.sin(S.t*5)*.08,S.z);P.rotation.z=Math.sin(S.t*4)*.25;S.padT=(S.padT||0)+dt;if(S.padT>.7){S.padT=0;ripple(new THREE.Vector3(S.inWater.x,.19,S.z));SND.play("paddle")}if(Math.random()<dt*3){const b=pooled(bubM,rand(.04,.08));b.position.set(S.inWater.x+rand(-.4,.4),.1,S.z+rand(-.3,.3));b.userData.v=new THREE.Vector3(0,rand(.6,1.2),0);b.userData.life=.6;world.add(b);bursts.push(b)}}
    else{/* กันหลุดออกนอกทาง: ถ้าไม่ได้อยู่ในน้ำ ดึงกลับมากลางทางเสมอ */
      if(S.z){S.z=Math.abs(S.z)<.02?0:S.z*(1-Math.min(1,dt*5))}P.position.set(S.x,S.y+groundY(S.x),S.z);
      /* ตัวเปียก: น้ำหยดจากตัว เดินไปมีหยดน้ำตกลงพื้น สะบัดตัวช่วงแรก */
      if(S.wet>0){S.wet-=dt;if(S.wet>3.3)P.rotation.z=Math.sin(S.t*38)*.12*(S.wet-3.3)/.7;else if(S.wet>3.2)P.rotation.z=0;
        if(Math.random()<dt*16){const d=pooled(dripM,rand(.025,.045));d.scale.y*=1.6;d.position.set(P.position.x+rand(-.35,.35),P.position.y+rand(.3,2.1),P.position.z+rand(.05,.35));d.userData.v=new THREE.Vector3(rand(-.2,.2),-.4,0);d.userData.life=.45;world.add(d);bursts.push(d)}
        if(Math.random()<dt*2.5)SND.play("drip")}}
    const ud=P.userData,sw=walking&&!S.hop?Math.sin(S.t*11):0,air=S.mode==="jumping"||S.mode==="falling"||!!S.hop;
    ud.legs[0].rotation.x=air?-.6:sw*.7;ud.legs[1].rotation.x=air?.3:-sw*.7;ud.arms[0].rotation.x=air?-2.2:-sw*.6;ud.arms[1].rotation.x=air?-2.2:sw*.6;
    ud.body.position.y=.12+(walking?Math.abs(Math.sin(S.t*11))*.045:Math.sin(S.t*3)*.03);ud.body.rotation.z=walking?sw*.05:0;
    const face=S.mode==="pray"||S.mode==="bow"?Math.PI:S.mode==="ask"||S.mode==="dead"?.35:S.mode==="cheer"?S.t*8:walking?S.face*Math.PI/2:(S.face>0?Math.PI/2.6:-Math.PI/2.6);P.rotation.y+=(face-P.rotation.y)*(S.mode==="cheer"?1:Math.min(1,dt*8));
    ud.shadow.position.y=.02-S.y;if(ud.av)ud.av.position.y=(ud.avY||3.15)+Math.sin(S.t*3)*.05;ud.shadow.scale.setScalar(Math.max(.4,1-S.y*.25));
    for(let i=S.coins.length-1;i>=0;i--){const c=S.coins[i];c.rotation.y+=dt*3;
      if(c.userData.got){c.position.y+=dt*6;c.scale.multiplyScalar(1-dt*4);if(c.scale.x<.1){freeObj(c);S.coins.splice(i,1)}continue}
      if(Math.abs(c.position.x-S.x)<.55&&Math.abs(c.position.y-(S.y+1.1))<1){c.userData.got=1;S.got=(S.got||0)+1;ui.pts(S.got);SND.play("coin")}
      else if(c.position.x<S.x-40){freeObj(c);S.coins.splice(i,1)}}
    for(const a of S.ans){const u=a.userData;
      if(u.gone){a.scale.multiplyScalar(1-dt*5)}else if(u.drop){a.position.y-=dt*7;a.rotation.z+=dt*4}
      else{a.scale.setScalar(Math.min(1,a.scale.x+dt*5));a.position.y=u.base+Math.sin(S.t*2.4+u.i)*.12}}
    S.ans=S.ans.filter(a=>{if(a.scale.x<.04||a.position.y<-4){freeObj(a);return false}return true});
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.userData.v.y-=9*dt;b.position.addScaledVector(b.userData.v,dt);b.rotation.x+=dt*6;b.userData.life-=dt;if(b.userData.life<=0){b.userData.keep?world.remove(b):freeObj(b);bursts.splice(i,1)}}
    while(segX<S.x+60)addSeg();
    while(segs.length&&segs[0].position.x+SEG<S.x-45){freeObj(segs.shift())}
    for(const L of layers)for(const m of L.items){while(m.position.x<S.x-L.span/2)m.position.x+=L.span;while(m.position.x>S.x+L.span/2)m.position.x-=L.span}
    for(const m of layers[0].items)m.visible=biomeOf(S.st)!=="beach";
    for(const[li,pad]of[[1,30],[2,16]])for(const m of layers[li].items){const x=m.position.x;m.visible=!segs.some(g=>g.userData.beach&&x>g.position.x-pad&&x<g.position.x+SEG+pad)}
    stepFade(dt);themeCheck+=dt;if(themeCheck>20){themeCheck=0;loadWeather();const T=themeNow();if(T!==TH)fadeTo(T)}lamp.position.set(S.x+.6,2.6,2.4);lamp.intensity+=((TH.night?18:0)-lamp.intensity)*Math.min(1,dt*2);stars.position.x=S.x;rain.position.x=S.x;if(rainMat.opacity>0.01){const a=rainGeo.attributes.position.array;for(let k=0;k<RN;k++){let y=a[k*6+1]-22*dt;if(y<0)y+=18;a[k*6+1]=y;a[k*6+4]=y-.7}rainGeo.attributes.position.needsUpdate=true}const spp=fade?fade.cur.sp:TH.sunPos;sunSp.position.set(S.x+spp[0],spp[1],-170);
    for(const b of birds){b.position.x+=dt*2.2;if(b.position.x>S.x+30)b.position.x=S.x-30;b.position.y+=Math.sin(S.t*1.3+b.userData.ph)*dt*.4;for(const w of b.children)w.rotation.z=w.userData.s*Math.sin(S.t*8+b.userData.ph)*.6}
    for(const h of spinners)h.rotation.z+=dt*1.2;
    fallTex.offset.y+=dt*2.2;fallTexA.offset.y+=dt*1.6;fallTexB.offset.y+=dt*2.4;canalMat.map.offset.y-=dt*.35;canalRip.offset.y-=dt*.45;clearWater.opacity=.45+Math.sin(S.t*1.3)*.03;if(!clearWater.map&&canalMat.map){clearWater.map=canalMat.map;clearWater.needsUpdate=true}ground.position.x=S.x;
    {const on=biomeOf(S.st)==="beach"&&!TH.night;glit.visible=on;if(on){const a=glitGeo.attributes.position.array,sx=(fade?fade.cur.sp:TH.sunPos)[0];for(let k=0;k<GN;k++){if(Math.random()<.08||Math.abs(a[k*3]-S.x)>90){const z=-rand(14,150),sp=1.2+(-z)*.06;a[k*3]=S.x+3+sx*(-z/170)+rand(-sp,sp);a[k*3+1]=.3;a[k*3+2]=z}}glitGeo.attributes.position.needsUpdate=true;glitMat.opacity=.55+Math.sin(S.t*9)*.25;glitMat.color.set(TH.light)}}
    gearT+=dt;if(gearT>.5){gearT=0;applyGear()}if(GEAR.fan.visible)GEAR.fan.rotation.z=Math.sin(S.t*14)*.45;
    for(let i=chests.length-1;i>=0;i--){const c=chests[i];if(c.seg.parent!==world){chests.splice(i,1);continue}const u=c.o.userData;
      if(!c.open&&Math.abs(S.x-(c.seg.position.x+c.x))<.9&&S.mode!=="splash"){c.open=1;SND.play("chest");u.lk.visible=false;S.got=(S.got||0)+5;ui.pts(S.got);
        const wp=new THREE.Vector3(c.seg.position.x+c.x,.8,-1.75);for(let k=0;k<5;k++){const m=coinMesh();m.position.copy(wp);m.userData.v=new THREE.Vector3(rand(-1.2,1.2),rand(4,6),rand(.5,1.5));m.userData.life=1;m.scale.setScalar(.7);world.add(m);bursts.push(m)}
        if(S.hearts<3&&Math.random()<.25){S.hearts++;ui.hearts(S.hearts);SND.play("heart")}}
      if(c.open&&c.open<2){u.lid.rotation.x=Math.max(-1.9,u.lid.rotation.x-dt*7);u.glow.material.opacity=Math.max(0,u.glow.material.opacity-dt*1.5);if(u.lid.rotation.x<=-1.9)c.open=2}
      else if(!c.open)u.glow.scale.setScalar(.8+Math.sin(S.t*4)*.12)}
    for(const sh of shops){if(sh.shown||sh.seg.parent!==world)continue;if(Math.abs(S.x-(sh.seg.position.x+sh.x))<3){sh.shown=true;if(!owns(sh.id))ui.near&&ui.near(sh.id)}}
    for(let i=critters.length-1;i>=0;i--){const c=critters[i],o=c.o;c.t+=dt;const t=c.t;
      if(c.kind==="chicks"){const tx=c.x0+Math.cos(c.a)*.9,tz=Math.sin(c.a)*.7;if(t<1){o.position.x+=(tx-o.position.x)*Math.min(1,dt*4);o.position.z+=(tz-o.position.z)*Math.min(1,dt*4);o.rotation.y=-Math.atan2(tz-o.position.z,tx-o.position.x)}
        else if(t<3){o.rotation.y=-Math.atan2(-tz,c.x0-tx);o.userData.head.rotation.z=-Math.abs(Math.sin(t*14))*.9;if(Math.random()<dt*3)SND.play("peck");S.ouch=.2}
        else{o.position.x+=Math.cos(c.a)*dt*7;o.position.z+=Math.sin(c.a)*dt*5;o.rotation.y=-c.a}
        if(t>4.2){freeObj(o);critters.splice(i,1)}continue}
      if(c.kind==="auntie"){const u=o.userData,sw=Math.sin(t*8)*.5;
        u.say.visible=t>1.1&&t<5;
        if(t<1.2){o.position.z=-7+5.4*(t/1.2);o.position.x=S.x+1.9;o.rotation.y=-Math.PI/2;u.legs[0].rotation.z=sw;u.legs[1].rotation.z=-sw}
        else if(t<5){o.position.x+=(S.x+1.9-o.position.x)*Math.min(1,dt*6);u.legs[0].rotation.z=u.legs[1].rotation.z=0;u.arms[0].rotation.x=-2.3+Math.sin(t*10)*.25;o.rotation.y=Math.PI+Math.sin(t*2)*.15;u.head.rotation.z=Math.sin(t*6)*.08}
        else{u.arms[0].rotation.x=0;o.rotation.y=Math.PI/2;o.position.z-=dt*5;u.legs[0].rotation.z=sw;u.legs[1].rotation.z=-sw;if(t>7){freeObj(o);critters.splice(i,1)}}continue}
      if(c.kind==="vendor"){const u=o.userData;u.arms[1].rotation.x=-2.6+Math.abs(Math.sin(t*7))*2;u.say=null;if(t>2.6){o.position.z-=dt*4;o.rotation.y=Math.PI/2}if(t>3.9){freeObj(o);critters.splice(i,1)}continue}
      if(c.kind==="veg"){if(t<0)continue;if(!c.said){c.said=1;SND.speakEn("Wots!",{rate:.5,pitch:1.05})}if(t<.6){const k=t/.6,tp=new THREE.Vector3();c.part.localToWorld(tp.copy(c.lp));world.worldToLocal(tp);o.position.lerpVectors(c.from,tp,k);o.position.y+=Math.sin(Math.PI*k)*1.5;o.rotation.x+=dt*12}
        else{critters.splice(i,1);world.remove(o);c.part.add(o);o.position.copy(c.lp);o.rotation.set(rand(-.5,.5),rand(0,6),rand(-.5,.5));leeches.push({o,t:0,veg:1});SND.play("splat");S.ouch=.15}continue}
      if(c.kind==="crab"){const part=c.part,isArm=c.pk==="arm";
        if(t<.9){o.position.x=c.x0+7-6.3*(Math.max(0,t)/.9);o.position.y=Math.abs(Math.sin(t*20))*.05}
        else if(!c.off){if(!c.att){c.att=1;world.remove(o);part.add(o);if(isArm){o.scale.setScalar(1.5);o.position.set(0,-.75,0);o.rotation.set(0,0,Math.PI)}else{o.scale.setScalar(1.25);o.position.set(0,-.3,.17);o.rotation.set(0,Math.PI/2,0)}SND.play("pinch")}
          const hard=t<3.2;
          if(isArm){part.rotation.x=hard?-2.5+Math.sin(t*16+c.side)*.35:-.4+Math.sin(t*3+c.side)*.15;part.rotation.z=c.side*(hard?.3:.15);o.rotation.z=Math.PI+Math.sin(t*7)*.6}
          else{part.rotation.x=hard?Math.sin(t*30+c.side*1.5)*.35:Math.sin(t*4+c.side)*.1;o.rotation.z=Math.sin(t*7)*.3}
          if(hard){P.userData.body.rotation.z=Math.sin(t*20)*.06;if(c.side>0&&(!c.snd||t-c.snd>.6)){c.snd=t;SND.play("pinch")}S.ouch=.1}else if(c.side>0&&(!c.snd||t-c.snd>4)){c.snd=t;SND.play("pinch")}}
        else{if(c.att===1){c.att=2;c.t2=t;const wp=new THREE.Vector3();o.getWorldPosition(wp);part.remove(o);world.add(o);world.worldToLocal(wp);o.position.set(wp.x,0,.6);o.scale.setScalar(1.6);o.rotation.set(0,0,0);if(isArm)part.rotation.z=c.side*.35;else part.rotation.x=0}
          else if(!c.att){c.att=2;c.t2=t}
          o.position.x+=dt*6;o.position.y=Math.abs(Math.sin(t*20))*.05;if(t-c.t2>1.3){freeObj(o);critters.splice(i,1)}}
        continue}
      const stop=c.x0+(c.kind==="crab"?.75:o.userData.jaw?1.05:1.15);
      if(t<.9){o.position.x=c.x0+7-(7-(stop-c.x0))*(t/.9);o.position.y=c.kind==="crab"?Math.abs(Math.sin(t*20))*.05:0}
      else if(t<2.1){const k=Math.sin((t-.9)*12);if(o.userData.jaw)o.userData.jaw.rotation.z=Math.max(0,k)*.7;else if(o.userData.head){o.userData.head.rotation.z=-.7+k*.25;o.userData.head.position.x=.8+Math.max(0,k)*.15}else o.rotation.z=k*.08;
        const lg=P.userData.legs[0];lg.rotation.x=Math.sin(t*30)*.25;
        if(!c.snd||t-c.snd>.5){c.snd=t;SND.play(c.kind==="crab"?"pinch":"chomp");S.ouch=.35}}
      else{o.rotation.y=0;o.position.x+=dt*8;if(t>3.2){freeObj(o);critters.splice(i,1)}}}
    for(let i=leeches.length-1;i>=0;i--){const l=leeches[i];l.t+=dt;if(l.drop||(!l.veg&&l.t>12)){l.o.position.y-=dt*3;if(l.o.position.y<-.5){freeObj(l.o);leeches.splice(i,1)}continue}if(l.veg)continue;if(l.o.position.y<1.7)l.o.position.y+=dt*.06;{const u=l.o.userData,c=(l.t*1.4+i)%1,hump=Math.sin(Math.PI*c);u.segs.forEach((sg,k)=>{const f=k/8;sg.position.set(0,f*(.42-.18*hump),Math.sin(Math.PI*f)*hump*.13)});u.mouth.position.set(0,.43-.18*hump,.02)}}
    if(S.scared>0){S.scared-=dt;const u=P.userData,k=Math.min(1,(2-S.scared)*4);u.arms[0].rotation.x=u.arms[1].rotation.x=-2.7+Math.sin(S.t*40)*.15;u.arms[0].rotation.z=.5;u.arms[1].rotation.z=-.5;P.position.x+=Math.sin(S.t*55)*.05;
      P.position.y+=Math.max(0,Math.sin(Math.min(1,(2-S.scared)*2)*Math.PI))*.5;P.rotation.y=0;u.face.scale.set(1+k*.35,1+k*.45,1);if(!S.bang){S.bang=new THREE.Sprite(new THREE.SpriteMaterial({map:txt("!!",{size:90,color:"#ffffff",bg:"#e53935",border:"#ffd23f",w:180,h:128,radius:40}),depthTest:false}));S.bang.scale.set(.8,.57,1);S.bang.renderOrder=26;S.bang.position.set(.55,2.75,0);P.add(S.bang)}S.bang.visible=true;
      if(S.scared<=0){u.arms[0].rotation.z=u.arms[1].rotation.z=0;u.face.scale.set(1,1,1);S.bang.visible=false}}
    /* สีหน้า: กลัว > เจ็บ > ดีใจ > ปกติ */
    {if(S.joy>0)S.joy-=dt;const hurtNow=S.ouch>0||!!S.inWater||S.mode==="splash"||S.mode==="wet"||S.mode==="dead"||leeches.some(l=>!l.drop&&!l.veg)||critters.some(c=>c.kind==="crab"&&c.att===1&&!c.off);
      P.userData.expr(S.scared>0?"scared":hurtNow?"hurt":(S.joy>0||S.mode==="cheer")?"happy":"normal")}
    if(S.ouch>0){S.ouch-=dt;P.position.x+=Math.sin(S.t*70)*.05;P.position.y+=Math.abs(Math.sin(S.t*20))*.06}
    if(S.shrine){const u=S.shrine.userData;u.aura.material.opacity=.55+Math.sin(S.t*2)*.2;u.smoke.position.y=1.2+((S.t*.4)%1)*1.4;u.smoke.material.opacity=.5*(1-((S.t*.4)%1))}
    if(S.mode==="bow"){const b=S.bow,u=P.userData;if(!b.ch){b.ch=1;b.ph="chant";SND.play("chant");if(!SND.speak("นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ",false,{pitch:.35,rate:.55,onend:()=>{b.done=1}}))b.done=1}b.t+=dt;
      /* ไหว้พระ: พนมมือยื่นไปข้างหน้า ก้มกราบค้างไว้ฟังพระสวดนะโมจนจบ แล้วน้องอธิษฐาน "ขอให้สอบติด" 3 ครั้ง กราบทุกครั้ง */
      u.arms.forEach((a,i)=>{const s2=i?1:-1;a.rotation.set(-1.45,0,-s2*.5)});
      if(b.t>.5&&!b.rang){b.rang=1;SND.play("bell");burst(new THREE.Vector3(S.shrineX+2.2,2.6,-3))}
      if(b.ph==="chant"){u.body.rotation.x+=(.62-u.body.rotation.x)*Math.min(1,dt*4);if((b.done&&b.t>2)||b.t>16){b.ph="wish";b.n=-1;b.pt=0}}
      else{b.pt+=dt;const wish=b.n<0,R=wish?2.4:1.7;if(!b["s"+b.n]){b["s"+b.n]=1;SND.speak(wish?"ขอให้สอบติด":"สาธุ",false,{pitch:1.35,rate:wish?.95:.8})}
        /* ลุกขึ้นพนมมืออธิษฐาน "ขอให้สอบติด" 1 ครั้ง แล้วก้มกราบ 3 ครั้ง พูด "สาธุ" ทุกครั้งที่กราบ */
        const q=b.pt/R;u.body.rotation.x=wish?.62*(1-Math.min(1,q/.25)):.62*Math.sin(Math.min(1,q/.85)*Math.PI);
        if(b.pt>=R){b.n++;b.pt=0;if(b.n>=3){u.body.rotation.x=0;u.arms.forEach((a,i)=>a.rotation.set(0,0,(i?1:-1)*.35));S.prayed=true;S.mode="walk";SND.play("sparkle");burst(new THREE.Vector3(S.shrineX+2.2,3,-3.2));ui.say&&ui.say("ขอให้สอบติด สมหวังทุกประการ")}}}}
    for(let i=ripples.length-1;i>=0;i--){const R=ripples[i];R.t+=dt;R.o.scale.setScalar(1+R.t*3);R.o.material.opacity=Math.max(0,.9-R.t*.8);if(R.t>1.1){freeObj(R.o);ripples.splice(i,1)}}
    for(let i=ghosts.length-1;i>=0;i--){const G=ghosts[i];G.t+=dt;const t=G.t,o=G.o;
      /* ผีโผล่ขึ้นตรงหน้าน้อง (ด้านขวา ไม่ทับตัว) พุ่งเข้าหานิดหนึ่ง แล้วลอยออกไปทางขวา */
      const gx=S.x+2;if(t<.45){const k=t/.45;o.position.set(gx,-1.6+k*2.6,.5);o.scale.setScalar(.3+k*.9);o.rotation.y=-.5}
      else if(t<1.1){const k=(t-.45)/.65;o.position.set(gx-.25*Math.sin(k*Math.PI),1+Math.sin(t*14)*.1,.5+.4*k);o.scale.setScalar(1.2+.15*Math.sin(k*Math.PI));o.rotation.z=Math.sin(t*10)*.15}
      else{const k=Math.min(1,(t-1.1)/.8);o.position.set(gx+k*k*7,1+k*1.2,.9);o.rotation.z=-.3*k;o.traverse(m=>{if(m.material){m.material.transparent=true;m.material.opacity=(1-k*k)*.92}})}
      if(o.userData.wings){const f=Math.sin(t*18)*.7;o.userData.wings[0].rotation.y=f;o.userData.wings[1].rotation.y=-f}if(o.userData.thai===2){o.rotation.y=Math.sin(t*2)*.15;o.userData.halo.material.opacity=.5*(.7+Math.random()*.3)}if(o.userData.thai===1){o.rotation.y=Math.sin(t*3)*.3;const fl=Math.random()<.25?.25:1+Math.sin(t*37)*.3;for(const m of o.userData.glows)m.emissiveIntensity=1.3*fl;o.userData.light.intensity=4*fl;o.userData.halo.material.opacity=.6*fl}
      if(t>1.9){freeObj(o);ghosts.splice(i,1)}}
    for(let i=anim.length-1;i>=0;i--){const a=anim[i];if(!live(a)){anim.splice(i,1);continue}const o=a.obj,t=S.t+a.ph;
      if(a.kind==="fish"){const c=(t*a.sp)%1;if(c<.08){const k=c/.08;o.visible=true;o.position.set(a.x+Math.sin(a.ph)*.6,Math.sin(Math.PI*k)*1.1-.05,a.z+(k-.5)*1.4);o.rotation.set(0,Math.PI/2,(.5-k)*2.4)}else o.visible=false}
      else if(a.kind==="graze"){const h=o.userData.head,c=(t*.25)%1;h.rotation.z=c<.6?-.75+Math.sin(t*6)*.06:-.1}
      else if(a.kind==="boat"){o.position.y=Math.sin(t*1.4)*.12;o.rotation.z=Math.sin(t*1.1)*.06}
      else if(a.kind==="crab"){o.position.x=a.x0+Math.sin(t*.9)*1.1;o.position.y=Math.abs(Math.sin(t*9))*.03}
      else if(a.kind==="squid"){o.position.y=Math.abs(Math.sin(t*2))*.18;for(const [k,tt] of o.userData.ts.entries())tt.rotation.y=Math.sin(t*4+k)*.4}
      else if(a.kind==="sea"){const pa=o.geometry.attributes.position,ar=pa.array,bs=a.base;for(let v=0;v<ar.length;v+=3){const wx=a.gx+bs[v],z=bs[v+2],far=Math.min(1,Math.max(0,(shoreZ(wx)-z)/6));const sw=Math.sin(wx*.18+z*.55+S.t*1.3);ar[v+1]=.13+far*(.08*(sw*sw*sw+1)+.035*(Math.sin(wx*.7+S.t*1.6+z*.35)+1)+.025*(Math.sin(wx*.23-S.t*1.1+z*.6)+1))*(1+Math.min(1,(shoreZ(wx)-z)/40))}pa.needsUpdate=true;if((S.t*10|0)%3===0)o.geometry.computeVertexNormals()}
      else if(a.kind==="breaker"){const c=((S.t*.18+a.ph)%1);o.position.z=-9*(1-c);o.position.y=Math.sin(Math.PI*c)*.15;o.material.opacity=Math.sin(Math.PI*c)*.8;o.scale.z=1+c}
      else if(a.kind==="foam2"){const k=(Math.sin(S.t*1.4)+1)/2;o.position.z=.25-k*.5;o.material.opacity=.45+k*.45}
      else if(a.kind==="koi"){const L=a.len||48,z0=a.z0!=null?a.z0:-36,z=z0+((t*a.sp)%1+1)%1*L,zz=a.local?z:z;o.position.set(a.fx(zz)+a.off+Math.sin(t*.9)*.25,a.y||.1,zz);o.rotation.set(0,-Math.PI/2+Math.cos(t*.9)*.3,Math.sin(t*3)*.05)}
      else if(a.kind==="monk"){o.userData.head.rotation.x=Math.sin(t*.8)*.05}
      else if(a.kind==="hoe"){const c=(t*1.1)%1,k=c<.4?c/.4:1-(c-.4)/.6;o.userData.arms[1].rotation.z=.8-k*2.4;o.userData.arms[0].rotation.z=.6-k*2;o.rotation.z=-k*.25}
      else if(a.kind==="plant"){o.rotation.z=-.85;o.position.y=-.15;const k=Math.sin(t*2.5);o.userData.arms[0].rotation.z=o.userData.arms[1].rotation.z=.3+Math.max(0,k)*.5}
      else if(a.kind==="water"){o.userData.arms[1].rotation.z=1.1+Math.sin(t*1.5)*.15;o.userData.arms[1].rotation.x=-.2}
      else if(a.kind==="broom"){const k=Math.sin(t*3);a.br.rotation.z=-.6+k*.4;o.rotation.z=-.2+k*.05}
      else if(a.kind==="scrub"){const k=Math.sin(t*6);o.userData.arms[0].rotation.z=1.1+k*.25;o.userData.arms[1].rotation.z=1.1-k*.25}
      else if(a.kind==="cloth"){o.rotation.y=Math.sin(t*1.7)*.3}
      else if(a.kind==="sweep"){const k=Math.sin(t*2.4);o.userData.arms[1].rotation.z=.55+k*.35;o.userData.arms[0].rotation.z=.75+k*.3;o.rotation.y=a.ry+k*.15;o.rotation.z=.08}
      else if(a.kind==="offer"){const u=o.userData,c=(t*.35)%1,k=c<.5?Math.sin(c*2*Math.PI):0;u.arms[0].rotation.z=u.arms[1].rotation.z=.4+k*.8;o.rotation.z=-k*.12}
      else if(a.kind==="wave"){const P=o.geometry.attributes.position;if(!o.userData.base)o.userData.base=P.array.slice();const B0=o.userData.base,tt=S.t;for(let v=0;v<P.count;v++){const x=B0[v*3],z=B0[v*3+2];P.array[v*3+1]=B0[v*3+1]+Math.sin(z*1.7+tt*2.2+x*.8)*.022+Math.sin(z*3.1-tt*1.6)*.01}P.needsUpdate=true;if(((S.t*10)|0)%3===0)o.geometry.computeVertexNormals()}
      else if(a.kind==="weed"){for(const [k,c] of o.children.entries())c.rotation.z=Math.sin(t*1.6+k)*.25}
      else if(a.kind==="swim"){const q=t*a.sp;o.position.set(a.x0+Math.cos(q)*a.r,a.y0+Math.sin(q*2)*.05,a.z0+Math.sin(q)*a.r*.6);o.rotation.y=-q-Math.PI/2}
      else if(a.kind==="walker"){const ph=t*a.sp,v=Math.cos(ph);o.position.x=a.x0+Math.sin(ph)*a.rg;o.rotation.y=v>=0?0:Math.PI;const sw=Math.sin(S.t*7+a.ph)*.5,u=o.userData;u.legs[0].rotation.z=sw;u.legs[1].rotation.z=-sw;u.arms[0].rotation.z=-sw*.8;u.arms[1].rotation.z=sw*.8}
      else if(a.kind==="wave"){const u=o.userData,c=(t*.3)%1;u.arms[1].rotation.x=c<.45?-2.5+Math.sin(t*9)*.35:0;u.head.rotation.y=Math.sin(t*.7)*.3}
      else if(a.kind==="mist"){o.position.y=a.y0+((t*.25)%1)*1.2;o.material.opacity=.7*(1-((t*.25)%1))}
      else if(a.kind==="wisp"){o.position.y=a.y0+Math.sin(t*1.6)*.35;o.position.x=a.x0+Math.sin(t*.5)*1.2}
      else if(a.kind==="bat"){o.position.set(a.x0+Math.sin(t*.8)*2.5,a.y0+Math.sin(t*2.3)*.4,a.z0+Math.cos(t*.8)*1.5);o.rotation.y=-Math.atan2(Math.cos(t*.8)*2,-Math.sin(t*.8)*1.2);const f=Math.sin(t*16)*.7;o.userData.ws[0].rotation.y=f;o.userData.ws[1].rotation.y=-f}
      else if(a.kind==="foam"){o.scale.z=1+Math.sin(t*1.6)*.6;o.position.z=-6.6+Math.sin(t*1.6)*.35}}
    /* กล้องมองจากด้านข้าง ตามน้องดินสอไปทางขวา ให้ตัวอยู่ค่อนซ้ายของจอ */
    const narrow=W()<600,asking=S.mode==="ask"||S.mode==="jumping"||S.mode==="falling";
    const asp=Math.max(.3,W()/H()),fitD=hw=>hw/(Math.tan(cam.fov*Math.PI/360)*asp),beachW=biomeOf(S.st)==="beach"&&!asking,back=S.mode==="walk"&&S.dir<0,lead=S.inWater||S.mode==="splash"?0:narrow?(asking?3.6:back?-.4:2.2):(asking?4:back?-.6:3),dist=(narrow?(asking||S.inWater?Math.max(14,fitD(5.6)):Math.max(11,fitD(4.4))):(asking?12:10.5))*(beachW?1.45:1);
    const ly=narrow?2.95:1.9;if(!view.drag){view.idle+=dt;if(view.idle>2.5){view.yaw*=1-Math.min(1,dt*2.5);view.pitch*=1-Math.min(1,dt*2.5)}}
    /* กล้องยึดตำแหน่งน้องดินสอแนวนอนตรง ๆ (ไม่หน่วง) จึงไม่ส่ายไปมา ค่อย ๆ ปรับเฉพาะระยะนำหน้า ความไกล และความสูง */
    const kS=1-Math.exp(-dt*(view.drag?12:2.2));camS.lead+=(lead-camS.lead)*kS;camS.dist+=(dist-camS.dist)*kS;camS.ly+=(ly-camS.ly)*kS;camS.h+=(((narrow?3.35:3.2)+(beachW?1.6:0)+S.y*.2)-camS.h)*(1-Math.exp(-dt*4));
    const px=(S.mode==="splash"||S.mode==="climb"||S.inWater)?P.position.x:S.x,piv=new THREE.Vector3(px+camS.lead,camS.ly,0),off=new THREE.Vector3(0,camS.h-camS.ly+view.pitch*camS.dist,camS.dist).applyAxisAngle(new THREE.Vector3(0,1,0),view.yaw);
    cam.position.copy(piv).add(off);camPiv.copy(piv);cam.lookAt(camPiv);
    /* เงา: ขยับแหล่งแสงเป็นช่วง ๆ ไม่ขยับทุกเฟรม เงาจะได้ไม่สั่นระยิบ */
    const sx=Math.round(S.x/2)*2;sun.position.set(sx-4,16,10);sun.target.position.set(sx+4,0,0);
    renderer.render(scene,cam);raf=requestAnimationFrame(tick);
  }
  /* เริ่มด่านที่เลือกใหม่ทั้งฉาก (ใช้ตอนเลือกด่านก่อนกด START) */
  function restart(n){for(const g of segs)freeObj(g);segs.length=0;anim.length=0;bridges.length=0;chests.length=0;shops.length=0;segX=-20;segN=0;lastB=null;
    for(const c of S.coins)freeObj(c);S.coins.length=0;for(const a of S.ans)freeObj(a);S.ans=[];if(S.arch){freeObj(S.arch);S.arch=null}if(S.shrine){freeObj(S.shrine);S.shrine=null}clearCritters();
    Object.assign(S,{inWater:null,climb:null,x:0,y:0,z:0,mode:"walk",hop:null,jump:null,fall:null,spl:null,qBr:null,hearts:3,qn:0});ui.hearts(3);P.rotation.z=0;curBiome=biomeOf(n);for(let i=0;i<9;i++)addSeg();stage(n);if(fade){fade.t=1;stepFade(0)}{const nw=W()<600,ly=nw?2.3:1.9;camPiv.set(S.x+(nw?2.2:3),ly,0);Object.assign(camS,{lead:nw?2.2:3,dist:nw?11:10.5,ly,h:nw?3.0:3.2});cam.position.set(camPiv.x,nw?3.0:3.2,nw?11:10.5);cam.lookAt(camPiv)}renderer.render(scene,cam)}
  raf=requestAnimationFrame(tick);
  return {hold(side,on){held[side]=on?1:0;setDir()},hop,pause(v){S.paused=!!v;if(v){held.l=held.r=0;setDir()}},stop(){SND.stop();cancelAnimationFrame(raf);document.removeEventListener("keydown",key);document.removeEventListener("keyup",keyUp);removeEventListener("resize",resize);renderer.dispose();renderer.domElement.remove()},debug:()=>({...S,hasArch:!!S.arch,np:S.ans.length,gy:groundY(S.x),biome:biomeOf(S.st),pz:+P.position.z.toFixed(2),py:+P.position.y.toFixed(2),haunt:TH===HAUNT,fadeT:fade?fade.t:-1,ghosts:ghosts.length,yaw:view.yaw,mem:{...renderer.info.memory}}),goStage:n=>stage(n),restart,choose:i=>choose(i),punish,_almost:()=>{S.done=Math.max(0,S.need-1);S.nextQ=S.x+3},_hearts:n=>{S.hearts=n},_scare:v=>{S.qn=v+1;scare()},_crit:()=>critters.map(c=>c.kind+":"+(c.att||0)+":"+(c.o.parent===world?"w":"arm")+":"+c.t.toFixed(1)),refreshGear:()=>{gearT=1},look:(y,p=0)=>{view.yaw=y;view.pitch=p;view.idle=-999},warp:dx=>{S.x+=dx;S.nextQ=S.x+30;while(segX<S.x+60)addSeg()}};
}
