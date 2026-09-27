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
  headerBg: '#0F6E6A',
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
  const boxHeight = 98;

  doc.roundedRect(PAGE_MARGIN, boxTop, boxWidth, boxHeight, 8).fillAndStroke(COLORS.offwhite, COLORS.border);

  const doctorQualifications = doctor.qualifications?.length ? doctor.qualifications.join(', ') : '';
  const doctorSpecialty = doctor.specialties?.length ? doctor.specialties.join(', ') : '';

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.teal).text('CONSULTING DOCTOR', PAGE_MARGIN + 16, boxTop + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.charcoal)
    .text(`Dr. ${doctor.name.replace(/^Dr\.?\s*/i, '')}`, PAGE_MARGIN + 16, boxTop + 28);
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.slate)
    .text(
      [doctorQualifications, doctorSpecialty].filter(Boolean).join('  •  ') || ' ',
      PAGE_MARGIN + 16,
      boxTop + 44,
      { width: colWidth - 24 }
    );
  doc
    .fontSize(8.5)
    .fillColor(COLORS.slate)
    .text(`Reg. No: ${doctor.registrationNumber}`, PAGE_MARGIN + 16, boxTop + 60)
    .text(`${appointment.date}  •  ${appointment.startTime}  •  ${appointment.mode}`, PAGE_MARGIN + 16, boxTop + 74);

  const patientMeta = [patient.age ? `${patient.age} yrs` : null, patient.gender ? patient.gender : null]
    .filter(Boolean)
    .join(', ');

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.teal).text('PATIENT', PAGE_MARGIN + colWidth + 16, boxTop + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.charcoal)
    .text(patient.name, PAGE_MARGIN + colWidth + 16, boxTop + 28);
  if (patientMeta) {
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.slate).text(patientMeta, PAGE_MARGIN + colWidth + 16, boxTop + 44);
  }
  if (patient.phone) {
    doc.fontSize(8.5).fillColor(COLORS.slate).text(patient.phone, PAGE_MARGIN + colWidth + 16, boxTop + 60);
  }
  if (patient.allergies?.length) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#E63946')
      .text(`⚠ Allergies: ${patient.allergies.join(', ')}`, PAGE_MARGIN + colWidth + 16, boxTop + 74, {
        width: colWidth - 24,
      });
  }

  doc.y = boxTop + boxHeight + 20;
}

function drawVitals(doc, vitals) {
  const hasVitals = vitals && (vitals.temperature || vitals.bloodPressure || vitals.pulse || vitals.spo2);
  if (!hasVitals) return;

  sectionHeading(doc, 'Vitals recorded at consultation');
  const entries = [
    vitals.bloodPressure ? `BP: ${vitals.bloodPressure}` : null,
    vitals.pulse ? `Pulse: ${vitals.pulse} bpm` : null,
    vitals.spo2 ? `SpO2: ${vitals.spo2}%` : null,
    vitals.temperature ? `Temp: ${vitals.temperature}°C` : null,
  ].filter(Boolean);

  doc.font('Helvetica').fontSize(10).fillColor(COLORS.charcoal).text(entries.join('   •   '));
  doc.moveDown(0.8);
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

const MED_COLS = [
  { key: 'name', label: 'Medicine', width: 0.28 },
  { key: 'dosage', label: 'Dosage', width: 0.16 },
  { key: 'frequency', label: 'Frequency', width: 0.16 },
  { key: 'duration', label: 'Duration', width: 0.14 },
  { key: 'instructions', label: 'Instructions', width: 0.26 },
];

function drawMedicinesTable(doc, medicines) {
  const tableWidth = doc.page.width - PAGE_MARGIN * 2;
  const cols = MED_COLS.map((c) => ({ ...c, px: c.width * tableWidth }));
  let x = PAGE_MARGIN;
  const colX = cols.map((c) => {
    const thisX = x;
    x += c.px;
    return thisX;
  });

  // Header row
  const headerY = doc.y;
  doc.rect(PAGE_MARGIN, headerY, tableWidth, 20).fill(COLORS.teal);
  cols.forEach((c, i) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#FFFFFF')
      .text(c.label.toUpperCase(), colX[i] + 6, headerY + 6, { width: c.px - 10 });
  });
  doc.y = headerY + 20;

  medicines.forEach((med, i) => {
    const rowValues = {
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: `${med.durationDays} day(s)`,
      instructions: med.instructions || '—',
    };

    // Measure the tallest cell to size the row consistently.
    const heights = cols.map((c) =>
      doc.heightOfString(rowValues[c.key], { width: c.px - 10, fontSize: 9 })
    );
    const rowHeight = Math.max(...heights, 16) + 10;
    const rowY = doc.y;

    if (i % 2 === 1) {
      doc.rect(PAGE_MARGIN, rowY, tableWidth, rowHeight).fill(COLORS.offwhite);
    }

    cols.forEach((c, ci) => {
      doc
        .font(c.key === 'name' ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(COLORS.charcoal)
        .text(rowValues[c.key], colX[ci] + 6, rowY + 6, { width: c.px - 10 });
    });

    doc.y = rowY + rowHeight;
  });

  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.8);
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

export function generatePrescriptionPdfBuffer({ doctor, patient, prescription, appointment, vitals, prescriptionId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    drawHeader(doc, { prescriptionId, generatedAt });
    drawInfoBox(doc, { doctor, patient, appointment });
    drawVitals(doc, vitals);

    if (prescription.diagnosis?.length) {
      sectionHeading(doc, 'Diagnosis');
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.charcoal).text(prescription.diagnosis.join(', '));
      doc.moveDown(0.8);
    }

    if (prescription.medicines?.length) {
      doc.moveDown(0.2);
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.sunrise).text('Rx', PAGE_MARGIN, y, { continued: true });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.teal).text('   MEDICINES', { baseline: 'top' });
      doc
        .moveTo(PAGE_MARGIN, doc.y + 2)
        .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.6);
      drawMedicinesTable(doc, prescription.medicines);
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
