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

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    if (![...document.querySelectorAll(".modal-overlay.show")].length) {
      document.body.style.overflow = "";
    }
  }

  function getDateTime() {
    return new Date().toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  document.querySelectorAll(".buy-now-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.courseId = btn.dataset.courseId || "chinese-basics";
      state.courseName = btn.dataset.courseName || "Course";
      state.price = Number(btn.dataset.price || 12);

      $("step1CourseName").textContent = state.courseName;
      $("step1Amount").textContent = fmtUsd(state.price);
      $("step1Price").textContent = fmtUsd(state.price);
      $("step1Date").textContent = getDateTime();
      openModal("checkoutStep1");
    });
  });

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-overlay.show").forEach((modal) => closeModal(modal.id));
    }
  });

  const mobileMenuBtn = $("mobileMenuBtn");
  const mainNav = $("mainNav");
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener("click", () => {
      const open = mainNav.classList.toggle("open");
      mobileMenuBtn.setAttribute("aria-expanded", String(open));
      mobileMenuBtn.textContent = open ? "×" : "☰";
    });
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.textContent = "☰";
      });
    });
  }

  const watchIntroBtn = $("watchIntroBtn");
  if (watchIntroBtn) {
    watchIntroBtn.addEventListener("click", () => {
      document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  const continueBtn = $("continueToStep2");
  if (continueBtn) {
    continueBtn.addEventListener("click", async () => {
      continueBtn.disabled = true;
      continueBtn.textContent = "Creating QR...";

      try {
        const response = await fetch(`${BACKEND}/api/payway/create-qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: state.courseId })
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Could not create the payment QR.");
        }

        state.tranId = data.tranId || "";
        $("tranId").textContent = state.tranId || "—";
        $("qrCourseName").textContent = state.courseName;
        $("step2Amount").innerHTML = `${fmtUsd(state.price)} <small>USD</small>`;

        const qrSrc = data.qrImage || data.qr_image || data.qr || "";
        if (!qrSrc) throw new Error("The QR image was not returned by the server.");

        $("qrImage").src = qrSrc;
        $("statusMessage").textContent = "";
        closeModal("checkoutStep1");
        openModal("checkoutStep2");
        startTimer();
      } catch (error) {
        alert(`Unable to create QR: ${error.message}`);
      } finally {
        continueBtn.disabled = false;
        continueBtn.textContent = "Place Order";
      }
    });
  }

  function startTimer() {
    clearInterval(state.timer);
    state.seconds = 600;
    renderTimer();
    state.timer = setInterval(() => {
      state.seconds -= 1;
      renderTimer();
      if (state.seconds <= 0) {
        clearInterval(state.timer);
        const status = $("statusMessage");
        status.textContent = "This QR has expired. Please create a new payment QR.";
        status.style.color = "#b42318";
      }
    }, 1000);
  }

  function renderTimer() {
    const min = String(Math.floor(state.seconds / 60)).padStart(2, "0");
    const sec = String(state.seconds % 60).padStart(2, "0");
    $("countdown").textContent = `${min}:${sec}`;
  }

  const checkPaymentBtn = $("checkPaymentBtn");
  if (checkPaymentBtn) {
    checkPaymentBtn.addEventListener("click", async () => {
      if (!state.tranId) return;
      checkPaymentBtn.disabled = true;
      checkPaymentBtn.textContent = "Checking...";

      try {
        const response = await fetch(`${BACKEND}/api/payway/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tranId: state.tranId })
        });
        const data = await response.json();
        const info = data?.data?.data || data?.data || {};
        const paymentStatus = String(info.payment_status || "").toUpperCase();
        const statusCode = Number(info.payment_status_code);
        const status = $("statusMessage");

        if (paymentStatus === "APPROVED" || paymentStatus === "SUCCESS" || statusCode === 0) {
          status.textContent = "Payment successful ✓";
          status.style.color = "#15914b";
          clearInterval(state.timer);
        } else if (paymentStatus === "PENDING" || statusCode === 2) {
          status.textContent = "Payment is still pending.";
          status.style.color = "#9a6a10";
        } else {
          status.textContent = `Status: ${paymentStatus || "Unknown"}`;
          status.style.color = "#b42318";
        }
      } catch (error) {
        const status = $("statusMessage");
        status.textContent = "Unable to check payment right now.";
        status.style.color = "#b42318";
      } finally {
        checkPaymentBtn.disabled = false;
        checkPaymentBtn.textContent = "Check Payment";
      }
    });
  }
})();
