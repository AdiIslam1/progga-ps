"use client";

interface StudentCard {
  id: string;
  name: string;
  surname: string;
  studentId: string | number;
  className: string;
  section: string | null;
  rollNo: number | null;
}

interface AdmitCardPrintButtonProps {
  students: StudentCard[];
  examTitle: string;
  year: number;
}

export default function AdmitCardPrintButton({ students, examTitle, year }: AdmitCardPrintButtonProps) {
  const handlePrint = () => {
    const origin = window.location.origin;

    const pages: StudentCard[][] = [];
    for (let i = 0; i < students.length; i += 4) {
      pages.push(students.slice(i, i + 4));
    }

    const cardHtml = (s: StudentCard) => `
<div class="card-slot">
<div class="card">
  <div class="card-inner">
    <div class="wm" style="background-image:url('${origin}/school-logo.jpg')"></div>

    <!-- Header: school name, exam, year, "Admit Card" -->
    <div class="header">
      <img src="${origin}/school-logo.jpg" class="logo" alt=""/>
      <div class="school-name">Progga Preparatory &amp; High School</div>
      <div class="exam-row">
        <span class="badge">${examTitle}</span>
        <span class="yr">${year}</span>
      </div>
      <div class="admit-lbl">Admit Card</div>
    </div>

    <div class="hdiv"></div>

    <!-- Student info -->
    <div class="fields">
      <div class="field">
        <span class="fl">Name</span>
        <span class="fv">${s.name} ${s.surname}</span>
        <span class="fd"></span>
      </div>
      <div class="field-row">
        <div class="field half">
          <span class="fl">Class</span>
          <span class="fv">Class ${s.className}</span>
          <span class="fd"></span>
        </div>
        <div class="field half">
          <span class="fl">Section</span>
          <span class="fv">${s.section || "—"}</span>
          <span class="fd"></span>
        </div>
        <div class="field half">
          <span class="fl">Roll No</span>
          <span class="fv">${s.rollNo ?? "—"}</span>
          <span class="fd"></span>
        </div>
      </div>
    </div>

    <div class="hdiv"></div>

    <!-- Signatures -->
    <div class="sigs">
      <div class="sig"><div class="sline"></div><div class="slbl">Accountant</div></div>
      <div class="sig"><div class="sline"></div><div class="slbl">Principal</div></div>
    </div>

  </div>
</div>
</div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<base href="${origin}/"/>
<title>Admit Cards</title>
<style>
*,*::before,*::after{
  box-sizing:border-box;margin:0;padding:0;
  -webkit-print-color-adjust:exact !important;
  print-color-adjust:exact !important;
  color-adjust:exact !important;
}
html,body{font-family:Arial,sans-serif;background:#fff;}
@page{size:A4 portrait;margin:8mm;}

.page{
  width:194mm;height:281mm;
  display:grid;
  grid-template-columns:95mm 95mm;
  grid-template-rows:138mm 138mm;
  gap:4mm;
  page-break-after:always;break-after:page;
}
.page:last-child{page-break-after:avoid;break-after:avoid;}

/* ── Portrait slot holding a landscape card rotated 90° CW ── */
.card-slot{
  width:95mm;height:138mm;
  position:relative;
  overflow:hidden;
}

/* Landscape card (138×95) centered in portrait slot (95×138), then rotated 90° CW.
   left=(95-138)/2=-21.5mm  top=(138-95)/2=21.5mm  keeps centers aligned. */
.card{
  width:138mm;height:95mm;
  position:absolute;
  left:-21.5mm;
  top:21.5mm;
  transform:rotate(90deg);
  transform-origin:center center;
  background-image:repeating-linear-gradient(
    -45deg,
    #1a5c1a 0px,#1a5c1a 3px,
    #3d8c3d 3px,#3d8c3d 7px
  );
  padding:3.5mm;
  overflow:hidden;
}

/* ── Inner card ── */
.card-inner{
  width:100%;height:100%;
  background:#fdf8ee;
  border:1px solid #2d7a2d;
  padding:3mm 4mm;
  display:flex;flex-direction:column;
  gap:0;
  position:relative;
  overflow:hidden;
}

/* Watermark */
.wm{
  position:absolute;inset:0;
  background-size:45mm;
  background-position:center;
  background-repeat:no-repeat;
  opacity:0.07;
  pointer-events:none;
}

/* ── Header ── */
.header{
  display:flex;flex-direction:column;align-items:center;
  gap:2mm;text-align:center;
  padding-bottom:3mm;
  flex-shrink:0;
}
.logo{width:14mm;height:14mm;border-radius:50%;object-fit:cover;}
.school-name{
  font-size:11pt;font-weight:900;
  text-transform:uppercase;letter-spacing:0.5px;
  color:#1a4a1a;line-height:1.3;
}
.exam-row{display:flex;align-items:center;gap:3mm;justify-content:center;}
.badge{
  display:inline-block;
  background-color:#b91c1c;color:#fff;
  font-size:9pt;font-weight:bold;
  padding:2px 8px;border-radius:8px;
  line-height:1.5;
}
.yr{font-size:9pt;font-weight:bold;color:#444;}
.admit-lbl{
  font-size:9pt;font-weight:bold;
  text-transform:uppercase;letter-spacing:1.5px;
  color:#2d5a2d;
  border:1px solid #2d7a2d;
  padding:1mm 6mm;
  border-radius:2mm;
}

/* ── Horizontal divider ── */
.hdiv{border-top:1px solid #2d7a2d;margin:2mm 0;flex-shrink:0;}

/* ── Student info ── */
.fields{flex:1;display:flex;flex-direction:column;justify-content:space-around;overflow:hidden;}
.field{display:flex;flex-direction:column;gap:1mm;}
.field-row{display:flex;gap:6mm;}
.half{flex:1;}
.fl{font-size:8pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.4px;color:#777;}
.fv{font-size:13pt;font-weight:bold;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fd{border-bottom:1.5px dashed #bbb;margin-top:1.5mm;}

/* ── Signatures ── */
.sigs{display:flex;gap:10mm;flex-shrink:0;padding-top:1.5mm;}
.sig{flex:1;display:flex;flex-direction:column;align-items:center;gap:1.5mm;}
.sline{width:100%;height:9mm;border-bottom:1px solid #444;}
.slbl{font-size:8pt;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#555;}
</style>
</head>
<body>
${pages.map((pg) => `<div class="page">${pg.map(cardHtml).join("")}</div>`).join("\n")}
<script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print admit cards."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 bg-lamaSky text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e40af] transition-colors"
    >
      🖨️ Print All Cards
    </button>
  );
}
