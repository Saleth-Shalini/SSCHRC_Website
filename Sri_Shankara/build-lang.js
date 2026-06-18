const fs = require('fs');
const path = require('path');

const translationsBlock = fs.readFileSync(path.join(__dirname, 'translations-kn.js'), 'utf8');
const body = fs.readFileSync(path.join(__dirname, 'language-switcher-core.js'), 'utf8');
const out = body.replace('/*TRANSLATIONS*/', translationsBlock);
fs.writeFileSync(path.join(__dirname, 'language-switcher.js'), out, 'utf8');
console.log('language-switcher.js created');
