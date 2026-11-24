document.addEventListener("DOMContentLoaded",()=>{
  if(window.lucide)window.lucide.createIcons();
  const menu=document.getElementById("mobileMenuBtn"), nav=document.getElementById("navLinks");
  if(menu&&nav){
    menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));document.body.classList.toggle("menu-open",open);});
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");document.body.classList.remove("menu-open");}));
  }
  window.showToast=(message,type="success")=>{
    const container=document.getElementById("toastContainer");if(!container)return;
    const toast=document.createElement("div");toast.className=`toast ${type}`;toast.textContent=message;container.appendChild(toast);
    setTimeout(()=>toast.remove(),3200);
  };
  const date=document.getElementById("contactDate");
  if(date){const d=new Date();date.min=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  const params=new URLSearchParams(location.search);
  const venueId=document.getElementById("contactVenueId"), venueName=document.getElementById("contactVenue");
  if(venueId&&params.get("venue_id"))venueId.value=params.get("venue_id");
  if(venueName&&params.get("venue_name"))venueName.value=params.get("venue_name");
  const form=document.getElementById("contactForm"), status=document.getElementById("contactFormStatus");
  form?.addEventListener("submit",async e=>{
    e.preventDefault();
    const payload={
      customer_name:document.getElementById("contactName")?.value.trim(),
      email:document.getElementById("contactEmail")?.value.trim(),
      phone:document.getElementById("contactPhone")?.value.trim(),
      event_type:document.getElementById("contactSubject")?.value,
      venue_id:venueId?.value||"",
      venue_name:venueName?.value.trim()||"",
      event_date:date?.value||"",
      guest_count:document.getElementById("contactGuests")?.value,
      budget:document.getElementById("contactBudget")?.value||"",
      message:document.getElementById("contactMessage")?.value.trim()||""
    };
    status.textContent="Submitting…";
    try{
      const response=await fetch("/api/enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok||!result.success)throw new Error(result.error||"Unable to submit enquiry.");
      status.textContent=result.message;form.reset();
    }catch(err){status.textContent=err.message;}
  });
  document.querySelectorAll("img").forEach(img=>img.addEventListener("error",()=>img.classList.add("image-unavailable")));
});
