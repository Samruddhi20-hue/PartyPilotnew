document.addEventListener("DOMContentLoaded",()=>{
  const grid=document.getElementById("shortlistGrid"),empty=document.getElementById("shortlistEmpty"),count=document.getElementById("shortlistCount");
  if(!grid)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let items=[];try{items=JSON.parse(localStorage.getItem("partyPilotShortlist")||"[]");}catch{}
  const cached=(()=>{try{return JSON.parse(localStorage.getItem("partyPilotVenues")||"[]");}catch{return[];}})();
  items=items.map(x=>typeof x==="string"?cached.find(v=>v.id===x):x).filter(Boolean);
  function render(){
    count.textContent=`${items.length} saved venue${items.length===1?"":"s"}`;
    empty.hidden=items.length>0;
    grid.innerHTML=items.map(v=>`<article class="venue-card"><div class="venue-content"><h3>${esc(v.name)}</h3><p>${esc(v.address||v.location||"")}</p><a href="/venue/${encodeURIComponent(v.id)}">View details</a> <button type="button" data-remove="${esc(v.id)}">Remove</button></div></article>`).join("");
  }
  grid.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;items=items.filter(v=>v.id!==b.dataset.remove);localStorage.setItem("partyPilotShortlist",JSON.stringify(items));render();});
  render();
});
