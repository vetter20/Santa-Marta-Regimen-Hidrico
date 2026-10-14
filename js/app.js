const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SHORT=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
let data=[],chart=null,selected=0;
const $=id=>document.getElementById(id);
const formatMM=v=>`${Number(v).toLocaleString('es-CO',{maximumFractionDigits:1})} mm`;
async function init(){
 try{const res=await fetch('data/precipitacion-2025.json');if(!res.ok)throw Error('No se pudo cargar el dataset');data=await res.json();render();}
 catch(err){console.error(err);$('selectedMonthName').textContent='Error de datos';$('selectedMonthValue').textContent=err.message;}
}
function monthOf(r){return new Date(`${r.fecha}T00:00:00`).getMonth()}
function render(){
 const total=data.reduce((s,r)=>s+Number(r.valor),0), wet=data.reduce((a,b)=>Number(b.valor)>Number(a.valor)?b:a,data[0]);
 $('annualTotal').textContent=formatMM(total);$('wettestMonth').textContent=MONTHS[monthOf(wet)];$('wettestValue').textContent=formatMM(wet.valor);$('recordCount').textContent=data.length;
 chart=new Chart($('rainChart'),{type:'bar',data:{labels:data.map(r=>SHORT[monthOf(r)]),datasets:[{data:data.map(r=>r.valor),backgroundColor:data.map((_,i)=>i===selected?'#137e83':'#8fd4d0'),borderRadius:6,maxBarThickness:34}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>formatMM(c.raw)}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'#edf1f1'},border:{display:false},ticks:{callback:v=>v+' mm'}}},onClick:(_,els)=>els.length&&selectMonth(els[0].index)}});
 const box=$('monthButtons');box.innerHTML='';data.forEach((r,i)=>{const b=document.createElement('button');b.className=i===selected?'active':'';b.innerHTML=`${SHORT[monthOf(r)]}<span></span>`;b.title=`${MONTHS[monthOf(r)]}: ${formatMM(r.valor)}`;b.onclick=()=>selectMonth(i);box.appendChild(b)});selectMonth(0);
}
function selectMonth(i){selected=i;const r=data[i],m=monthOf(r),value=Number(r.valor);$('selectedMonthName').textContent=MONTHS[m];$('selectedMonthValue').textContent=formatMM(value);$('selectedMonthTotal').textContent=formatMM(value);document.querySelectorAll('.months button').forEach((b,j)=>b.classList.toggle('active',j===i));if(chart){chart.data.datasets[0].backgroundColor=data.map((_,j)=>j===i?'#137e83':'#8fd4d0');chart.update()};const max=Math.max(...data.map(x=>Number(x.valor)),1);const level=value===0?0:Math.max(1,Math.min(5,Math.ceil(value/max*5)));window.dispatchEvent(new CustomEvent('rain-month-selected',{detail:{month:MONTHS[m],value,level}}));}
init();