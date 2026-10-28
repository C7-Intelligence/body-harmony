/* Entry disclaimer gate: the visitor must accept before the site is usable.
   Acceptance is stored in this browser only, keyed by TERMS_VERSION; bump the version to ask everyone again. */
(function(){
  var TERMS_VERSION='1.0',KEY='bh-terms',CO='J Harmony, LLC';
  var memory=false; // used if storage is unavailable, so the gate still works for the page view
  function accepted(){
    if(memory)return true;
    try{var r=JSON.parse(localStorage.getItem(KEY)||'null');return !!(r&&r.v===TERMS_VERSION)}catch(e){return false}
  }
  var root=document.documentElement;
  if(accepted()){root.removeAttribute('data-gate');return}
  root.setAttribute('data-gate','');
  var dim=['.top','.wrap','body>footer','#lightbox'];
  function setInert(on){dim.forEach(function(s){var e=document.querySelector(s);if(!e)return;if(on){e.setAttribute('inert','');e.setAttribute('aria-hidden','true')}else{e.removeAttribute('inert');e.removeAttribute('aria-hidden')}})}
  var g=document.createElement('div');g.id='gate';
  g.innerHTML='<div class="gbox" role="dialog" aria-modal="true" aria-labelledby="gate-t">'
  +'<div><div class="gk">Please read before entering</div><h1 id="gate-t">Body Harmony is for information and research only</h1>'
  +'<p class="gl">It is not health advice. You must accept the terms below to view the site.</p></div>'
  +'<div class="gscroll" tabindex="0" role="region" aria-label="Disclaimer text, scrollable">'
  +'<p><b>1. Information and research only.</b> Everything on this site is provided for general informational and research purposes. It is not medical advice, diagnosis or treatment, and using it does not create a doctor-patient or other professional relationship.</p>'
  +'<p><b>2. Do not rely on it.</b> Do not use this site to decide whether to start, change or stop any medicine, peptide or other compound. Always speak with a licensed healthcare professional first. The dose calculator and tracker only do arithmetic on numbers you enter. They do not recommend doses.</p>'
  +'<p><b>3. Unapproved compounds and the law.</b> Many compounds discussed here are not approved by the FDA or other regulators for human use. Their legal status differs by place and changes often. You are responsible for knowing and following the laws that apply to you.</p>'
  +'<p><b>4. No endorsement, no warranty.</b> We do not sell, prescribe or endorse any product, vendor or protocol. Third-party, test and regulatory information may be incomplete, wrong or out of date. The site is provided as is.</p>'
  +'<p><b>5. Your risk.</b> You use this site, and anything you do based on it, entirely at your own risk.</p>'
  +'<p><b>6. Release and indemnity.</b> To the fullest extent the law allows, you release '+CO+', its owners, members, officers, employees and contributors from all claims arising from your use of, or reliance on, this site. You agree to defend and indemnify them against any claim, loss or cost, including reasonable legal fees, that arises from your use, your reliance, or your breach of these terms.</p>'
  +'<p><b>7. Adults only.</b> You must be 18 or older to use this site.</p></div>'
  +'<div class="gchk">'
  +'<label><input type="checkbox" class="gc"><span>I am 18 years of age or older.</span></label>'
  +'<label><input type="checkbox" class="gc"><span>I understand this site is for informational and research purposes only and is not medical advice, and I will not rely on it as medical advice.</span></label>'
  +'<label><input type="checkbox" class="gc"><span>I have read and agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Use and Disclaimer</a>, including the release and indemnity in section 6.</span></label></div>'
  +'<div class="gact"><button type="button" class="gyes" disabled>I agree and enter the site</button><button type="button" class="gno">Leave site</button></div>'
  +'<div class="gfine">Your acceptance (version '+TERMS_VERSION+') is saved in this browser only. You will be asked again if the terms change.</div></div>';
  document.body.appendChild(g);
  setInert(true);
  var yes=g.querySelector('.gyes'),cs=[].slice.call(g.querySelectorAll('.gc'));
  function sync(){yes.disabled=!cs.every(function(c){return c.checked})}
  cs.forEach(function(c){c.addEventListener('change',sync)});
  yes.addEventListener('click',function(){
    if(yes.disabled)return;
    try{localStorage.setItem(KEY,JSON.stringify({v:TERMS_VERSION,t:new Date().toISOString()}))}catch(e){memory=true}
    g.remove();setInert(false);root.removeAttribute('data-gate');
  });
  g.querySelector('.gno').addEventListener('click',function(){location.href='about:blank'});
  // keep keyboard focus inside the dialog
  g.addEventListener('keydown',function(e){
    if(e.key!=='Tab')return;
    var f=[].slice.call(g.querySelectorAll('a[href],button:not(:disabled),input,[tabindex="0"]'));
    if(!f.length)return;var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  });
  g.querySelector('.gscroll').focus();
})();
