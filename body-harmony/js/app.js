/* Body Harmony — built from the original Peptide Guide spreadsheet. All content comes from js/data.js */
(function(){
'use strict';
const D=window.DATA;
Object.entries(window.UPDATED||{}).forEach(([k,v])=>{if(D[k])D[k].updated=v});
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlize=s=>esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>');
const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}};
const ext=(u,t,cls='')=>u?`<a ${cls?`class="${cls}" `:''}href="${esc(u)}" target="_blank" rel="noopener">${esc(t||u)}</a>`:esc(t||'');
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const fmtNum=(n,d=2)=>{if(!isFinite(n))return '—';const r=Math.round(n*10**d)/10**d;return String(r)};

/* ---------- sections registry ---------- */
const SECTIONS=[
 {id:'home',ic:'⌂',name:'Getting Started'},
 {id:'vendors',ic:'⚗',name:'Peptide Vendors'},
 {id:'dosage',ic:'💉',name:'Dosage'},
 {id:'halflife',ic:'⏱',name:'Half-Life'},
 {id:'peds',ic:'💪',name:'PEDs'},
 {id:'supply',ic:'🧴',name:'Medical Supply Vendors'},
 {id:'bac',ic:'⚠',name:'BAC Water Tests'},
 {id:'terms',ic:'📖',name:'Terminology'},
 {id:'reg',ic:'⚖',name:'Regulation Info'},
 {id:'forums',ic:'💬',name:'Forums, Articles, etc.'},
 {sep:'More'},
 {id:'nutrition',ic:'🥤',name:'Nutrition'},
 {id:'medical',ic:'🩺',name:'Medical'},
 {id:'roadmap',ic:'🗺',name:'Roadmap'},
 {id:'links',ic:'🔗',name:'Extra Links'},
];
const searchIndex=[]; // {sec,label,text}
function idx(sec,label,...parts){const t=parts.filter(Boolean).join(' · ');if(t)searchIndex.push({sec,label,text:t,lc:t.toLowerCase()+' '+String(label).toLowerCase()})}

/* ---------- reusable table ---------- */
let tid=0;
function table(o){ // {cols:[{h,k|f,cls,sort:'num'|'txt',nosort}], rows:[...], filters:{label,key}, searchPh, id}
  const id='t'+(++tid);
  const chips=o.chip?`<div class="chips" data-chips="${id}">${['All',...[...new Set(o.rows.map(o.chip.get))].filter(Boolean)].map((c,i)=>`<button class="chip${i?'':' on'}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:'';
  const body=o.rows.map((r,i)=>{
    const cells=o.cols.map(c=>{const raw=c.f?c.f(r,i):esc(r[c.k]);return `<td class="${c.cls||''}">${raw}</td>`}).join('');
    const chipv=o.chip?esc(o.chip.get(r)):'';
    const text=o.cols.map(c=>c.s?c.s(r):(c.k!=null?r[c.k]:'')).join(' ').toLowerCase();
    return `<tr data-t="${esc(text)}"${chipv?` data-c="${chipv}"`:''}>${cells}</tr>`;
  }).join('');
  const html=`<div class="tools" data-tbl="${id}">
    <input type="search" class="tbl-search" placeholder="${esc(o.searchPh||'Filter this table…')}" aria-label="Filter table">
    ${chips}<span class="count"></span></div>
    <div class="tw"><table id="${id}"><thead><tr>${o.cols.map((c,i)=>`<th class="${c.nosort?'nosort ':''}${c.cls&&c.cls.includes('num')?'num':''}" data-i="${i}" data-sort="${c.sort||'txt'}">${esc(c.h)}${c.nosort?'':'<span class="arr">↕</span>'}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div><div class="empty" hidden>No matches.</div>`;
  return html;
}
function wireTables(root){
  $$('.tools[data-tbl]:not([data-custom])',root).forEach(tools=>{
    if(tools._w)return;tools._w=1;
    const t=document.getElementById(tools.dataset.tbl),tb=t.tBodies[0],empty=tools.nextElementSibling.nextElementSibling;
    const input=$('.tbl-search',tools),count=$('.count',tools);
    let chip='All';
    const run=()=>{
      const q=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let n=0;
      [...tb.rows].forEach(r=>{
        const ok=q.every(w=>r.dataset.t.includes(w))&&(chip==='All'||r.dataset.c===chip);
        r.hidden=!ok;if(ok)n++;
      });
      count.textContent=n+' of '+tb.rows.length;
      if(empty)empty.hidden=n>0;
    };
    input.addEventListener('input',run);
    $$('.chip',tools).forEach(b=>b.addEventListener('click',()=>{$$('.chip',tools).forEach(x=>x.classList.remove('on'));b.classList.add('on');chip=b.dataset.v;run()}));
    $$('thead th',t).forEach(th=>{
      if(th.classList.contains('nosort'))return;
      let dir=1;
      th.addEventListener('click',()=>{
        const i=+th.dataset.i,num=th.dataset.sort==='num';
        const rows=[...tb.rows];
        const key=r=>{const v=r.cells[i].textContent.trim();if(num){const m=v.match(/-?[\d.,]+/);return m?parseFloat(m[0].replace(/,/g,'')):-Infinity}return v.toLowerCase()};
        rows.sort((a,b)=>{const x=key(a),y=key(b);return (x>y?1:x<y?-1:0)*dir});
        dir*=-1;rows.forEach(r=>tb.appendChild(r));
        $$('.arr',t).forEach(a=>a.textContent='↕');$('.arr',th).textContent=dir===-1?'↑':'↓';
      });
    });
    tools._run=run;run();
  });
}
const head=(title,upd,lead)=>`<div class="page-head"><h1>${esc(title)}</h1>${upd?`<span class="upd">Last updated ${esc(upd)}</span>`:''}${lead?`<p class="lead">${urlize(lead)}</p>`:''}</div>`;
const fig=(src,alt,cap)=>`<figure><img src="img/${src}" alt="${esc(alt)}" data-zoom>${cap?`<figcaption>${esc(cap)}</figcaption>`:''}</figure>`;
const linkCard=(u,t,d)=>`<a class="lc" href="${esc(u)}" target="_blank" rel="noopener"><span class="t">${esc(t||host(u))}</span>${d?`<span class="d">${esc(d)}</span>`:''}<span class="u">${esc(u)}</span></a>`;

/* ---------- renderers ---------- */
const R={};
R.home=()=>{
  const s=D.start;
  s.directory.forEach(x=>idx('home',x.name,x.desc));
  const secOf={'Peptide Vendors':'vendors','Dosage':'dosage','PEDs':'peds','Medical Supply Vendors':'supply','BAC Water Tests - MUST READ!!!':'bac','Terminology':'terms','Regulation Info':'reg','Forums, Articles, etc.':'forums','Nutrition':'nutrition','Medical':'medical','Roadmap':'roadmap'};
  const upd={vendors:D.vendors.updated,dosage:D.dosage.updated,peds:D.peds.updated,supply:D.supply.updated,bac:D.bac.updated,terms:D.term.updated,reg:D.reg.updated,forums:D.forums.updated,nutrition:D.nutrition.updated,medical:D.medical.updated,roadmap:D.roadmap.updated};
  const must=D.bac;
  return `<div class="hero"><div class="mono-mark">B · H</div><h1>Body Harmony</h1><div class="rule"></div><p class="tag-line"><b>Peptide vendors, dosing, half-lives, testing results and regulation news</b> in one reference. Use the directory to jump to a section.</p><button class="btn" onclick="document.getElementById('dir').scrollIntoView({behavior:'smooth'})">Browse the guide</button><br><span class="upd">Last updated ${esc(s.updated)}</span></div>
  <div class="callout warn disclaimer"><h4>Disclaimer</h4><p>${esc(s.disclaimer.replace(/^Disclaimer:\s*/,''))}</p></div>
  <div class="grid g4" style="margin:18px 0">
    <a class="stat bad" href="#bac" style="text-decoration:none;color:inherit"><div class="v">${Math.round(must.stats[3].v*1000)/10}%</div><div class="l">BAC water products failed</div></a>
    <a class="stat" href="#vendors" style="text-decoration:none;color:inherit"><div class="v">${D.vendors.vendors.length}</div><div class="l">Peptide vendors listed</div></a>
    <a class="stat" href="#dosage" style="text-decoration:none;color:inherit"><div class="v">${D.dosage.compounds.length}</div><div class="l">Compound protocols</div></a>
    <a class="stat" href="#terms" style="text-decoration:none;color:inherit"><div class="v">${D.term.abbr.length+D.term.abbr2.length+D.term.slang.reduce((a,x)=>a+x.rows.length,0)}</div><div class="l">Glossary entries</div></a>
  </div>
  ${s.alert?`<div class="callout warn"><h4>${esc(s.alert.title)}</h4><p>${esc(s.alert.text)} <a href="#reg/alert">Read the claim check →</a></p></div>`:''}
  <div class="callout bad"><h4>Must read</h4><p>Third-party testing found a ${Math.round(must.stats[3].v*1000)/10}% failure rate in bacteriostatic water. <a href="#bac">See the BAC water tests →</a></p></div>
  <h2 id="dir" style="margin-top:26px">Directory</h2>
  <div class="grid g3 dirgrid">${s.directory.map(x=>{const id=secOf[x.name.trim()];return `<a class="lc" href="#${id}"><span class="n">${upd[id]?'Updated '+esc(upd[id]):''}</span><span class="t">${esc(x.name.trim())}</span><span class="d">${esc(x.desc)}</span></a>`}).join('')}</div>`;
};

R.vendors=()=>{
  const v=D.vendors;
  v.vendors.forEach(x=>idx('vendors',x.name,x.type,x.url));if(v.alert)idx('vendors',v.alert.title,v.alert.text);
  const grp=t=>v.vendors.filter(x=>x.type===t);
  const kinds=[...new Set(v.vendors.map(x=>x.type))];
  const kitNote={'Single Vials':'bad','Login Required':'warn'};
  return head('Peptide Vendors',v.updated)+`
  <div class="grid g2">
   <div class="card"><h3>${esc(v.headings[0])}</h3><div class="grid">${v.profiles.map(p=>linkCard(p.url)).join('')}</div></div>
   <div class="card"><h3>${esc(v.headings[1])}</h3><div class="grid">${v.testing.map(p=>linkCard(p.url)).join('')}</div>
     <h3 style="margin-top:18px">Vendor lists & chemical suppliers</h3><div class="grid">${v.lists.map(p=>linkCard(p.url)).join('')}</div></div>
  </div>
  ${v.alert?`<div class="callout warn"><h4>${esc(v.alert.title)}</h4><p>${esc(v.alert.text)} <a href="#reg/alert">Claim check →</a></p></div>`:''}
  <div class="callout warn"><h4>${esc(v.noendorse)}</h4></div>
  <div class="callout bad"><h4>${esc(v.warnTitle)}</h4><ol>${v.warnings.map(w=>`<li>${esc(w.replace(/^\d+\.\s*/,''))}</li>`).join('')}</ol>
    <p><b>${esc(v.whyTitle)}</b> ${esc(v.whyAnswer)}</p><p>${esc(v.closing)}</p></div>
  <h2>Vendor directory</h2>
  ${table({cols:[{h:'Vendor / Contact',k:'name',cls:'name'},{h:'Link',f:r=>ext(r.url,host(r.url)),s:r=>r.url},{h:'Products',f:r=>`<span class="pill ${kitNote[r.type]||'good'}">${esc(r.type)}</span>`,k:'type'}],rows:v.vendors,chip:{get:r=>r.type},searchPh:'Search vendors…'})}`;
};

/* ----- dosage ----- */
const toMcg=(s)=>{const m=String(s).replace(/\*/g,'').match(/([\d.]+)\s*(mcg|mg|g|iu)?/i);if(!m)return NaN;const n=parseFloat(m[1]),u=(m[2]||'mcg').toLowerCase();return u==='mg'?n*1000:u==='g'?n*1e6:n};
const ALIAS={'cjc1295':'cjc1295withoutdac','thymosina1':'thymosinalpha1','ghkcu':'ghkcu','bpc157':'bpc157','tb500':'tb500','mots c':'motscHuman'};
function findCompound(name){
  const n=norm(name),C=D.dosage.compounds;
  let c=C.find(x=>norm(x.name)===n);
  if(!c)c=C.find(x=>norm(x.name).startsWith(n)||n.startsWith(norm(x.name)));
  if(!c)c=C.find(x=>norm(x.name).includes(n)||n.includes(norm(x.name)));
  if(!c&&ALIAS[n])c=C.find(x=>norm(x.name).includes(ALIAS[n].toLowerCase()));
  return c;
}
R.dosage=()=>{
  const d=D.dosage;
  d.compounds.forEach(c=>idx('dosage',c.name,c.cat,c.dose,c.desc));
  d.matrix.forEach(r=>idx('dosage',r[0]+' (matrix)',r[1],r[2]));
  idx('dosage','Dosage calculator','calculator reconstitution units syringe U-100 BAC water vial');
  const sub=[['storage','Storage'],['recon','Reconstitution'],['calc','Calculator'],['matrix','Dosage matrix'],['protocols','Protocols'],['concentration','Concentration tables'],['mix','Mix chart'],['titration','Titration']];
  const opts=l=>l.map(o=>`<option>${esc(o)}</option>`).join('');
  const names=d.lookup.map(x=>x.name);
  const vt=v=>`<h3>${esc(v.title)}</h3><p>${esc(v.sub)}</p><div class="tw"><table><thead><tr>${v.hdr.map(h=>`<th class="nosort">${esc(h)}</th>`).join('')}</tr></thead><tbody>${v.rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i?'':'name'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h4 style="margin-top:14px">${esc(v.exTitle)}</h4>${v.ex.map(x=>`<p style="margin:.2em 0">${esc(x)}</p>`).join('')}`;
  const mh=d.matrixHdr;
  const groups=['5mg','10mg','20mg'];
  return head(d.title.trim(),d.updated)+`
  <div class="callout warn disclaimer"><p>${esc(d.disclaimer)}</p></div>
  <div class="subnav" data-spy>${sub.map(([i,t])=>`<a href="#dosage/${i}">${t}</a>`).join('')}</div>

  <div id="d-storage" class="card"><h2>Storing lyophilized vials</h2>${fig('storage-guide.png','Easy guidelines for storing lyophilized vials: shelf (<1 year-ish), fridge (1-2 years), freezer (years)','Easy guidelines for storing lyophilized vials ("the powder")')}</div>
  <div id="d-recon" class="card"><h2>Peptide reconstitution: step-by-step</h2>${fig('reconstitution-guide.jpg','Peptide reconstitution step-by-step guide infographic','Wash hands, sanitize vial tops, draw BAC water, inject, let dissolve, refrigerate; concentration, dose conversion and syringe conversion tables; injection sites.')}</div>

  <div id="d-calc" class="card"><h2>${esc(d.calcTitle)}</h2><p class="lead">${esc(d.calcIntro)}</p>
   <div class="calc">
    <div>
      <div class="field"><label for="c-pep">Peptide</label><select id="c-pep">${opts(names)}</select></div>
      <div class="frow">
        <div class="field"><label>Baseline <small>(from guide)</small></label><input id="c-base" readonly></div>
        <div class="field"><label>Frequency</label><input id="c-freq" readonly></div>
      </div>
      <div class="frow">
        <div class="field"><label for="c-des">Desired dose</label><select id="c-des">${opts(d.optDose)}</select></div>
        <div class="field"><label for="c-cust">…or custom dose</label><div style="display:flex;gap:6px"><input id="c-cust" type="number" min="0" step="any" placeholder="e.g. 250"><select id="c-cu" style="width:84px"><option>mcg</option><option>mg</option></select></div></div>
      </div>
      <div class="frow">
        <div class="field"><label for="c-vial">Vial mass (mg)</label><select id="c-vial">${opts(d.optVial)}</select></div>
        <div class="field"><label for="c-bac">BAC water (mL)</label><select id="c-bac">${opts(d.optBac)}</select></div>
      </div>
      <div class="field"><label>Description</label><div id="c-desc" style="color:var(--muted)"></div></div>
    </div>
    <div>
      <div class="result"><div class="big" id="c-units">—</div><div class="sub">units on a U-100 (1 cc / 1 mL) insulin syringe</div></div>
      <div class="syringe"><div class="barrel"><div class="fill" id="c-fill"></div><div class="ticks"></div></div><div class="lab"><span>0</span><span>25</span><span>50</span><span>75</span><span>100 u</span></div></div>
      <div id="c-warn"></div>
      <dl class="kv" id="c-kv"></dl>
    </div>
   </div>
   <div class="callout"><h4>${esc(d.bacTitle)}</h4><ul>${d.bacTips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p style="font-size:13px">${esc(d.omitted)}</p></div>
  </div>

  <div id="d-matrix" class="card"><h2>${esc(d.matrixTitle[0].trim())}</h2><p class="lead">${esc(d.matrixTitle[1])}</p><p><b>${esc(d.matrixSub)}</b></p>
   <div class="tools" data-tbl="mx"><input type="search" class="tbl-search" placeholder="🔍 Search peptide…" aria-label="Search matrix"><span class="count"></span></div>
   <div class="tw"><table id="mx"><thead><tr class="gh"><th colspan="3" class="nosort"></th>${groups.map(g=>`<th colspan="3" class="nosort">${g} vial</th>`).join('')}</tr>
   <tr>${mh.map((h,i)=>`<th class="nosort${i>2?' num':''}" data-sort="txt" data-i="${i}">${esc(i>2?h.replace(/^\d+mg \+ /,'+ '):h)}</th>`).join('')}</tr></thead>
   <tbody>${d.matrix.map(r=>`<tr data-t="${esc(r.join(' ').toLowerCase())}">${r.map((c,i)=>`<td class="${i===0?'name':i>2?'mcol'+(c.includes('*')?' over':''):''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="empty" hidden>No matches.</div>
   <p style="font-size:13px;color:var(--muted)">${esc(d.matrixNote)} Target doses marked ** are baseline values.</p></div>

  <div id="d-protocols" class="card"><h2>Common dosage & protocols</h2>
   ${table({cols:[{h:'Compound',k:'name',cls:'name'},{h:'Category',f:r=>`<span class="pill info">${esc(r.cat)}</span>`,k:'cat'},{h:'Common Dosage Schedule',k:'dose'},{h:'Description & Purpose',k:'desc'}],rows:d.compounds,chip:{get:r=>r.cat.split(/ & |, /)[0]},searchPh:'Search compounds, categories, doses…'})}</div>

  <div id="d-concentration" class="card"><h2>How reconstitution concentration works</h2>
   ${d.concIntro.map(p=>`<p>${esc(p)}</p>`).join('')}<p><b>${d.units.map(esc).join('</b> · <b>')}</b></p><p>${esc(d.concIntro2)}</p>
   <div class="grid g2"><div>${vt(d.v10)}</div><div>${vt(d.v20)}</div></div>
   <div class="callout" style="margin-top:18px"><h4>${esc(d.tipsTitle)}</h4>${d.tips.map(t=>`<p>${esc(t)}</p>`).join('')}</div></div>

  <div id="d-mix" class="card"><h2>${esc(d.mixTitle)}</h2>${fig('peptide-mix-chart.jpg','Peptide mix compatibility chart','Charted data from the anecdotal info. These are not recommendations. They are provided for convenience. Researchers should verify & validate all info. Legend: green = combinations used in health wellness clinics; blue = anecdotal (specific) can mix, not included in clinic lists; yellow = anecdotal (specific) don\u2019t mix; red = \u201Ccommonly known\u201D don\u2019t mix.')}</div>
  <div id="d-titration" class="card"><h2>Retatrutide titration guide</h2>${fig('retatrutide-titration.png','Retatrutide titration guide flowchart','Goal: most effective tolerated dosage. This schedule was based on the Stage 3 trials; the values may look different for you.')}</div>`;
};
function initDosage(root){
  const d=D.dosage;const $i=id=>root.querySelector('#'+id);
  const pep=$i('c-pep');if(!pep)return;
  pep.value=d.default.peptide;$i('c-vial').value=d.default.vial;$i('c-bac').value=d.default.bac;$i('c-des').value=d.default.desired;
  const calc=()=>{
    const row=d.lookup.find(x=>x.name===pep.value)||{};
    $i('c-base').value=row.dose||'';$i('c-freq').value=row.freq||'';
    const comp=findCompound(pep.value);$i('c-desc').textContent=comp?comp.desc:'';
    let dose=NaN,src='baseline';
    const cust=parseFloat($i('c-cust').value);
    if(cust>0){dose=$i('c-cu').value==='mg'?cust*1000:cust;src='custom'}
    else if($i('c-des').value!=='None Selected'){dose=toMcg($i('c-des').value);src='desired'}
    else dose=toMcg(row.dose||'');
    const vialMg=parseFloat($i('c-vial').value),bac=parseFloat($i('c-bac').value);
    const conc=vialMg*1000/bac; // mcg per mL
    const units=dose/conc*100;
    $i('c-units').textContent=isFinite(units)?fmtNum(units,2):'—';
    $i('c-fill').style.width=Math.min(100,units||0)+'%';
    const w=$i('c-warn');w.innerHTML='';
    if(units>100)w.innerHTML=`<div class="callout bad"><b>Exceeds 100 units.</b> A standard 1 mL syringe cannot hold this volume. Use less BAC water or a larger vial.</div>`;
    else if(units>0&&units<2)w.innerHTML=`<div class="callout warn"><b>Very small volume.</b> Under 2 units is hard to measure accurately. Add more BAC water.</div>`;
    $i('c-kv').innerHTML=`<dt>Dose used</dt><dd>${fmtNum(dose,2)} mcg (${fmtNum(dose/1000,3)} mg) · ${src}</dd><dt>Concentration</dt><dd>${fmtNum(conc/1000,3)} mg/mL (${fmtNum(conc,1)} mcg/mL)</dd><dt>Volume to draw</dt><dd>${fmtNum(units/100,3)} mL</dd><dt>Per 1 unit</dt><dd>${fmtNum(conc/100,2)} mcg</dd><dt>Per 10 units</dt><dd>${fmtNum(conc/10,1)} mcg</dd>`;
  };
  ['c-pep','c-des','c-vial','c-bac','c-cu'].forEach(i=>$i(i).addEventListener('change',calc));
  $i('c-cust').addEventListener('input',calc);
  $i('c-pep').addEventListener('change',()=>{$i('c-des').value='None Selected';$i('c-cust').value='';calc()});
  calc();
}

/* ----- half life ----- */
function parseHours(s){
  if(!s)return NaN;let t=String(s).toLowerCase().replace(/[~<>≈]/g,'').replace('up to','').replace(/\+/g,'');
  const m=t.match(/([\d.]+)\s*(?:[–\-]|to)?\s*([\d.]+)?\s*(minute|min|hour|hr|day|week)/);
  if(!m){return /^\s*days?\s*$/.test(t)?72:/week/.test(t)?168*2:NaN}
  const a=parseFloat(m[1]),b=m[2]?parseFloat(m[2]):a,v=(a+b)/2,u=m[3];
  return v*(u.startsWith('min')?1/60:u.startsWith('h')?1:u==='day'?24:168);
}
R.halflife=()=>{
  const h=D.halflife;h.rows.forEach(r=>idx('halflife',r[0],r[1],r[2],r[3]));
  return head('Half-Life',h.updated)+h.intro.map(p=>`<p class="lead">${esc(p)}</p>`).join('')+`
  <div class="subnav" data-spy><a href="#halflife/table">Table</a><a href="#halflife/sim">Level simulator</a></div>
  <div id="h-table" class="card"><h2>${esc(h.title)}</h2>
  ${table({cols:[{h:h.hdr[0],k:0,cls:'name',f:r=>esc(r[0]),s:r=>r[0]},{h:h.hdr[1],f:r=>esc(r[1]),s:r=>r[1]},{h:h.hdr[2],f:r=>esc(r[2]),s:r=>r[2]},{h:h.hdr[3],f:r=>esc(r[3]),s:r=>r[3]}],rows:h.rows,searchPh:'Search peptides…'})}
  ${h.notes.map(n=>`<div class="callout"><p>${esc(n)}</p></div>`).join('')}</div>
  <div id="h-sim" class="card"><h2>Estimated level simulator</h2>
   <p class="lead">From the roadmap: see roughly how much is in your system over a day, week or month. This is a simplified one-compartment model (instant absorption, first-order elimination), built from the half-life estimates above. For education only.</p>
   <div class="calc sim"><div>
    <div class="field"><label for="s-pep">Peptide</label><select id="s-pep">${h.rows.map((r,i)=>`<option value="${i}">${esc(r[0])}</option>`).join('')}</select></div>
    <div class="field"><label for="s-basis">Half-life basis</label><select id="s-basis"><option value="1">Plasma half-life</option><option value="2">Biological effect duration</option></select></div>
    <div class="frow"><div class="field"><label for="s-hl">Half-life (hours)</label><input id="s-hl" type="number" min="0.01" step="any"></div>
    <div class="field"><label for="s-dose">Dose (any unit)</label><input id="s-dose" type="number" min="0" step="any" value="100"></div></div>
    <div class="frow"><div class="field"><label for="s-int">Dosing interval</label><select id="s-int"><option value="8">Every 8 h</option><option value="12">Every 12 h</option><option value="24" selected>Daily</option><option value="48">Every 2 days</option><option value="84">Twice weekly</option><option value="168">Weekly</option></select></div>
    <div class="field"><label for="s-days">Show</label><select id="s-days"><option value="1">1 day</option><option value="7">1 week</option><option value="14">2 weeks</option><option value="30" selected>1 month</option><option value="60">2 months</option></select></div></div>
    <dl class="kv" id="s-kv"></dl><div id="s-note"></div>
   </div><div><svg id="s-chart" class="chart" viewBox="0 0 640 340" role="img" aria-label="Estimated level over time"></svg></div></div></div>`;
};
function initHalf(root){
  const h=D.halflife,$i=id=>root.querySelector('#'+id);if(!$i('s-pep'))return;
  const setHL=()=>{const r=h.rows[+$i('s-pep').value],b=+$i('s-basis').value;const v=parseHours(r[b]);$i('s-hl').value=isFinite(v)?+v.toFixed(3):'';draw()};
  function draw(){
    const r=h.rows[+$i('s-pep').value],hl=parseFloat($i('s-hl').value),dose=parseFloat($i('s-dose').value),tau=+$i('s-int').value,days=+$i('s-days').value;
    const svg=$i('s-chart');
    if(!(hl>0)||!(dose>=0)){svg.innerHTML='<text x="20" y="40">Enter a half-life in hours.</text>';$i('s-kv').innerHTML='';return}
    const k=Math.LN2/hl,T=days*24,N=Math.min(900,Math.max(160,Math.round(T*(days<=2?8:2))));
    const lvl=t=>{let s=0;for(let n=0;n*tau<=t;n++)s+=dose*Math.exp(-k*(t-n*tau));return s};
    const pts=[];let max=0;for(let i=0;i<=N;i++){const t=T*i/N,y=lvl(t);pts.push([t,y]);if(y>max)max=y}
    const W=640,H=340,L=52,B=34,Tp=14,Rr=14,pw=W-L-Rr,ph=H-B-Tp;
    const X=t=>L+t/T*pw,Y=y=>Tp+ph-(y/(max||1))*ph;
    let g='';for(let i=0;i<=4;i++){const y=Tp+ph*i/4;g+=`<line x1="${L}" x2="${W-Rr}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L-6}" y="${y+4}" text-anchor="end">${fmtNum(max*(1-i/4),max<10?2:0)}</text>`}
    const xt=days<=2?6:days<=7?7:6;for(let i=0;i<=xt;i++){const t=T*i/xt;g+=`<text x="${X(t)}" y="${H-10}" text-anchor="middle">${T<=48?fmtNum(t,0)+'h':fmtNum(t/24,days<=14?1:0)+'d'}</text>`}
    const path='M'+pts.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join('L');
    svg.innerHTML=g+`<path d="${path}L${X(T)},${Y(0)}L${X(0)},${Y(0)}Z" fill="var(--accent)" opacity=".12"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
    const acc=1/(1-Math.exp(-k*tau)),peakSS=dose*acc,troughSS=peakSS-dose,ssT=hl*4.32;
    $i('s-kv').innerHTML=`<dt>Elimination rate</dt><dd>${fmtNum(k,4)} /h</dd><dt>Steady-state peak</dt><dd>${fmtNum(peakSS,1)} (${fmtNum(acc,2)}× dose)</dd><dt>Steady-state trough</dt><dd>${fmtNum(troughSS,1)}</dd><dt>Time to steady state</dt><dd>~${ssT<48?fmtNum(ssT,1)+' h':fmtNum(ssT/24,1)+' days'} (≈4–5 half-lives)</dd><dt>Left after one interval</dt><dd>${fmtNum(Math.exp(-k*tau)*100,1)}%</dd>`;
    $i('s-note').innerHTML=`<div class="callout"><p style="font-size:13px"><b>${esc(r[0])}</b> · plasma: ${esc(r[1])} · effect: ${esc(r[2])}<br>${esc(r[3])}</p></div>`;
  }
  $i('s-pep').addEventListener('change',setHL);$i('s-basis').addEventListener('change',setHL);
  ['s-hl','s-dose'].forEach(i=>$i(i).addEventListener('input',draw));['s-int','s-days'].forEach(i=>$i(i).addEventListener('change',draw));
  setHL();
}

/* ----- peds ----- */
R.peds=()=>{
  const p=D.peds;p.links.forEach(u=>idx('peds',host(u),u));idx('peds','Growth hormone pathway',p.caption);
  return head('PEDs',p.updated,'Information regarding performance-enhancing drugs and medical use.')+`
  <div class="card"><h3>${esc(p.heading)}</h3><div class="grid g3">${p.links.slice(0,1).map(u=>linkCard(u)).join('')}</div>
  <h3 style="margin-top:20px">Other sources</h3><div class="grid g3">${p.links.slice(1).map(u=>linkCard(u)).join('')}</div></div>
  <div class="card"><h3>Growth hormone secretion pathway</h3>${fig('gh-pathway.jpg','Biological pathway regulating growth hormone secretion',p.caption)}</div>`;
};

/* ----- supply ----- */
const prodKey=t=>t.replace(/^[^\p{L}\p{N}]+/u,'').trim().toLowerCase();
R.supply=()=>{
  const s=D.supply;s.rows.forEach(r=>idx('supply',r.name,r.products.join(' '),r.url));
  const pk=p=>p.replace(/[^\p{L}\p{N} ]/gu,'').trim().toLowerCase();const seenP={};s.rows.forEach(r=>r.products.forEach(p=>{const k=pk(p);if(!seenP[k])seenP[k]=p.trim().replace(/(\p{L})/u,c=>c.toUpperCase())}));const all=Object.entries(seenP).sort((a,b)=>a[0].localeCompare(b[0]));
  return head('Medical Supply Vendors',s.updated,'Links and contacts for purchasing medical supplies.')+`
  <div class="tools"><input type="search" id="sup-q" placeholder="Search vendors…"><div class="chips" id="sup-chips"><button class="chip on" data-v="">All products</button>${all.map(([k,p])=>`<button class="chip" data-v="${esc(k)}">${esc(p)}</button>`).join('')}</div><span class="count" id="sup-count"></span></div>
  <div class="grid g3" id="sup-grid">${s.rows.map(r=>`<div class="card sup" style="margin:0" data-t="${esc((r.name+' '+r.products.join(' ')).toLowerCase())}" data-p="${esc(r.products.map(pk).join('|'))}"><h3 style="margin-bottom:6px">${esc(r.name)}</h3><div>${r.products.map(p=>`<span class="tag">${esc(p)}</span>`).join('')}</div><p style="margin:10px 0 0">${ext(r.url,host(r.url)+' →')}</p></div>`).join('')}</div>`;
};
function initSupply(root){
  const q=$('#sup-q',root);if(!q)return;let pr='';
  const run=()=>{let n=0;const w=q.value.toLowerCase().split(/\s+/).filter(Boolean);$$('.sup',root).forEach(c=>{const ok=w.every(x=>c.dataset.t.includes(x))&&(!pr||c.dataset.p.split('|').includes(pr));c.hidden=!ok;if(ok)n++});$('#sup-count',root).textContent=n+' of '+D.supply.rows.length};
  q.addEventListener('input',run);
  $$('#sup-chips .chip',root).forEach(b=>b.addEventListener('click',()=>{$$('#sup-chips .chip',root).forEach(x=>x.classList.remove('on'));b.classList.add('on');pr=b.dataset.v;run()}));
  q._run=run;run();
}

/* ----- bac ----- */
R.bac=()=>{
  const b=D.bac;b.rows.forEach(r=>idx('bac',r.name,'lot '+r.lot,r.result,r.note));idx('bac','BAC water study',b.intro);
  const pct=x=>(x*100).toFixed(2)+'%';
  const phBad=p=>p<4||p>7,baBad=a=>a<.0072||a>.0108;
  return head('BAC Water Tests — MUST READ!!!',b.updated)+`
  <div class="callout bad"><p>${esc(b.intro)}</p></div>
  <h2>${esc(b.title)}</h2><h3 style="color:var(--muted)">${esc(b.summaryTitle)}</h3>
  <div class="grid g4" style="margin-bottom:18px">${b.stats.map((s,i)=>`<div class="stat ${['','good','bad','bad'][i]}"><div class="v">${i===3?(s.v*100).toFixed(1)+'%':s.v}</div><div class="l">${esc(s.l)}</div></div>`).join('')}</div>
  <div class="card"><h3>${esc(b.title.includes('All')?b.title:'All products: test results')}</h3>
  ${table({cols:[{h:'#',f:r=>r.n,cls:'num',sort:'num',s:r=>r.n},{h:'Sample name',k:'name',cls:'name'},{h:'Lot #',k:'lot',cls:'mono'},{h:'Benzyl alcohol (%)',f:r=>`<span class="${baBad(r.ba)?'pill bad':''}">${pct(r.ba)}</span>`,cls:'num',sort:'num',s:r=>pct(r.ba)},{h:'pH',f:r=>`<span class="${phBad(r.ph)?'pill bad':''}">${r.ph}</span>`,cls:'num',sort:'num',s:r=>r.ph},{h:'Pass/Fail',f:r=>`<span class="pill ${r.result==='Pass'?'good':'bad'}">${esc(r.result)}</span>`,k:'result'},{h:'Notes',k:'note'}],rows:b.rows,chip:{get:r=>r.result},searchPh:'Search brands, lots, notes…'})}
  <p style="font-size:13px;color:var(--muted);margin-top:10px">The source sheet lists ${b.rows.length} of the ${b.stats[0].v} tested samples; the infographic below shows the full study.<br>${esc(b.standards)}<br>${esc(b.ruo)}<br><i>${esc(b.disc)}</i></p>
  ${b.extraLink?`<p>See also: ${ext(b.extraLink)}</p>`:''}</div>
  <div class="grid g2">
   <div class="card"><h3>${esc(b.impactTitle)}</h3><p>${esc(b.impactIntro)}</p>${b.impacts.map(i=>`<div class="callout warn"><h4>${esc(i.t)}</h4><p>${esc(i.d)}</p></div>`).join('')}</div>
   <div class="card"><h3>${esc(b.failTitle)}</h3><div class="bars">${b.fail.map(f=>{const w=f.n/ b.stats[0].v*100;return `<div class="row"><div><b>${esc(f.l)}</b><br><small style="color:var(--muted)">${esc(f.r||'')}</small></div><div class="bar"><i style="width:${w}%"></i></div><div><b>${f.n}</b> ${esc(f.p)}</div></div>`}).join('')}</div><p>${esc(b.failNote)}</p>
   <div class="callout"><p style="font-size:13px"><b>Failure categories:</b> ${b.fail.map(f=>`${esc(f.k)} = ${esc(f.l)}`).join(' · ')}</p></div></div>
  </div>
  <div class="card"><h3>Infographic</h3>${fig('bac-water-infographic.jpg','Peptide Crafters bacteriostatic water quality study infographic',b.title)}</div>`;
};

/* ----- terminology ----- */
R.terms=()=>{
  const t=D.term;
  t.slang.forEach(s=>s.rows.forEach(r=>idx('terms',r[0],r[1])));
  t.customs&&t.customs.rows.forEach(r=>idx('terms',r[0],r[1]));t.abbr.forEach(r=>idx('terms',r[0],r[1],r[2],r[3]));t.abbr2.forEach(r=>idx('terms',r[0],r[1],r[2]));
  const sl=s=>table({cols:[{h:'Term / Acronym',k:0,f:r=>esc(r[0]),cls:'name',s:r=>r[0]},{h:'Meaning / Substance',f:r=>esc(r[1]),s:r=>r[1]}],rows:s.rows,searchPh:'Filter terms…'});
  const ab=(rows,adm)=>table({cols:[{h:t.abbrHdr[0],f:r=>esc(r[0]),cls:'name mono',s:r=>r[0]},{h:t.abbrHdr[1],f:r=>esc(r[1]),s:r=>r[1]},{h:t.abbrHdr[2],f:r=>esc(r[2]),s:r=>r[2]},{h:t.abbrHdr[3],f:r=>`<span class="pill ${r[3].includes('Medical')?'info':'muted'}">${esc(r[3])}</span>`,s:r=>r[3]},{h:t.abbrHdr[4],f:r=>esc(r[4]),s:r=>r[4]}],rows,chip:{get:r=>r[3]},searchPh:'Search abbreviations…'});
  const tabs=[['slang','Common Slang'],['customs','Import & Customs'],['aas','Anabolic-Androgenic Steroids'],['pep','Peptides, GH & GLP-1s'],['abbr','Abbreviations (administered)'],['abbr2','Abbreviations (not administered)']];
  return head('Terminology',t.updated,t.intro)+`
  <div class="subnav" data-tabs="terms">${tabs.map(([i,n],k)=>`<a href="#terms/${i}" data-tab="${i}" class="${k?'':'on'}">${n}</a>`).join('')}</div>
  <div class="tabpane on" data-pane="slang"><div class="card"><h2>${esc(t.slang[0].title)}</h2>${sl(t.slang[0])}</div></div>
  ${t.customs?`<div class="tabpane" data-pane="customs"><div class="card"><h2>${esc(t.customs.title)}</h2>${sl(t.customs)}</div></div>`:''}
  <div class="tabpane" data-pane="aas"><div class="card"><h2>${esc(t.slang[1].title)}</h2>${sl(t.slang[1])}</div></div>
  <div class="tabpane" data-pane="pep"><div class="card"><h2>${esc(t.slang[2].title)}</h2>${sl(t.slang[2])}</div></div>
  <div class="tabpane" data-pane="abbr"><div class="card"><h2>Abbreviations</h2>${ab(t.abbr)}</div></div>
  <div class="tabpane" data-pane="abbr2"><div class="card"><h2>Abbreviations — not administered</h2><div class="callout warn"><p>${esc(t.note)}</p></div>${ab(t.abbr2)}</div></div>`;
};

/* ----- regulation ----- */
const statCls=s=>/Approved/.test(s)?'good':/Under/.test(s)?'warn':/Pending/.test(s)?'info':'muted';
const claimCls={Confirmed:'good','Needs context':'warn',Unverified:'bad',Plausible:'info'};
function alertCard(al){
  if(!al)return '';
  return `<section id="r-alert" class="sect alert-sec"><div class="sect-h"><span class="kick bad">Shipping alert</span><h2>${esc(al.title)}</h2><p class="muted">Checked ${esc(al.updated)}</p></div>
  <p class="lead">${esc(al.intro)}</p>
  <div class="tw"><table><thead><tr><th class="nosort">Claim</th><th class="nosort">Verdict</th><th class="nosort">What the sources say</th></tr></thead><tbody>${al.claims.map(c=>`<tr><td class="name">${esc(c[0])}</td><td><span class="pill ${claimCls[c[1]]||'muted'}">${esc(c[1])}</span></td><td>${esc(c[2])}</td></tr>`).join('')}</tbody></table></div>
  <h3 style="margin-top:20px">What to expect</h3><ul>${al.expect.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
  <div class="callout"><p>${esc(al.note)}</p></div>
  <h3>Sources</h3><div class="grid g2">${al.sources.map(s=>linkCard(s[1],s[0])).join('')}</div></section>`;
}

/* regulation updates + feed */
const fnMark=(t,pre)=>esc(t).replace(/\[\^(\d+)\]/g,(m,n)=>`<sup class="fn"><a href="#reg/${pre}${n}" data-fn="${pre}${n}">${n}</a></sup>`);
const typeCls=t=>/primary/.test(t)?'good':/secondary/.test(t)?'warn':'info';
function updatesCard(u){
  if(!u)return '';
  const body=u.blocks.map(b=>b.t==='h'?`<h3>${esc(b.x)}</h3>`:`<p>${fnMark(b.x,'fn')}</p>`).join('');
  const fns=u.footnotes.map(f=>`<li id="r-fn${f.n}"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.label)}</a> <span class="muted">${esc(f.pub)}</span> <span class="pill ${typeCls(f.type)}">${esc(f.type)}</span></li>`).join('');
  return `<section id="r-updates" class="sect prose"><div class="sect-h"><h2>${esc(u.title)}</h2><p class="muted">Checked ${esc(u.checked)}</p></div>${body}
  <h3>Footnotes</h3><ol class="fnlist">${fns}</ol><div class="callout"><p>${esc(u.note)}</p></div></section>`;
}
const fmtD=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(d||'');if(!m)return d||'';return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
const fmtT=t=>{if(!t)return '';const d=new Date(t);return isNaN(d)?t:d.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})};
function feedModel(){
  const F=window.FEED||{items:[],sources:[]};const srcs=F.sources||[],num={};srcs.forEach((s,i)=>num[s.id]=i+1);
  const short=n=>String(n||'').replace(/^Federal Register:.*/,'Federal Register').replace(/^Google News.*/,'Google News').replace(/^FDA Drugs.*/,'FDA Drugs').replace(/^FDA MedWatch.*/,'FDA MedWatch').replace(/^FDA Press.*/,'FDA press releases').replace(/\s*\((RSS|API)\)$/,'').replace(/^Curated by the guide.*/,'Curated');
  const nameOf=i=>short(i.p||(srcs.find(s=>s.id===i.s)||{}).name||i.s);
  F.items=(F.items||[]).filter(i=>i.t);
  return {F,srcs,num,nameOf};
}
function leadBlock(g,m){
  const L=g.lead;if(!L)return '';
  const top=m.F.items.slice(0,6);
  return `<div class="lead-grid"><article class="lead-story"><span class="kick">${esc(L.kicker)}</span><h2>${esc(L.headline)}</h2><p class="dek">${esc(L.dek)}</p>
  <ul>${L.points.map(p=>`<li>${fnMark(p,'fn')}</li>`).join('')}</ul><a class="lead-cta" href="#reg/updates">Read the full update</a></article>
  <aside class="latest"><h3>Latest headlines</h3><ol>${top.map(i=>`<li><a href="${esc(i.l)}" target="_blank" rel="noopener">${esc(i.t)}</a><span>${esc(m.nameOf(i))} · ${esc(fmtD(i.d))}</span></li>`).join('')||'<li class="muted">No headlines yet.</li>'}</ol><a class="more-link" href="#reg/feed">All headlines</a></aside></div>`;
}
function statusStrip(m,g){
  const ok=m.srcs.filter(s=>s.ok).length,tot=m.srcs.filter(s=>s.type!=='manual').length;
  return `<div class="strip"><span class="dot ${m.F.seed?'idle':'live'}"></span><span>${m.F.seed?'Feed starting up':`Monitoring ${tot} sources`}</span><span class="sep">|</span><span>Headlines refreshed ${esc(fmtT(m.F.generated)||'not yet')}</span><span class="sep">|</span><span>${ok} of ${tot} sources responded on the last check</span></div>`;
}
function newsStream(m){
  const {F,srcs,num,nameOf}=m;
  F.items.forEach(i=>idx('reg',i.t,nameOf(i),i.x,i.d));
  const names=[...new Set(F.items.map(nameOf))].filter(Boolean);
  const when=t=>t?fmtT(t):'not yet run';
  const fs=srcs.map((s,i)=>`<li id="r-fs${i+1}">${s.home?ext(s.home,s.name):esc(s.name)} <span class="muted">${s.type==='manual'?'added by hand':s.type==='fr_api'?'API':'RSS'}</span> ${s.ok===null?'<span class="pill muted">waiting for first run</span>':s.ok?`<span class="pill good">ok</span> <span class="muted">checked ${esc(when(s.checked))}${s.new?`, ${s.new} new`:''}</span>`:`<span class="pill bad">last check failed</span>${s.lastOk?` <span class="muted">last ok ${esc(when(s.lastOk))}</span>`:''}`}</li>`).join('');
  return `<section id="r-feed" class="sect"><div class="sect-h"><h2>Headlines</h2><p class="muted">Collected automatically and not reviewed. Treat them as leads and check the source.</p></div>
  <div class="tools" data-list="stream"><input type="search" class="tbl-search ls-q" placeholder="Search headlines…" aria-label="Search headlines"><div class="chips">${['All',...names].map((c,k)=>`<button class="chip${k?'':' on'}" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div><span class="count"></span></div>
  <ol class="stream" id="stream">${F.items.map(i=>`<li class="story" data-c="${esc(nameOf(i))}" data-t="${esc((i.t+' '+nameOf(i)+' '+(i.x||'')).toLowerCase())}"><time>${esc(fmtD(i.d))}</time><div><a class="hl" href="${esc(i.l)}" target="_blank" rel="noopener">${esc(i.t)}</a>${i.x?`<p>${esc(i.x)}</p>`:''}<span class="srcb">${esc(nameOf(i))}<sup class="fn"><a href="#reg/fs${num[i.s]||''}" data-fn="fs${num[i.s]||''}">${num[i.s]||'?'}</a></sup></span></div></li>`).join('')}</ol>
  <div class="empty" hidden>No headlines match.</div><button class="btn ghost more" hidden>Show more headlines</button>
  <h3 class="fnh">Where headlines come from</h3><ol class="fnlist">${fs}</ol>
  <div class="live"><button class="chip" id="fr-live">Check the Federal Register now</button> <span class="muted" id="fr-live-msg"></span><div id="fr-live-out"></div></div></section>`;
}
function vTimeline(g){
  const rows=g.timeline,ent=r=>r[1].trim().replace(/\s*\(.*$/,'');
  const ents=[...new Set(rows.map(ent))];
  const yr=r=>(/20\d\d/.exec(r[0])||['Earlier'])[0];
  let cur='';const out=rows.map(r=>{const y=yr(r);const h=y!==cur?(cur=y,`<li class="yr">${esc(y)}</li>`):'';return h+`<li class="ev" data-c="${esc(ent(r))}" data-t="${esc((r[0]+' '+r[1]+' '+r[2]+' '+(r[3]||'')).toLowerCase())}"><div class="dt">${esc(r[0])}</div><div class="who">${esc(r[1].trim())}</div><p>${esc(r[2])}</p>${r[4]?`<a class="srcl" href="${esc(r[4])}" target="_blank" rel="noopener">${esc(r[3]||'Source')}</a>`:r[3]?`<span class="muted">${esc(r[3])}</span>`:''}</li>`}).join('');
  return `<section id="r-timeline" class="sect"><div class="sect-h"><h2>Timeline</h2><p class="muted">Regulation, enforcement and litigation in date order.</p></div>
  <div class="tools" data-list="vt"><input type="search" class="tbl-search ls-q" placeholder="Search the timeline…" aria-label="Search the timeline"><select class="ls-sel" aria-label="Filter by agency or region"><option value="All">All agencies and regions</option>${ents.map(e=>`<option>${esc(e)}</option>`).join('')}</select><span class="count"></span></div>
  <ol class="vt" id="vt">${out}</ol><div class="empty" hidden>No events match.</div></section>`;
}
function initReg(root){
  $$('a[data-fn]',root).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const el=document.getElementById('r-'+a.dataset.fn);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}}));
  $$('.tools[data-list]',root).forEach(tools=>{
    const list=document.getElementById(tools.dataset.list),items=$$('li:not(.yr)',list),q=$('.ls-q',tools),sel=$('.ls-sel',tools),cnt=$('.count',tools),empty=tools.parentElement.querySelector('.empty'),more=tools.parentElement.querySelector('.more');
    let chip='All',all=false;const LIM=15;
    const run=()=>{const w=q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const c=sel?sel.value:chip;let n=0,shown=0;
      items.forEach(li=>{const ok=(c==='All'||li.dataset.c===c)&&w.every(x=>li.dataset.t.includes(x));if(ok)n++;const vis=ok&&(!more||all||w.length||c!=='All'||shown<LIM);if(vis&&ok)shown++;li.hidden=!vis});
      $$('li.yr',list).forEach(y=>{let e=y.nextElementSibling,any=false;while(e&&!e.classList.contains('yr')){if(!e.hidden)any=true;e=e.nextElementSibling}y.hidden=!any});
      cnt.textContent=n+' of '+items.length;if(empty)empty.hidden=n>0;if(more)more.hidden=all||n<=LIM||w.length>0||c!=='All'};
    q.addEventListener('input',run);sel&&sel.addEventListener('change',run);
    $$('.chip',tools).forEach(b=>b.addEventListener('click',()=>{$$('.chip',tools).forEach(x=>x.classList.remove('on'));b.classList.add('on');chip=b.dataset.v;run()}));
    more&&more.addEventListener('click',()=>{all=true;run()});run();
  });
  const b=$('#fr-live',root);if(!b)return;
  b.addEventListener('click',async()=>{
    const msg=$('#fr-live-msg',root),out=$('#fr-live-out',root);msg.textContent='Checking…';
    try{
      const q=['peptide compounding','bulk drug substances','de minimis'];const seen={},res=[];
      for(const t of q){const r=await fetch('https://www.federalregister.gov/api/v1/documents.json?order=newest&per_page=5&conditions[term]='+encodeURIComponent(t));if(!r.ok)throw new Error('HTTP '+r.status);
        (await r.json()).results.forEach(x=>{if(!seen[x.html_url]){seen[x.html_url]=1;res.push(x)}})}
      res.sort((a,b)=>b.publication_date.localeCompare(a.publication_date));
      out.innerHTML='<div class="grid g2" style="margin:10px 0">'+res.slice(0,8).map(x=>linkCard(x.html_url,x.title,x.publication_date+' · Federal Register')).join('')+'</div>';
      msg.textContent='Live results from federalregister.gov, '+new Date().toLocaleTimeString();
    }catch(e){msg.textContent='Could not reach the Federal Register from this browser ('+e.message+'). The scheduled feed still updates.'}
  });
}
R.reg=()=>{
  const g=D.reg,m=feedModel();
  if(g.alert){idx('reg',g.alert.title,g.alert.intro);g.alert.claims.forEach(c=>idx('reg',c[0],c[1],c[2]))}
  g.timeline.forEach(r=>idx('reg',r[0]+' — '+r[1],r[2],r[3]));g.status.forEach(r=>idx('reg',r[0],r[1],r[2],r[4]));
  g.article.forEach(a=>a.x&&idx('reg','PCAC July 2026',a.x));
  if(g.updates){g.updates.blocks.forEach(b=>idx('reg',g.updates.title,b.x.replace(/\[\^\d+\]/g,'')));g.updates.footnotes.forEach(f=>idx('reg',f.label,f.pub,f.url))}
  const art=g.article.map(a=>{
    if(a.t==='h')return `<h3>${esc(a.x)}</h3>`;
    if(a.t==='score')return `<div class="tw" style="margin:14px 0">${'<table><thead><tr>'+g.scoreHdr.map(h=>`<th class="nosort">${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+g.score.map(r=>`<tr><td class="name">${esc(r[0])}</td><td class="mono">${esc(r[1])}</td><td><span class="pill ${r[2]==='Include'?'good':'bad'}">${esc(r[2])}</span></td></tr>`).join('')+'</tbody></table>'}</div>`;
    return `<p>${a.u?ext(a.u):urlize(a.x)}</p>`;
  }).join('');
  return `<div class="masthead"><div class="mh-top"><h1>Regulation Info</h1><span class="upd">Page reviewed ${esc(g.updated)}</span></div>${statusStrip(m,g)}<p class="lead">${urlize(g.intro)}</p></div>
  ${leadBlock(g,m)}
  <div class="subnav tabs" data-spy>${g.alert?'<a href="#reg/alert">Import alert</a>':''}<a href="#reg/updates">Analysis</a><a href="#reg/feed">Headlines</a><a href="#reg/timeline">Timeline</a><a href="#reg/status">Peptide status</a><a href="#reg/pcac">July 2026 vote</a></div>
  ${alertCard(g.alert)}
  ${updatesCard(g.updates)}
  ${newsStream(m)}
  ${vTimeline(g)}
  <section id="r-status" class="sect"><div class="sect-h"><h2>FDA status by peptide</h2></div>
   ${table({cols:[{h:g.statusHdr[0],f:r=>esc(r[0]),cls:'name',s:r=>r[0]},{h:g.statusHdr[1],f:r=>`<span class="pill ${statCls(r[1])}">${esc(r[1])}</span>`,s:r=>r[1]},{h:g.statusHdr[2],f:r=>esc(r[2]),s:r=>r[2]},{h:g.statusHdr[3],f:r=>esc(r[3]),s:r=>r[3]},{h:g.statusHdr[4],f:r=>esc(r[4]),s:r=>r[4]}],rows:g.status,chip:{get:r=>r[1]},searchPh:'Search peptides…'})}
   ${fig('pcac-peptide-table.jpg','Table of peptides, health uses and outcome from the PCAC review','Peptide, health uses and outcome summary (image from the guide).')}</section>
  <section id="r-pcac" class="sect prose"><div class="sect-h"><h2>FDA advisory committee review (July 2026)</h2></div>${art}</section>`;
};

/* ----- forums ----- */
R.forums=()=>{
  const f=D.forums;f.articles.forEach(a=>idx('forums',a.title,a.site,a.date,a.summary));f.communities.forEach(c=>idx('forums',c.name,c.desc));f.videos.forEach(v=>idx('forums',v.title,v.url));
  return head('Forums, Articles, etc.',f.updated,f.intro)+`
  <div class="subnav" data-spy><a href="#forums/articles">Articles</a><a href="#forums/communities">Communities</a><a href="#forums/videos">Videos & links</a></div>
  <div id="f-articles"><h2>${esc(f.title)}</h2>
   <div class="tools" data-tbl="ft" data-custom><input type="search" class="tbl-search" placeholder="Search articles…"><span class="count"></span></div>
   <table id="ft" hidden><tbody>${f.articles.map(a=>`<tr data-t="${esc((a.title+' '+a.site+' '+a.date+' '+a.summary).toLowerCase())}"></tr>`).join('')}</tbody></table>
   <div class="grid g2" id="f-grid">${f.articles.map(a=>`<article class="art"><span class="num">#${a.n}</span><h4>${esc(a.title)}</h4><div class="meta"><span>🌐 ${esc(a.site)}</span><span>📅 ${esc(a.date)}</span></div><p style="margin:4px 0">${esc(a.summary)}</p><div>${a.url?ext(a.url,a.linkText||host(a.url)):esc(a.linkText)}</div></article>`).join('')}</div><div class="empty" hidden>No matches.</div></div>
  <div id="f-communities" style="margin-top:32px"><h2>${esc(f.commTitle)}</h2><p class="lead">${esc(f.commIntro)}</p>
   <div class="grid g2">${f.communities.map(c=>`<div class="art"><h4>${ext(c.url,c.name)}</h4><p style="margin:0">${esc(c.desc)}</p></div>`).join('')}</div></div>
  <div id="f-videos" style="margin-top:32px"><h2>${esc(f.videosTitle)}</h2><div class="grid g2">${f.videos.map(v=>linkCard(v.url,v.title.trim()+' ▶')).join('')}</div>
   <h2 style="margin-top:28px">More reading</h2><div class="grid g2">${f.otherLinks.map(u=>linkCard(u)).join('')}</div></div>`;
};
function initForums(root){
  const tools=$('.tools[data-tbl=ft]',root);if(!tools)return;const q=$('input',tools),cnt=$('.count',tools);
  const cards=$$('#f-grid .art',root),rows=$$('#ft tbody tr',root);
  const run=()=>{const w=q.value.toLowerCase().split(/\s+/).filter(Boolean);let n=0;cards.forEach((c,i)=>{const ok=w.every(x=>rows[i].dataset.t.includes(x));c.hidden=!ok;if(ok)n++});cnt.textContent=n+' of '+cards.length;$('.empty',root).hidden=n>0};
  q.addEventListener('input',run);run();
}

/* ----- small sheets ----- */
R.nutrition=()=>{const n=D.nutrition;n.items.forEach(i=>idx('nutrition',i.name,i.url));return head('Nutrition',n.updated,'Nutritional information and guidelines.')+`<div class="grid g3">${n.items.map(i=>linkCard(i.url,i.name,'Sam\u2019s Club')).join('')}</div>`};
R.medical=()=>{const m=D.medical;m.links.forEach(u=>idx('medical',host(u),u));return head('Medical',m.updated,'Information regarding medical use.')+`<div class="card"><h3>${esc(m.label)}</h3><div class="grid g3">${linkCard(m.links[0])}</div></div><div class="card"><h3>${esc(m.test)}</h3><div class="grid g2">${linkCard(m.links[1],'Smart scales vs DEXA: what actually matters')}</div></div>`};
R.roadmap=()=>{const r=D.roadmap;idx('roadmap','Roadmap',r.request,...r.comments);return head('Roadmap',r.updated,'Future updates and additions to the guide.')+`
  <div class="card"><div class="meta" style="color:var(--muted);font-size:13px">${esc(r.date)} · <b>${esc(r.author)}</b></div><h3 style="margin-top:6px">Feature request</h3><p>${esc(r.request)}</p>
  <h4>${esc(r.commentsTitle.trim())}</h4>${r.comments.map(c=>`<p>${esc(c)}</p>`).join('')}
  <div class="callout good"><p>Implemented on this site: see the <a href="#halflife/sim">Half-Life level simulator</a>.</p></div></div>`};
R.links=()=>{const m=D.master;m.links.forEach(u=>idx('links',host(u),u));return head('Extra Links',m.updated,'Additional links and notes carried over from the guide\u2019s working sheets.')+`
  <div class="grid g3">${m.links.map(u=>linkCard(u)).join('')}</div>
  <div class="card" style="margin-top:20px"><h3>Working-sheet notes</h3><p>Section labels from the working sheet: ${m.misc.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</p>
  <p style="font-size:13px;color:var(--muted)">Peptide Crafters price sheet columns (empty in the source): ${D.crafters.hdr.map(esc).join(' · ')}</p></div>`};

/* ---------- shell ---------- */
const main=$('#main'),nav=$('#nav');
nav.innerHTML=SECTIONS.map(s=>s.sep?`<div class="sep">${s.sep}</div>`:`<a href="#${s.id}" data-id="${s.id}"><span class="ic">${s.ic}</span>${s.name}</a>`).join('');
const rendered={};
function show(id,sub){
  if(!R[id])id='home';
  if(!rendered[id]){
    const sec=document.createElement('section');sec.className='sec';sec.id='sec-'+id;sec.innerHTML=R[id]();main.appendChild(sec);rendered[id]=sec;
    wireTables(sec);
    ({dosage:initDosage,halflife:initHalf,supply:initSupply,forums:initForums,reg:initReg})[id]?.(sec);
    $$('a[data-tab]',sec).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();location.hash=a.getAttribute('href')}));
  }
  $$('.sec').forEach(s=>s.classList.toggle('on',s===rendered[id]));
  $$('nav a').forEach(a=>a.classList.toggle('on',a.dataset.id===id));
  const sec=rendered[id];
  // tabs (terminology)
  const tabs=$('[data-tabs]',sec);
  if(tabs){const k=sub||'slang';$$('a',tabs).forEach(a=>a.classList.toggle('on',a.dataset.tab===k));$$('.tabpane',sec).forEach(p=>p.classList.toggle('on',p.dataset.pane===k))}
  document.title=(SECTIONS.find(s=>s.id===id)||{}).name+' · Body Harmony';
  if(pending){const inp=$('.tbl-search',sec.querySelector('.tabpane.on')||sec);if(inp){inp.value=pending;inp.dispatchEvent(new Event('input'))}pending=''}
  if(sub&&!tabs){const el=$('#'+({dosage:'d-',halflife:'h-',reg:'r-',forums:'f-'}[id]||'x-')+sub,sec);if(el)setTimeout(()=>el.scrollIntoView({block:'start'}),60)}
  else window.scrollTo(0,0);
  $('#nav').classList.remove('open');
}
let pending='';
function route(){const [id,sub]=(location.hash.slice(1)||'home').split('/');show(id,sub)}
addEventListener('hashchange',route);
// pre-render all sections once so the global search index is complete
SECTIONS.forEach(s=>{if(s.id&&!rendered[s.id]){const sec=document.createElement('section');sec.className='sec';sec.id='sec-'+s.id;sec.innerHTML=R[s.id]();main.appendChild(sec);rendered[s.id]=sec;wireTables(sec);({dosage:initDosage,halflife:initHalf,supply:initSupply,forums:initForums,reg:initReg})[s.id]?.(sec);$$('a[data-tab]',sec).forEach(a=>a.addEventListener('click',e=>{e.preventDefault();location.hash=a.getAttribute('href')}))}});
route();

/* ---------- global search ---------- */
const gs=$('#gs'),res=$('#results');let sel=-1;
const nameOf=id=>(SECTIONS.find(s=>s.id===id)||{}).name;
function hl(t,words){let s=esc(t);words.forEach(w=>{s=s.replace(new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>')});return s}
function doSearch(){
  const words=gs.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length){res.classList.remove('open');return}
  const hits=searchIndex.filter(i=>words.every(w=>i.lc.includes(w)));
  const by={};hits.forEach(h=>(by[h.sec]=by[h.sec]||[]).push(h));
  let html='';
  SECTIONS.filter(s=>by[s.id]).forEach(s=>{
    html+=`<div class="grp">${s.name} · ${by[s.id].length}</div>`;
    html+=by[s.id].slice(0,6).map(h=>{const i=h.text.toLowerCase().indexOf(words[0]);const sn=h.text.slice(Math.max(0,i-30),i+90);return `<a class="hit" href="#${s.id}" data-q="${esc(gs.value.trim())}" data-sec="${s.id}"><b>${hl(h.label,words)}</b><span>${hl(sn,words)}</span></a>`}).join('');
    if(by[s.id].length>6)html+=`<a class="hit" href="#${s.id}" data-q="${esc(gs.value.trim())}" data-sec="${s.id}"><span>+ ${by[s.id].length-6} more in ${s.name} →</span></a>`;
  });
  res.innerHTML=html||'<div class="none">No results.</div>';res.classList.add('open');sel=-1;
}
gs.addEventListener('input',doSearch);
gs.addEventListener('focus',doSearch);
res.addEventListener('click',e=>{const a=e.target.closest('a.hit');if(!a)return;pending=a.dataset.q;res.classList.remove('open');
  if(location.hash.slice(1).split('/')[0]===a.dataset.sec){e.preventDefault();show(a.dataset.sec)}});
document.addEventListener('click',e=>{if(!e.target.closest('.gsearch'))res.classList.remove('open')});
gs.addEventListener('keydown',e=>{
  const items=$$('a.hit',res);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((x,i)=>x.classList.toggle('sel',i===sel));items[sel]?.scrollIntoView({block:'nearest'})}
  else if(e.key==='Enter'){const a=items[sel>=0?sel:0];if(a)a.click(),(location.hash=a.getAttribute('href'))}
  else if(e.key==='Escape'){res.classList.remove('open');gs.blur()}
});
document.addEventListener('keydown',e=>{if((e.key==='/'||(e.key==='k'&&(e.ctrlKey||e.metaKey)))&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();gs.focus();gs.select()}});

/* ---------- misc ui ---------- */
$('#themeBtn').addEventListener('click',()=>{const r=document.documentElement,n=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('pg-theme',n)}catch(e){}});
$('#menuBtn').addEventListener('click',()=>$('#nav').classList.toggle('open'));
const lb=$('#lightbox');
document.addEventListener('click',e=>{const i=e.target.closest('img[data-zoom]');if(i){$('img',lb).src=i.src;lb.classList.add('open')}else if(e.target.closest('#lightbox'))lb.classList.remove('open')});
addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('open')});
})();
