// ─────────────────────────────────────────────────────────────
// attachment.js — attachment style approximation.
// ─────────────────────────────────────────────────────────────
// WARNING: this is an approximation, not a validated instrument.
// Attachment theory (Bowlby, Ainsworth, Hazan & Shaver) is one
// of the most empirically robust frameworks in psychology.
// Validated instruments (AAI, ECR-R) use behavioural interviews
// and standardised questionnaires — neither of which IRIS
// administers.
//
// This approximation maps IRIS facets onto the two axes of
// adult attachment (Bartholomew & Horowitz, 1991):
//   Anxiety:   fear of abandonment, need for reassurance
//   Avoidance: discomfort with closeness, preference for autonomy
//
// Four quadrants:
//   Low anxiety + Low avoidance = SECURE
//   High anxiety + Low avoidance = PREOCCUPIED (anxious)
//   Low anxiety + High avoidance = DISMISSING (avoidant)
//   High anxiety + High avoidance = FEARFUL (disorganised)
//
// Confidence: 'low' — treat as a curiosity, not a clinical
// classification.
//
// Pure function. No side effects.
// ─────────────────────────────────────────────────────────────

const ANXIETY_FACETS = {
  fear: 1.0, bonding: 0.8, vulnerability: 0.6,
  shame: 0.5, desire: 0.4, empathy: 0.3,
  trust: -0.8, autonomy: -0.5, identity: -0.4,
  regulation: -0.3, patience: -0.2,
};

const AVOIDANCE_FACETS = {
  autonomy: 0.9, trust: 0.7, regulation: 0.5,
  patience: 0.3, analytical: 0.2,
  vulnerability: -0.8, bonding: -0.7, empathy: -0.5,
  desire: -0.4, social: -0.3, spontaneity: -0.2,
};

const STYLES = {
  secure: {
    label: 'Secure',
    emoji: '🔒',
    desc: 'Comfortable with closeness and independence. You trust yourself in relationships — able to depend on others without losing yourself, and to stand alone without feeling abandoned. This is the most common style (~50-60% of population) and the healthiest baseline.',
  },
  preoccupied: {
    label: 'Preoccupied (Anxious)',
    emoji: '🔄',
    desc: 'High need for closeness paired with fear of abandonment. You crave deep connection and worry it will be withdrawn. Relationships feel urgent. Your gift is emotional availability; your work is learning that security comes from within, not from constant reassurance.',
  },
  dismissing: {
    label: 'Dismissing (Avoidant)',
    emoji: '🏰',
    desc: 'High self-reliance paired with discomfort around emotional closeness. You value independence and may experience others\' needs as demands. Your gift is genuine self-sufficiency; your work is learning that interdependence is not dependence — letting someone in doesn\'t mean losing yourself.',
  },
  fearful: {
    label: 'Fearful (Disorganised)',
    emoji: '🌪️',
    desc: 'Simultaneous desire for and fear of closeness. You want deep connection but expect it to hurt. This creates approach-avoidance patterns that can be confusing to both you and others. Your gift is depth of feeling; your work is building enough safety to let the pattern soften.',
  },
};

const DISCLAIMER = 'Approximation from facet patterns — not a validated attachment instrument (AAI, ECR-R). Treat as a curiosity and a starting point for reflection, not a clinical classification.';

/**
 * @param {Record<string, number>} facetScores — 0-1 facet map
 * @returns {{
 *   style: string,              // 'secure' | 'preoccupied' | 'dismissing' | 'fearful'
 *   label: string,
 *   emoji: string,
 *   desc: string,
 *   anxiety: number,            // 0-1
 *   avoidance: number,          // 0-1
 *   disclaimer: string,
 * }}
 */
export function approximateAttachment(facetScores) {
  if (!facetScores) return null;

  function score(weights) {
    let sum = 0;
    let wsum = 0;
    for (const [facet, w] of Object.entries(weights)) {
      const v = facetScores[facet] ?? 0.5;
      sum += v * w;
      wsum += Math.abs(w);
    }
    const raw = wsum > 0 ? (sum / wsum + 1) / 2 : 0.5;
    return Math.max(0, Math.min(1, raw));
  }

  const anxiety = score(ANXIETY_FACETS);
  const avoidance = score(AVOIDANCE_FACETS);

  // Quadrant classification
  let style = 'secure';
  if (anxiety > 0.55 && avoidance > 0.55) style = 'fearful';
  else if (anxiety > 0.55) style = 'preoccupied';
  else if (avoidance > 0.55) style = 'dismissing';

  return {
    style,
    label: STYLES[style].label,
    emoji: STYLES[style].emoji,
    desc: STYLES[style].desc,
    anxiety: Math.round(anxiety * 100),
    avoidance: Math.round(avoidance * 100),
    disclaimer: DISCLAIMER,
  };
}
