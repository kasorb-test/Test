/*
  KASORB TEST: service worker สำหรับติดตั้งเว็บลงหน้าจอ (PWA)
  ไม่เก็บหน้าเว็บไว้ในเครื่อง ทุกครั้งโหลดจากเว็บจริง จึงเห็นเวอร์ชันล่าสุดเสมอ
*/
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
/* หน้าเว็บโหลดจากเว็บจริงทุกครั้ง ไม่ใช้สำเนาเก่าในเครื่อง (แอปบน iPad/iPhone เคยค้างหน้าเก่า) */
self.addEventListener("fetch",e=>{
  if(e.request.mode!=="navigate") return;
  e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>fetch(e.request)));
});
