const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const body=document.body, toast=$("#toast");

function showToast(message){
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>toast.classList.remove("show"),2200);
}

const menuToggle=$("#menuToggle"), navLinks=$("#navLinks");
menuToggle?.addEventListener("click",()=>navLinks?.classList.toggle("open"));
$$(".nav-links a").forEach(a=>a.addEventListener("click",()=>navLinks?.classList.remove("open")));

function openLayer(id){
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.add("open");
  el.setAttribute("aria-hidden","false");
  body.classList.add("modal-open");
}
function closeLayer(id){
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden","true");
  if(!$(".modal.open,.search-panel.open,.purchase-modal.open")) body.classList.remove("modal-open");
}
$$("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeLayer(btn.dataset.close)));
$$(".modal,.search-panel").forEach(layer=>layer.addEventListener("click",e=>{if(e.target===layer)closeLayer(layer.id)}));

$("#watchIntro")?.addEventListener("click",()=>openLayer("introModal"));
$("#searchBtn")?.addEventListener("click",()=>{openLayer("searchPanel");setTimeout(()=>$("#courseSearch")?.focus(),80)});
$("#cartBtn")?.addEventListener("click",()=>showToast("កន្ត្រកនឹងត្រូវបន្ថែមនៅ Version បន្ទាប់។"));
$$(".login-open").forEach(btn=>btn.addEventListener("click",()=>openLayer("authModal")));
$$(".free-btn").forEach(btn=>btn.addEventListener("click",()=>showToast("មេរៀនឥតគិតថ្លៃនឹងបើកនៅ Version បន្ទាប់។")));

const courses=[
  {name:"មូលដ្ឋានភាសាចិន",price:"$12.00",id:"chinese-basics"},
  {name:"Excel សម្រាប់អាជីវកម្ម",price:"$10.00",id:"excel-business"},
  {name:"បង្កើតគេហទំព័រ",price:"$15.00",id:"website-basics"},
  {name:"គ្រប់គ្រងហិរញ្ញវត្ថុផ្ទាល់ខ្លួន",price:"ឥតគិតថ្លៃ",id:"free"}
];
const courseSearch=$("#courseSearch"), searchResults=$("#searchResults");
function renderSearch(q=""){
  if(!searchResults)return;
  const key=q.trim().toLowerCase();
  const rows=courses.filter(c=>!key||c.name.toLowerCase().includes(key));
  searchResults.innerHTML=rows.map(c=>c.id==="free"
    ? `<a href="#free"><span>${c.name}</span><b>${c.price}</b></a>`
    : `<a href="payment.html?courseId=${c.id}" class="search-buy"><span>${c.name}</span><b>${c.price}</b></a>`
  ).join("") || `<div style="padding:12px;color:#758196">រកមិនឃើញវគ្គសិក្សា</div>`;
}
courseSearch?.addEventListener("input",e=>renderSearch(e.target.value));
$("#searchBtn")?.addEventListener("click",()=>renderSearch());

const authTabs=$$(".auth-tab"), authForms=$$(".auth-form");
authTabs.forEach(tab=>tab.addEventListener("click",()=>{
  authTabs.forEach(x=>x.classList.toggle("active",x===tab));
  authForms.forEach(f=>f.classList.toggle("active",f.dataset.panel===tab.dataset.tab));
}));
authForms.forEach(form=>form.addEventListener("submit",e=>{
  e.preventDefault();
  const msg=$("#authMessage");
  if(msg)msg.textContent="ទម្រង់បានត្រៀមរួច។ ប្រព័ន្ធគណនីពិតនឹងភ្ជាប់នៅ Version បន្ទាប់។";
}));

const purchaseModal=$("#purchaseModal"), purchaseFrame=$("#purchaseFrame"), purchaseClose=$("#purchaseClose");
function openPurchase(courseId){
  if(!purchaseModal||!purchaseFrame||!courseId)return;
  purchaseFrame.src=`payment.html?courseId=${encodeURIComponent(courseId)}&embed=1`;
  purchaseModal.classList.add("open");
  purchaseModal.setAttribute("aria-hidden","false");
  body.classList.add("modal-open");
}
function closePurchase(){
  purchaseModal?.classList.remove("open");
  purchaseModal?.setAttribute("aria-hidden","true");
  body.classList.remove("modal-open");
  setTimeout(()=>{if(purchaseFrame&&!purchaseModal?.classList.contains("open"))purchaseFrame.src="about:blank"},180);
}
purchaseClose?.addEventListener("click",closePurchase);
purchaseModal?.addEventListener("click",e=>{if(e.target===purchaseModal)closePurchase()});
document.addEventListener("click",e=>{
  const link=e.target.closest(".enroll-btn,.search-buy");
  if(!link)return;
  const url=new URL(link.href,location.href);
  const id=url.searchParams.get("courseId");
  if(id){e.preventDefault();closeLayer("searchPanel");openPurchase(id)}
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  $$(".modal.open,.search-panel.open").forEach(x=>closeLayer(x.id));
  if(purchaseModal?.classList.contains("open"))closePurchase();
});