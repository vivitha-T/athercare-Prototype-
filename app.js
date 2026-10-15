const $ = id => document.getElementById(id);
const history = [];
// These are demonstration thresholds only, not clinical recommendations.
const limits = {temp:[36,37.5], spo:[90,100], hr:[100,180], co2:[0,1000], pressure:[0,30]};
let currentSource = "MANUAL INPUT";

function state(key, value) {
  const [lo, hi] = limits[key];
  if (value < lo || value > hi) return "CRITICAL";
  if (value < lo + (hi-lo)*0.12 || value > hi - (hi-lo)*0.12) return "WARNING";
  return "NORMAL";
}
function card(name, value, unit, status) {
  const color = status === "CRITICAL" ? "#dc2626" : status === "WARNING" ? "#d97706" : "#16a34a";
  return `<div class="card"><span>${name}</span><br><strong>${value}</strong> ${unit}<span class="state" style="color:${color}">${status}</span></div>`;
}
function draw() {
  const c = $("chart"), x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  x.strokeStyle = "#d5dbe3";
  for(let i=0;i<5;i++){x.beginPath();x.moveTo(40,30+i*50);x.lineTo(870,30+i*50);x.stroke();}
  if(!history.length){x.fillStyle="#64748b";x.font="16px Arial";x.fillText("Submit a reading to see the graph.",300,145);return;}
  const sets=[["temp","#2563eb",30,42],["spo","#16a34a",70,100],["hr","#9333ea",60,200]];
  sets.forEach(([key,col,lo,hi])=>{
    x.strokeStyle=col;x.lineWidth=3;x.beginPath();
    history.forEach((r,i)=>{
      const xx=50+i*(810/Math.max(1,history.length-1));
      const v=Math.max(lo,Math.min(hi,r[key]));
      const yy=245-(v-lo)/(hi-lo)*190;
      i ? x.lineTo(xx,yy) : x.moveTo(xx,yy);
    }); x.stroke();
  });
}
function submitReading() {
  const r = {
    baby:$("baby").value.trim(), inc:$("inc").value.trim(),
    temp:Number($("temp").value), spo:Number($("spo").value),
    hr:Number($("hr").value), co2:Number($("co2").value),
    pressure:Number($("pressure").value), time:new Date(), source:currentSource
  };
  if (!r.baby || !r.inc || !Number.isFinite(r.temp) || !Number.isFinite(r.spo) ||
      !Number.isFinite(r.hr) || !Number.isFinite(r.co2) || !Number.isFinite(r.pressure)) {
    $("msg").textContent = "Please enter valid values in all fields."; return;
  }
  history.push(r); if(history.length>30) history.shift();
  const s={temp:state("temp",r.temp),spo:state("spo",r.spo),hr:state("hr",r.hr),co2:state("co2",r.co2),pressure:state("pressure",r.pressure)};
  $("db").textContent=r.baby; $("di").textContent=r.inc;
  $("dt").textContent=r.time.toLocaleTimeString(); $("source").textContent=r.source;
  const overall=Object.values(s).includes("CRITICAL")?"CRITICAL":Object.values(s).includes("WARNING")?"WARNING":"NORMAL";
  $("status").textContent=overall;
  $("status").style.color=overall==="CRITICAL"?"#dc2626":overall==="WARNING"?"#d97706":"#16a34a";
  $("cards").innerHTML=card("Temperature",r.temp,"°C",s.temp)+card("SpO₂",r.spo,"% ",s.spo)+card("Heart Rate",r.hr,"bpm",s.hr)+card("CO₂ / Air Quality",r.co2,"ppm",s.co2)+card("Hand-port Pressure",r.pressure,"Pa",s.pressure);
  const alertItems=[];
  for(const [name,val,st] of [["Temperature",r.temp+" °C",s.temp],["SpO₂",r.spo+" %",s.spo],["Heart Rate",r.hr+" bpm",s.hr],["CO₂ / Air Quality",r.co2+" ppm",s.co2],["Hand-port Pressure",r.pressure+" Pa",s.pressure]]) {
    if(st!=="NORMAL") alertItems.push({name,val,st,time:r.time.toLocaleString()});
  }
  if(alertItems.length){
    const existing=$("alerts").textContent==="No alerts yet."?"":$("alerts").innerHTML;
    $("alerts").innerHTML=alertItems.map(a=>`<div class="${a.st==="WARNING"?"warning":""}"><b>${a.st}</b> — ${a.name}: ${a.val}<br><small>${a.time}</small></div>`).join("")+existing;
  } else if($("alerts").textContent==="No alerts yet.") {
    $("alerts").textContent="No alerts yet.";
  }
  $("msg").textContent = (r.source==="SIMULATED DEMO" ? "Demo reading loaded. These are simulated values." : "Reading submitted. Dashboard updated.");
  draw();
}
$("f").addEventListener("submit", e=>{e.preventDefault();currentSource="MANUAL INPUT";submitReading();});
$("demo").addEventListener("click", ()=>{
  $("temp").value=(36.5+Math.random()*1.1).toFixed(1);
  $("spo").value=Math.floor(95+Math.random()*4);
  $("hr").value=Math.floor(125+Math.random()*36);
  $("co2").value=Math.floor(450+Math.random()*350);
  $("pressure").value=(8+Math.random()*8).toFixed(1);
  currentSource="SIMULATED DEMO";
  submitReading();
});
$("clear").addEventListener("click", ()=>{
  history.length=0; $("alerts").textContent="No alerts yet."; $("cards").innerHTML="";
  $("db").textContent="—"; $("di").textContent="—"; $("dt").textContent="—";
  $("source").textContent="WAITING"; $("status").textContent="WAITING";
  $("msg").textContent="History cleared."; draw();
});
draw();
