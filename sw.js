/*
  KASORB TEST: service worker สำหรับติดตั้งเว็บลงหน้าจอ (PWA)
  ไม่เก็บหน้าเว็บไว้ในเครื่อง ทุกครั้งโหลดจากเว็บจริง จึงเห็นเวอร์ชันล่าสุดเสมอ
*/
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
