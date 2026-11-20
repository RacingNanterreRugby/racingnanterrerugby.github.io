// Mise à jour automatique des matchs et classements depuis le site de la FFR (Mon Club House).
// Lancé par GitHub Actions (chaque semaine, ou via le bouton « Mettre à jour depuis la FFR » de l'administration).
// Pour chaque compétition de content/competitions.json qui a un lien « ffr », le script lit :
//   <ffr>/calendrier-resultats  → matchs du Racing Nanterre (dates, heures, scores)
//   <ffr>/classements           → classement
// Si la lecture échoue pour une compétition, ses données actuelles sont conservées telles quelles.

import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const FICHIER = new URL('../content/competitions.json', import.meta.url);
const NOUS = /racing nanterre/i;
const EXEMPT = /club exempt/i;

const reDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const reHeure = /^(\d{1,2}):(\d{2})$/;
const reScore = /^\d{1,3}$/;

/** Transforme le texte d'une carte de match FFR en objet match du site. */
export function lireMatch(texte) {
  const lignes = texte.split('\n').map(l => l.trim()).filter(Boolean);
  let date = null, heure = '', scores = [];
  const equipes = [];
  for (const l of lignes) {
    if (/^journ[ée]e\s*\d+/i.test(l) || l === '-' || /^logo$/i.test(l)) continue;
    const md = l.match(reDate); if (md) { date = `${md[3]}-${md[2]}-${md[1]}`; continue; }
    const mh = l.match(reHeure); if (mh) { heure = `${mh[1].padStart(2, '0')}h${mh[2]}`; continue; }
    if (reScore.test(l)) { scores.push(+l); continue; }
    const m3 = l.match(/^(\d{1,3})\s*-\s*(\d{1,3})$/); if (m3) { scores = [+m3[1], +m3[2]]; continue; }
    equipes.push(l.replace(/\s+logo$/i, ''));
  }
  if (!date || equipes.length < 2) return null;
  const [eq1, eq2] = [equipes[0], equipes[equipes.length - 1]];
  if (EXEMPT.test(eq1) || EXEMPT.test(eq2)) return null;
  const dom = NOUS.test(eq1);
  if (!dom && !NOUS.test(eq2)) return null;
  const joue = scores.length === 2;
  return {
    date, adv: dom ? eq2 : eq1, dom,
    scoreNous: joue ? (dom ? scores[0] : scores[1]) : null,
    scoreEux: joue ? (dom ? scores[1] : scores[0]) : null,
    heure, info: ''
  };
}

async function lireCompetition(page, base) {
  // Calendrier & résultats
  await page.goto(`${base}/calendrier-resultats`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('a[href*="/match/"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const textes = await page.$$eval('a[href*="/match/"]', els => els.map(e => e.innerText));
  const vus = new Set();
  const matchs = textes.map(lireMatch).filter(Boolean).filter(m => {
    const k = m.date + m.adv; if (vus.has(k)) return false; vus.add(k); return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Classement
  let classement = [];
  try {
    await page.goto(`${base}/classements`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('table tbody tr td', { timeout: 30000 });
    await page.waitForTimeout(1000);
    const lignes = await page.$$eval('table tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim())));
    classement = lignes
      .filter(c => c.length >= 4 && c[1])
      .map(c => ({ equipe: c[1], pts: +c[2], j: +c[3], nous: /racing nanterre/i.test(c[1]) }))
      .filter(e => !EXEMPT.test(e.equipe) && Number.isFinite(e.pts) && Number.isFinite(e.j));
  } catch (e) {
    console.warn(`  classement illisible : ${e.message}`);
  }
  return { matchs, classement };
}

async function main() {
  const competitions = JSON.parse(await readFile(FICHIER, 'utf8'));
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ locale: 'fr-FR' });
  let modifiees = 0;

  for (const c of competitions) {
    if (!c.ffr) continue;
    const base = c.ffr.replace(/\/(calendrier-resultats|classements)?\/?$/, '');
    console.log(`→ ${c.nom}`);
    try {
      const { matchs, classement } = await lireCompetition(page, base);
      console.log(`  ${matchs.length} match(s), ${classement.length} ligne(s) de classement`);
      if (matchs.length) {
        // On garde les infos saisies à la main (ex. « info ») pour les matchs déjà connus
        const anciens = new Map((c.matchs || []).map(m => [m.date + '|' + m.adv, m]));
        c.matchs = matchs.map(m => ({ ...m, info: anciens.get(m.date + '|' + m.adv)?.info || '' }));
        modifiees++;
        c.majLe = new Date().toISOString().slice(0, 10);
      }
      if (classement.length) c.classement = classement;
    } catch (e) {
      console.warn(`  échec, données conservées : ${e.message}`);
    }
  }
  await navigateur.close();
  await writeFile(FICHIER, JSON.stringify(competitions, null, 2) + '\n');
  console.log(`Terminé : ${modifiees} compétition(s) mise(s) à jour.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
