const assert=require('node:assert/strict');const M=require('../js/dose-math.js');
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
// vial math: 10 mg in 1 mL, 250 mcg dose -> 2.5 units, 40 doses
let v=M.vialMath({vialMg:10,bacMl:1,doseMcg:250});near(v.concMcgPerMl,10000);near(v.unitsPerDose,2.5);assert.equal(v.dosesPerVial,40);
v=M.vialMath({vialMg:5,bacMl:2,doseMcg:300});assert.equal(v.dosesPerVial,16);
v=M.vialMath({vialMg:10,bacMl:1,doseMcg:1000});assert.equal(v.dosesPerVial,10); // exact division
// date helpers across DST
assert.equal(M.addDays('2026-03-07',2),'2026-03-09');assert.equal(M.addDays('2026-11-01',1),'2026-11-02');
assert.equal(M.diffDays('2026-10-01','2026-10-08'),7);assert.equal(M.weekday('2026-10-05'),1); // Monday
// Mon/Thu schedule
const mt={type:'days',days:[1,4],start:'2026-10-05'};
assert.deepEqual(M.dates(mt,'2026-10-05',4),['2026-10-05','2026-10-08','2026-10-12','2026-10-15']);
assert.equal(M.nextDose(mt,'2026-10-08'),'2026-10-12');assert.equal(M.nextDose(mt,null),'2026-10-05');
// eod, interval, weekly, daily
assert.deepEqual(M.dates({type:'eod',start:'2026-10-01'},'2026-10-02',3),['2026-10-03','2026-10-05','2026-10-07']);
assert.deepEqual(M.dates({type:'interval',every:3,start:'2026-10-01'},'2026-10-01',3),['2026-10-01','2026-10-04','2026-10-07']);
assert.deepEqual(M.dates({type:'weekly',start:'2026-10-01'},'2026-10-01',3),['2026-10-01','2026-10-08','2026-10-15']);
assert.equal(M.dates({type:'daily',start:'2026-10-01'},'2026-10-01',5).length,5);
assert.equal(M.onOrAfter({type:'daily',start:'2026-10-10'},'2026-10-01'),'2026-10-10'); // before start -> start
assert.equal(M.onOrAfter({type:'days',days:[],start:'2026-10-01'},'2026-10-01'),null); // no days -> never
// vial life + beyond-use
let L=M.vialLife({s:{type:'daily',start:'2026-10-01'},next:'2026-10-01',dosesLeft:10,reconDate:'2026-10-01',budDays:28});
assert.equal(L.lastDose,'2026-10-10');assert.equal(L.budBeforeEmpty,false);
L=M.vialLife({s:{type:'daily',start:'2026-10-01'},next:'2026-10-01',dosesLeft:40,reconDate:'2026-10-01',budDays:28});
assert.equal(L.budBeforeEmpty,true);assert.equal(L.budDate,'2026-10-29');assert.equal(L.dosesBeforeBud,29);
assert.equal(M.vialLife({s:mt,next:'2026-10-05',dosesLeft:0}).lastDose,null);
// rotation
assert.equal(M.siteFor(['L','R'],0),'L');assert.equal(M.siteFor(['L','R'],3),'R');assert.equal(M.siteFor([],1),'');
// PK: single dose peaks then decays; 0 before dose; accumulates with repeat dosing
near(M.single(-1,24),0);const hl=24;let pk=0,tp=0;for(let t=0;t<200;t+=0.25){const y=M.single(t,hl);if(y>pk){pk=y;tp=t}}
assert.ok(pk>0.5&&pk<1.01);assert.ok(tp>0&&tp<hl);assert.ok(M.single(200,hl)<0.01);
const one=M.pkSeries({doseDates:['2026-10-01'],hlH:48,from:'2026-10-01',to:'2026-11-15',stepH:12});
const many=M.pkSeries({doseDates:M.dates({type:'weekly',start:'2026-10-01'},'2026-10-01',7),hlH:48*3,from:'2026-10-01',to:'2026-11-15',stepH:12});
assert.ok(Math.max(...many.map(p=>p[1]))>Math.max(...one.map(p=>p[1]))); // accumulation
// equal ka/ke does not blow up
assert.ok(isFinite(M.single(10,M.absorptionHalfLifeH(4)*1)));assert.ok(isFinite(M.single(5,0.25/0.15)));
// ics
const c=M.ics({name:'BPC157',dates:['2026-10-05'],sites:['Left abdomen'],doseLabel:'250 mcg'});
assert.match(c,/BEGIN:VCALENDAR/);assert.match(c,/DTSTART;VALUE=DATE:20261005/);assert.match(c,/DTEND;VALUE=DATE:20261006/);assert.match(c,/SUMMARY:Dose: BPC157 250 mcg \(Left abdomen\)/);
console.log('dose-math: all tests passed');
