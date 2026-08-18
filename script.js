const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const body=document.body, toast=$('#toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2200)}
const menu=$('#menuToggle'), nav=$('#navMenu'); menu?.addEventListener('click',()=>nav?.classList.toggle('open')); $$('nav a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('open')));
function openModal(id){const el=document.getElementById(id);if(!el)return;el.classList.add('open');body.classList.add('modal-open')}
function closeModal(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('open');if(!$('.modal.open,.purchase-modal.open'))body.classList.remove('modal-open')}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close))); $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));

// ============================================================
// Shopping cart
// ============================================================
const CART_CATALOG = {
  "chinese-basics": {
    name: "មូលដ្ឋានភាសាចិន",
    price: 12,
    image: "assets/course-chinese-v12.svg"
  },
  "excel-business": {
    name: "Excel សម្រាប់អាជីវកម្ម",
    price: 10,
    image: "assets/course-excel-v12.svg"
  },
  "website-basics": {
    name: "បង្កើតគេហទំព័រ HTML, CSS & JS",
    price: 15,
    image: "assets/course-web-v12.svg"
  }
};

function getCart() {
  try {
    const value = JSON.parse(localStorage.getItem("asl-cart") || "[]");
    return Array.isArray(value) ? [...new Set(value.filter(id => CART_CATALOG[id]))] : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  const clean = [...new Set(items.filter(id => CART_CATALOG[id]))];
  localStorage.setItem("asl-cart", JSON.stringify(clean));
  updateCartUI();
}

function addToCart(id) {
  if (!CART_CATALOG[id]) return;
  const items = getCart();
  if (!items.includes(id)) {
    items.push(id);
    saveCart(items);
    showToast("បានបន្ថែមមេរៀនទៅកន្ត្រក ✓");
  } else {
    showToast("មេរៀននេះមានក្នុងកន្ត្រករួចហើយ។");
  }
}

function removeFromCart(id) {
  saveCart(getCart().filter(x => x !== id));
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function updateCartUI() {
  const items = getCart();
  const countBadge = $("#cartBtn b");
  const list = $("#cartList");
  const itemCount = $("#cartItemCount");
  const totalEl = $("#cartTotal");
  const checkoutBtn = $("#cartCheckoutBtn");

  if (countBadge) countBadge.textContent = String(items.length);
  if (itemCount) itemCount.textContent = String(items.length);

  const total = items.reduce((sum, id) => sum + CART_CATALOG[id].price, 0);
  if (totalEl) totalEl.textContent = formatMoney(total);

  if (checkoutBtn) {
    checkoutBtn.disabled = items.length === 0;
    checkoutBtn.textContent = items.length > 1
      ? `ចាប់ផ្តើមទូទាត់ (${items.length} វគ្គ)`
      : "ចាប់ផ្តើមទូទាត់";
  }

  if (!list) return;

  if (!items.length) {
    list.innerHTML = `
      <div class="cart-empty">
        <div>🛒</div>
        <strong>កន្ត្រករបស់អ្នកនៅទទេ</strong>
        <small>ចុច «＋ កន្ត្រក» លើមេរៀនដែលអ្នកចង់ទិញ។</small>
      </div>`;
    return;
  }

  list.innerHTML = items.map(id => {
    const item = CART_CATALOG[id];
    return `
      <article class="cart-row" data-cart-id="${id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-row-copy">
          <small>វគ្គសិក្សា</small>
          <strong>${item.name}</strong>
          <button class="cart-pay-one" type="button" data-pay-course="${id}">ទូទាត់វគ្គនេះ</button>
        </div>
        <div class="cart-row-side">
          <b>${formatMoney(item.price)}</b>
          <button class="cart-remove" type="button" data-remove-course="${id}" aria-label="លុប">×</button>
        </div>
      </article>`;
  }).join("");
}

$("#cartBtn")?.addEventListener("click", () => {
  updateCartUI();
  openModal("cartModal");
});

document.addEventListener("click", (e) => {
  const add = e.target.closest(".add-cart-btn");
  if (add) {
    e.preventDefault();
    addToCart(add.dataset.courseId);
    return;
  }

  const remove = e.target.closest("[data-remove-course]");
  if (remove) {
    e.preventDefault();
    removeFromCart(remove.dataset.removeCourse);
    return;
  }

  const payOne = e.target.closest("[data-pay-course]");
  if (payOne) {
    e.preventDefault();
    closeModal("cartModal");
    openPurchase(payOne.dataset.payCourse);
  }
});

$("#cartCheckoutBtn")?.addEventListener("click", () => {
  const items = getCart();
  if (!items.length) return;
  // PayWay integration currently creates one KHQR transaction per course.
  closeModal("cartModal");
  openPurchase(items[0]);
});

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.type !== "asl-payment-approved") return;

  const paidId = event.data.courseId;
  if (paidId) removeFromCart(paidId);

  const remaining = getCart();
  if (!remaining.length) {
    showToast("ការទូទាត់បានជោគជ័យ និងកន្ត្រកបានសម្អាត ✓");
  } else {
    showToast(`ទូទាត់បានជោគជ័យ។ នៅសល់ ${remaining.length} វគ្គក្នុងកន្ត្រក។`);
  }
});

updateCartUI();

$('#watchIntro')?.addEventListener('click',()=>openModal('introModal')); $$('.login-open').forEach(b=>b.addEventListener('click',()=>openModal('authModal'))); $('#searchBtn')?.addEventListener('click',()=>{openModal('searchModal');setTimeout(()=>$('#courseSearch')?.focus(),80)}); 
// Premium navigation popups
$("#popularCoursesBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  nav?.classList.remove("open");
  openModal("popularCoursesModal");
});

$("#ebooksBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  nav?.classList.remove("open");
  openModal("ebooksModal");
});

$$("[data-close-link]").forEach((link) => {
  link.addEventListener("click", () => closeModal(link.dataset.closeLink));
});

$$('.free-btn').forEach(b=>b.addEventListener('click',()=>showToast('មេរៀនឥតគិតថ្លៃនឹងបើកនៅ Version បន្ទាប់។')));
const courses=[{name:'មូលដ្ឋានភាសាចិន',price:'$12.00',id:'chinese-basics'},{name:'Excel សម្រាប់អាជីវកម្ម',price:'$10.00',id:'excel-business'},{name:'បង្កើតគេហទំព័រ HTML, CSS & JS',price:'$15.00',id:'website-basics'}];
const search=$('#courseSearch'), results=$('#searchResults'); function renderSearch(q=''){if(!results)return;const k=q.trim().toLowerCase();const rows=courses.filter(c=>!k||c.name.toLowerCase().includes(k));results.innerHTML=rows.map(c=>`<a class="search-buy" href="payment.html?courseId=${c.id}"><span>${c.name}</span><b>${c.price}</b></a>`).join('')||'<div style="padding:10px;color:#748196">រកមិនឃើញវគ្គសិក្សា</div>'} search?.addEventListener('input',e=>renderSearch(e.target.value)); $('#searchBtn')?.addEventListener('click',()=>renderSearch());
const tabs=$$('.auth-tab'), forms=$$('.auth-form'); tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.toggle('active',x===t));forms.forEach(f=>f.classList.toggle('active',f.dataset.panel===t.dataset.tab))})); forms.forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();showToast('ប្រព័ន្ធគណនីពិតនឹងភ្ជាប់នៅ Version បន្ទាប់។')}));
const purchase=$('#purchaseModal'), frame=$('#purchaseFrame'); function openPurchase(id){if(!purchase||!frame)return;frame.src=`payment.html?courseId=${encodeURIComponent(id)}&embed=1`;purchase.classList.add('open');body.classList.add('modal-open')} function closePurchase(){purchase?.classList.remove('open');body.classList.remove('modal-open');setTimeout(()=>{if(frame&&!purchase?.classList.contains('open'))frame.src='about:blank'},180)} $('#purchaseClose')?.addEventListener('click',closePurchase); purchase?.addEventListener('click',e=>{if(e.target===purchase)closePurchase()});
document.addEventListener('click',e=>{const a=e.target.closest('.enroll-btn,.search-buy');if(!a)return;const u=new URL(a.href,location.href);const id=u.searchParams.get('courseId');if(id){e.preventDefault();closeModal('searchModal');openPurchase(id)}}); document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;$$('.modal.open').forEach(m=>closeModal(m.id));if(purchase?.classList.contains('open'))closePurchase()});

// ============================================================
// v1.7 — Popular lessons auto marquee
// ============================================================
(function initPopularMarquee(){
  const viewport = document.getElementById("popularMarquee");
  const track = document.getElementById("popularTrack");
  const prev = document.getElementById("popularPrev");
  const next = document.getElementById("popularNext");

  if (!viewport || !track) return;

  const originals = [...track.children];
  if (!originals.length) return;

  // Duplicate once for seamless looping.
  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.dataset.marqueeClone = "true";
    clone.removeAttribute("id");
    track.appendChild(clone);
  });

  let paused = false;
  let dragging = false;
  let lastX = 0;
  let resumeTimer = null;
  let lastFrame = performance.now();

  function loopWidth(){
    // Width occupied by one full original set.
    let width = 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    originals.forEach((el, index) => {
      width += el.getBoundingClientRect().width;
      if (index < originals.length) width += gap;
    });
    return width;
  }

  function normalizeScroll(){
    const half = loopWidth();
    if (!half) return;
    if (viewport.scrollLeft >= half) viewport.scrollLeft -= half;
    if (viewport.scrollLeft < 0) viewport.scrollLeft += half;
  }

  function frame(now){
    const dt = Math.min(40, now - lastFrame);
    lastFrame = now;

    if (!paused && !dragging && !document.hidden) {
      // Right-to-left visual movement: scroll content toward the left.
      viewport.scrollLeft += dt * 0.028;
      normalizeScroll();
    }
    requestAnimationFrame(frame);
  }

  function pause(){
    paused = true;
    clearTimeout(resumeTimer);
  }

  function resume(delay=900){
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => paused = false, delay);
  }

  viewport.addEventListener("mouseenter", pause);
  viewport.addEventListener("mouseleave", () => resume(500));
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("focusout", () => resume(700));
  viewport.addEventListener("touchstart", pause, {passive:true});
  viewport.addEventListener("touchend", () => resume(1200), {passive:true});

  viewport.addEventListener("pointerdown", (e) => {
    dragging = true;
    paused = true;
    lastX = e.clientX;
    viewport.setPointerCapture?.(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    viewport.scrollLeft -= dx;
    normalizeScroll();
  });

  function endDrag(){
    if (!dragging) return;
    dragging = false;
    resume(1100);
  }
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  prev?.addEventListener("click", () => {
    pause();
    viewport.scrollBy({left:-Math.min(330, viewport.clientWidth * .72), behavior:"smooth"});
    setTimeout(normalizeScroll, 450);
    resume(1600);
  });

  next?.addEventListener("click", () => {
    pause();
    viewport.scrollBy({left:Math.min(330, viewport.clientWidth * .72), behavior:"smooth"});
    setTimeout(normalizeScroll, 450);
    resume(1600);
  });

  window.addEventListener("resize", normalizeScroll);
  requestAnimationFrame(frame);
})();
