#!/bin/sh
# สร้างหน้าทดลอง preview/ จากไฟล์เว็บที่ root (ใช้ Firebase ชุดเดียวกับเว็บจริง)
# ติดตั้งลงเครื่องแยกจากแอปจริงได้ ชื่อแอป "กะสอบ ทดลอง" และมีป้าย "หน้าทดลอง" มุมจอ
set -e
cd "$(dirname "$0")/.."
keep=$(mktemp -d); for d in chars vendor; do if [ ! -d "$d" ] && [ -d "preview/$d" ]; then cp -r "preview/$d" "$keep"/; fi; done
for f in preview/*.js; do b=$(basename "$f"); [ -f "$b" ] || cp "$f" "$keep"/; done 2>/dev/null || true
rm -rf preview && mkdir preview
cp index.html admin.html sw.js *.png *.svg preview/
if ls *.js >/dev/null 2>&1; then for f in *.js; do [ "$f" = sw.js ] || cp "$f" preview/; done; fi
# รูปหัวตัวละคร: ใช้ของ root ถ้ามี ถ้ายังไม่เผยแพร่ ใช้ของหน้าทดลองเดิม (เก็บไว้ใน $keep ก่อนลบ preview)
for d in chars vendor; do if [ -d "$d" ]; then cp -r "$d" preview/; elif [ -d "$keep/$d" ]; then cp -r "$keep/$d" preview/; fi; done; cp "$keep"/*.js preview/ 2>/dev/null || true; rm -rf "$keep"
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
