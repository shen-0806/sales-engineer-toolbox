// --- Scroll to Top on Refresh ---
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Formatting Helpers
const decMap = { cmh:0, cms:4, lps:1, cfm:0, cfh:0, pa:1, kpa:3, inwg:3, mmwg:1, mbar:2, psi:3, ms:2, fpm:0 };
function getDec(u) { const m = {cmh:0, cms:4, lps:1, cfm:0, sqm:3, sqft:2, ms:2, fpm:0, mm:0, inch:2}; return m[u] !== undefined ? m[u] : 2; }
function copyValue(id, btn) { const el = document.getElementById(id); if(!el.value) return; navigator.clipboard.writeText(el.value.replace(/,/g, '')); btn.innerText = '✅'; setTimeout(() => btn.innerText = '📋', 1200); }
function formatActive(id) { const el=document.getElementById(id), v=el.value.replace(/,/g,''); if(v!==''&&!isNaN(v)) el.value=parseFloat(v).toLocaleString('en-US',{maximumFractionDigits:decMap[id]}); }
function syncDimUnits(s,t){ document.getElementById(t).value=document.getElementById(s).value; }

// --- Static Converters ---
const airFactors = { cmh: 1, cms: 1/3600, lps: 1/3.6, cfm: 1/1.6990107955, cfh: 35.3146667215 };
const espFactors = { pa: 1, kpa: 1/1000, inwg: 1/248.84, mmwg: 1/9.80665, mbar: 1/100, psi: 1/6894.757293 };
const velFactors = { ms: 1, fpm: 196.850394 };

function syncGroup(id, factors, decimalMap) {
    const raw = document.getElementById(id).value.replace(/,/g, '');
    if(raw === '' || isNaN(raw)) { Object.keys(factors).forEach(k => { if(k!==id) document.getElementById(k).value=''; }); return; }
    const base = parseFloat(raw) / factors[id];
    Object.keys(factors).forEach(k => { if(k!==id) document.getElementById(k).value=(base*factors[k]).toLocaleString('en-US',{maximumFractionDigits:decimalMap[k]}); });
}
function syncAirflow(id){ syncGroup(id, airFactors, decMap); }
function syncVelocity(id){ syncGroup(id, velFactors, decMap); }
function syncESP(id){ syncGroup(id, espFactors, decMap); }
function clearGroup(factors){ Object.keys(factors).forEach(k => document.getElementById(k).value=''); }

// --- Core Duct/Velocity Calculations ---
function runAllCalculations() {
    // Duct Airflow
    let vol = parseFloat(document.getElementById('calcVol').value.replace(/,/g, ''));
    let w = parseFloat(document.getElementById('calcWidth').value.replace(/,/g, ''));
    let h = parseFloat(document.getElementById('calcHeight').value.replace(/,/g, ''));
    let volU = document.getElementById('volUnit').value;
    let cms = isNaN(vol) ? undefined : (volU === 'cmh' ? vol/3600 : volU === 'cms' ? vol : volU === 'lps' ? vol/1000 : vol * 0.000471947);
    
    // Grille Airflow
    let volGrille = parseFloat(document.getElementById('calcVolGrille').value.replace(/,/g, ''));
    let volGrilleU = document.getElementById('volUnitGrille').value;
    let cmsGrille = isNaN(volGrille) ? undefined : (volGrilleU === 'cmh' ? volGrille/3600 : volGrilleU === 'cms' ? volGrille : volGrilleU === 'lps' ? volGrille/1000 : volGrille * 0.000471947);

    // Louvre Airflow
    let volLouvre = parseFloat(document.getElementById('calcVolLouvre').value.replace(/,/g, ''));
    let volLouvreU = document.getElementById('volUnitLouvre').value;
    let cmsLouvre = isNaN(volLouvre) ? undefined : (volLouvreU === 'cmh' ? volLouvre/3600 : volLouvreU === 'cms' ? volLouvre : volLouvreU === 'lps' ? volLouvre/1000 : volLouvre * 0.000471947);

    // Duct Calc
    if (!isNaN(w) && !isNaN(h) && w>0 && h>0) {
        let max = Math.max(w,h), min = Math.min(w,h); document.getElementById('calcRatio').value = (max/min).toFixed(2) + ' : 1';
        let area = (document.getElementById('dimUnitW').value === 'mm' ? w/1000 : w*0.0254) * (document.getElementById('dimUnitH').value === 'mm' ? h/1000 : h*0.0254);
        if (cms !== undefined) {
            let vel = cms/area; let velU = document.getElementById('velUnit').value;
            document.getElementById('calcResult').value = (velU === 'ms' ? vel : vel*196.85).toLocaleString('en-US', {maximumFractionDigits: getDec(velU)});
        } else document.getElementById('calcResult').value = '';
    } else { document.getElementById('calcRatio').value = ''; document.getElementById('calcResult').value = ''; }

    // Grille Calc
    let qty = parseFloat(document.getElementById('grilleQty').value);
    let gW = parseFloat(document.getElementById('grilleW').value.replace(/,/g, '')), gH = parseFloat(document.getElementById('grilleH').value.replace(/,/g, ''));
    let gFA = parseFloat(document.getElementById('grilleFA').value);
    document.getElementById('grilleVolOut').value = ''; document.getElementById('grilleVelOut').value = '';
    
    if (cmsGrille !== undefined && !isNaN(qty) && qty > 0) {
        let gCMS = cmsGrille/qty;
        let gVolU = document.getElementById('grilleVolUnit').value;
        document.getElementById('grilleVolOut').value = (gVolU === 'cmh' ? gCMS*3600 : gVolU==='cms' ? gCMS : gVolU === 'lps' ? gCMS*1000 : gCMS/0.000471947).toLocaleString('en-US', {maximumFractionDigits: getDec(gVolU)});
        if (!isNaN(gW) && !isNaN(gH) && !isNaN(gFA) && gFA > 0) {
            let gA = (document.getElementById('grilleUnitW').value === 'mm' ? gW/1000 : gW*0.0254) * (document.getElementById('grilleUnitH').value === 'mm' ? gH/1000 : gH*0.0254) * (gFA/100);
            let gV = gCMS/gA; let velU = document.getElementById('grilleVelUnit').value;
            document.getElementById('grilleVelOut').value = (velU === 'ms' ? gV : gV*196.85).toLocaleString('en-US', {maximumFractionDigits: getDec(velU)});
        }
    }

    // Louvre Calc
    let lW = parseFloat(document.getElementById('louvreW').value.replace(/,/g, '')), lH = parseFloat(document.getElementById('louvreH').value.replace(/,/g, '')), lFA = parseFloat(document.getElementById('louvreFA').value);
    document.getElementById('louvreVelOut').value = '';
    if (cmsLouvre !== undefined && !isNaN(lW) && lW > 0 && !isNaN(lH) && lH > 0 && !isNaN(lFA) && lFA > 0) {
        let lA = (document.getElementById('louvreUnitW').value === 'mm' ? lW/1000 : lW*0.0254) * (document.getElementById('louvreUnitH').value === 'mm' ? lH/1000 : lH*0.0254);
        let lV = cmsLouvre / (lA * (lFA/100)); let velU = document.getElementById('louvreVelUnit').value;
        document.getElementById('louvreVelOut').value = (velU === 'ms' ? lV : lV*196.85).toLocaleString('en-US', {maximumFractionDigits: getDec(velU)});
    }
}

function clearDuct() {
    ['calcVol', 'calcWidth', 'calcHeight', 'calcResult', 'calcRatio'].forEach(id => document.getElementById(id).value = '');
}

function clearGrille() {
    ['calcVolGrille', 'grilleW', 'grilleH', 'grilleVolOut', 'grilleVelOut'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('grilleQty').value = '1'; document.getElementById('grilleFA').value = '50';
}

function clearLouvre() {
    ['calcVolLouvre', 'louvreW', 'louvreH', 'louvreVelOut'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('louvreFA').value = '50';
}

// --- QVA Calculator ---
let qvaHistory = [];
function handleQVAInput(f) { qvaHistory = qvaHistory.filter(x => x !== f); qvaHistory.push(f); ['Vol','Vel','Area'].forEach(x => document.getElementById('qva'+x).classList.remove('qva-highlight')); calculateQVA(); }
function toggleQVAAreaInputs() {
    const m = document.getElementById('qvaAreaMethod').value;
    document.getElementById('qvaAreaRectWrapper').style.display = (m==='rectangle')?'flex':'none'; document.getElementById('qvaAreaCircWrapper').style.display = (m==='circle')?'block':'none';
    const a = document.getElementById('qvaArea');
    if(m!=='direct'){ 
        a.readOnly=true; // Replaced hardcoded inline styles to let CSS handle colors
        calcAreaFromDims(); 
    } else { 
        a.readOnly=false; 
    }
}
function calcAreaFromDims() {
    const m = document.getElementById('qvaAreaMethod').value; if(m==='direct') return;
    let area=0, valid=false;
    if(m==='rectangle'){
        let w=parseFloat(document.getElementById('qvaRectW').value.replace(/,/g,'')), h=parseFloat(document.getElementById('qvaRectH').value.replace(/,/g,''));
        if(!isNaN(w)&&!isNaN(h)&&w>0&&h>0){ let u=document.getElementById('qvaRectUnitW').value; area=(u==='mm'?w/1000:w*0.0254)*(u==='mm'?h/1000:h*0.0254); valid=true; }
    } else if(m==='circle'){
        let d=parseFloat(document.getElementById('qvaCircD').value.replace(/,/g,''));
        if(!isNaN(d)&&d>0){ let u=document.getElementById('qvaCircUnit').value; let r=(u==='mm'?d/1000:d*0.0254)/2; area=Math.PI*r*r; valid=true; }
    }
    if(valid){
        let ou=document.getElementById('qvaAreaUnit').value; document.getElementById('qvaArea').value=(ou==='sqft'?area/0.092903:area).toLocaleString('en-US',{maximumFractionDigits:getDec(ou)});
        qvaHistory=qvaHistory.filter(f=>f!=='Area'); qvaHistory.push('Area'); calculateQVA();
    } else { document.getElementById('qvaArea').value=''; qvaHistory=qvaHistory.filter(f=>f!=='Area'); calculateQVA(); }
}
function calculateQVA() {
    if(qvaHistory.length<2) return;
    let t = ['Vol','Vel','Area'].find(f => !qvaHistory.slice(-2).includes(f));
    let v=parseFloat(document.getElementById('qvaVol').value.replace(/,/g,'')), ve=parseFloat(document.getElementById('qvaVel').value.replace(/,/g,'')), a=parseFloat(document.getElementById('qvaArea').value.replace(/,/g,''));
    let uV=document.getElementById('qvaVolUnit').value, uVe=document.getElementById('qvaVelUnit').value, uA=document.getElementById('qvaAreaUnit').value;
    let cms=!isNaN(v)?(uV==='cmh'?v/3600:uV==='lps'?v/1000:uV==='cfm'?v*0.000471947:v):undefined;
    let ms=!isNaN(ve)?(uVe==='fpm'?ve/196.85:ve):undefined;
    let sqm=!isNaN(a)?(uA==='sqft'?a*0.092903:a):undefined;
    
    if(t==='Vol' && ms!==undefined && sqm!==undefined){ let ans=ms*sqm; document.getElementById('qvaVol').value=(uV==='cmh'?ans*3600:uV==='lps'?ans*1000:uV==='cfm'?ans/0.000471947:ans).toLocaleString('en-US',{maximumFractionDigits:getDec(uV)}); document.getElementById('qvaVol').classList.add('qva-highlight'); }
    else if(t==='Vel' && cms!==undefined && sqm!==undefined && sqm>0){ let ans=cms/sqm; document.getElementById('qvaVel').value=(uVe==='fpm'?ans*196.85:ans).toLocaleString('en-US',{maximumFractionDigits:getDec(uVe)}); document.getElementById('qvaVel').classList.add('qva-highlight'); }
    else if(t==='Area' && cms!==undefined && ms!==undefined && ms>0){
        document.getElementById('qvaAreaMethod').value='direct'; toggleQVAAreaInputs();
        let ans=cms/ms; document.getElementById('qvaArea').value=(uA==='sqft'?ans/0.092903:ans).toLocaleString('en-US',{maximumFractionDigits:getDec(uA)}); document.getElementById('qvaArea').classList.add('qva-highlight');
    }
}
function clearQVACalculator(){ ['qvaVol','qvaVel','qvaArea','qvaRectW','qvaRectH','qvaCircD'].forEach(id=>{let e=document.getElementById(id);if(e){e.value='';e.classList.remove('qva-highlight');}}); qvaHistory=[]; }

// --- Custom Links ---
const storageKey='systemairCompanyLinksV4'; let isManageMode=false, draggedElement=null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme(); // Initialize Dark/Light Mode
    loadLinks();
    toggleQVAAreaInputs(); // Ensures Rectangle inputs show immediately on load
});

function toggleManageMode() {
    isManageMode = !isManageMode; const c=document.getElementById('linksContainer'), t=document.getElementById('manageToggle'), i=c.querySelectorAll('.link-item');
    if(isManageMode){ c.classList.add('manage-mode'); t.classList.add('active'); t.innerText="Done Editing"; i.forEach(x=>x.draggable=true); }
    else{ c.classList.remove('manage-mode'); t.classList.remove('active'); t.innerText="⚙️ Manage"; i.forEach(x=>x.draggable=false); }
}
function loadLinks() {
    let links=JSON.parse(localStorage.getItem(storageKey));
    if(!links||links.length===0){ 
        links=[
            {"id":1,"name":"Systemair MY","url":"https://www.systemair.com/en-my"},
            {"id":2,"name":"AXC Axial Fan","url":"https://www.systemair.com/en-my/products/fans/axial-fans"},
            {"id":3,"name":"AAW Axial Fans","url":"https://www.systemair.com/en-my/products/fans/axial-fans/aaw"},
            {"id":4,"name":"K A/AL Fan","url":"https://www.systemair.com/en-my/products/fans/duct-fans/circular-duct-fans/k"},
            {"id":5,"name":"CDRE/D","url":"https://www.systemair.com/en-my/products/fans/duct-fans/square-duct-fans/cdr"},
            {"id":6,"name":"MUB T","url":"https://www.systemair.com/en-my/products/fans/duct-fans/insulated-duct-fans/mub/mub-t"},
            {"id":7,"name":"MUB","url":"https://www.systemair.com/en-my/products/fans/duct-fans/insulated-duct-fans/mub/mub"},
            {"id":8,"name":"BKF Duct Fan","url":"https://www.systemair.com/en-my/products/fans/duct-fans/rectangular-duct-fans/bkf"},
            {"id":9,"name":"ASP Centrifugal","url":"https://www.systemair.com/en-my/products/selection-software/centrifugal-fans?ecom-category-id-MULTI=90101"}
        ]; 
        localStorage.setItem(storageKey,JSON.stringify(links)); 
    }
    renderAllLinks(links);
}
function renderAllLinks(linksArray) {
    const c=document.getElementById('linksContainer'); c.innerHTML='';
    linksArray.forEach(l => {
        const div=document.createElement('div'); div.className='link-item'; div.id='link-'+l.id; div.draggable=isManageMode;
        const a=document.createElement('a'); a.href=l.url; a.target="_blank"; a.className="btn btn-link"; a.textContent=l.name;
        const b=document.createElement('div'); b.className='action-badges';
        const eb=document.createElement('button'); eb.className='badge-btn edit-badge'; eb.innerHTML='✏️'; eb.onclick=()=>editLink(l.id);
        const db=document.createElement('button'); db.className='badge-btn del-badge'; db.innerHTML='❌'; db.onclick=()=>removeLink(l.id);
        b.appendChild(eb); b.appendChild(db); div.appendChild(a); div.appendChild(b);
        div.addEventListener('dragstart',e=>{if(!isManageMode)return; draggedElement=div; setTimeout(()=>div.classList.add('dragging'),0);});
        div.addEventListener('dragend',e=>{if(!isManageMode)return; div.classList.remove('dragging'); draggedElement=null; saveNewOrder();});
        div.addEventListener('dragover',e=>{if(!isManageMode)return; e.preventDefault();});
        div.addEventListener('dragenter',e=>{if(!isManageMode)return; e.preventDefault(); const t=e.target.closest('.link-item'); if(draggedElement&&t&&draggedElement!==t){ const items=Array.from(c.children); items.indexOf(draggedElement)<items.indexOf(t) ? t.after(draggedElement) : t.before(draggedElement); }});
        c.appendChild(div);
    });
}
function saveNewOrder() { const c=document.getElementById('linksContainer'), items=Array.from(c.querySelectorAll('.link-item')); let links=JSON.parse(localStorage.getItem(storageKey))||[], map={}; links.forEach(l=>map[l.id]=l); localStorage.setItem(storageKey,JSON.stringify(items.map(i=>map[parseInt(i.id.replace('link-',''))]))); }
function addNewLink() { let n=prompt("Name:"), u=prompt("URL:"); if(!n||!u)return; if(!u.startsWith('http')) u='https://'+u; let l=JSON.parse(localStorage.getItem(storageKey))||[]; l.push({id:Date.now(),name:n,url:u}); localStorage.setItem(storageKey,JSON.stringify(l)); renderAllLinks(l); }
function editLink(id) { let l=JSON.parse(localStorage.getItem(storageKey))||[], i=l.findIndex(x=>x.id===id); if(i>-1){ let n=prompt("Name:",l[i].name), u=prompt("URL:",l[i].url); if(!n||!u)return; if(!u.startsWith('http')) u='https://'+u; l[i].name=n; l[i].url=u; localStorage.setItem(storageKey,JSON.stringify(l)); renderAllLinks(l); } }
function removeLink(id) { if(confirm("Remove?")){ let l=(JSON.parse(localStorage.getItem(storageKey))||[]).filter(x=>x.id!==id); localStorage.setItem(storageKey,JSON.stringify(l)); renderAllLinks(l); } }

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeButton('dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('siteTheme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerText = theme === 'dark' ? '☀️' : '🌙';
    }
}
