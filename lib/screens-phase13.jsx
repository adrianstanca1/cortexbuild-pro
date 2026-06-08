// Cortexx — Phase 13: Photo annotation viewer for snags

function PhotoAnnotateSheet({ snag, onClose, accent }) {
  const photoSrc = snag?.photo || snag?.data || snag?.image || null;
  const [pins, setPins] = React.useState(Array.isArray(snag?.pins) ? snag.pins : []);
  const [adding, setAdding] = React.useState(false);
  const [activePin, setActivePin] = React.useState(null);
  const [pinNote, setPinNote] = React.useState('');

  // Persist annotations back onto the snag record whenever they change
  const persistPins = (next) => {
    setPins(next);
    if (snag?.id && window.Backend?.db?.snags) {
      Backend.db.snags.update(snag.id, { pins: next }).catch(() => {});
    }
  };

  const handleClick = (e) => {
    if (!adding || !photoSrc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newPin = { id: pins.length + 1, x, y, note: 'New annotation' };
    setPins([...pins, newPin]);
    setActivePin(newPin.id);
    setPinNote('');
    setAdding(false);
  };

  const savePin = () => {
    persistPins(pins.map(p => p.id === activePin ? { ...p, note: pinNote || 'Annotation' } : p));
    setActivePin(null);
    setPinNote('');
    toast('Annotation saved', 'success');
  };

  const deletePin = (id) => {
    persistPins(pins.filter(p => p.id !== id));
    setActivePin(null);
    toast('Annotation removed', 'info');
  };

  return (
    <Sheet onClose={onClose} fullscreen>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `0.5px solid ${T.hair}` }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: accent, fontFamily: SF, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
          {Ic.chevL} <span>Back</span>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: T.t1 }}>{snag?.title || 'Photo'}</div>
          <div style={{ fontFamily: SFMono, fontSize: 10, color: T.t3, marginTop: 1 }}>{pins.length} annotation{pins.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => toast('Photo shared', 'success')} style={{ background: 'none', border: 'none', color: accent, fontFamily: SF, fontSize: 14, cursor: 'pointer' }}>Share</button>
      </div>

      {/* Photo canvas */}
      <div style={{ flex: 1, background: '#0a0e16', position: 'relative', overflow: 'hidden' }}>
        <div onClick={handleClick} style={{
          width: '100%', height: '100%',
          cursor: adding && photoSrc ? 'crosshair' : 'default',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: photoSrc ? '#000' : 'linear-gradient(160deg, #0d1420, #11192a)',
        }}>
          {photoSrc ? (
            <img src={photoSrc} alt={snag?.title || 'Site photo'} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}/>
          ) : (
            /* Honest empty state — no fake drawn room */
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px', background: T.bg2, border: `0.5px solid ${T.hairMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.t3 }}>
                {React.cloneElement(Ic.camera, { size: 28 })}
              </div>
              <div style={{ fontFamily: SF, fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 6 }}>No photo attached</div>
              <div style={{ fontFamily: SF, fontSize: 12.5, color: T.t3, lineHeight: 1.5, maxWidth: 240 }}>Capture or upload a site photo for this item, then tap pins to annotate defects.</div>
            </div>
          )}

          {/* Pins */}
          {pins.map((p, i) => (
            <div key={p.id} style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'pointer',
            }} onClick={(e) => { e.stopPropagation(); setActivePin(p.id); setPinNote(p.note); }}>
              {/* Pin shape */}
              <svg width="32" height="42" viewBox="0 0 32 42" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
                <path d="M16 0 C7 0 0 7 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7 25 0 16 0 Z" fill={T.amber}/>
                <circle cx="16" cy="16" r="9" fill="#fff"/>
                <text x="16" y="20" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={SF} fill={T.bg0}>{i + 1}</text>
              </svg>
            </div>
          ))}

          {/* Active pin tooltip */}
          {activePin && (
            <div style={{
              position: 'absolute', bottom: 90, left: 16, right: 16,
              background: 'rgba(6,16,30,0.95)', backdropFilter: 'blur(20px)',
              border: `0.5px solid ${T.amber}66`, borderRadius: 14, padding: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: T.amber, color: T.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SF, fontSize: 12, fontWeight: 700 }}>
                  {pins.findIndex(p => p.id === activePin) + 1}
                </div>
                <span style={{ fontFamily: SF, fontSize: 11, color: T.amber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Annotation</span>
                <div style={{ flex: 1 }}/>
                <button onClick={() => deletePin(activePin)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontFamily: SF, fontSize: 11, fontWeight: 600 }}>Remove</button>
              </div>
              <input value={pinNote} onChange={e => setPinNote(e.target.value)} autoFocus
                placeholder="Note (e.g. 'Touch up paint here')"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: T.bg2, border: `0.5px solid ${T.hairMid}`, borderRadius: 8,
                  padding: '8px 10px', color: T.t1, fontFamily: SF, fontSize: 13, outline: 'none',
                }}/>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={savePin} style={{
                  flex: 1, background: T.green, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px', fontFamily: SF, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Save</button>
                <button onClick={() => setActivePin(null)} style={{
                  background: 'transparent', color: T.t2, border: `0.5px solid ${T.hairMid}`,
                  borderRadius: 8, padding: '8px 14px', fontFamily: SF, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Done</button>
              </div>
            </div>
          )}

          {/* Adding mode banner */}
          {adding && (
            <div style={{
              position: 'absolute', top: 16, left: 16, right: 16,
              background: `${T.amber}22`, border: `0.5px solid ${T.amber}66`,
              borderRadius: 10, padding: '8px 12px',
              fontFamily: SF, fontSize: 12, color: T.t1, textAlign: 'center', fontWeight: 600,
            }}>
              Tap the photo to drop a pin
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '10px 12px 30px', borderTop: `0.5px solid ${T.hair}`, display: 'flex', gap: 8, background: T.bg0 }}>
        <button onClick={() => photoSrc && setAdding(!adding)} disabled={!photoSrc} style={{
          flex: 1, background: adding ? T.amber : T.bg2,
          color: adding ? T.bg0 : (photoSrc ? T.t1 : T.t3),
          border: adding ? 'none' : `0.5px solid ${T.hairMid}`,
          borderRadius: 12, padding: '12px',
          fontFamily: SF, fontSize: 14, fontWeight: 700, cursor: photoSrc ? 'pointer' : 'not-allowed',
          opacity: photoSrc ? 1 : 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>{React.cloneElement(Ic.pin, { size: 14 })} {adding ? 'Cancel' : 'Add pin'}</button>
        <button onClick={() => { persistPins([]); toast('Cleared', 'info'); }} disabled={!pins.length} style={{
          background: 'transparent', color: pins.length ? T.t2 : T.t3, border: `0.5px solid ${T.hairMid}`,
          borderRadius: 12, padding: '12px 14px',
          fontFamily: SF, fontSize: 13, fontWeight: 600, cursor: pins.length ? 'pointer' : 'not-allowed', opacity: pins.length ? 1 : 0.5,
        }}>Clear</button>
        <button onClick={async () => {
          await Backend.db.activity.create({ who: 'You', what: `annotated photo with ${pins.length} pins`, where: snag?.area || 'Site', when: new Date().toISOString().slice(0,16), icon: 'camera', color: '#8b5cf6' });
          toast(`Saved ${pins.length} annotation${pins.length !== 1 ? 's' : ''}`, 'success');
          onClose();
        }} style={{
          background: accent, color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 16px', fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>Done</button>
      </div>
    </Sheet>
  );
}

Object.assign(window, { PhotoAnnotateSheet });
