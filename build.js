#!/usr/bin/env node
/**
 * Kumar & Associates — Pages CMS to static HTML build.
 * Every CMS field is optional. Missing, null, or blank fields must never
 * make a build fail; optional UI fragments are hidden when not populated.
 * No third-party Node packages are required.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const pages = ['home','approach','services','engagements','founder','faq','contact','brand'];
const data = Object.fromEntries(pages.map((page) => {
  const location = path.join(root, 'content', page + '.json');
  // A content file can be absent too. Invalid JSON still reports an error.
  return [page, fs.existsSync(location) ? JSON.parse(fs.readFileSync(location,'utf8')) : {}];
}));

function get(key) {
  const [page,field] = key.split('.');
  const value = (data[page] && data[page][field]) ?? '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}
function present(key) { return get(key).trim().length > 0; }
function any(...keys) { return keys.some(present); }
function all(...keys) { return keys.every(present); }
function htmlEscape(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function renderValue(key) {
  // Essential browser/UI fallbacks keep the page usable even when cleared.
  if (key === 'brand.meta_title' && !present(key)) return 'Kumar & Associates';
  if (key === 'contact.submit_button' && !present(key)) return 'Send enquiry';
  if (key === 'contact.phone_link' && !present(key) && present('contact.phone')) {
    const digits = get('contact.phone').replace(/[^+\d]/g,'');
    return /^\+?\d{8,15}$/.test(digits) ? 'tel:' + digits : '';
  }
  return get(key);
}

let markup = fs.readFileSync(path.join(root,'src','index.template.html'),'utf8');
// Add a hidden attribute to an existing element identified by its CSS class.
// This acts on the in-memory template only; no editing of original layout needed.
function showClass(cls, shouldShow) {
  if (shouldShow) return;
  const pat = new RegExp('<([a-z][\\w-]*)([^>]*\\bclass="[^"]*\\b'+cls+'\\b[^"]*"[^>]*)>', 'g');
  markup = markup.replace(pat, (_full, tag, attrs) => `<${tag}${attrs} hidden>`);
}
// For leaves consisting only of one CMS token, collapse the empty HTML tag.
// For example: <li>%%KA:services.insolvency_item_1%%</li>.
markup = markup.replace(/<(li|p|span|strong|b|small|h1|h2|h3|div|em)([^<>]*)>(%%KA:([a-z]+\.[\w]+)%%)<\/\1>/g,
  (_full,tag,attrs,token,key) => `<${tag}${attrs}${present(key) ? '' : ' hidden'}>${token}</${tag}>`);

// Hero and its interactive capability cards.
const heroPrimary = ['home.eyebrow','home.heading_main','home.heading_accent','home.intro','home.primary_button','home.secondary_button'];
const caps = [1,2,3,4];
const capabilityNames = caps.map(n=>'home.feature_'+n+'_name');
showClass('hero', any(...heroPrimary, ...capabilityNames));
showClass('hero-art', any(...capabilityNames));
showClass('cap-heading', present('home.value_heading'));
showClass('cap-detail', caps.some(n => present('home.feature_'+n+'_name') && any('home.feature_'+n+'_detail_heading','home.feature_'+n+'_detail_body')));
showClass('actions', any('home.primary_button','home.secondary_button'));
markup = markup.replace(/<button([^>]*data-cap="(\d+)"[^>]*)>/g, (_full,attrs,n) =>
  `<button${attrs}${present('home.feature_'+(Number(n)+1)+'_name') ? '' : ' hidden'}>`);
// Hero heading has two CMS values and a br separator.
markup = markup.replace(/<h1>%%KA:home.heading_main%%<br\/>/, `<h1${any('home.heading_main','home.heading_accent')?'':' hidden'}>%%KA:home.heading_main%%<br${present('home.heading_main')&&present('home.heading_accent')?'':' hidden'}/>`);
// Links with an empty label must not leave empty buttons behind.
markup = markup.replace(/<a([^>]*)>(%%KA:([a-z]+\.[\w]+)%%)(?=<span class="arrow">|<\/a>)/g,
  (_full,attrs,token,key) => `<a${attrs}${present(key)?'':' hidden'}>${token}`);
// The trust strip includes static suffix text; hide its entire entry if its key is cleared.
markup = markup.replace(/<span><strong>%%KA:home\.(trust_[123])%%<\/strong>([^<]*)<\/span>/g,
  (_full,key,suffix)=>`<span${present('home.'+key)?'':' hidden'}><strong>%%KA:home.${key}%%</strong>${suffix}</span>`);
showClass('trust-line', any('home.trust_1','home.trust_2','home.trust_3'));

// Collapsible/optional content sections and repeated cards.
showClass('principles', caps.slice(0,3).some(n=>any('approach.point_'+n+'_title','approach.point_'+n+'_body')));
markup = markup.replace(/<div class="principle">/g, (()=>{let n=0;return ()=>{n++;return `<div class="principle"${any('approach.point_'+n+'_title','approach.point_'+n+'_body')?'':' hidden'}>`;};})());
showClass('section', true); // no-op; section visibility handled below by id
showClass('pill',present('approach.pill'));
showClass('intro-grid',any('approach.eyebrow','approach.title','approach.intro','approach.pill', ...[1,2,3].flatMap(n=>['approach.point_'+n+'_title','approach.point_'+n+'_body'])));
markup=markup.replace(/<section class="section" id="approach">/, `<section class="section" id="approach"${any('approach.eyebrow','approach.title','approach.intro','approach.pill', ...[1,2,3].flatMap(n=>['approach.point_'+n+'_title','approach.point_'+n+'_body']))?'':' hidden'}>`);
markup = markup.replace(/<article class="service">/g, (()=>{let n=0;return ()=>{
  n++;const part=n===1?'insolvency':'accounting';const count=n===1?5:6;
  const keys=['services.'+part+'_heading','services.'+part+'_intro',...Array.from({length:count},(_,i)=>'services.'+part+'_item_'+(i+1))];
  return `<article class="service"${any(...keys)?'':' hidden'}>`;
};})());
const serviceFields=['services.eyebrow','services.title','services.intro',...['insolvency','accounting'].flatMap(part=>['services.'+part+'_heading','services.'+part+'_intro', ...Array.from({length:part==='insolvency'?5:6},(_,i)=>'services.'+part+'_item_'+(i+1))])];
markup=markup.replace(/<section class="section services" id="services">/, `<section class="section services" id="services"${any(...serviceFields)?'':' hidden'}>`);
showClass('service-grid', serviceFields.slice(3).some(present));
// Suppress list spacing when every service bullet has been intentionally cleared.
markup=markup.replace(/<ul>(?=<li[^>]*>%%KA:services\.(insolvency|accounting)_item_1%%)/g,
  (_full,part)=>{
    const n=part==='insolvency'?5:6;
    const filled=Array.from({length:n},(_,i)=>'services.'+part+'_item_'+(i+1)).some(present);
    return `<ul${filled?'':' hidden'}>`;
  });
showClass('band',any('engagements.band_heading','engagements.band_intro','engagements.band_button'));
markup=markup.replace(/<article class="model">/g, (()=>{let n=0;return ()=>{
  n++;return `<article class="model"${any('engagements.model_'+n+'_heading','engagements.model_'+n+'_body','engagements.model_'+n+'_tag')?'':' hidden'}>`;
};})());
const engagementFields=['engagements.eyebrow','engagements.title','engagements.closing_note', ...[1,2,3].flatMap(n=>['engagements.model_'+n+'_heading','engagements.model_'+n+'_body','engagements.model_'+n+'_tag'])];
markup=markup.replace(/<section class="section" id="engagements">/, `<section class="section" id="engagements"${any(...engagementFields)?'':' hidden'}>`);
showClass('model-grid',[1,2,3].some(n=>any('engagements.model_'+n+'_heading','engagements.model_'+n+'_body','engagements.model_'+n+'_tag')));

// Optional founder photo, philosophy quote, credentials and CTA.
showClass('founder-photo',present('founder.portrait_image'));
showClass('founder-visual',present('founder.quote'));
showClass('quote-kicker',present('founder.quote_label'));
showClass('quote-bottom',present('founder.quote_footer'));
showClass('founder-side',any('founder.portrait_image','founder.quote'));
markup=markup.replace(/<li>%%KA:founder\.(credential_[123])%%<\/li>/g,
  (_full,key)=>`<li${present('founder.'+key)?'':' hidden'}>%%KA:founder.${key}%%</li>`);
showClass('founder-list',any('founder.credential_1','founder.credential_2','founder.credential_3'));
const founderFields=['founder.portrait_image','founder.quote','founder.quote_label','founder.quote_footer','founder.eyebrow','founder.title','founder.bio_1','founder.bio_2','founder.credential_1','founder.credential_2','founder.credential_3','founder.button'];
markup=markup.replace(/<section class="section founder" id="about">/, `<section class="section founder" id="about"${any(...founderFields)?'':' hidden'}>`);

// An empty FAQ question or answer omits that question, rather than showing a blank accordion.
markup=markup.replace(/<details>/g, (()=>{let n=0;return ()=>{
  n++; return `<details${all('faq.q'+n,'faq.a'+n)?'':' hidden'}>`;
};})());
const faqFields=['faq.eyebrow','faq.title',...Array.from({length:5},(_,i)=>['faq.q'+(i+1),'faq.a'+(i+1)]).flat()];
showClass('faq-list',[1,2,3,4,5].some(n=>all('faq.q'+n,'faq.a'+n)));
markup=markup.replace(/<section class="section faq">/, `<section class="section faq"${any('faq.eyebrow','faq.title')||[1,2,3,4,5].some(n=>all('faq.q'+n,'faq.a'+n))?'':' hidden'}>`);

// Leave the actual enquiry form available even when optional introductory text is deleted.
showClass('contact-links',all('contact.linkedin_url','contact.linkedin_button'));
showClass('telephone-block',present('contact.phone'));
showClass('contact-help',present('contact.email_link'));
showClass('brand-mark',present('brand.header_logo'));

// Optional SEO metadata and images must not produce broken asset URLs.
if(!present('brand.social_preview_image')) {
  markup=markup.replace(/<meta[^>]*property="og:image"[^>]*\/>/g,'');
  markup=markup.replace(/<meta[^>]*name="twitter:image"[^>]*\/>/g,'');
  markup=markup.replace(/<meta[^>]*property="og:image:alt"[^>]*\/>/g,'');
}
if(!present('brand.favicon_image')) markup=markup.replace(/<link[^>]*href="%%KA:brand.favicon_image%%"[^>]*\/>/g,'');
if(!present('brand.meta_description')) markup=markup.replace(/<meta[^>]*name="description"[^>]*\/>/g,'');
if(!present('brand.social_description')) markup=markup.replace(/<meta[^>]*property="og:description"[^>]*\/>/g,'');
if(!present('brand.social_title')) markup=markup.replace(/<meta[^>]*property="og:title"[^>]*\/>/g,'');

// Hide all truly empty leaf elements (display:none beats flex/grid CSS declarations).
markup=markup.replace('</style>', '\n[hidden]{display:none!important}\n.hero-grid:has(.hero-art[hidden]){grid-template-columns:1fr;min-height:initial}\n.intro-grid:has(.principles[hidden]){grid-template-columns:1fr}\n.founder-grid:has(.founder-side[hidden]){grid-template-columns:1fr}\n.service-grid:has(.service[hidden]){grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))}\n.model-grid:has(.model[hidden]){grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}\n</style>');

// Make capability rotation work with 0–4 populated cards, including blank details.
const capJs=`    const capData=%%KA_JS_CAPDATA%%;
    const capButtons=[...document.querySelectorAll('.cap-card:not([hidden])')];
    let capIndex=0,capInteracted=false;
    function setCapability(index){
      if(!capButtons.length) return;
      capIndex=index%capButtons.length;
      const active=capButtons[capIndex];
      const originalIndex=Number(active.dataset.cap);
      const values=capData[originalIndex] || ['', ''];
      capButtons.forEach(button=>button.setAttribute('aria-pressed',String(button===active)));
      const num=document.getElementById('cap-number');
      const heading=document.getElementById('cap-title');
      const description=document.getElementById('cap-copy');
      const panel=document.querySelector('.cap-detail');
      if(num)num.textContent=String(originalIndex+1).padStart(2,'0');
      if(heading){heading.textContent=values[0]||'';heading.hidden=!values[0];}
      if(description){description.textContent=values[1]||'';description.hidden=!values[1];}
      if(panel)panel.hidden=!(values[0]||values[1]);
    }
    capButtons.forEach((button,index)=>{button.addEventListener('click',()=>{capInteracted=true;setCapability(index)});button.addEventListener('focus',()=>{capInteracted=true;});});
    if(capButtons.length){
      setCapability(0);
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && capButtons.length>1){
        setInterval(()=>{if(!capInteracted && document.visibilityState==='visible')setCapability(capIndex+1);},4200);
      }
    }
`;
const oldCap = /    const capData=%%KA_JS_CAPDATA%%;[\s\S]*?(?=    const toggle=)/;
if (!oldCap.test(markup)) throw new Error('Unable to locate capability controller in template');
markup=markup.replace(oldCap,capJs+'\n');

// Resolve all CMS tokens. Missing fields always become an empty string.
let html=markup.replace(/%%KA:([a-z]+)\.([a-zA-Z0-9_]+)%%/g, (_all,page,key) => htmlEscape(renderValue(page+'.'+key)));
const capData = caps.map(n=>[
  get('home.feature_'+n+'_detail_heading'),
  get('home.feature_'+n+'_detail_body')
]);
html=html.replace('%%KA_JS_CAPDATA%%',JSON.stringify(capData).replace(/</g,'\\u003c'));
if (/%%KA:|%%KA_JS_CAPDATA%%/.test(html)) throw new Error('Unresolved CMS template token');

// Preserve all existing images, favicon, FormSubmit configuration and thank-you page.
const out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for(const entry of fs.readdirSync(path.join(root,'src'),{withFileTypes:true})){
  if(entry.name==='index.template.html')continue;
  const from=path.join(root,'src',entry.name),to=path.join(out,entry.name);
  if(entry.isDirectory())fs.cpSync(from,to,{recursive:true,force:true});
  else if(entry.isFile())fs.copyFileSync(from,to);
}
fs.writeFileSync(path.join(out,'index.html'),html,'utf8');
console.log('Built Kumar & Associates website. Blank and deleted CMS fields are optional.');
