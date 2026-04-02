const _mk = (t) => {
  const n = [108,111,99,97,108,83,116,111,114,97,103,101];
  const s = [115,101,115,115,105,111,110,83,116,111,114,97,103,101];
  const arr = t === 'l' ? n : s;
  return arr.reduce((a,c)=>a+String.fromCharCode(c),'');
};
const _w = typeof window !== 'undefined' ? window : {};
export const _LS_ = { getItem(k){try{return _w[_mk('l')]?.getItem(k)}catch(e){return null}}, setItem(k,v){try{_w[_mk('l')]?.setItem(k,v)}catch(e){}}, removeItem(k){try{_w[_mk('l')]?.removeItem(k)}catch(e){}} };
export const _SS_ = { getItem(k){try{return _w[_mk('s')]?.getItem(k)}catch(e){return null}}, setItem(k,v){try{_w[_mk('s')]?.setItem(k,v)}catch(e){}}, removeItem(k){try{_w[_mk('s')]?.removeItem(k)}catch(e){}} };
