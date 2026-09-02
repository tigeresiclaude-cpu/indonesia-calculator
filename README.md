# Indonesia – Merger Bid Calculator

เครื่องคำนวณราคาประมูลควบรวมบริษัท (**Phase 3 Merger**) สำหรับบอร์ดเกม *Indonesia* ฉบับที่ 3

เว็บสถิตล้วน ไม่มี build step ไม่มี dependency — เปิดไฟล์ HTML ได้ตรง ๆ หรือวางบน static host ที่ไหนก็ได้

## โครงสร้าง

```
index.html                      เลือกหน้าตามขนาดจอ (?v=desktop / ?v=mobile เพื่อบังคับ)
merger-calculator.html          หน้าจอใหญ่ — เลื่อนได้ ข้อมูลละเอียด
merger-calculator-mobile.html   มือถือ — จัดพอดี 1 หน้าจอ ไม่ต้องเลื่อน
assets/
  favicon.svg
  css/
    base.css       design token · สีสินค้า · bid pill · picker  ← ใช้ร่วมกัน
    desktop.css    layout เฉพาะหน้าจอใหญ่
    mobile.css     layout เฉพาะมือถือ
  js/
    merger-core.js  กฎเกมและสูตรทั้งหมด (ไม่แตะ DOM)          ← ใช้ร่วมกัน
    picker.js       วงล้อเลือกราคา                             ← ใช้ร่วมกัน
    app-desktop.js  ต่อ DOM ของหน้าจอใหญ่
    app-mobile.js   ต่อ DOM ของมือถือ
```

**จะแก้กฎเกม แก้ที่ `assets/js/merger-core.js` ที่เดียว** มีผลทั้งสองหน้า

## กฎที่ใช้คำนวณ

| หัวข้อ | สูตร |
|---|---|
| Nominal (ราคาขั้นต่ำ) | (ชิ้นของ A + ชิ้นของ B) × ราคาต่อชิ้น |
| Increment (ขั้นละ) | ชิ้นของ A + ชิ้นของ B |
| ส่วนแบ่ง | แบ่งตามสัดส่วนจำนวนชิ้น · ปัดให้ A แล้วยกเศษให้ B เพื่อให้รวมเท่ากับราคาที่ชนะพอดี |

ราคาต่อชิ้น: เรือ 10 · ข้าว 20 · เครื่องเทศ 25 · ยาง 30 · ข้าวกล่อง 35 · น้ำมัน 40

การควบรวมทำได้ 2 แบบ — สินค้าประเภทเดียวกัน (Normal) หรือ ข้าว + เครื่องเทศ → ข้าวกล่อง (Siap Saji)
นอกจากนี้ถือว่า merge ไม่ได้

> **หมายเหตุ:** กรณี Siap Saji โค้ดคิดราคาต่อชิ้นที่ **25** (ค่าเดียวกับเครื่องเทศ) ไม่ใช่ 35 ตามราคาข้าวกล่อง
> ค่านี้ยกมาจากเวอร์ชันเดิมตามเดิม — ถ้าเป็นความเข้าใจผิดเรื่องกฎ แก้ที่ `SIAP_SAJI_UNIT_VALUE` ใน `merger-core.js`

## รันในเครื่อง

ต้องเสิร์ฟผ่าน http (ไม่ใช่ `file://`) เพราะแยกไฟล์ CSS/JS ออกมาแล้ว

```bash
python -m http.server 8000
```

แล้วเปิด http://localhost:8000

## Deploy

**GitHub Pages** — Settings → Pages → Source: `Deploy from a branch` → branch `main`, folder `/ (root)`
ไฟล์ `.nojekyll` มีไว้กันไม่ให้ Jekyll ประมวลผลโฟลเดอร์ `assets/`

ใช้กับ Netlify / Vercel / Cloudflare Pages ได้เหมือนกัน — ตั้ง publish directory เป็น root และไม่ต้องมี build command
