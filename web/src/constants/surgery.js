import { Scissors, Activity, Eye, Droplets, Bone, Heart, Sparkles, Ear } from 'lucide-react';

// Surgical specialties and the procedures under each, for the Surgery Care page and its
// request form. Labels are translated via `surgery.specialties.<key>` and
// `surgery.procedures.<key>`; the English label is what gets saved on an enquiry so the
// care team always reads it in one language.
export const SURGERY_SPECIALTIES = [
  {
    key: 'generalSurgery',
    icon: Scissors,
    procedures: ['hernia', 'gallstones', 'appendix', 'varicoseVeins', 'lipoma', 'sebaceousCyst', 'pilonidalSinus'],
  },
  { key: 'proctology', icon: Activity, procedures: ['piles', 'analFistula', 'analFissure'] },
  { key: 'ophthalmology', icon: Eye, procedures: ['cataract', 'lasik'] },
  { key: 'urology', icon: Droplets, procedures: ['kidneyStone', 'prostate', 'hydrocele', 'circumcision'] },
  { key: 'orthopedics', icon: Bone, procedures: ['kneeReplacement', 'hipReplacement', 'aclRepair', 'arthroscopy'] },
  { key: 'gynaecology', icon: Heart, procedures: ['hysterectomy', 'ovarianCyst', 'breastLump'] },
  { key: 'ent', icon: Ear, procedures: ['tonsillectomy', 'septoplasty', 'sinusSurgery'] },
  { key: 'cosmetic', icon: Sparkles, procedures: ['hairTransplant', 'gynecomastia', 'liposuction'] },
];

export const POPULAR_PROCEDURES = [
  'piles',
  'hernia',
  'cataract',
  'kidneyStone',
  'gallstones',
  'varicoseVeins',
  'kneeReplacement',
  'lasik',
];

// Form value for "I'm not sure which procedure I need".
export const PROCEDURE_NOT_SURE = 'notSure';
