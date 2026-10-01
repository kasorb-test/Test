/*
  KASORB TEST: service worker สำหรับติดตั้งเว็บลงหน้าจอ (PWA)
  ไม่เก็บหน้าเว็บไว้ในเครื่อง ทุกครั้งโหลดจากเว็บจริง จึงเห็นเวอร์ชันล่าสุดเสมอ
*/
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
/* หน้าเว็บโหลดจากเว็บจริงทุกครั้ง ไม่ใช้สำเนาเก่าในเครื่อง (แอปบน iPad/iPhone เคยค้างหน้าเก่า) */
self.addEventListener("fetch",e=>{
  /* ไฟล์เกมก็โหลดใหม่เสมอ ไม่ใช้สำเนาเก่าในเครื่อง */
  if(/\/game3d\.js(\?|$)/.test(new URL(e.request.url).pathname+new URL(e.request.url).search)){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>fetch(e.request)));return}
  if(e.request.mode!=="navigate") return;
  e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>fetch(e.request)));
});
