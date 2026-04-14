import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { classifyTernary } from "../../lib/ternary.js";

// ═══════════════════════════════════════════════════════════════
// IRIS v4.0 — Integrative Resonance Identity Simulation
// The Coliseum · Player Cards · Full Psyche Engine
// Eclipse Ventures LLC / Yunis AI
// ═══════════════════════════════════════════════════════════════

const DOMAINS = [
  { name: "Cognitive", color: "#7eb5ff" },
  { name: "Emotional", color: "#ff6b8a" },
  { name: "Volitional", color: "#ffa94d" },
  { name: "Relational", color: "#69db7c" },
  { name: "Existential", color: "#b197fc" },
  { name: "Shadow", color: "#868e96" },
];

const FACETS = [
  { id: "analytical", short: "Analysis", domain: 0, low: "You process through feel and instinct rather than systematic breakdown. You trust your gut over spreadsheets \u2014 fast but sometimes imprecise.", mid: "You toggle between intuitive leaps and careful analysis. Not enslaved to data, but you respect it. This flexibility is rare.", high: "Your mind is a scalpel. You deconstruct complexity into components and causal chains. Extraordinary diagnostic power, but can slow you when data is ambiguous." },
  { id: "pattern", short: "Patterns", domain: 0, low: "You take things at face value, staying grounded and present. Less likely to see hidden agendas but may miss subtle signals.", mid: "You catch patterns when looking but don\u2019t obsessively hunt. You connect dots without becoming paranoid. Functional without being naive.", high: "You see the matrix. Hidden structures reveal themselves before others know to look. Your superpower and curse \u2014 you may over-pattern, seeing meaning in noise." },
  { id: "abstract", short: "Abstraction", domain: 0, low: "Concrete thinker \u2014 you need to touch it or build it before it feels real. Your gift is staying rooted in what exists.", mid: "You entertain abstract ideas without losing footing. Theory needs connection to practice before you invest. A good translator between visionaries and operators.", high: "You live in ideas without physical form. Metaphor and structural thinking are native. Risk: building elaborate architectures that never touch ground." },
  { id: "pragmatic", short: "Pragmatism", domain: 0, low: "Drawn to elegance over efficiency. You\u2019d rather build something beautiful and impractical. An artist at heart.", mid: "You balance idealism with practicality. Things should work AND mean something. You won\u2019t ship shame, but won\u2019t polish forever.", high: "Relentlessly outcome-oriented. If it works, it\u2019s right. Devastatingly effective but sometimes blind to beauty and nuance." },
  { id: "depth", short: "Depth", domain: 1, low: "You keep emotional register shallow \u2014 not unfeeling, but efficient. Quick recovery, low rumination. Peak joy and connection may feel slightly muted.", mid: "Access to deep feeling but don\u2019t live there permanently. You can dive and surface as needed. Emotionally sustainable.", high: "You feel everything at full volume. Joy is ecstatic, grief annihilating. Access to registers most never touch, but ordinary life can feel painfully insufficient." },
  { id: "empathy", short: "Empathy", domain: 1, low: "Others\u2019 emotions don\u2019t auto-transfer. Not coldness \u2014 insulation. Compassionate without being destabilized. The steady one in crisis.", mid: "You feel others without drowning. Hold space while maintaining center of gravity. Reliable support without becoming a sponge.", high: "You absorb the emotional weather involuntarily. Feel a room\u2019s mood before a word is spoken. Extraordinary relational intelligence, but others\u2019 emotions become indistinguishable from your own." },
  { id: "regulation", short: "Regulation", domain: 1, low: "Emotions arrive unfiltered. Authentic and intensely present, but strong feelings can hijack decisions. Your growth edge.", mid: "You hold center under pressure mostly. Enough self-awareness to know when feelings are driving versus judgment.", high: "Supernatural ability to hold intense emotions without being controlled. You feel everything but choose expression. Others may read you as cold when you\u2019re metabolizing internally." },
  { id: "vulnerability", short: "Vulnerability", domain: 1, low: "You keep unfinished edges hidden. Being seen uncertain feels dangerous. Protects from judgment but prevents the deepest intimacy.", mid: "Vulnerable with right people in right contexts. Selective. Trust is earned, not assumed.", high: "You lead with your cracks. Show people who you are before you\u2019ve figured it out. Radical openness that creates instant depth or instant discomfort." },
  { id: "assertion", short: "Assertion", domain: 2, low: "You yield rather than push. Conflict feels expensive. Harmonious but actual needs consistently unmet. Things unsaid accumulate.", mid: "Assert when it matters, don\u2019t lead with force. Pick battles with accuracy. Not a pushover, not a bulldozer.", high: "You project force naturally. Rooms reorganize around you. This is power \u2014 the discipline is learning when not to use it." },
  { id: "discipline", short: "Discipline", domain: 2, low: "Better in sprints than marathons. Rely on inspiration rather than routine. Creative and spontaneous but unreliable over long timelines.", mid: "Maintain effort when purpose is clear. Discipline is purpose-dependent \u2014 give you a reason and you\u2019re relentless.", high: "Sustain effort past where most quit. Consistency as moral act. Risk: discipline becomes its own justification on paths that should be abandoned." },
  { id: "spontaneity", short: "Spontaneity", domain: 2, low: "Don\u2019t move without a plan. Improvisation feels reckless. Predictability feels safe. Cost: life\u2019s best moments arrive unscheduled.", mid: "Can improvise when forced but prefer a framework. Not rigid, not chaotic. Structure with room for the unexpected.", high: "You thrive in the unplanned. Trust yourself with whatever arrives. Adaptable and alive, but may avoid the boring-but-necessary building work." },
  { id: "patience", short: "Patience", domain: 2, low: "You want results now. Waiting feels like dying slowly. Impatience makes you fast but often premature.", mid: "Wait when payoff is visible. Patient with clear milestones, restless with stagnation.", high: "You understand the most valuable things can\u2019t be rushed. Play long games without anxiety. Risk: patience becoming passivity." },
  { id: "bonding", short: "Bonding", domain: 3, low: "Deep one-to-one isn\u2019t your primary mode. Connect through shared work, ideas, or experience rather than emotional fusion.", mid: "Meaningful bonds with clear boundaries. Go deep without losing yourself. Sustainable because not desperate.", high: "Bond at molecular level. Psychic entanglement \u2014 carry them with you, feel absence as weight. Extraordinary intimacy but loss is devastating." },
  { id: "social", short: "Social", domain: 3, low: "Groups aren\u2019t your habitat. You find social navigation exhausting. Strength is depth, not breadth.", mid: "Read and navigate groups when necessary. Understand dynamics intellectually. Can play the game but it drains.", high: "Instinctively read invisible group architecture \u2014 power, performance, tension. Natural precision. Risk: always performing rather than being." },
  { id: "autonomy", short: "Autonomy", domain: 3, low: "Comfortable with interdependence. Being embedded feels natural. Risk: losing track of own needs.", mid: "Need your space but not total independence. Collaborate without compromise. Alone without isolation.", high: "Sovereignty is non-negotiable. Operate on own terms. Greatest strength and deepest isolation \u2014 the wall protects and keeps people out." },
  { id: "trust", short: "Trust", domain: 3, low: "Trust easily, sometimes too easily. Default to openness. Accelerates relationships but exposes to exploitation.", mid: "Trust incrementally \u2014 earned through demonstrated reliability. Neither paranoid nor naive.", high: "Trust threshold is a fortress. People must prove themselves repeatedly. Single betrayal permanently reclassifies. Protects but may prevent receiving support." },
  { id: "purpose", short: "Purpose", domain: 4, low: "No strong singular mission. Life is exploration. Freedom is real, but occasional vertigo of not knowing why.", mid: "General direction but not a laser. Know what matters broadly. Flexibility protects from over-identification.", high: "The signal is clear and strong. You know what you\u2019re building and what you\u2019ll sacrifice. Rare clarity, but can blind you to adjacent possibilities." },
  { id: "identity", short: "Identity", domain: 4, low: "Self-concept is fluid and context-dependent. Adaptable but \u2018who am I really?\u2019 visits often.", mid: "Stable self-concept that flexes without breaking. You know who you are \u2014 still refining details.", high: "Identity is a fortress. External pressure doesn\u2019t erode self-concept. Risk: rigidity that can\u2019t incorporate new self-knowledge." },
  { id: "mortality", short: "Mortality", domain: 4, low: "Death lives in abstract. Functional and forward-looking. May postpone urgency that comes from grasping finite time.", mid: "Awareness of finitude surfaces in certain moments. Not constant but accessible. Gives periodic weight to decisions.", high: "You live with death in the room. Not morbidly but viscerally. Shapes how you spend time and what you tolerate. Unusual clarity about what matters." },
  { id: "transcendence", short: "Transcendence", domain: 4, low: "Grounded in material world. Find meaning in tangible things. The sacred in the ordinary.", mid: "Occasionally touch something beyond material. Glimpses inform life without dominating.", high: "You hunger for contact beyond the material. Constantly reaching for the edge of ordinary consciousness. Source of deepest insights and deepest dissatisfaction." },
  { id: "anger", short: "Anger", domain: 5, low: "Anger largely inaccessible. Boundaries invisible to others. Learning to feel anger without becoming it is your work.", mid: "Functional relationship with anger. Feel it, express when necessary, release without consuming. Boundary signal, not controlling force.", high: "Anger is close and available. Feel it quickly, intensely, clearly. Powerful boundary-setting but unchecked can damage relationships." },
  { id: "fear", short: "Fear", domain: 5, low: "Low anxiety. Risk doesn\u2019t paralyze. Genuine courage, but make sure it\u2019s not denial \u2014 fear is sometimes information.", mid: "Fear present but manageable. Feel it before big decisions but it doesn\u2019t stop you. Move with fear rather than waiting.", high: "Fear is constant companion. Hyper-aware of what could go wrong. Excellent risk-assessor but can trap you in endless preparation." },
  { id: "shame", short: "Shame", domain: 5, low: "Low internalized inadequacy. Fail publicly without identity crisis. Resilient, but make sure you\u2019re metabolizing lessons.", mid: "Shame visits but doesn\u2019t move in. Process without spiraling into self-destruction.", high: "Shame runs deep. Feel the gap between who you are and should be as constant pain. Drives improvement but can make you perform rather than be." },
  { id: "desire", short: "Desire", domain: 5, low: "Wants muted or hidden, even from yourself. May look like contentment but might be suppression. Unfelt desires drive from the basement.", mid: "Know what you want, name most of it. Don\u2019t let desire run your life. Peace with wanting as a feature of being alive.", high: "Transparent about what you want. Desire is visible force. Liberating honesty, but unmoderated can become consumption \u2014 always reaching, never savoring." },
];

// ═══ COLISEUM DATA — Statistical + Historical ═══
// Population data from Enneagram Institute / RHETI studies
const COLISEUM = {
  1: { pop: 14, glyph: "\u2694", title: "The Reformer", tagline: "Principled \u00b7 Purposeful \u00b7 Self-Controlled", era: "The Judge-Kings", history: "Throughout history, Type 1s have been the moral architects \u2014 the lawmakers, the quality controllers, the voices saying 'this is not good enough.' From Confucius codifying ethical conduct to Florence Nightingale reforming healthcare, Ones channel anger into systematic improvement. In modern society, they populate standards bodies, quality assurance, judicial systems, and reform movements. Their shadow across history is fundamentalism \u2014 when the inner standard becomes an outer weapon.", strengths: ["Moral clarity", "Systematic improvement", "Relentless standards", "Ethical backbone"], weaknesses: ["Rigidity under stress", "Suppressed anger", "Perfectionism paralysis", "Judgmental tendencies"], society: { leadership: 18, creative: 8, technical: 16, service: 14, entrepreneurial: 10 }, figures: "Confucius \u00b7 Gandhi \u00b7 Martha Graham" },
  2: { pop: 9, glyph: "\u2661", title: "The Helper", tagline: "Generous \u00b7 Demonstrative \u00b7 People-Pleasing", era: "The Healers", history: "Type 2s are the invisible infrastructure of every civilization. They are the caretakers, the community builders, the people who remember your birthday and show up with food when you\u2019re grieving. Historically they\u2019ve powered charitable movements, nursing, education, and social work. Their influence is often unrecorded because they operate through others. The shadow is codependency \u2014 when giving becomes a transaction for love.", strengths: ["Emotional intelligence", "Relationship building", "Selfless service", "Intuitive caregiving"], weaknesses: ["Boundary erosion", "Indirect manipulation", "Self-neglect", "Pride in indispensability"], society: { leadership: 7, creative: 12, technical: 4, service: 28, entrepreneurial: 6 }, figures: "Mother Teresa \u00b7 Mr. Rogers \u00b7 Desmond Tutu" },
  3: { pop: 11, glyph: "\u2605", title: "The Achiever", tagline: "Adaptive \u00b7 Excelling \u00b7 Image-Conscious", era: "The Architects of Success", history: "Type 3s built the modern meritocracy. They are the CEOs, the Olympic athletes, the self-made founders who turn vision into measurable reality. American culture is essentially a Type 3 culture \u2014 optimistic, achievement-oriented, and performance-driven. Historically, they\u2019ve been the empire builders, the brand creators, and the people who make things scale. Their shadow is the empty trophy room \u2014 achievement without meaning.", strengths: ["Goal execution", "Adaptability", "Motivating others", "Efficient systems thinking"], weaknesses: ["Identity confusion", "Workaholism", "Emotional bypassing", "Image over substance"], society: { leadership: 31, creative: 10, technical: 12, service: 5, entrepreneurial: 28 }, figures: "Oprah \u00b7 Muhammad Ali \u00b7 Tony Robbins" },
  4: { pop: 11, glyph: "\u25c7", title: "The Individualist", tagline: "Expressive \u00b7 Dramatic \u00b7 Self-Absorbed", era: "The Romantic Visionaries", history: "Type 4s gave humanity its art, its poetry, and its permission to feel. Every Romantic movement, every artistic revolution, every cultural moment that said 'authenticity matters more than conformity' was 4-energy. They populate the arts, therapy, design, and anywhere that emotional truth is the product. Their historical gift is making the interior visible. Their shadow is the belief that suffering is identity.", strengths: ["Emotional authenticity", "Creative vision", "Depth perception", "Identity integrity"], weaknesses: ["Melancholic self-absorption", "Envy of normalcy", "Emotional volatility", "Elitist suffering"], society: { leadership: 4, creative: 34, technical: 6, service: 12, entrepreneurial: 8 }, figures: "Frida Kahlo \u00b7 Edgar Allan Poe \u00b7 Prince" },
  5: { pop: 10, glyph: "\u25ce", title: "The Investigator", tagline: "Perceptive \u00b7 Cerebral \u00b7 Secretive", era: "The Knowledge Architects", history: "Type 5s built the intellectual infrastructure of civilization. They are the scientists, the researchers, the systems thinkers who observe the world from enough distance to see its actual structure. From Newton to Einstein to modern AI researchers, Fives trade social currency for cognitive capital. They populate academia, R&D, engineering, and anywhere that deep expertise is valued over social skill. Their shadow is detachment from the embodied world.", strengths: ["Deep expertise", "Independent thinking", "Objective analysis", "Innovative synthesis"], weaknesses: ["Emotional detachment", "Social withdrawal", "Hoarding resources", "Analysis paralysis"], society: { leadership: 6, creative: 11, technical: 35, service: 3, entrepreneurial: 9 }, figures: "Einstein \u00b7 Bill Gates \u00b7 Jane Goodall" },
  6: { pop: 17, glyph: "\u26e8", title: "The Loyalist", tagline: "Committed \u00b7 Security-Oriented \u00b7 Anxious", era: "The Guardians", history: "Type 6s are the most common type and the backbone of institutional stability. They are the firefighters, the soldiers, the risk managers, and the people who actually read the safety manual. Every functioning democracy, every insurance system, every emergency protocol exists because Sixes built it. They trust systems over individuals and test everything before relying on it. Their shadow is the paralysis of perpetual doubt.", strengths: ["Loyalty and commitment", "Risk assessment", "Institutional building", "Troubleshooting"], weaknesses: ["Chronic anxiety", "Authority ambivalence", "Worst-case fixation", "Projection of fears"], society: { leadership: 12, creative: 6, technical: 18, service: 22, entrepreneurial: 7 }, figures: "J.R.R. Tolkien \u00b7 Robert F. Kennedy \u00b7 Ellen DeGeneres" },
  7: { pop: 13, glyph: "\u2600", title: "The Enthusiast", tagline: "Spontaneous \u00b7 Versatile \u00b7 Scattered", era: "The Renaissance Minds", history: "Type 7s are civilization\u2019s optimists and innovators. They connect ideas across domains, generate possibilities faster than anyone can execute them, and maintain an almost religious faith that the best is yet to come. They are the entrepreneurs, the comedians, the travel writers, and the people who turn any crisis into a brainstorming session. Their historical gift is making the future feel exciting. Their shadow is the flight from pain.", strengths: ["Visionary ideation", "Cross-domain thinking", "Infectious optimism", "Rapid adaptation"], weaknesses: ["Commitment avoidance", "Pain bypassing", "Superficial engagement", "Addictive tendencies"], society: { leadership: 10, creative: 22, technical: 8, service: 6, entrepreneurial: 24 }, figures: "Leonardo da Vinci \u00b7 Robin Williams \u00b7 Richard Branson" },
  8: { pop: 8, glyph: "\u2655", title: "The Challenger", tagline: "Powerful \u00b7 Dominating \u00b7 Self-Confident", era: "The Sovereigns", history: "Type 8s are the rarest type and the most immediately impactful. They are the founders, the generals, the revolutionaries who reshape reality through sheer force of will. History\u2019s great liberators, its most effective leaders, and its most terrifying tyrants have all been Eights. They hold power naturally and use it to protect or to dominate. In modern society, they run companies, lead movements, and set the terms. Their shadow is the vulnerability they refuse to show.", strengths: ["Decisive leadership", "Boundary enforcement", "Protective instinct", "Raw willpower"], weaknesses: ["Intimidation", "Control obsession", "Vulnerability denial", "Excessive force"], society: { leadership: 28, creative: 5, technical: 7, service: 4, entrepreneurial: 22 }, figures: "Martin Luther King Jr. \u00b7 Ernest Hemingway \u00b7 Serena Williams" },
  9: { pop: 16, glyph: "\u262f", title: "The Peacemaker", tagline: "Receptive \u00b7 Reassuring \u00b7 Complacent", era: "The Harmonizers", history: "Type 9s are the second most common type and the most underestimated. They are the mediators, the diplomats, the people who hold contradictions without breaking. Every peace treaty, every successful merger, every family that stayed together through crisis had Nine energy at the center. They see all perspectives simultaneously, which is both their gift and their paralysis. Their shadow is self-erasure \u2014 disappearing into other people\u2019s agendas.", strengths: ["Universal empathy", "Mediation", "Conflict resolution", "Holding complexity"], weaknesses: ["Self-neglect", "Passive aggression", "Decision avoidance", "Numbing out"], society: { leadership: 8, creative: 14, technical: 10, service: 18, entrepreneurial: 5 }, figures: "Abraham Lincoln \u00b7 Carl Jung \u00b7 Audrey Hepburn" },
};

const ENNEAGRAM_PROFILES = {
  1: { name: "The Reformer", color: "#e8e8e8", desc: "You are driven by an internal compass of rightness. Your gift is seeing how things should be \u2014 the gap between reality and the ideal is always visible, and you cannot rest until it\u2019s closed. Your discipline and moral seriousness make you a force for genuine improvement. But the inner critic that drives your excellence also punishes you for being human. Learning that imperfection is not moral failure is your life\u2019s work.", facets: { analytical: 0.85, pattern: 0.6, abstract: 0.5, pragmatic: 0.7, depth: 0.5, empathy: 0.4, regulation: 0.85, vulnerability: 0.2, assertion: 0.7, discipline: 0.95, spontaneity: 0.15, patience: 0.5, bonding: 0.4, social: 0.5, autonomy: 0.6, trust: 0.5, purpose: 0.9, identity: 0.7, mortality: 0.4, transcendence: 0.5, anger: 0.9, fear: 0.4, shame: 0.6, desire: 0.2 }},
  2: { name: "The Helper", color: "#ff8fa3", desc: "You move with an open heart and involuntary attunement to what others need. When you show up, people feel seen. But beneath the giving is a question: what do you need? The help you offer is real, but can become a strategy for earning love you believe you can\u2019t receive for free. Your growth is learning you are worthy not because of what you give, but because of who you are.", facets: { analytical: 0.3, pattern: 0.5, abstract: 0.3, pragmatic: 0.6, depth: 0.8, empathy: 0.95, regulation: 0.3, vulnerability: 0.7, assertion: 0.3, discipline: 0.5, spontaneity: 0.6, patience: 0.6, bonding: 0.95, social: 0.8, autonomy: 0.15, trust: 0.3, purpose: 0.5, identity: 0.4, mortality: 0.3, transcendence: 0.4, anger: 0.3, fear: 0.4, shame: 0.5, desire: 0.8 }},
  3: { name: "The Achiever", color: "#ffd43b", desc: "Built for performance. You read environments instantly, identify success, and become the version most likely to achieve it. Devastatingly effective \u2014 you accomplish what others only talk about. But the machinery can run without you. Your deepest work is discovering who you are when nothing is being measured and there is no applause.", facets: { analytical: 0.6, pattern: 0.7, abstract: 0.4, pragmatic: 0.9, depth: 0.3, empathy: 0.4, regulation: 0.7, vulnerability: 0.1, assertion: 0.85, discipline: 0.8, spontaneity: 0.5, patience: 0.3, bonding: 0.3, social: 0.9, autonomy: 0.5, trust: 0.4, purpose: 0.8, identity: 0.3, mortality: 0.3, transcendence: 0.3, anger: 0.4, fear: 0.5, shame: 0.9, desire: 0.5 }},
  4: { name: "The Individualist", color: "#9775fa", desc: "You experience life at depth and intensity most never access. Beauty, meaning, identity, loss \u2014 not concepts but the weather you live in. Your gift is authenticity: you refuse to be anyone other than who you actually are. But the same sensitivity can convince you that suffering is identity. You are different \u2014 and in the ways that matter most, exactly the same.", facets: { analytical: 0.4, pattern: 0.8, abstract: 0.8, pragmatic: 0.2, depth: 0.95, empathy: 0.7, regulation: 0.2, vulnerability: 0.9, assertion: 0.3, discipline: 0.3, spontaneity: 0.6, patience: 0.4, bonding: 0.8, social: 0.3, autonomy: 0.7, trust: 0.5, purpose: 0.5, identity: 0.9, mortality: 0.9, transcendence: 0.85, anger: 0.5, fear: 0.5, shame: 0.8, desire: 0.7 }},
  5: { name: "The Investigator", color: "#74c0fc", desc: "Your mind is a cathedral \u2014 vast, quiet, built for contemplation. You understand by taking things apart. Knowledge becomes security. Your internal world is so rich you need less from the external. But the fortress of understanding can become a prison. Your growth is stepping into the weather \u2014 not knowing, just being present with unmediated experience.", facets: { analytical: 0.95, pattern: 0.9, abstract: 0.9, pragmatic: 0.4, depth: 0.6, empathy: 0.3, regulation: 0.8, vulnerability: 0.1, assertion: 0.2, discipline: 0.7, spontaneity: 0.1, patience: 0.85, bonding: 0.2, social: 0.15, autonomy: 0.95, trust: 0.8, purpose: 0.6, identity: 0.7, mortality: 0.6, transcendence: 0.6, anger: 0.2, fear: 0.7, shame: 0.4, desire: 0.15 }},
  6: { name: "The Loyalist", color: "#63e6be", desc: "You see the world with unusual clarity about what could go wrong \u2014 and you stay anyway. Your loyalty is a choice made with full risk awareness, making it more valuable than naive trust. You stress-test every bridge. But constant scanning is exhausting. Some bridges are solid. Some people are safe. Learning to feel that in your body is your work.", facets: { analytical: 0.7, pattern: 0.6, abstract: 0.4, pragmatic: 0.7, depth: 0.5, empathy: 0.6, regulation: 0.4, vulnerability: 0.5, assertion: 0.4, discipline: 0.7, spontaneity: 0.3, patience: 0.6, bonding: 0.6, social: 0.7, autonomy: 0.3, trust: 0.9, purpose: 0.5, identity: 0.5, mortality: 0.7, transcendence: 0.3, anger: 0.5, fear: 0.95, shame: 0.5, desire: 0.4 }},
  7: { name: "The Enthusiast", color: "#ffa94d", desc: "Wired for possibility. Where others see one path, you see seventeen. Your enthusiasm is genuine \u2014 you make everything more alive. But the constant forward motion can be sophisticated escape from pain. The one place you struggle to visit is the present moment when it hurts. Your growth: depth is not the opposite of freedom. Sometimes the most adventurous thing is to stay.", facets: { analytical: 0.4, pattern: 0.6, abstract: 0.7, pragmatic: 0.5, depth: 0.3, empathy: 0.5, regulation: 0.2, vulnerability: 0.3, assertion: 0.6, discipline: 0.2, spontaneity: 0.95, patience: 0.1, bonding: 0.4, social: 0.8, autonomy: 0.6, trust: 0.3, purpose: 0.4, identity: 0.4, mortality: 0.2, transcendence: 0.7, anger: 0.3, fear: 0.3, shame: 0.2, desire: 0.95 }},
  8: { name: "The Challenger", color: "#ff6b6b", desc: "You carry a force most spend their lives trying to develop. You say what you mean, protect what you love, refuse to be controlled. Your presence moves rooms. But beneath the armor is a tenderness so vast you\u2019re afraid it would destroy you. It won\u2019t. The vulnerability you guard is not your weakness \u2014 it\u2019s what makes your strength worth having.", facets: { analytical: 0.5, pattern: 0.5, abstract: 0.3, pragmatic: 0.85, depth: 0.4, empathy: 0.3, regulation: 0.5, vulnerability: 0.1, assertion: 0.95, discipline: 0.7, spontaneity: 0.7, patience: 0.2, bonding: 0.3, social: 0.5, autonomy: 0.9, trust: 0.85, purpose: 0.7, identity: 0.8, mortality: 0.4, transcendence: 0.2, anger: 0.95, fear: 0.2, shame: 0.1, desire: 0.7 }},
  9: { name: "The Peacemaker", color: "#a9e34b", desc: "You hold the rarest gift: seeing all perspectives simultaneously without choosing one as superior. A natural mediator. People feel safe because you don\u2019t judge. But the peace you create for others costs your own voice. You merge with others\u2019 agendas, suppress desires, disappear into the background. Your growth is mattering \u2014 saying \u2018I want this\u2019 even when it disrupts the harmony.", facets: { analytical: 0.3, pattern: 0.5, abstract: 0.5, pragmatic: 0.5, depth: 0.5, empathy: 0.8, regulation: 0.6, vulnerability: 0.5, assertion: 0.1, discipline: 0.3, spontaneity: 0.4, patience: 0.9, bonding: 0.6, social: 0.6, autonomy: 0.3, trust: 0.3, purpose: 0.2, identity: 0.3, mortality: 0.3, transcendence: 0.5, anger: 0.1, fear: 0.4, shame: 0.4, desire: 0.3 }},
};

const SCENARIOS = [
  { phase: "Perception", prompt: "You notice something nobody else in the room has seen.", choices: [{ text: "Catalog it silently.", scores: { analytical: 0.8, regulation: 0.7, trust: 0.7, patience: 0.8 }},{ text: "Name it out loud.", scores: { assertion: 0.8, vulnerability: 0.6, anger: 0.5, desire: 0.7 }},{ text: "Feel it in your body first.", scores: { depth: 0.8, empathy: 0.7, pattern: 0.7, mortality: 0.5 }},{ text: "Check if anyone else caught it.", scores: { social: 0.8, bonding: 0.6, trust: 0.4, fear: 0.5 }}]},
  { phase: "Pressure", prompt: "Someone questions your competence publicly.", choices: [{ text: "Dismantle their argument.", scores: { analytical: 0.9, assertion: 0.7, shame: 0.8, regulation: 0.6 }},{ text: "Smile. Let work answer later.", scores: { patience: 0.9, regulation: 0.8, identity: 0.7, anger: 0.3 }},{ text: "Feel the wound, don\u2019t flinch.", scores: { depth: 0.7, vulnerability: 0.6, shame: 0.6, pattern: 0.7 }},{ text: "Redirect to what matters.", scores: { social: 0.8, pragmatic: 0.7, assertion: 0.5, discipline: 0.6 }}]},
  { phase: "Solitude", prompt: "Three days alone. No obligations.", choices: [{ text: "Thriving. Signal is clearest in silence.", scores: { autonomy: 0.95, abstract: 0.7, patience: 0.7, bonding: 0.1 }},{ text: "Productive but hollow.", scores: { purpose: 0.7, bonding: 0.7, discipline: 0.6, desire: 0.6 }},{ text: "Restless. Stillness is entropy.", scores: { spontaneity: 0.9, assertion: 0.5, fear: 0.5, transcendence: 0.4 }},{ text: "Deep. Three days barely reaches the floor.", scores: { depth: 0.9, mortality: 0.7, identity: 0.7, transcendence: 0.8 }}]},
  { phase: "Betrayal", prompt: "Someone you trusted breaks it deliberately.", choices: [{ text: "Cut them clean.", scores: { anger: 0.8, autonomy: 0.8, trust: 0.9, assertion: 0.7 }},{ text: "Try to understand why.", scores: { empathy: 0.9, depth: 0.7, vulnerability: 0.6, fear: 0.4 }},{ text: "Go quiet. Process for weeks.", scores: { regulation: 0.8, patience: 0.8, analytical: 0.6, shame: 0.5 }},{ text: "Ask what you missed.", scores: { pattern: 0.8, analytical: 0.7, fear: 0.7, identity: 0.5 }}]},
  { phase: "Creation", prompt: "Building from nothing. No blueprint.", choices: [{ text: "Start with structure.", scores: { analytical: 0.8, discipline: 0.8, pragmatic: 0.6, purpose: 0.7 }},{ text: "Start with feeling.", scores: { depth: 0.7, spontaneity: 0.7, abstract: 0.7, transcendence: 0.6 }},{ text: "Start with the end user.", scores: { empathy: 0.7, pragmatic: 0.8, social: 0.6, bonding: 0.5 }},{ text: "Destroy the first idea.", scores: { pattern: 0.7, anger: 0.5, spontaneity: 0.6, identity: 0.6 }}]},
  { phase: "Authority", prompt: "Given power over people who didn\u2019t choose you.", choices: [{ text: "Build fair systems.", scores: { analytical: 0.7, discipline: 0.8, regulation: 0.7, purpose: 0.8 }},{ text: "Lead from the front.", scores: { assertion: 0.9, vulnerability: 0.6, anger: 0.5, bonding: 0.5 }},{ text: "Listen first.", scores: { empathy: 0.8, patience: 0.7, social: 0.7, shame: 0.4 }},{ text: "Refuse it.", scores: { autonomy: 0.8, fear: 0.6, identity: 0.7, trust: 0.6 }}]},
  { phase: "Loss", prompt: "Something you loved is gone. Grief is physical.", choices: [{ text: "Let it shatter me.", scores: { vulnerability: 0.9, depth: 0.9, mortality: 0.8, regulation: 0.2 }},{ text: "Build in its place.", scores: { discipline: 0.7, pragmatic: 0.6, purpose: 0.7, desire: 0.5 }},{ text: "Sit with it.", scores: { patience: 0.8, mortality: 0.8, identity: 0.6, transcendence: 0.6 }},{ text: "Call someone.", scores: { bonding: 0.9, empathy: 0.6, social: 0.5, fear: 0.4 }}]},
  { phase: "Temptation", prompt: "Opportunity requires bending a held principle.", choices: [{ text: "Hold the line.", scores: { discipline: 0.9, identity: 0.9, purpose: 0.7, anger: 0.6 }},{ text: "Bend.", scores: { pragmatic: 0.8, spontaneity: 0.6, desire: 0.7, abstract: 0.5 }},{ text: "Pause. Urgency is suspicious.", scores: { pattern: 0.8, regulation: 0.7, fear: 0.7, patience: 0.7 }},{ text: "Take it, name the cost.", scores: { vulnerability: 0.7, assertion: 0.6, shame: 0.6, social: 0.6 }}]},
  { phase: "Conflict", prompt: "Two people you love destroying each other.", choices: [{ text: "Mediate.", scores: { empathy: 0.8, regulation: 0.8, social: 0.7, patience: 0.6 }},{ text: "Choose a side.", scores: { assertion: 0.7, anger: 0.6, bonding: 0.7, purpose: 0.5 }},{ text: "Step back.", scores: { autonomy: 0.8, regulation: 0.6, trust: 0.5, fear: 0.4 }},{ text: "Show them the pattern.", scores: { pattern: 0.9, abstract: 0.6, analytical: 0.5, depth: 0.6 }}]},
  { phase: "Identity", prompt: "Others\u2019 version of you isn\u2019t who you are.", choices: [{ text: "Burn the mask.", scores: { identity: 0.9, vulnerability: 0.8, anger: 0.6, desire: 0.8 }},{ text: "Evolve slowly.", scores: { patience: 0.7, regulation: 0.7, pragmatic: 0.6, shame: 0.5 }},{ text: "The gap is interesting.", scores: { abstract: 0.8, depth: 0.7, identity: 0.5, transcendence: 0.7 }},{ text: "Start with who you are alone.", scores: { autonomy: 0.7, purpose: 0.7, analytical: 0.5, mortality: 0.5 }}]},
  { phase: "Desire", prompt: "You want something so badly it scares you.", choices: [{ text: "Name it out loud.", scores: { desire: 0.95, vulnerability: 0.7, assertion: 0.6, identity: 0.6 }},{ text: "Interrogate it.", scores: { analytical: 0.7, pattern: 0.7, autonomy: 0.6, fear: 0.6 }},{ text: "Channel it.", scores: { discipline: 0.7, pragmatic: 0.7, purpose: 0.7, regulation: 0.6 }},{ text: "Release it.", scores: { transcendence: 0.9, patience: 0.7, mortality: 0.5, regulation: 0.7 }}]},
  { phase: "Fear", prompt: "At the exact boundary of your competence.", choices: [{ text: "Step.", scores: { spontaneity: 0.8, assertion: 0.7, fear: 0.3, desire: 0.6 }},{ text: "Map first.", scores: { analytical: 0.8, patience: 0.7, fear: 0.7, discipline: 0.6 }},{ text: "The boundary IS the destination.", scores: { abstract: 0.7, depth: 0.6, mortality: 0.6, transcendence: 0.6 }},{ text: "Find someone who\u2019s crossed.", scores: { bonding: 0.7, social: 0.6, trust: 0.5, empathy: 0.5 }}]},
  { phase: "Joy", prompt: "Something going perfectly. Suspiciously well.", choices: [{ text: "Let it in fully.", scores: { vulnerability: 0.8, depth: 0.8, mortality: 0.7, desire: 0.6 }},{ text: "Scan for the catch.", scores: { fear: 0.8, pattern: 0.7, analytical: 0.6, regulation: 0.5 }},{ text: "Share immediately.", scores: { bonding: 0.8, social: 0.7, empathy: 0.6, spontaneity: 0.6 }},{ text: "Keep building.", scores: { discipline: 0.8, pragmatic: 0.7, purpose: 0.6, assertion: 0.5 }}]},
  { phase: "Truth", prompt: "You\u2019ve been wrong about something fundamental.", choices: [{ text: "Rebuild everything.", scores: { analytical: 0.8, identity: 0.4, discipline: 0.7, purpose: 0.6 }},{ text: "Grieve the old understanding.", scores: { depth: 0.8, mortality: 0.8, vulnerability: 0.7, shame: 0.7 }},{ text: "Integrate. Incomplete, not wrong.", scores: { abstract: 0.8, pattern: 0.7, pragmatic: 0.5, transcendence: 0.6 }},{ text: "Model the correction publicly.", scores: { vulnerability: 0.8, social: 0.7, assertion: 0.5, shame: 0.5 }}]},
  { phase: "Power", prompt: "Holding back \u2014 believing full force is too much.", choices: [{ text: "Unleash it.", scores: { assertion: 0.9, anger: 0.7, desire: 0.8, identity: 0.8 }},{ text: "Calibrate it.", scores: { regulation: 0.8, discipline: 0.7, analytical: 0.6, pragmatic: 0.7 }},{ text: "Examine who told you that.", scores: { pattern: 0.8, depth: 0.7, shame: 0.7, fear: 0.5 }},{ text: "Find a container big enough.", scores: { purpose: 0.8, abstract: 0.6, transcendence: 0.7, patience: 0.5 }}]},
  { phase: "Synthesis", prompt: "Everything converges. Past, present, potential.", choices: [{ text: "Build.", scores: { pragmatic: 0.8, discipline: 0.7, assertion: 0.7, purpose: 0.8 }},{ text: "Write it down.", scores: { abstract: 0.7, depth: 0.7, pattern: 0.6, mortality: 0.7 }},{ text: "Share it.", scores: { empathy: 0.7, bonding: 0.6, social: 0.6, transcendence: 0.8 }},{ text: "Breathe.", scores: { regulation: 0.8, patience: 0.8, identity: 0.7, transcendence: 0.8 }}]},
];

// Branchless low/mid/high routing via src/lib/ternary.js.
const getFacetInterpretation = (f, v) => classifyTernary(f, v);
function getDomainSynthesis(d, s) {
  const vals = FACETS.filter(f => f.domain === d).map(f => s[f.id] || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const spread = Math.max(...vals) - Math.min(...vals);
  const synth = [
    [avg > 0.65 ? "Your cognitive architecture is formidable \u2014 layered analysis, pattern recognition, abstract reasoning working simultaneously. You see the system behind the surface. Challenge: when every decision becomes a research project, nothing ships." : avg > 0.4 ? "Balanced between intuition and analysis. You shift between big-picture and ground-level, making you a versatile problem-solver who speaks both languages." : "You think with hands, gut, and direct experience. Grounded in reality while others float away. Cognitive style is practical, immediate, action-oriented."],
    [avg > 0.65 ? "Your emotional world is vast, deep, and largely uncontrolled. You feel at frequencies most can\u2019t access. This richness is your artistic and spiritual gift, but ordinary life can feel like walking through fire. Building containers for this intensity is survival." : avg > 0.4 ? "Healthy emotional range \u2014 access depth when the moment calls, regulate when circumstances demand. You feel without being consumed. A stabilizing force in turbulent environments." : "You operate with emotional efficiency. Feelings processed quickly, stored compactly. Dependable under pressure, but certain experiences requiring surrender remain partially locked."],
    [avg > 0.65 ? "Your will is a force of nature \u2014 assertive drive with sustained discipline and the adaptability to change tactics without changing direction. Rare and magnetic, but can exhaust people. Not everyone operates at your RPM." : avg > 0.4 ? "Your will is capable but selective. Push hard when justified, don\u2019t waste energy on battles that don\u2019t matter. Enough discipline to build, enough spontaneity to pivot. Effective without rigid." : "You move with low force, preferring flow around obstacles. Harmonious and adaptive, but vision may stay internal. The world needs what you see. Push."],
    [spread > 0.4 ? "Your relational profile is complex \u2014 strong drives pulling opposite directions. You may crave deep bonding while needing fierce autonomy. This tension is your architecture. The people who stay can hold both poles." : avg > 0.6 ? "Relationships are central. You bond deeply, navigate social complexity instinctively, invest heavily. Guard against over-extension \u2014 when you give to everyone, nothing\u2019s left for you." : avg > 0.35 ? "Selective but sustainable relational world. Your people held close, solitude protected when needed. This balance is harder than it looks \u2014 recognize it as achievement." : "Significant relational independence. World built on ideas and projects more than bonds. Not loneliness \u2014 sovereignty. Make sure walls are doors that open both ways."],
    [avg > 0.65 ? "You live with existential questions at full volume. Purpose, identity, mortality, transcendence aren\u2019t abstractions \u2014 they\u2019re the weather. You can\u2019t do anything without asking why, can\u2019t love without knowing you\u2019ll lose it. This weight is also your depth." : avg > 0.4 ? "You carry existential awareness without being crushed. Think about purpose regularly, have a sense of who you are, made some peace with mortality. Mature, functional existential integration." : "You live in the immediate. Big questions don\u2019t dominate. Meaning in doing rather than questioning. Pragmatic existentialism is underrated."],
    [spread > 0.4 ? "Your shadow profile is asymmetric \u2014 strong access to some shadow energies, almost none to others. The locked ones run programs you can\u2019t see. Growth is in the lowest-scoring facets: the rooms you haven\u2019t entered." : avg > 0.6 ? "Unusual access to shadow material. Anger, fear, shame, desire \u2014 not hidden from you. Constant negotiation with forces most repress. Your integration gives you authenticity others can feel." : avg > 0.35 ? "Developing relationship with shadow. Aware enough not to be blindsided. The shadow isn\u2019t your enemy \u2014 it\u2019s fuel. Getting to know it unlocks power you didn\u2019t know you had." : "Much shadow material is buried or redirected. Operating below awareness, influencing choices without consent. What you can name, you can choose. What you can\u2019t, chooses you."],
  ];
  return synth[d][0];
}

// ═══ 3D IRIS SCENE (compact) ═══
function IrisScene({ facetScores, enneagramType }) {
  const mountRef = useRef(null), frameRef = useRef(null);
  useEffect(() => {
    const c = mountRef.current; if (!c) return;
    const w = c.clientWidth, h = c.clientHeight;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, w/h, 0.1, 1000);
    cam.position.set(0, 0, 5.5);
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(w, h); ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.setClearColor(0x06060e, 1);
    c.appendChild(ren.domElement);
    const tc = enneagramType ? ENNEAGRAM_PROFILES[enneagramType]?.color || "#fff" : "#4a90d9";
    const cc = new THREE.Color(tc);
    const cA = (facetScores.analytical+facetScores.pattern+facetScores.abstract+facetScores.pragmatic)/4;
    const eA = (facetScores.depth+facetScores.empathy+facetScores.regulation+facetScores.vulnerability)/4;
    const vA = (facetScores.assertion+facetScores.discipline+facetScores.spontaneity+facetScores.patience)/4;
    const rx = .001+vA*.004, ry = .002+cA*.005, rz = .0005+eA*.002;
    const g = new THREE.Group(); scene.add(g);
    const n = 24, ga = Math.PI*(3-Math.sqrt(5)), bR = 2, ends = [];
    for (let i = 0; i < n; i++) {
      const y = 1-(i/(n-1))*2, rY = Math.sqrt(1-y*y), th = ga*i;
      const dir = new THREE.Vector3(Math.cos(th)*rY, y, Math.sin(th)*rY).normalize();
      const v = facetScores[FACETS[i].id]||0, end = dir.clone().multiplyScalar(.3+v*bR), full = dir.clone().multiplyScalar(bR+.3);
      ends.push(end);
      const dc = new THREE.Color(DOMAINS[FACETS[i].domain].color);
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),full]),new THREE.LineBasicMaterial({color:dc,transparent:true,opacity:.08})));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),end]),new THREE.LineBasicMaterial({color:dc,transparent:true,opacity:.35+v*.4})));
      const nm = new THREE.Mesh(new THREE.SphereGeometry(.03+v*.03,8,8),new THREE.MeshBasicMaterial({color:dc,transparent:true,opacity:.7+v*.3}));
      nm.position.copy(end); g.add(nm);
    }
    const iv=[],ic=[]; for (let i=0;i<n;i++){const nx=(i+1)%n,a=ends[i],b=ends[nx];iv.push(0,0,0,a.x,a.y,a.z,b.x,b.y,b.z);const c1=new THREE.Color(DOMAINS[FACETS[i].domain].color),c2=new THREE.Color(DOMAINS[FACETS[nx].domain].color);ic.push(cc.r,cc.g,cc.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b)}
    const iG = new THREE.BufferGeometry(); iG.setAttribute("position",new THREE.Float32BufferAttribute(iv,3)); iG.setAttribute("color",new THREE.Float32BufferAttribute(ic,3));
    g.add(new THREE.Mesh(iG,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.12,side:THREE.DoubleSide})));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...ends,ends[0]]),new THREE.LineBasicMaterial({color:cc,transparent:true,opacity:.3})));
    for(let i=0;i<n;i++)for(let j=i+2;j<n;j++)if((j-i)%4===0||(j-i)%6===0)g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([ends[i],ends[j]]),new THREE.LineBasicMaterial({color:cc,transparent:true,opacity:.04})));
    [new THREE.Euler(Math.PI/2,0,0),new THREE.Euler(0,0,Math.PI/6),new THREE.Euler(Math.PI/4,Math.PI/4,0)].forEach((tilt,idx)=>{const r=new THREE.Mesh(new THREE.RingGeometry(bR*.95,bR*.97,64),new THREE.MeshBasicMaterial({color:[0xffa94d,0xff6b8a,0x7eb5ff][idx],transparent:true,opacity:.06,side:THREE.DoubleSide}));r.rotation.copy(tilt);g.add(r)});
    const cMat=new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:.9}),cM=new THREE.Mesh(new THREE.SphereGeometry(.12,32,32),cMat);g.add(cM);
    const gMat=new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:.15}),gM=new THREE.Mesh(new THREE.SphereGeometry(.25,32,32),gMat);g.add(gM);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.5,32,32),new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:.04})));
    const pc=400,pp=new Float32Array(pc*3),pcc=new Float32Array(pc*3);
    for(let i=0;i<pc;i++){const r=2+Math.random()*4,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);pp[i*3]=r*Math.sin(p)*Math.cos(t);pp[i*3+1]=r*Math.sin(p)*Math.sin(t);pp[i*3+2]=r*Math.cos(p);const d=new THREE.Color(DOMAINS[Math.floor(Math.random()*6)].color);pcc[i*3]=d.r;pcc[i*3+1]=d.g;pcc[i*3+2]=d.b}
    const pG=new THREE.BufferGeometry();pG.setAttribute("position",new THREE.Float32BufferAttribute(pp,3));pG.setAttribute("color",new THREE.Float32BufferAttribute(pcc,3));
    const pts=new THREE.Points(pG,new THREE.PointsMaterial({size:.015,vertexColors:true,transparent:true,opacity:.4}));scene.add(pts);
    let mx=0,my=0;
    c.addEventListener("mousemove",e=>{const r=c.getBoundingClientRect();mx=((e.clientX-r.left)/w-.5)*2;my=((e.clientY-r.top)/h-.5)*2});
    c.addEventListener("touchmove",e=>{if(e.touches.length){const r=c.getBoundingClientRect();mx=((e.touches[0].clientX-r.left)/w-.5)*2;my=((e.touches[0].clientY-r.top)/h-.5)*2}},{passive:true});
    let t=0;const anim=()=>{frameRef.current=requestAnimationFrame(anim);t+=.016;g.rotation.x+=rx+my*.003;g.rotation.y+=ry+mx*.003;g.rotation.z+=rz;const p=1+Math.sin(t*1.5)*.15;cM.scale.set(p,p,p);gM.scale.set(p*1.1,p*1.1,p*1.1);cMat.opacity=.7+Math.sin(t*2)*.2;gMat.opacity=.1+Math.sin(t*1.2)*.08;pts.rotation.y+=3e-4;pts.rotation.x+=1e-4;ren.render(scene,cam)};anim();
    const onR=()=>{const nw=c.clientWidth,nh=c.clientHeight;cam.aspect=nw/nh;cam.updateProjectionMatrix();ren.setSize(nw,nh)};
    window.addEventListener("resize",onR);
    return()=>{cancelAnimationFrame(frameRef.current);window.removeEventListener("resize",onR);ren.dispose();if(c.contains(ren.domElement))c.removeChild(ren.domElement)};
  },[facetScores,enneagramType]);
  return <div ref={mountRef} style={{width:"100%",height:"100%",touchAction:"none"}} />;
}

// ═══ COLISEUM COMPONENT ═══
function Coliseum({ onBack, userType }) {
  const [selected, setSelected] = useState(null);
  const m = { fontFamily: "'DM Mono', monospace" };
  const entry = selected ? COLISEUM[selected] : null;
  const profile = selected ? ENNEAGRAM_PROFILES[selected] : null;

  if (entry && profile) {
    const sectors = [["Leadership", entry.society.leadership], ["Creative", entry.society.creative], ["Technical", entry.society.technical], ["Service", entry.society.service], ["Entrepreneurial", entry.society.entrepreneurial]];
    return (
      <div style={{ minHeight: "100vh", background: "#06060e", color: "#e0e0e0", fontFamily: "'Cormorant Garamond',Georgia,serif", padding: "20px 16px", overflowY: "auto" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer", ...m, letterSpacing: 2, marginBottom: 16 }}>{"\u2190"} COLISEUM</button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, color: profile.color }}>{entry.glyph}</div>
          <div style={{ fontSize: 11, ...m, color: profile.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Type {selected} {userType === selected ? "\u00b7 YOUR TYPE" : ""}</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: "#fff", letterSpacing: 3, margin: "4px 0" }}>{entry.title}</h1>
          <div style={{ fontSize: 12, color: "#666", ...m }}>{entry.tagline}</div>
          <div style={{ fontSize: 11, color: "#444", ...m, marginTop: 4 }}>{entry.pop}% of population</div>
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 10, ...m, color: "#444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>The {entry.era}</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#888", marginBottom: 20 }}>{entry.history}</p>
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${profile.color}33,transparent)`, margin: "16px 0" }} />
          <div style={{ fontSize: 10, ...m, color: "#444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Societal Distribution</div>
          {sectors.map(([name, pct]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 90, fontSize: 10, color: "#666", ...m, textAlign: "right" }}>{name}</span>
              <div style={{ flex: 1, height: 6, background: "#111", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                <div style={{ width: pct + "%", height: "100%", background: profile.color, borderRadius: 3, transition: "width 1s ease" }} />
              </div>
              <span style={{ width: 30, fontSize: 10, color: profile.color, ...m, textAlign: "right", fontWeight: 600 }}>{pct}%</span>
            </div>
          ))}
          <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${profile.color}33,transparent)`, margin: "16px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, ...m, color: "#69db7c", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Strengths</div>
              {entry.strengths.map(s => <div key={s} style={{ fontSize: 12, color: "#777", marginBottom: 3 }}>{s}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 10, ...m, color: "#ff6b8a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Growth Edges</div>
              {entry.weaknesses.map(w => <div key={w} style={{ fontSize: 12, color: "#777", marginBottom: 3 }}>{w}</div>)}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "#333", ...m, marginBottom: 4 }}>Notable Figures</div>
          <div style={{ textAlign: "center", fontSize: 13, color: "#666", fontStyle: "italic", marginBottom: 20 }}>{entry.figures}</div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#555", ...m, marginBottom: 6 }}>Type Profile</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#777", fontStyle: "italic", marginBottom: 40 }}>{profile.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#06060e", color: "#e0e0e0", fontFamily: "'Cormorant Garamond',Georgia,serif", padding: "20px 16px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer", ...m, letterSpacing: 2, marginBottom: 16 }}>{"\u2190"} HOME</button>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 300, color: "#fff", letterSpacing: 6, margin: "0 0 4px" }}>THE COLISEUM</h1>
        <div style={{ fontSize: 11, ...m, color: "#555", letterSpacing: 4, textTransform: "uppercase" }}>Nine Archetypes \u00b7 Their History \u00b7 Their Standing</div>
      </div>
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(COLISEUM).map(([num, data]) => {
          const p = ENNEAGRAM_PROFILES[num];
          const isUser = userType === parseInt(num);
          return (
            <button key={num} onClick={() => setSelected(parseInt(num))} style={{
              background: isUser ? p.color + "10" : "#0d0d1a",
              border: `1px solid ${isUser ? p.color + "40" : "#ffffff08"}`,
              borderRadius: 6, padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all .3s",
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + "50"; e.currentTarget.style.background = p.color + "08"; }}
               onMouseLeave={e => { e.currentTarget.style.borderColor = isUser ? p.color + "40" : "#ffffff08"; e.currentTarget.style.background = isUser ? p.color + "10" : "#0d0d1a"; }}>
              <div style={{ fontSize: 28, color: p.color, width: 36, textAlign: "center" }}>{data.glyph}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16, color: "#fff", fontWeight: 300 }}>{data.title}</span>
                  {isUser && <span style={{ fontSize: 8, ...m, color: p.color, background: p.color + "15", padding: "2px 6px", borderRadius: 8 }}>YOU</span>}
                </div>
                <div style={{ fontSize: 10, color: "#555", ...m }}>{data.tagline}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, color: p.color, ...m, fontWeight: 600 }}>{data.pop}%</div>
                <div style={{ fontSize: 8, color: "#444", ...m }}>pop.</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 8, color: "#222", ...m }}>Population data from Enneagram Institute RHETI studies</div>
    </div>
  );
}

// ═══ PLAYER CARD HTML GENERATOR (NFT-style) ═══
function generatePlayerCard(facetScores, enneagramType, enneagramScores, timestamp) {
  const profile = ENNEAGRAM_PROFILES[enneagramType];
  const col = COLISEUM[enneagramType];
  const w1 = enneagramType === 1 ? 9 : enneagramType - 1, w2 = enneagramType === 9 ? 1 : enneagramType + 1;
  const wt = (enneagramScores[w1]||0) > (enneagramScores[w2]||0) ? w1 : w2;
  const sorted = Object.entries(enneagramScores).sort((a, b) => b[1] - a[1]);
  const vector = "E" + enneagramType + "w" + wt + "::" + FACETS.map(f => Math.round((facetScores[f.id]||0)*9)).join("");
  const dt = new Date(timestamp);
  const dateStr = dt.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const percentile = Math.round((1 - col.pop / 100) * 100);

  // Build facet section HTML
  let facetHTML = "";
  DOMAINS.forEach((dom, di) => {
    const syn = getDomainSynthesis(di, facetScores);
    facetHTML += '<div style="margin:24px 0 8px"><div style="font-size:11px;letter-spacing:3px;color:'+dom.color+';font-family:M,monospace;text-transform:uppercase;margin-bottom:6px">'+dom.name+' Domain</div>';
    facetHTML += '<p style="font-size:12px;line-height:1.65;color:#777;margin-bottom:12px">'+syn+'</p>';
    FACETS.filter(f=>f.domain===di).forEach(f => {
      const v = Math.round((facetScores[f.id]||0)*100);
      const interp = getFacetInterpretation(f, facetScores[f.id]||0);
      facetHTML += '<div style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="width:80px;font-size:9px;color:'+dom.color+';font-family:M,monospace;text-align:right;font-weight:600">'+f.short+'</span><div style="flex:1;height:4px;background:#111;border-radius:2px;overflow:hidden"><div style="width:'+v+'%;height:100%;background:linear-gradient(90deg,'+dom.color+'44,'+dom.color+');border-radius:2px"></div></div><span style="width:24px;font-size:9px;color:#555;font-family:M,monospace;text-align:right">'+v+'</span></div><p style="font-size:11px;line-height:1.6;color:#666;margin:0 0 0 86px">'+interp+'</p></div>';
    });
    facetHTML += '</div>';
  });

  // Society bars
  let socHTML = "";
  [["Leadership",col.society.leadership],["Creative",col.society.creative],["Technical",col.society.technical],["Service",col.society.service],["Entrepreneurial",col.society.entrepreneurial]].forEach(([name,pct]) => {
    socHTML += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="width:90px;font-size:9px;color:#666;font-family:M,monospace;text-align:right">'+name+'</span><div style="flex:1;height:4px;background:#111;border-radius:2px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+profile.color+';border-radius:2px"></div></div><span style="width:26px;font-size:9px;color:'+profile.color+';font-family:M,monospace;text-align:right">'+pct+'%</span></div>';
  });

  // Enneagram resonance
  let ennHTML = "";
  sorted.forEach(([type,score])=>{
    const p=ENNEAGRAM_PROFILES[type]; const isPrimary = parseInt(type)===enneagramType;
    ennHTML += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="width:14px;font-size:10px;color:'+(isPrimary?p.color:'#444')+';font-family:M,monospace;font-weight:'+(isPrimary?600:400)+'">'+type+'</span><div style="flex:1;height:3px;background:#111;border-radius:2px;overflow:hidden"><div style="width:'+Math.round(score*100)+'%;height:100%;background:'+p.color+(isPrimary?'':'55')+';border-radius:2px"></div></div><span style="width:26px;font-size:8px;color:#444;font-family:M,monospace;text-align:right">'+Math.round(score*100)+'</span></div>';
  });

  const facetJSON = JSON.stringify(facetScores);
  const facetMeta = JSON.stringify(FACETS.map(f=>({id:f.id,domain:f.domain})));
  const domainColors = JSON.stringify(DOMAINS.map(d=>d.color));

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IRIS Player Card \u2014 '+col.title+' '+enneagramType+'w'+wt+'</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script><style>@font-face{font-family:M;src:local("DM Mono")}*{margin:0;padding:0;box-sizing:border-box}body{background:#06060e;color:#e0e0e0;font-family:Cormorant Garamond,Georgia,serif}.card{max-width:600px;margin:0 auto;border:1px solid '+profile.color+'20;border-radius:16px;overflow:hidden;box-shadow:0 0 80px '+profile.color+'08}.scene{width:100%;height:50vh;position:relative}#cm{position:absolute;inset:0}.ov{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none}.hdr{padding:12px 16px;display:flex;justify-content:space-between}.ftr{background:linear-gradient(transparent,rgba(6,6,14,.92) 30%,#06060e);padding:28px 20px 16px}.body{padding:0 20px 32px}.gl{height:1px;background:linear-gradient(90deg,transparent,'+profile.color+'33,transparent);margin:20px 0}.st{font-size:9px;letter-spacing:3px;color:#444;font-family:M,monospace;text-transform:uppercase;text-align:center;margin-bottom:8px}.mono{font-family:M,monospace}#stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}</style></head><body><div class="card"><div class="scene"><div id="cm"></div><div class="ov"><div class="hdr"><div><div class="mono" style="font-size:8px;letter-spacing:4px;color:#444;text-transform:uppercase">IRIS Player Card</div><div class="mono" style="font-size:7px;color:#333;margin-top:2px">'+dateStr+'</div></div><div style="text-align:right"><div class="mono" style="font-size:8px;letter-spacing:3px;color:#444;text-transform:uppercase">'+percentile+'th Percentile</div><div class="mono" style="font-size:7px;color:#333;margin-top:2px">'+col.pop+'% of population</div></div></div><div style="flex:1"></div><div class="ftr"><div style="text-align:center"><div style="font-size:40px;color:'+profile.color+'">'+col.glyph+'</div><div style="font-size:44px;font-weight:300;color:'+profile.color+';line-height:1">'+enneagramType+'</div><h1 style="font-size:24px;font-weight:300;color:#fff;letter-spacing:3px;margin:2px 0">'+col.title+'</h1><div class="mono" style="font-size:10px;color:#555">Wing '+wt+' \u00b7 '+Math.round((sorted[0]?.[1]||0)*100)+'% resonance \u00b7 '+col.tagline+'</div><div class="mono" style="font-size:8px;color:#444;margin-top:6px"><code>'+vector+'</code></div></div></div></div></div><div class="body"><div id="stats"><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Cognitive</div><div style="font-size:18px;color:#7eb5ff;font-weight:300">'+Math.round(((facetScores.analytical+facetScores.pattern+facetScores.abstract+facetScores.pragmatic)/4)*100)+'</div></div><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Emotional</div><div style="font-size:18px;color:#ff6b8a;font-weight:300">'+Math.round(((facetScores.depth+facetScores.empathy+facetScores.regulation+facetScores.vulnerability)/4)*100)+'</div></div><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Volitional</div><div style="font-size:18px;color:#ffa94d;font-weight:300">'+Math.round(((facetScores.assertion+facetScores.discipline+facetScores.spontaneity+facetScores.patience)/4)*100)+'</div></div></div><div id="stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px"><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Relational</div><div style="font-size:18px;color:#69db7c;font-weight:300">'+Math.round(((facetScores.bonding+facetScores.social+facetScores.autonomy+facetScores.trust)/4)*100)+'</div></div><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Existential</div><div style="font-size:18px;color:#b197fc;font-weight:300">'+Math.round(((facetScores.purpose+facetScores.identity+facetScores.mortality+facetScores.transcendence)/4)*100)+'</div></div><div style="text-align:center;padding:8px;background:#0d0d1a;border-radius:6px;border:1px solid #ffffff06"><div class="mono" style="font-size:8px;color:#444;text-transform:uppercase;letter-spacing:2px">Shadow</div><div style="font-size:18px;color:#868e96;font-weight:300">'+Math.round(((facetScores.anger+facetScores.fear+facetScores.shame+facetScores.desire)/4)*100)+'</div></div></div><div class="gl"></div><div class="st">Type Profile</div><p style="font-size:13px;line-height:1.7;color:#888;font-style:italic;margin-bottom:8px">'+profile.desc+'</p><div class="gl"></div><div class="st">Societal Standing</div>'+socHTML+'<div class="gl"></div><div class="st">Enneagram Resonance</div>'+ennHTML+''+facetHTML+'<div class="gl"></div><div style="text-align:center;padding:12px"><div class="mono" style="font-size:7px;color:#222">IRIS v4.0 \u00b7 Eclipse Ventures LLC \u00b7 Yunis AI</div><div class="mono" style="font-size:7px;color:#1a1a2a;margin-top:2px">Meta-object token \u00b7 '+vector+' \u00b7 '+dt.toISOString()+'</div></div></div></div><script>(function(){var F='+facetJSON+',M='+facetMeta+',D='+domainColors+',T="'+profile.color+'",c=document.getElementById("cm"),w=c.clientWidth,h=c.clientHeight,s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,w/h,.1,1e3);cam.position.set(0,0,5.5);var r=new THREE.WebGLRenderer({antialias:!0,alpha:!0});r.setSize(w,h);r.setPixelRatio(Math.min(devicePixelRatio,2));r.setClearColor(0x06060e,1);c.appendChild(r.domElement);var cc=new THREE.Color(T),cg=(F.analytical+F.pattern+F.abstract+F.pragmatic)/4,em=(F.depth+F.empathy+F.regulation+F.vulnerability)/4,vo=(F.assertion+F.discipline+F.spontaneity+F.patience)/4,rx=.001+vo*.004,ry=.002+cg*.005,rz=.0005+em*.002,g=new THREE.Group;s.add(g);var n=24,ga=Math.PI*(3-Math.sqrt(5)),bR=2,ends=[];for(var i=0;i<n;i++){var y=1-i/(n-1)*2,rY=Math.sqrt(1-y*y),th=ga*i,dir=new THREE.Vector3(Math.cos(th)*rY,y,Math.sin(th)*rY).normalize(),v=F[M[i].id]||0,end=dir.clone().multiplyScalar(.3+v*bR),full=dir.clone().multiplyScalar(bR+.3);ends.push(end);var dc=new THREE.Color(D[M[i].domain]);g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3,full]),new THREE.LineBasicMaterial({color:dc,transparent:!0,opacity:.08})));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3,end]),new THREE.LineBasicMaterial({color:dc,transparent:!0,opacity:.35+v*.4})));var nm=new THREE.Mesh(new THREE.SphereGeometry(.03+v*.03,8,8),new THREE.MeshBasicMaterial({color:dc,transparent:!0,opacity:.7+v*.3}));nm.position.copy(end);g.add(nm)}var iv=[],ic=[];for(i=0;i<n;i++){var nx=(i+1)%n,a=ends[i],b=ends[nx];iv.push(0,0,0,a.x,a.y,a.z,b.x,b.y,b.z);var c1=new THREE.Color(D[M[i].domain]),c2=new THREE.Color(D[M[nx].domain]);ic.push(cc.r,cc.g,cc.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b)}var ig=new THREE.BufferGeometry;ig.setAttribute("position",new THREE.Float32BufferAttribute(iv,3));ig.setAttribute("color",new THREE.Float32BufferAttribute(ic,3));g.add(new THREE.Mesh(ig,new THREE.MeshBasicMaterial({vertexColors:!0,transparent:!0,opacity:.12,side:THREE.DoubleSide})));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ends.concat([ends[0]])),new THREE.LineBasicMaterial({color:cc,transparent:!0,opacity:.3})));for(i=0;i<n;i++)for(var j=i+2;j<n;j++)if((j-i)%4==0||(j-i)%6==0)g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([ends[i],ends[j]]),new THREE.LineBasicMaterial({color:cc,transparent:!0,opacity:.04})));[new THREE.Euler(Math.PI/2,0,0),new THREE.Euler(0,0,Math.PI/6),new THREE.Euler(Math.PI/4,Math.PI/4,0)].forEach(function(t,i){var ring=new THREE.Mesh(new THREE.RingGeometry(bR*.95,bR*.97,64),new THREE.MeshBasicMaterial({color:[0xffa94d,0xff6b8a,0x7eb5ff][i],transparent:!0,opacity:.06,side:THREE.DoubleSide}));ring.rotation.copy(t);g.add(ring)});var cMat=new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.9}),cM=new THREE.Mesh(new THREE.SphereGeometry(.12,32,32),cMat);g.add(cM);var gMat=new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.15}),gM=new THREE.Mesh(new THREE.SphereGeometry(.25,32,32),gMat);g.add(gM);g.add(new THREE.Mesh(new THREE.SphereGeometry(.5,32,32),new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.04})));var pc=400,pp=new Float32Array(pc*3),pcc2=new Float32Array(pc*3);for(i=0;i<pc;i++){var pr=2+Math.random()*4,pt=Math.random()*Math.PI*2,pphi=Math.acos(2*Math.random()-1);pp[i*3]=pr*Math.sin(pphi)*Math.cos(pt);pp[i*3+1]=pr*Math.sin(pphi)*Math.sin(pt);pp[i*3+2]=pr*Math.cos(pphi);var dcc=new THREE.Color(D[Math.floor(Math.random()*6)]);pcc2[i*3]=dcc.r;pcc2[i*3+1]=dcc.g;pcc2[i*3+2]=dcc.b}var pg=new THREE.BufferGeometry;pg.setAttribute("position",new THREE.Float32BufferAttribute(pp,3));pg.setAttribute("color",new THREE.Float32BufferAttribute(pcc2,3));var pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.015,vertexColors:!0,transparent:!0,opacity:.4}));s.add(pts);var mx=0,my=0;c.addEventListener("mousemove",function(e){var rt=c.getBoundingClientRect();mx=((e.clientX-rt.left)/w-.5)*2;my=((e.clientY-rt.top)/h-.5)*2});c.addEventListener("touchmove",function(e){if(e.touches.length){var rt=c.getBoundingClientRect();mx=((e.touches[0].clientX-rt.left)/w-.5)*2;my=((e.touches[0].clientY-rt.top)/h-.5)*2}},{passive:!0});var t=0;!function animate(){requestAnimationFrame(animate);t+=.016;g.rotation.x+=rx+my*.003;g.rotation.y+=ry+mx*.003;g.rotation.z+=rz;var p=1+Math.sin(t*1.5)*.15;cM.scale.set(p,p,p);gM.scale.set(p*1.1,p*1.1,p*1.1);cMat.opacity=.7+Math.sin(t*2)*.2;gMat.opacity=.1+Math.sin(t*1.2)*.08;pts.rotation.y+=3e-4;pts.rotation.x+=1e-4;r.render(s,cam)}();window.addEventListener("resize",function(){var nw=c.clientWidth,nh=c.clientHeight;cam.aspect=nw/nh;cam.updateProjectionMatrix();r.setSize(nw,nh)})})()<\/script></body></html>';
}

// ═══ MAIN APP ═══
// Props:
//   onComplete(results)  fires once when the user finishes the 16-scenario
//                        assessment. Outer app persists results to Zustand.
//   onExit()             if provided, renders "Enter Engram →" buttons on
//                        the landing + results screens to hand off to the
//                        extended app (Home dashboard, Journal, Calendar...).
//   initialPhase         "landing" | "coliseum" | "assess" | "results"
//                        (useful for deep-linking straight into the Coliseum)
export default function IRISApp({ onComplete, onExit, initialPhase = "landing" } = {}) {
  const [phase, setPhase] = useState(initialPhase); // landing|coliseum|assess|results
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [facetScores, setFacetScores] = useState(() => { const s = {}; FACETS.forEach(f => { s[f.id] = 0; }); return s; });
  const [enneagramType, setEnneagramType] = useState(null);
  const [enneagramScores, setEnneagramScores] = useState({});
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [timestamp, setTimestamp] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const transition = fn => { setFadeIn(false); setTimeout(() => { fn(); setFadeIn(true); }, 350); };

  const calculateResults = allAnswers => {
    const totals = {}, counts = {};
    FACETS.forEach(f => { totals[f.id] = 0; counts[f.id] = 0; });
    allAnswers.forEach(a => { Object.entries(a.scores).forEach(([k, v]) => { if (totals[k] !== undefined) { totals[k] += v; counts[k]++; } }); });
    const avg = {}; FACETS.forEach(f => { avg[f.id] = counts[f.id] ? totals[f.id] / counts[f.id] : 0; });
    setFacetScores(avg);
    const ts = {};
    Object.entries(ENNEAGRAM_PROFILES).forEach(([t, p]) => { let d = 0, c = 0; FACETS.forEach(f => { d += Math.pow((p.facets[f.id]||0) - (avg[f.id]||0), 2); c++; }); ts[t] = 1 - Math.sqrt(d / c); });
    setEnneagramScores(ts);
    const type = parseInt(Object.entries(ts).sort((a, b) => b[1] - a[1])[0][0]);
    setEnneagramType(type);
    setTimestamp(new Date().toISOString());
    // Hand results off to the outer app (Zustand + Supabase sync).
    if (typeof onComplete === "function") {
      try { onComplete({ facetScores: avg, enneagramType: type, enneagramScores: ts }); }
      catch (e) { console.error("IRIS onComplete handler failed", e); }
    }
  };

  const handleChoice = choice => {
    setSelectedChoice(choice);
    setTimeout(() => { const na = [...answers, choice]; setAnswers(na); if (qIdx < SCENARIOS.length - 1) transition(() => { setQIdx(qIdx + 1); setSelectedChoice(null); }); else { calculateResults(na); transition(() => { setPhase("results"); setSelectedChoice(null); }); } }, 500);
  };

  const downloadCard = () => {
    const html = generatePlayerCard(facetScores, enneagramType, enneagramScores, timestamp);
    const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "iris-player-card-type" + enneagramType + "-" + new Date().toISOString().slice(0, 10) + ".html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const restart = () => transition(() => { setPhase("landing"); setQIdx(0); setAnswers([]); setShowDetails(false); const s = {}; FACETS.forEach(f => { s[f.id] = 0; }); setFacetScores(s); setEnneagramType(null); setEnneagramScores({}); });

  const fonts = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />;
  const wrap = { height: "100vh", background: "#06060e", color: "#e0e0e0", fontFamily: "'Cormorant Garamond',Georgia,serif", opacity: fadeIn ? 1 : 0, transition: "opacity .35s ease", display: "flex", flexDirection: "column", overflow: "hidden" };
  const m = { fontFamily: "'DM Mono',monospace" };

  // ═══ COLISEUM ═══
  if (phase === "coliseum") return <>{fonts}<Coliseum onBack={() => transition(() => setPhase("landing"))} userType={enneagramType} /></>;

  // ═══ LANDING ═══
  if (phase === "landing") {
    const demo = {}; FACETS.forEach((f, i) => { demo[f.id] = 0.2 + Math.sin(i * 0.7) * 0.3 + 0.3; });
    return (<div style={{ ...wrap, overflow: "auto" }}>{fonts}
      <div style={{ flex: "0 0 50vh", position: "relative" }}><IrisScene facetScores={demo} enneagramType={null} /><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, #06060e)", pointerEvents: "none" }} /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 44, fontWeight: 300, margin: "0 0 4px", letterSpacing: 8, color: "#fff" }}>IRIS</h1>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#555", ...m, textTransform: "uppercase", marginBottom: 16 }}>Integrative Resonance Identity Simulation</div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "#666", fontStyle: "italic", maxWidth: 340, margin: "0 auto 20px" }}>24 facets of consciousness. 16 crucible scenarios. Your living 3D artifact with personalized insights, societal metrics, and a downloadable player card.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
          <button onClick={() => transition(() => setPhase("assess"))} style={{ background: "#fff1", border: "1px solid #fff3", color: "#fff", padding: "14px", fontSize: 13, letterSpacing: 4, cursor: "pointer", ...m, textTransform: "uppercase", borderRadius: 4, transition: "all .3s" }} onMouseEnter={e => e.target.style.background = "#fff2"} onMouseLeave={e => e.target.style.background = "#fff1"}>Begin Simulation</button>
          <button onClick={() => transition(() => setPhase("coliseum"))} style={{ background: "transparent", border: "1px solid #ffa94d25", color: "#ffa94d", padding: "14px", fontSize: 13, letterSpacing: 4, cursor: "pointer", ...m, textTransform: "uppercase", borderRadius: 4, transition: "all .3s" }} onMouseEnter={e => e.target.style.background = "#ffa94d08"} onMouseLeave={e => e.target.style.background = "transparent"}>The Coliseum</button>
          {typeof onExit === "function" && (
            <button onClick={onExit} style={{ background: "transparent", border: "none", color: "#555", padding: "10px", fontSize: 10, letterSpacing: 3, cursor: "pointer", ...m, textTransform: "uppercase" }} onMouseEnter={e => e.target.style.color = "#ffd166"} onMouseLeave={e => e.target.style.color = "#555"}>Already mapped? Enter Engram →</button>
          )}
        </div>
        <div style={{ marginTop: 16, fontSize: 8, color: "#2a2a3a", ...m }}>16 scenarios \u00b7 24 facets \u00b7 9 archetypes \u00b7 Player cards</div>
      </div>
    </div>);
  }

  // ═══ ASSESSMENT ═══
  if (phase === "assess") {
    const sc = SCENARIOS[qIdx], pct = ((qIdx + 1) / SCENARIOS.length) * 100;
    return (<div style={{ ...wrap, overflow: "auto", alignItems: "center", padding: "20px 16px" }}>{fonts}
      <div style={{ maxWidth: 520, width: "100%", marginTop: "2vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 2, background: "#1a1a2e", borderRadius: 1, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,#7eb5ff,#ff6b8a,#ffa94d)", transition: "width .5s" }} /></div>
          <span style={{ fontSize: 10, color: "#444", ...m }}>{qIdx + 1}/{SCENARIOS.length}</span>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#555", ...m, textTransform: "uppercase", marginBottom: 14 }}>{sc.phase}</div>
        <h2 style={{ fontSize: 21, fontWeight: 300, lineHeight: 1.65, color: "#ccc", marginBottom: 28, fontStyle: "italic" }}>{sc.prompt}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sc.choices.map((ch, i) => { const sel = selectedChoice === ch; return (
            <button key={i} onClick={() => !selectedChoice && handleChoice(ch)} disabled={!!selectedChoice} style={{ background: sel ? "#fff1" : "transparent", border: "1px solid " + (sel ? "#fff4" : "#ffffff10"), color: sel ? "#fff" : "#999", padding: "14px 18px", fontSize: 14, lineHeight: 1.5, cursor: selectedChoice ? "default" : "pointer", fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "left", borderRadius: 4, transition: "all .3s", opacity: selectedChoice && !sel ? 0.2 : 1 }} onMouseEnter={e => { if (!selectedChoice) { e.target.style.borderColor = "#fff3"; e.target.style.color = "#ddd"; }}} onMouseLeave={e => { if (!selectedChoice) { e.target.style.borderColor = "#ffffff10"; e.target.style.color = "#999"; }}}>{ch.text}</button>); })}
        </div>
      </div>
    </div>);
  }

  // ═══ RESULTS ═══
  if (phase === "results") {
    const profile = enneagramType ? ENNEAGRAM_PROFILES[enneagramType] : null;
    const col = enneagramType ? COLISEUM[enneagramType] : null;
    const sorted = Object.entries(enneagramScores).sort((a, b) => b[1] - a[1]);
    const w1 = enneagramType === 1 ? 9 : enneagramType - 1, w2 = enneagramType === 9 ? 1 : enneagramType + 1;
    const wt = (enneagramScores[w1]||0) > (enneagramScores[w2]||0) ? w1 : w2;
    const percentile = col ? Math.round((1 - col.pop / 100) * 100) : 0;
    const btn = { background: "transparent", border: "1px solid #fff1", color: "#666", padding: "8px 16px", fontSize: 10, letterSpacing: 2, cursor: "pointer", ...m, textTransform: "uppercase", borderRadius: 2 };

    return (<div style={{ ...wrap }}>{fonts}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}><IrisScene facetScores={facetScores} enneagramType={enneagramType} /></div>
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", pointerEvents: "none" }}>
        <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 8, letterSpacing: 4, color: "#444", ...m, textTransform: "uppercase" }}>IRIS \u00b7 Live</div><div style={{ fontSize: 7, color: "#333", ...m, marginTop: 2 }}>{timestamp ? new Date(timestamp).toLocaleString() : ""}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 8, color: "#444", ...m }}>{percentile}th percentile</div><div style={{ fontSize: 7, color: "#333", ...m }}>{col?.pop}% of population</div></div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ background: "linear-gradient(transparent,rgba(6,6,14,.85) 30%,rgba(6,6,14,.95))", padding: "36px 18px 20px", pointerEvents: "auto" }}>
          {profile && col && <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 28, color: profile.color }}>{col.glyph}</div>
            <div style={{ fontSize: 38, fontWeight: 300, color: profile.color, lineHeight: 1 }}>{enneagramType}</div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#fff", margin: "2px 0", letterSpacing: 3 }}>{col.title}</h2>
            <div style={{ fontSize: 10, color: "#555", ...m }}>Wing {wt} \u00b7 {Math.round((sorted[0]?.[1]||0)*100)}% \u00b7 {col.tagline}</div>
          </div>}
          <div style={{ textAlign: "center", margin: "8px 0", ...m }}><code style={{ color: "#444", fontSize: 8 }}>E{enneagramType}w{wt}::{FACETS.map(f=>Math.round((facetScores[f.id]||0)*9)).join("")}</code></div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowDetails(!showDetails)} style={btn}>{showDetails ? "Hide" : "Full Profile"}</button>
            <button onClick={downloadCard} style={{ ...btn, background: profile ? profile.color + "12" : "#fff1", borderColor: profile ? profile.color + "30" : "#fff2", color: profile ? profile.color : "#888" }}>Download Player Card</button>
            <button onClick={() => transition(() => setPhase("coliseum"))} style={{ ...btn, color: "#ffa94d", borderColor: "#ffa94d25" }}>Coliseum</button>
          </div>

          {showDetails && <div style={{ maxHeight: "42vh", overflowY: "auto", paddingTop: 8 }}>
            {profile && <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: profile.color, ...m, textTransform: "uppercase", marginBottom: 4 }}>Your Type</div>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "#777", fontStyle: "italic" }}>{profile.desc}</p>
            </div>}

            {/* Domain stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginBottom: 12 }}>
              {DOMAINS.map((dom, di) => {
                const vals = FACETS.filter(f => f.domain === di).map(f => facetScores[f.id] || 0);
                const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
                return <div key={dom.name} style={{ textAlign: "center", padding: "6px", background: "#0d0d1a", borderRadius: 4, border: "1px solid #ffffff06" }}>
                  <div style={{ fontSize: 7, ...m, color: "#444", textTransform: "uppercase", letterSpacing: 2 }}>{dom.name}</div>
                  <div style={{ fontSize: 16, color: dom.color, fontWeight: 300 }}>{avg}</div>
                </div>;
              })}
            </div>

            {/* Domain synthesis + facets */}
            {DOMAINS.map((dom, di) => {
              const df = FACETS.filter(f => f.domain === di);
              const syn = getDomainSynthesis(di, facetScores);
              return <div key={dom.name} style={{ marginBottom: 16 }}>
                <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${dom.color}33,transparent)`, margin: "8px 0 10px" }} />
                <div style={{ fontSize: 9, letterSpacing: 3, color: dom.color, ...m, textTransform: "uppercase", marginBottom: 4 }}>{dom.name}</div>
                <p style={{ fontSize: 11, lineHeight: 1.6, color: "#666", marginBottom: 10 }}>{syn}</p>
                {df.map(f => {
                  const val = facetScores[f.id] || 0;
                  return <div key={f.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ width: 72, fontSize: 8, color: dom.color, ...m, textAlign: "right", fontWeight: 600 }}>{f.short}</span>
                      <div style={{ flex: 1, height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}><div style={{ width: val * 100 + "%", height: "100%", background: `linear-gradient(90deg,${dom.color}44,${dom.color})`, borderRadius: 2 }} /></div>
                      <span style={{ width: 20, fontSize: 8, color: "#555", ...m, textAlign: "right" }}>{Math.round(val * 100)}</span>
                    </div>
                    <p style={{ fontSize: 10, lineHeight: 1.55, color: "#555", marginLeft: 78 }}>{getFacetInterpretation(f, val)}</p>
                  </div>;
                })}
              </div>;
            })}

            {/* Enneagram resonance */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", ...m, textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Enneagram Resonance</div>
              {sorted.map(([type, score]) => { const p = ENNEAGRAM_PROFILES[type]; const isPrimary = parseInt(type) === enneagramType; return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ width: 14, fontSize: 9, color: isPrimary ? p.color : "#444", ...m, fontWeight: isPrimary ? 600 : 400 }}>{type}</span>
                  <div style={{ flex: 1, height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}><div style={{ width: score * 100 + "%", height: "100%", background: p.color + (isPrimary ? "" : "55"), borderRadius: 2 }} /></div>
                  <span style={{ width: 24, fontSize: 7, color: "#444", ...m, textAlign: "right" }}>{Math.round(score * 100)}</span>
                </div>); })}
            </div>
          </div>}

          <div style={{ textAlign: "center", marginTop: 8, display: "flex", gap: 18, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={restart} style={{ background: "transparent", border: "none", color: "#333", fontSize: 9, cursor: "pointer", ...m, letterSpacing: 2, textTransform: "uppercase" }}>Re-Simulate</button>
            {typeof onExit === "function" && (
              <button onClick={onExit} style={{ background: "transparent", border: `1px solid ${profile ? profile.color + "55" : "#ffd16655"}`, color: profile ? profile.color : "#ffd166", padding: "10px 22px", fontSize: 10, letterSpacing: 3, cursor: "pointer", ...m, textTransform: "uppercase", borderRadius: 2, transition: "all .3s" }} onMouseEnter={e => e.currentTarget.style.background = (profile ? profile.color : "#ffd166") + "15"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Enter Engram →</button>
            )}
          </div>
          <div style={{ textAlign: "center", fontSize: 7, color: "#1a1a2a", ...m, marginTop: 6 }}>IRIS v4.0 \u00b7 Eclipse Ventures LLC \u00b7 Yunis AI</div>
        </div>
      </div>
    </div>);
  }
  return null;
}
