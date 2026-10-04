// Mirrors backend/src/models/Lab.js. Category labels are translated for patients via
// `labTests.categories.<key>`; the admin panel uses the English `label`.
export const LAB_TEST_CATEGORIES = [
  { key: 'full_body', label: 'Full body checkup' },
  { key: 'blood', label: 'Blood tests' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'heart', label: 'Heart' },
  { key: 'liver', label: 'Liver' },
  { key: 'kidney', label: 'Kidney' },
  { key: 'vitamins', label: 'Vitamins' },
  { key: 'hormones', label: 'Hormones' },
  { key: 'infection', label: 'Infections' },
  { key: 'imaging', label: 'X-ray & scans' },
  { key: 'other', label: 'Other' },
];

export const LAB_ACCREDITATIONS = ['NABL', 'CAP', 'ISO', 'NABH'];
