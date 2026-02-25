/**
 * generate-personas.mjs
 * One-time script: generates 10 Neo-Risograph soul type portrait images
 * via Google Gemini Imagen API and saves them to public/personas/.
 *
 * Usage:
 *   node scripts/generate-personas.mjs
 *
 * Requires GEMINI_API_KEY in .env.local (or environment).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY not found. Add it to .env.local:\n    GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const OUT_DIR = path.join(ROOT, 'public', 'personas');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Master style brief (prepended to every prompt) ────────────────────────────
const STYLE_BRIEF = `STYLE REFERENCE: Neo-Risograph Eastern Mythology. Background: near-black (#080808 to #0D0D0D). Texture: heavy analog grain/risograph print throughout ALL elements. Color count per image: maximum 3-4 colors. Color behavior: duotone overlap creates emergent third color where layers meet. Core palette pool: vermillion #E8372A, electric cyan #00C5CD, hot magenta #C8357A, cobalt blue #2B4CE0, burnt orange #FF4500. Typography: Chinese character of the pillar embedded structurally in image. Subject: Chinese mythological being/symbol rendered in duotone silhouette. Composition anchor: at least one large geometric circle or rectangle. Mood: ancient power transmitted through degraded analog signal. NOT: clean, polished, gradient-smooth, photorealistic, or cute. `;

// ── Per-archetype prompts ─────────────────────────────────────────────────────
const PERSONAS = [
  {
    slug: 'jia',
    label: '甲木 — The Pioneer',
    prompt: `Risograph print aesthetic, heavy analog grain texture throughout, near-black background (#0A0A0A). A massive ancient oak tree rendered in electric cyan and hot magenta duotone, roots breaking through geometric rectangular forms below, crown exploding upward beyond frame edge. Single oversized vermillion red circle (sun) behind trunk. Where cyan and magenta overlap, deep violet emerges. Small figure of a pioneer/explorer at base of trunk for scale. Chinese character 甲 fragmented into the bark texture. Grain density: maximum. Color count: 3. Style: neo-brutalist Eastern mythology meets zine culture.`,
  },
  {
    slug: 'yi',
    label: '乙木 — The Weaver',
    prompt: `Risograph print aesthetic, heavy analog grain, near-black background. Flowing organic vine forms in cobalt blue, wrapping around and through oversized geometric circles — the vine IS the composition, never straight, always curving. Hot magenta flowers bloom at intersection points. A celestial feminine figure (Dunhuang flying apsara style) rendered in blue silhouette, trailing ribbon-like vines. Duotone overlap creates electric teal where colors meet. Character 乙 embedded in vine curves. Typography: "YI" in bold sans-serif at unexpected scale, bottom left corner.`,
  },
  {
    slug: 'bing',
    label: '丙火 — The Luminary',
    prompt: `Risograph print aesthetic, maximum grain texture, deep black background. Dominant composition: an enormous orange-red sun circle centered, radiating NOT with rays but with concentric ripple rings. A mythological solar bird (金乌/three-legged crow) in electric cyan duotone overlaid on the sun, creating deep burnt orange where they meet. The sun's light described purely through color temperature shift — background grades to deep amber at edges. Character 丙 in massive white letterform, semi-transparent, behind all elements. Mood: overwhelming warmth, divine without being gentle.`,
  },
  {
    slug: 'ding',
    label: '丁火 — The Beacon',
    prompt: `Risograph print aesthetic, heavy grain, near-black background. A single stylized flame form in hot magenta and vermillion duotone — tall, narrow, elegant. The flame rendered as a classical Chinese deity silhouette (like a standing Guanyin) whose form dissolves upward into pure flame. Three geometric black circles arranged horizontally at bottom — vinyl record aesthetic. Electric cyan appears only at the flame's hottest center point. Deep shadow surrounds everything. Character 丁 in small, precise white text, bottom right. Mood: intimate power, focused divinity.`,
  },
  {
    slug: 'wu',
    label: '戊土 — The Mountain',
    prompt: `Risograph print aesthetic, maximum grain simulating stone texture, near-black background. Three mountain peaks in layered composition — risograph landscape style with contoured mountain lines. Colors: deep cobalt blue for far mountains, electric cyan for mid, hot magenta outline for near peak. Contour/topographic lines define form instead of shading. A mountain deity figure seated at summit — tiny relative to peak. Character 戊 carved into mountain face in negative space. Bottom third: flat black ground plane. Mood: geological time, silent authority.`,
  },
  {
    slug: 'ji',
    label: '己土 — The Cultivator',
    prompt: `Risograph print aesthetic, medium grain, near-black background. A stylized garden grid — geometric plot divisions in thin cobalt blue lines — but within each plot, organic forms (leaves, roots, seeds) in magenta/vermillion. Central figure: a classical scholar-farmer in cyan duotone silhouette, tending to an oversized single plant that dominates the upper frame. The plant's leaves extend beyond the geometric grid, breaking order. Soil texture rendered through grain density — bottom of image has maximum grain suggesting earth. Character 己 woven into garden grid pattern.`,
  },
  {
    slug: 'geng',
    label: '庚金 — The Sword',
    prompt: `Risograph print aesthetic, fine grain, near-black background. A single classical Chinese sword (jian) rendered monolithically — blade in pure electric cyan, handle in vermillion red. Blade positioned diagonally, splitting the composition. Where light would reflect: hot magenta slash marks in risograph bleed style. Background: faint topographic rings suggesting a forge or target. A warrior figure in full armor (cyan silhouette) reflected in the blade — inverted, small. Character 庚 in massive black letterform overlaid behind blade, barely visible against background. Mood: cold precision, necessary violence.`,
  },
  {
    slug: 'xin',
    label: '辛金 — The Jewel',
    prompt: `Risograph print aesthetic, fine grain (lightest of all — jewels are smooth), near-black background. A large multifaceted gem/crystal rendered through geometric facet planes — each facet a different risograph color (magenta, cyan, vermillion) with grain. The gem floats centered, surrounded by orbital rings suggesting celestial body. A refined feminine figure (scholar or celestial court lady) in silhouette, reflected prismatically across multiple facets — appearing several times, fragmented. Character 辛 in fine white hairline typography. Mood: exquisite, melancholy beauty, earned elegance.`,
  },
  {
    slug: 'ren',
    label: '壬水 — The Ocean',
    prompt: `Risograph print aesthetic, heavy grain suggesting water texture, near-black background blending into deep navy. Abstract ocean wave forms in cobalt blue and electric cyan — NOT realistic waves but geometric curved planes stacked, like a risograph Hokusai interpreted through brutalism. A sea dragon (龙) in magenta/vermillion duotone emerging from the deepest wave — massive, occupying full left side. An enormous moon circle at top right — white with grain. Where moon reflection hits water: magenta ripple lines. Character 壬 in large letterform, horizontal baseline suggesting water level.`,
  },
  {
    slug: 'gui',
    label: '癸水 — The Mist',
    prompt: `Risograph print aesthetic, maximum grain simulating fog/mist particles, near-black background. Composition is intentionally ambiguous — forms half-emerge from grain: a mountain? A face? A figure? The mist IS the subject. Cobalt blue wisps in diagonal movement across frame. A single small figure (pilgrim/wanderer) seen from behind, standing at edge of visible space — beyond them, only grain and cyan haze. One vermillion red circle — moon or lantern — barely visible through mist, top right. Character 癸 in white, slightly blurred at edges, suggesting the character itself is dissolving. Mood: liminality, the sacred in-between, productive dissolution.`,
  },
];

// ── Imagen 4 API call (primary) ──────────────────────────────────────────────
async function generateViaImagen4(fullPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: fullPrompt }],
      parameters: { sampleCount: 1, aspectRatio: '3:4', outputMimeType: 'image/png' },
    }),
  });
  if (!res.ok) throw new Error(`Imagen4 ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error(`No image in Imagen4 response`);
  return Buffer.from(b64, 'base64');
}

// ── Gemini 2.5 Flash Image (fallback) ────────────────────────────────────────
async function generateViaFlash25(fullPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!res.ok) throw new Error(`Flash2.5 ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error(`No image in Flash2.5 response`);
  return Buffer.from(part.inlineData.data, 'base64');
}

// ── Gemini 2.0 Flash Exp Image (second fallback) ──────────────────────────────
async function generateViaFlash20Exp(fullPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!res.ok) throw new Error(`Flash2.0exp ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error(`No image in Flash2.0exp response`);
  return Buffer.from(part.inlineData.data, 'base64');
}

async function generateImage(persona) {
  const fullPrompt = STYLE_BRIEF + persona.prompt;
  const attempts = [
    ['Imagen4',     () => generateViaImagen4(fullPrompt)],
    ['Flash2.5',    () => generateViaFlash25(fullPrompt)],
    ['Flash2.0exp', () => generateViaFlash20Exp(fullPrompt)],
  ];
  let lastErr;
  for (const [label, fn] of attempts) {
    try {
      return await fn();
    } catch (err) {
      process.stdout.write(`[${label}: ${err.message.slice(0,50)}…] `);
      lastErr = err;
    }
  }
  throw lastErr;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎨  Generating ${PERSONAS.length} soul type portraits...\n`);

  for (const persona of PERSONAS) {
    const outPath = path.join(OUT_DIR, `persona-${persona.slug}.png`);
    process.stdout.write(`  ${persona.label}... `);
    try {
      const buf = await generateImage(persona);
      fs.writeFileSync(outPath, buf);
      console.log(`✓  saved (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`✗  FAILED: ${err.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n✅  Done. Images saved to public/personas/\n');
}

main().catch(err => { console.error(err); process.exit(1); });
