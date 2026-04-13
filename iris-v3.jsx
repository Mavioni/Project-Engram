import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════
// IRIS v3.2 — Integrative Resonance Identity Simulation
// Full Interpretive Profile Engine
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
  { id: "analytical", short: "Analysis", domain: 0,
    low: "You process the world through feel and instinct rather than systematic breakdown. You trust your gut over spreadsheets, which makes you fast but sometimes imprecise. Structured analysis may feel constraining — you'd rather move than map.",
    mid: "You can toggle between intuitive leaps and careful analysis depending on what the situation demands. You're not enslaved to data, but you respect it. This flexibility is rare — most people are stuck on one end.",
    high: "Your mind is a scalpel. You instinctively deconstruct complexity into components, sequences, and causal chains. This gives you extraordinary diagnostic power, but it can also make you slow to act when the data is ambiguous. Not everything worth understanding can be measured." },
  { id: "pattern", short: "Patterns", domain: 0,
    low: "You tend to take things at face value, which keeps you grounded and present. You're less likely to see conspiracies or hidden agendas, but you may also miss subtle signals that others are sending. What you see is what you get — and you expect the same from the world.",
    mid: "You catch patterns when you're looking for them but don't obsessively hunt for hidden structures. You can connect dots without becoming paranoid about invisible lines. This balance keeps you functional without making you naive.",
    high: "You see the matrix. Connections, rhymes, and hidden structures reveal themselves to you before others even know to look. This is your superpower and your curse — you may over-pattern, seeing meaning in noise, or exhaust yourself reading rooms that aren't as complex as your mind makes them." },
  { id: "abstract", short: "Abstraction", domain: 0,
    low: "You're a concrete thinker — you need to touch it, see it, or build it before it feels real. Theoretical frameworks and philosophical tangents may frustrate you. Your gift is that you stay rooted in what actually exists rather than what might exist.",
    mid: "You can entertain abstract ideas without losing your footing in reality. You appreciate theory but need it connected to practice before you invest. This makes you a good translator between visionaries and operators.",
    high: "You live comfortably in the realm of ideas that have no physical form. Metaphor, theory, and structural thinking are your native language. The risk is that you can become untethered — building elaborate mental architectures that never touch the ground." },
  { id: "pragmatic", short: "Pragmatism", domain: 0,
    low: "You're drawn to elegance over efficiency. You'd rather build something beautiful and impractical than something ugly that works. This makes you an artist at heart, but it can stall progress when the world needs solutions, not poetry.",
    mid: "You balance idealism with practicality. You want things to work, but you also want them to mean something. You're unlikely to ship something you're ashamed of, but you won't polish forever either.",
    high: "You are relentlessly outcome-oriented. If it works, it's right. If it doesn't, it's wrong — no matter how clever the theory behind it. This makes you devastatingly effective but sometimes blind to beauty, nuance, and the things that matter precisely because they can't be measured." },

  { id: "depth", short: "Depth", domain: 1,
    low: "You keep your emotional register relatively shallow — not because you don't feel, but because you've learned that depth is expensive. You recover quickly from setbacks and don't ruminate. The tradeoff is that peak joy and profound connection may feel slightly muted.",
    mid: "You have access to deep feeling but don't live there permanently. You can dive when the moment calls for it and surface when it's time to function. This is emotionally sustainable but may occasionally feel like you're holding back.",
    high: "You feel everything at full volume. Joy is ecstatic, grief is annihilating, beauty is almost unbearable. This depth gives you access to artistic and spiritual registers most people never touch, but it also means that ordinary life can feel painfully insufficient." },
  { id: "empathy", short: "Empathy", domain: 1,
    low: "Other people's emotional states don't automatically transfer to you. This isn't coldness — it's insulation. You can be compassionate without being destabilized by someone else's pain. In crisis, this makes you the steady one. In intimacy, it can feel like distance.",
    mid: "You feel others without drowning in them. You can hold space for someone's pain while maintaining your own center of gravity. This makes you a reliable support without becoming a sponge.",
    high: "You involuntarily absorb the emotional weather of everyone around you. Walking into a room, you feel its mood before a word is spoken. This gives you extraordinary relational intelligence, but without boundaries, other people's emotions become indistinguishable from your own." },
  { id: "regulation", short: "Regulation", domain: 1,
    low: "Your emotions arrive unfiltered and unmanaged. This makes you authentic and intensely present, but it also means that strong feelings can hijack your decision-making. Learning to hold intensity without acting on it immediately is your growth edge.",
    mid: "You can usually hold your emotional center under pressure, though extreme situations still knock you off balance. You've developed enough self-awareness to recognize when your feelings are driving and when your judgment is.",
    high: "You have an almost supernatural ability to hold intense emotions without being controlled by them. You feel everything but choose when and how to express it. The shadow of this is that others may perceive you as cold or withholding when you're actually just metabolizing internally." },
  { id: "vulnerability", short: "Vulnerability", domain: 1,
    low: "You keep your unfinished edges hidden. Being seen in process — uncertain, confused, struggling — feels dangerous to you. This protects you from judgment but also prevents the kind of intimacy that only happens when two people show each other what's incomplete.",
    mid: "You can be vulnerable with the right people in the right contexts, but you're selective. You don't lead with your wounds, and you don't hide them either. You've learned that trust is earned, not assumed.",
    high: "You lead with your cracks. You show people who you are before you've figured out who that is, and this radical openness either creates instant depth or instant discomfort. Your willingness to be seen unfinished is a form of courage most people can't access." },

  { id: "assertion", short: "Assertion", domain: 2,
    low: "You tend to yield rather than push. Conflict feels expensive to you, and you'd rather find a way around resistance than through it. This makes you harmonious but can leave your actual needs consistently unmet. The things you never say accumulate.",
    mid: "You can assert yourself when it matters but don't lead with force. You pick your battles with reasonable accuracy and can escalate when the stakes justify it. You're not a pushover, but you're not a bulldozer either.",
    high: "You project force naturally. Your presence moves rooms, your opinions reshape conversations, and your will bends environments toward your vision. This is power — and the discipline is learning when not to use it, because not every wall deserves to be broken through." },
  { id: "discipline", short: "Discipline", domain: 2,
    low: "Sustained effort against resistance isn't your strong suit. You're better in sprints than marathons, and you rely on inspiration rather than routine. This makes you creative and spontaneous but unreliable over long timelines.",
    mid: "You can maintain effort when the purpose is clear but struggle with grinding through meaningless work. Your discipline is purpose-dependent — give you a reason and you're relentless; remove the meaning and you stall.",
    high: "You can sustain effort long past the point where most people quit. You show up when you don't want to, finish what you start, and treat consistency as a moral act. The risk is that discipline becomes its own justification — you may keep pushing on paths that should have been abandoned." },
  { id: "spontaneity", short: "Spontaneity", domain: 2,
    low: "You don't move without a plan. Improvisation feels reckless to you, and surprise is more stressful than exciting. You've built a life of predictability because predictability feels safe. The cost is that some of life's best moments arrive unscheduled.",
    mid: "You can improvise when forced to but prefer to have a framework. You're not rigid, but you're not chaotic either. You appreciate structure while leaving room for the unexpected.",
    high: "You thrive in the unplanned. You trust yourself to handle whatever arrives and find structure suffocating. This makes you adaptable and alive, but it can also mean you avoid the boring-but-necessary work of building durable things." },
  { id: "patience", short: "Patience", domain: 2,
    low: "You want results now. Waiting feels like dying slowly, and delayed gratification is a concept you understand intellectually but reject emotionally. Your impatience makes you fast but often premature.",
    mid: "You can wait when the payoff is visible but struggle with indefinite timelines. You're patient with processes that have clear milestones and restless with anything that feels like stagnation.",
    high: "You understand that the most valuable things take time and can't be rushed. You play long games without anxiety, trusting that consistency compounds. The risk is that patience becomes passivity — waiting for things that require action." },

  { id: "bonding", short: "Bonding", domain: 3,
    low: "Deep one-to-one connection isn't your primary mode. You may have many acquaintances and few intimates, or you may simply prefer to operate independently. This isn't a deficit — it's a topology. You connect through shared work, ideas, or experiences rather than emotional fusion.",
    mid: "You form meaningful bonds but maintain clear boundaries within them. You can go deep with someone without losing yourself, and you know when to pull back without guilt. Your relationships are sustainable because they're not desperate.",
    high: "You bond at a molecular level. When you connect with someone, it's psychic entanglement — you carry them with you, feel their absence as physical weight, and invest in the relationship with your full self. This creates extraordinary intimacy but makes loss devastating." },
  { id: "social", short: "Social", domain: 3,
    low: "Group dynamics are not your natural habitat. You may find social navigation exhausting, performative, or simply uninteresting. Your strength is in depth, not breadth — you'd rather have one real conversation than work an entire room.",
    mid: "You can read and navigate groups when necessary but don't seek the spotlight. You understand social dynamics intellectually and can play the game, but it drains you more than it energizes you.",
    high: "You instinctively read the invisible architecture of any group — who holds power, who's performing, who's about to break. You calibrate your behavior to context with natural precision. This social intelligence is invaluable, but it can also make you feel like you're always performing rather than being." },
  { id: "autonomy", short: "Autonomy", domain: 3,
    low: "You're comfortable with interdependence and may even prefer it. Being embedded in a web of relationships and obligations feels natural, not constraining. Your risk is that you may lose track of your own needs while attending to everyone else's.",
    mid: "You need your space but don't require total independence. You can collaborate without feeling compromised and can be alone without feeling isolated. You've found a workable balance between connection and sovereignty.",
    high: "Sovereignty is non-negotiable for you. You need to operate on your own terms, make your own decisions, and answer to your own standards. This independence is your greatest strength and your deepest isolation — the wall that protects you also keeps people out." },
  { id: "trust", short: "Trust", domain: 3,
    low: "You extend trust easily, sometimes too easily. You default to openness and give people the benefit of the doubt, which accelerates relationships but also exposes you to exploitation. Your generosity of spirit is beautiful and dangerous.",
    mid: "You trust incrementally — people earn access through demonstrated reliability. You're neither paranoid nor naive, and you adjust your trust level based on evidence rather than anxiety or optimism.",
    high: "Your trust threshold is a fortress. People must prove themselves repeatedly before you lower the drawbridge, and a single betrayal can permanently reclassify someone. This protects you from exploitation but may also prevent you from receiving the support you need." },

  { id: "purpose", short: "Purpose", domain: 4,
    low: "You don't feel a strong pull toward a singular mission. Life is more of an exploration than a quest, and you're comfortable with ambiguity about where you're headed. The freedom this gives you is real, but so is the occasional vertigo of not knowing why you're doing what you're doing.",
    mid: "You have a general sense of direction but it's not a laser beam. You know what matters to you broadly but the specifics shift. This flexibility protects you from the brittleness of over-identification with a single path.",
    high: "The signal pulling you forward is clear and strong. You know what you're building, why it matters, and what you're willing to sacrifice for it. This clarity is rare and powerful, but it can also blind you to adjacent possibilities and make you dismiss anything that doesn't serve the mission." },
  { id: "identity", short: "Identity", domain: 4,
    low: "Your sense of self is fluid and context-dependent. You become different versions of yourself in different environments, which makes you adaptable but can also feel like you don't have a core. The question 'who am I really?' visits you more often than you'd like.",
    mid: "You have a stable self-concept that can flex without breaking. External turbulence may rattle you temporarily but doesn't fundamentally reshape who you believe yourself to be. You know who you are — you're just still refining the details.",
    high: "Your identity is a fortress. You know exactly who you are, what you stand for, and where your boundaries lie. External pressure, social expectations, and even personal failure don't erode your self-concept. The risk is rigidity — an identity so fixed it can't incorporate new information about yourself." },
  { id: "mortality", short: "Mortality", domain: 4,
    low: "Death lives in the abstract for you — you know it intellectually but don't feel it in your bones on a daily basis. This keeps you functional and forward-looking, but it may also mean you postpone the urgency that comes from truly grasping that time is finite.",
    mid: "You carry an awareness of finitude that surfaces in certain moments — watching someone age, completing a project, standing in nature. It's not constant but it's accessible, and it gives periodic weight to your decisions.",
    high: "You live with death in the room. Not morbidly, but viscerally — the awareness that every moment is borrowed shapes how you spend your time, who you spend it with, and what you're willing to tolerate. This integration of mortality gives you unusual clarity about what actually matters." },
  { id: "transcendence", short: "Transcendence", domain: 4,
    low: "You're grounded in the material world and find meaning in tangible things — relationships, work, physical experience. The mystical or transcendent doesn't pull you strongly, and that's not a deficit. You find the sacred in the ordinary.",
    mid: "You occasionally touch something beyond the material — in nature, in music, in moments of deep connection — but you don't live there. These glimpses inform your life without dominating it.",
    high: "You hunger for contact with something beyond the material plane. Whether through philosophy, spirituality, art, or altered states, you're constantly reaching for the edge of ordinary consciousness. This drive is the source of your deepest insights and your deepest dissatisfaction with normal life." },

  { id: "anger", short: "Anger", domain: 5,
    low: "Anger is largely inaccessible to you. You may suppress it, redirect it, or simply not generate it at the expected intensity. The cost is that your boundaries may be invisible to others because you never enforce them with fire. Learning to feel anger without becoming it is your work.",
    mid: "You have a functional relationship with anger — you can feel it, express it when necessary, and release it without it consuming you. It serves as a boundary signal rather than a controlling force.",
    high: "Anger is close to the surface and available as a tool. You feel it quickly, intensely, and clearly. This gives you powerful boundary-setting ability and a visceral sense of justice, but unchecked, it can damage relationships and distort your perception of threats." },
  { id: "fear", short: "Fear", domain: 5,
    low: "You move through the world with relatively low anxiety. Risk doesn't paralyze you and uncertainty doesn't spiral. This courage is genuine, but make sure it's not actually denial — sometimes fear is information, not weakness.",
    mid: "Fear is present but manageable. You feel it before big decisions, in unfamiliar situations, and when the stakes are real — but it doesn't stop you from acting. You've learned to move with fear rather than waiting for it to pass.",
    high: "Fear is your constant companion. You're hyper-aware of what could go wrong, who might betray you, and where the ground is unstable. This vigilance makes you an excellent risk-assessor and a loyal protector of what matters, but it can also trap you in preparation mode, endlessly securing a perimeter instead of crossing it." },
  { id: "shame", short: "Shame", domain: 5,
    low: "You don't carry much internalized inadequacy. You can fail publicly without it feeling like an identity crisis, and you recover from embarrassment quickly. This resilience is valuable, but make sure you're still metabolizing the lessons that shame is trying to deliver.",
    mid: "Shame visits you but doesn't move in. You feel it after mistakes, in moments of exposed incompetence, and when you fall short of your own standards — but you can process it without spiraling into self-destruction.",
    high: "Shame runs deep in your operating system. You feel the gap between who you are and who you should be as a constant, low-grade pain. This drives relentless self-improvement but can also make you perform rather than be — chasing an image of yourself that will finally feel worthy." },
  { id: "desire", short: "Desire", domain: 5,
    low: "You keep your wants muted, controlled, or hidden — even from yourself. This may look like contentment but it might also be suppression. The things you never let yourself want don't go away; they just drive you from the basement.",
    mid: "You know what you want and can name most of it without shame. You don't let desire run your life, but you don't pretend it doesn't exist either. You've made peace with wanting as a feature of being alive.",
    high: "You are transparent about what you want — to yourself and often to others. Your desire is a visible force that drives your choices and shapes your life. This honesty is liberating, but unmoderated desire can become consumption — always reaching for the next thing without savoring what's here." },
];

// Domain synthesis generators
function getDomainSynthesis(domain, scores) {
  const vals = FACETS.filter(f => f.domain === domain).map(f => scores[f.id] || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const spread = Math.max(...vals) - Math.min(...vals);

  if (domain === 0) { // Cognitive
    if (avg > 0.65) return "Your cognitive architecture is formidable. You process reality through layered analysis, pattern recognition, and abstract reasoning — often simultaneously. You're the person who sees the system behind the surface and can articulate what others only sense. Your challenge is paralysis: when every decision becomes a research project, nothing gets shipped. Trust that your mind has already done enough processing to act.";
    if (avg > 0.4) return "Your thinking is balanced between intuition and analysis. You can shift gears between big-picture vision and ground-level detail, which makes you a versatile problem-solver. You're neither lost in abstraction nor trapped in the concrete. This cognitive flexibility is your intellectual advantage — you can speak both languages.";
    return "You think with your hands, your gut, and your direct experience. Abstract frameworks and theoretical models don't light you up the way tangible results do. This grounds you in reality while others float away into their heads. Your cognitive style is practical, immediate, and action-oriented. Don't let anyone convince you that thinking has to look like theirs.";
  }
  if (domain === 1) { // Emotional
    if (avg > 0.65) return "Your emotional world is vast, deep, and largely uncontrolled. You feel at frequencies most people can't access — the beauty in a minor chord, the grief in a stranger's eyes, the weight of a moment that others walk through without noticing. This richness is your artistic and spiritual gift, but it also means ordinary life can feel like walking through fire. Building containers for this intensity — rituals, creative practice, trusted relationships — isn't optional. It's survival.";
    if (avg > 0.4) return "You have a healthy emotional range — you can access depth when the moment calls for it and regulate when circumstances demand composure. You feel things without being consumed by them, and you can be present to others' pain without losing yourself. This emotional intelligence makes you a stabilizing force in turbulent environments.";
    return "You operate with emotional efficiency. Feelings are processed quickly, stored compactly, and don't bleed into domains where they don't belong. This makes you dependable and clear-headed under pressure, but it may also mean that certain emotional experiences — the ones that require surrender — remain partially locked. The door isn't closed; you just don't visit that room often.";
  }
  if (domain === 2) { // Volitional
    if (avg > 0.65) return "Your will is a force of nature. You combine assertive drive with sustained discipline and the adaptability to change tactics without changing direction. When you decide something matters, the universe adjusts or you do — but either way, the gap closes. Your volitional intensity is rare and magnetic, but it can also exhaust the people around you. Not everyone operates at your RPM, and learning to modulate your engine is as important as having one.";
    if (avg > 0.4) return "Your will is capable but selective. You can push hard when the cause justifies it, but you don't waste energy on battles that don't matter. You have enough discipline to build and enough spontaneity to pivot. This makes you effective without being rigid — a builder who can improvise.";
    return "You move through the world with relatively low force. You prefer to flow around obstacles rather than through them, and you're more responsive than proactive. This makes you harmonious and adaptive, but it can also mean that your vision stays internal — a beautiful blueprint that never meets the construction site. The world needs what you see. Push.";
  }
  if (domain === 3) { // Relational
    if (spread > 0.4) return "Your relational profile is complex — you have strong drives that pull in opposite directions. You may crave deep bonding while simultaneously needing fierce autonomy, or you may be socially gifted but deeply suspicious of trust. This tension is not a contradiction to resolve; it's the architecture of who you are. Your relationships will always have this push-pull quality. The people who stay are the ones who can hold both poles.";
    if (avg > 0.6) return "Relationships are central to your operating system. You bond deeply, navigate social complexity with instinctive skill, and invest heavily in the people who matter. Your relational intelligence is high, and you probably serve as the connective tissue in multiple communities. Guard against over-extension — when you give to everyone, there's sometimes nothing left for you.";
    if (avg > 0.35) return "You maintain a selective but sustainable relational world. You have your people and you hold them close, but you don't need a vast social network to feel secure. You connect meaningfully when you choose to and protect your solitude when you need it. This balance is harder to maintain than it looks, and you should recognize it as an achievement.";
    return "You operate with significant relational independence. Your world is built more on ideas, projects, and internal exploration than on interpersonal bonds. This isn't loneliness — it's sovereignty. But make sure the walls you've built are doors that open from both sides. Some of the things you're building in solitude would be transformed by the right collaboration.";
  }
  if (domain === 4) { // Existential
    if (avg > 0.65) return "You live with existential questions at full volume. Purpose, identity, mortality, and transcendence aren't philosophical abstractions for you — they're the weather you wake up in. This makes your life meaningful in a way that's almost unbearable, because you can't do anything without asking why, and you can't love anything without knowing you'll lose it. This weight is also your depth. The people who see you clearly will recognize someone who has looked at the real questions and not flinched.";
    if (avg > 0.4) return "You carry existential awareness without being crushed by it. You think about purpose and meaning regularly, you have a sense of who you are, and you've made some peace with mortality — enough to live well without constantly staring into the void. This is mature, functional existential integration.";
    return "You live in the immediate. The big questions — why am I here, what happens when I die, who am I really — don't dominate your consciousness. You find meaning in the doing rather than the questioning, and you're more focused on building a good life than understanding what life means. This pragmatic existentialism is underrated.";
  }
  if (domain === 5) { // Shadow
    if (spread > 0.4) return "Your shadow profile is asymmetric — you have strong access to some shadow energies and almost no access to others. This creates a lopsided internal landscape where certain emotions drive you powerfully while others remain locked away. The ones you can't access aren't gone — they're running programs you can't see. The growth work is in the facets that scored lowest: those are the rooms you haven't entered.";
    if (avg > 0.6) return "You have unusual access to your shadow material. Anger, fear, shame, and desire are not hidden from you — you know where they live and how they operate. This self-knowledge is rare and powerful, but it also means you're in constant negotiation with forces that most people simply repress. Your integration of shadow gives you authenticity that others can feel, even if they can't name it.";
    if (avg > 0.35) return "Your relationship with shadow material is developing. You're aware of your anger, fear, shame, and desire at a functional level — enough to not be blindsided by them, but perhaps not enough to fully harness their energy. The shadow isn't your enemy; it's your fuel source. Getting to know it better will unlock power you didn't know you had.";
    return "Much of your shadow material is buried or redirected. The anger, fear, shame, and desire that drive human behavior are operating below your conscious awareness. This doesn't mean they're not active — it means they're influencing your choices without your consent. The invitation is not to unleash them, but to meet them. What you can name, you can choose. What you can't name chooses you.";
  }
  return "";
}

const ENNEAGRAM_PROFILES = {
  1: { name: "The Reformer", color: "#e8e8e8", desc: "You are driven by an internal compass of rightness that never stops calibrating. Your gift is that you see how things should be — the gap between reality and the ideal is always visible to you, and you cannot rest until it's closed. Your discipline, your standards, and your moral seriousness make you a force for genuine improvement in everything you touch. But the inner critic that drives your excellence also punishes you for being human. Learning that imperfection is not a moral failure — that 'good enough' is sometimes the highest form of wisdom — is your life's work.", facets: { analytical: 0.85, pattern: 0.6, abstract: 0.5, pragmatic: 0.7, depth: 0.5, empathy: 0.4, regulation: 0.85, vulnerability: 0.2, assertion: 0.7, discipline: 0.95, spontaneity: 0.15, patience: 0.5, bonding: 0.4, social: 0.5, autonomy: 0.6, trust: 0.5, purpose: 0.9, identity: 0.7, mortality: 0.4, transcendence: 0.5, anger: 0.9, fear: 0.4, shame: 0.6, desire: 0.2 }},
  2: { name: "The Helper", color: "#ff8fa3", desc: "You move through the world with an open heart and an almost involuntary attunement to what others need. Your gift is genuine — when you show up for someone, they feel seen in a way that no one else provides. But beneath the giving is a question you may not have fully confronted: what do you need? The help you offer is real, but it can also become a strategy for earning love that you believe you can't receive for free. Your growth is in learning that you are worthy of care not because of what you give, but because of who you are — empty-handed, with nothing to offer but yourself.", facets: { analytical: 0.3, pattern: 0.5, abstract: 0.3, pragmatic: 0.6, depth: 0.8, empathy: 0.95, regulation: 0.3, vulnerability: 0.7, assertion: 0.3, discipline: 0.5, spontaneity: 0.6, patience: 0.6, bonding: 0.95, social: 0.8, autonomy: 0.15, trust: 0.3, purpose: 0.5, identity: 0.4, mortality: 0.3, transcendence: 0.4, anger: 0.3, fear: 0.4, shame: 0.5, desire: 0.8 }},
  3: { name: "The Achiever", color: "#ffd43b", desc: "You are built for performance. You read environments instantly, identify what success looks like, and become the version of yourself most likely to achieve it. This adaptability is genuine intelligence — you accomplish what others only talk about. But the machinery of achievement can become so efficient that it runs without you. The person performing may not be the person feeling. Your deepest work is learning to exist without an audience — to discover who you are when no one is watching, when nothing is being measured, and when there is no applause. That person is more interesting than any role you've ever played.", facets: { analytical: 0.6, pattern: 0.7, abstract: 0.4, pragmatic: 0.9, depth: 0.3, empathy: 0.4, regulation: 0.7, vulnerability: 0.1, assertion: 0.85, discipline: 0.8, spontaneity: 0.5, patience: 0.3, bonding: 0.3, social: 0.9, autonomy: 0.5, trust: 0.4, purpose: 0.8, identity: 0.3, mortality: 0.3, transcendence: 0.3, anger: 0.4, fear: 0.5, shame: 0.9, desire: 0.5 }},
  4: { name: "The Individualist", color: "#9775fa", desc: "You experience life at a depth and intensity that most people will never access. Beauty, meaning, identity, and loss are not concepts for you — they are the weather you live in. Your gift is authenticity: you refuse to be anyone other than who you actually are, even when that person is inconvenient, complicated, or too much for the room. But the same sensitivity that gives you your depth can also convince you that ordinary happiness is beneath you, that your suffering is more real than others', or that you're fundamentally different from everyone else. You are different — and you are also, in the ways that matter most, exactly the same.", facets: { analytical: 0.4, pattern: 0.8, abstract: 0.8, pragmatic: 0.2, depth: 0.95, empathy: 0.7, regulation: 0.2, vulnerability: 0.9, assertion: 0.3, discipline: 0.3, spontaneity: 0.6, patience: 0.4, bonding: 0.8, social: 0.3, autonomy: 0.7, trust: 0.5, purpose: 0.5, identity: 0.9, mortality: 0.9, transcendence: 0.85, anger: 0.5, fear: 0.5, shame: 0.8, desire: 0.7 }},
  5: { name: "The Investigator", color: "#74c0fc", desc: "Your mind is a cathedral — vast, quiet, and built for contemplation. You understand the world by taking it apart and studying each piece in isolation, and the knowledge you accumulate becomes a form of security. You need less from the external world than most people because your internal world is so rich. But the fortress of understanding you've built can also become a prison. You may study life so thoroughly that you forget to live it. Your growth is in stepping out of the observatory and into the weather — not knowing, not understanding, just being present with the chaos of unmediated experience.", facets: { analytical: 0.95, pattern: 0.9, abstract: 0.9, pragmatic: 0.4, depth: 0.6, empathy: 0.3, regulation: 0.8, vulnerability: 0.1, assertion: 0.2, discipline: 0.7, spontaneity: 0.1, patience: 0.85, bonding: 0.2, social: 0.15, autonomy: 0.95, trust: 0.8, purpose: 0.6, identity: 0.7, mortality: 0.6, transcendence: 0.6, anger: 0.2, fear: 0.7, shame: 0.4, desire: 0.15 }},
  6: { name: "The Loyalist", color: "#63e6be", desc: "You see the world with unusual clarity about what could go wrong — and you stay anyway. Your loyalty is not naive; it's a choice made with full awareness of risk, which makes it more valuable than the loyalty of people who simply haven't imagined betrayal. You are the person who stress-tests every bridge before walking on it, and the structures you trust have been earned, not assumed. But your vigilance has a cost: the constant scanning for threats is exhausting, and it can prevent you from trusting the ground beneath your feet. Some bridges are solid. Some people are safe. Your work is in learning to feel that in your body, not just know it in your mind.", facets: { analytical: 0.7, pattern: 0.6, abstract: 0.4, pragmatic: 0.7, depth: 0.5, empathy: 0.6, regulation: 0.4, vulnerability: 0.5, assertion: 0.4, discipline: 0.7, spontaneity: 0.3, patience: 0.6, bonding: 0.6, social: 0.7, autonomy: 0.3, trust: 0.9, purpose: 0.5, identity: 0.5, mortality: 0.7, transcendence: 0.3, anger: 0.5, fear: 0.95, shame: 0.5, desire: 0.4 }},
  7: { name: "The Enthusiast", color: "#ffa94d", desc: "You are wired for possibility. Where others see one path, you see seventeen, and the world feels like an infinite buffet of experience, connection, and adventure. Your enthusiasm is not performance — it's a genuine response to a reality that seems endlessly rich. You make everything more alive by being in it. But the constant forward motion — the next idea, the next project, the next high — can also be a sophisticated escape from pain. The one place you struggle to visit is the present moment when it contains something you don't want to feel. Your growth is in learning that depth is not the opposite of freedom. Sometimes the most adventurous thing you can do is stay.", facets: { analytical: 0.4, pattern: 0.6, abstract: 0.7, pragmatic: 0.5, depth: 0.3, empathy: 0.5, regulation: 0.2, vulnerability: 0.3, assertion: 0.6, discipline: 0.2, spontaneity: 0.95, patience: 0.1, bonding: 0.4, social: 0.8, autonomy: 0.6, trust: 0.3, purpose: 0.4, identity: 0.4, mortality: 0.2, transcendence: 0.7, anger: 0.3, fear: 0.3, shame: 0.2, desire: 0.95 }},
  8: { name: "The Challenger", color: "#ff6b6b", desc: "You carry a force that most people spend their entire lives trying to develop. You say what you mean, you protect what you love, and you refuse to be controlled by anyone or anything. Your presence is undeniable — rooms reorganize around you whether you intend it or not. This power is real and the world needs it, especially in defense of people who can't defend themselves. But beneath the armor is the thing the armor was built to protect: a tenderness so vast that if you let anyone see it unguarded, you're afraid it would destroy you. It won't. The vulnerability you guard so fiercely is not your weakness — it's the part of you that makes your strength worth having.", facets: { analytical: 0.5, pattern: 0.5, abstract: 0.3, pragmatic: 0.85, depth: 0.4, empathy: 0.3, regulation: 0.5, vulnerability: 0.1, assertion: 0.95, discipline: 0.7, spontaneity: 0.7, patience: 0.2, bonding: 0.3, social: 0.5, autonomy: 0.9, trust: 0.85, purpose: 0.7, identity: 0.8, mortality: 0.4, transcendence: 0.2, anger: 0.95, fear: 0.2, shame: 0.1, desire: 0.7 }},
  9: { name: "The Peacemaker", color: "#a9e34b", desc: "You hold the rarest gift of the nine types: the ability to see all perspectives simultaneously without choosing one as superior. This makes you a natural mediator, a calming presence, and someone who can hold contradictions that tear other people apart. People feel safe around you because you don't judge, don't push, and don't demand. But the peace you create for others often comes at the cost of your own voice. You merge with other people's agendas, suppress your own desires to avoid conflict, and slowly disappear into the background of your own life. Your growth is in the terrifying act of mattering — of saying 'I want this,' even when it disrupts the harmony you've built. You are not the background. You are the reason the room holds together.", facets: { analytical: 0.3, pattern: 0.5, abstract: 0.5, pragmatic: 0.5, depth: 0.5, empathy: 0.8, regulation: 0.6, vulnerability: 0.5, assertion: 0.1, discipline: 0.3, spontaneity: 0.4, patience: 0.9, bonding: 0.6, social: 0.6, autonomy: 0.3, trust: 0.3, purpose: 0.2, identity: 0.3, mortality: 0.3, transcendence: 0.5, anger: 0.1, fear: 0.4, shame: 0.4, desire: 0.3 }},
};

const SCENARIOS = [
  { phase: "Perception", prompt: "You notice something nobody else in the room has seen. A micro-expression. A misplaced word. A pattern forming.", choices: [
    { text: "Catalog it silently. Information is ammunition \u2014 spend it wisely.", scores: { analytical: 0.8, regulation: 0.7, trust: 0.7, patience: 0.8 }},
    { text: "Name it out loud. Silence is complicity with the unseen.", scores: { assertion: 0.8, vulnerability: 0.6, anger: 0.5, desire: 0.7 }},
    { text: "Feel it in your body before your mind can frame it.", scores: { depth: 0.8, empathy: 0.7, pattern: 0.7, mortality: 0.5 }},
    { text: "Check if anyone else caught it.", scores: { social: 0.8, bonding: 0.6, trust: 0.4, fear: 0.5 }},
  ]},
  { phase: "Pressure", prompt: "Someone questions your competence in front of people whose respect you need.", choices: [
    { text: "Dismantle their argument point by point.", scores: { analytical: 0.9, assertion: 0.7, shame: 0.8, regulation: 0.6 }},
    { text: "Smile. Let your work answer later.", scores: { patience: 0.9, regulation: 0.8, identity: 0.7, anger: 0.3 }},
    { text: "Feel the wound but don't flinch.", scores: { depth: 0.7, vulnerability: 0.6, shame: 0.6, pattern: 0.7 }},
    { text: "Redirect the conversation to what matters.", scores: { social: 0.8, pragmatic: 0.7, assertion: 0.5, discipline: 0.6 }},
  ]},
  { phase: "Solitude", prompt: "You've been alone for three days. No obligations. No contact.", choices: [
    { text: "Thriving. The signal is clearest in silence.", scores: { autonomy: 0.95, abstract: 0.7, patience: 0.7, bonding: 0.1 }},
    { text: "Productive but hollow.", scores: { purpose: 0.7, bonding: 0.7, discipline: 0.6, desire: 0.6 }},
    { text: "Restless. Stillness is entropy with a marketing budget.", scores: { spontaneity: 0.9, assertion: 0.5, fear: 0.5, transcendence: 0.4 }},
    { text: "Deep. Three days barely reaches the real floor.", scores: { depth: 0.9, mortality: 0.7, identity: 0.7, transcendence: 0.8 }},
  ]},
  { phase: "Betrayal", prompt: "Someone you trusted completely breaks that trust deliberately.", choices: [
    { text: "Cut them clean. Permanent reclassification.", scores: { anger: 0.8, autonomy: 0.8, trust: 0.9, assertion: 0.7 }},
    { text: "Try to understand why.", scores: { empathy: 0.9, depth: 0.7, vulnerability: 0.6, fear: 0.4 }},
    { text: "Go quiet. Process for weeks.", scores: { regulation: 0.8, patience: 0.8, analytical: 0.6, shame: 0.5 }},
    { text: "Ask yourself what you missed.", scores: { pattern: 0.8, analytical: 0.7, fear: 0.7, identity: 0.5 }},
  ]},
  { phase: "Creation", prompt: "Building from nothing. No blueprint. Just vision.", choices: [
    { text: "Start with structure.", scores: { analytical: 0.8, discipline: 0.8, pragmatic: 0.6, purpose: 0.7 }},
    { text: "Start with feeling.", scores: { depth: 0.7, spontaneity: 0.7, abstract: 0.7, transcendence: 0.6 }},
    { text: "Start with the end user.", scores: { empathy: 0.7, pragmatic: 0.8, social: 0.6, bonding: 0.5 }},
    { text: "Start by destroying the first idea.", scores: { pattern: 0.7, anger: 0.5, spontaneity: 0.6, identity: 0.6 }},
  ]},
  { phase: "Authority", prompt: "You're given power over people who didn't choose you.", choices: [
    { text: "Build systems so fair my judgment becomes irrelevant.", scores: { analytical: 0.7, discipline: 0.8, regulation: 0.7, purpose: 0.8 }},
    { text: "Lead from the front.", scores: { assertion: 0.9, vulnerability: 0.6, anger: 0.5, bonding: 0.5 }},
    { text: "Listen first.", scores: { empathy: 0.8, patience: 0.7, social: 0.7, shame: 0.4 }},
    { text: "Refuse it.", scores: { autonomy: 0.8, fear: 0.6, identity: 0.7, trust: 0.6 }},
  ]},
  { phase: "Loss", prompt: "Something you loved is gone. The grief is physical.", choices: [
    { text: "Let it shatter me.", scores: { vulnerability: 0.9, depth: 0.9, mortality: 0.8, regulation: 0.2 }},
    { text: "Build something in its place.", scores: { discipline: 0.7, pragmatic: 0.6, purpose: 0.7, desire: 0.5 }},
    { text: "Sit with it. Don't rush to meaning.", scores: { patience: 0.8, mortality: 0.8, identity: 0.6, transcendence: 0.6 }},
    { text: "Call someone.", scores: { bonding: 0.9, empathy: 0.6, social: 0.5, fear: 0.4 }},
  ]},
  { phase: "Temptation", prompt: "An opportunity requires bending a principle you've held for years.", choices: [
    { text: "Hold the line.", scores: { discipline: 0.9, identity: 0.9, purpose: 0.7, anger: 0.6 }},
    { text: "Bend. Rigidity is not integrity.", scores: { pragmatic: 0.8, spontaneity: 0.6, desire: 0.7, abstract: 0.5 }},
    { text: "Pause. The urgency is suspicious.", scores: { pattern: 0.8, regulation: 0.7, fear: 0.7, patience: 0.7 }},
    { text: "Take it, but name the cost publicly.", scores: { vulnerability: 0.7, assertion: 0.6, shame: 0.6, social: 0.6 }},
  ]},
  { phase: "Conflict", prompt: "Two people you love are destroying each other. Both are right.", choices: [
    { text: "Mediate.", scores: { empathy: 0.8, regulation: 0.8, social: 0.7, patience: 0.6 }},
    { text: "Choose a side.", scores: { assertion: 0.7, anger: 0.6, bonding: 0.7, purpose: 0.5 }},
    { text: "Step back.", scores: { autonomy: 0.8, regulation: 0.6, trust: 0.5, fear: 0.4 }},
    { text: "Show them the pattern.", scores: { pattern: 0.9, abstract: 0.6, analytical: 0.5, depth: 0.6 }},
  ]},
  { phase: "Identity", prompt: "The version others believe in isn't who you actually are.", choices: [
    { text: "Burn the mask.", scores: { identity: 0.9, vulnerability: 0.8, anger: 0.6, desire: 0.8 }},
    { text: "Evolve slowly.", scores: { patience: 0.7, regulation: 0.7, pragmatic: 0.6, shame: 0.5 }},
    { text: "The gap is the interesting part.", scores: { abstract: 0.8, depth: 0.7, identity: 0.5, transcendence: 0.7 }},
    { text: "Start with who you are alone.", scores: { autonomy: 0.7, purpose: 0.7, analytical: 0.5, mortality: 0.5 }},
  ]},
  { phase: "Desire", prompt: "You want something so badly it scares you.", choices: [
    { text: "Name it. Say it out loud.", scores: { desire: 0.95, vulnerability: 0.7, assertion: 0.6, identity: 0.6 }},
    { text: "Interrogate it.", scores: { analytical: 0.7, pattern: 0.7, autonomy: 0.6, fear: 0.6 }},
    { text: "Channel it.", scores: { discipline: 0.7, pragmatic: 0.7, purpose: 0.7, regulation: 0.6 }},
    { text: "Release it.", scores: { transcendence: 0.9, patience: 0.7, mortality: 0.5, regulation: 0.7 }},
  ]},
  { phase: "Fear", prompt: "Standing at the exact boundary of your competence.", choices: [
    { text: "Step.", scores: { spontaneity: 0.8, assertion: 0.7, fear: 0.3, desire: 0.6 }},
    { text: "Map first.", scores: { analytical: 0.8, patience: 0.7, fear: 0.7, discipline: 0.6 }},
    { text: "The boundary is the destination.", scores: { abstract: 0.7, depth: 0.6, mortality: 0.6, transcendence: 0.6 }},
    { text: "Find someone who's been across.", scores: { bonding: 0.7, social: 0.6, trust: 0.5, empathy: 0.5 }},
  ]},
  { phase: "Joy", prompt: "Something going perfectly. Suspiciously well.", choices: [
    { text: "Let it in fully.", scores: { vulnerability: 0.8, depth: 0.8, mortality: 0.7, desire: 0.6 }},
    { text: "Scan for the catch.", scores: { fear: 0.8, pattern: 0.7, analytical: 0.6, regulation: 0.5 }},
    { text: "Share it immediately.", scores: { bonding: 0.8, social: 0.7, empathy: 0.6, spontaneity: 0.6 }},
    { text: "Keep building.", scores: { discipline: 0.8, pragmatic: 0.7, purpose: 0.6, assertion: 0.5 }},
  ]},
  { phase: "Truth", prompt: "You've been wrong about something fundamental.", choices: [
    { text: "Rebuild everything.", scores: { analytical: 0.8, identity: 0.4, discipline: 0.7, purpose: 0.6 }},
    { text: "Grieve the old understanding.", scores: { depth: 0.8, mortality: 0.8, vulnerability: 0.7, shame: 0.7 }},
    { text: "Integrate. Incomplete, not wrong.", scores: { abstract: 0.8, pattern: 0.7, pragmatic: 0.5, transcendence: 0.6 }},
    { text: "Model the correction publicly.", scores: { vulnerability: 0.8, social: 0.7, assertion: 0.5, shame: 0.5 }},
  ]},
  { phase: "Power", prompt: "You've been holding back \u2014 believing your full force would be too much.", choices: [
    { text: "Unleash it.", scores: { assertion: 0.9, anger: 0.7, desire: 0.8, identity: 0.8 }},
    { text: "Calibrate it.", scores: { regulation: 0.8, discipline: 0.7, analytical: 0.6, pragmatic: 0.7 }},
    { text: "Examine who told you that.", scores: { pattern: 0.8, depth: 0.7, shame: 0.7, fear: 0.5 }},
    { text: "Find a container big enough.", scores: { purpose: 0.8, abstract: 0.6, transcendence: 0.7, patience: 0.5 }},
  ]},
  { phase: "Synthesis", prompt: "Everything converges. Past, present, potential \u2014 all visible.", choices: [
    { text: "Build.", scores: { pragmatic: 0.8, discipline: 0.7, assertion: 0.7, purpose: 0.8 }},
    { text: "Write it down.", scores: { abstract: 0.7, depth: 0.7, pattern: 0.6, mortality: 0.7 }},
    { text: "Share it.", scores: { empathy: 0.7, bonding: 0.6, social: 0.6, transcendence: 0.8 }},
    { text: "Breathe.", scores: { regulation: 0.8, patience: 0.8, identity: 0.7, transcendence: 0.8 }},
  ]},
];

// ═══ Facet interpretation helper ═══
function getFacetInterpretation(facet, value) {
  if (value <= 0.35) return facet.low;
  if (value <= 0.65) return facet.mid;
  return facet.high;
}

// ═══ 3D IRIS ═══
function IrisScene({ facetScores, enneagramType }) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const w = container.clientWidth, h = container.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setClearColor(0x06060e, 1);
    container.appendChild(renderer.domElement);
    const typeColor = enneagramType ? ENNEAGRAM_PROFILES[enneagramType]?.color || "#fff" : "#4a90d9";
    const coreColor = new THREE.Color(typeColor);
    const cA = (facetScores.analytical + facetScores.pattern + facetScores.abstract + facetScores.pragmatic) / 4;
    const eA = (facetScores.depth + facetScores.empathy + facetScores.regulation + facetScores.vulnerability) / 4;
    const vA = (facetScores.assertion + facetScores.discipline + facetScores.spontaneity + facetScores.patience) / 4;
    const rx = 0.001 + vA * 0.004, ry = 0.002 + cA * 0.005, rz = 0.0005 + eA * 0.002;
    const ig = new THREE.Group(); scene.add(ig);
    const n = 24, ga = Math.PI * (3 - Math.sqrt(5)), bR = 2.0, ends = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, rY = Math.sqrt(1 - y * y), th = ga * i;
      const dir = new THREE.Vector3(Math.cos(th) * rY, y, Math.sin(th) * rY).normalize();
      const val = facetScores[FACETS[i].id] || 0;
      const end = dir.clone().multiplyScalar(0.3 + val * bR), full = dir.clone().multiplyScalar(bR + 0.3);
      ends.push(end);
      const dc = new THREE.Color(DOMAINS[FACETS[i].domain].color);
      ig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), full]), new THREE.LineBasicMaterial({ color: dc, transparent: true, opacity: 0.08 })));
      ig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), end]), new THREE.LineBasicMaterial({ color: dc, transparent: true, opacity: 0.35 + val * 0.4 })));
      const nm = new THREE.Mesh(new THREE.SphereGeometry(0.03 + val * 0.03, 8, 8), new THREE.MeshBasicMaterial({ color: dc, transparent: true, opacity: 0.7 + val * 0.3 }));
      nm.position.copy(end); ig.add(nm);
    }
    const iv = [], ic = [];
    for (let i = 0; i < n; i++) { const nx = (i + 1) % n, a = ends[i], b = ends[nx]; iv.push(0, 0, 0, a.x, a.y, a.z, b.x, b.y, b.z); const c1 = new THREE.Color(DOMAINS[FACETS[i].domain].color), c2 = new THREE.Color(DOMAINS[FACETS[nx].domain].color); ic.push(coreColor.r, coreColor.g, coreColor.b, c1.r, c1.g, c1.b, c2.r, c2.g, c2.b); }
    const iGeo = new THREE.BufferGeometry(); iGeo.setAttribute("position", new THREE.Float32BufferAttribute(iv, 3)); iGeo.setAttribute("color", new THREE.Float32BufferAttribute(ic, 3));
    ig.add(new THREE.Mesh(iGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12, side: THREE.DoubleSide })));
    ig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...ends, ends[0]]), new THREE.LineBasicMaterial({ color: coreColor, transparent: true, opacity: 0.3 })));
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if ((j - i) % 4 === 0 || (j - i) % 6 === 0) ig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([ends[i], ends[j]]), new THREE.LineBasicMaterial({ color: coreColor, transparent: true, opacity: 0.04 })));
    [new THREE.Euler(Math.PI / 2, 0, 0), new THREE.Euler(0, 0, Math.PI / 6), new THREE.Euler(Math.PI / 4, Math.PI / 4, 0)].forEach((tilt, idx) => { const r = new THREE.Mesh(new THREE.RingGeometry(bR * 0.95, bR * 0.97, 64), new THREE.MeshBasicMaterial({ color: [0xffa94d, 0xff6b8a, 0x7eb5ff][idx], transparent: true, opacity: 0.06, side: THREE.DoubleSide })); r.rotation.copy(tilt); ig.add(r); });
    const cMat = new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.9 });
    const cM = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), cMat); ig.add(cM);
    const gMat = new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.15 });
    const gM = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), gMat); ig.add(gM);
    ig.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.04 })));
    const pc = 500, pp = new Float32Array(pc * 3), pcc = new Float32Array(pc * 3);
    for (let i = 0; i < pc; i++) { const r = 2 + Math.random() * 4, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1); pp[i * 3] = r * Math.sin(p) * Math.cos(t); pp[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pp[i * 3 + 2] = r * Math.cos(p); const d = new THREE.Color(DOMAINS[Math.floor(Math.random() * 6)].color); pcc[i * 3] = d.r; pcc[i * 3 + 1] = d.g; pcc[i * 3 + 2] = d.b; }
    const pG = new THREE.BufferGeometry(); pG.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3)); pG.setAttribute("color", new THREE.Float32BufferAttribute(pcc, 3));
    const pts = new THREE.Points(pG, new THREE.PointsMaterial({ size: 0.015, vertexColors: true, transparent: true, opacity: 0.4 })); scene.add(pts);
    let mx = 0, my = 0;
    const mm = e => { const r = container.getBoundingClientRect(); mx = ((e.clientX - r.left) / w - 0.5) * 2; my = ((e.clientY - r.top) / h - 0.5) * 2; };
    const tm = e => { if (e.touches.length) { const r = container.getBoundingClientRect(); mx = ((e.touches[0].clientX - r.left) / w - 0.5) * 2; my = ((e.touches[0].clientY - r.top) / h - 0.5) * 2; } };
    container.addEventListener("mousemove", mm); container.addEventListener("touchmove", tm, { passive: true });
    let t = 0;
    const anim = () => { frameRef.current = requestAnimationFrame(anim); t += 0.016; ig.rotation.x += rx + my * 0.003; ig.rotation.y += ry + mx * 0.003; ig.rotation.z += rz; const p = 1 + Math.sin(t * 1.5) * 0.15; cM.scale.set(p, p, p); gM.scale.set(p * 1.1, p * 1.1, p * 1.1); cMat.opacity = 0.7 + Math.sin(t * 2) * 0.2; gMat.opacity = 0.1 + Math.sin(t * 1.2) * 0.08; pts.rotation.y += 0.0003; pts.rotation.x += 0.0001; renderer.render(scene, camera); };
    anim();
    const onR = () => { const nw = container.clientWidth, nh = container.clientHeight; camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(frameRef.current); container.removeEventListener("mousemove", mm); container.removeEventListener("touchmove", tm); window.removeEventListener("resize", onR); renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); };
  }, [facetScores, enneagramType]);
  return <div ref={mountRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />;
}

// ═══ PROFILE CARD GENERATOR ═══
function generateProfileHTML(facetScores, enneagramType, enneagramScores, timestamp) {
  const profile = ENNEAGRAM_PROFILES[enneagramType];
  const w1 = enneagramType === 1 ? 9 : enneagramType - 1, w2 = enneagramType === 9 ? 1 : enneagramType + 1;
  const wingType = (enneagramScores[w1] || 0) > (enneagramScores[w2] || 0) ? w1 : w2;
  const sorted = Object.entries(enneagramScores).sort((a, b) => b[1] - a[1]);
  const vector = "E" + enneagramType + "w" + wingType + " :: " + FACETS.map(f => Math.round((facetScores[f.id] || 0) * 9)).join("");
  const dateStr = new Date(timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  let body = "";
  // Type description
  body += '<div style="margin-bottom:24px"><div style="font-size:9px;letter-spacing:3px;color:' + profile.color + ';font-family:DM Mono,monospace;text-transform:uppercase;margin-bottom:8px">Your Type</div><p style="font-size:14px;line-height:1.75;color:#999;font-style:italic">' + profile.desc + '</p></div>';

  // Domain sections with synthesis + facet bars + interpretations
  DOMAINS.forEach((dom, di) => {
    const synthesis = getDomainSynthesis(di, facetScores);
    body += '<div class="glow-line"></div>';
    body += '<div style="margin-bottom:8px"><div style="font-size:11px;letter-spacing:3px;color:' + dom.color + ';font-family:DM Mono,monospace;text-transform:uppercase;margin-bottom:8px">' + dom.name + ' Domain</div>';
    body += '<p style="font-size:13px;line-height:1.7;color:#888;margin-bottom:16px">' + synthesis + '</p>';
    FACETS.filter(f => f.domain === di).forEach(f => {
      const v = Math.round((facetScores[f.id] || 0) * 100);
      const interp = getFacetInterpretation(f, facetScores[f.id] || 0);
      body += '<div style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="width:90px;font-size:10px;color:' + dom.color + ';font-family:DM Mono,monospace;text-align:right;font-weight:600">' + f.short + '</span><div style="flex:1;height:4px;background:#111;border-radius:2px;overflow:hidden"><div style="width:' + v + '%;height:100%;background:linear-gradient(90deg,' + dom.color + '44,' + dom.color + ');border-radius:2px"></div></div><span style="width:28px;font-size:9px;color:#555;font-family:DM Mono,monospace;text-align:right">' + v + '</span></div>';
      body += '<p style="font-size:12px;line-height:1.65;color:#666;margin:0 0 0 96px">' + interp + '</p></div>';
    });
    body += '</div>';
  });

  // Enneagram resonance
  body += '<div class="glow-line"></div><div class="section-title" style="margin-bottom:10px">Enneagram Resonance Map</div>';
  sorted.forEach(([type, score]) => {
    const p = ENNEAGRAM_PROFILES[type]; const isPrimary = parseInt(type) === enneagramType;
    body += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px"><span style="width:14px;font-size:10px;color:' + (isPrimary ? p.color : '#444') + ';font-family:DM Mono,monospace;font-weight:' + (isPrimary ? 600 : 400) + '">' + type + '</span><div style="flex:1;height:3px;background:#111;border-radius:2px;overflow:hidden"><div style="width:' + Math.round(score * 100) + '%;height:100%;background:' + p.color + (isPrimary ? '' : '55') + ';border-radius:2px"></div></div><span style="width:26px;font-size:8px;color:#444;font-family:DM Mono,monospace;text-align:right">' + Math.round(score * 100) + '</span></div>';
  });

  const facetJSON = JSON.stringify(facetScores);
  const facetMeta = JSON.stringify(FACETS.map(f => ({ id: f.id, domain: f.domain })));
  const domainColors = JSON.stringify(DOMAINS.map(d => d.color));

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IRIS \u2014 ' + profile.name + ' ' + enneagramType + 'w' + wingType + '</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#06060e;color:#e0e0e0;font-family:Cormorant Garamond,Georgia,serif}#scene{width:100%;height:55vh;position:relative}#cm{position:absolute;inset:0}#ov{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;display:flex;flex-direction:column}.mono{font-family:DM Mono,monospace}#pn{background:linear-gradient(transparent,rgba(6,6,14,.9) 25%,rgba(6,6,14,.97));padding:32px 20px 20px;pointer-events:auto}.mx{max-width:560px;margin:0 auto;padding:0 12px 40px}.section-title{font-size:9px;letter-spacing:3px;color:#444;font-family:DM Mono,monospace;text-transform:uppercase;text-align:center}.glow-line{height:1px;background:linear-gradient(90deg,transparent,' + profile.color + '33,transparent);margin:24px 0}</style></head><body><div id="scene"><div id="cm"></div><div id="ov"><div style="padding:14px 18px;display:flex;justify-content:space-between"><div><div class="mono" style="font-size:9px;letter-spacing:4px;color:#444;text-transform:uppercase">IRIS Profile</div><div class="mono" style="font-size:8px;color:#333;margin-top:2px">' + dateStr + '</div></div><div class="mono" style="font-size:9px;letter-spacing:3px;color:#444;text-transform:uppercase;text-align:right">Eclipse Ventures<br><span style="color:#333">Yunis AI</span></div></div><div style="flex:1"></div><div id="pn"><div style="text-align:center"><div style="font-size:48px;font-weight:300;color:' + profile.color + ';line-height:1">' + enneagramType + '</div><h1 style="font-size:28px;font-weight:300;color:#fff;margin:4px 0 2px;letter-spacing:3px">' + profile.name + '</h1><div class="mono" style="font-size:11px;color:#555">Wing ' + wingType + ' \u00b7 ' + Math.round((sorted[0]?.[1] || 0) * 100) + '% resonance</div><div class="mono" style="font-size:9px;color:#444;margin-top:8px"><code>' + vector + '</code></div></div></div></div></div><div class="mx">' + body + '<div class="glow-line"></div><div style="text-align:center;padding:16px 0"><div class="mono" style="font-size:8px;color:#222">IRIS v3.2 \u00b7 Eclipse Ventures LLC \u00b7 Yunis AI</div></div></div><script>(function(){var F=' + facetJSON + ',M=' + facetMeta + ',D=' + domainColors + ',T="' + profile.color + '",c=document.getElementById("cm"),w=c.clientWidth,h=c.clientHeight,s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,w/h,.1,1e3);cam.position.set(0,0,5.5);var r=new THREE.WebGLRenderer({antialias:!0,alpha:!0});r.setSize(w,h);r.setPixelRatio(Math.min(devicePixelRatio,2));r.setClearColor(0x06060e,1);c.appendChild(r.domElement);var cc=new THREE.Color(T),cg=(F.analytical+F.pattern+F.abstract+F.pragmatic)/4,em=(F.depth+F.empathy+F.regulation+F.vulnerability)/4,vo=(F.assertion+F.discipline+F.spontaneity+F.patience)/4,rx=.001+vo*.004,ry=.002+cg*.005,rz=.0005+em*.002,g=new THREE.Group;s.add(g);var n=24,ga=Math.PI*(3-Math.sqrt(5)),bR=2,ends=[];for(var i=0;i<n;i++){var y=1-i/(n-1)*2,rY=Math.sqrt(1-y*y),th=ga*i,dir=new THREE.Vector3(Math.cos(th)*rY,y,Math.sin(th)*rY).normalize(),v=F[M[i].id]||0,end=dir.clone().multiplyScalar(.3+v*bR),full=dir.clone().multiplyScalar(bR+.3);ends.push(end);var dc=new THREE.Color(D[M[i].domain]);g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3,full]),new THREE.LineBasicMaterial({color:dc,transparent:!0,opacity:.08})));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3,end]),new THREE.LineBasicMaterial({color:dc,transparent:!0,opacity:.35+v*.4})));var nm=new THREE.Mesh(new THREE.SphereGeometry(.03+v*.03,8,8),new THREE.MeshBasicMaterial({color:dc,transparent:!0,opacity:.7+v*.3}));nm.position.copy(end);g.add(nm)}var iv=[],ic=[];for(i=0;i<n;i++){var nx=(i+1)%n,a=ends[i],b=ends[nx];iv.push(0,0,0,a.x,a.y,a.z,b.x,b.y,b.z);var c1=new THREE.Color(D[M[i].domain]),c2=new THREE.Color(D[M[nx].domain]);ic.push(cc.r,cc.g,cc.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b)}var ig=new THREE.BufferGeometry;ig.setAttribute("position",new THREE.Float32BufferAttribute(iv,3));ig.setAttribute("color",new THREE.Float32BufferAttribute(ic,3));g.add(new THREE.Mesh(ig,new THREE.MeshBasicMaterial({vertexColors:!0,transparent:!0,opacity:.12,side:THREE.DoubleSide})));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ends.concat([ends[0]])),new THREE.LineBasicMaterial({color:cc,transparent:!0,opacity:.3})));for(i=0;i<n;i++)for(var j=i+2;j<n;j++)if((j-i)%4==0||(j-i)%6==0)g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([ends[i],ends[j]]),new THREE.LineBasicMaterial({color:cc,transparent:!0,opacity:.04})));[new THREE.Euler(Math.PI/2,0,0),new THREE.Euler(0,0,Math.PI/6),new THREE.Euler(Math.PI/4,Math.PI/4,0)].forEach(function(t,i){var ring=new THREE.Mesh(new THREE.RingGeometry(bR*.95,bR*.97,64),new THREE.MeshBasicMaterial({color:[0xffa94d,0xff6b8a,0x7eb5ff][i],transparent:!0,opacity:.06,side:THREE.DoubleSide}));ring.rotation.copy(t);g.add(ring)});var cMat=new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.9}),cM=new THREE.Mesh(new THREE.SphereGeometry(.12,32,32),cMat);g.add(cM);var gMat=new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.15}),gM=new THREE.Mesh(new THREE.SphereGeometry(.25,32,32),gMat);g.add(gM);g.add(new THREE.Mesh(new THREE.SphereGeometry(.5,32,32),new THREE.MeshBasicMaterial({color:cc,transparent:!0,opacity:.04})));var pc=500,pp=new Float32Array(pc*3),pcc2=new Float32Array(pc*3);for(i=0;i<pc;i++){var pr=2+Math.random()*4,pt=Math.random()*Math.PI*2,pphi=Math.acos(2*Math.random()-1);pp[i*3]=pr*Math.sin(pphi)*Math.cos(pt);pp[i*3+1]=pr*Math.sin(pphi)*Math.sin(pt);pp[i*3+2]=pr*Math.cos(pphi);var dcc=new THREE.Color(D[Math.floor(Math.random()*6)]);pcc2[i*3]=dcc.r;pcc2[i*3+1]=dcc.g;pcc2[i*3+2]=dcc.b}var pg=new THREE.BufferGeometry;pg.setAttribute("position",new THREE.Float32BufferAttribute(pp,3));pg.setAttribute("color",new THREE.Float32BufferAttribute(pcc2,3));var pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.015,vertexColors:!0,transparent:!0,opacity:.4}));s.add(pts);var mx=0,my=0;c.addEventListener("mousemove",function(e){var rt=c.getBoundingClientRect();mx=((e.clientX-rt.left)/w-.5)*2;my=((e.clientY-rt.top)/h-.5)*2});c.addEventListener("touchmove",function(e){if(e.touches.length){var rt=c.getBoundingClientRect();mx=((e.touches[0].clientX-rt.left)/w-.5)*2;my=((e.touches[0].clientY-rt.top)/h-.5)*2}},{passive:!0});var t=0;!function animate(){requestAnimationFrame(animate);t+=.016;g.rotation.x+=rx+my*.003;g.rotation.y+=ry+mx*.003;g.rotation.z+=rz;var p=1+Math.sin(t*1.5)*.15;cM.scale.set(p,p,p);gM.scale.set(p*1.1,p*1.1,p*1.1);cMat.opacity=.7+Math.sin(t*2)*.2;gMat.opacity=.1+Math.sin(t*1.2)*.08;pts.rotation.y+=3e-4;pts.rotation.x+=1e-4;r.render(s,cam)}();window.addEventListener("resize",function(){var nw=c.clientWidth,nh=c.clientHeight;cam.aspect=nw/nh;cam.updateProjectionMatrix();r.setSize(nw,nh)})})()<\/script></body></html>';
}

// ═══ MAIN APP ═══
export default function IRISApp() {
  const [phase, setPhase] = useState("landing");
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
    allAnswers.forEach(a => { Object.entries(a.scores).forEach(([k, v]) => { if (totals[k] !== undefined) { totals[k] += v; counts[k] += 1; } }); });
    const avg = {}; FACETS.forEach(f => { avg[f.id] = counts[f.id] ? totals[f.id] / counts[f.id] : 0; });
    setFacetScores(avg);
    const ts = {};
    Object.entries(ENNEAGRAM_PROFILES).forEach(([t, p]) => { let d = 0, c = 0; FACETS.forEach(f => { d += Math.pow((p.facets[f.id] || 0) - (avg[f.id] || 0), 2); c++; }); ts[t] = 1 - Math.sqrt(d / c); });
    setEnneagramScores(ts);
    setEnneagramType(parseInt(Object.entries(ts).sort((a, b) => b[1] - a[1])[0][0]));
    setTimestamp(new Date().toISOString());
  };

  const handleChoice = choice => {
    setSelectedChoice(choice);
    setTimeout(() => { const na = [...answers, choice]; setAnswers(na); if (qIdx < SCENARIOS.length - 1) transition(() => { setQIdx(qIdx + 1); setSelectedChoice(null); }); else { calculateResults(na); transition(() => { setPhase("results"); setSelectedChoice(null); }); } }, 500);
  };

  const downloadProfile = () => {
    const html = generateProfileHTML(facetScores, enneagramType, enneagramScores, timestamp);
    const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "iris-" + ENNEAGRAM_PROFILES[enneagramType].name.replace("The ", "").toLowerCase() + "-" + enneagramType + ".html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const restart = () => transition(() => { setPhase("landing"); setQIdx(0); setAnswers([]); setShowDetails(false); const s = {}; FACETS.forEach(f => { s[f.id] = 0; }); setFacetScores(s); setEnneagramType(null); setEnneagramScores({}); });

  const fonts = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />;
  const wrap = { height: "100vh", background: "#06060e", color: "#e0e0e0", fontFamily: "'Cormorant Garamond', Georgia, serif", opacity: fadeIn ? 1 : 0, transition: "opacity 0.35s ease", display: "flex", flexDirection: "column", overflow: "hidden" };
  const mono = { fontFamily: "'DM Mono', monospace" };

  // ── LANDING ──
  if (phase === "landing") {
    const demo = {}; FACETS.forEach((f, i) => { demo[f.id] = 0.2 + Math.sin(i * 0.7) * 0.3 + 0.3; });
    return (<div style={{ ...wrap, overflow: "auto" }}>{fonts}
      <div style={{ flex: "0 0 55vh", position: "relative" }}><IrisScene facetScores={demo} enneagramType={null} /><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, #06060e)", pointerEvents: "none" }} /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 300, margin: "0 0 4px", letterSpacing: 8, color: "#fff" }}>IRIS</h1>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", ...mono, textTransform: "uppercase", marginBottom: 16 }}>Integrative Resonance Identity Simulation</div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "#666", fontStyle: "italic", maxWidth: 360, margin: "0 auto 24px" }}>24 facets of consciousness. 16 crucible scenarios. A living 3D artifact of who you are today — with personalized insights for every dimension of your psyche.</p>
        <button onClick={() => transition(() => setPhase("assess"))} style={{ background: "transparent", border: "1px solid #fff3", color: "#fff", padding: "14px 44px", fontSize: 13, letterSpacing: 4, cursor: "pointer", ...mono, textTransform: "uppercase", borderRadius: 2 }} onMouseEnter={e => e.target.style.background = "#fff1"} onMouseLeave={e => e.target.style.background = "transparent"}>Begin</button>
      </div>
    </div>);
  }

  // ── ASSESSMENT ──
  if (phase === "assess") {
    const sc = SCENARIOS[qIdx], pct = ((qIdx + 1) / SCENARIOS.length) * 100;
    return (<div style={{ ...wrap, overflow: "auto", alignItems: "center", padding: "20px 16px" }}>{fonts}
      <div style={{ maxWidth: 520, width: "100%", marginTop: "2vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 2, background: "#1a1a2e", borderRadius: 1, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,#7eb5ff,#ff6b8a,#ffa94d)", transition: "width .5s" }} /></div>
          <span style={{ fontSize: 10, color: "#444", ...mono }}>{qIdx + 1}/{SCENARIOS.length}</span>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#555", ...mono, textTransform: "uppercase", marginBottom: 14 }}>{sc.phase}</div>
        <h2 style={{ fontSize: 21, fontWeight: 300, lineHeight: 1.65, color: "#ccc", marginBottom: 28, fontStyle: "italic" }}>{sc.prompt}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sc.choices.map((ch, i) => { const sel = selectedChoice === ch; return (
            <button key={i} onClick={() => !selectedChoice && handleChoice(ch)} disabled={!!selectedChoice} style={{ background: sel ? "#fff1" : "transparent", border: "1px solid " + (sel ? "#fff4" : "#ffffff10"), color: sel ? "#fff" : "#999", padding: "14px 18px", fontSize: 14, lineHeight: 1.5, cursor: selectedChoice ? "default" : "pointer", fontFamily: "'Cormorant Garamond',Georgia,serif", textAlign: "left", borderRadius: 4, transition: "all .3s", opacity: selectedChoice && !sel ? 0.2 : 1 }} onMouseEnter={e => { if (!selectedChoice) { e.target.style.borderColor = "#fff3"; e.target.style.color = "#ddd"; }}} onMouseLeave={e => { if (!selectedChoice) { e.target.style.borderColor = "#ffffff10"; e.target.style.color = "#999"; }}}>{ch.text}</button>); })}
        </div>
      </div>
    </div>);
  }

  // ── RESULTS ──
  if (phase === "results") {
    const profile = enneagramType ? ENNEAGRAM_PROFILES[enneagramType] : null;
    const sorted = Object.entries(enneagramScores).sort((a, b) => b[1] - a[1]);
    const w1 = enneagramType === 1 ? 9 : enneagramType - 1, w2 = enneagramType === 9 ? 1 : enneagramType + 1;
    const wingType = (enneagramScores[w1] || 0) > (enneagramScores[w2] || 0) ? w1 : w2;
    const btn = { background: "transparent", border: "1px solid #fff1", color: "#666", padding: "8px 20px", fontSize: 10, letterSpacing: 3, cursor: "pointer", ...mono, textTransform: "uppercase", borderRadius: 2 };

    return (<div style={{ ...wrap }}>{fonts}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}><IrisScene facetScores={facetScores} enneagramType={enneagramType} /></div>
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", pointerEvents: "none" }}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 9, letterSpacing: 4, color: "#444", ...mono, textTransform: "uppercase" }}>IRIS · Live</div><div style={{ fontSize: 8, color: "#333", ...mono, marginTop: 2 }}>{timestamp ? new Date(timestamp).toLocaleString() : ""}</div></div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", ...mono, textTransform: "uppercase", textAlign: "right" }}>Eclipse Ventures</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ background: "linear-gradient(transparent,rgba(6,6,14,.85) 30%,rgba(6,6,14,.95))", padding: "40px 20px 24px", pointerEvents: "auto" }}>
          {profile && <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 42, fontWeight: 300, color: profile.color, lineHeight: 1 }}>{enneagramType}</div>
            <h2 style={{ fontSize: 26, fontWeight: 300, color: "#fff", margin: "4px 0 2px", letterSpacing: 3 }}>{profile.name}</h2>
            <div style={{ fontSize: 11, color: "#555", ...mono }}>Wing {wingType} · {Math.round((sorted[0]?.[1] || 0) * 100)}% resonance</div>
          </div>}
          <div style={{ textAlign: "center", margin: "12px 0", ...mono }}><code style={{ color: "#555", fontSize: 9 }}>E{enneagramType}w{wingType} :: {FACETS.map(f => Math.round((facetScores[f.id] || 0) * 9)).join("")}</code></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowDetails(!showDetails)} style={btn}>{showDetails ? "Hide Profile" : "Full Profile"}</button>
            <button onClick={downloadProfile} style={{ ...btn, background: profile ? profile.color + "12" : "#fff1", borderColor: profile ? profile.color + "35" : "#fff2", color: profile ? profile.color : "#888" }} onMouseEnter={e => e.target.style.background = profile ? profile.color + "25" : "#fff2"} onMouseLeave={e => e.target.style.background = profile ? profile.color + "12" : "#fff1"}>Download Card</button>
          </div>
          {showDetails && <div style={{ maxHeight: "45vh", overflowY: "auto", paddingTop: 12 }}>
            {/* Type Description */}
            {profile && <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: profile.color, ...mono, textTransform: "uppercase", marginBottom: 6 }}>Your Type</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#888", fontStyle: "italic" }}>{profile.desc}</p>
            </div>}

            {/* Domains with synthesis + facet interpretations */}
            {DOMAINS.map((dom, di) => {
              const df = FACETS.filter(f => f.domain === di);
              const synthesis = getDomainSynthesis(di, facetScores);
              return (<div key={dom.name} style={{ marginBottom: 20 }}>
                <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${dom.color}33,transparent)`, margin: "8px 0 12px" }} />
                <div style={{ fontSize: 10, letterSpacing: 3, color: dom.color, ...mono, textTransform: "uppercase", marginBottom: 6 }}>{dom.name} Domain</div>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: "#777", marginBottom: 12 }}>{synthesis}</p>
                {df.map(f => {
                  const val = facetScores[f.id] || 0;
                  const interp = getFacetInterpretation(f, val);
                  return (<div key={f.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 80, fontSize: 9, color: dom.color, ...mono, textAlign: "right", fontWeight: 600 }}>{f.short}</span>
                      <div style={{ flex: 1, height: 4, background: "#111", borderRadius: 2, overflow: "hidden" }}><div style={{ width: val * 100 + "%", height: "100%", background: `linear-gradient(90deg,${dom.color}44,${dom.color})`, borderRadius: 2 }} /></div>
                      <span style={{ width: 24, fontSize: 9, color: "#555", ...mono, textAlign: "right" }}>{Math.round(val * 100)}</span>
                    </div>
                    <p style={{ fontSize: 11, lineHeight: 1.6, color: "#666", marginLeft: 86 }}>{interp}</p>
                  </div>);
                })}
              </div>);
            })}

            {/* Enneagram Map */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", ...mono, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Enneagram Resonance</div>
              {sorted.map(([type, score]) => { const p = ENNEAGRAM_PROFILES[type]; const isPrimary = parseInt(type) === enneagramType; return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 14, fontSize: 10, color: isPrimary ? p.color : "#444", ...mono, fontWeight: isPrimary ? 600 : 400 }}>{type}</span>
                  <div style={{ flex: 1, height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}><div style={{ width: score * 100 + "%", height: "100%", background: p.color + (isPrimary ? "" : "55"), borderRadius: 2 }} /></div>
                  <span style={{ width: 26, fontSize: 8, color: "#444", ...mono, textAlign: "right" }}>{Math.round(score * 100)}</span>
                </div>); })}
            </div>
          </div>}
          <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={restart} style={{ background: "transparent", border: "none", color: "#333", fontSize: 10, cursor: "pointer", ...mono, letterSpacing: 2, textTransform: "uppercase" }}>Re-Simulate</button></div>
          <div style={{ textAlign: "center", fontSize: 8, color: "#1a1a2a", ...mono, marginTop: 8 }}>IRIS v3.2 · Eclipse Ventures LLC · Yunis AI</div>
        </div>
      </div>
    </div>);
  }
  return null;
}
