// Emergency screening for the booking assistant. It runs on every message BEFORE any AI call,
// in plain code, so a patient describing a life-threatening problem is told to get emergency
// help immediately — never routed into "book an appointment for next week", and never at the
// mercy of a language model's judgement.
//
// Two levels:
//   emergency — stop. Show the emergency message; the assistant does not continue.
//   caution   — a symptom that deserves prompt in-person care (e.g. chest pain, fainting) but
//               where booking help is still legitimate. The assistant continues, but must lead
//               with an urgent-care warning and prefer same-day availability.
//
// Published evaluations of symptom checkers find they often mis-grade urgency (one audit of 23
// tools gave appropriate triage advice in only 57% of cases), so this errs toward warning.
//
// Phone numbers: 112 is India's single emergency number; 14416 is Tele-MANAS, the government
// mental-health helpline.

export const EMERGENCY_NUMBER = '112';
export const MENTAL_HEALTH_HELPLINE = '14416';

// Each rule has a category (the web app shows a translated message for it), a level, and
// patterns in English, Hindi (Roman and Devanagari) and Spanish — the supported languages.
const RULES = [
  {
    category: 'self_harm',
    level: 'emergency',
    patterns: [
      /\b(suicid\w*|kill (myself|me)|end (my|this) life|want to die|wanna die|don'?t want to (live|be alive)|hurt myself|harm myself|self[- ]?harm)\b/i,
      /\b(mar ?jana chahta|marna chahta|jaan dena|khudkushi|aatmahatya)\b/i,
      /(आत्महत्या|खुदकुशी|मरना चाहता|मरना चाहती|जान दे)/,
      /\b(suicidar\w*|quitarme la vida|quiero morir|matarme|hacerme da[ñn]o)\b/i,
    ],
  },
  {
    category: 'breathing',
    level: 'emergency',
    patterns: [
      /\b(can'?t|cannot|unable to|not able to|struggling to|trouble|difficulty|hard to|gasping for) (breathe|breathing|catch my breath)\b/i,
      /\b(severe|extreme|sudden) (shortness of breath|breathlessness)\b/i,
      /\b(choking|turning blue|lips (are )?blue)\b/i,
      /\b(saans (nahi|nhi|lene mein|phool)|dum ghut)\b/i,
      /(सांस (नहीं|लेने में)|दम घुट)/,
      /\b(no puedo respirar|me ahogo|falta de aire (grave|severa))\b/i,
    ],
  },
  {
    category: 'heart',
    level: 'emergency',
    patterns: [
      /\bchest (pain|tightness|pressure|heaviness|discomfort)\b[^.?!]{0,80}\b(severe|crushing|spread\w*|radiat\w*|left arm|jaw|sweat\w*|short(ness)? of breath|breathless\w*|sudden\w*|vomit\w*|nausea|faint\w*|dizz\w*)\b/i,
      /\b(sweat\w*|breathless\w*|short(ness)? of breath|left arm|jaw)\b[^.?!]{0,60}\bchest (pain|tightness|pressure)\b/i,
      /\b(severe|crushing|sudden|unbearable|terrible|excruciating) chest (pain|tightness|pressure)\b/i,
      /\b(heart attack|crushing pain)\b/i,
      /\bseene (mein|me) (tez|bahut|bhayanak) dard\b/i,
      /सीने[^.?!]{0,20}(तेज|भयंकर)/,
      /\b(dolor (fuerte|intenso|severo) (de|en el) pecho|ataque (al coraz[óo]n|card[íi]aco))\b/i,
    ],
  },
  {
    category: 'heart',
    level: 'caution',
    patterns: [
      /\bchest (pain|tightness|pressure|heaviness|discomfort)\b/i,
      /\bpain in (my |the )?chest\b/i,
      /\bseene (mein|me) (dard|bhaari|jakdan)\b/i,
      /सीने (में|मे) (दर्द|भारीपन|जकड़न)/,
      /\bdolor (de|en el) pecho\b/i,
    ],
  },
  {
    category: 'stroke',
    level: 'emergency',
    patterns: [
      /\b(face (is )?(drooping|droopy|numb)|slurred speech|slurring|sudden (weakness|numbness) (on|in) (one|my (left|right)) side)\b/i,
      /\b(stroke|paralysis|paralyzed|paralysed)\b/i,
      /(लकवा|पैरालिसिस)/,
      /\b(derrame cerebral|parálisis)\b/i,
    ],
  },
  {
    category: 'unconscious',
    level: 'emergency',
    patterns: [
      /\b(unconscious|unresponsive|not responding|not waking up|won'?t wake up)\b/i,
      /\b(hosh nahi|bhosh nahi)\b/i,
      /(होश नहीं)/,
      /\b(inconsciente|no responde)\b/i,
    ],
  },
  {
    category: 'fainting',
    level: 'caution',
    patterns: [
      /\b(fainted|passed out|collapsed|blacked out|blackout)\b/i,
      /\b(behosh|chakkar (khake|aake) gir)\w*\b/i,
      /(बेहोश)/,
      /\b(se desmay[óo]|desmayo)\b/i,
    ],
  },
  {
    category: 'seizure',
    level: 'emergency',
    patterns: [
      /\b(having|is having|started having|in) (a )?(seizure|fit|convulsion)s?\b/i,
      /\b(convulsing|seizure|convulsion|fits?) (right )?(now|currently)\b/i,
      /\b(jhatke aa rahe|daura pad raha)\b/i,
    ],
  },
  {
    category: 'seizure',
    level: 'caution',
    patterns: [/\b(seizures?|convulsions?|epilep\w*)\b/i, /(मिर्गी|दौरे)/, /\b(convulsi[óo]n|epilepsia)\b/i],
  },
  {
    category: 'bleeding',
    level: 'emergency',
    patterns: [
      /\b(heavy|severe|uncontrolled|profuse|won'?t stop|not stopping|can'?t stop) (bleeding|blood)\b/i,
      /\bbleeding (heavily|a lot|badly|won'?t stop|that won'?t stop|nonstop)\b/i,
      /\b(vomit\w*|cough\w*|spit\w*|pass\w*) (up )?(blood|a lot of blood)\b/i,
      /\b(khoon (nahi ruk|bahut)|khoon ki ulti|khoon aa raha)\b/i,
      /(खून नहीं रुक|खून की उल्टी|बहुत खून)/,
      /\b(sangrado (abundante|grave|que no para)|vomit\w* sangre)\b/i,
    ],
  },
  {
    category: 'poisoning',
    level: 'emergency',
    patterns: [
      /\b(overdos\w*|poison\w*|swallowed (a lot of|too many|bleach|acid|kerosene|pesticide|pills)|drank (bleach|acid|kerosene|pesticide)|took too many (pills|tablets))\b/i,
      /\b(zehar|jahar)\b/i,
      /(ज़हर|जहर|ओवरडोज)/,
      /\b(envenen\w*|sobredosis|intoxicaci[óo]n grave)\b/i,
    ],
  },
  {
    category: 'allergy',
    level: 'emergency',
    patterns: [
      /\b(anaphyla\w*|throat (is )?(closing|swelling|swollen)|swelling (of|in) (the |my )?(face|lips|tongue|throat)|tongue (is )?swelling)\b/i,
      /\b(anafilaxia|garganta (se )?cierra)\b/i,
    ],
  },
  {
    category: 'infant',
    level: 'emergency',
    patterns: [
      /\b(baby|infant|newborn)\b[^.?!]{0,60}\b(not breathing|turning blue|limp|won'?t wake|unresponsive|seizure)\b/i,
      /\b(bachcha|baccha|bache)\b[^.?!]{0,40}\b(saans nahi|behosh|neela)\b/i,
    ],
  },
];

// "no chest pain" / "without bleeding" / "don't have fits" shouldn't trip the alarm.
const NEGATION_BEFORE = /\b(no|not|without|never|denies|deny|don'?t have|doesn'?t have|do not have|isn'?t|nahi|nahin|sin)\s+(\w+\s+){0,2}$/i;

function matchesWithoutNegation(text, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    if (!NEGATION_BEFORE.test(before)) return true;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return false;
}

// Returns { category, level } for the most serious thing the text describes, or null.
export function detectEmergency(text) {
  const input = String(text || '').slice(0, 3000);
  if (!input.trim()) return null;
  for (const level of ['emergency', 'caution']) {
    for (const rule of RULES) {
      if (rule.level === level && rule.patterns.some((p) => matchesWithoutNegation(input, p))) {
        return { category: rule.category, level };
      }
    }
  }
  return null;
}

// Plain-English messages (the web app shows a translated one for the same category).
export function emergencyReply(category) {
  if (category === 'self_harm') {
    return (
      `I’m really sorry you’re going through this, and I’m glad you said something. You deserve support right now.\n\n` +
      `• If you might act on these thoughts, or you’re in danger, call ${EMERGENCY_NUMBER} now or go to the nearest hospital.\n` +
      `• To talk to someone, call Tele-MANAS on ${MENTAL_HEALTH_HELPLINE} (free, 24×7).\n` +
      `• If you can, stay with someone you trust until help arrives.\n\n` +
      `You don’t have to handle this alone.`
    );
  }
  return (
    `What you describe could be a medical emergency. Please don’t wait for an online appointment.\n\n` +
    `• Call ${EMERGENCY_NUMBER} (India’s emergency number) now, or go to the nearest hospital emergency department.\n` +
    `• If possible, don’t go alone and don’t drive yourself.\n\n` +
    `Once you are safe and have been seen, I can help you find a doctor for follow-up care.`
  );
}

export function cautionNote(category) {
  return (
    `Heads-up: ${category === 'heart' ? 'chest pain' : category === 'fainting' ? 'fainting' : 'what you describe'} can sometimes be serious. ` +
    `If it is severe, getting worse, or comes with sweating, breathlessness or pain spreading to the arm or jaw, call ${EMERGENCY_NUMBER} now. ` +
    `Otherwise, please be seen by a doctor today.`
  );
}
