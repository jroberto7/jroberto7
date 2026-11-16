import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const username = 'jroberto7';
const featured = ['FISIO-MODELO', 'Academia-Modelo', 'adv', 'FULLSTARK', 'BrainDev', 'DecideAi'];
const headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'jroberto7-profile', 'X-GitHub-Api-Version': '2026-03-10'};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function api(route) {
  const response = await fetch(`https://api.github.com${route}`, {headers});
  if (!response.ok) throw new Error(`GitHub ${response.status} for ${route}; previous graphics are preserved.`);
  return response.json();
}

// Only public, owned repositories are used. Forks and this presentation repo
// are excluded from language proportions. Language bytes are not skill levels.
const profile = await api(`/users/${username}`);
let repositories = [];
for (let page = 1; ; page++) {
  const batch = await api(`/users/${username}/repos?type=owner&per_page=100&page=${page}`);
  repositories.push(...batch.filter(repository => !repository.private));
  if (batch.length < 100) break;
}
const totals = {};
for (const repository of repositories.filter(repository => !repository.fork && repository.name.toLowerCase() !== username)) {
  const languages = await api(`/repos/${username}/${encodeURIComponent(repository.name)}/languages`);
  for (const [language, bytes] of Object.entries(languages)) totals[language] = (totals[language] || 0) + bytes;
}
const totalBytes = Object.values(totals).reduce((sum, value) => sum + value, 0);
const languages = Object.entries(totals).sort((a,b) => b[1]-a[1]).map(([name, bytes]) => ({name, bytes, percent: totalBytes ? bytes / totalBytes * 100 : 0}));
const displayedLanguages = languages.slice(0,4);
if(languages.length>4) displayedLanguages.push({name:'Outras',percent:languages.slice(4).reduce((sum,l)=>sum+l.percent,0)});
const selectedCount = featured.filter(name => repositories.some(repository => repository.name === name)).length;
const updated = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()).replaceAll('.','').toUpperCase();
const E = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const color = {bg:'#101c2a',edge:'#26394a',ink:'#edf5f7',muted:'#9cb1be',mint:'#7bf7d0',amber:'#ffbd7a'};
const palette = {HTML:'#ff9066',CSS:'#c2abff',JavaScript:'#ffe16b',TypeScript:'#7abfff',Python:'#82c5ee',Shell:'#a5d680',Other:'#9cb1be'};
const languageColor = language => palette[language] || '#7bf7d0';
const T = (x,y,value,size=20,fill=color.ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${E(value)}</text>`;
const font = 'font-family="Segoe UI,Arial,sans-serif"';
function leftCard(x,y,w,h) {
  const metrics = [[String(selectedCount),'PROJETOS','SELECIONADOS'],[String(languages.length),'LINGUAGENS','DETECTADAS'],[String(new Date(profile.created_at).getUTCFullYear()),'CONTA CRIADA','NO GITHUB']];
  return `<g transform="translate(${x} ${y})"><rect x="1" y="1" width="${w-2}" height="${h-2}" rx="16" fill="${color.bg}" stroke="${color.edge}"/>${T(30,42,'Meu universo no GitHub',24,color.ink,'font-weight="700"')}${T(w-30,41,'JR / 07',12,color.mint,'text-anchor="end" letter-spacing="2"')}${T(28,153,repositories.length,94,color.mint,'font-weight="750" letter-spacing="-4"')}${T(32,187,'REPOSITÓRIOS PÚBLICOS',13,color.muted,'letter-spacing="2"')}<path d="M32 214H${w-32}" stroke="${color.edge}"/>${metrics.map(([value,a,b],i)=>{const mx=32+i*(w-64)/3;return `${T(mx,270,value,34,color.ink,'font-weight="700"')}${T(mx,296,a,10,color.muted,'letter-spacing="1.2"')}${T(mx,312,b,10,color.muted,'letter-spacing="1.2"')}`;}).join('')}${T(32,h-27,`DADOS PÚBLICOS · ${updated}`,10,color.muted,'letter-spacing="1"')}<path d="M${w-98} 109l14-14 14 14m-28 18 14-14 14 14" fill="none" stroke="${color.amber}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function rightCard(x,y,w,h) {
  const barWidth=w-64;
  let offset=0;
  const bars=displayedLanguages.map(language=>{const width=barWidth*language.percent/100; const result=`<rect x="${32+offset}" y="79" width="${width}" height="13" fill="${languageColor(language.name)}"/>`;offset+=width;return result;}).join('');
  const rowGap=displayedLanguages.length>3?43:57;
  const rows=displayedLanguages.map((language,i)=>{const y=143+i*rowGap;return `<circle cx="39" cy="${y-6}" r="6" fill="${languageColor(language.name)}"/>${T(56,y,language.name,19,color.ink,'font-weight="600"')}${T(w-32,y,`${language.percent.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,19,languageColor(language.name),'text-anchor="end" font-weight="700"')}<path d="M32 ${y+17}H${w-32}" stroke="${color.edge}" stroke-opacity=".6"/>`;}).join('');
  return `<g transform="translate(${x} ${y})"><rect x="1" y="1" width="${w-2}" height="${h-2}" rx="16" fill="${color.bg}" stroke="${color.edge}"/>${T(30,42,'Linguagens no código',24,color.ink,'font-weight="700"')}<defs><clipPath id="bar-${x}-${y}"><rect x="32" y="79" width="${barWidth}" height="13" rx="6"/></clipPath></defs><rect x="32" y="79" width="${barWidth}" height="13" rx="6" fill="${color.edge}"/><g clip-path="url(#bar-${x}-${y})">${bars}</g>${rows}${T(32,h-43,'Proporção por bytes nos projetos públicos próprios.',12,color.muted)}${T(32,h-24,'Não representa nível de domínio das tecnologias.',12,color.muted)}</g>`;
}
const statsAlt=`GitHub de João Roberto: ${repositories.length} repositórios públicos, ${selectedCount} projetos selecionados, ${languages.length} linguagens detectadas. GitHub desde ${new Date(profile.created_at).getUTCFullYear()}. `+languages.map(language=>`${language.name}: ${language.percent.toFixed(1)}%`).join('; ')+'.';
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(statsAlt)}"><title>${E(statsAlt)}</title><g ${font}>${body}</g></svg>\n`;
const assets=fileURLToPath(new URL('../assets/',import.meta.url));
await mkdir(assets,{recursive:true});
await writeFile(`${assets}/github-stats.svg`,svg(1280,388,leftCard(0,0,624,388)+rightCard(656,0,624,388)));
await writeFile(`${assets}/github-stats-mobile.svg`,svg(680,800,leftCard(0,0,680,388)+rightCard(0,412,680,388)));
await writeFile(`${assets}/github-stats.json`,JSON.stringify({username,updated,publicRepositories:repositories.length,featuredProjects:selectedCount,githubSince:new Date(profile.created_at).getUTCFullYear(),languages,method:'Public owned repositories; forks and profile repository excluded from language bytes.'},null,2)+'\n');
console.log(statsAlt);
