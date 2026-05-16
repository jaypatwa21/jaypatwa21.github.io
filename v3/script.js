/* ==========================================================
   JayOS v3 — operating-system portfolio
   Window manager · ML Lab · Terminal · Spotlight · Dock
========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth <= 760;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ==========================================================
   WebGL wallpaper
========================================================== */
function initWall(){
  const cv = $('#wall');
  const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
  if (!gl){ cv.style.display = 'none'; return; }
  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision highp float;uniform vec2 u_res;uniform float u_time;uniform vec2 u_m;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
  void main(){
    vec2 uv=gl_FragCoord.xy/u_res.xy;float ar=u_res.x/u_res.y;
    vec2 p=vec2(uv.x*ar,uv.y)*2.4;float t=u_time*.035;
    vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
    vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+t),fbm(p+3.2*q+vec2(8.3,2.8)-t));
    float f=fbm(p+3.2*r);
    float md=distance(vec2(uv.x*ar,uv.y),vec2(u_m.x*ar,u_m.y));
    f+=(1.-smoothstep(0.,.6,md))*.22;
    vec3 bg=vec3(.039,.043,.078);
    vec3 bl=vec3(.357,.549,1.);
    vec3 pu=vec3(.78,.49,1.);
    vec3 pk=vec3(1.,.494,.714);
    vec3 c=bg;
    c=mix(c,bl,clamp(f*f*1.8,0.,1.));
    c=mix(c,pu,clamp(length(q)*.85,0.,1.));
    c=mix(c,pk,clamp(r.x*r.x*1.1,0.,1.)*.5);
    c*=.32+.7*f;c=mix(bg,c,.7);
    gl_FragColor=vec4(c,1.);
  }`;
  const mk = (t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);
    return gl.getShaderParameter(x,gl.COMPILE_STATUS)?x:null;};
  const v=mk(gl.VERTEX_SHADER,vs),f=mk(gl.FRAGMENT_SHADER,fs);
  if(!v||!f){cv.style.display='none';return;}
  const pr=gl.createProgram();gl.attachShader(pr,v);gl.attachShader(pr,f);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){cv.style.display='none';return;}
  gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);
  gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
  const uR=gl.getUniformLocation(pr,'u_res'),uT=gl.getUniformLocation(pr,'u_time'),
        uM=gl.getUniformLocation(pr,'u_m');
  let mx=.5,my=.5,tx=.5,ty=.5;
  addEventListener('pointermove',e=>{tx=e.clientX/innerWidth;ty=1-e.clientY/innerHeight;},{passive:true});
  function size(){const d=Math.min(devicePixelRatio||1,1.4);
    cv.width=innerWidth*d;cv.height=innerHeight*d;gl.viewport(0,0,cv.width,cv.height);}
  size();addEventListener('resize',size);
  const t0=performance.now();
  (function loop(){
    mx=lerp(mx,tx,.04);my=lerp(my,ty,.04);
    gl.uniform2f(uR,cv.width,cv.height);
    gl.uniform1f(uT,(performance.now()-t0)/1000);
    gl.uniform2f(uM,mx,my);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(!reduced) requestAnimationFrame(loop);
  })();
}
try{ initWall(); }catch(e){ const c=$('#wall'); if(c) c.style.display='none'; }

/* ==========================================================
   Clocks + battery
========================================================== */
function fmtTime(d){ return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
function tick(){
  const d = new Date();
  const t = fmtTime(d);
  const date = d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  [['#loginClock',t],['#mbClock',t],
   ['#loginDate',d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})],
   ['#mbDate',date]].forEach(([s,val])=>{ const e=$(s); if(e) e.textContent=val; });
}
tick(); setInterval(tick,1000*20);

function initBattery(){
  const fill=$('#battFill'), pct=$('#battPct');
  if(navigator.getBattery){
    navigator.getBattery().then(b=>{
      const upd=()=>{ const p=Math.round(b.level*100);
        fill.style.width=p+'%'; pct.textContent=p+'%';
        fill.style.background=p<20?'#ff5f57':'var(--mint)'; };
      upd(); b.addEventListener('levelchange',upd);
    }).catch(()=>{});
  }
}

/* ==========================================================
   BOOT sequence
========================================================== */
function boot(){
  const post=$('#post'), fill=$('#bootFill');
  const lines=[
    'JayOS BIOS v3.0 — Patwa Systems Inc.',
    '> Curiosity Core @ 8.6GHz ............ <span class="ok">[ OK ]</span>',
    '> Memory: 4 projects / 3 certs ....... <span class="ok">[ OK ]</span>',
    '> Detecting drives: /skills /projects  <span class="ok">[ OK ]</span>',
    '> Kernel module: data-science.ko ..... <span class="ok">[ OK ]</span>',
    '> Calibrating ML pipeline ............ <span class="ok">[ OK ]</span>',
    '> Mounting /home/jay ................. <span class="ok">[ OK ]</span>',
    '> Uplink: <span class="hl">AHMEDABAD &#8644; WORLD</span> ......... <span class="ok">[ OK ]</span>',
    '> Launching desktop environment ......'
  ];
  let i=0;
  function step(){
    if(i<lines.length){
      post.innerHTML += lines[i] + '\n';
      fill.style.width = ((i+1)/lines.length*100) + '%';
      i++;
      setTimeout(step, reduced?40:230);
    } else {
      setTimeout(toLogin, 600);
    }
  }
  step();
}
function toLogin(){
  $('#boot').classList.add('gone');
  setTimeout(()=>{ $('#boot').classList.add('hidden'); },520);
  document.body.classList.remove('phase-boot');
  $('#login').classList.remove('hidden');
  setTimeout(()=>$('#pw').focus(),100);
}
$('#loginForm').addEventListener('submit',e=>{ e.preventDefault(); login(); });
function login(){
  const lg=$('#login');
  lg.classList.add('leaving');
  setTimeout(()=>{
    lg.classList.add('hidden');
    $('#os').classList.remove('hidden');
    startDesktop();
  },560);
}

/* ==========================================================
   APP definitions
========================================================== */
const APPS = {
  readme:  { title:'README',     icon:'📖', w:540, h:460 },
  about:   { title:'About Jay',  icon:'👤', w:560, h:540 },
  projects:{ title:'Projects',   icon:'🗂️', w:720, h:520 },
  skills:  { title:'Skills',     icon:'⚡', w:540, h:540 },
  mllab:   { title:'ML Lab',     icon:'🧠', w:760, h:580 },
  terminal:{ title:'Terminal',   icon:'⌨️', w:640, h:460 },
  journey: { title:'Journey',    icon:'🗺️', w:580, h:540 },
  contact: { title:'Contact',    icon:'✉️', w:520, h:480 },
  resume:  { title:'Résumé.pdf', icon:'📄', external:true }
};

const RENDER = {
  readme: () => `<div class="app readme">
    <h1>Welcome to JayOS 👋</h1>
    <div class="rm-sub">~/portfolio of Jay Patwa — Data Scientist</div>
    <p>This whole page is a tiny operating system. Everything is real and
    clickable — open apps from the <strong>dock below</strong>, drag windows
    around, or hit search.</p>
    <h3>Try this</h3>
    <ul>
      <li>Open <strong>ML Lab</strong> 🧠 — click on the canvas to place points and watch a k-NN classifier draw a live decision boundary.</li>
      <li>Open <strong>Terminal</strong> ⌨️ — type <kbd>help</kbd>, then <kbd>open mllab</kbd>.</li>
      <li>Press <kbd>Ctrl</kbd>+<kbd>K</kbd> for Spotlight search.</li>
      <li>Right-click the desktop for a context menu.</li>
    </ul>
    <div class="rm-tip"><span>💡</span><span>Tip: drag a window by its title bar.
    Yellow dot minimizes, green maximizes, red closes.</span></div>
  </div>`,

  about: () => `<div class="app">
    <div class="app-hero">
      <div class="app-hero-ico">👤</div>
      <div><h2>Jay Patwa</h2><p>Data Scientist · Data Analyst · Python Developer</p></div>
    </div>
    <p>Final-year <strong>B.Tech Computer Engineering</strong> student at Indus
    University, Ahmedabad (<strong>CGPA 8.6</strong>). I build end to end —
    collect data, train models, ship dashboards people can act on the same day.</p>
    <p>From <strong>ESP32 sensors</strong> in the field to <strong>Power BI</strong>
    on the boardroom screen, I like making messy data say something useful.</p>
    <h3>Snapshot</h3>
    <div class="statg">
      <div class="statc"><b>8.6</b><span>CGPA / 10</span></div>
      <div class="statc"><b>4+</b><span>SHIPPED PROJECTS</span></div>
      <div class="statc"><b>10K+</b><span>ROWS ANALYZED</span></div>
      <div class="statc"><b>3</b><span>CERTIFICATIONS</span></div>
    </div>
    <h3>Currently</h3>
    <p><strong>Open to data science / analytics roles</strong> — full-time or
    internship — for 2026. Languages: English · Hindi · Gujarati.</p>
  </div>`,

  skills: () => {
    const groups = [
      ['Python', 92],['SQL', 88],['Scikit-learn / ML', 84],
      ['Pandas · NumPy', 90],['Power BI · DAX', 86],['Statistics · EDA', 85],
      ['MySQL · MongoDB', 80],['MERN / Web', 76]
    ];
    return `<div class="app">
      <div class="app-hero">
        <div class="app-hero-ico">⚡</div>
        <div><h2>Skills</h2><p>The stack behind the signal</p></div>
      </div>
      ${groups.map(([n,v])=>`
        <div class="skill-row">
          <div class="sr-top"><b>${n}</b><span>${v}%</span></div>
          <div class="skill-bar"><i data-w="${v}"></i></div>
        </div>`).join('')}
      <h3>Also in the toolbox</h3>
      <div class="chips">
        ${'JavaScript,C,C++,Matplotlib,Seaborn,Probability,Git,GitHub,Jupyter,Colab,Postman,Vercel,Render,React,Node.js,Express.js'
          .split(',').map(c=>`<span class="chip">${c}</span>`).join('')}
      </div>
    </div>`;
  },

  journey: () => {
    const rows = [
      ['2026','Open to Data Science / Analytics roles','Final year wrapping up — seeking full-time roles or internships to ship analyses and ML products end to end.'],
      ['Mar 2026','Foundation of Mathematics in AI & ML','Indus University — linear algebra, probability and optimization for machine learning.'],
      ['Jul 2024','Python & ML Intern — Codsoft','Built ML models with Scikit-learn; preprocessing, feature engineering & evaluation on real datasets. Awarded completion certificate.'],
      ['Dec 2023','Upskilling Internship Course','Indus University — certificate course on industry workflows and tooling.'],
      ['2022–26','B.Tech Computer Engineering · CGPA 8.6','Indus University, Ahmedabad — DSA, DBMS, statistics, ML foundations, full-stack development.']
    ];
    return `<div class="app">
      <div class="app-hero">
        <div class="app-hero-ico">🗺️</div>
        <div><h2>Journey</h2><p>Classroom to production</p></div>
      </div>
      <div class="tl">
        ${rows.map(([w,h,p])=>`
          <div class="tl-row">
            <span class="tl-dot"></span>
            <div class="tl-when">${w}</div>
            <h4>${h}</h4>
            <p>${p}</p>
          </div>`).join('')}
      </div>
    </div>`;
  },

  contact: () => `<div class="app">
    <div class="app-hero">
      <div class="app-hero-ico">✉️</div>
      <div><h2>Get in touch</h2><p>Open to opportunities &amp; collaborations</p></div>
    </div>
    <div class="crows">
      <a class="crow" href="mailto:patwajay2101@gmail.com">
        <span class="crow-ico">✉️</span>
        <span><span class="crow-k">Email</span><br><span class="crow-v">patwajay2101@gmail.com</span></span>
        <span class="crow-x">↗</span></a>
      <a class="crow" href="tel:+919998880800">
        <span class="crow-ico">📱</span>
        <span><span class="crow-k">Phone</span><br><span class="crow-v">+91 99988 80800</span></span>
        <span class="crow-x">↗</span></a>
      <a class="crow" href="https://github.com/jaypatwa21" target="_blank" rel="noopener">
        <span class="crow-ico">🐙</span>
        <span><span class="crow-k">GitHub</span><br><span class="crow-v">@jaypatwa21</span></span>
        <span class="crow-x">↗</span></a>
      <a class="crow" href="https://www.linkedin.com/in/jay-patwa-b625031b2/" target="_blank" rel="noopener">
        <span class="crow-ico">💼</span>
        <span><span class="crow-k">LinkedIn</span><br><span class="crow-v">in/jay-patwa</span></span>
        <span class="crow-x">↗</span></a>
      <a class="crow" href="Jay_CV.pdf" target="_blank">
        <span class="crow-ico">📄</span>
        <span><span class="crow-k">Résumé</span><br><span class="crow-v">Jay_CV.pdf</span></span>
        <span class="crow-x">↗</span></a>
    </div>
    <h3>Location</h3>
    <p>Ahmedabad, Gujarat, India 🇮🇳</p>
  </div>`,

  projects: () => {
    const P = PROJECTS;
    return `<div class="finder">
      <div class="finder-side" id="finderSide">
        <div class="fs-h">Projects</div>
        ${P.map((p,i)=>`<button class="finder-item ${i===0?'on':''}" data-i="${i}">
          <span>${p.emoji}</span><span>${p.name}</span></button>`).join('')}
      </div>
      <div class="finder-main" id="finderMain">${projectView(0)}</div>
    </div>`;
  },

  mllab: () => `<div class="mllab">
    <div class="ml-head">
      <h2>🧠 ML Lab — Live k-NN Classifier</h2>
      <p>Click the canvas to drop points. The model re-classifies the whole
      plane on every click — that shaded region is a real
      <code>k-nearest-neighbours</code> decision boundary.</p>
    </div>
    <div class="ml-stage"><canvas id="mlCanvas"></canvas></div>
    <div class="ml-bar">
      <button class="ml-btn cA on" id="mlA"><span class="ml-dotA"></span>Class A</button>
      <button class="ml-btn cB" id="mlB"><span class="ml-dotB"></span>Class B</button>
      <span class="ml-k">k = <b id="mlKv">5</b>
        <input type="range" id="mlK" min="1" max="15" step="2" value="5"></span>
      <button class="ml-ghost" id="mlDemo">⚡ Demo data</button>
      <button class="ml-ghost" id="mlClear">✕ Clear</button>
      <span class="ml-stat" id="mlStat">points: <b>0</b> · draw to begin</span>
    </div>
  </div>`,

  terminal: () => `<div class="term-app">
    <div class="term-out" id="termOut">
      <div class="tl-line"><span class="t-dim">JayOS terminal — type</span> <span class="t-cmd">help</span> <span class="t-dim">to begin.</span></div>
    </div>
    <div class="term-in">
      <span class="tp">jay@jayos:~$</span>
      <input id="termIn" type="text" autocomplete="off" spellcheck="false" aria-label="terminal" />
    </div>
  </div>`
};

const PROJECTS = [
  { emoji:'🌫️', name:'AirSense', sub:'AQI Prediction & Monitoring · 2025–26',
    tags:['Python','Scikit-learn','IoT','ESP32'],
    viz:'● live PM2.5 / PM10 feed',
    points:[
      'ESP32 IoT sensors stream real-time PM2.5 & PM10 data wirelessly.',
      'Scikit-learn model predicts AQI with strong accuracy on field data.',
      'Custom HTML/CSS/JS dashboard for live + forecast monitoring.'
    ]},
  { emoji:'📊', name:'Sales & HR Dashboard', sub:'Power BI Analytics · 2024–25',
    tags:['Power BI','SQL','MySQL','DAX'],
    viz:'KPI dashboard · 10,000+ rows',
    points:[
      'Interactive Power BI dashboard over 10,000+ rows of sales & HR data.',
      'Advanced SQL — JOINs, CTEs and window functions in MySQL.',
      'DAX measures: revenue growth %, attrition rate, regional performance.',
      'Automated reporting workflow with drill-through and slicers.'
    ]},
  { emoji:'🛒', name:'RetailSense', sub:'EDA · Superstore Sales · 2024–25',
    tags:['Python','Pandas','NumPy','Seaborn'],
    viz:'corr(discount, profit) = −0.22',
    points:[
      'End-to-end EDA on 9,994 rows × 21 columns of Superstore data.',
      'Technology leads revenue (>₹8.36L); Furniture margins hurt by 17.4% avg discount.',
      '8+ visualizations proving discount→profit drag and Q4 seasonality.',
      'Delivered 7 actionable business recommendations, published with README.'
    ]},
  { emoji:'🏠', name:'AgastyaHomes', sub:'MERN Rental Platform · 2023–24',
    tags:['MERN','REST API','MongoDB','OAuth'],
    viz:'full-stack · deployed on Render',
    points:[
      'Full-stack MERN property listing platform.',
      'Google OAuth 2.0 authentication + Cloudinary image management.',
      'RESTful APIs with Node.js / Express.js.',
      'Deployed on Render with MongoDB as the scalable backend.'
    ]}
];
function projectView(i){
  const p = PROJECTS[i];
  return `<h2>${p.emoji} ${p.name}</h2>
    <div class="finder-meta">${p.sub}</div>
    <div class="chips">${p.tags.map(t=>`<span class="chip">${t}</span>`).join('')}</div>
    <div class="proj-viz">${p.viz}</div>
    <ul>${p.points.map(x=>`<li>${x}</li>`).join('')}</ul>`;
}

/* ==========================================================
   WINDOW MANAGER
========================================================== */
const winMap = {};       // id -> element
let winOrder = [];       // stacking order

function restack(){
  winOrder.forEach((id,idx)=>{
    const el = winMap[id];
    if (el) el.style.zIndex = 50 + idx;
  });
  const top = winOrder[winOrder.length-1];
  $$('.win').forEach(w=>w.classList.toggle('focused', w.dataset.app===top));
  $('#mbApp').textContent = top ? APPS[top].title : 'Finder';
}
function focusWin(id){
  winOrder = winOrder.filter(x=>x!==id);
  winOrder.push(id);
  restack();
}

function openApp(id){
  const app = APPS[id];
  if (!app) return;
  if (app.external){ window.open('Jay_CV.pdf','_blank'); return; }
  if (winMap[id]){
    const el = winMap[id];
    el.classList.remove('hidden');
    focusWin(id);
    return;
  }
  createWin(id);
}

function createWin(id){
  const app = APPS[id];
  const win = document.createElement('div');
  win.className = 'win';
  win.dataset.app = id;

  let w = app.w, h = app.h;
  if (!isMobile()){
    w = Math.min(w, innerWidth - 60);
    h = Math.min(h, innerHeight - 130);
    const n = winOrder.length;
    const left = clamp(innerWidth/2 - w/2 + (n%5)*32 - 64, 12, innerWidth-w-12);
    const top  = clamp(70 + (n%5)*30, 46, innerHeight-h-90);
    win.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`;
  }

  win.innerHTML = `
    <div class="win-bar">
      <div class="win-lights">
        <span class="wl wl-close" data-do="close"><span>✕</span></span>
        <span class="wl wl-min" data-do="min"><span>—</span></span>
        <span class="wl wl-max" data-do="max"><span>+</span></span>
      </div>
      <span class="win-icon">${app.icon}</span>
      <span class="win-title">${app.title}</span>
    </div>
    <div class="win-body">${RENDER[id] ? RENDER[id]() : ''}</div>`;

  $('#windows').appendChild(win);
  winMap[id] = win;
  winOrder.push(id);
  restack();

  // focus on any interaction
  win.addEventListener('pointerdown', ()=>focusWin(id));

  // light buttons
  $$('.wl', win).forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const act = b.dataset.do;
      if (act==='close') closeWin(id);
      else if (act==='min') minWin(id);
      else if (act==='max') maxWin(id);
    });
  });

  makeDraggable(win);
  markDock(id, true);

  // per-app wiring
  if (id==='mllab')    initMLLab(win);
  if (id==='terminal') initTerminal(win);
  if (id==='skills')   setTimeout(()=>$$('.skill-bar i',win).forEach(i=>i.style.width=i.dataset.w+'%'),120);
  if (id==='projects') wireFinder(win);
}

function closeWin(id){
  const el = winMap[id]; if (!el) return;
  el.classList.add('closing');
  setTimeout(()=>{
    el.remove(); delete winMap[id];
    winOrder = winOrder.filter(x=>x!==id);
    markDock(id,false); restack();
  },210);
}
function minWin(id){
  const el = winMap[id]; if (!el) return;
  el.classList.add('minimizing');
  setTimeout(()=>{ el.classList.add('hidden'); el.classList.remove('minimizing'); },300);
  winOrder = winOrder.filter(x=>x!==id);
  restack();
}
function maxWin(id){
  const el = winMap[id]; if (!el || isMobile()) return;
  if (el.classList.contains('maxed')){
    el.classList.remove('maxed');
    el.style.cssText = el.dataset.prev || el.style.cssText;
  } else {
    el.dataset.prev = el.style.cssText;
    el.classList.add('maxed');
    el.style.cssText = `left:0;top:38px;width:100vw;height:calc(100vh - 38px - 80px);`;
  }
  focusWin(id);
}

function makeDraggable(win){
  const bar = $('.win-bar', win);
  let sx, sy, ox, oy, drag=false;
  bar.addEventListener('pointerdown', e=>{
    if (e.target.closest('.wl') || isMobile() || win.classList.contains('maxed')) return;
    drag=true;
    sx=e.clientX; sy=e.clientY;
    ox=parseFloat(win.style.left)||0; oy=parseFloat(win.style.top)||0;
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', e=>{
    if (!drag) return;
    const nx = clamp(ox + e.clientX - sx, -win.offsetWidth+120, innerWidth-120);
    const ny = clamp(oy + e.clientY - sy, 40, innerHeight-70);
    win.style.left = nx+'px'; win.style.top = ny+'px';
  });
  bar.addEventListener('pointerup', ()=>{ drag=false; });
}

/* ==========================================================
   DOCK
========================================================== */
const DOCK = ['readme','about','projects','skills','mllab','terminal','journey','contact','SEP','resume'];
function buildDock(){
  const dock = $('#dock');
  dock.innerHTML = '';
  DOCK.forEach(id=>{
    if (id==='SEP'){
      const s=document.createElement('div'); s.className='dock-sep'; dock.appendChild(s); return;
    }
    const app = APPS[id];
    const b = document.createElement('button');
    b.className = 'dock-item'; b.dataset.app = id;
    b.innerHTML = `${app.icon}<span class="dock-tip">${app.title}</span>`;
    b.addEventListener('click', ()=>openApp(id));
    dock.appendChild(b);
  });
}
function markDock(id, on){
  const d = $(`.dock-item[data-app="${id}"]`);
  if (d) d.classList.toggle('run', on);
}

/* ==========================================================
   DESKTOP ICONS
========================================================== */
const DICONS = [
  ['readme','📖','README.md'],
  ['mllab','🧠','ML Lab'],
  ['projects','🗂️','Projects'],
  ['terminal','⌨️','Terminal'],
  ['resume','📄','Résumé.pdf']
];
function buildIcons(){
  const c = $('#dicons'); c.innerHTML='';
  DICONS.forEach(([id,ico,label])=>{
    const b=document.createElement('button');
    b.className='dicon'; b.dataset.open=id;
    b.innerHTML=`<span class="dicon-img">${ico}</span><span class="dicon-label">${label}</span>`;
    b.addEventListener('dblclick',()=>openApp(id));
    b.addEventListener('click',e=>{
      e.stopPropagation();
      $$('.dicon').forEach(x=>x.classList.remove('sel'));
      b.classList.add('sel');
    });
    c.appendChild(b);
  });
}

/* ==========================================================
   PROJECTS finder wiring
========================================================== */
function wireFinder(win){
  const side=$('#finderSide',win), main=$('#finderMain',win);
  side.addEventListener('click',e=>{
    const it=e.target.closest('.finder-item'); if(!it) return;
    $$('.finder-item',side).forEach(x=>x.classList.remove('on'));
    it.classList.add('on');
    main.innerHTML = projectView(+it.dataset.i);
  });
}

/* ==========================================================
   ML LAB — live k-NN classifier
========================================================== */
function initMLLab(win){
  const cv = $('#mlCanvas',win), ctx = cv.getContext('2d');
  const COL = { A:'#4dffd2', B:'#c77dff' };
  let pts = [];                 // {x,y,c} normalized 0..1
  let curClass = 0, k = 5;
  let W=10, H=10;

  function fit(){
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio||1, 2);
    W = r.width; H = r.height;
    cv.width = W*dpr; cv.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    render();
  }

  function classify(nx,ny){
    if (!pts.length) return -1;
    const d = pts.map(p=>({c:p.c, d:(p.x-nx)**2+(p.y-ny)**2}));
    d.sort((a,b)=>a.d-b.d);
    let a=0,b=0;
    for (let i=0;i<Math.min(k,d.length);i++) d[i].c===0?a++:b++;
    return a===b ? d[0].c : (a>b?0:1);
  }

  function render(){
    ctx.clearRect(0,0,W,H);
    // decision regions
    if (pts.length){
      const step = 13;
      for (let x=0;x<W;x+=step){
        for (let y=0;y<H;y+=step){
          const c = classify((x+step/2)/W,(y+step/2)/H);
          if (c<0) continue;
          ctx.fillStyle = c===0
            ? 'rgba(77,255,210,.13)' : 'rgba(199,125,255,.15)';
          ctx.fillRect(x,y,step+1,step+1);
        }
      }
    } else {
      ctx.fillStyle='rgba(255,255,255,.28)';
      ctx.font='13px JetBrains Mono, monospace';
      ctx.textAlign='center';
      ctx.fillText('click anywhere to drop a data point', W/2, H/2);
    }
    // grid
    ctx.strokeStyle='rgba(255,255,255,.05)'; ctx.lineWidth=1;
    for (let x=0;x<=W;x+=W/8){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (let y=0;y<=H;y+=H/6){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }
    // points
    pts.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x*W,p.y*H,6.5,0,6.283);
      ctx.fillStyle = p.c===0?COL.A:COL.B;
      ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,.85)';
      ctx.stroke();
    });
    const a = pts.filter(p=>p.c===0).length, b = pts.length-a;
    $('#mlStat',win).innerHTML = pts.length
      ? `points: <b>${pts.length}</b> · A:${a} B:${b} · k=${k} · boundary live`
      : `points: <b>0</b> · draw to begin`;
  }

  cv.addEventListener('pointerdown', e=>{
    const r = cv.getBoundingClientRect();
    pts.push({ x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height, c:curClass });
    render();
  });

  const A=$('#mlA',win), B=$('#mlB',win);
  A.addEventListener('click',()=>{ curClass=0; A.classList.add('on'); B.classList.remove('on'); });
  B.addEventListener('click',()=>{ curClass=1; B.classList.add('on'); A.classList.remove('on'); });
  $('#mlK',win).addEventListener('input',e=>{ k=+e.target.value; $('#mlKv',win).textContent=k; render(); });
  $('#mlClear',win).addEventListener('click',()=>{ pts=[]; render(); });
  $('#mlDemo',win).addEventListener('click',()=>{
    pts=[];
    const blob=(cx,cy,c)=>{ for(let i=0;i<13;i++)
      pts.push({ x:clamp(cx+(Math.random()-.5)*.34,.04,.96),
                 y:clamp(cy+(Math.random()-.5)*.34,.04,.96), c }); };
    blob(.30,.34,0); blob(.70,.66,1);
    render();
  });

  if (window.ResizeObserver){
    new ResizeObserver(()=>fit()).observe(cv);
  } else { addEventListener('resize',fit); }
  setTimeout(fit,60);
}

/* ==========================================================
   TERMINAL
========================================================== */
function initTerminal(win){
  const out=$('#termOut',win), input=$('#termIn',win);
  const hist=[]; let hi=-1;
  const P = (html,cls)=>{
    const d=document.createElement('div');
    d.className='tl-line'+(cls?' '+cls:'');
    d.innerHTML=html; out.appendChild(d); out.scrollTop=out.scrollHeight;
  };
  const PL=arr=>arr.forEach(l=>P(l));

  const CMD = {
    help(){
      P('<span class="t-head">JAYOS COMMANDS</span>');
      PL([
        '  <span class="t-cmd">open</span> &lt;app&gt;  launch an app (about·projects·skills·',
        '               mllab·terminal·journey·contact·resume)',
        '  <span class="t-cmd">whoami</span>      who is Jay Patwa',
        '  <span class="t-cmd">skills</span>      tech stack',
        '  <span class="t-cmd">projects</span>    list projects',
        '  <span class="t-cmd">project</span> N   project #N details (1–4)',
        '  <span class="t-cmd">experience</span>  work history',
        '  <span class="t-cmd">education</span>   degree &amp; certs',
        '  <span class="t-cmd">contact</span>     reach me',
        '  <span class="t-cmd">stats</span>       quick numbers',
        '  <span class="t-cmd">neofetch</span>    system info',
        '  <span class="t-cmd">clear</span>       wipe screen',
        '  <span class="t-dim">also: date · echo · ls · sudo · joke</span>'
      ]);
    },
    open(a){
      if (APPS[a]){ P(`launching <span class="t-ok">${APPS[a].title}</span> ...`); openApp(a); }
      else P(`open: unknown app "${a||''}". try <span class="t-cmd">help</span>`,'t-err');
    },
    whoami(){
      PL([
        '<span class="t-head">JAY PATWA</span>',
        'Data Scientist · Data Analyst · Python Developer',
        '',
        'Final-year B.Tech CE @ Indus University (<span class="t-ok">CGPA 8.6</span>).',
        'I collect data, train models, ship dashboards people act on.',
        '<span class="t-dim">status:</span> <span class="t-ok">open to data roles, 2026.</span>'
      ]);
    },
    skills(){
      P('<span class="t-head">STACK</span>');
      PL([
        '<span class="t-key">lang  </span> Python · SQL · JavaScript · C · C++',
        '<span class="t-key">ds/ml </span> Scikit-learn · Pandas · NumPy · Matplotlib · Seaborn',
        '<span class="t-key">bi    </span> Power BI · DAX',
        '<span class="t-key">db    </span> MySQL · MongoDB',
        '<span class="t-key">web   </span> React · Node · Express',
        '<span class="t-key">tools </span> Git · Jupyter · Colab · Postman · Vercel · Render'
      ]);
    },
    projects(){
      P('<span class="t-head">PROJECTS</span>');
      PROJECTS.forEach((p,i)=>P(`  <span class="t-ok">[${i+1}]</span> ${p.name} <span class="t-dim">— ${p.sub}</span>`));
      P('<span class="t-dim">→</span> <span class="t-cmd">project 1</span> <span class="t-dim">for details · or</span> <span class="t-cmd">open projects</span>');
    },
    project(n){
      const p = PROJECTS[(+n)-1];
      if (!p){ P('project: pick 1–4','t-err'); return; }
      P('<span class="t-head">'+p.emoji+' '+p.name+'</span>');
      P('<span class="t-dim">'+p.sub+'  ·  '+p.tags.join(' / ')+'</span>');
      p.points.forEach(x=>P('  • '+x));
    },
    experience(){
      P('<span class="t-head">EXPERIENCE</span>');
      PL([
        '<span class="t-ok">Jul 2024</span>  Python &amp; ML Intern — Codsoft (Remote)',
        '          Built ML models w/ Scikit-learn; preprocessing,',
        '          feature engineering &amp; evaluation on real data.',
        '          Awarded Internship Completion Certificate.'
      ]);
    },
    education(){
      P('<span class="t-head">EDUCATION</span>');
      PL([
        '<span class="t-ok">2022–26 </span> B.Tech Computer Engineering — Indus University',
        '          CGPA 8.6 / 10 · Ahmedabad',
        '<span class="t-ok">Mar 2026</span> Foundation of Mathematics in AI &amp; ML',
        '<span class="t-ok">Jul 2024</span> Python &amp; ML Internship Certificate — Codsoft',
        '<span class="t-ok">Dec 2023</span> Upskilling Internship Course — Indus University'
      ]);
    },
    contact(){
      P('<span class="t-head">CONTACT</span>');
      PL([
        '<span class="t-key">email </span> <a href="mailto:patwajay2101@gmail.com">patwajay2101@gmail.com</a>',
        '<span class="t-key">phone </span> +91 99988 80800',
        '<span class="t-key">github</span> <a href="https://github.com/jaypatwa21" target="_blank">github.com/jaypatwa21</a>',
        '<span class="t-key">linkdn</span> <a href="https://www.linkedin.com/in/jay-patwa-b625031b2/" target="_blank">linkedin.com/in/jay-patwa</a>'
      ]);
    },
    stats(){
      P('<span class="t-head">STATS</span>');
      PL([
        '  CGPA ............ <span class="t-ok">8.6 / 10</span>',
        '  projects ........ <span class="t-ok">4+</span>',
        '  rows analyzed ... <span class="t-ok">10,000+</span>',
        '  certifications .. <span class="t-ok">3</span>'
      ]);
    },
    neofetch(){
      PL([
        '<span class="t-key">      ◆◆◆      </span>  <span class="t-head">jay@jayos</span>',
        '<span class="t-key">    ◆◆   ◆◆    </span>  ----------------',
        '<span class="t-key">   ◆◆     ◆◆   </span>  OS: JayOS v3.0',
        '<span class="t-key">   ◆◆     ◆◆   </span>  Host: Portfolio Edition',
        '<span class="t-key">    ◆◆   ◆◆    </span>  Kernel: data-science.ko',
        '<span class="t-key">      ◆◆◆      </span>  Uptime: open to work',
        '                  CPU: Curiosity Core @ 8.6GHz',
        '                  Shell: jaysh · Location: Ahmedabad'
      ]);
    },
    date(){ P(new Date().toString()); },
    echo(_,raw){ P(raw||''); },
    ls(){ P('about  projects  skills  mllab  journey  contact  <span class="t-ok">resume.pdf</span>'); },
    sudo(){ P('nice try 😏 — you already have root in JayOS.','t-ok'); },
    joke(){
      const j=['A SQL query walks into a bar, sees two tables: "mind if I JOIN?"',
        'There are 10 kinds of people: those who read binary and those who don\'t.',
        '99% model accuracy. The other 1% is called production.',
        'Why was the data scientist broke? They spent all their cache.'];
      P(j[Math.floor(Math.random()*j.length)]);
    },
    resume(){ P('opening <span class="t-ok">Jay_CV.pdf</span> ...'); window.open('Jay_CV.pdf','_blank'); },
    clear(){ out.innerHTML=''; },
    hi(){ P('hey 👋 — type <span class="t-cmd">help</span>'); },
    hello(){ CMD.hi(); }
  };

  function run(raw){
    const line=raw.trim();
    P(`<span class="term-echo"><span class="ep">jay@jayos:~$</span> ${line.replace(/</g,'&lt;')}</span>`);
    if (!line) return;
    hist.unshift(line); hi=-1;
    const parts=line.split(/\s+/);
    const cmd=parts[0].toLowerCase();
    const arg=parts[1]?parts[1].toLowerCase():'';
    const raw2=line.slice(parts[0].length).trim();
    if (CMD[cmd]) CMD[cmd](arg,raw2);
    else P(`command not found: ${cmd} — type <span class="t-cmd">help</span>`,'t-err');
  }
  input.addEventListener('keydown',e=>{
    if (e.key==='Enter'){ run(input.value); input.value=''; }
    else if (e.key==='ArrowUp'){ if(hi<hist.length-1){hi++;input.value=hist[hi];} e.preventDefault(); }
    else if (e.key==='ArrowDown'){ if(hi>0){hi--;input.value=hist[hi];}else{hi=-1;input.value='';} e.preventDefault(); }
  });
  win.addEventListener('pointerup',e=>{ if(!e.target.closest('a')) input.focus(); });
  setTimeout(()=>input.focus(),120);
}

/* ==========================================================
   SPOTLIGHT
========================================================== */
function initSpotlight(){
  const sp=$('#spotlight'), inp=$('#spotInput'), res=$('#spotResults');
  let items=[], sel=0;

  const INDEX = [
    ...Object.keys(APPS).map(id=>({name:APPS[id].title, ico:APPS[id].icon, kind:'App', go:()=>openApp(id)})),
    ...PROJECTS.map(p=>({name:p.name, ico:p.emoji, kind:'Project', go:()=>{openApp('projects');}})),
    {name:'Email Jay', ico:'✉️', kind:'Link', go:()=>location.href='mailto:patwajay2101@gmail.com'},
    {name:'GitHub', ico:'🐙', kind:'Link', go:()=>open('https://github.com/jaypatwa21','_blank')},
    {name:'LinkedIn', ico:'💼', kind:'Link', go:()=>open('https://www.linkedin.com/in/jay-patwa-b625031b2/','_blank')}
  ];

  function open_(){
    sp.classList.remove('hidden'); inp.value=''; render('');
    setTimeout(()=>inp.focus(),30);
  }
  function close_(){ sp.classList.add('hidden'); }
  function render(q){
    items = q ? INDEX.filter(i=>i.name.toLowerCase().includes(q.toLowerCase())) : INDEX;
    sel = 0;
    res.innerHTML = items.map((it,i)=>`
      <div class="spot-row ${i===0?'on':''}" data-i="${i}">
        <span class="sr-ico">${it.ico}</span>
        <span class="sr-name">${it.name}</span>
        <span class="sr-kind">${it.kind}</span>
      </div>`).join('') || `<div class="spot-row"><span class="sr-name" style="color:var(--ink-3)">No results</span></div>`;
  }
  function move(d){
    if (!items.length) return;
    sel = (sel+d+items.length)%items.length;
    $$('.spot-row',res).forEach((r,i)=>r.classList.toggle('on',i===sel));
    const on=$('.spot-row.on',res); if(on) on.scrollIntoView({block:'nearest'});
  }
  function choose(){ if(items[sel]){ close_(); items[sel].go(); } }

  inp.addEventListener('input',()=>render(inp.value));
  inp.addEventListener('keydown',e=>{
    if (e.key==='ArrowDown'){ move(1); e.preventDefault(); }
    else if (e.key==='ArrowUp'){ move(-1); e.preventDefault(); }
    else if (e.key==='Enter'){ choose(); }
    else if (e.key==='Escape'){ close_(); }
  });
  res.addEventListener('click',e=>{
    const r=e.target.closest('.spot-row'); if(!r||r.dataset.i===undefined) return;
    sel=+r.dataset.i; choose();
  });
  sp.addEventListener('pointerdown',e=>{ if(e.target===sp) close_(); });
  $('#spotBtn').addEventListener('click',open_);

  addEventListener('keydown',e=>{
    if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault();
      sp.classList.contains('hidden')?open_():close_(); }
    else if (e.key==='Escape' && !sp.classList.contains('hidden')) close_();
  });
}

/* ==========================================================
   CONTEXT MENU + APPLE MENU
========================================================== */
function initMenus(){
  const ctx=$('#ctx'), apple=$('#appleMenu');

  function showCtx(x,y){
    ctx.innerHTML = `
      <button data-c="terminal">⌨️  New Terminal</button>
      <button data-c="mllab">🧠  Open ML Lab</button>
      <button data-c="readme">📖  Open README</button>
      <hr/>
      <button data-c="note">🔔  Say hello</button>
      <button data-c="clean">🧹  Close all windows</button>`;
    ctx.style.left = Math.min(x, innerWidth-220)+'px';
    ctx.style.top  = Math.min(y, innerHeight-200)+'px';
    ctx.classList.remove('hidden');
  }
  document.addEventListener('contextmenu',e=>{
    if (e.target.closest('.win')||e.target.closest('.dock')||e.target.closest('.menubar')) return;
    e.preventDefault(); showCtx(e.clientX,e.clientY);
  });
  ctx.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    const c=b.dataset.c;
    if (c==='clean'){ Object.keys(winMap).forEach(closeWin); }
    else if (c==='note'){ note('👋 Hello!','Thanks for exploring JayOS. Try the ML Lab next.'); }
    else openApp(c);
    ctx.classList.add('hidden');
  });

  $('#mbLogo').addEventListener('click',e=>{
    e.stopPropagation();
    apple.classList.toggle('hidden');
  });
  apple.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    const a=b.dataset.act;
    if (a==='about') openApp('about');
    else if (a==='resume') window.open('Jay_CV.pdf','_blank');
    else if (a==='github') open('https://github.com/jaypatwa21','_blank');
    else if (a==='restart') location.reload();
    else if (a==='sleep'){
      $('#os').classList.add('hidden');
      $('#login').classList.remove('hidden','leaving');
    }
    apple.classList.add('hidden');
  });

  document.addEventListener('pointerdown',e=>{
    if (!e.target.closest('#ctx')) ctx.classList.add('hidden');
    if (!e.target.closest('#appleMenu') && !e.target.closest('#mbLogo'))
      apple.classList.add('hidden');
    if (!e.target.closest('.dicon')) $$('.dicon').forEach(d=>d.classList.remove('sel'));
  });
}

/* ==========================================================
   NOTIFICATIONS
========================================================== */
function note(title, body, icon='🔔'){
  const n=document.createElement('div');
  n.className='note';
  n.innerHTML=`<div class="note-ico">${icon}</div>
    <div><div class="note-title">${title}</div><div class="note-body">${body}</div></div>`;
  $('#notes').appendChild(n);
  n.addEventListener('click',()=>dismiss(n));
  setTimeout(()=>dismiss(n),6500);
  function dismiss(el){
    if (!el.parentNode) return;
    el.classList.add('out');
    setTimeout(()=>el.remove(),300);
  }
}

/* ==========================================================
   START DESKTOP
========================================================== */
let started=false;
function startDesktop(){
  if (started) return; started=true;
  buildDock();
  buildIcons();
  initSpotlight();
  initMenus();
  initBattery();
  openApp('readme');
  setTimeout(()=>note('Welcome to JayOS','Double-click an app, drag windows, or press Ctrl+K to search.','◆'),900);
  setTimeout(()=>note('💡 Pro tip','Open ML Lab and click the canvas — you\'re training a real classifier.','🧠'),4200);
}

/* ==========================================================
   GO
========================================================== */
boot();

})();
