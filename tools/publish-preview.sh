#!/bin/sh
# เผยแพร่หน้าทดลองขึ้นเว็บจริง: คัดลอกไฟล์จาก preview/ กลับไปที่ root แล้วเอาป้าย "หน้าทดลอง" กับ [ทดลอง] ออก
set -e
cd "$(dirname "$0")/.."
for f in index.html admin.html; do
  python3 - "preview/$f" "$f" <<'PY'
import sys,re;s=open(sys.argv[1],encoding="utf-8").read()
s=s.replace("<title>[ทดลอง] ","<title>",1)
s=re.sub(r'<div style="position:fixed;left:8px;bottom:8px;z-index:99999;[^>]*>หน้าทดลอง</div>',"",s)
open(sys.argv[2],"w",encoding="utf-8").write(s)
PY
done
cp preview/sw.js .
for f in preview/*.png preview/*.svg; do cp "$f" .; done
echo "เผยแพร่ไฟล์จาก preview/ ขึ้นเว็บจริงแล้ว"
