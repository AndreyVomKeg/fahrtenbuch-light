const fs = require('fs');
const path = require('path');

const distAssets = path.join(__dirname, 'dist', 'assets');
const files = fs.readdirSync(distAssets).filter(f => f.endsWith('.js'));

// In-memory storage polyfill that has the same API as localStorage
// We inject it at the top of the bundle and replace all references
const polyfill = `(function(){var _ms={};var _memStore={getItem:function(k){return _ms[k]||null},setItem:function(k,v){_ms[k]=String(v)},removeItem:function(k){delete _ms[k]},clear:function(){_ms={}},get length(){return Object.keys(_ms).length},key:function(i){return Object.keys(_ms)[i]||null}};window._fbLocalStorage=_memStore;window._fbSessionStorage=_memStore})();`;

for (const file of files) {
  const filePath = path.join(distAssets, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count replacements
  const lsCount = (content.match(/localStorage/g) || []).length;
  const ssCount = (content.match(/sessionStorage/g) || []).length;
  
  if (lsCount > 0 || ssCount > 0) {
    // Add polyfill at the start
    content = polyfill + content;
    
    // Replace localStorage with our polyfill
    content = content.replace(/localStorage/g, '_fbLocalStorage');
    content = content.replace(/sessionStorage/g, '_fbSessionStorage');
    
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${file}: ${lsCount} localStorage, ${ssCount} sessionStorage replaced`);
  } else {
    console.log(`${file}: no storage references found`);
  }
}

console.log('Done patching storage references');
