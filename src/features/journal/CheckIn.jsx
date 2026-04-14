// ─────────────────────────────────────────────────────────────
// CheckIn — the 3-step daily capture flow.
//   1. Mood    (emoji scale)
//   2. Lenses  (activity tags)
//   3. Note    (optional text, with kind picker)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../../components/Screen.jsx';
import Button from '../../components/Button.jsx';
import Emoji from '../../components/Emoji.jsx';
import MoodPicker from '../../components/MoodPicker.jsx';
import ActivityPicker from '../../components/ActivityPicker.jsx';
import Card from '../../components/Card.jsx';
import { VesicaPiscis } from '../../components/SacredGeometry.jsx';
import { NOTE_KINDS } from '../../data/notekinds.js';
import { moodById } from '../../data/moods.js';
import { useStore, selectTodayEntry } from '../../lib/store.js';

const STEPS = ['mood', 'activities', 'note'];

export default function CheckIn() {
  const navigate = useNavigate();
  const today = useStore(selectTodayEntry);
  const upsertEntry = useStore((s) => s.upsertEntry);

  const [step, setStep] = useState(0);
  const [moodId, setMoodId] = useState(today ? moodById(today.mood)?.id : null);
  const [activities, setActivities] = useState(today?.activities || []);
  const [noteKind, setNoteKind] = useState('reflection');
  const [noteText, setNoteText] = useState('');

  const mood = moodId ? moodById(moodId) : null;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => (step === 0 ? navigate(-1) : setStep((s) => s - 1));

  const complete = () => {
    upsertEntry({
      mood: mood?.score ?? 0.5,
      activities,
      note: noteText.trim()
        ? { kind: noteKind, text: noteText.trim() }
        : null,
    });
    navigate('/');
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Screen
      label={`Step ${step + 1} of ${STEPS.length}`}
      title={
        step === 0 ? 'How did it land?' : step === 1 ? 'What lit today up?' : 'Anything to catalog?'
      }
      glyph={<VesicaPiscis size={40} color="#ffd166" opacity={0.45} spin={200} strokeWidth={0.55} />}
      subtitle={
        step === 0
          ? 'Pick the closest — you can change it.'
          : step === 1
            ? 'Tap everything that applied. None is fine.'
            : 'Optional. A sentence is enough.'
      }
      action={
        <button
          onClick={back}
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ink-dim)',
            textTransform: 'uppercase',
          }}
        >
          Back
        </button>
      }
    >
      {/* progress */}
      <div
        style={{
          height: 2,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 1,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #7eb5ff, #ff6b8a, #ffd166)',
            transition: 'width 400ms cubic-bezier(.2,1,.3,1)',
          }}
        />
      </div>

      {step === 0 && <MoodPicker value={moodId} onChange={setMoodId} />}

      {step === 1 && (
        <ActivityPicker selected={activities} onChange={setActivities} />
      )}

      {step === 2 && (
        <div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 12,
              marginBottom: 16,
            }}
          >
            {NOTE_KINDS.map((k) => {
              const on = noteKind === k.id;
              return (
                <button
                  key={k.id}
                  onClick={() => setNoteKind(k.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 999,
                    flexShrink: 0,
                    border: `1px solid ${on ? k.color + '66' : 'var(--border)'}`,
                    background: on ? `${k.color}15` : 'transparent',
                    color: on ? k.color : 'var(--ink-soft)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  <Emoji code={k.emoji} size={16} />
                  {k.label}
                </button>
              );
            })}
          </div>
          <Card padding={0} accent={NOTE_KINDS.find((k) => k.id === noteKind)?.color}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={NOTE_KINDS.find((k) => k.id === noteKind)?.prompt || 'What happened?'}
              rows={8}
              style={{
                width: '100%',
                minHeight: 160,
                padding: 20,
                background: 'transparent',
                color: 'var(--ink)',
                fontSize: 17,
                lineHeight: 1.6,
                fontFamily: 'var(--serif)',
                resize: 'vertical',
                border: 'none',
                outline: 'none',
              }}
            />
          </Card>
          <div
            className="mono"
            style={{
              marginTop: 10,
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--ink-faint)',
              textAlign: 'right',
            }}
          >
            {noteText.length} chars
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {step < STEPS.length - 1 ? (
          <Button
            variant="solid"
            tone={mood?.color || '#ffd166'}
            onClick={next}
            disabled={step === 0 && !moodId}
          >
            Continue →
          </Button>
        ) : (
          <Button variant="solid" tone="#ffd166" onClick={complete}>
            Save check-in
          </Button>
        )}
      </div>
    </Screen>
  );
}
