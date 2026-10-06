/* Body Harmony dose math. Pure functions: no DOM, no storage, no network, no PHI.
   Dates are 'YYYY-MM-DD' strings handled in UTC so DST never shifts a day.
   Shared shape so the member portal can reuse the same module. */
(function(root){
'use strict';
const DAY=86400000;
const pad=n=>String(n).padStart(2,'0');
const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(!m)return NaN;return Date.UTC(+m[1],+m[2]-1,+m[3])};
const fmt=ms=>{const d=new Date(ms);return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())};
const addDays=(s,n)=>fmt(parse(s)+n*DAY);
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/DAY);
const weekday=s=>new Date(parse(s)).getUTCDay(); // 0 = Sunday

/* Vial: concentration, units per dose (U-100 syringe), doses in a full vial. */
function vialMath({vialMg,bacMl,doseMcg}){
  const conc=vialMg*1000/bacMl;               // mcg per mL
  const units=doseMcg/conc*100;               // U-100 units
  const doses=doseMcg>0?Math.floor(vialMg*1000/doseMcg+1e-9):0;
  return {concMcgPerMl:conc,unitsPerDose:units,mlPerDose:units/100,dosesPerVial:doses};
}

/* Schedule: {type:'daily'|'eod'|'weekly'|'days'|'interval', days:[0-6], every:n, start:'YYYY-MM-DD'} */
function isDue(s,date){
  const off=diffDays(s.start,date);
  if(off<0)return false;
  switch(s.type){
    case 'daily':return true;
    case 'eod':return off%2===0;
    case 'interval':return off%Math.max(1,s.every|0||1)===0;
    case 'weekly':return off%7===0;
    case 'days':return (s.days||[]).includes(weekday(date));
    default:return false;
  }
}
/* First scheduled date on or after `from`. */
function onOrAfter(s,from){
  let d=diffDays(s.start,from)<0?s.start:from;
  for(let i=0;i<800;i++,d=addDays(d,1))if(isDue(s,d))return d;
  return null;
}
/* Next n scheduled dates on or after `from`. */
function dates(s,from,n){
  const out=[];let d=onOrAfter(s,from);
  while(d&&out.length<n){out.push(d);d=onOrAfter(s,addDays(d,1))}
  return out;
}
/* Date of the dose after the last logged one (or the first on/after start). */
function nextDose(s,lastLogged,today){
  const from=lastLogged?addDays(lastLogged,1):s.start;
  return onOrAfter(s,from>s.start?from:s.start);
}

/* Vial life: dosesLeft doses starting at `next`. Returns last dose date and beyond-use check. */
function vialLife({s,next,dosesLeft,reconDate,budDays}){
  if(!(dosesLeft>0)||!next)return {lastDose:null,runsOut:null,budDate:null,budBeforeEmpty:false,dosesBeforeBud:0};
  const list=dates(s,next,dosesLeft);
  const lastDose=list[list.length-1]||null;
  const budDate=reconDate&&budDays>0?addDays(reconDate,budDays):null;
  const within=budDate?list.filter(d=>d<=budDate).length:list.length;
  return {lastDose,budDate,dosesBeforeBud:within,budBeforeEmpty:!!budDate&&lastDose>budDate};
}

/* Rotation: site for the nth dose (0-based) from an ordered list. */
function siteFor(sites,n){return sites&&sites.length?sites[((n%sites.length)+sites.length)%sites.length]:''}

/* PK: sum of single-dose curves (first-order absorption and elimination).
   Output is relative: 1.0 = one full dose absorbed. Illustrative only, not a measurement. */
function absorptionHalfLifeH(hlH){return Math.max(0.25,Math.min(hlH*0.15,12))}
function single(tH,hlH,absH){
  if(tH<0)return 0;
  const ke=Math.LN2/hlH;let ka=Math.LN2/(absH||absorptionHalfLifeH(hlH));
  if(Math.abs(ka-ke)<1e-6)ka=ke*1.001;
  return ka/(ka-ke)*(Math.exp(-ke*tH)-Math.exp(-ka*tH));
}
/* doseDates: 'YYYY-MM-DD'[]; window [from,to] dates; stepH hours between points. */
function pkSeries({doseDates,hlH,from,to,stepH=6,absH}){
  const t0=parse(from),pts=[];const T=(parse(to)-t0)/3600000;
  const dt=doseDates.map(d=>(parse(d)-t0)/3600000);
  for(let t=0;t<=T+1e-9;t+=stepH){let y=0;for(const d of dt)y+=single(t-d,hlH,absH);pts.push([t,y])}
  return pts;
}

/* Calendar export: all-day events. */
function ics({name,dates:ds,sites,siteStart=0,doseLabel,prodId='-//Body Harmony//Tracker//EN'}){
  const esc=t=>String(t).replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:'+prodId,'CALSCALE:GREGORIAN'];
  ds.forEach((d,i)=>{
    const site=siteFor(sites,siteStart+i);
    L.push('BEGIN:VEVENT','UID:'+d.replace(/-/g,'')+'-'+String(name).replace(/[^A-Za-z0-9]/g,'')+'@bodyharmony.local',
      'DTSTAMP:'+d.replace(/-/g,'')+'T000000Z','DTSTART;VALUE=DATE:'+d.replace(/-/g,''),'DTEND;VALUE=DATE:'+addDays(d,1).replace(/-/g,''),
      'SUMMARY:'+esc('Dose: '+name+(doseLabel?' '+doseLabel:'')+(site?' ('+site+')':'')),'END:VEVENT');
  });
  L.push('END:VCALENDAR');return L.join('\r\n')+'\r\n';
}

const api={parse,fmt,addDays,diffDays,weekday,vialMath,isDue,onOrAfter,dates,nextDose,vialLife,siteFor,absorptionHalfLifeH,single,pkSeries,ics};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DoseMath=api;
})(typeof window!=='undefined'?window:globalThis);
