const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.main-nav');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const modal = document.getElementById('introModal');
document.getElementById('watchIntro')?.addEventListener('click', () => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
});
document.querySelector('.close-modal')?.addEventListener('click', () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
});
modal?.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }
});
document.querySelectorAll('.course-card button').forEach(btn => {
  btn.addEventListener('click', () => alert('Connect this button to your checkout or course page.'));
});
