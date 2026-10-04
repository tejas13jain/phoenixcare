# PhoenixCare AI Assistant — design notes

A chat assistant that helps a patient work out what kind of doctor they need, **choose between doctors**, and get a booking ready. It is built so that the AI talks and the *database decides*.

## What it does

1. **Understands the concern** in plain words (English, Hindi, Hinglish, Spanish).
2. **Recommends doctors** using a transparent ranking engine (below), with a plain-language "why this doctor?" and a score breakdown.
3. **Compares 2–3 doctors** side by side and explains the trade-offs ("Dr A is best overall, Dr B can see you sooner").
4. **Finds real open slots** and **prepares a booking** — the patient taps *Review & book*, then confirms and pays on the normal booking screen.
5. **Never diagnoses**, never recommends medicines, and **stops for emergencies** (see Safety).

If there is no API key, the AI is down, or the daily budget is used up, it runs in **guided mode**: the same ranking and cards, driven by the symptom keyword list instead of a language model.

## Architecture

```
patient ──▶ POST /api/v1/assistant/chat
              │
              ├─ 1. emergency screen (plain code, before any AI)  ──▶ emergency reply, no AI call
              ├─ 2. no key / daily cap / busy ─────────────────────▶ guided mode
              └─ 3. Claude tool-use loop (max 6 rounds)
                       tools: find_doctors · get_doctor_details · get_available_slots
                              compare_doctors · propose_booking
                       every tool reads the database and returns structured "cards"
              ▼
         { reply, cards[], safety, mode, shown[] }   → web widget renders the cards
```

Files: `backend/src/services/assistant/` — `emergency.js`, `ranking.js`, `tools.js`, `guided.js`, `assistantService.js`. UI: `web/src/components/assistant/`.

**The key design rule:** every doctor name, rating, fee and time the patient sees is rendered from tool results (the database), not from the model's text. The model chooses which tool to call and writes the sentences around the cards. It cannot invent a doctor, a price or a slot, and `propose_booking` re-checks that the slot is still open.

## How "which doctor is better" is decided

The model never ranks doctors. `ranking.js` scores every verified doctor on the same criteria (out of 100):

| Criterion | Points | Why |
|---|---|---|
| Relevance to the concern | 35 | A doctor must treat the problem before anything else counts. Wrong specialty = never shown. |
| Patient rating (smoothed) | 30 | Bayesian average, so one 5★ review can't beat 200 reviews at 4.8★. |
| How soon they can be seen | 15 | Time matters for a health problem, but never more than quality. |
| Experience | 8 | Logarithmic, small weight: years in practice only loosely track outcomes. |
| Reliability | 6 | Doctor-initiated cancellations in the last 180 days, with a prior so one cancellation doesn't sink a new doctor. |
| Fit | 6 | Language match; price **only** against a budget the patient states. |

- **Rating smoothing:** `(n·rating + 8·4.3) / (n + 8)` — a typical doctor (4.3) counts as 8 "virtual reviews". New doctors start fair (not at zero), and the card says honestly when a rating rests on few reviews.
- **Price is not quality.** Without a budget, fees do not change the score.
- **No pay-to-rank.** "Featured" status and any commercial relationship are deliberately ignored; the assistant tells patients so.
- **Deterministic:** ties break by smoothed rating, then sooner availability, then id.
- **Comparison badges** (computed over the shown doctors): Best overall, Earliest available, Top rated (needs ≥10 reviews), Most experienced (≥10 years), Lowest fee.
- **The price shown always matches the mode being booked** (video by default, or the patient's chosen mode).

## Safety

- **Emergencies are handled by code, before the model.** `emergency.js` screens the last three patient messages in English, Hindi (Roman and Devanagari) and Spanish for chest pain with red flags, breathing difficulty, stroke signs, unconsciousness, active seizure, heavy bleeding, poisoning, severe allergy, infant emergencies and self-harm. A match shows the 112 message (and Tele-MANAS 14416 for self-harm) and the assistant does not continue. Simple negations ("no chest pain") are respected.
- **Caution level** (e.g. chest pain without red flags, fainting): the assistant keeps helping but an urgent-care warning is shown by the app, separately from the model's reply, and same-day slots are preferred.
- **Why so conservative:** a published audit of 23 online symptom checkers found the correct diagnosis listed first in only 34% of cases and appropriate triage advice in 57% (Semigran et al., *BMJ* 2015). So the assistant does not diagnose; it routes to a specialty and a doctor, and a human clinician decides.
- **No medical advice from the model:** the system prompt forbids diagnosis, medicines and result interpretation.
- **Prompt-injection hardening:** tool results and user text are treated as data; doctor-written free text (bios) is never sent to the model; names/specialties are length-clamped and stripped of control characters and angle brackets; patients cannot forge the app's `<context>` block (angle brackets are neutralised); model inputs to tools are schema-validated and bad calls come back as errors.
- **The model cannot book or charge.** `propose_booking` only prepares a card; payment happens on the existing booking page.
- **Safety-classifier refusals:** Claude Opus 5.5 can decline some requests (including, occasionally, benign health wording). Server-side fallback is enabled, and if the request is still declined the patient silently gets guided mode — never an error.

## Privacy and patient autonomy

- **Notice and choice:** before first use the widget explains it is an AI, not a doctor; that messages are processed by an AI service; to call 112 in an emergency; and not to share ID numbers, passwords or payment details. There is an explicit "I'd rather browse doctors myself" option. This follows the autonomy principle in ICMR's *Ethical Guidelines for Application of AI in Biomedical Research and Healthcare* (2023) and WHO's guidance on large multi-modal models for health (2024).
- **Minimal data:** no name, phone, email or account data is sent to the model — only the conversation text and doctors' public facts. Payout details and verification documents never leave the server.
- **No stored chats:** conversations live in the browser's memory only (not localStorage); the server stores nothing from them. Operational logs record metadata only (mode, tools used, token counts, latency), never message text.
- **Third-party processing:** conversations are processed by Anthropic's API. Update the privacy policy to say so (DPDP Act 2023 notice requirements), and confirm your Anthropic data-retention terms before launch.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | _(unset)_ | Unset = guided mode only. |
| `AI_ASSISTANT_MODEL` | `claude-opus-5-5` | Any current Claude model. `claude-sonnet-5-5` is about half the price. |
| `AI_ASSISTANT_EFFORT` | `low` | `low` / `medium` / `high` — thinking depth (cost and latency). |
| `AI_ASSISTANT_DAILY_CAP` | `1000` | AI replies per day, per server instance, before switching to guided mode. |
| `AI_ASSISTANT_FALLBACKS` | `true` | Server-side fallback if a safety classifier declines. |
| `CLINIC_TIME_ZONE` | `Asia/Kolkata` | How slot dates/times are interpreted. |

Also rate-limited to 40 messages per 10 minutes per visitor (`assistantLimiter`).

## Cost (estimate — measure before relying on it)

Fixed prompt + tool definitions ≈ 1.7k tokens; a recommendation turn is typically two model calls (≈ 5–7k input, ≈ 0.7k output tokens in total); a booking turn three. At Opus 5.5 prices ($4 / $20 per million tokens) that is roughly **$0.03–0.06 per patient message**; Sonnet 5.5 is about half. Check `inputTokens` / `outputTokens` in the `assistant` log lines and tune `AI_ASSISTANT_MODEL`, `AI_ASSISTANT_EFFORT` and `AI_ASSISTANT_DAILY_CAP` accordingly. Prompt caching is not enabled (the shared prefix is below the usual minimum cacheable size).

## Testing

Run against an in-memory MongoDB and a scripted stand-in for the Anthropic API (so no key or spend is needed): 73 unit checks (emergency detection incl. 14 must-not-trigger cases, rating fairness, input hygiene) and 82 integration checks (ranking over seeded doctors, what the model is and is not sent, booking never creating an appointment, invented slots rejected, refusals/outages/runaway loops degrading to guided mode, daily cap, HTTP validation, rate limiting), plus a browser walk-through of the full patient journey.

**Not covered:** behaviour of the real model. Everything it can do is bounded by the tools and validation above, but conversation quality (tone, language, clarifying questions) should be reviewed with real traffic, ideally against a small set of recorded scenarios, before wide launch.

## Known limits / next steps

- The daily cap and in-flight limit are per server instance (in memory); use a shared store if you run several instances.
- Ranking relies on ratings and reliability stats; there is no outcome data. Re-check the weights once you have real bookings and complaints.
- Slot times are assumed to be in `CLINIC_TIME_ZONE`.
- Not yet: streaming replies, voice, rescheduling/cancelling through chat, saving a chat for signed-in patients.

## Sources

- Semigran et al., *Evaluation of symptom checkers for self diagnosis and triage: audit study*, BMJ 2015 — https://www.bmj.com/content/351/bmj.h3480
- ICMR, *Ethical Guidelines for Application of AI in Biomedical Research and Healthcare* (2023) — https://www.icmr.gov.in/ethical-guidelines-for-application-of-artificial-intelligence-in-biomedical-research-and-healthcare
- WHO, *Ethics and governance of AI for health: guidance on large multi-modal models* (2024) — https://www.who.int/publications/i/item/9789240084759
