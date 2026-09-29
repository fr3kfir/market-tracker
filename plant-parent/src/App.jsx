import { useEffect, useRef, useState } from 'react'
import Result from './components/Result.jsx'
import { prepareImage } from './lib/image.js'
import { loadGarden, saveGarden, waterStatus } from './lib/storage.js'

const MAX_PHOTOS = 3

export default function App() {
  const [tab, setTab] = useState('scan')
  const [garden, setGarden] = useState(loadGarden)
  const [openPlantId, setOpenPlantId] = useState(null)

  useEffect(() => { saveGarden(garden) }, [garden])

  const addToGarden = (entry) => {
    setGarden((g) => [entry, ...g])
    setTab('garden')
  }
  const updatePlant = (id, patch) =>
    setGarden((g) => g.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const removePlant = (id) => {
    setGarden((g) => g.filter((p) => p.id !== id))
    setOpenPlantId(null)
  }

  const openPlant = garden.find((p) => p.id === openPlantId)

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">🌿 הורה לצמח</span>
      </header>

      <main className="content">
        {tab === 'scan' && <Scan onSave={addToGarden} />}
        {tab === 'garden' && !openPlant && (
          <Garden plants={garden} onOpen={setOpenPlantId} onWater={(id) => updatePlant(id, { lastWatered: new Date().toISOString() })} onScan={() => setTab('scan')} />
        )}
        {tab === 'garden' && openPlant && (
          <PlantDetail
            plant={openPlant}
            onBack={() => setOpenPlantId(null)}
            onUpdate={(patch) => updatePlant(openPlant.id, patch)}
            onRemove={() => removePlant(openPlant.id)}
          />
        )}
      </main>

      <nav className="tabbar">
        <button className={tab === 'scan' ? 'active' : ''} onClick={() => setTab('scan')}>
          <span>📷</span>סריקה
        </button>
        <button className={tab === 'garden' ? 'active' : ''} onClick={() => { setTab('garden'); setOpenPlantId(null) }}>
          <span>🪴</span>הצמחים שלי{garden.length > 0 && ` (${garden.length})`}
        </button>
      </nav>
    </div>
  )
}

function Scan({ onSave }) {
  const [photos, setPhotos] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const addFiles = async (fileList) => {
    setError('')
    const files = Array.from(fileList || []).slice(0, MAX_PHOTOS - photos.length)
    try {
      const prepared = await Promise.all(files.map(prepareImage))
      setPhotos((p) => [...p, ...prepared].slice(0, MAX_PHOTOS))
    } catch (e) {
      setError(e.message)
    }
  }

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: photos.map((p) => p.payload), note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'הניתוח נכשל, נסו שוב')
      setResult(data.result)
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'אין חיבור לשרת' : e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setPhotos([]); setNote(''); setResult(null); setError('') }

  if (result) {
    return (
      <Result
        result={result}
        image={photos[0]?.preview}
        actions={
          <div className="actions">
            {result.is_plant && (
              <button className="btn primary" onClick={() => {
                onSave({
                  id: crypto.randomUUID(),
                  nickname: '',
                  thumb: photos[0]?.thumb,
                  result,
                  wateringIntervalDays: result.care.watering_interval_days || 7,
                  lastWatered: null,
                  addedAt: new Date().toISOString(),
                })
                reset()
              }}>➕ שמירה לצמחים שלי</button>
            )}
            <button className="btn" onClick={reset}>סריקה חדשה</button>
          </div>
        }
      />
    )
  }

  return (
    <div className="scan">
      <div className="card intro">
        <h1>מה קורה עם הצמח שלך?</h1>
        <p className="muted">צלמו את הצמח ותקבלו זיהוי, אבחון בעיות ותנאי גידול מלאים.</p>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />

      {photos.length === 0 ? (
        <div className="pick">
          <button className="btn primary big" onClick={() => cameraRef.current.click()}>📷 צילום צמח</button>
          <button className="btn" onClick={() => galleryRef.current.click()}>🖼️ בחירה מהגלריה</button>
        </div>
      ) : (
        <>
          <div className="photos">
            {photos.map((p, i) => (
              <div key={i} className="photo">
                <img src={p.preview} alt="" />
                {!loading && <button className="remove" aria-label="הסרה" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}>✕</button>}
              </div>
            ))}
            {photos.length < MAX_PHOTOS && !loading && (
              <button className="photo add" onClick={() => cameraRef.current.click()}>＋<small>עוד זווית</small></button>
            )}
          </div>
          <p className="muted small">טיפ: צלמו גם את העלים מקרוב וגם את כל הצמח — כך האבחון מדויק יותר.</p>
          <textarea
            placeholder="משהו שכדאי לדעת? למשל: העלים מצהיבים כבר שבוע, משקה פעם בשבוע, עומד ליד חלון מערבי"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <button className="btn primary big" onClick={analyze} disabled={loading}>
            {loading ? <><span className="spinner" /> מנתח את הצמח...</> : '🔍 זיהוי ואבחון'}
          </button>
          {!loading && <button className="btn ghost" onClick={reset}>ביטול</button>}
        </>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  )
}

function Garden({ plants, onOpen, onWater, onScan }) {
  if (plants.length === 0) {
    return (
      <div className="card center">
        <div className="big-emoji">🪴</div>
        <h2>עוד אין כאן צמחים</h2>
        <p className="muted">סרקו צמח ושמרו אותו כדי לעקוב אחרי השקיה וטיפול.</p>
        <button className="btn primary" onClick={onScan}>📷 סריקת צמח ראשון</button>
      </div>
    )
  }
  const sorted = [...plants].sort((a, b) => (waterStatus(a).daysLeft ?? 999) - (waterStatus(b).daysLeft ?? 999))
  return (
    <div className="garden">
      {sorted.map((p) => {
        const ws = waterStatus(p)
        return (
          <div key={p.id} className="plant-row card" onClick={() => onOpen(p.id)}>
            {p.thumb ? <img src={p.thumb} alt="" /> : <div className="noimg">🌿</div>}
            <div className="plant-info">
              <b>{p.nickname || p.result.plant.common_name_he}</b>
              <span className="muted small"><i>{p.result.plant.scientific_name}</i></span>
              <span className={`water tone-${ws.tone}`}>💧 {ws.label}</span>
            </div>
            <button className="btn small" onClick={(e) => { e.stopPropagation(); onWater(p.id) }}>השקיתי</button>
          </div>
        )
      })}
    </div>
  )
}

function PlantDetail({ plant, onBack, onUpdate, onRemove }) {
  const ws = waterStatus(plant)
  return (
    <div>
      <button className="btn ghost back" onClick={onBack}>→ חזרה לצמחים שלי</button>
      <div className="card settings">
        <label>
          כינוי
          <input value={plant.nickname} placeholder={plant.result.plant.common_name_he} onChange={(e) => onUpdate({ nickname: e.target.value })} />
        </label>
        <label>
          להשקות כל
          <span className="inline">
            <input type="number" min="1" max="60" value={plant.wateringIntervalDays} onChange={(e) => onUpdate({ wateringIntervalDays: Math.max(1, Number(e.target.value) || 1) })} />
            ימים
          </span>
        </label>
        <div className={`water tone-${ws.tone}`}>💧 {ws.label}</div>
        <button className="btn primary" onClick={() => onUpdate({ lastWatered: new Date().toISOString() })}>השקיתי עכשיו</button>
      </div>
      <Result
        result={plant.result}
        image={plant.thumb}
        actions={
          <div className="actions">
            <button className="btn danger" onClick={() => { if (confirm('למחוק את הצמח?')) onRemove() }}>🗑️ מחיקת הצמח</button>
          </div>
        }
      />
    </div>
  )
}
