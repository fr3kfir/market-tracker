// Plant identification + diagnosis via Claude vision.
// Shared by the Vercel function (api/diagnose.js) and the local Express server.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.PLANT_MODEL || 'claude-sonnet-5-5';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 3;
const MAX_BASE64_CHARS = 5_000_000; // ~3.7MB per image; client compresses well below this

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const obj = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const SCHEMA = obj({
  is_plant: { type: 'boolean' },
  plant: obj({
    common_name_he: str,
    common_name_en: str,
    scientific_name: str,
    family: str,
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    description: str,
    alternatives: strArr,
  }),
  health: obj({
    status: { type: 'string', enum: ['healthy', 'minor_issues', 'needs_attention', 'critical'] },
    summary: str,
    problems: {
      type: 'array',
      items: obj({
        name: str,
        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        symptoms: str,
        cause: str,
        treatment: strArr,
      }),
    },
  }),
  care: obj({
    light: str,
    water: str,
    watering_interval_days: { type: 'integer' },
    humidity: str,
    temperature: str,
    soil: str,
    fertilizer: str,
    repotting: str,
    pruning: str,
    propagation: str,
    difficulty: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
    placement: { type: 'string', enum: ['indoor', 'outdoor', 'both'] },
  }),
  toxicity: obj({
    pets: str,
    humans: str,
  }),
  tips: strArr,
});

const SYSTEM_PROMPT = `You are an expert botanist and plant-care specialist (horticulture, plant pathology, entomology).
The user sends one or more photos of a plant, optionally with a note, and wants to know:
1. What the plant is (identify to species when possible; otherwise genus).
2. Whether it has any health problems — pests, diseases, nutrient deficiencies, over/under-watering, light or temperature stress, sunburn, root rot, etc. — what causes them, and exactly how to treat them.
3. Full growing conditions and care instructions.

Rules:
- Write ALL free-text fields in Hebrew, except common_name_en and scientific_name (Latin) which stay in English/Latin.
- Tailor care advice to a home grower in Israel (hot dry summers, mild wet winters) unless the note says otherwise.
- Be concrete: amounts, frequencies, temperatures in °C, distances from windows, product types (e.g. "סבון אשלגן", "שמן נים").
- Base the diagnosis only on what is visible plus the user's note. If the plant looks healthy, say so and return an empty problems list. Do not invent problems.
- If identification is uncertain, set confidence to "low" or "medium" and list likely alternatives. If certain, alternatives may be empty.
- watering_interval_days: typical days between waterings in warm season for this plant in a pot.
- If the image does not contain a plant, set is_plant=false and fill the remaining fields with short placeholder text explaining that no plant was detected.
- treatment: ordered, actionable steps.
- tips: 2-5 short extra tips specific to this plant.`;

export async function diagnosePlant({ images, note }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 503, body: { error: 'ANTHROPIC_API_KEY לא מוגדר בשרת' } };
  }
  if (!Array.isArray(images) || images.length === 0) {
    return { status: 400, body: { error: 'לא התקבלה תמונה' } };
  }
  if (images.length > MAX_IMAGES) {
    return { status: 400, body: { error: `אפשר לשלוח עד ${MAX_IMAGES} תמונות` } };
  }
  for (const img of images) {
    if (!img || !ALLOWED_TYPES.includes(img.mediaType) || typeof img.data !== 'string') {
      return { status: 400, body: { error: 'פורמט תמונה לא נתמך' } };
    }
    if (img.data.length > MAX_BASE64_CHARS) {
      return { status: 413, body: { error: 'התמונה גדולה מדי' } };
    }
  }

  const content = images.map((img) => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mediaType, data: img.data },
  }));
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  content.push({
    type: 'text',
    text: cleanNote
      ? `הערת המשתמש: ${cleanNote}\n\nזהה את הצמח, אבחן בעיות ותן הוראות גידול.`
      : 'זהה את הצמח, אבחן בעיות ותן הוראות גידול.',
  });

  try {
    const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
    });

    if (response.stop_reason === 'refusal') {
      return { status: 422, body: { error: 'לא ניתן לנתח את התמונה הזו' } };
    }
    const text = response.content.find((b) => b.type === 'text')?.text;
    if (!text) throw new Error('Empty model response');

    return { status: 200, body: { result: JSON.parse(text), analyzedAt: new Date().toISOString() } };
  } catch (err) {
    console.error('diagnose failed:', err);
    const status = err?.status === 429 ? 429 : 502;
    return {
      status,
      body: { error: status === 429 ? 'יותר מדי בקשות, נסו שוב בעוד דקה' : 'הניתוח נכשל, נסו שוב' },
    };
  }
}
