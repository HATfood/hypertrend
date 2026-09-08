const DATA=window.HYPERFAMILY_DATA;
const months=DATA.months;
const ownedSet=new Set(DATA.ownedBrands);
const colors={"فامیلا":"#d9a541","بلوط":"#6f554d","سانتین":"#4d8b75","کیمبال":"#547f9d","سایر برندها":"#dfe6e1"};
const passwordHash="00a9343f048bf05f68d6379512d4eade08b21545a8e4bd7f684cd2241a8baa89";
const el=id=>document.getElementById(id);
const sum=a=>a.reduce((x,y)=>x+y,0);
const fa=(n,d=0)=>new Intl.NumberFormat("fa-IR",{minimumFractionDigits:0,maximumFractionDigits:d}).format(n);
const pct=(a,b)=>b?(a/b*100):0;
const change=(a,b)=>b?((a-b)/b*100):(a?100:0);
const ton=kg=>fa(kg/1000,3);
const weight=kg=>kg>=1000?`${ton(kg)} تن`:`${fa(kg)} کیلوگرم`;
let activeCategory=0,activeBrand="all",activeMonth="all";

function metricRows(cat){
 const selectedOwned=activeBrand==="all"?cat.brands.filter(b=>b.owned):cat.brands.filter(b=>b.name===activeBrand&&b.owned);
 const companyMonthly=months.map((_,i)=>sum(selectedOwned.map(b=>b.values[i])));
 return {selectedOwned,companyMonthly,totalMonthly:cat.totalMonthly,otherMonthly:cat.totalMonthly.map((v,i)=>v-companyMonthly[i])};
}
function periodValue(values){return activeMonth==="all"?sum(values):values[+activeMonth]}
function deltaBadge(value,base=false){if(base)return '<span class="delta base">ماه پایه</span>';const up=value>=0;return `<span class="delta ${up?'up':'down'}">${up?'▲':'▼'} ${fa(Math.abs(value),1)}٪</span>`}
function panelHead(no,title,subtitle,unit){return `<div class="panel-head"><div><span class="section-no">${no}</span><span><h2>${title}</h2><small>${subtitle}</small></span></div><span class="unit">${unit}</span></div>`}

function renderTabs(){
 el("category-tabs").innerHTML=DATA.categories.map((cat,i)=>`<button type="button" data-index="${i}" class="${i===activeCategory?'active':''}"><b>${cat.name}</b><small>${fa(pct(cat.companyTotal,cat.marketTotal),1)}٪ سهم شرکت</small></button>`).join("");
 el("category-tabs").querySelectorAll("button").forEach(btn=>btn.onclick=()=>{activeCategory=+btn.dataset.index;render()});
}
function renderKpis(cat,m){
 const company=periodValue(m.companyMonthly),market=periodValue(m.totalMonthly),share=pct(company,market);
 const period=activeMonth==="all"?"فروردین تا ۱۵ شهریور":activeMonth==="5"?"شهریور تا روز ۱۵":months[+activeMonth];
 el("kpis").innerHTML=`
 <article class="kpi accent"><span>فروش برندهای شرکت</span><strong>${weight(company)}</strong><small>${period}</small><i class="kpi-icon">↗</i></article>
 <article class="kpi"><span>کل فروش گروه</span><strong>${weight(market)}</strong><small>برندهای شرکت + سایر برندها</small><i class="kpi-icon">Σ</i></article>
 <article class="kpi"><span>سهم از گروه</span><strong>${fa(share,1)}٪</strong><small>${fa(company)} ÷ ${fa(market)} کیلوگرم</small><i class="kpi-icon">◔</i></article>`;
}
function renderTrend(cat,m){
 const max=Math.max(...m.companyMonthly,1);
 const bars=m.companyMonthly.map((v,i)=>`<div class="bar-item"><div class="value-pill"><b>${ton(v)}</b><small>تن</small></div><div class="bar-track"><i style="height:${Math.max(3,v/max*100)}%"></i></div><strong class="month-name">${months[i]}</strong><span class="month-delta ${i===0?'base':change(v,m.companyMonthly[i-1])>=0?'up':'down'}">${i===0?'پایه':`${change(v,m.companyMonthly[i-1])>=0?'▲':'▼'} ${fa(Math.abs(change(v,m.companyMonthly[i-1])),1)}٪`}</span></div>`).join("");
 el("trend-panel").innerHTML=panelHead("۰۱","روند فروش برندهای شرکت","مقدار دقیق ماهانه و تغییر نسبت به ماه قبل","تن")+`<div class="trend-chart" aria-label="روند فروش ${cat.name}">${bars}</div>`;
}
function categoryRankings(cat){
 const ranked=cat.brands.filter(b=>b.name!=="بدون برند");
 const septemberIndex=months.length-1,septemberTotal=cat.totalMonthly[septemberIndex];
 const septemberTop=[...ranked].map(b=>({name:b.name,value:b.values[septemberIndex],owned:b.owned})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,"fa")).slice(0,3);
 const ytdTop=[...ranked].map(b=>({name:b.name,value:sum(b.values),owned:b.owned})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,"fa")).slice(0,3);
 return {septemberTop,ytdTop,septemberTotal};
}
function rankingCard(title,subtitle,rows,total){
 return `<div class="top-brand-card"><div class="top-brand-head"><span>${title}</span><small>${subtitle}</small></div>${rows.map((row,i)=>`<div class="top-brand-row"><i>${fa(i+1)}</i><span>${row.name}${row.owned?'<em>شرکت</em>':''}</span><b>${fa(row.value)} kg</b><small>${fa(pct(row.value,total),1)}٪</small></div>`).join("")}</div>`;
}
function renderShare(cat,m){
 const company=periodValue(m.companyMonthly),market=periodValue(m.totalMonthly),other=market-company,share=pct(company,market);
 el("share-panel").innerHTML=panelHead("۰۲","سهم از فروش گروه",activeMonth==="all"?"تجمعی ۶ ماهه تا ۱۵ شهریور":activeMonth==="5"?"شهریور تا روز ۱۵":months[+activeMonth],"کیلوگرم")+`<div class="share-summary"><div class="donut" style="background:conic-gradient(var(--green) ${share}%,#e5ebe7 0)"><div><strong>${fa(share,1)}٪</strong><span>سهم برندهای شرکت</span></div></div><div class="legend"><div class="legend-row"><i style="background:var(--green)"></i>برندهای شرکت<b>${fa(company)} kg</b></div><div class="legend-row"><i></i>سایر برندها<b>${fa(other)} kg</b></div><div class="legend-row"><i style="background:var(--gold)"></i>کل گروه<b>${fa(market)} kg</b></div></div></div>`;
}
function renderCompare(cat,m){
 const ownParts=m.selectedOwned.map(b=>({name:b.name,value:periodValue(b.values),owned:true})).filter(x=>x.value>0);
 const company=periodValue(m.companyMonthly),market=periodValue(m.totalMonthly),parts=[...ownParts,{name:"سایر برندها",value:market-company,owned:false}].sort((a,b)=>b.value-a.value),max=Math.max(...parts.map(x=>x.value),1);
 const {septemberTop,ytdTop,septemberTotal}=categoryRankings(cat);
 el("compare-panel").innerHTML=panelHead("۰۳","ترکیب فروش و رتبه‌بندی برندها","مقایسه برندهای شرکت با سایر بازار و سه برند برتر دوره","کیلوگرم")+`<div class="compare-content"><div class="compare-bars">${parts.map(p=>`<div class="compare-row"><span>${p.name}</span><div class="compare-track"><i style="--color:${colors[p.name]||'#7ba38f'};width:${p.value/max*100}%"></i></div><b>${fa(p.value)}</b><small>${fa(pct(p.value,market),1)}٪</small></div>`).join("")}</div><div class="compare-rankings">${rankingCard("سه برند برتر شهریور","تا روز ۱۵",septemberTop,septemberTotal)}${rankingCard("سه برند برتر ۱۴۰۵","فروردین تا ۱۵ شهریور",ytdTop,cat.marketTotal)}</div></div>`;
}
function renderInsights(cat,m){
 const peakSales=Math.max(...m.companyMonthly),peakSalesI=m.companyMonthly.indexOf(peakSales),shares=m.companyMonthly.map((v,i)=>pct(v,m.totalMonthly[i])),peakShare=Math.max(...shares),peakShareI=shares.indexOf(peakShare);
 el("insights").innerHTML=`<article class="insight"><span>اوج فروش</span><b>${months[peakSalesI]} با ${fa(peakSales)} کیلوگرم</b><p>بیشترین فروش وزنی برندهای شرکت در گروه ${cat.name}.</p></article><article class="insight"><span>بالاترین سهم</span><b>${fa(peakShare,1)}٪ در ${months[peakShareI]}</b><p>بالاترین سهم برندهای شرکت از کل فروش گروه در دوره.</p></article>`;
}
function renderTable(cat,m){
 const ownRows=m.selectedOwned.map(b=>({name:b.name,owned:true,values:b.values}));
 const other={name:"سایر برندها",owned:false,values:m.otherMonthly};
 const rows=[...ownRows,other];
 const visibleMonths=months.map((name,i)=>({name,i})).filter(x=>activeMonth==="all"||x.i===+activeMonth);
 const market=periodValue(m.totalMonthly);
 el("table-panel").innerHTML=panelHead("۰۴","جدول کنترل ماهانه","برندهای شرکت جدا از مجموع سایر برندها","کیلوگرم")+`<div class="table-scroll"><table><thead><tr><th>نوع</th><th>برند / گروه</th>${visibleMonths.map(x=>`<th>${x.name}</th>`).join("")}<th>جمع ۶ ماهه</th><th>سهم انتخاب</th></tr></thead><tbody>${rows.map(r=>{const pv=periodValue(r.values);return `<tr><td><span class="brand-pill ${r.owned?'owned':'other'}">${r.owned?'شرکت':'سایر'}</span></td><td><b>${r.name}</b></td>${visibleMonths.map(x=>`<td>${fa(r.values[x.i])}</td>`).join("")}<td>${fa(sum(r.values))}</td><td><span class="share-pill">${fa(pct(pv,market),1)}٪</span></td></tr>`}).join("")}<tr class="total-row"><td colspan="2">کل گروه ${cat.name}</td>${visibleMonths.map(x=>`<td>${fa(m.totalMonthly[x.i])}</td>`).join("")}<td>${fa(sum(m.totalMonthly))}</td><td>۱۰۰٪</td></tr></tbody></table></div>`;
}
function render(){
 const cat=DATA.categories[activeCategory],m=metricRows(cat);
 renderTabs();renderKpis(cat,m);renderTrend(cat,m);renderShare(cat,m);renderCompare(cat,m);renderInsights(cat,m);renderTable(cat,m);
 el("hero-total").textContent=ton(sum(DATA.categories.map(c=>c.companyTotal)));
 el("filter-description").textContent=`${activeBrand==="all"?'همه برندهای شرکت':activeBrand} · ${activeMonth==="all"?'۶ ماهه':activeMonth==="5"?'شهریور تا روز ۱۵':months[+activeMonth]}`;
}

el("brand-filter").onchange=e=>{activeBrand=e.target.value;render()};
el("month-filter").onchange=e=>{activeMonth=e.target.value;render()};
el("reset-filter").onclick=()=>{activeBrand=activeMonth="all";el("brand-filter").value="all";el("month-filter").value="all";render()};
async function sha256(value){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function unlock(){document.body.classList.remove("locked");el("login-gate").classList.add("hidden");el("dashboard").setAttribute("aria-hidden","false");try{sessionStorage.setItem("hyperfamily-unlocked","1")}catch{}}
el("login-form").onsubmit=async e=>{e.preventDefault();el("login-error").textContent="";if(await sha256(el("login-password").value)===passwordHash)unlock();else el("login-error").textContent="رمز واردشده صحیح نیست."};
try{if(sessionStorage.getItem("hyperfamily-unlocked")==="1")unlock()}catch{}
render();
