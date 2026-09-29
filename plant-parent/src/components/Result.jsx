const CONFIDENCE = { high: 'זיהוי בטוח', medium: 'זיהוי סביר', low: 'זיהוי לא ודאי' }
const HEALTH = {
  healthy: { label: 'הצמח בריא', tone: 'ok', icon: '🌿' },
  minor_issues: { label: 'בעיות קלות', tone: 'warn', icon: '🌱' },
  needs_attention: { label: 'דורש טיפול', tone: 'bad', icon: '🩺' },
  critical: { label: 'מצב קריטי', tone: 'bad', icon: '🚨' },
}
const SEVERITY = { low: 'קל', medium: 'בינוני', high: 'חמור' }
const DIFFICULTY = { easy: 'קל לגידול', moderate: 'בינוני', hard: 'מאתגר' }
const PLACEMENT = { indoor: 'צמח בית', outdoor: 'צמח חוץ', both: 'בית וחוץ' }

const CARE_ITEMS = [
  ['light', '☀️', 'אור'],
  ['water', '💧', 'השקיה'],
  ['humidity', '💨', 'לחות'],
  ['temperature', '🌡️', 'טמפרטורה'],
  ['soil', '🪴', 'אדמה'],
  ['fertilizer', '🧪', 'דישון'],
  ['repotting', '🔄', 'העברת עציץ'],
  ['pruning', '✂️', 'גיזום'],
  ['propagation', '🌱', 'ריבוי'],
]

export default function Result({ result, image, actions }) {
  if (!result.is_plant) {
    return (
      <div className="card center">
        <div className="big-emoji">🤔</div>
        <h2>לא זוהה צמח בתמונה</h2>
        <p className="muted">נסו לצלם שוב כשהצמח ממלא את רוב המסגרת, באור טוב.</p>
        {actions}
      </div>
    )
  }

  const { plant, health, care, toxicity, tips } = result
  const h = HEALTH[health.status] || HEALTH.minor_issues

  return (
    <div className="result">
      <div className="hero card">
        {image && <img src={image} alt={plant.common_name_he} className="hero-img" />}
        <div className="hero-body">
          <h2>{plant.common_name_he}</h2>
          <div className="latin">
            <i>{plant.scientific_name}</i>
            {plant.common_name_en && <span> · {plant.common_name_en}</span>}
          </div>
          <div className="chips">
            <span className={`chip conf-${plant.confidence}`}>{CONFIDENCE[plant.confidence]}</span>
            {plant.family && <span className="chip">משפחה: {plant.family}</span>}
            <span className="chip">{DIFFICULTY[care.difficulty]}</span>
            <span className="chip">{PLACEMENT[care.placement]}</span>
          </div>
          <p>{plant.description}</p>
          {plant.alternatives?.length > 0 && (
            <p className="muted small">אולי גם: {plant.alternatives.join(' · ')}</p>
          )}
        </div>
      </div>

      <div className={`card health tone-${h.tone}`}>
        <h3>{h.icon} {h.label}</h3>
        <p>{health.summary}</p>
        {health.problems.map((p, i) => (
          <details key={i} className="problem" open={i === 0}>
            <summary>
              <span>{p.name}</span>
              <span className={`sev sev-${p.severity}`}>{SEVERITY[p.severity]}</span>
            </summary>
            <p><b>סימנים:</b> {p.symptoms}</p>
            <p><b>גורם:</b> {p.cause}</p>
            <b>טיפול:</b>
            <ol>{p.treatment.map((t, j) => <li key={j}>{t}</li>)}</ol>
          </details>
        ))}
      </div>

      <div className="card">
        <h3>תנאי גידול</h3>
        <div className="care-grid">
          {CARE_ITEMS.map(([key, icon, label]) => care[key] && (
            <div key={key} className="care-item">
              <div className="care-label">{icon} {label}</div>
              <div>{care[key]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>⚠️ רעילות</h3>
        <p><b>לחיות מחמד:</b> {toxicity.pets}</p>
        <p><b>לבני אדם:</b> {toxicity.humans}</p>
      </div>

      {tips.length > 0 && (
        <div className="card">
          <h3>💡 טיפים</h3>
          <ul>{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}

      {actions}
    </div>
  )
}
