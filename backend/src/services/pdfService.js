import PDFDocument from 'pdfkit';

const COLORS = {
  teal: '#0F6E6A',
  sky: '#2C8FEA',
  sunrise: '#FF6B35',
  charcoal: '#1E2A32',
  slate: '#445866',
  muted: '#8a97a0',
  offwhite: '#F7FAFA',
  border: '#E2E8E8',
};

const PAGE_MARGIN = 50;

function drawHeader(doc, { prescriptionId, generatedAt }) {
  const pageWidth = doc.page.width;

  // Gradient-style banner (PDFKit has no native gradient fill, so approximate with a
  // three-stripe blend teal -> sky -> sunrise across the header band).
  const bandHeight = 78;
  const stripeWidth = pageWidth / 3;
  doc.rect(0, 0, stripeWidth, bandHeight).fill(COLORS.teal);
  doc.rect(stripeWidth, 0, stripeWidth, bandHeight).fill(COLORS.sky);
  doc.rect(stripeWidth * 2, 0, stripeWidth, bandHeight).fill(COLORS.sunrise);

  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('PhoenixCare', PAGE_MARGIN, 22);
  doc.font('Helvetica').fontSize(10).fillColor('#FFFFFF').text('Rise stronger, every day.', PAGE_MARGIN, 48);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#FFFFFF')
    .text(`Prescription ID: ${prescriptionId}`, 0, 24, { align: 'right', width: pageWidth - PAGE_MARGIN })
    .text(`Issued: ${generatedAt}`, 0, 38, { align: 'right', width: pageWidth - PAGE_MARGIN });

  doc.y = bandHeight + 24;
}

function drawInfoBox(doc, { doctor, patient, appointment }) {
  const boxTop = doc.y;
  const boxWidth = doc.page.width - PAGE_MARGIN * 2;
  const colWidth = boxWidth / 2;

  doc.roundedRect(PAGE_MARGIN, boxTop, boxWidth, 84, 8).fillAndStroke(COLORS.offwhite, COLORS.border);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.teal)
    .text('CONSULTING DOCTOR', PAGE_MARGIN + 16, boxTop + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.charcoal)
    .text(`Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}`, PAGE_MARGIN + 16, boxTop + 28);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.slate)
    .text(`Reg. No: ${doctor.registrationNumber}`, PAGE_MARGIN + 16, boxTop + 46)
    .text(`${appointment.date}  •  ${appointment.startTime}  •  ${appointment.mode}`, PAGE_MARGIN + 16, boxTop + 60);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.teal)
    .text('PATIENT', PAGE_MARGIN + colWidth + 16, boxTop + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.charcoal)
    .text(patient.name, PAGE_MARGIN + colWidth + 16, boxTop + 28);
  if (patient.phone) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.slate)
      .text(patient.phone, PAGE_MARGIN + colWidth + 16, boxTop + 46);
  }

  doc.y = boxTop + 84 + 20;
}

function sectionHeading(doc, title) {
  doc.moveDown(0.3);
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.teal).text(title.toUpperCase(), PAGE_MARGIN, y);
  doc
    .moveTo(PAGE_MARGIN, doc.y + 2)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.6);
}

function drawFooter(doc) {
  const bottom = doc.page.height - 60;

  // Drawing this close to the page edge can otherwise trip PDFKit's auto-pagination (any
  // flowed text that would land within the margin zone silently starts a new page) —
  // temporarily zero the bottom margin so the footer renders on the current page only.
  const originalBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc
    .moveTo(PAGE_MARGIN, bottom)
    .lineTo(doc.page.width - PAGE_MARGIN, bottom)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      'This is a digitally generated prescription issued via the PhoenixCare telemedicine platform and is valid without a physical signature.\nsupport@phoenixcare.demo   •   www.phoenixcare.demo',
      PAGE_MARGIN,
      bottom + 10,
      { width: doc.page.width - PAGE_MARGIN * 2, align: 'center', lineGap: 4 }
    );

  doc.page.margins.bottom = originalBottomMargin;
}

export function generatePrescriptionPdfBuffer({ doctor, patient, prescription, appointment, prescriptionId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    drawHeader(doc, { prescriptionId, generatedAt });
    drawInfoBox(doc, { doctor, patient, appointment });

    if (prescription.diagnosis?.length) {
      sectionHeading(doc, 'Diagnosis');
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.charcoal).text(prescription.diagnosis.join(', '));
      doc.moveDown(0.8);
    }

    if (prescription.medicines?.length) {
      sectionHeading(doc, 'Medicines');
      prescription.medicines.forEach((med, i) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(COLORS.charcoal)
          .text(`${i + 1}. ${med.name}`, { continued: true })
          .font('Helvetica')
          .fillColor(COLORS.slate)
          .text(`  —  ${med.dosage}, ${med.frequency}, for ${med.durationDays} day(s)`);
        if (med.instructions) {
          doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.muted).text(`    ${med.instructions}`);
        }
        doc.moveDown(0.35);
      });
      doc.moveDown(0.5);
    }

    if (prescription.labTestsAdvised?.length) {
      sectionHeading(doc, 'Lab Tests Advised');
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.charcoal).text(prescription.labTestsAdvised.join(', '));
      doc.moveDown(0.8);
    }

    if (prescription.advice) {
      sectionHeading(doc, 'Advice');
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.charcoal).text(prescription.advice);
      doc.moveDown(0.8);
    }

    if (prescription.followUpDate) {
      sectionHeading(doc, 'Follow-up');
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.charcoal)
        .text(new Date(prescription.followUpDate).toLocaleDateString('en-IN', { dateStyle: 'long' }));
    }

    drawFooter(doc);
    doc.end();
  });
}
