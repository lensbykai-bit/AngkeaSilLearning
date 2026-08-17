const translations = {
  km: {
    tagline: "ជំនាញអនុវត្ត។ លទ្ធផលពិតប្រាកដ។",
    navHome: "ទំព័រដើម",
    navCourses: "មេរៀន",
    navAbout: "អំពីយើង",
    navContact: "ទំនាក់ទំនង",
    getStarted: "ចាប់ផ្តើមរៀន",
    eyebrow: "✦ ជំនាញអនុវត្ត។ លទ្ធផលពិតប្រាកដ។",
    heroLine1: "រៀនជំនាញដែលអាចប្រើបាន",
    heroLine2: "ដើម្បីទទួលបានលទ្ធផលពិតប្រាកដ។",
    heroText: "ទទួលបានមេរៀនអនឡាញដែលអាចអនុវត្តបាន ការណែនាំប្រកបដោយបទពិសោធន៍ និងធនធានសិក្សា ដើម្បីជួយអ្នកអភិវឌ្ឍជំនាញ និងសម្រេចគោលដៅរបស់អ្នក។",
    exploreCourses: "ស្វែងរកមេរៀន",
    watchIntro: "មើលវីដេអូណែនាំ",
    videoCourses: "វគ្គសិក្សាវីដេអូ",
    videoCoursesText: "រៀនតាមល្បឿនផ្ទាល់ខ្លួន",
    ebooks: "E-books អាចទាញយកបាន",
    ebooksText: "សិក្សាបានគ្រប់ពេល គ្រប់ទីកន្លែង",
    certificates: "វិញ្ញាបនបត្រ",
    certificatesText: "បង្ហាញសមិទ្ធផលរបស់អ្នក",
    featuredLearning: "មេរៀនដែលបានជ្រើសរើស",
    popularCourses: "មេរៀនពេញនិយម",
    viewAll: "មើលមេរៀនទាំងអស់",
    beginner: "កម្រិតដំបូង",
    enrollNow: "ចុះឈ្មោះឥឡូវនេះ",
    why: "ហេតុអ្វីជ្រើស Angkea Sil Learning?",
    aboutTitle: "រៀនជំនាញដែលអ្នកអាចយកទៅប្រើបានពិតប្រាកដ។",
    aboutText: "Angkea Sil Learning ផ្តល់មេរៀនវីដេអូ ឯកសារសិក្សាដែលអាចទាញយក និងវគ្គជំនាញអនុវត្ត ដោយមានការរចនាសាមញ្ញ ទំនើប និងងាយស្រួលប្រើ។",
    responsive: "✓ អាចប្រើបានល្អលើទូរស័ព្ទ និងកុំព្យូទ័រ",
    pagesReady: "✓ ត្រៀមរួចសម្រាប់ GitHub Pages",
    easyEdit: "✓ ងាយស្រួលកែ HTML/CSS",
    footerTagline: "ជំនាញអនុវត្តសម្រាប់លទ្ធផលពិតប្រាកដ។",
    modalTitle: "សូមស្វាគមន៍មកកាន់ Angkea Sil Learning",
    modalText: "ប៊ូតុងនេះអាចភ្ជាប់ទៅវីដេអូណែនាំ YouTube ឬវីដេអូ Trailer របស់វគ្គសិក្សារបស់អ្នកបាន។",
    browseCourses: "មើលមេរៀន",
    enrollAlert: "សូមភ្ជាប់ប៊ូតុងនេះទៅទំព័រទូទាត់ ឬទំព័រវគ្គសិក្សារបស់អ្នក។"
  },
  en: {
    tagline: "Practical Skills. Real Results.",
    navHome: "Home",
    navCourses: "Courses",
    navAbout: "About",
    navContact: "Contact",
    getStarted: "Get Started",
    eyebrow: "✦ Practical Skills. Real Results.",
    heroLine1: "Learn Practical Skills",
    heroLine2: "for Real Results.",
    heroText: "Access practical online courses, expert guidance, and resources to help you grow your skills and achieve your goals.",
    exploreCourses: "Explore Courses",
    watchIntro: "Watch Intro",
    videoCourses: "Video Courses",
    videoCoursesText: "Learn at your own pace",
    ebooks: "Downloadable E-books",
    ebooksText: "Study anytime, anywhere",
    certificates: "Certificates",
    certificatesText: "Showcase your achievement",
    featuredLearning: "Featured Learning",
    popularCourses: "Popular Courses",
    viewAll: "View all courses",
    beginner: "Beginner",
    enrollNow: "Enroll Now",
    why: "Why Angkea Sil Learning?",
    aboutTitle: "Learn skills you can actually use.",
    aboutText: "Angkea Sil Learning offers video lessons, downloadable learning materials and practical skill courses in a clean, modern and easy-to-use experience.",
    responsive: "✓ Responsive design",
    pagesReady: "✓ GitHub Pages ready",
    easyEdit: "✓ Easy HTML/CSS editing",
    footerTagline: "Practical Skills for Real Results.",
    modalTitle: "Welcome to Angkea Sil Learning",
    modalText: "This button is ready to connect to your YouTube intro video or course trailer.",
    browseCourses: "Browse Courses",
    enrollAlert: "Connect this button to your checkout or course page."
  }
};

const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.main-nav');
const modal = document.getElementById('introModal');
let currentLanguage = localStorage.getItem('asl-language') || 'km';

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('asl-language', lang);

  document.documentElement.lang = lang === 'km' ? 'km' : 'en';
  document.body.classList.toggle('lang-km', lang === 'km');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.main-nav a').forEach((a) => {
  a.addEventListener('click', () => nav.classList.remove('open'));
});

document.getElementById('watchIntro')?.addEventListener('click', () => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
});

document.querySelector('.close-modal')?.addEventListener('click', () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
});

modal?.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
});

document.querySelectorAll('.course-card button').forEach((btn) => {
  btn.addEventListener('click', () => alert(translations[currentLanguage].enrollAlert));
});

setLanguage(currentLanguage);
