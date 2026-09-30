#!/bin/sh
# สร้างหน้าทดลอง preview/ จากไฟล์เว็บที่ root (ใช้ Firebase ชุดเดียวกับเว็บจริง)
# ติดตั้งลงเครื่องแยกจากแอปจริงได้ ชื่อแอป "กะสอบ ทดลอง" และมีป้าย "หน้าทดลอง" มุมจอ
set -e
cd "$(dirname "$0")/.."
rm -rf preview && mkdir preview
cp index.html admin.html sw.js *.png *.svg preview/
sed -e 's/"name": "KASORB TEST"/"name": "KASORB TEST (ทดลอง)"/' -e 's/"short_name": "กะสอบ"/"short_name": "กะสอบ ทดลอง"/' manifest.webmanifest > preview/manifest.webmanifest
sed -e 's/"name": "กะสอบ แอดมิน"/"name": "กะสอบ แอดมิน (ทดลอง)"/' -e 's/"short_name": "แอดมิน"/"short_name": "แอดมิน ทดลอง"/' admin.webmanifest > preview/admin.webmanifest
BADGE='<div style="position:fixed;left:8px;bottom:8px;z-index:99999;padding:3px 9px;border-radius:999px;background:#7c3aed;color:#fff;font:700 11px sans-serif;pointer-events:none;opacity:.9">หน้าทดลอง</div>'
for f in preview/index.html preview/admin.html; do
  python3 - "$f" "$BADGE" <<'PY'
import sys;p,b=sys.argv[1],sys.argv[2];s=open(p,encoding="utf-8").read()
s=s.replace("<title>","<title>[ทดลอง] ",1)
i=s.rfind("</body>");s=s[:i]+b+s[i:] if i>=0 else s+b
open(p,"w",encoding="utf-8").write(s)
PY
done
echo "preview/ พร้อมแล้ว"
