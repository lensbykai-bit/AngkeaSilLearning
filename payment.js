const API_BASE = String(window.ASL_PAYWAY_API || "").replace(/\/+$/, "");
const params = new URLSearchParams(window.location.search);
const EMBED_MODE = params.get("embed") === "1";
if (EMBED_MODE) {
  document.body.classList.add("embed-mode");
}

const LEGACY_COURSE_MAP = {
  "មូលដ្ឋានភាសាចិន": "chinese-basics",
  "Chinese Language Basics": "chinese-basics",
  "ជំនាញតារាងទិន្នន័យសម្រាប់អាជីវកម្ម": "excel-business",
  "Excel for Business": "excel-business",
  "បង្កើតគេហទំព័រ": "website-basics",
  "Build a Website": "website-basics",
  "Build a Website with HTML, CSS & JS": "website-basics"
};

function resolveCourseId() {
  const direct = (params.get("courseId") || "").trim();
  if (direct) return direct;

  const oldCourse = (params.get("course") || "").trim();
  if (oldCourse && LEGACY_COURSE_MAP[oldCourse]) {
    return LEGACY_COURSE_MAP[oldCourse];
  }

  const oldPrice = Number(params.get("price") || 0);
  if (oldPrice === 12) return "chinese-basics";
  if (oldPrice === 10) return "excel-business";
  if (oldPrice === 15) return "website-basics";

  return "";
}

const courseId = resolveCourseId();

const el = {
  courseName: document.getElementById("courseName"),
  coursePrice: document.getElementById("coursePrice"),
  totalPrice: document.getElementById("totalPrice"),
  payAmount: document.getElementById("payAmount"),
  paymentQr: document.getElementById("paymentQr"),
  qrLoading: document.getElementById("qrLoading"),
  qrError: document.getElementById("qrError"),
  qrErrorText: document.getElementById("qrErrorText"),
  retryQr: document.getElementById("retryQr"),
  regenerateQr: document.getElementById("regenerateQr"),
  tranId: document.getElementById("tranId"),
  countdown: document.getElementById("countdown"),
  paymentStatus: document.getElementById("paymentStatus"),
  checkPayment: document.getElementById("checkPayment"),
  notice: document.getElementById("notice"),
  successModal: document.getElementById("successModal"),
  successText: document.getElementById("successText")
};

let activeTranId = "";
let pollTimer = null;
let countdownTimer = null;
let expiresAt = 0;
let checking = false;
let paymentCompleted = false;

const khDigits = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];

function khNumber(value) {
  return String(value).replace(/\d/g, d => khDigits[Number(d)]);
}

function money(amount, currency) {
  const n = Number(amount || 0);
  if (currency === "KHR") return `${Math.round(n).toLocaleString()} រៀល`;
  return `$${n.toFixed(2)}`;
}

function setStatus(text, type = "") {
  if (!el.paymentStatus) return;

  el.paymentStatus.textContent = text;
  el.paymentStatus.classList.remove(
    "payment-status-pending",
    "payment-status-success",
    "payment-status-error"
  );

  if (type) el.paymentStatus.classList.add(`payment-status-${type}`);
}

function setLoading(loading) {
  if (el.qrLoading) el.qrLoading.hidden = !loading;

  if (loading) {
    if (el.paymentQr) el.paymentQr.hidden = true;
    if (el.qrError) el.qrError.hidden = true;
  }
}

function stopTimers() {
  if (pollTimer) clearInterval(pollTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  pollTimer = null;
  countdownTimer = null;
}

function showError(message, allowRegenerate = true) {
  setLoading(false);

  if (el.paymentQr) el.paymentQr.hidden = true;
  if (el.qrError) el.qrError.hidden = false;
  if (el.qrErrorText) el.qrErrorText.textContent = message || "សូមព្យាយាមម្តងទៀត។";
  if (el.checkPayment) el.checkPayment.disabled = true;
  if (el.retryQr) el.retryQr.hidden = !allowRegenerate;
  if (el.regenerateQr) el.regenerateQr.hidden = !allowRegenerate;

  setStatus("មានបញ្ហាក្នុងការបង្កើតកូដ", "error");
}

function startCountdown(seconds) {
  expiresAt = Date.now() + seconds * 1000;

  const tick = () => {
    const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const mm = Math.floor(left / 60);
    const ss = left % 60;

    if (el.countdown) {
      el.countdown.textContent =
        `${khNumber(String(mm).padStart(2, "0"))}:${khNumber(String(ss).padStart(2, "0"))}`;
    }

    if (left <= 0 && !paymentCompleted) {
      stopTimers();
      activeTranId = "";

      if (el.paymentQr) el.paymentQr.style.opacity = ".35";
      if (el.checkPayment) el.checkPayment.disabled = true;
      if (el.regenerateQr) el.regenerateQr.hidden = false;

      setStatus("កូដបានផុតសុពលភាព", "error");

      if (el.notice) {
        el.notice.textContent =
          "កូដនេះលែងអាចប្រើបាន។ សូមចុច «បង្កើតកូដថ្មី» ដើម្បីបន្ត។";
      }
    }
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}

function extractPaymentData(result) {
  return result?.data?.data || result?.data || {};
}

function paymentState(result) {
  const data = extractPaymentData(result);
  const code = Number(data.payment_status_code);
  const status = String(data.payment_status || "").toUpperCase();

  if (code === 0 || status === "APPROVED") return "approved";
  if (code === 2 || status === "PENDING") return "pending";
  return "other";
}


function unlockPurchasedCourse(id) {
  if (!id) return;
  try {
    const current = JSON.parse(localStorage.getItem("asl-owned-courses") || "[]");
    const list = Array.isArray(current) ? current : [];
    if (!list.includes(id)) list.push(id);
    localStorage.setItem("asl-owned-courses", JSON.stringify(list));
  } catch (error) {
    console.warn("Unable to save purchased course locally:", error);
  }
}

async function checkPayment({ manual = false } = {}) {
  if (!activeTranId || checking || !API_BASE || paymentCompleted) return false;

  checking = true;

  const previousButtonText = el.checkPayment?.textContent || "ពិនិត្យការទូទាត់";

  if (manual && el.checkPayment) {
    el.checkPayment.disabled = true;
    el.checkPayment.textContent = "កំពុងពិនិត្យ...";
  }

  try {
    const response = await fetch(`${API_BASE}/api/payway/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tranId: activeTranId })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "មិនអាចពិនិត្យស្ថានភាពបាន។");
    }

    const state = paymentState(result);

    if (state === "approved") {
      unlockPurchasedCourse(courseId);
      paymentCompleted = true;
      stopTimers();

      setStatus("ការទូទាត់បានជោគជ័យ", "success");

      if (el.notice) {
        el.notice.textContent = "ប្រព័ន្ធបានបញ្ជាក់ថាប្រតិបត្តិការនេះ APPROVED។";
      }

      if (el.checkPayment) el.checkPayment.disabled = true;
      if (el.regenerateQr) el.regenerateQr.hidden = true;

      if (el.successModal) {
        el.successModal.classList.add("open");
        el.successModal.setAttribute("aria-hidden", "false");
      }

      return true;
    }

    if (state === "pending") {
      setStatus("កំពុងរង់ចាំការទូទាត់…", "pending");

      if (el.notice) {
        el.notice.textContent =
          "មិនទាន់មានការទូទាត់ទេ។ បន្ទាប់ពីស្កេន និងបង់រួច ប្រព័ន្ធនឹងពិនិត្យម្តងទៀតដោយស្វ័យប្រវត្តិ។";
      }

      return false;
    }

    setStatus("ការទូទាត់មិនទាន់បានបញ្ជាក់", "error");

    if (el.notice) {
      el.notice.textContent =
        "ប្រតិបត្តិការនេះមិនទាន់មានស្ថានភាព APPROVED ទេ។ សូមពិនិត្យម្តងទៀត ឬបង្កើតកូដថ្មី។";
    }

    return false;

  } catch (err) {
    console.error("PayWay check error:", err);

    setStatus("មិនអាចពិនិត្យស្ថានភាពបាន", "error");

    if (el.notice) {
      el.notice.textContent =
        "សូមពិនិត្យការតភ្ជាប់ Backend ហើយសាកម្តងទៀត។";
    }

    return false;

  } finally {
    checking = false;

    if (manual && el.checkPayment && !paymentCompleted && activeTranId) {
      el.checkPayment.disabled = false;
      el.checkPayment.textContent = previousButtonText;
    }
  }
}


/*
 * PayWay template3 includes an ABA PAY brand area around the KHQR ticket.
 * For the compact popup we display only the KHQR ticket itself.
 * This changes presentation only; the QR data is untouched.
 */
async function khqrTicketOnly(dataUrl) {
  if (!dataUrl) return dataUrl;

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        const w = image.naturalWidth;
        const h = image.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, w, h).data;

        // Find the red KHQR header. It is the most reliable landmark in template3_color.
        let minX = w, maxX = -1, minY = h, maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
            if (a > 180 && r > 165 && g < 105 && b < 105 && r > g * 1.55) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          resolve(dataUrl);
          return;
        }

        const headerWidth = maxX - minX + 1;
        const x1 = Math.max(0, minX - Math.round(headerWidth * 0.02));
        const x2 = Math.min(w - 1, maxX + Math.round(headerWidth * 0.02));

        // Follow the white ticket downward until its white background ends.
        let bottom = Math.min(h - 1, maxY + Math.round(headerWidth * 2.4));
        let lastGood = maxY;
        for (let y = maxY; y < h; y++) {
          let light = 0;
          let total = 0;
          for (let x = x1; x <= x2; x += 2) {
            const i = (y * w + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            total++;
            if (r > 205 && g > 205 && b > 205) light++;
          }
          if (total && light / total > 0.18) lastGood = y;
          if (y > maxY + headerWidth * 1.0 && y - lastGood > Math.max(10, headerWidth * 0.12)) break;
        }
        bottom = Math.min(h - 1, lastGood + Math.round(headerWidth * 0.04));

        const cropW = x2 - x1 + 1;
        const cropH = bottom - minY + 1;
        if (cropW < 80 || cropH < 120) {
          resolve(dataUrl);
          return;
        }

        const out = document.createElement("canvas");
        out.width = cropW;
        out.height = cropH;
        out.getContext("2d").drawImage(canvas, x1, minY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(out.toDataURL("image/png"));
      } catch (error) {
        console.warn("KHQR crop fallback:", error);
        resolve(dataUrl);
      }
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function createQr() {
  stopTimers();
  activeTranId = "";
  paymentCompleted = false;

  if (el.checkPayment) {
    el.checkPayment.disabled = true;
    el.checkPayment.textContent = "ពិនិត្យការទូទាត់";
  }

  if (el.regenerateQr) el.regenerateQr.hidden = true;
  if (el.retryQr) el.retryQr.hidden = true;
  if (el.tranId) el.tranId.textContent = "—";
  if (el.paymentQr) el.paymentQr.style.opacity = "1";

  setLoading(true);
  setStatus("កំពុងបង្កើតកូដទូទាត់...");

  if (!courseId) {
    showError(
      "រកមិនឃើញវគ្គសិក្សាដែលបានជ្រើស។ សូមត្រឡប់ទៅទំព័រមេរៀន ហើយជ្រើសវគ្គម្តងទៀត។",
      false
    );
    return;
  }

  if (
    !API_BASE ||
    API_BASE.includes("REPLACE-WITH-YOUR-BACKEND") ||
    API_BASE.includes("YOUR-BACKEND-DOMAIN")
  ) {
    showError(
      "ប្រព័ន្ធទូទាត់ KHQR មិនទាន់បានកំណត់សម្រាប់ Website Online ទេ។",
      false
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/payway/create-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "មិនអាចបង្កើតកូដ KHQR បាន។");
    }

    activeTranId = result.tranId;

    if (el.courseName) el.courseName.textContent = result.course.name;

    const formattedAmount = money(result.course.price, result.course.currency);

    if (el.coursePrice) el.coursePrice.textContent = formattedAmount;
    if (el.totalPrice) el.totalPrice.textContent = formattedAmount;
    if (el.payAmount) el.payAmount.textContent = formattedAmount;
    if (el.tranId) el.tranId.textContent = result.tranId;

    if (!result.qrImage) {
      throw new Error("ប្រព័ន្ធមិនបានផ្ញើរូប QR មកវិញ។");
    }

    if (el.paymentQr) {
      el.paymentQr.src = await khqrTicketOnly(result.qrImage);
      el.paymentQr.hidden = false;
    }

    setLoading(false);

    setStatus("សូមស្កេនកូដ និងបញ្ជាក់ការទូទាត់");

    if (el.notice) {
      el.notice.textContent =
        "ក្រោយបង់រួច ប្រព័ន្ធនឹងពិនិត្យស្ថានភាពការទូទាត់ដោយស្វ័យប្រវត្តិ។";
    }

    if (el.checkPayment) el.checkPayment.disabled = false;

    const lifetimeSeconds = Number(result.lifetimeSeconds || 360);
    startCountdown(lifetimeSeconds);

    // Check every 5 seconds while the QR is active.
    pollTimer = setInterval(() => checkPayment({ manual: false }), 5000);

  } catch (err) {
    console.error("PayWay create QR error:", err);
    showError(err.message || "មានបញ្ហាក្នុងការតភ្ជាប់ទៅប្រព័ន្ធ KHQR។");
  }
}

el.retryQr?.addEventListener("click", createQr);
el.regenerateQr?.addEventListener("click", createQr);
el.checkPayment?.addEventListener("click", () => checkPayment({ manual: true }));

/* ពន្លឺ / ងងឹត */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  localStorage.setItem("asl-theme", theme);
}

applyTheme(localStorage.getItem("asl-theme") || "light");

themeToggle?.addEventListener("click", () => {
  applyTheme(
    document.body.classList.contains("dark-mode") ? "light" : "dark"
  );
});

createQr();
