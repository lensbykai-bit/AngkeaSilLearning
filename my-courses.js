const COURSE_CATALOG = {
  "chinese-basics": {
    name: "មូលដ្ឋានភាសាចិន",
    image: "assets/course-chinese-v12.svg",
    description: "រៀនពាក្យមូលដ្ឋាន ការអាន និងការប្រើប្រាស់ប្រចាំថ្ងៃ។"
  },
  "excel-business": {
    name: "Excel សម្រាប់អាជីវកម្ម",
    image: "assets/course-excel-v12.svg",
    description: "អនុវត្តតារាងទិន្នន័យ រូបមន្ត និងការងារអាជីវកម្ម។"
  },
  "website-basics": {
    name: "បង្កើតគេហទំព័រ",
    image: "assets/course-web-v12.svg",
    description: "ចាប់ផ្តើម HTML, CSS និង JavaScript តាមជំហាន។"
  }
};

function getOwnedCourses() {
  try {
    const value = JSON.parse(localStorage.getItem("asl-owned-courses") || "[]");
    return Array.isArray(value) ? [...new Set(value)] : [];
  } catch {
    return [];
  }
}

const owned = getOwnedCourses().filter(id => COURSE_CATALOG[id]);
const grid = document.getElementById("ownedCourses");
const count = document.getElementById("ownedCount");

if (count) count.textContent = owned.length
  ? `${owned.length} វគ្គបានបើកសិទ្ធិ`
  : "មិនទាន់មានវគ្គដែលបានបើកសិទ្ធិ";

if (grid) {
  if (!owned.length) {
    grid.innerHTML = `
      <div class="empty-library">
        <div class="empty-icon">📚</div>
        <h3>មិនទាន់មានមេរៀនទិញ</h3>
        <p>បន្ទាប់ពីការទូទាត់ត្រូវបានបញ្ជាក់ វគ្គសិក្សានឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ។</p>
        <a href="index.html#courses">រកមើលវគ្គសិក្សា</a>
      </div>`;
  } else {
    grid.innerHTML = owned.map(id => {
      const c = COURSE_CATALOG[id];
      return `
        <article class="owned-card">
          <img src="${c.image}" alt="${c.name}">
          <div class="owned-body">
            <span class="owned-status">✓ បានបើកសិទ្ធិ</span>
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <div class="owned-progress"><i></i></div>
            <a class="owned-open" href="course-view.html?courseId=${encodeURIComponent(id)}">បន្តរៀន →</a>
          </div>
        </article>`;
    }).join("");
  }
}