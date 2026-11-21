/* LifeHub Goals space, Phase 1: years + themes, categories, goals, nested weighted steps, roll-up, pace, dashboard, goal page.
   Load AFTER the main inline script:  <script src="goals.js"></script>  */
(function(){
const SZ={S:1,M:2,L:3,XL:5},
PRI=[['low','Low',1],['normal','Normal',2],['high','High',3],['highest','Highest',4]],
STS=[['todo','Not started'],['doing','In progress'],['paused','Paused'],['done','Done'],['dropped','Dropped']],
CN=['Health','Finance','Career','Relationships','Knowledge','Leisure','Appearance','Life'],
CI=['heart-pulse','wallet','briefcase','users','book-open','sun','sparkles','compass'],
GNAV=[['gldash','Dashboard','layout-dashboard'],['glgoals','Goals','target'],['glyears','Years','calendar-range'],['glsettings','Settings','settings']];
let GF={cat:'',st:'',pri:''},GWIN=null,YED=null;

/* ---------- data ---------- */
const GS=()=>{const g=S.gl=S.gl||{};g.years=g.years||[];if(!g.cats)g.cats=CN.map((n,i)=>({id:'c'+i,name:n,icon:CI[i]}));g.goals=g.goals||[];g.sel=g.sel||new Date().getFullYear();return g};
const yr=y=>GS().years.find(x=>x.y==y), gid=id=>GS().goals.find(x=>x.id==id), cat=id=>GS().cats.find(x=>x.id===id);
const hue=()=>{const y=yr(GS().sel);return y&&y.hue!=null?+y.hue:250};

/* ---------- progress maths ---------- */
const pw=g=>(PRI.find(p=>p[0]===g.pri)||PRI[1])[2];
const wa=(l,f)=>{let w=0,t=0;l.forEach(x=>{const r=f(x);w+=r[0];t+=r[0]*r[1]});return w?t/w:0};
const sp=s=>(s.kids&&s.kids.length)?wa(s.kids,x=>[SZ[x.size]||2,sp(x)]):(s.done?100:0);
const raw=g=>g.steps.length?wa(g.steps,x=>[SZ[x.size]||2,sp(x)]):(+g.manual||0);
const gp=g=>g.status==='done'?100:raw(g);
const elapsed=g=>{const a=new Date(g.start+'T00:00:00'),b=new Date(g.due+'T00:00:00'),n=new Date();return b>a?Math.max(0,Math.min(100,(n-a)/(b-a)*100)):100};
const pace=(p,e,over)=>{const d=p-e;return over||d<-25?['risk','At risk',10]:d>=10?['ahead','Ahead',100]:d>=-10?['on','On track',80]:['behind','Behind',40]};
const gpace=g=>{if(g.status==='done')return['done','Done',100];if(g.status==='paused'||g.status==='dropped')return null;const p=gp(g);return pace(p,elapsed(g),new Date(g.due+'T23:59:59')<new Date()&&p<100)};
const live=l=>l.filter(g=>g.status!=='paused'&&g.status!=='dropped');
const agg=l=>{l=live(l);if(!l.length)return null;const p=wa(l,g=>[pw(g),gp(g)]),e=wa(l,g=>[pw(g),elapsed(g)]);return{p,e,n:l.length,pc:pace(p,e,false)}};
const pq=pc=>pc?qp(pc[1],pc[2]):'';
const fs=(arr,id)=>{for(let i=0;i<arr.length;i++){if(arr[i].id==id)return[arr,i];const r=fs(arr[i].kids||[],id);if(r)return r}return null};
const flat=(a,d,o)=>{a.forEach(s=>{o.push([s.id,'— '.repeat(d)+'Under: '+esc(s.title)]);flat(s.kids||[],d+1,o)});return o};
function after(g){const p=raw(g);if(g.status!=='done'&&g.status!=='paused'&&g.status!=='dropped'){if(p>=100){g.status='done';GWIN=g.title}else if(p>0)g.status='doing'}else if(g.status==='done'&&p<100&&g.steps.length)g.status='doing'}

/* ---------- small html helpers ---------- */
const ic=n=>`<i data-lucide="${n}"></i>`;
const ring=(p,z)=>`<svg class="ring" style="width:${z}px;height:${z}px" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="var(--acc)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${p*3.14} 314" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-size="28" font-weight="600" fill="currentColor" font-family="IBM Plex Mono,monospace">${Math.round(p)}%</text></svg>`;
const head=(t,s)=>`<div class="lab dhd">Goals · ${GS().sel}</div><h1 class="greet">${t}</h1><p class="sub">${s}</p>`;
const ysel=()=>{const g=GS(),ys={};g.years.forEach(x=>ys[x.y]=1);ys[g.sel]=1;ys[new Date().getFullYear()]=1;return`<div class="row" style="margin-top:0"><label>Year<select id="glyr">${sel(Object.keys(ys).sort().map(y=>[y,y+(yr(y)?' · '+esc(yr(y).name):'')]),g.sel)}</select></label></div>`};
const yform=y=>{const t=yr(y)||{};return`<form data-f="gl-year"><label>Year<input name="y" type="number" value="${y}" required></label><label>Theme<input name="name" type="text" required placeholder="Rebirth" value="${esc(t.name)}"></label><label>Statement<input name="statement" type="text" placeholder="One line on what this year is about" value="${esc(t.statement)}"></label><label>Guiding question<input name="question" type="text" placeholder="What am I becoming?" value="${esc(t.question)}"></label><label>Theme colour<input name="hue" type="range" min="0" max="360" value="${t.hue==null?250:t.hue}"></label><button class="add" type="submit">Save theme</button></form>`};
const tile=g=>{const p=gp(g),c=cat(g.cat),pr=PRI.find(x=>x[0]===g.pri)||PRI[1];return`<button class="tile" data-v="glgoal:${g.id}" aria-label="${esc(g.title)}">${g.img?`<img src="${g.img}" alt="">`:`<div style="position:absolute;inset:0;background:linear-gradient(135deg,var(--a-d),var(--a-p))"></div>`}<span class="badge tb">${Math.round(p)}%</span><div class="cap"><span class="pill">${esc(pr[1])}</span><span class="pill">${esc((STS.find(s=>s[0]===g.status)||[])[1])}</span><h3>${esc(g.title)}</h3><div class="bar" style="margin:8px 0 0"><i style="width:${p}%"></i></div></div></button>`};

/* ---------- pages ---------- */
function gldash(){const g=GS(),y=yr(g.sel),gs=g.goals.filter(x=>x.year==g.sel),A=agg(gs);
if(!y)return head('Plan '+g.sel,'Give this year a theme to get started. It sets the colour and tone of your goals.')+ysel()+`<div class="card">${yform(g.sel)}</div>`;
let h=head(esc(y.name),esc(y.statement||''))+ysel()+'<div class="dgrid">';
h+=`<div class="dbx s6 hero" role="button" tabindex="0" data-v="glgoals">${ring(A?A.p:0,130)}<div><div class="lab dl">${ic('target')}${esc(y.name)} · ${g.sel}</div><div class="hl">${A?Math.round(A.p)+'% complete':'No goals yet'}</div><div class="dk">${A?`${A.n} active goals · time elapsed ${Math.round(100*((Date.now()-new Date(g.sel+'-01-01'))/(365*864e5)>1?1:Math.max(0,(Date.now()-new Date(g.sel+'-01-01'))/(365*864e5))))}%`:'Add your first goal to start tracking.'}</div><div style="margin-top:6px">${A?pq(A.pc):''}</div>${y.question?`<p class="sub" style="font-style:italic">${esc(y.question)}</p>`:''}</div></div>`;
g.cats.forEach(c=>{const l=gs.filter(x=>x.cat===c.id),a=agg(l);if(!l.length)return;h+=`<div class="dbx s2" role="button" tabindex="0" data-act="gl-fcat" data-a="${c.id}"><div class="lab dl">${ic(c.icon)}${esc(c.name)}</div><div class="big">${a?Math.round(a.p):'–'}<small>%</small></div>${a?bar(a.p,'var(--acc)'):''}<div class="dk">${l.length} goal${l.length>1?'s':''}</div>${a?pq(a.pc):''}</div>`});
const soon=live(gs).filter(x=>x.status!=='done'&&(new Date(x.due+'T00:00:00')-Date.now())/864e5<=30).sort((a,b)=>a.due<b.due?-1:1).slice(0,5),
 beh=live(gs).filter(x=>{const p=gpace(x);return p&&(p[0]==='behind'||p[0]==='risk')}).slice(0,5),
 li=(l,f)=>l.length?l.map(x=>`<div class="dh"><a href="#" data-v="glgoal:${x.id}" style="color:inherit;text-decoration:none">${esc(x.title)}</a><span class="dk mono">${f(x)}</span></div>`).join(''):'<div class="dk">Nothing here.</div>';
h+=`<div class="dbx s3">${ttlx('Due within 30 days','cal')}${li(soon,x=>x.due)}</div><div class="dbx s3">${ttlx('Falling behind','debt')}${li(beh,x=>Math.round(gp(x))+'%')}</div></div>`;
if(!gs.length)h+='<div class="row"><button class="add" data-v="glnew">+ New goal</button></div>';
return h}

function glgoals(){const g=GS(),y=yr(g.sel);let gs=g.goals.filter(x=>x.year==g.sel);
const f=(k,v)=>!v||k(v);gs=gs.filter(x=>(!GF.cat||x.cat===GF.cat||(x.c2||[]).includes(GF.cat))&&(!GF.st||x.status===GF.st)&&(!GF.pri||x.pri===GF.pri));
let h=head('Goals',y?`Theme: <b>${esc(y.name)}</b>`:'No theme set for this year yet.')+ysel()+`<div class="row"><label>Category<select id="glfc">${sel([['','All']].concat(g.cats.map(c=>[c.id,esc(c.name)])),GF.cat)}</select></label><label>Status<select id="glfs">${sel([['','All']].concat(STS),GF.st)}</select></label><label>Priority<select id="glfp">${sel([['','All']].concat(PRI.map(p=>[p[0],p[1]])),GF.pri)}</select></label></div>`;
g.cats.forEach(c=>{const l=gs.filter(x=>x.cat===c.id);if(!l.length)return;const a=agg(l);h+=`<h2>${esc(c.name)}${a?` · ${Math.round(a.p)}%`:''}</h2><div class="tiles">${l.map(tile).join('')}</div>`});
return h+`<h2>Add</h2><div class="tiles"><button class="tile newt" data-v="glnew">+ New goal</button></div>`}

function glnew(){const g=GS(),s=g.sel;return`<button class="ghost" data-v="glgoals">← Back to goals</button><h1 style="margin:12px 0">New goal</h1><form class="mform" data-f="gl-goal"><div class="grid"><label>Title<input name="title" type="text" required></label><label>Primary category<select name="cat">${sel(g.cats.map(c=>[c.id,esc(c.name)]))}</select></label><label>Priority<select name="pri">${sel(PRI.map(p=>[p[0],p[1]]),'normal')}</select></label><label>Start<input name="start" type="date" value="${s}-01-01"></label><label>Due<input name="due" type="date" value="${s}-12-31"></label><label>Thumbnail<input name="img" type="file" accept="image/*"></label></div><fieldset class="opts2"><legend class="lab">Secondary categories</legend>${g.cats.map(c=>`<label class="chk"><input type="checkbox" name="c2" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</fieldset><label>Description<textarea name="desc" rows="3"></textarea></label><label>Why it matters<textarea name="why" rows="3"></textarea></label><button class="add" type="submit">Create goal</button></form>`}

function srow(g,s,d){const k=s.kids||[],p=sp(s),b=`${g.id}|${s.id}`;return`<div class="gst" style="margin-left:${d*22}px"><input type="checkbox" data-gls="${b}|done"${k.length?' disabled'+(p>=100?' checked':''):s.done?' checked':''} aria-label="Done"><input class="gt" data-gls="${b}|title" value="${esc(s.title)}" aria-label="Step"><select data-gls="${b}|size" aria-label="Size">${sel(['S','M','L','XL'],s.size||'M')}</select><span class="mono dk">${Math.round(p)}%</span><input type="date" data-gls="${b}|due" value="${esc(s.due)}" aria-label="Due"><button class="x" data-act="gl-dstep" data-a="${b}" aria-label="Delete step">×</button></div>`+k.map(c=>srow(g,c,d+1)).join('')}

function glgoal(id){const gl=gid(id),g=GS();if(!gl)return glgoals();const p=gp(gl),pc=gpace(gl),c=cat(gl.cat),F=f=>`data-glf="${gl.id}|${f}"`;
let h=`<button class="ghost" data-v="glgoals">← Back to goals</button><div class="card" style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin-top:12px">${gl.img?`<img src="${gl.img}" alt="" style="width:110px;aspect-ratio:3/4;object-fit:cover;border-radius:10px">`:''}${ring(p,120)}<div style="flex:1;min-width:220px"><input ${F('title')} value="${esc(gl.title)}" style="font:600 22px Inter,sans-serif" aria-label="Title"><div class="chips" style="margin-top:8px"><span>${c?esc(c.name):'No category'}</span>${(gl.c2||[]).map(i=>cat(i)?`<span>${esc(cat(i).name)}</span>`:'').join('')}<span>${esc(yr(gl.year)?yr(gl.year).name:gl.year)}</span></div><div style="margin-top:8px">${pq(pc)}</div></div></div>`;
h+=`<h2>Details</h2><div class="card"><div class="grid"><label>Status<select ${F('status')}>${sel(STS,gl.status)}</select></label><label>Priority<select ${F('pri')}>${sel(PRI.map(x=>[x[0],x[1]]),gl.pri)}</select></label><label>Primary category<select ${F('cat')}>${sel(g.cats.map(x=>[x.id,esc(x.name)]),gl.cat)}</select></label><label>Start<input type="date" ${F('start')} value="${gl.start}"></label><label>Due<input type="date" ${F('due')} value="${gl.due}"></label>${gl.steps.length?'':`<label>Progress (%)<input type="number" min="0" max="100" ${F('manual')} value="${esc(gl.manual)}"></label>`}<label>Thumbnail<input type="file" accept="image/*" ${F('img')}></label></div><fieldset class="opts2" style="margin-top:10px"><legend class="lab">Secondary categories</legend>${g.cats.filter(x=>x.id!==gl.cat).map(x=>`<label class="chk"><input type="checkbox" data-glc2="${gl.id}|${x.id}"${(gl.c2||[]).includes(x.id)?' checked':''}> ${esc(x.name)}</label>`).join('')}</fieldset><div class="grid" style="margin-top:10px"><label>Description<textarea rows="3" ${F('desc')}>${esc(gl.desc)}</textarea></label><label>Why it matters<textarea rows="3" ${F('why')}>${esc(gl.why)}</textarea></label><label>Notes<textarea rows="3" ${F('notes')}>${esc(gl.notes)}</textarea></label></div></div>`;
h+=`<h2>Steps</h2><div class="card">${gl.steps.length?gl.steps.map(s=>srow(gl,s,0)).join(''):'<p class="empty" style="margin:0">No steps yet. Without steps, use the Progress field above.</p>'}<p class="sub" style="margin:10px 0 0">Size sets how much a step counts: S 1, M 2, L 3, XL 5. A step with sub-steps takes its progress from them.</p><h3 style="margin-top:14px">Add a step</h3><form data-f="gl-step" data-a="${gl.id}"><label>Step<input name="title" type="text" required></label><label>Size<select name="size">${sel(['S','M','L','XL'],'M')}</select></label><label>Under<select name="parent">${sel([['','Top level']].concat(flat(gl.steps,0,[])))}</select></label><label>Due<input name="due" type="date"></label><button class="add" type="submit">Add step</button></form></div><div class="row"><button class="ghost" data-act="gl-dgoal" data-a="${gl.id}">Delete goal</button></div>`;
return h}

function glyears(){const g=GS(),ys=g.years.slice().sort((a,b)=>b.y-a.y),nx=ys.length?Math.max(...ys.map(x=>x.y))+1:new Date().getFullYear();
let h=head('Years','Each year has one theme and its own set of goals.');
h+='<div class="tiles" style="margin-top:12px">'+ys.map(y=>{const a=agg(g.goals.filter(x=>x.year==y.y));return`<div class="card"><div class="dh"><h3>${y.y}</h3><button class="x" data-act="gl-edy" data-a="${y.y}" aria-label="Edit theme">✎</button></div><div class="nm" style="font-size:20px">${esc(y.name)}</div><p class="sub">${esc(y.statement)}</p><div class="dh"><b class="mono">${a?Math.round(a.p)+'%':'–'}</b>${a?pq(a.pc):''}</div><div class="row" style="margin:8px 0 0"><button class="ghost" data-act="gl-selyear" data-a="${y.y}">Open</button></div></div>`}).join('')+'</div>';
const ey=YED||nx;return h+`<h2>${YED?'Edit '+YED:'Plan '+nx}</h2><div class="card">${yform(ey)}</div>`}

function glsettings(){const g=GS();return head('Settings','Categories are shared across all years.')+`<h2>Categories</h2><div class="card">${g.cats.map(c=>`<div class="band">${ic(c.icon)}<input data-glcat="${c.id}" value="${esc(c.name)}" style="width:200px" aria-label="Category name"><button class="x" data-act="gl-dcat" data-a="${c.id}" aria-label="Delete category">×</button></div>`).join('')}<form data-f="gl-cat" style="margin-top:10px"><label>New category<input name="name" type="text" required></label><button class="add" type="submit">Add category</button></form><p class="sub" style="margin:0">A category with goals in it cannot be deleted. Move or delete those goals first.</p></div>`}

/* ---------- shell ---------- */
const VIEWS={gldash,glgoals,glnew,glyears,glsettings};
function gside(){const n=(P.name||'').trim(),ini=n?n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase():'LH',fl=flag(P.country),cur=({glgoal:'glgoals',glnew:'glgoals'})[view.split(':')[0]]||view.split(':')[0];
return`<div class="prof"><div class="av">${P.pic?`<img src="${P.pic}" alt="">`:`<span>${esc(ini)}</span>`}</div><div class="pt"><div class="nm">${esc(n||'Your name')}</div><div class="ct">${fl?`<span class="fl">${fl}</span> `:''}${esc(P.country||'')}</div></div></div><div class="links">${GNAV.map(x=>`<button data-v="${x[0]}" aria-current="${cur===x[0]}">${ic(x[2])}<span class="tx">${x[1]}</span></button>`).join('')}</div><button class="hub" data-v="landing">${ic('layout-grid')}<span class="tx">LifeHub</span></button><div class="ver">Version ${VER}</div>`}
function gbanner(){if(!GWIN)return'';const t=GWIN;GWIN=null;return`<div class="pr"><span class="trophy">🏆</span><div><b>Goal complete!</b><div>${esc(t)}</div></div></div>`}
const _r=render;
render=function(){const ap=document.getElementById('app');
 if(SPACE!=='goals'||view==='landing'){if(ap)ap.style.cssText='';return _r()}
 if(!/^gl/.test(view))view='gldash';
 const sy=window.scrollY;applyTheme();const h=hue();
 ap.className='app asp-g';ap.style.cssText=`--a-p:hsl(${h},50%,48%);--a-a:hsl(${h},75%,70%);--a-d:hsl(${h},50%,30%);--a-t:hsl(${h},45%,90%)`;
 document.getElementById('side').innerHTML=gside();
 const v=view.split(':'),F=VIEWS[v[0]],body=v[0]==='glgoal'?glgoal(v[1]):F?F():gldash();
 document.getElementById('main').innerHTML=syncBanner()+gbanner()+body;icons();monoize();window.scrollTo(0,sy)};
const _land=landing;landing=()=>_land().replace(/<div class="pick off asp-g"[^>]*>([\s\S]*?)<\/div>/,(m,i)=>`<button class="pick asp-g" data-v="gldash" data-sp="goals">${i.replace(/<span class="soon">[^<]*<\/span>/,'')}</button>`);
NAV.forEach(x=>{if(x[0]==='goals')x[1]='Targets'});
const _g=goals;goals=()=>_g().replace('<h1>Goals</h1>','<h1>Targets</h1>');
VER='2.2.0';

/* ---------- events ---------- */
const sv=()=>{save();render()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act^="gl-"]');if(!b)return;e.stopImmediatePropagation();
 const a=b.getAttribute('data-act'),A=(b.getAttribute('data-a')||'').split('|'),g=GS();
 if(a==='gl-fcat'){GF={cat:A[0],st:'',pri:''};view='glgoals'}
 else if(a==='gl-selyear'){g.sel=+A[0];view='gldash'}
 else if(a==='gl-edy')YED=+A[0];
 else if(a==='gl-dstep'){const gl=gid(A[0]),r=fs(gl.steps,A[1]);if(r)r[0].splice(r[1],1);after(gl)}
 else if(a==='gl-dgoal'){if(!confirm('Delete this goal and its steps?'))return;g.goals=g.goals.filter(x=>x.id!=A[0]);view='glgoals'}
 else if(a==='gl-dcat'){if(g.goals.some(x=>x.cat===A[0])){alert('This category still has goals. Move or delete them first.');return}g.cats=g.cats.filter(c=>c.id!==A[0])}
 sv()},true);
document.addEventListener('submit',e=>{const f=e.target,k=f.getAttribute('data-f')||'';if(k.indexOf('gl-')!==0)return;e.stopImmediatePropagation();e.preventDefault();
 const g=GS(),v=n=>f.elements[n]?f.elements[n].value.trim():'';
 if(k==='gl-year'){const y=+v('y');let o=yr(y);if(!o){o={y};g.years.push(o)}Object.assign(o,{name:v('name'),statement:v('statement'),question:v('question'),hue:+v('hue')});g.sel=y;YED=null;sv()}
 else if(k==='gl-cat'){g.cats.push({id:'c'+Date.now(),name:v('name'),icon:'target'});sv()}
 else if(k==='gl-step'){const gl=gid(f.getAttribute('data-a')),s={id:Date.now(),title:v('title'),size:v('size'),due:v('due'),done:false,kids:[]};
  if(v('parent')){const r=fs(gl.steps,v('parent'));if(r){const q=r[0][r[1]];(q.kids=q.kids||[]).push(s)}}else gl.steps.push(s);after(gl);sv()}
 else if(k==='gl-goal'){const o={id:Date.now(),year:g.sel,title:v('title'),desc:v('desc'),why:v('why'),notes:'',img:'',cat:v('cat'),c2:Array.from(f.querySelectorAll('[name=c2]:checked')).map(x=>x.value).filter(x=>x!==v('cat')),pri:v('pri'),status:'todo',start:v('start')||g.sel+'-01-01',due:v('due')||g.sel+'-12-31',manual:0,steps:[],created:today()},
  fin=img=>{if(img)o.img=img;g.goals.push(o);view='glgoal:'+o.id;sv()},fl=f.elements.img.files[0];if(fl)rimg(fl,360,480,fin);else fin(null)}},true);
document.addEventListener('change',e=>{const t=e.target,g=GS(),at=n=>t.getAttribute(n);
 if(t.id==='glyr'){g.sel=+t.value;e.stopImmediatePropagation();sv();return}
 if(t.id==='glfc'||t.id==='glfs'||t.id==='glfp'){GF[{glfc:'cat',glfs:'st',glfp:'pri'}[t.id]]=t.value;e.stopImmediatePropagation();render();return}
 if(at('data-glf')){e.stopImmediatePropagation();const q=at('data-glf').split('|'),gl=gid(q[0]),f=q[1];
  if(f==='img'){if(t.files[0])rimg(t.files[0],360,480,u=>{gl.img=u;sv()});return}
  gl[f]=f==='manual'?Math.max(0,Math.min(100,+t.value||0)):t.value;if(f==='status'&&t.value==='done')GWIN=gl.title;if(f==='cat')gl.c2=(gl.c2||[]).filter(x=>x!==t.value);sv();return}
 if(at('data-glc2')){e.stopImmediatePropagation();const q=at('data-glc2').split('|'),gl=gid(q[0]);gl.c2=(gl.c2||[]).filter(x=>x!==q[1]);if(t.checked)gl.c2.push(q[1]);sv();return}
 if(at('data-gls')){e.stopImmediatePropagation();const q=at('data-gls').split('|'),gl=gid(q[0]),r=fs(gl.steps,q[1]);if(!r)return;const s=r[0][r[1]];
  if(q[2]==='done'){s.done=t.checked;after(gl)}else s[q[2]]=t.value;sv();return}
 if(at('data-glcat')){e.stopImmediatePropagation();const c=cat(at('data-glcat'));if(c&&t.value.trim()){c.name=t.value.trim();sv()}}},true);

/* ---------- styles ---------- */
const st=document.createElement('style');st.textContent='textarea{font:14px Inter,system-ui,sans-serif;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:100%;resize:vertical}.gst{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--line)}.gst input[type=checkbox]{width:20px;height:20px;flex:none;accent-color:var(--acc)}.gst .gt{flex:1;min-width:140px}.gst select{width:72px}.gst input[type=date]{width:140px}.asp-g .tile .badge.tb{z-index:2}';document.head.appendChild(st);

/* ---------- start ---------- */
if(SPACE==='goals'&&!/^gl/.test(view)&&view!=='landing')view='gldash';
render();
})();
