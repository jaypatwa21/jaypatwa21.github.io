/* ==========================================================
   JAY PATWA // DATA LAB — v2
   WebGL bg · constellation · boot · cursor · horizontal scroll
   · interactive terminal · konami matrix easter egg
========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ==========================================================
   1. Clocks
========================================================== */
function tickClock(){
  const t = new Date().toLocaleTimeString('en-GB', {
    hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'Asia/Kolkata'
  });
  const t2 = t.slice(0,5);
  const bc = $('#bootClock'); if (bc) bc.textContent = t + ' IST';
  const hc = $('#hdrClock');  if (hc) hc.textContent = t2 + ' IST';
}
tickClock(); setInterval(tickClock, 1000);
const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

/* ==========================================================
   2. WebGL shader background
========================================================== */
function initGL(){
  const cv = $('#gl');
  const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
  if (!gl){ cv.style.display = 'none'; return; }

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const fs = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                 mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.0, a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02; a*=0.5; }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy/u_res.xy;
      float ar = u_res.x/u_res.y;
      vec2 p = vec2(uv.x*ar, uv.y)*2.6;
      float t = u_time*0.045;
      vec2 q = vec2(fbm(p+vec2(0.0,0.0)+t), fbm(p+vec2(5.2,1.3)-t));
      vec2 r = vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*1.2),
                    fbm(p+3.5*q+vec2(8.3,2.8)-t*1.2));
      float f = fbm(p+3.5*r);
      vec2 m = vec2(u_mouse.x*ar, u_mouse.y);
      float md = distance(vec2(uv.x*ar,uv.y), m);
      f += (1.0-smoothstep(0.0,0.55,md))*0.28;
      vec3 cBg  = vec3(0.024,0.024,0.027);
      vec3 cCy  = vec3(0.168,0.941,1.0);
      vec3 cVi  = vec3(0.701,0.533,1.0);
      vec3 cAci = vec3(0.784,1.0,0.168);
      vec3 col = cBg;
      col = mix(col, cCy,  clamp(f*f*1.7,0.0,1.0));
      col = mix(col, cVi,  clamp(length(q)*0.9,0.0,1.0));
      col = mix(col, cAci, clamp(r.x*r.x*1.2,0.0,1.0)*0.55);
      col *= 0.28 + 0.7*f;
      col = mix(cBg, col, 0.62);
      gl_FragColor = vec4(col,1.0);
    }`;

  function sh(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f){ cv.style.display = 'none'; return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){ cv.style.display = 'none'; return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  window.addEventListener('pointermove', e => {
    tmx = e.clientX / window.innerWidth;
    tmy = 1 - e.clientY / window.innerHeight;
  }, { passive:true });

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    cv.width  = window.innerWidth  * dpr;
    cv.height = window.innerHeight * dpr;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const start = performance.now();
  function draw(){
    mx = lerp(mx, tmx, 0.04); my = lerp(my, tmy, 0.04);
    gl.uniform2f(uRes, cv.width, cv.height);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  if (reduced){
    gl.uniform2f(uRes, cv.width, cv.height);
    gl.uniform1f(uTime, 8); gl.uniform2f(uMouse, .5, .5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } else draw();
}
try { initGL(); } catch(e){ const c = $('#gl'); if (c) c.style.display = 'none'; }

/* ==========================================================
   3. Constellation particle layer
========================================================== */
function initConstellation(){
  const cv = $('#constellation');
  const ctx = cv.getContext('2d');
  let W, H, pts, mouse = { x:-999, y:-999 };

  function resize(){
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    const n = Math.min(70, Math.floor(W * H / 26000));
    pts = Array.from({ length:n }, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      r:Math.random()*1.6+.5
    }));
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive:true });
  window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

  function frame(){
    ctx.clearRect(0, 0, W, H);
    for (const p of pts){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx*dx + dy*dy;
      if (d2 < 17000){
        const f = (1 - d2/17000) * .9;
        p.x += dx/Math.sqrt(d2+1)*f; p.y += dy/Math.sqrt(d2+1)*f;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = 'rgba(200,255,43,.55)';
      ctx.fill();
    }
    for (let i = 0; i < pts.length; i++){
      for (let j = i+1; j < pts.length; j++){
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 128){
          ctx.strokeStyle = `rgba(120,200,220,${.16*(1-d/128)})`;
          ctx.lineWidth = .6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  if (!reduced) frame();
}
initConstellation();

/* ==========================================================
   4. Custom cursor
========================================================== */
function initCursor(){
  if (!window.matchMedia('(pointer:fine)').matches) return;
  const dot = $('#curDot'), ring = $('#curRing'), txt = $('#curText');
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  const labels = {
    link:'OPEN', open:'PDF', explore:'GO', run:'RUN', case:'VIEW',
    copy:'COPY', hi:'HI', mail:'MAIL', enter:'BOOT'
  };
  window.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
  });
  (function loop(){
    rx = lerp(rx, mx, .2); ry = lerp(ry, my, .2);
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(loop);
  })();
  $$('a,button,[data-cur],input').forEach(el => {
    el.addEventListener('pointerenter', () => {
      ring.classList.add('hov'); dot.classList.add('hov');
      txt.textContent = labels[el.dataset.cur] || '';
    });
    el.addEventListener('pointerleave', () => {
      ring.classList.remove('hov'); dot.classList.remove('hov');
      txt.textContent = '';
    });
  });
}

/* ==========================================================
   5. Boot sequence
========================================================== */
function initBoot(){
  const boot = $('#boot'), log = $('#bootLog'), enterWrap = $('#bootEnter'), btn = $('#enterBtn');
  const lines = [
    ['> initializing ', 'jay_patwa.portfolio', ' ...', 'tok'],
    ['> loading core modules ............ ', '[ ok ]', '', 'ok'],
    ['> mounting data pipelines ......... ', '[ ok ]', '', 'ok'],
    ['> training neural net ............. ', '[ ok ]', '', 'ok'],
    ['> calibrating dashboards .......... ', '[ ok ]', '', 'ok'],
    ['> establishing uplink: ', 'AHMEDABAD ⇄ WEB', '', 'hl'],
    ['> system status ................... ', 'READY', '', 'ok'],
    ['', '', '', ''],
    ['  welcome to the data lab.', '', '', '']
  ];
  let li = 0;
  function typeLine(){
    if (li >= lines.length){
      enterWrap.classList.add('show');
      return;
    }
    const [pre, mid, post, cls] = lines[li];
    const span = mid ? `<span class="${cls}">${mid}</span>` : '';
    log.innerHTML += pre + span + post + '\n';
    li++;
    setTimeout(typeLine, reduced ? 30 : 150 + Math.random()*120);
  }
  typeLine();

  let done = false;
  function enter(){
    if (done) return; done = true;
    boot.classList.add('gone');
    document.body.classList.remove('is-loading');
    setTimeout(() => { boot.style.display = 'none'; }, 800);
    startSite();
  }
  btn.addEventListener('click', enter);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !done && enterWrap.classList.contains('show')) enter();
  });
  // safety auto-enter
  setTimeout(() => { if (enterWrap.classList.contains('show')) {} }, 100);
}

/* ==========================================================
   6. Scramble name
========================================================== */
function scramble(el, finalText, delay){
  const chars = '!<>-_\\/[]{}—=+*^?#01';
  let frame = 0;
  const queue = [];
  for (let i = 0; i < finalText.length; i++){
    const start = Math.floor(Math.random()*20) + delay;
    const end = start + Math.floor(Math.random()*30) + 14;
    queue.push({ ch:finalText[i], start, end, rnd:'' });
  }
  function update(){
    let out = '', done = 0;
    for (const q of queue){
      if (frame >= q.end){ done++; out += q.ch; }
      else if (frame >= q.start){
        if (!q.rnd || Math.random() < .28) q.rnd = chars[Math.floor(Math.random()*chars.length)];
        out += `<span style="color:var(--acid)">${q.rnd}</span>`;
      } else out += '<span style="opacity:.15">'+q.ch+'</span>';
    }
    el.innerHTML = out;
    if (done < queue.length){ frame++; requestAnimationFrame(update); }
    else el.textContent = finalText;
  }
  update();
}

/* ==========================================================
   7. Role rotator
========================================================== */
function initRoles(){
  const el = $('#roleRot');
  const roles = ['Data Scientist','Data Analyst','Python Developer','ML Engineer','Power BI Builder'];
  let ri = 0, ci = 0, del = false;
  function step(){
    const w = roles[ri];
    el.textContent = del ? w.slice(0, --ci) : w.slice(0, ++ci);
    let d = del ? 45 : 85;
    if (!del && ci === w.length){ d = 1500; del = true; }
    else if (del && ci === 0){ del = false; ri = (ri+1) % roles.length; d = 280; }
    setTimeout(step, d);
  }
  step();
}

/* ==========================================================
   8. Reveal + split-text observers
========================================================== */
function initReveal(){
  $$('[data-split]').forEach(el => {
    el.innerHTML = `<span class="line-mask"><span class="line-inner">${el.innerHTML}</span></span>`;
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target;
      if (t.hasAttribute('data-split')) t.querySelector('.line-mask').classList.add('in');
      else t.classList.add('in');
      io.unobserve(t);
    });
  }, { threshold:.16, rootMargin:'0px 0px -8% 0px' });
  $$('[data-reveal],[data-split]').forEach(el => io.observe(el));
}

/* ==========================================================
   9. Counters
========================================================== */
function initCounters(){
  $$('.count').forEach(el => {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const t0 = performance.now(), dur = 1500;
        (function run(now){
          const p = clamp((now - t0)/dur, 0, 1);
          const v = to * (1 - Math.pow(1-p, 3));
          el.textContent = v.toFixed(dec);
          if (p < 1) requestAnimationFrame(run);
          else el.textContent = to.toFixed(dec);
        })(t0);
        io.unobserve(el);
      });
    }, { threshold:.6 });
    io.observe(el);
  });
}

/* ==========================================================
   10. Magnetic elements
========================================================== */
function initMagnetic(){
  if (!window.matchMedia('(pointer:fine)').matches) return;
  $$('.mbtn, .enter-btn').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      el.style.transform = `translate(${x*.28}px,${y*.42}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ==========================================================
   11. Marquee drift
========================================================== */
function initMarquee(){
  const row = $('[data-strip]');
  if (!row) return;
  let x = 0, half = 0, dir = -1;
  function measure(){ half = row.scrollWidth / 2; }
  measure(); window.addEventListener('resize', measure);
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    dir = window.scrollY > lastScroll ? -1 : 1;
    lastScroll = window.scrollY;
  }, { passive:true });
  (function loop(){
    x += .6 * dir;
    if (x <= -half) x = 0;
    if (x > 0) x = -half;
    row.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ==========================================================
   12. Horizontal scroll work section
========================================================== */
function initHorizontal(){
  const sec = $('#work'), sticky = $('.work-sticky'), track = $('#workTrack');
  if (!sec || !track) return;
  let dist = 0, enabled = false;

  function setup(){
    enabled = window.innerWidth > 880;
    if (!enabled){ sec.style.height = ''; track.style.transform = ''; return; }
    dist = track.scrollWidth - window.innerWidth;
    sec.style.height = (window.innerHeight + dist) + 'px';
  }
  setup();
  window.addEventListener('resize', () => { setup(); onScroll(); });

  function onScroll(){
    if (!enabled) return;
    const top = sec.offsetTop;
    const p = clamp((window.scrollY - top) / dist, 0, 1);
    track.style.transform = `translate3d(${-p*dist}px,0,0)`;
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}

/* ==========================================================
   13. Scroll progress + side nav
========================================================== */
function initScrollUI(){
  const bar = $('#scrollbar');
  const items = $$('.sn-item');
  const ids = items.map(i => i.getAttribute('href').slice(1));
  function upd(){
    const d = document.documentElement;
    const max = d.scrollHeight - d.clientHeight;
    bar.style.width = (max > 0 ? (d.scrollTop/max)*100 : 0) + '%';
    const y = window.scrollY + window.innerHeight*.4;
    let cur = ids[0];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    });
    items.forEach(it => it.classList.toggle('active', it.getAttribute('href') === '#'+cur));
  }
  window.addEventListener('scroll', upd, { passive:true });
  upd();
}

/* ==========================================================
   14. Interactive terminal
========================================================== */
function initTerminal(){
  const body = $('#termBody'), input = $('#termInput'), term = $('#term');
  if (!body || !input) return;
  const history = []; let hi = -1;

  const print = (html, cls = '') => {
    const d = document.createElement('div');
    d.className = 'tline' + (cls ? ' '+cls : '');
    d.innerHTML = html;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  };
  const printLines = arr => arr.forEach(l => print(l));

  const COMMANDS = {
    help(){
      print('<span class="thead">AVAILABLE COMMANDS</span>');
      printLines([
        '  <span class="tcmd">whoami</span>      who is Jay Patwa',
        '  <span class="tcmd">skills</span>      tech stack &amp; tools',
        '  <span class="tcmd">projects</span>    list shipped projects',
        '  <span class="tcmd">project N</span>   open project #N (1–4)',
        '  <span class="tcmd">experience</span>  work history',
        '  <span class="tcmd">education</span>   degree &amp; certifications',
        '  <span class="tcmd">contact</span>     email · phone · location',
        '  <span class="tcmd">social</span>      github &amp; linkedin',
        '  <span class="tcmd">resume</span>      open the résumé PDF',
        '  <span class="tcmd">stats</span>       quick numbers',
        '  <span class="tcmd">matrix</span>      ▒ enter the matrix ▒',
        '  <span class="tcmd">clear</span>       clear the screen',
        '  <span class="tdim">try also: date · echo · sudo · ls · joke</span>'
      ]);
    },
    whoami(){
      printLines([
        '<span class="thead">JAY PATWA</span>',
        'Data Scientist · Data Analyst · Python Developer',
        '',
        'Final-year B.Tech Computer Engineering student at Indus',
        'University, Ahmedabad (<span class="tok">CGPA 8.6</span>). I build end-to-end:',
        'collect data → train models → ship dashboards people act on.',
        '',
        '<span class="tdim">Currently:</span> <span class="tok">open to data science / analytics roles, 2026.</span>'
      ]);
    },
    skills(){
      print('<span class="thead">TECH STACK</span>');
      printLines([
        '<span class="tkey">languages  </span> Python · SQL · JavaScript · C · C++',
        '<span class="tkey">ds / ml    </span> Scikit-learn · Pandas · NumPy · Matplotlib · Seaborn',
        '<span class="tkey">bi / viz   </span> Power BI · DAX · Matplotlib · Seaborn',
        '<span class="tkey">statistics </span> Descriptive · Inferential · Probability · EDA',
        '<span class="tkey">databases  </span> MySQL · MongoDB',
        '<span class="tkey">web / mern </span> React · Node · Express · HTML · CSS',
        '<span class="tkey">tooling    </span> Git · GitHub · Jupyter · Colab · Postman · Vercel · Render'
      ]);
    },
    projects(){
      print('<span class="thead">SHIPPED PROJECTS</span>');
      printLines([
        '  <span class="tok">[1]</span> AirSense      — AQI prediction &amp; monitoring (IoT + ML)',
        '  <span class="tok">[2]</span> Sales &amp; HR    — Power BI analytics dashboard',
        '  <span class="tok">[3]</span> RetailSense   — EDA on Superstore sales',
        '  <span class="tok">[4]</span> AgastyaHomes  — full-stack MERN rental platform',
        '<span class="tdim">→ run</span> <span class="tcmd">project 1</span> <span class="tdim">for details</span>'
      ]);
    },
    project(arg){
      const P = {
        1:['AirSense — AQI Prediction & Monitoring','2025–2026','Python · Scikit-learn · IoT · ESP32',
           ['ESP32 sensors stream live PM2.5 / PM10 wirelessly.',
            'Scikit-learn model predicts AQI with strong accuracy.',
            'Custom dashboard for live + forecast monitoring.']],
        2:['Sales & HR Analytics Dashboard','2024–2025','Power BI · SQL · MySQL · DAX',
           ['Interactive dashboard over 10,000+ rows of data.',
            'Advanced SQL — JOINs, CTEs, window functions.',
            'DAX KPIs: revenue growth %, attrition, regional perf.']],
        3:['RetailSense — EDA on Superstore Sales','2024–2025','Python · Pandas · NumPy · Seaborn',
           ['EDA on 9,994 rows × 21 columns.',
            'Proved −0.22 discount/profit correlation + Q4 seasonality.',
            'Delivered 7 actionable business recommendations.']],
        4:['AgastyaHomes — MERN Rental Platform','2023–2024','MERN · REST API · MongoDB · OAuth',
           ['Full-stack property listing platform.',
            'Google OAuth 2.0 + Cloudinary image management.',
            'RESTful APIs, deployed on Render with MongoDB.']]
      };
      const p = P[arg];
      if (!p){ print('project: pick a number 1–4. try <span class="tcmd">projects</span>', 'terr'); return; }
      print('<span class="thead">'+p[0]+'</span>');
      print('<span class="tdim">'+p[1]+'  ·  '+p[2]+'</span>');
      p[3].forEach(x => print('  • '+x));
    },
    experience(){
      print('<span class="thead">EXPERIENCE</span>');
      printLines([
        '<span class="tok">Jul 2024</span>  Python &amp; Machine Learning Intern — Codsoft (Remote)',
        '          Built ML models with Scikit-learn; preprocessing,',
        '          feature engineering &amp; evaluation on real datasets.',
        '          Awarded Internship Completion Certificate.'
      ]);
    },
    education(){
      print('<span class="thead">EDUCATION & CERTIFICATIONS</span>');
      printLines([
        '<span class="tok">2022–2026</span>  B.Tech Computer Engineering — Indus University',
        '            CGPA 8.6 / 10, Ahmedabad',
        '<span class="tok">Mar 2026 </span>  Foundation of Mathematics in AI &amp; ML',
        '<span class="tok">Jul 2024 </span>  Python &amp; ML Internship Certificate — Codsoft',
        '<span class="tok">Dec 2023 </span>  Upskilling Internship Course — Indus University'
      ]);
    },
    contact(){
      print('<span class="thead">CONTACT</span>');
      printLines([
        '<span class="tkey">email   </span> <a href="mailto:patwajay2101@gmail.com">patwajay2101@gmail.com</a>',
        '<span class="tkey">phone   </span> +91 99988 80800',
        '<span class="tkey">location</span> Ahmedabad, Gujarat, India',
        '<span class="tkey">langs   </span> English · Hindi · Gujarati'
      ]);
    },
    social(){
      print('<span class="thead">SOCIAL</span>');
      printLines([
        '<span class="tkey">github  </span> <a href="https://github.com/jaypatwa21" target="_blank">github.com/jaypatwa21</a>',
        '<span class="tkey">linkedin</span> <a href="https://www.linkedin.com/in/jay-patwa-b625031b2/" target="_blank">linkedin.com/in/jay-patwa</a>'
      ]);
    },
    resume(){
      print('opening <span class="tok">Jay_CV.pdf</span> in a new tab ...');
      window.open('Jay_CV.pdf', '_blank');
    },
    cv(){ COMMANDS.resume(); },
    stats(){
      print('<span class="thead">QUICK STATS</span>');
      printLines([
        '  CGPA ............ <span class="tok">8.6 / 10</span>',
        '  projects ........ <span class="tok">4+</span>',
        '  rows analyzed ... <span class="tok">10,000+</span>',
        '  certifications .. <span class="tok">3</span>',
        '  status .......... <span class="tok">open to work</span>'
      ]);
    },
    date(){ print(new Date().toString()); },
    echo(arg, raw){ print(raw || ''); },
    pwd(){ print('/home/jay/portfolio'); },
    ls(){ print('about/   skills/   projects/   experience/   contact/   <span class="tok">resume.pdf</span>'); },
    cat(arg){
      if (arg === 'resume.pdf' || arg === 'resume'){ COMMANDS.resume(); return; }
      print('cat: '+(arg||'?')+': use <span class="tcmd">ls</span> to see what exists', 'terr');
    },
    sudo(){ print('nice try 😏 — you already have root in this lab.', 'tok'); },
    joke(){
      const j = [
        'There are 10 types of people: those who get binary and those who don\'t.',
        'A SQL query walks into a bar, sees two tables and asks: "can I JOIN you?"',
        'My model has 99% accuracy. The other 1% is called real life.',
        'Why was the data scientist sad? They didn\'t get any arrays.'
      ];
      print(j[Math.floor(Math.random()*j.length)]);
    },
    matrix(){ print('▒ entering the matrix ... press any key to exit ▒', 'tok'); runMatrix(); },
    clear(){ body.innerHTML = ''; },
    hi(){ print('hey 👋 type <span class="tcmd">help</span> to look around.'); },
    hello(){ COMMANDS.hi(); }
  };

  function run(raw){
    const line = raw.trim();
    print('<span class="term-echo"><span class="ep">jay@datalab:~$</span> '+
          line.replace(/</g,'&lt;')+'</span>');
    if (!line) return;
    history.unshift(line); hi = -1;
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1] ? (isNaN(+parts[1]) ? parts[1].toLowerCase() : +parts[1]) : '';
    const rawArg = line.slice(parts[0].length).trim();
    if (COMMANDS[cmd]) COMMANDS[cmd](arg, rawArg);
    else print('command not found: '+cmd+'  —  type <span class="tcmd">help</span>', 'terr');
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter'){ run(input.value); input.value = ''; }
    else if (e.key === 'ArrowUp'){
      if (hi < history.length-1){ hi++; input.value = history[hi]; }
      e.preventDefault();
    }
    else if (e.key === 'ArrowDown'){
      if (hi > 0){ hi--; input.value = history[hi]; }
      else { hi = -1; input.value = ''; }
      e.preventDefault();
    }
  });
  term.addEventListener('click', () => input.focus());
  $$('.term-quick button').forEach(b => {
    b.addEventListener('click', () => {
      run(b.dataset.cmd); input.value = ''; input.focus();
      $('#terminal').scrollIntoView({ behavior:'smooth', block:'center' });
    });
  });
}

/* ==========================================================
   15. Matrix rain easter egg
========================================================== */
let matrixRunning = false;
function runMatrix(){
  if (matrixRunning) return;
  matrixRunning = true;
  const cv = $('#matrix'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  cv.classList.add('on');
  const chars = 'アカサタナハマヤラワ0123456789JAYPATWA<>{}/=+'.split('');
  const size = 16;
  const cols = Math.floor(cv.width / size);
  const drops = Array(cols).fill(1);
  let raf, stop = false;

  function draw(){
    ctx.fillStyle = 'rgba(6,6,8,.08)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#c8ff2b';
    ctx.font = size + 'px monospace';
    for (let i = 0; i < drops.length; i++){
      const c = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(c, i*size, drops[i]*size);
      if (drops[i]*size > cv.height && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
    if (!stop) raf = requestAnimationFrame(draw);
  }
  draw();

  function end(){
    stop = true; cancelAnimationFrame(raf);
    cv.classList.remove('on');
    setTimeout(() => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      matrixRunning = false;
    }, 450);
    window.removeEventListener('keydown', end);
    window.removeEventListener('pointerdown', end);
  }
  setTimeout(() => {
    window.addEventListener('keydown', end, { once:true });
    window.addEventListener('pointerdown', end, { once:true });
  }, 600);
  setTimeout(end, 9000);
}

/* ==========================================================
   16. Konami code
========================================================== */
function initKonami(){
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
               'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let i = 0;
  window.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[i]){
      i++;
      if (i === seq.length){ i = 0; runMatrix(); }
    } else i = (k === seq[0]) ? 1 : 0;
  });
  const egg = $('#footEgg');
  if (egg) egg.addEventListener('click', runMatrix);
}

/* ==========================================================
   Smooth in-page anchor scrolling
========================================================== */
function initAnchors(){
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
}

/* ==========================================================
   Boot → site start
========================================================== */
function startSite(){
  const n1 = $('.hero-name .scramble:nth-child(1)');
  const n2 = $('.hero-name .scramble:nth-child(2)');
  if (n1) scramble(n1, 'JAY', 0);
  if (n2){
    scramble(n2, 'PATWA', 10);
    setTimeout(() => n2.classList.add('lit'), 1400);
  }
  initRoles();
}

/* ==========================================================
   Init
========================================================== */
function init(){
  initCursor();
  initBoot();
  initReveal();
  initCounters();
  initMagnetic();
  initMarquee();
  initHorizontal();
  initScrollUI();
  initTerminal();
  initKonami();
  initAnchors();
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', init);
else init();

})();
