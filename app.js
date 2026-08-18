(() => {
  const BACKEND = "https://angkeasillearning-backend.onrender.com";

  const state = {
    courseId: "",
    courseName: "",
    price: "0.00",
    tranId: "",
    timer: null,
    seconds: 600
  };

  const $ = (id) => document.getElementById(id);
  const show = (id) => { $(id).classList.add("show"); $(id).setAttribute("aria-hidden","false"); };
  const hide = (id) => { $(id).classList.remove("show"); $(id).setAttribute("aria-hidden","true"); };

  document.querySelectorAll(".buy-btn, .enroll-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      state.courseId = btn.dataset.courseId || "chinese-basics";
      state.courseName = btn.dataset.courseName || btn.dataset.name || "វគ្គសិក្សា";
      state.price = Number(btn.dataset.price || 12).toFixed(2);

      $("orderCourseName").textContent = state.courseName;
      $("orderAmount").textContent = `$${state.price}`;
      $("orderPrice").textContent = `$${state.price}`;
      show("orderModal");
    });
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => hide(btn.dataset.close));
  });

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hide(modal.id);
    });
  });

  $("confirmOrderBtn").addEventListener("click", async () => {
    $("confirmOrderBtn").disabled = true;
    $("confirmOrderBtn").textContent = "កំពុងបង្កើត QR...";

    try {
      const res = await fetch(`${BACKEND}/api/payway/create-qr`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({courseId: state.courseId})
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Unable to create QR");

      state.tranId = data.tranId || "";
      $("tranId").textContent = state.tranId || "—";
      $("qrAmount").textContent = `$${state.price} USD`;

      const img = data.qrImage || data.qr_image || data.qr || "";
      if (!img) throw new Error("QR image missing");
      $("qrImage").src = img;

      $("paymentStatus").textContent = "";
      hide("orderModal");
      show("qrModal");
      startCountdown();
    } catch (err) {
      alert("មិនអាចបង្កើត QR បាន: " + err.message);
    } finally {
      $("confirmOrderBtn").disabled = false;
      $("confirmOrderBtn").textContent = "បញ្ជាក់ការបញ្ជាទិញ";
    }
  });

  function startCountdown() {
    clearInterval(state.timer);
    state.seconds = 600;
    paintCountdown();
    state.timer = setInterval(() => {
      state.seconds -= 1;
      paintCountdown();
      if (state.seconds <= 0) clearInterval(state.timer);
    }, 1000);
  }

  function paintCountdown() {
    const m = String(Math.floor(state.seconds / 60)).padStart(2,"0");
    const s = String(state.seconds % 60).padStart(2,"0");
    $("countdown").textContent = `${m}:${s}`;
  }

  $("checkPaymentBtn").addEventListener("click", async () => {
    if (!state.tranId) return;
    $("paymentStatus").textContent = "កំពុងពិនិត្យការទូទាត់...";

    try {
      const res = await fetch(`${BACKEND}/api/payway/check`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({tranId: state.tranId})
      });
      const data = await res.json();

      const info = data?.data?.data || data?.data || {};
      const status = String(info.payment_status || "").toUpperCase();

      if (status === "APPROVED" || info.payment_status_code === 0) {
        $("paymentStatus").textContent = "ការទូទាត់បានជោគជ័យ ✓";
      } else {
        $("paymentStatus").textContent = "ការទូទាត់មិនទាន់រួចរាល់";
      }
    } catch (err) {
      $("paymentStatus").textContent = "មិនអាចពិនិត្យការទូទាត់បាន";
    }
  });
})();