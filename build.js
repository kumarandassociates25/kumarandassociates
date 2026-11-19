#!/usr/bin/env node
// Builds a plain static HTML website from editable Pages CMS JSON files.
// Zero external packages required.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const pages = ['home','approach','services','engagements','founder','faq','contact','brand'];
const data = Object.fromEntries(pages.map(p => [p, JSON.parse(fs.readFileSync(path.join(root,'content',p+'.json'),'utf8'))]));
function safe(value){ return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
const markup = fs.readFileSync(path.join(root,'src','index.template.html'),'utf8');
let html = markup.replace(/%%KA:([a-z]+)\.([a-zA-Z0-9_]+)%%/g, (all,page,key) => {
  if (!Object.hasOwn(data[page] || {},key)) throw new Error(`Missing CMS field: ${page}.${key}`);
  return safe(data[page][key]);
});
const capData = Array.from({length:4}, (_, i)=> [
  data.home[`feature_${i+1}_detail_heading`], data.home[`feature_${i+1}_detail_body`]
]);
html=html.replace('%%KA_JS_CAPDATA%%',JSON.stringify(capData).replace(/</g,'\\u003c'));
if(/%%KA:|%%KA_JS_CAPDATA%%/.test(html)) throw new Error('Unresolved content token');
const out = path.join(root,'dist'); fs.mkdirSync(out,{recursive:true});
for (const entry of fs.readdirSync(path.join(root, 'src'), {withFileTypes:true})) {
  if (entry.name === 'index.template.html') continue;
  const from = path.join(root, 'src', entry.name);
  const to = path.join(out, entry.name);
  if (entry.isDirectory()) fs.cpSync(from, to, {recursive:true, force:true});
  else if (entry.isFile()) fs.copyFileSync(from, to);
}
fs.writeFileSync(path.join(out,'index.html'),html,'utf8');
console.log('Built Kumar & Associates website from Pages CMS content.');
