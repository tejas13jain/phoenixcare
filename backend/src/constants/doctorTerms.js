// Doctor Terms & Conditions and the standards a doctor must follow on an Indian online
// healthcare portal. This single source feeds the first-login acceptance page, the
// onboarding email and the acceptance receipt, so all three always say the same thing.
//
// IMPORTANT: bump TERMS_VERSION whenever the meaning of anything below changes. Doctors who
// accepted an older version are asked to accept again before they can practise.
//
// This is a plain-language summary of the main Indian laws and rules, not legal advice — have
// it reviewed by a lawyer before relying on it.

export const TERMS_VERSION = '2026-10-04';

export const TERMS_TITLE = 'PhoenixCare Doctor Terms & Conditions';

export const TERMS_INTRO =
  'PhoenixCare is an online platform where independent, registered doctors consult patients over video, audio and chat. ' +
  'To practise here you must follow the conditions below. They bring together PhoenixCare’s rules and the main Indian laws and ' +
  'guidelines that apply to online medical consultations. They are a plain-language summary — they do not replace the law, ' +
  'laws change from time to time, and you remain responsible for staying compliant.';

export const TERMS_SECTIONS = [
  {
    id: 'registration',
    title: '1. Your registration and credentials',
    law: 'National Medical Commission Act, 2019 · Telemedicine Practice Guidelines, 2020',
    points: [
      'Only a Registered Medical Practitioner (RMP) can offer online consultations. You must hold a valid registration with a State Medical Council or the National Medical Register.',
      'The registration number, qualifications, experience and specialties on your profile must be true and up to date. Never claim a qualification or specialty you do not hold.',
      'Practise only within the specialties you are qualified and registered for.',
      'Tell PhoenixCare within 7 days if your registration is suspended, cancelled, restricted or changes. Do not take consultations while your registration is not valid.',
      'PhoenixCare may ask for your registration certificate, ID and qualification proofs at any time, and may hide your profile until they are verified.',
      'You are encouraged (not required) to register in the Healthcare Professionals Registry under the Ayushman Bharat Digital Mission.',
    ],
  },
  {
    id: 'consultation',
    title: '2. How to conduct an online consultation',
    law: 'Telemedicine Practice Guidelines, 2020 (Indian Medical Council Regulations, 2002, Annexure 5)',
    points: [
      'Introduce yourself to the patient with your name and registration number, and confirm who the patient is (name, age, contact details) at the start of every consultation.',
      'A patient who books and starts a consultation gives implied consent to it. Take the patient’s explicit consent before anything extra — for example recording, or sharing their information with another doctor.',
      'A child or a person who cannot decide for themselves should consult with a parent or guardian present, who gives the consent.',
      'Use your professional judgement to decide whether the problem can be handled by video, audio or chat. If it needs a physical examination or tests, say so and advise an in-person visit.',
      'In an emergency — such as severe chest pain, trouble breathing, heavy bleeding, fainting or stroke signs — tell the patient to go to the nearest hospital or call 112. Do not try to manage emergencies online.',
      'You owe the patient the same standard of care as in a clinic. You alone are responsible for the medical advice you give.',
      'Follow-up consultations for the same problem within 6 months of the last consultation are treated as follow-ups under the Guidelines. A new problem, or a gap of more than 6 months, is a first consultation.',
    ],
  },
  {
    id: 'prescriptions',
    title: '3. Prescriptions and medicines',
    law: 'Telemedicine Practice Guidelines, 2020 · Drugs and Cosmetics Act, 1940 and Rules, 1945 · NDPS Act, 1985',
    points: [
      'Every prescription must show your name, registration number, the date, and the patient’s name and age, with your digital signature. Digital signatures are valid under the Information Technology Act, 2000.',
      'Follow the Guidelines’ medicine lists (List O, List A, List B and the Prohibited List). In short: only the safest, commonly used medicines at a first consultation, a wider list at follow-ups, and never prohibited medicines.',
      'Never prescribe through an online consultation any medicine on the Prohibited List — including Schedule X drugs and narcotic or psychotropic substances controlled under the NDPS Act, 1985.',
      'Prescribe only what the patient needs. Do not prescribe for any commission, incentive or tie-up with a pharmacy, lab or company.',
      'Follow the Drugs and Cosmetics Rules for restricted medicines (such as Schedule H and H1), including any records they require.',
      'If you cannot safely prescribe without examining the patient, do not prescribe. Advise an in-person visit instead.',
    ],
  },
  {
    id: 'privacy',
    title: '4. Patient privacy and data protection',
    law: 'Digital Personal Data Protection Act, 2023 and Rules · Information Technology Act, 2000 and its rules · Indian Medical Council Regulations, 2002 (confidentiality)',
    points: [
      'Health information is sensitive. Use a patient’s information only to treat that patient and never share it, except with the patient’s consent or where the law requires.',
      'Do not record, screenshot, download, forward or store consultations, chats, reports or prescriptions outside PhoenixCare, unless the patient has given explicit consent or the law requires it.',
      'Never discuss patients, or post anything that could identify them, on social media, in groups or with people who are not involved in their care.',
      'Protect your account: use a strong password, never share your login or one-time codes, and log out on shared devices.',
      'Consult from a private place with a secure internet connection. Avoid public Wi-Fi and make sure no one else can see or hear the consultation.',
      'If you suspect your account was misused, a device was lost, or patient data was exposed, tell PhoenixCare immediately and within 24 hours so it can act and meet its legal duties.',
    ],
  },
  {
    id: 'records',
    title: '5. Medical records',
    law: 'Indian Medical Council Regulations, 2002 · Telemedicine Practice Guidelines, 2020',
    points: [
      'Keep proper records of every consultation: the patient’s complaints, your advice, the prescription and any reports you reviewed. PhoenixCare stores consultations and prescriptions on its platform, but keeping accurate records is your professional duty too.',
      'Keep records for at least as long as the Indian Medical Council Regulations require (currently at least 3 years), or longer where another law requires.',
      'Give a patient a copy of their prescription or records when they ask, promptly.',
      'Do not alter or delete a record after the consultation to hide a mistake. If a correction is needed, add a dated note.',
    ],
  },
  {
    id: 'ethics',
    title: '6. Professional ethics and conduct',
    law: 'Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002 · PCPNDT Act, 1994',
    points: [
      'Do not take or give any commission, rebate or kickback for referring patients to, or for sending tests, medicines or procedures to, any lab, pharmacy, hospital or person.',
      'Do not advertise yourself or make guarantees such as “100% cure”. Do not use PhoenixCare to solicit patients for your private practice or to take consultations outside the platform.',
      'Treat every patient with respect. No abuse, discrimination, harassment or inappropriate behaviour of any kind, and no consultations while impaired by alcohol or drugs.',
      'Never reveal, or help anyone find out, the sex of a foetus. This is a criminal offence under the PCPNDT Act, 1994.',
      'Do not advise unnecessary tests, medicines or procedures. Put the patient’s interest first and disclose any conflict of interest.',
      'Do not give false information to patients or to PhoenixCare, and do not misuse a patient’s trust or vulnerability.',
    ],
  },
  {
    id: 'fees',
    title: '7. Fees, payments and taxes',
    law: 'Income-tax Act, 1961 · GST law (where applicable) · Consumer Protection Act, 2019',
    points: [
      'You set your consultation fees. They are shown to the patient before booking. Do not ask a patient for extra money, or for payment outside PhoenixCare, for a consultation booked here.',
      'PhoenixCare collects the fee from the patient and pays you the balance to your registered bank account or UPI ID. PhoenixCare charges a platform commission on each paid consultation. The rate will be shared with you in writing, and any deduction the law requires (such as TDS under the Income-tax Act) will be applied.',
      'If a consultation is cancelled, missed or could not be completed, the patient may be refunded and your payout adjusted.',
      'You are responsible for your own income-tax, GST (where it applies) and other tax filings and records.',
      'Keep your payout details accurate. PhoenixCare may hold a payout while it investigates a complaint, a suspected fraud or a legal notice.',
    ],
  },
  {
    id: 'availability',
    title: '8. Appointments and availability',
    law: 'PhoenixCare service standards · Consumer Protection Act, 2019',
    points: [
      'Keep your availability accurate. Open only slots you can really attend, and do not double-book.',
      'Join on time. If you will be late or cannot attend, cancel as early as you can so the patient can be rebooked or refunded.',
      'Give each patient enough time to understand the problem and your advice. Do not end a consultation early without a good reason.',
      'Use a working camera, microphone and a stable internet connection. If the connection fails, try to reconnect or offer a follow-up.',
      'Repeated no-shows, late cancellations or complaints about missed consultations can lead to suspension.',
    ],
  },
  {
    id: 'platform',
    title: '9. PhoenixCare’s role and your responsibility',
    law: 'Information Technology Act, 2000 · Consumer Protection (E-Commerce) Rules, 2020 · Consumer Protection Act, 2019',
    points: [
      'PhoenixCare is a technology platform that connects patients with independent doctors. It does not practise medicine, and it does not control or take responsibility for your medical advice or treatment.',
      'Under the Consumer Protection Act, 2019, a patient can complain about a deficiency in medical service. You must cooperate with any complaint, investigation or legal notice, and reply to PhoenixCare’s requests within 7 days.',
      'You are encouraged to hold professional indemnity insurance that covers online consultations.',
      'You must follow orders and directions of the National Medical Commission, your State Medical Council, courts and other authorities. PhoenixCare may share your information with them where the law requires.',
      'Patients can raise concerns with PhoenixCare’s grievance contact at support@phoenixcare.demo. PhoenixCare may share a complaint with you so you can respond.',
    ],
  },
  {
    id: 'reviews',
    title: '10. Ratings and reviews',
    law: 'Consumer Protection (E-Commerce) Rules, 2020',
    points: [
      'Do not write, buy or pressure anyone into writing fake or misleading reviews, and do not offer discounts or favours for good reviews.',
      'Do not try to identify or contact a patient because of a review. Reply, if you do, politely and without revealing any medical details.',
    ],
  },
  {
    id: 'suspension',
    title: '11. Suspension and ending your account',
    law: 'PhoenixCare service standards',
    points: [
      'PhoenixCare may hide your profile, suspend or end your account if your registration is not valid, you break these conditions or the law, there are serious complaints, or an authority directs it.',
      'You may stop using PhoenixCare at any time after completing the consultations already booked with you.',
      'Records of consultations already held, and PhoenixCare’s legal and tax records, are kept as the law requires even after your account ends.',
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to these conditions',
    law: '',
    points: [
      'When these conditions change in a meaningful way — for example because a law or guideline changes — PhoenixCare will ask you to read and accept the new version before you continue to take consultations.',
      'Your acceptance is recorded with the date, time and version. You can read these conditions again any time in your doctor dashboard, and PhoenixCare will email you a copy.',
    ],
  },
];

// Every box a doctor must tick before they can start. The ids are checked by the server too,
// so the acceptance can't be skipped by calling the API directly.
export const TERMS_DECLARATIONS = [
  {
    id: 'registration',
    text: 'I am a Registered Medical Practitioner with a valid registration, and the details on my profile are true and up to date.',
  },
  {
    id: 'telemedicine',
    text: 'I have read, and will follow, the Telemedicine Practice Guidelines, 2020, including the rules on medicines I may and may not prescribe online.',
  },
  {
    id: 'privacy',
    text: 'I will keep every patient’s information confidential and protect it as required by Indian law.',
  },
  {
    id: 'terms',
    text: 'I have read and I accept the PhoenixCare Doctor Terms & Conditions above.',
  },
];

// Public shape sent to the web app.
export function getTermsContent() {
  return {
    version: TERMS_VERSION,
    title: TERMS_TITLE,
    intro: TERMS_INTRO,
    sections: TERMS_SECTIONS,
    declarations: TERMS_DECLARATIONS,
  };
}
