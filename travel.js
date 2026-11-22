/* LifeHub Travel space, Phase 1: map (world > country > state), pins with clustering, trips, places, visits.
   Load AFTER goals.js:  <script src="travel.js"></script>   Needs world.json, cities.json, regions-*.json (see build-map-data.mjs) */
(function(){
const NS='http://www.w3.org/2000/svg',REGC=['AUS','USA','CAN','DEU','BRA','GBR','JPN'],
TNAV=[['tvmap','Map','map'],['tvtrips','Trips','plane'],['tvplaces','Places','map-pin']];
const TV={world:null,idx:{},reg:{},cities:null,err:'',sel:null,cur:null,add:false,pend:null,hits:[],pf:''};
let VB={x:0,y:0,w:1000,h:500},MAP={};

/* ---------- data ---------- */
const TS=()=>{const t=S.tv=S.tv||{};t.places=t.places||[];t.trips=t.trips||[];t.visits=t.visits||[];return t};
const tp=id=>TS().places.find(x=>x.id==id),tr=id=>TS().trips.find(x=>x.id==id);
const xy=(lo,la)=>[(lo+180)/360*1000,(90-la)/180*500],lola=(x,y)=>[x/1000*360-180,90-y/500*180];
const pv=p=>TS().visits.filter(v=>v.p==p.id).sort((a,b)=>a.from<b.from?1:-1);
const pst=p=>pv(p).some(v=>v.from<=today())?'been':'planned';
const cn=id=>TV.idx[id]||{name:id||'',a2:'',cont:''};
const fl=id=>{const c=cn(id);return c.a2?`<span class="fl">${flag(c.a2)}</span> `:''};
const when=v=>`${v.from}${v.ft?' '+v.ft:''}${v.to?' → '+v.to+(v.tt?' '+v.tt:''):''}`;
const ic=n=>`<i data-lucide="${n}"></i>`;
const ext=(t,v)=>{const a=v.from,b=v.to||v.from;if(!t.start||a<t.start)t.start=a;if(!t.end||b>t.end)t.end=b};
const tstat=t=>{if(!t.start)return['Planning',''];if(t.start>today()){const d=Math.ceil((new Date(t.start+'T00:00:00')-new Date(today()+'T00:00:00'))/864e5);return['Upcoming',d+' day'+(d===1?'':'s')+' to go']}return(t.end&&t.end<today())?['Done','']:['Under way','']};
const stats=()=>{const b={},pl={};TS().places.forEach(p=>{if(!p.c||!pv(p).length)return;(pst(p)==='been'?b:pl)[p.c]=1});return{b,pl,n:Object.keys(b).length,tot:TV.world?TV.world.countries.filter(c=>c.cnt).length:199}};
const sv=()=>{save();render()};

/* ---------- loading ---------- */
function loadWorld(){if(TV.loading)return;TV.loading=1;fetch('world.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{TV.world=j;j.countries.forEach(c=>TV.idx[c.id]=c);render()}).catch(()=>{TV.err='Map data not found. Run build-map-data.mjs and upload world.json (and the other files it creates) next to index.html.';render()})}
async function loadReg(a3){if(TV.reg[a3])return TV.reg[a3];if(!REGC.includes(a3))return null;try{const r=await fetch('regions-'+a3+'.json');if(!r.ok)return null;TV.reg[a3]=(await r.json()).regions}catch(e){return null}return TV.reg[a3]}
async function loadCities(){if(TV.cities)return;TV.cities=[];for(const f of['cities.json','places-extra.json']){try{const r=await fetch(f);if(r.ok)TV.cities=TV.cities.concat(await r.json())}catch(e){}}}
async function findRegion(pl){if(!REGC.includes(pl.c))return;const R=await loadReg(pl.c);if(!R)return;const s=document.createElementNS(NS,'svg');s.style.cssText='position:absolute;width:0;height:0;visibility:hidden';document.body.appendChild(s);const pt=s.createSVGPoint(),q=xy(pl.lo,pl.la);pt.x=q[0];pt.y=q[1];for(const r of R){const e=document.createElementNS(NS,'path');e.setAttribute('d',r.d);s.appendChild(e);if(e.isPointInFill(pt)){pl.r=r.id;break}}s.remove()}

/* ---------- map ---------- */
function drawPins(){const g=document.getElementById('tvpins'),sv_=document.getElementById('tvsvg');if(!g||!sv_)return;const sc=(sv_.getBoundingClientRect().width/VB.w)||1,cell=36/sc,cl={},rr=7/sc;
 TS().places.forEach(p=>{if(!pv(p).length)return;const q=xy(p.lo,p.la),k=Math.floor(q[0]/cell)+','+Math.floor(q[1]/cell);(cl[k]=cl[k]||[]).push([p,q[0],q[1]])});
 let h='';Object.keys(cl).forEach(k=>{const l=cl[k];if(l.length===1){const p=l[0][0],b=pst(p)==='been';h+=`<g data-pin="${p.id}" style="cursor:pointer"><circle cx="${l[0][1]}" cy="${l[0][2]}" r="${rr}" style="fill:${b?'var(--acc)':'var(--card)'};stroke:var(--acc);stroke-width:${2/sc}"/><title>${esc(p.name)}</title></g>`}
  else{const cx=l.reduce((a,x)=>a+x[1],0)/l.length,cy=l.reduce((a,x)=>a+x[2],0)/l.length;h+=`<g data-cl="${cx},${cy}" style="cursor:pointer"><circle cx="${cx}" cy="${cy}" r="${rr*1.6}" style="fill:var(--acc);stroke:var(--card);stroke-width:${1.5/sc}"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" style="fill:var(--on);font:600 ${rr*1.4}px var(--mono);pointer-events:none">${l.length}</text></g>`}});
 if(TV.pend)h+=`<circle cx="${TV.pend[0]}" cy="${TV.pend[1]}" r="${rr}" style="fill:none;stroke:var(--acc);stroke-width:${2/sc};stroke-dasharray:${3/sc}"/>`;g.innerHTML=h}
function drawRegions(){const g=document.getElementById('tvreg');if(!g)return;const R=TV.cur&&TV.reg[TV.cur];if(!R){g.innerHTML='';return}const vr={};TS().places.forEach(p=>{if(p.c===TV.cur&&p.r&&pv(p).length)vr[p.r]=vr[p.r]==='been'?'been':pst(p)});
 g.innerHTML=R.map(r=>`<path data-c="${TV.cur}" data-r="${r.id}" d="${r.d}" style="fill:${vr[r.id]==='been'?'color-mix(in srgb,var(--acc) 55%,var(--card))':vr[r.id]?'color-mix(in srgb,var(--acc) 25%,var(--card))':'color-mix(in srgb,var(--card) 55%,transparent)'};stroke:var(--mute);stroke-width:.5;vector-effect:non-scaling-stroke"/>`).join('')}
function selCountry(id){TV.sel={c:id};TV.cur=id;const c=TV.idx[id];if(c){const b=c.bb,w=Math.max((b[2]-b[0])*1.3,(b[3]-b[1])*2.6,14);VB.w=Math.min(1000,w);VB.h=VB.w/2;VB.x=(b[0]+b[2])/2-VB.w/2;VB.y=(b[1]+b[3])/2-VB.h/2;MAP.apply()}
 panel();drawRegions();loadReg(id).then(R=>{if(R&&TV.cur===id){drawRegions();panel()}})}
function panel(){const el=document.getElementById('tvpanel');if(!el)return;const sl=TV.sel,T=TS();let h='';
 if(sl&&sl.p&&tp(sl.p)){const p=tp(sl.p),v=pv(p);h=`<div class="dh"><h3>${esc(p.name)}</h3><button class="ghost" data-v="tvplace:${p.id}">Open place</button></div><div class="dk">${fl(p.c)}${esc(cn(p.c).name)} · ${v.length} visit${v.length===1?'':'s'} · ${pst(p)==='been'?'Visited':'Planned'}</div>`+v.slice(0,3).map(x=>`<div class="ev"><b class="mono">${when(x)}</b><span>${esc((tr(x.trip)||{}).name||'')}</span></div>`).join('')}
 else if(sl&&sl.c){const c=cn(sl.c),ps=T.places.filter(p=>p.c===sl.c&&pv(p).length),R=TV.reg[sl.c],rg=sl.r&&R?R.find(x=>x.id===sl.r):null,lp=rg?ps.filter(p=>p.r===rg.id):ps;
  h=`<div class="dh"><h3>${fl(sl.c)}${esc(c.name)}${rg?' · '+esc(rg.name):''}</h3><span class="dk">${esc(c.cont||'')}</span></div>`+(!rg&&REGC.includes(sl.c)?'<div class="dk">Tap a state or region to select it.</div>':'')+(lp.length?lp.map(p=>`<div class="dh"><a href="#" data-v="tvplace:${p.id}" style="color:inherit">${esc(p.name)}</a><span class="dk mono">${pv(p).length} visit${pv(p).length===1?'':'s'}</span></div>`).join(''):'<div class="dk">No places here yet.</div>')}
 else h='<div class="dk">Tap a country to zoom in, or a pin to see its place. Scroll or pinch to zoom, drag to pan.</div>';el.innerHTML=h}
function fillPin(o){const f=document.querySelector('[data-f=tv-pin]');if(!f)return;if(o.name!=null)f.elements.name.value=o.name;f.elements.la.value=(+o.la).toFixed(4);f.elements.lo.value=(+o.lo).toFixed(4);f.elements.c.value=o.c||'';f.elements.r.value=o.r||'';document.getElementById('tvcn').value=o.c?cn(o.c).name:'Open water: tap on land';TV.pend=xy(+o.lo,+o.la);drawPins()}
function bindMap(){const sv_=document.getElementById('tvsvg');if(!sv_)return;const ps=new Map();let moved=0,tgt=null,pd=0;
 const apply=()=>{VB.w=Math.max(8,Math.min(1000,VB.w));VB.h=VB.w/2;VB.x=Math.max(0,Math.min(1000-VB.w,VB.x));VB.y=Math.max(0,Math.min(500-VB.h,VB.y));sv_.setAttribute('viewBox',`${VB.x} ${VB.y} ${VB.w} ${VB.h}`);drawPins()};
 const zoom=(f,cx,cy)=>{const r=sv_.getBoundingClientRect(),px=cx==null?.5:(cx-r.left)/r.width,py=cy==null?.5:(cy-r.top)/r.height,X=VB.x+px*VB.w,Y=VB.y+py*VB.h,nw=Math.max(8,Math.min(1000,VB.w*f));VB.x=X-px*nw;VB.y=Y-py*nw/2;VB.w=nw;apply()};
 MAP={apply,zoom,reset:()=>{VB={x:0,y:0,w:1000,h:500};TV.cur=null;TV.sel=null;apply();drawRegions();panel()}};
 const tap=(t,e)=>{const c=t.closest?t:null;if(!c)return;const pin=c.closest('[data-pin]'),cl=c.closest('[data-cl]'),rg=c.closest('[data-r]'),ct=c.closest('[data-c]');
  if(pin){TV.sel={p:pin.dataset.pin};panel()}
  else if(cl){const q=cl.dataset.cl.split(',').map(Number);VB.w/=3.5;VB.x=q[0]-VB.w/2;VB.y=q[1]-VB.w/4;apply()}
  else if(TV.add&&(ct||rg)||TV.add&&!ct){const p=sv_.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(sv_.getScreenCTM().inverse()),l=lola(q.x,q.y);TV.add=false;const b=document.querySelector('[data-act=tv-add]');if(b)b.textContent='Or tap the map';sv_.style.cursor='';fillPin({la:l[1],lo:l[0],c:ct?ct.dataset.c:'',r:rg?rg.dataset.r:''})}
  else if(rg){TV.sel={c:TV.cur,r:rg.dataset.r};panel()}
  else if(ct)selCountry(ct.dataset.c);
  else{TV.sel=null;TV.cur=null;drawRegions();panel()}};
 sv_.addEventListener('pointerdown',e=>{ps.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ps.size===1){moved=0;tgt=e.target}else{const a=[...ps.values()];pd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);moved=99}});
 sv_.addEventListener('pointermove',e=>{const pr=ps.get(e.pointerId);if(!pr)return;const dx=e.clientX-pr.x,dy=e.clientY-pr.y;pr.x=e.clientX;pr.y=e.clientY;
  if(ps.size===2){const a=[...ps.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pd&&d)zoom(pd/d,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);pd=d;return}
  moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){const r=sv_.getBoundingClientRect();VB.x-=dx/r.width*VB.w;VB.y-=dy/r.width*VB.w;apply()}});
 const up=e=>{const was=ps.size;ps.delete(e.pointerId);if(was===1&&moved<=6&&e.type==='pointerup')tap(tgt,e)};
 sv_.addEventListener('pointerup',up);sv_.addEventListener('pointercancel',up);
 sv_.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.25:.8,e.clientX,e.clientY)},{passive:false});
 if(TV.add)sv_.style.cursor='crosshair'}
function mapInit(){const box=document.getElementById('tvmap');if(!box)return;if(!TV.world){box.innerHTML=`<p class="empty" style="padding:24px">${esc(TV.err||'Loading map…')}</p>`;return}
 const s=stats(),fill=id=>s.b[id]?'color-mix(in srgb,var(--acc) 45%,var(--card))':s.pl[id]?'color-mix(in srgb,var(--acc) 18%,var(--card))':'var(--card)';
 box.innerHTML=`<svg id="tvsvg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" role="img" aria-label="World map"><rect width="1000" height="500" style="fill:var(--side)"/><g>${TV.world.countries.map(c=>`<path data-c="${c.id}" d="${c.d}" style="fill:${fill(c.id)};stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke"/>`).join('')}</g><g id="tvreg"></g><g id="tvpins"></g></svg><div class="tvctl"><button class="ghost" data-act="tv-zin" aria-label="Zoom in">+</button><button class="ghost" data-act="tv-zout" aria-label="Zoom out">−</button><button class="ghost" data-act="tv-zreset" aria-label="Reset view">⌂</button></div>`;
 bindMap();drawRegions();drawPins();panel()}

/* ---------- pages ---------- */
const hd=(t,s)=>`<div class="lab dhd">Travel</div><h1 class="greet">${t}</h1><p class="sub">${s}</p>`;
function pinForm(){const T=TS();return`<h2>Add a pin</h2><div class="card"><form class="mform" data-f="tv-pin"><div class="row" style="margin-top:0"><label>Search a city<input id="tvq" type="text" autocomplete="off" placeholder="Start typing…"></label><button type="button" class="ghost" data-act="tv-add">${TV.add?'Tap the map now…':'Or tap the map'}</button></div><div id="tvres" class="chips2"></div><div class="grid"><label>Place name<input name="name" type="text" required></label><label>Latitude<input name="la" type="number" step="any" readonly></label><label>Longitude<input name="lo" type="number" step="any" readonly></label><label>Country<input id="tvcn" type="text" readonly><input name="c" type="hidden"><input name="r" type="hidden"></label></div><div class="grid" style="margin-top:10px"><label>Trip<select name="trip">${sel([['','New trip…']].concat(T.trips.map(t=>[t.id,esc(t.name)])))}</select></label><label>New trip name<input name="ntrip" type="text" placeholder="Japan 2026"></label><label>Arrived<input name="from" type="date" value="${today()}" required></label><label>Time<input name="ft" type="time"></label><label>Left<input name="to" type="date"></label><label>Time<input name="tt" type="time"></label></div><label>Journal<textarea name="journal" rows="3"></textarea></label><button class="add" type="submit">Save pin</button></form></div>`}
function tvmap(){const s=stats(),T=TS();return hd('Where you have been','Shaded countries are visited, lighter ones are planned.')+`<div class="grid" style="margin:12px 0">${card('Countries',s.n,'/ '+s.tot)}${card('Of the world',s.tot?Math.round(s.n/s.tot*100):0,'%')}${card('Places',T.places.filter(p=>pv(p).length).length,'')}${card('Trips',T.trips.length,'')}</div><div class="tvmapbox" id="tvmap"></div><div class="card" id="tvpanel" style="margin-top:12px"></div>`+pinForm()}
const vrow=(v,mode)=>{const p=tp(v.p),t=tr(v.trip);return`<div class="card sec"><div class="dh"><b>${mode==='trip'?(p?`<a href="#" data-v="tvplace:${p.id}" style="color:inherit">${esc(p.name)}</a>`:'Place'):(t?`<a href="#" data-v="tvtrip:${t.id}" style="color:inherit">${esc(t.name)}</a>`:'Trip')}</b><span><span class="mono dk">${when(v)}</span> <button class="x" data-act="tv-dv" data-a="${v.id}" aria-label="Delete visit">×</button></span></div><label style="margin-top:6px">Journal<textarea rows="2" data-tvf="v|${v.id}|journal">${esc(v.journal)}</textarea></label></div>`};
const vform=(sub,opts)=>`<form data-f="tv-visit" data-a="${sub}"><label>${sub[0]==='p'?'Trip':'Place'}<select name="ref">${sel(opts)}</select></label><label>Arrived<input name="from" type="date" required></label><label>Time<input name="ft" type="time"></label><label>Left<input name="to" type="date"></label><label>Time<input name="tt" type="time"></label><label>Journal<textarea name="journal" rows="2"></textarea></label><button class="add" type="submit">Add visit</button></form>`;
function tvtrips(){const T=TS(),ts=T.trips.slice().sort((a,b)=>(a.start||'')<(b.start||'')?1:-1);
 return hd('Trips','Each trip groups the places you visit.')+`<div class="tiles" style="margin-top:12px">${ts.map(t=>{const s=tstat(t),vs=T.visits.filter(v=>v.trip==t.id),pc=new Set(vs.map(v=>v.p)).size;return`<button class="card" style="text-align:left;cursor:pointer;color:var(--ink)" data-v="tvtrip:${t.id}"><h3>${esc(t.name)}</h3><div class="mono dk">${esc(t.start||'No dates')}${t.end&&t.end!==t.start?' → '+esc(t.end):''}</div><div style="margin:6px 0">${qp(s[0],s[0]==='Done'?100:s[0]==='Under way'?80:60)}</div><div class="dk">${pc} place${pc===1?'':'s'} · ${vs.length} visit${vs.length===1?'':'s'}${s[1]?' · '+s[1]:''}</div></button>`}).join('')||'<p class="empty">No trips yet.</p>'}</div><h2>New trip</h2><div class="card"><form data-f="tv-trip"><label>Name<input name="name" type="text" required placeholder="Japan 2026"></label><label>Start<input name="start" type="date"></label><label>End<input name="end" type="date"></label><button class="add" type="submit">Create trip</button></form></div>`}
function tvtrip(id){const t=tr(id),T=TS();if(!t)return tvtrips();const vs=T.visits.filter(v=>v.trip==t.id).sort((a,b)=>a.from<b.from?-1:1),F=f=>`data-tvf="t|${t.id}|${f}"`,s=tstat(t);
 return`<button class="ghost" data-v="tvtrips">← Back to trips</button><div class="card" style="margin-top:12px"><input ${F('name')} value="${esc(t.name)}" style="font:600 22px Inter,sans-serif" aria-label="Trip name"><div style="margin-top:8px">${qp(s[0],s[0]==='Done'?100:60)} <span class="dk">${s[1]}</span></div><div class="grid" style="margin-top:10px"><label>Start<input type="date" ${F('start')} value="${esc(t.start)}"></label><label>End<input type="date" ${F('end')} value="${esc(t.end)}"></label></div><label style="margin-top:10px">Notes<textarea rows="3" ${F('notes')}>${esc(t.notes)}</textarea></label></div><h2>Places and visits</h2>${vs.map(v=>vrow(v,'trip')).join('')||'<p class="empty">No visits yet.</p>'}<h2>Add a visit</h2><div class="card">${T.places.length?vform('t:'+t.id,T.places.map(p=>[p.id,esc(p.name)])):'<p class="empty" style="margin:0">Add a pin on the Map first.</p>'}</div><div class="row"><button class="ghost" data-act="tv-dt" data-a="${t.id}">Delete trip</button></div>`}
function tvplaces(){const T=TS(),q=TV.pf.toLowerCase(),l=T.places.filter(p=>pv(p).length&&(!q||p.name.toLowerCase().includes(q)||cn(p.c).name.toLowerCase().includes(q))).sort((a,b)=>a.name<b.name?-1:1);
 return hd('Places','Every location you have a pin for.')+`<div class="row" style="margin-top:0"><label>Search<input id="tvpf" type="text" value="${esc(TV.pf)}" placeholder="Name or country"></label></div><div class="card scroll"><table><tr><th>Place</th><th>Country</th><th>Visits</th><th>Last visit</th></tr>${l.map(p=>`<tr><td><a href="#" data-v="tvplace:${p.id}" style="color:inherit">${esc(p.name)}</a></td><td>${fl(p.c)}${esc(cn(p.c).name)}</td><td>${pv(p).length}</td><td>${pv(p)[0].from}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No places yet.</td></tr>'}</table></div>`}
function tvplace(id){const p=tp(id),T=TS();if(!p)return tvplaces();const F=f=>`data-tvf="p|${p.id}|${f}"`,rg=TV.reg[p.c]&&p.r?TV.reg[p.c].find(x=>x.id===p.r):null;
 return`<button class="ghost" data-v="tvplaces">← Back to places</button><div class="card" style="margin-top:12px"><input ${F('name')} value="${esc(p.name)}" style="font:600 22px Inter,sans-serif" aria-label="Place name"><div class="chips" style="margin-top:8px"><span>${fl(p.c)}${esc(cn(p.c).name)}</span>${p.r?`<span>${esc(rg?rg.name:p.r)}</span>`:''}<span class="mono">${(+p.la).toFixed(2)}, ${(+p.lo).toFixed(2)}</span><span>${pv(p).length} visit${pv(p).length===1?'':'s'}</span></div></div><h2>Visits</h2>${pv(p).map(v=>vrow(v,'place')).join('')||'<p class="empty">No visits.</p>'}<h2>Add a visit</h2><div class="card">${T.trips.length?vform('p:'+p.id,T.trips.map(t=>[t.id,esc(t.name)])):'<p class="empty" style="margin:0">Create a trip first.</p>'}</div><div class="row"><button class="ghost" data-act="tv-dp" data-a="${p.id}">Delete place</button></div>`}

/* ---------- shell ---------- */
const TVIEWS={tvmap,tvtrips,tvtrip,tvplaces,tvplace};
function tside(){const n=(P.name||'').trim(),ini=n?n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase():'LH',f=flag(P.country),c=({tvtrip:'tvtrips',tvplace:'tvplaces'})[view.split(':')[0]]||view.split(':')[0];
 return`<div class="prof"><div class="av">${P.pic?`<img src="${P.pic}" alt="">`:`<span>${esc(ini)}</span>`}</div><div class="pt"><div class="nm">${esc(n||'Your name')}</div><div class="ct">${f?`<span class="fl">${f}</span> `:''}${esc(P.country||'')}</div></div></div><div class="links">${TNAV.map(x=>`<button data-v="${x[0]}" aria-current="${c===x[0]}">${ic(x[2])}<span class="tx">${x[1]}</span></button>`).join('')}</div><button class="hub" data-v="landing">${ic('layout-grid')}<span class="tx">LifeHub</span></button><div class="ver">Version ${VER}</div>`}
const _r=render;
render=function(){const ap=document.getElementById('app');
 if(SPACE!=='travel'||view==='landing')return _r();
 if(!/^tv/.test(view))view='tvmap';
 if(!TV.world&&!TV.err)loadWorld();
 const sy=window.scrollY;applyTheme();ap.className='app asp-t';ap.style.cssText='';
 document.getElementById('side').innerHTML=tside();
 const v=view.split(':'),F=TVIEWS[v[0]];document.getElementById('main').innerHTML=syncBanner()+(F?F(v[1]):tvmap());icons();monoize();window.scrollTo(0,sy);if(v[0]==='tvmap')mapInit()};
const _land=landing;landing=()=>_land().replace(/<div class="pick off asp-t"[^>]*>([\s\S]*?)<\/div>/,(m,i)=>`<button class="pick asp-t" data-v="tvmap" data-sp="travel">${i.replace(/<span class="soon">[^<]*<\/span>/,'')}</button>`);
VER='2.6.0';

/* ---------- events ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act^="tv-"]');if(!b)return;e.stopImmediatePropagation();const a=b.getAttribute('data-act'),A=(b.getAttribute('data-a')||'').split('|'),T=TS();
 if(a==='tv-zin'){MAP.zoom&&MAP.zoom(.6);return}if(a==='tv-zout'){MAP.zoom&&MAP.zoom(1.7);return}if(a==='tv-zreset'){MAP.reset&&MAP.reset();return}
 if(a==='tv-add'){TV.add=!TV.add;b.textContent=TV.add?'Tap the map now…':'Or tap the map';const s=document.getElementById('tvsvg');if(s)s.style.cursor=TV.add?'crosshair':'';return}
 if(a==='tv-pick'){const c=TV.hits[+A[0]];if(c){fillPin({name:c[0],la:c[2],lo:c[3],c:c[1]});document.getElementById('tvres').innerHTML='';document.getElementById('tvq').value=''}return}
 if(a==='tv-dv')T.visits=T.visits.filter(v=>v.id!=A[0]);
 else if(a==='tv-dp'){if(!confirm('Delete this place and its visits?'))return;T.places=T.places.filter(p=>p.id!=A[0]);T.visits=T.visits.filter(v=>v.p!=A[0]);view='tvplaces'}
 else if(a==='tv-dt'){if(!confirm('Delete this trip and its visits?'))return;T.trips=T.trips.filter(t=>t.id!=A[0]);T.visits=T.visits.filter(v=>v.trip!=A[0]);view='tvtrips'}
 sv()},true);
document.addEventListener('submit',e=>{const f=e.target,k=f.getAttribute('data-f')||'';if(k.indexOf('tv-')!==0)return;e.stopImmediatePropagation();e.preventDefault();const T=TS(),v=n=>f.elements[n]?f.elements[n].value.trim():'';
 if(k==='tv-trip'){const t={id:fnew(),name:v('name'),start:v('start'),end:v('end'),notes:''};T.trips.push(t);view='tvtrip:'+t.id;sv()}
 else if(k==='tv-visit'){const q=f.getAttribute('data-a').split(':'),o={id:fnew(),from:v('from'),ft:v('ft'),to:v('to'),tt:v('tt'),journal:v('journal')};if(q[0]==='p'){o.p=q[1];o.trip=v('ref')}else{o.trip=q[1];o.p=v('ref')}if(!tr(o.trip)||!tp(o.p))return;T.visits.push(o);ext(tr(o.trip),o);sv()}
 else if(k==='tv-pin'){const la=parseFloat(v('la')),lo=parseFloat(v('lo')),c=v('c'),nm=v('name');if(!isFinite(la)||!isFinite(lo)||!c){alert('Search for a place, or tap the map on land, first.');return}
  let t=v('trip')?tr(v('trip')):null;if(!t){if(!v('ntrip')){alert('Choose a trip or enter a new trip name.');return}t={id:fnew(),name:v('ntrip'),start:'',end:'',notes:''};T.trips.push(t)}
  let pl=T.places.find(p=>p.name.toLowerCase()===nm.toLowerCase()&&Math.abs(p.la-la)<.3&&Math.abs(p.lo-lo)<.3);if(!pl){pl={id:fnew(),name:nm,la,lo,c,r:v('r')};T.places.push(pl)}
  const vi={id:fnew(),p:pl.id,trip:t.id,from:v('from'),ft:v('ft'),to:v('to'),tt:v('tt'),journal:v('journal')};T.visits.push(vi);ext(t,vi);TV.pend=null;
  if(!pl.r&&REGC.includes(c))findRegion(pl).then(sv,sv);else sv()}},true);
document.addEventListener('change',e=>{const t=e.target;if(t.id==='tvpf'){e.stopImmediatePropagation();TV.pf=t.value;render();return}
 const q=t.getAttribute&&t.getAttribute('data-tvf');if(!q)return;e.stopImmediatePropagation();const a=q.split('|'),o=a[0]==='t'?tr(a[1]):a[0]==='p'?tp(a[1]):TS().visits.find(x=>x.id==a[1]);if(!o)return;
 if(a[2]==='name'&&!t.value.trim()){sv();return}o[a[2]]=t.value;sv()},true);
document.addEventListener('input',e=>{if(e.target.id!=='tvq')return;const q=e.target.value.trim().toLowerCase(),res=document.getElementById('tvres');if(!res)return;if(q.length<2){res.innerHTML='';return}
 const go=()=>{TV.hits=TV.cities.filter(c=>c[0].toLowerCase().startsWith(q)).sort((a,b)=>b[4]-a[4]).slice(0,8);res.innerHTML=TV.hits.map((c,i)=>`<button type="button" class="chip" data-act="tv-pick" data-a="${i}">${esc(c[0])} · ${esc(cn(c[1]).name)}</button>`).join('')||'<span class="dk">No match. Tap the map instead.</span>'};
 if(TV.cities)go();else loadCities().then(go)});

/* ---------- styles ---------- */
const st=document.createElement('style');st.textContent='.tvmapbox{position:relative;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--side)}#tvsvg{display:block;width:100%;aspect-ratio:2/1;max-height:72vh;touch-action:none;cursor:grab;user-select:none}.tvctl{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px}.tvctl .ghost{background:var(--card);min-width:36px;padding:6px 10px}.tvmapbox text{pointer-events:none}';document.head.appendChild(st);

/* ---------- start ---------- */
if(SPACE==='travel'&&!/^tv/.test(view)&&view!=='landing')view='tvmap';
render();
})();
