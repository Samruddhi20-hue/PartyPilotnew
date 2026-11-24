document.addEventListener("DOMContentLoaded",()=>{
  const root=document.getElementById("comparisonContent");if(!root)return;
  const esc=v=>String(v??"Not available").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let items=[];try{items=JSON.parse(localStorage.getItem("partyPilotCompare")||"[]");}catch{}
  const cached=(()=>{try{return JSON.parse(localStorage.getItem("partyPilotVenues")||"[]");}catch{return[];}})();
  items=items.map(x=>typeof x==="string"?cached.find(v=>v.id===x):x).filter(Boolean).slice(0,3);
  function render(){
    if(!items.length){root.innerHTML="<p>No venues selected. <a href='/explore'>Explore venues</a> and add up to three to compare.</p>";return;}
    const rows=[["Address",v=>v.address||v.location],["Category",v=>v.category],["Rating",v=>v.rating],["Price/person",v=>v.price_per_person==null?null:`₹${v.price_per_person}`],["Capacity",v=>v.capacity],["Phone",v=>v.phone],["Website",v=>v.website]];
    root.innerHTML=`<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr><th>Feature</th>${items.map(v=>`<th>${esc(v.name)}<br><button data-remove="${esc(v.id)}">Remove</button></th>`).join("")}</tr></thead><tbody>${rows.map(([label,get])=>`<tr><th>${label}</th>${items.map(v=>`<td>${esc(get(v))}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p>Only provider-supplied information is shown. Missing details should be confirmed with the venue.</p>`;
  }
  root.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;items=items.filter(v=>v.id!==b.dataset.remove);localStorage.setItem("partyPilotCompare",JSON.stringify(items));render();});
  render();
});
