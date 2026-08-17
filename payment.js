const translations = {
  km: {
    back: "ត្រឡប់ទៅមេរៀន",
    secureCheckout: "ការទូទាត់ដែលមានសុវត្ថិភាព",
    checkoutTitle: "ទូទាត់សម្រាប់វគ្គសិក្សា",
    checkoutText: "ពិនិត្យព័ត៌មានរបស់អ្នក និងជ្រើសរើសវិធីទូទាត់។",
    orderSummary: "សេចក្តីសង្ខេបការបញ្ជាទិញ",
    courseLabel: "វគ្គសិក្សា",
    priceLabel: "តម្លៃ",
    totalLabel: "សរុប",
    paymentMethod: "វិធីទូទាត់",
    cardMethod: "កាត",
    bankMethod: "ធនាគារ",
    qrMethod: "QR",
    cardholder: "ឈ្មោះលើកាត",
    cardNumber: "លេខកាត",
    expiry: "ថ្ងៃផុតកំណត់",
    payNow: "ទូទាត់ឥឡូវនេះ",
    bankTitle: "ការផ្ទេរតាមធនាគារ",
    bankText: "បញ្ចូលព័ត៌មានគណនីធនាគាររបស់អ្នកនៅទីនេះ ឬភ្ជាប់ទៅ Payment Gateway របស់អ្នក។",
    qrTitle: "ស្កេន QR ដើម្បីទូទាត់",
    qrText: "ជំនួស QR គំរូនេះដោយ QR ទូទាត់ពិតរបស់អ្នក។",
    demoNote: "ទំព័រនេះជាគំរូ UI។ ដើម្បីទទួលប្រាក់ពិត ត្រូវភ្ជាប់ទៅ Payment Gateway ឬប្រព័ន្ធទូទាត់របស់អ្នក។",
    demoSuccess: "ការទូទាត់គំរូបានបញ្ចប់",
    demoSuccessText: "នេះជាគំរូប៉ុណ្ណោះ។ មិនមានប្រាក់ត្រូវបានកាត់ទេ។",
    done: "រួចរាល់"
  },
  en: {
    back: "Back to courses",
    secureCheckout: "Secure checkout",
    checkoutTitle: "Course Payment",
    checkoutText: "Review your order and choose a payment method.",
    orderSummary: "Order Summary",
    courseLabel: "Course",
    priceLabel: "Price",
    totalLabel: "Total",
    paymentMethod: "Payment Method",
    cardMethod: "Card",
    bankMethod: "Bank",
    qrMethod: "QR",
    cardholder: "Cardholder name",
    cardNumber: "Card number",
    expiry: "Expiry date",
    payNow: "Pay Now",
    bankTitle: "Bank Transfer",
    bankText: "Add your bank account details here, or connect this page to your payment gateway.",
    qrTitle: "Scan QR to Pay",
    qrText: "Replace this demo QR with your real payment QR.",
    demoNote: "This is a front-end payment UI demo. To accept real payments, connect it to a payment gateway or your payment system.",
    demoSuccess: "Demo Payment Complete",
    demoSuccessText: "This is only a demo. No money was charged.",
    done: "Done"
  }
};

const params = new URLSearchParams(window.location.search);
const course = params.get("course") || "Course";
const price = Number(params.get("price") || "0").toFixed(2);
let currentLanguage = params.get("lang") || localStorage.getItem("asl-language") || "km";

document.getElementById("courseName").textContent = course;
document.getElementById("coursePrice").textContent = `$${price}`;
document.getElementById("totalPrice").textContent = `$${price}`;
document.getElementById("payAmount").textContent = `$${price}`;

function setLanguage(lang){
  currentLanguage = lang;
  localStorage.setItem("asl-language", lang);
  document.documentElement.lang = lang === "km" ? "km" : "en";
  document.body.classList.toggle("lang-km", lang === "km");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
});

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme){
  document.body.classList.toggle("dark-mode", theme === "dark");
  localStorage.setItem("asl-theme", theme);
}

applyTheme(localStorage.getItem("asl-theme") || "light");

themeToggle?.addEventListener("click", () => {
  applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

document.querySelectorAll(".method-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".method-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".method-panel").forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.querySelector(`[data-panel="${tab.dataset.method}"]`)?.classList.add("active");
  });
});

const successModal = document.getElementById("successModal");

document.getElementById("cardForm")?.addEventListener("submit", event => {
  event.preventDefault();
  successModal.classList.add("open");
  successModal.setAttribute("aria-hidden","false");
});

document.getElementById("closeSuccess")?.addEventListener("click", () => {
  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden","true");
});

setLanguage(currentLanguage);
