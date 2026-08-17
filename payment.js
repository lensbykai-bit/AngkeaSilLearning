const params = new URLSearchParams(window.location.search);
const course = params.get("course") || "វគ្គសិក្សា";
const price = Number(params.get("price") || "0").toFixed(2);

document.getElementById("courseName").textContent = course;
document.getElementById("coursePrice").textContent = `$${price}`;
document.getElementById("totalPrice").textContent = `$${price}`;
document.getElementById("payAmount").textContent = `$${price}`;

/* ពន្លឺ / ងងឹត */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  localStorage.setItem("asl-theme", theme);
}

applyTheme(localStorage.getItem("asl-theme") || "light");

themeToggle?.addEventListener("click", () => {
  const next = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(next);
});

/* ជ្រើសរើសវិធីទូទាត់ */
document.querySelectorAll(".method-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".method-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".method-panel").forEach((panel) => panel.classList.remove("active"));

    tab.classList.add("active");
    document.querySelector(`[data-panel="${tab.dataset.method}"]`)?.classList.add("active");
  });
});

/* គំរូការទូទាត់ */
const successModal = document.getElementById("successModal");

document.getElementById("cardForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  successModal.classList.add("open");
  successModal.setAttribute("aria-hidden", "false");
});

document.getElementById("closeSuccess")?.addEventListener("click", () => {
  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden", "true");
});
