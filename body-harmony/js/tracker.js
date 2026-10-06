/* Body Harmony: dose & vial tracker (Phase 1, local-only).
   Everything is stored in this browser under one namespaced key. Nothing is sent anywhere.
   Math lives in dose-math.js. The Dosage page calls Tracker.html() and Tracker.init(root, ctx). */
(function(){
'use strict';
const M=window.DoseMath;
const KEY='bh.tracker.v1';
const DOW=['S','M','T','W','T','F','S'];
let mem=null; // fallback when storage is blocked

const load=()=>{
  let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}
  if(raw==null&&mem)return mem;
  try{const s=JSON.parse(raw);if(s&&typeof s.profiles==='object'&&s.profiles)return s}catch(e){}
  return {v:1,profiles:{}};
};
const save=s=>{mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}};
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const num=(v,d)=>{const n=parseFloat(v);return isFinite(n)?n:d};
const isDate=s=>typeof s==='string'&&isFinite(M.parse(s));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);

/* Default schedule guessed from the guide's frequency text. The user can change it. */
function guessSched(freq,start){
  const f=String(freq||'').toLowerCase();
  if(/every other day|eod/.test(f))return {type:'eod',days:[1,4],every:3,start};
  if(/(twice|2\s*x?)\s*(a |per |\/)?\s*week|2x\/?w/.test(f))return {type:'days',days:[1,4],every:3,start};
  if(/week/.test(f))return {type:'weekly',days:[1,4],every:3,start};
  return {type:'daily',days:[1,4],every:3,start};
}
const newProfile=(freq)=>({sched:guessSched(freq,todayStr()),sites:['Left abdomen','Right abdomen','Left thigh','Right thigh'],reconDate:'',budDays:28,vialId:'v0',log:[]});

function html(){return `
<div id="d-tracker" class="card"><h2>Dose &amp; vial tracker</h2>
 <p class="lead">Follows whichever peptide, dose, vial and BAC water you picked in the calculator above. Set a schedule, log each dose, and see when the vial runs out and what the level curve looks like.</p>
 <div class="callout warn disclaimer"><p><b>Stored only in this browser.</b> Nothing is uploaded and there are no accounts. Clearing site data erases it, so use Export to keep a copy. This tool does arithmetic on the numbers you enter. It does not recommend doses and is not medical advice.</p></div>
 <div id="t-none" class="callout bad" hidden><b>Enter a dose first.</b> Pick a peptide with a baseline dose, a desired dose, or a custom dose in the calculator above.</div>
 <div class="calc" id="t-main">
  <div>
   <p id="t-using" class="lead" style="margin-top:0"></p>
   <div class="frow">
    <div class="field"><label for="t-type">Schedule</label><select id="t-type"><option value="daily">Daily</option><option value="eod">Every other day</option><option value="days">Specific weekdays</option><option value="weekly">Weekly</option><option value="interval">Every N days</option></select></div>
    <div class="field"><label for="t-start">Schedule start date</label><input id="t-start" type="date"></div>
   </div>
   <div class="field" id="t-daysw" hidden><label>Weekdays</label><div class="chips" id="t-days">${DOW.map((l,i)=>`<label class="chip" style="cursor:pointer"><input type="checkbox" value="${i}" style="margin-right:4px">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</label>`).join('')}</div></div>
   <div class="field" id="t-everyw" hidden><label for="t-every">Every N days</label><input id="t-every" type="number" min="1" max="60" step="1"></div>
   <div class="frow">
    <div class="field"><label for="t-recon">Vial reconstituted on</label><input id="t-recon" type="date"></div>
    <div class="field"><label for="t-bud">Beyond-use days</label><input id="t-bud" type="number" min="1" max="120" step="1"></div>
   </div>
   <div class="field"><label for="t-sites">Injection site rotation <small>(comma separated, in order)</small></label><input id="t-sites" type="text" placeholder="Left abdomen, Right abdomen, ..."></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="chip" id="t-newvial" type="button">Start a new vial today</button></div>
  </div>
  <div>
   <div class="result"><div class="sub">Next dose</div><div class="big" id="t-next" style="font-size:2rem">—</div><div class="sub" id="t-rel"></div></div>
   <div class="frow" style="margin-top:12px">
    <div class="field"><label for="t-ldate">Dose taken on</label><input id="t-ldate" type="date"></div>
    <div class="field"><label for="t-lsite">Site</label><select id="t-lsite"></select></div>
   </div>
   <div class="frow">
    <div class="field"><label for="t-ldose">Dose (mcg) <small>blank = calculator</small></label><input id="t-ldose" type="number" min="0" step="any"></div>
    <div class="field" style="align-self:end"><button class="chip on" id="t-log" type="button" style="width:100%;padding:10px">Log dose</button></div>
   </div>
   <div id="t-warn"></div>
   <dl class="kv" id="t-kv"></dl>
  </div>
 </div>
 <h3 style="margin-top:22px">Estimated level</h3>
 <div id="t-pk"></div>
 <h3 style="margin-top:22px">History</h3>
 <div id="t-hist"></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
  <button class="chip" id="t-ics" type="button">Download calendar (.ics)</button>
  <button class="chip" id="t-expj" type="button">Export JSON</button>
  <button class="chip" id="t-expc" type="button">Export CSV</button>
  <button class="chip" id="t-imp" type="button">Import JSON</button>
  <button class="chip" id="t-clr" type="button">Clear this peptide</button>
  <button class="chip" id="t-clrall" type="button">Clear all tracker data</button>
  <input id="t-file" type="file" accept="application/json,.json" hidden>
 </div>
 <p id="t-msg" style="font-size:13px;color:var(--muted);margin:8px 0 0" role="status"></p>
</div>`}

function init(root,ctx){
  const $i=id=>root.querySelector('#'+id);if(!$i('t-type'))return;
  const {esc,fmtNum,parseHours,findHalf}=ctx;
  let state=load(),name=null,calc=null;
  const prof=()=>state.profiles[name];
  const msg=t=>{$i('t-msg').textContent=t||''};
  const dl=(fn,type,text)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
  const slug=s=>String(s).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'peptide';

  function lastLogged(p){return p.log.reduce((m,l)=>l.date>m?l.date:m,'')||null}
  function schedOf(p){const s=p.sched;return {type:s.type,days:s.days,every:s.every,start:isDate(s.start)?s.start:todayStr()}}

  function syncForm(){
    const p=prof(),s=p.sched;
    $i('t-type').value=s.type;$i('t-start').value=s.start;$i('t-every').value=s.every;
    root.querySelectorAll('#t-days input').forEach(c=>{c.checked=(s.days||[]).includes(+c.value)});
    $i('t-recon').value=p.reconDate||'';$i('t-bud').value=p.budDays;$i('t-sites').value=p.sites.join(', ');
    $i('t-daysw').hidden=s.type!=='days';$i('t-everyw').hidden=s.type!=='interval';
    $i('t-ldate').value=todayStr();
  }
  function siteOptions(){
    const p=prof(),sel=$i('t-lsite'),planned=M.siteFor(p.sites,p.log.length);
    const cur=sel.value;const opts=p.sites.slice();if(!opts.length)opts.push('');
    sel.innerHTML=opts.map(o=>`<option value="${esc(o)}">${esc(o||'(none)')}</option>`).join('');
    sel.value=opts.includes(cur)&&cur?cur:planned;
  }

  function render(){
    const none=!(calc&&calc.doseMcg>0&&calc.vialMg>0&&calc.bacMl>0);
    $i('t-none').hidden=!none;$i('t-main').hidden=none;
    ['t-pk','t-hist'].forEach(i=>{$i(i).hidden=none});
    if(none){$i('t-pk').innerHTML='';$i('t-hist').innerHTML='';return}
    const p=prof(),s=schedOf(p),today=todayStr();
    $i('t-using').innerHTML=`<b>${esc(calc.name)}</b> · ${fmtNum(calc.doseMcg,2)} mcg per dose · ${fmtNum(calc.vialMg,2)} mg vial in ${fmtNum(calc.bacMl,2)} mL`;
    const vm=M.vialMath(calc);
    const used=p.log.filter(l=>l.vialId===p.vialId).length,left=Math.max(0,vm.dosesPerVial-used);
    const next=M.nextDose(s,lastLogged(p));
    const rel=!next?'No dates match this schedule. Pick at least one weekday.':(()=>{const d=M.diffDays(today,next);return d===0?'today':d===1?'tomorrow':d>1?`in ${d} days`:`overdue by ${-d} day${d===-1?'':'s'}`})();
    $i('t-next').textContent=next?new Date(M.parse(next)).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}):'—';
    const planned=M.siteFor(p.sites,p.log.length);$i('t-rel').textContent=rel+(next&&planned?' · '+planned:'');
    const life=M.vialLife({s,next,dosesLeft:left,reconDate:isDate(p.reconDate)?p.reconDate:null,budDays:p.budDays});
    const long=d=>d?new Date(M.parse(d)).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'—';
    let w='';
    if(vm.unitsPerDose>100)w+=`<div class="callout bad"><b>Dose exceeds a 1 mL syringe</b> (${fmtNum(vm.unitsPerDose,1)} units). Adjust the calculator.</div>`;
    if(left===0)w+=`<div class="callout warn"><b>This vial is used up.</b> Start a new vial when you open the next one.</div>`;
    else if(life.budBeforeEmpty)w+=`<div class="callout warn"><b>Beyond-use date comes first.</b> Only ${life.dosesBeforeBud} of the ${left} remaining doses fall on or before ${long(life.budDate)}. Check the storage guidance and your clinician or pharmacist before using later doses.</div>`;
    $i('t-warn').innerHTML=w;
    $i('t-kv').innerHTML=`<dt>Concentration</dt><dd>${fmtNum(vm.concMcgPerMl/1000,3)} mg/mL</dd><dt>Per dose</dt><dd>${fmtNum(vm.unitsPerDose,2)} units (${fmtNum(vm.mlPerDose,3)} mL)</dd><dt>Doses in a full vial</dt><dd>${vm.dosesPerVial}</dd><dt>Logged from this vial</dt><dd>${used} · ${left} left</dd><dt>Projected last dose</dt><dd>${life.lastDose?long(life.lastDose):'—'}</dd><dt>Beyond-use date</dt><dd>${life.budDate?long(life.budDate):'set a reconstitution date'}</dd>`;
    siteOptions();
    renderPK(p,s,next,today);renderHist(p);
  }

  function renderPK(p,s,next,today){
    const box=$i('t-pk'),row=findHalf(calc.name);
    if(!row){box.innerHTML=`<div class="callout"><p>No half-life estimate in the guide for ${esc(calc.name)}, so no level curve is drawn.</p></div>`;return}
    const hl=parseHours(row[1]),hlE=parseHours(row[2]);
    const basis=box._basis||'1';const hours=basis==='1'?hl:hlE;
    const sel=`<div class="field" style="max-width:320px"><label for="t-basis">Half-life basis</label><select id="t-basis"><option value="1"${basis==='1'?' selected':''}>Plasma: ${esc(row[1])}</option><option value="2"${basis==='2'?' selected':''}>Effect duration: ${esc(row[2])}</option></select></div>`;
    if(!(hours>0)){box.innerHTML=sel+`<div class="callout"><p>The guide's value for this basis (${esc(basis==='1'?row[1]:row[2])}) is not a number of hours, so no curve is drawn. Try the other basis.</p></div>`;bindBasis(box);return}
    const from=M.addDays(today,-14),to=M.addDays(today,42);
    const actual=p.log.map(l=>({d:l.date,w:calc.doseMcg>0?l.doseMcg/calc.doseMcg:1}));
    const proj=next?M.dates(s,next,80).filter(d=>d<=to).map(d=>({d,w:1})):[];
    const all=actual.concat(proj),t0=M.parse(from),T=(M.parse(to)-t0)/3600000,step=hours<12?1:hours<72?3:6;
    const pts=[];let max=0;
    for(let t=0;t<=T;t+=step){let y=0;for(const x of all)y+=x.w*M.single(t-(M.parse(x.d)-t0)/3600000,hours);pts.push([t,y]);if(y>max)max=y}
    max=Math.max(max,1);
    const W=640,H=300,L=46,B=30,Tp=12,R=12,pw=W-L-R,ph=H-B-Tp,X=t=>L+t/T*pw,Y=y=>Tp+ph-y/max*ph;
    let g='';for(let i=0;i<=4;i++){const y=Tp+ph*i/4;g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L-6}" y="${y+4}" text-anchor="end">${fmtNum(max*(1-i/4),1)}</text>`}
    for(let i=0;i<=8;i++){const t=T*i/8,d=M.addDays(from,Math.round(t/24));g+=`<text x="${X(t)}" y="${H-9}" text-anchor="middle">${d.slice(5)}</text>`}
    const path='M'+pts.map(q=>X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1)).join('L');
    const xt=d=>X((M.parse(d)-t0)/3600000);
    const ticks=actual.filter(x=>x.d>=from&&x.d<=to).map(x=>`<circle cx="${xt(x.d)}" cy="${Y(0)}" r="4" fill="var(--accent)"/>`).join('')+proj.map(x=>`<circle cx="${xt(x.d)}" cy="${Y(0)}" r="3.5" fill="var(--surface)" stroke="var(--accent)"/>`).join('');
    const tx=xt(today);
    box.innerHTML=sel+`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated relative level over time">${g}<path d="${path}L${X(T)},${Y(0)}L${X(0)},${Y(0)}Z" fill="var(--accent)" opacity=".12"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/><line x1="${tx}" x2="${tx}" y1="${Tp}" y2="${Tp+ph}" stroke="var(--muted)" stroke-dasharray="4 3"/><text x="${tx+4}" y="${Tp+12}">today</text>${ticks}</svg>
    <p style="font-size:13px;color:var(--muted);margin:6px 0 0">Illustrative, not a measurement. 1.0 = the amount of one full dose in the body, using a ${esc(fmtNum(hours,2))} hour half-life from the guide and a simple absorb-then-clear model. Filled dots are logged doses, hollow dots are scheduled ones. Real levels vary by person, product and injection.</p>`;
    bindBasis(box);
  }
  function bindBasis(box){const b=box.querySelector('#t-basis');if(b)b.addEventListener('change',()=>{box._basis=b.value;render()})}

  function renderHist(p){
    const rows=p.log.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
    $i('t-hist').innerHTML=rows.length?`<div class="tw"><table><thead><tr><th class="nosort">Date</th><th class="nosort">Dose</th><th class="nosort">Site</th><th class="nosort">Vial</th><th class="nosort"></th></tr></thead><tbody>${rows.map(l=>`<tr><td>${esc(l.date)}</td><td>${fmtNum(l.doseMcg,2)} mcg</td><td>${esc(l.site||'')}</td><td>${esc(l.vialId)}</td><td><button class="chip" type="button" data-del="${esc(l.id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`:`<p style="color:var(--muted)">No doses logged for ${esc(calc.name)} yet.</p>`;
    $i('t-hist').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{p.log=p.log.filter(l=>l.id!==b.dataset.del);save(state);render()}));
  }

  /* ---- events ---- */
  function commit(){save(state);render()}
  $i('t-type').addEventListener('change',()=>{const p=prof();p.sched.type=$i('t-type').value;$i('t-daysw').hidden=p.sched.type!=='days';$i('t-everyw').hidden=p.sched.type!=='interval';commit()});
  $i('t-start').addEventListener('change',()=>{if(isDate($i('t-start').value)){prof().sched.start=$i('t-start').value;commit()}});
  $i('t-every').addEventListener('input',()=>{prof().sched.every=Math.max(1,Math.min(60,Math.round(num($i('t-every').value,3))));commit()});
  root.querySelectorAll('#t-days input').forEach(c=>c.addEventListener('change',()=>{prof().sched.days=[...root.querySelectorAll('#t-days input:checked')].map(x=>+x.value);commit()}));
  $i('t-recon').addEventListener('change',()=>{prof().reconDate=isDate($i('t-recon').value)?$i('t-recon').value:'';commit()});
  $i('t-bud').addEventListener('input',()=>{prof().budDays=Math.max(1,Math.min(120,Math.round(num($i('t-bud').value,28))));commit()});
  $i('t-sites').addEventListener('input',()=>{prof().sites=$i('t-sites').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);commit()});
  $i('t-newvial').addEventListener('click',()=>{const p=prof();p.vialId='v'+(p.log.length?String(p.log.length+1):'1')+'-'+uid().slice(0,3);p.reconDate=todayStr();syncForm();commit();msg('New vial started. Counting from zero doses.')});
  $i('t-log').addEventListener('click',()=>{
    const p=prof(),d=$i('t-ldate').value;if(!isDate(d)){msg('Pick the date the dose was taken.');return}
    const dose=num($i('t-ldose').value,calc.doseMcg);if(!(dose>0)){msg('Dose must be above zero.');return}
    p.log.push({id:uid(),date:d,doseMcg:dose,site:$i('t-lsite').value,vialId:p.vialId});
    $i('t-ldose').value='';commit();msg('Logged.');
  });
  $i('t-ics').addEventListener('click',()=>{
    const p=prof(),s=schedOf(p),next=M.nextDose(s,lastLogged(p));if(!next||!calc){msg('Nothing to export yet.');return}
    dl(`bodyharmony-${slug(calc.name)}.ics`,'text/calendar',M.ics({name:calc.name,dates:M.dates(s,next,60),sites:p.sites,siteStart:p.log.length,doseLabel:fmtNum(calc.doseMcg,2)+' mcg'}));
    msg('Calendar file downloaded with the next 60 scheduled doses. Dates are all-day events.');
  });
  $i('t-expj').addEventListener('click',()=>{dl('bodyharmony-tracker.json','application/json',JSON.stringify(state,null,1));msg('Exported all peptides.')});
  const csvCell=v=>{let t=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return /[",\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t};
  $i('t-expc').addEventListener('click',()=>{
    const rows=[['peptide','date','dose_mcg','site','vial']];
    Object.entries(state.profiles).forEach(([n,p])=>p.log.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(l=>rows.push([n,l.date,l.doseMcg,l.site,l.vialId])));
    dl('bodyharmony-dose-log.csv','text/csv',rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n');msg('Exported the dose log for all peptides.');
  });
  $i('t-imp').addEventListener('click',()=>$i('t-file').click());
  $i('t-file').addEventListener('change',()=>{
    const f=$i('t-file').files[0];if(!f)return;
    if(f.size>2e6){msg('That file is too large to be a tracker export.');return}
    f.text().then(t=>{
      let o;try{o=JSON.parse(t)}catch(e){msg('Not a valid JSON file.');return}
      if(!o||typeof o.profiles!=='object'||!o.profiles){msg('That file is not a Body Harmony tracker export.');return}
      const clean={v:1,profiles:{}};
      for(const [n,p] of Object.entries(o.profiles).slice(0,200)){
        if(!p||typeof p!=='object'||!p.sched)continue;
        const s=p.sched,ok=['daily','eod','days','weekly','interval'];
        clean.profiles[String(n).slice(0,80)]={
          sched:{type:ok.includes(s.type)?s.type:'daily',days:Array.isArray(s.days)?s.days.map(Number).filter(x=>x>=0&&x<=6):[1,4],every:Math.max(1,Math.min(60,Math.round(num(s.every,3)))),start:isDate(s.start)?s.start:todayStr()},
          sites:Array.isArray(p.sites)?p.sites.map(x=>String(x).slice(0,60)).slice(0,20):[],
          reconDate:isDate(p.reconDate)?p.reconDate:'',budDays:Math.max(1,Math.min(120,Math.round(num(p.budDays,28)))),vialId:String(p.vialId||'v0').slice(0,24),
          log:(Array.isArray(p.log)?p.log:[]).filter(l=>l&&isDate(l.date)&&num(l.doseMcg,0)>0).slice(0,5000).map(l=>({id:String(l.id||uid()).slice(0,20),date:l.date,doseMcg:+l.doseMcg,site:String(l.site||'').slice(0,60),vialId:String(l.vialId||'v0').slice(0,24)}))};
      }
      state=clean;save(state);if(calc&&!state.profiles[calc.name])state.profiles[calc.name]=newProfile(calc.freq);syncForm();render();msg(`Imported ${Object.keys(clean.profiles).length} peptide(s). This replaced the data in this browser.`);
    }).finally(()=>{$i('t-file').value=''});
  });
  $i('t-clr').addEventListener('click',()=>{if(!calc||!confirm(`Clear the schedule and ${prof().log.length} logged dose(s) for ${calc.name}?`))return;state.profiles[name]=newProfile(calc.freq);save(state);syncForm();render();msg('Cleared.')});
  $i('t-clrall').addEventListener('click',()=>{if(!confirm('Clear ALL tracker data for every peptide in this browser?'))return;state={v:1,profiles:{}};try{localStorage.removeItem(KEY)}catch(e){}mem=null;if(calc){state.profiles[calc.name]=newProfile(calc.freq);name=calc.name}syncForm();render();msg('All tracker data cleared.')});

  /* ---- calculator link ---- */
  root.addEventListener('bh-calc',e=>{
    calc=e.detail;const changed=calc.name!==name;name=calc.name;
    if(!state.profiles[name]){state.profiles[name]=newProfile(calc.freq);save(state)}
    if(changed){$i('t-pk')._basis=null;syncForm()}
    render();
  });
  if(root._calc){root.dispatchEvent(new CustomEvent('bh-calc',{detail:root._calc}))}
}
window.Tracker={html,init};
})();
