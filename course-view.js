const CATALOG = {
  "chinese-basics": {
    name: "មូលដ្ឋានភាសាចិន",
    description: "វគ្គនេះរៀបចំសម្រាប់អ្នកចាប់ផ្តើម ដោយផ្តោតលើពាក្យមូលដ្ឋាន ការបញ្ចេញសំឡេង និងការប្រើប្រាស់ប្រចាំថ្ងៃ។",
    modules: ["សេចក្តីផ្តើម", "សំឡេង និងការបញ្ចេញសំឡេង", "ពាក្យមូលដ្ឋាន", "ប្រយោគប្រចាំថ្ងៃ", "លំហាត់អនុវត្ត"]
  },
  "excel-business": {
    name: "Excel សម្រាប់អាជីវកម្ម",
    description: "រៀនបង្កើតតារាង ប្រើរូបមន្ត និងរៀបចំទិន្នន័យសម្រាប់ការងារ និងអាជីវកម្ម។",
    modules: ["ស្គាល់ Excel", "រៀបចំតារាង", "Formula មូលដ្ឋាន", "ទិន្នន័យអាជីវកម្ម", "Project អនុវត្ត"]
  },
  "website-basics": {
    name: "បង្កើតគេហទំព័រ",
    description: "ចាប់ផ្តើមពី HTML, CSS និង JavaScript ដើម្បីបង្កើតគេហទំព័រដំបូងរបស់អ្នក។",
    modules: ["មូលដ្ឋាន Web", "HTML", "CSS", "JavaScript", "Project Website"]
  }
};

const params = new URLSearchParams(location.search);
const courseId = params.get("courseId") || "";
let owned = [];
try { owned = JSON.parse(localStorage.getItem("asl-owned-courses") || "[]"); } catch {}

if (!Array.isArray(owned) || !owned.includes(courseId) || !CATALOG[courseId]) {
  document.getElementById("courseView").innerHTML = `
    <div class="empty-library">
      <div class="empty-icon">🔒</div>
      <h3>មេរៀននេះមិនទាន់បានបើកសិទ្ធិ</h3>
      <p>សូមទិញវគ្គ និងបញ្ជាក់ការទូទាត់ជាមុនសិន។</p>
      <a href="index.html#courses">ទៅវគ្គសិក្សា</a>
    </div>`;
} else {
  const c = CATALOG[courseId];
  document.title = `${c.name} — អង្គាសីល ល័ននីង`;
  document.getElementById("sidebarTitle").textContent = c.name;
  document.getElementById("lessonTitle").textContent = c.name;
  document.getElementById("lessonSubtitle").textContent = "ជ្រើសមេរៀនខាងឆ្វេង ដើម្បីបន្តការសិក្សា។";
  document.getElementById("lessonDescription").textContent = c.description;
  document.getElementById("moduleList").innerHTML = c.modules.map((m,i)=>`
    <div class="module-item">
      <b>${String(i+1).padStart(2,"0")}</b>
      <span><strong>${m}</strong><small>${i===0 ? "ចាប់ផ្តើមទីនេះ" : "មេរៀនបន្ទាប់"}</small></span>
    </div>`).join("");
}