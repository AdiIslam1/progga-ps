"use client";

interface StudentCard {
  id: string;
  name: string;
  surname: string;
  studentId: string | number;
  className: string | null;
  section: string | null;
  rollNo: number | null;
}

interface AdmitCardPrintButtonProps {
  students: StudentCard[];
  examTitle: string;
  year: number;
}

const chunkStudents = (students: StudentCard[], size: number) => {
  const pages: StudentCard[][] = [];
  for (let i = 0; i < students.length; i += size) {
    pages.push(students.slice(i, i + size));
  }
  return pages;
};

const displayValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text || "—";
};

export default function AdmitCardPrintButton({
  students,
  examTitle,
  year,
}: AdmitCardPrintButtonProps) {
  const pages = chunkStudents(students, 4);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="no-print flex items-center gap-2 bg-lamaSky text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e40af] transition-colors"
      >
        🖨️ Print All Cards
      </button>

      <div id="admit-cards-print-root" className="hidden">
        {pages.map((page, pageIndex) => (
          <div className="admit-print-page" key={`page-${pageIndex}`}>
            {page.map((student) => (
              <div className="admit-card-slot" key={student.id}>
                <div className="admit-card">
                  <div className="admit-card-inner">
                    <div className="admit-watermark" />

                    <div className="admit-header">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/school-logo.jpg" className="admit-logo" alt="" />
                      <div className="admit-school">Progga Preparatory &amp; High School</div>
                      <div className="admit-exam-row">
                        <span className="admit-badge">{examTitle}</span>
                        <span className="admit-year">{year}</span>
                      </div>
                      <div className="admit-title">Admit Card</div>
                    </div>

                    <div className="admit-divider" />

                    <div className="admit-fields">
                      <div className="admit-field">
                        <span className="admit-label">Name</span>
                        <span className="admit-value">
                          {displayValue(`${student.name} ${student.surname}`)}
                        </span>
                        <span className="admit-line" />
                      </div>

                      <div className="admit-field-row">
                        <div className="admit-field">
                          <span className="admit-label">Class</span>
                          <span className="admit-value">
                            Class {displayValue(student.className)}
                          </span>
                          <span className="admit-line" />
                        </div>
                        <div className="admit-field">
                          <span className="admit-label">Section</span>
                          <span className="admit-value">{displayValue(student.section)}</span>
                          <span className="admit-line" />
                        </div>
                        <div className="admit-field">
                          <span className="admit-label">Roll No</span>
                          <span className="admit-value">{displayValue(student.rollNo)}</span>
                          <span className="admit-line" />
                        </div>
                      </div>
                    </div>

                    <div className="admit-divider" />

                    <div className="admit-signatures">
                      <div className="admit-signature">
                        <div className="admit-signature-line" />
                        <div className="admit-signature-label">Accountant</div>
                      </div>
                      <div className="admit-signature">
                        <div className="admit-signature-line" />
                        <div className="admit-signature-label">Principal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4 portrait; margin: 8mm; }

              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .h-screen,
              .overflow-y-auto {
                height: auto !important;
                overflow: visible !important;
              }

              body * {
                visibility: hidden !important;
              }

              #admit-cards-print-root,
              #admit-cards-print-root * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              #admit-cards-print-root {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 194mm !important;
                background: white !important;
                font-family: Arial, sans-serif !important;
              }

              .no-print,
              .print\\:hidden {
                display: none !important;
              }

              .admit-print-page {
                width: 194mm !important;
                height: 281mm !important;
                display: grid !important;
                grid-template-columns: 95mm 95mm !important;
                grid-template-rows: 138mm 138mm !important;
                gap: 4mm !important;
                page-break-after: always !important;
                break-after: page !important;
              }

              .admit-print-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }

              .admit-card-slot {
                width: 95mm !important;
                height: 138mm !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .admit-card {
                width: 138mm !important;
                height: 95mm !important;
                position: absolute !important;
                left: -21.5mm !important;
                top: 21.5mm !important;
                transform: rotate(90deg) !important;
                transform-origin: center center !important;
                background: repeating-linear-gradient(
                  -45deg,
                  #1a5c1a 0,
                  #1a5c1a 3px,
                  #3d8c3d 3px,
                  #3d8c3d 7px
                ) !important;
                padding: 3.5mm !important;
                overflow: hidden !important;
              }

              .admit-card-inner {
                width: 100% !important;
                height: 100% !important;
                background: #fdf8ee !important;
                border: 1px solid #2d7a2d !important;
                padding: 3mm 4mm !important;
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .admit-watermark {
                position: absolute !important;
                inset: 0 !important;
                background-image: url("/school-logo.jpg") !important;
                background-size: 45mm !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                opacity: 0.07 !important;
              }

              .admit-header {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                gap: 1.5mm !important;
                padding-bottom: 2mm !important;
                position: relative !important;
                z-index: 1 !important;
                flex-shrink: 0 !important;
              }

              .admit-logo {
                width: 13mm !important;
                height: 13mm !important;
                border-radius: 50% !important;
                object-fit: cover !important;
              }

              .admit-school {
                font-size: 10.5pt !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.4px !important;
                color: #1a4a1a !important;
                line-height: 1.25 !important;
              }

              .admit-exam-row {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 3mm !important;
              }

              .admit-badge {
                display: inline-block !important;
                background: #b91c1c !important;
                color: white !important;
                font-size: 8.5pt !important;
                font-weight: 700 !important;
                padding: 1mm 4mm !important;
                border-radius: 2mm !important;
                line-height: 1.2 !important;
              }

              .admit-year {
                font-size: 8.5pt !important;
                font-weight: 700 !important;
                color: #444 !important;
              }

              .admit-title {
                font-size: 8.5pt !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 1.5px !important;
                color: #2d5a2d !important;
                border: 1px solid #2d7a2d !important;
                padding: 0.8mm 6mm !important;
                border-radius: 2mm !important;
              }

              .admit-divider {
                border-top: 1px solid #2d7a2d !important;
                margin: 1.7mm 0 !important;
                flex-shrink: 0 !important;
                position: relative !important;
                z-index: 1 !important;
              }

              .admit-fields {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                gap: 5mm !important;
                flex: 1 !important;
                position: relative !important;
                z-index: 1 !important;
                min-height: 0 !important;
              }

              .admit-field-row {
                display: grid !important;
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                gap: 6mm !important;
              }

              .admit-field {
                display: flex !important;
                flex-direction: column !important;
                gap: 1mm !important;
                min-width: 0 !important;
              }

              .admit-label {
                font-size: 8pt !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.4px !important;
                color: #666 !important;
              }

              .admit-value {
                display: block !important;
                min-height: 5mm !important;
                font-size: 12pt !important;
                line-height: 1.15 !important;
                font-weight: 800 !important;
                color: #111 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
              }

              .admit-line {
                display: block !important;
                border-bottom: 1.5px dashed #aaa !important;
                height: 0 !important;
              }

              .admit-signatures {
                display: flex !important;
                gap: 10mm !important;
                flex-shrink: 0 !important;
                padding-top: 1.5mm !important;
                position: relative !important;
                z-index: 1 !important;
              }

              .admit-signature {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 1.5mm !important;
              }

              .admit-signature-line {
                width: 100% !important;
                height: 8mm !important;
                border-bottom: 1px solid #444 !important;
              }

              .admit-signature-label {
                font-size: 8pt !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                color: #555 !important;
              }
            }
          `,
        }}
      />
    </>
  );
}
