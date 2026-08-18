
(() => {
  const BACKEND = "https://angkeasillearning-backend.onrender.com";

  const state = {
    courseId: "",
    courseName: "",
    price: 0,
    tranId: "",
    timer: null,
    seconds: 600
  };

  const $ = (id) => document.getElementById(id);
  const fmtUsd = (v) => `$${Number(v).toFixed(2)}`;
  const todayKh = () => {
    const d = new Date();
    return d.toLocaleString("en-GB", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  };

  function openModal(id){
    $(id).classList.add("show");
    $(id).setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(id){
    $(id).classList.remove("show");
    $(id).setAttribute("aria-hidden", "true");
    if (![...document.querySelectorAll(".modal-overlay.show")].length) {
      document.body.style.overflow = "";
    }
  }

  document.querySelectorAll(".buy-now-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.courseId = btn.dataset.courseId || "chinese-basics";
      state.courseName = btn.dataset.courseName || "វគ្គសិក្សា";
      state.price = Number(btn.dataset.price || 12);

      $("step1CourseName").textContent = state.courseName;
      $("step1Amount").textContent = fmtUsd(state.price);
      $("step1Price").textContent = fmtUsd(state.price);
      $("step1Date").textContent = todayKh();
      openModal("checkoutStep1");
    });
  });

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.show").forEach(m => closeModal(m.id));
    }
  });

  $("continueToStep2").addEventListener("click", async () => {
    const btn = $("continueToStep2");
    btn.disabled = true;
    btn.textContent = "កំពុងបង្កើត QR...";

    try {
      const res = await fetch(`${BACKEND}/api/payway/create-qr`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ courseId: state.courseId })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Cannot create QR");
      }

      state.tranId = data.tranId || "";
      $("tranId").textContent = state.tranId || "—";
      $("qrCourseName").textContent = state.courseName;
      $("step2Amount").innerHTML = `${fmtUsd(state.price)} <small>USD</small>`;
      $("statusMessage").textContent = "";

      const qrSrc = data.qrImage || data.qr_image || data.qr || "";
      if (!qrSrc) throw new Error("QR image missing");
      $("qrImage").src = qrSrc;

      closeModal("checkoutStep1");
      openModal("checkoutStep2");
      startTimer();
    } catch (err) {
      alert("មិនអាចបង្កើត QR បានទេ៖ " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "ការបញ្ជាទិញ";
    }
  });

  function startTimer() {
    clearInterval(state.timer);
    state.seconds = 600;
    renderTimer();
    state.timer = setInterval(() => {
      state.seconds -= 1;
      renderTimer();
      if (state.seconds <= 0) {
        clearInterval(state.timer);
        $("statusMessage").textContent = "QR ផុតកំណត់។ សូមបង្កើតម្តងទៀត។";
      }
    }, 1000);
  }

  function renderTimer() {
    const min = String(Math.floor(state.seconds / 60)).padStart(2, "0");
    const sec = String(state.seconds % 60).padStart(2, "0");
    $("countdown").textContent = `${min}:${sec}`;
  }

  $("checkPaymentBtn").addEventListener("click", async () => {
    if (!state.tranId) return;
    const btn = $("checkPaymentBtn");
    btn.disabled = true;
    btn.textContent = "កំពុងពិនិត្យ...";

    try {
      const res = await fetch(`${BACKEND}/api/payway/check`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ tranId: state.tranId })
      });
      const data = await res.json();

      const info = data?.data?.data || data?.data || {};
      const paymentStatus = String(info.payment_status || "").toUpperCase();
      const statusCode = Number(info.payment_status_code);

      if (paymentStatus === "APPROVED" || statusCode === 0 || paymentStatus === "SUCCESS") {
        $("statusMessage").textContent = "ការទូទាត់បានជោគជ័យ ✓";
        $("statusMessage").style.color = "#17a34a";
        clearInterval(state.timer);
      } else if (paymentStatus === "PENDING" || statusCode === 2) {
        $("statusMessage").textContent = "ការទូទាត់មិនទាន់រួចរាល់ទេ";
        $("statusMessage").style.color = "#7a5b00";
      } else {
        $("statusMessage").textContent = "ស្ថានភាព៖ " + (paymentStatus || "មិនស្គាល់");
        $("statusMessage").style.color = "#c33";
      }
    } catch (err) {
      $("statusMessage").textContent = "មិនអាចពិនិត្យការទូទាត់បាន";
      $("statusMessage").style.color = "#c33";
    } finally {
      btn.disabled = false;
      btn.textContent = "ពិនិត្យការទូទាត់";
    }
  });

  // theme toggle
  const toggle = $("themeToggle");
  const savedTheme = localStorage.getItem("asl-theme");
  if (savedTheme === "light") document.body.classList.add("light");
  updateToggle();

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("asl-theme", document.body.classList.contains("light") ? "light" : "dark");
    updateToggle();
  });

  function updateToggle() {
    toggle.textContent = document.body.classList.contains("light") ? "☀" : "☾";
  }
})();
