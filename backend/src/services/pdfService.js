import PDFDocument from 'pdfkit';

export function generatePrescriptionPdfBuffer({ doctor, patient, prescription, appointment }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .fillColor('#0F6E6A')
      .fontSize(22)
      .text('PhoenixCare', { continued: true })
      .fillColor('#445866')
      .fontSize(10)
      .text('  Rise stronger, every day.', { baseline: 'bottom' });

    doc.moveDown(1.5);
    doc.fillColor('#1E2A32').fontSize(14).text('Digital Prescription', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#445866');
    doc.text(`Doctor: Dr. ${doctor.name}  |  Reg. No: ${doctor.registrationNumber}`);
    doc.text(`Patient: ${patient.name}`);
    doc.text(`Date: ${appointment.date}  |  Time: ${appointment.startTime}`);
    doc.moveDown();

    if (prescription.diagnosis?.length) {
      doc.fillColor('#1E2A32').fontSize(12).text('Diagnosis');
      doc.fontSize(10).fillColor('#445866').text(prescription.diagnosis.join(', '));
      doc.moveDown();
    }

    if (prescription.medicines?.length) {
      doc.fillColor('#1E2A32').fontSize(12).text('Medicines');
      prescription.medicines.forEach((med, i) => {
        doc
          .fontSize(10)
          .fillColor('#445866')
          .text(`${i + 1}. ${med.name} — ${med.dosage}, ${med.frequency}, for ${med.durationDays} day(s)`);
        if (med.instructions) doc.fontSize(9).fillColor('#7a8b94').text(`   ${med.instructions}`);
      });
      doc.moveDown();
    }

    if (prescription.labTestsAdvised?.length) {
      doc.fillColor('#1E2A32').fontSize(12).text('Lab Tests Advised');
      doc.fontSize(10).fillColor('#445866').text(prescription.labTestsAdvised.join(', '));
      doc.moveDown();
    }

    if (prescription.advice) {
      doc.fillColor('#1E2A32').fontSize(12).text('Advice');
      doc.fontSize(10).fillColor('#445866').text(prescription.advice);
      doc.moveDown();
    }

    if (prescription.followUpDate) {
      doc.fontSize(10).fillColor('#445866').text(`Follow-up: ${new Date(prescription.followUpDate).toDateString()}`);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9aa7ad').text('This is a digitally generated prescription issued via PhoenixCare telemedicine platform.');

    doc.end();
  });
}
