// Documents a doctor uploads so PhoenixCare can verify them before their profile goes live.
// `required` documents must all be uploaded AND approved by an admin before the doctor can
// be verified. Keep web/src/constants/kycDocuments.js in sync (it only needs the types and
// which are required — the wording below is what the API sends to the doctor's page).

export const KYC_DOCUMENT_TYPES = [
  {
    type: 'registration_certificate',
    label: 'Medical registration certificate',
    description: 'Your State Medical Council or National Medical Register certificate — the one showing your registration number.',
    required: true,
    imagesOnly: false,
  },
  {
    type: 'degree_certificate',
    label: 'MBBS (or primary medical degree) certificate',
    description: 'Your degree certificate from the university or college.',
    required: true,
    imagesOnly: false,
  },
  {
    type: 'government_id',
    label: 'Government photo ID',
    description:
      'Aadhaar, PAN, passport, driving licence or voter ID. If you use Aadhaar, a masked copy (first 8 digits hidden) is fine.',
    required: true,
    imagesOnly: false,
  },
  {
    type: 'profile_photo',
    label: 'Recent passport-size photo',
    description: 'A clear, recent photo of your face, used to match your ID. Photos only (JPG or PNG).',
    required: true,
    imagesOnly: true,
  },
  {
    type: 'specialty_certificate',
    label: 'Specialty or postgraduate certificate',
    description: 'MD, MS, DNB, diploma or fellowship — add this if you list a specialty beyond general practice.',
    required: false,
    imagesOnly: false,
  },
  {
    type: 'bank_proof',
    label: 'Bank account proof',
    description: 'A cancelled cheque or the first page of a bank statement, so PhoenixCare can pay you.',
    required: false,
    imagesOnly: false,
  },
];

export const KYC_DOCUMENT_TYPE_IDS = KYC_DOCUMENT_TYPES.map((d) => d.type);
export const REQUIRED_KYC_TYPES = KYC_DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.type);

export const getKycDocumentType = (type) => KYC_DOCUMENT_TYPES.find((d) => d.type === type);

export const KYC_MAX_FILE_BYTES = 4 * 1024 * 1024;
