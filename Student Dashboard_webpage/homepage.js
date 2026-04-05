// ================= LOGIN CHECK =================
if (!localStorage.getItem("loggedIn")) {
  alert("Login first!");
  window.location.href = "login.html";
}

// ================= USER NAME =================
let user = JSON.parse(localStorage.getItem("user"));
if (user) {
  document.getElementById("Username").innerText = "Welcome, " + user.username;
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// ================= SCROLL =================
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// ================= ASSIGNMENTS =================
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

// ADD
function addAssignment() {
  let name = document.getElementById("assignName").value.trim();
  let date = document.getElementById("assignDate").value;

  if (!name || !date) {
    alert("Fill all fields");
    return;
  }

  assignments.push({
    name: name,
    date: date,
    completed: false
  });

  localStorage.setItem("assignments", JSON.stringify(assignments));

  document.getElementById("assignName").value = "";
  document.getElementById("assignDate").value = "";

  displayAssignments();
  smartWarning();
}

// DISPLAY
function displayAssignments() {
  let list = document.getElementById("assignList");
  list.innerHTML = "";

  let today = new Date();

  assignments.forEach((a, index) => {
    let li = document.createElement("li");

    let dueDate = new Date(a.date);
    let diff = (dueDate - today) / (1000 * 60 * 60 * 24);

    // FLASH IF DEADLINE CLOSE
    if (diff <= 1 && !a.completed) {
      li.classList.add("flash");
    }

    li.innerHTML = `
      <div>
        <strong style="${a.completed ? 'text-decoration:line-through;' : ''}">
          ${a.name}
        </strong><br>
        <span>📅 ${a.date}</span>
      </div>

      <div>
        <button onclick="toggleComplete(${index})">
          ${a.completed ? 'Undo' : 'Done'}
        </button>

        <button onclick="deleteAssignment(${index})">X</button>
      </div>
    `;

    list.appendChild(li);
  });
}

// DELETE
function deleteAssignment(index) {
  assignments.splice(index, 1);
  localStorage.setItem("assignments", JSON.stringify(assignments));
  displayAssignments();
  smartWarning();
}

// COMPLETE
function toggleComplete(index) {
  assignments[index].completed = !assignments[index].completed;
  localStorage.setItem("assignments", JSON.stringify(assignments));
  displayAssignments();
  smartWarning();
}

// INITIAL LOAD
displayAssignments();

// ================= ATTENDANCE =================

// CALCULATE %
function calcPercent(total, attended) {
  total = parseFloat(total);
  attended = parseFloat(attended);

  if (!total || total === 0) return 0;

  return Math.min((attended / total) * 100, 100);
}

// UPDATE ONE SUBJECT
function updateSubject(totalId, attendId, perId, barId) {
  let total = document.getElementById(totalId).value;
  let attend = document.getElementById(attendId).value;

  let per = calcPercent(total, attend);

  document.getElementById(perId).innerText = per.toFixed(1) + "%";

  let bar = document.getElementById(barId);
  bar.style.width = per + "%";

  // COLOR CHANGE
  if (per >= 80) {
    bar.style.background = "limegreen";
  } else if (per >= 60) {
    bar.style.background = "orange";
  } else {
    bar.style.background = "red";
  }

  return per;
}

// LIVE UPDATE
function updateAll() {
  updateSubject("mT", "mA", "mPer", "mBar");
  updateSubject("pT", "pA", "pPer", "pBar");
  updateSubject("cT", "cA", "cPer", "cBar");
  updateSubject("wT", "wA", "wPer", "wBar");

  smartWarning(); // 🔥 auto check
}

// ELIGIBILITY (80% RULE)
function check() {
  let m = updateSubject("mT", "mA", "mPer", "mBar");
  let p = updateSubject("pT", "pA", "pPer", "pBar");
  let c = updateSubject("cT", "cA", "cPer", "cBar");
  let w = updateSubject("wT", "wA", "wPer", "wBar");

  let result = document.getElementById("result");

  if (m >= 80 && p >= 80 && c >= 80 && w >= 80) {
    result.innerHTML = "<span style='color:green;'>Eligible ✅</span>";
  } else {
    result.innerHTML = "<span style='color:red;'>Not Eligible ❌ (Min 80% Required)</span>";
  }
}

// ================= SMART WARNING SYSTEM =================
function smartWarning() {
  let warnings = [];

  // ATTENDANCE CHECK (80%)
  let subjects = [
    { name: "Maths", t: mT.value, a: mA.value },
    { name: "Physics", t: pT.value, a: pA.value },
    { name: "Programming", t: cT.value, a: cA.value },
    { name: "Web Dev", t: wT.value, a: wA.value }
  ];

  let lowSubjects = [];

  subjects.forEach(sub => {
    let per = calcPercent(sub.t, sub.a);
    if (per < 80) {
      lowSubjects.push(sub.name + " (" + per.toFixed(1) + "%)");
    }
  });

  if (lowSubjects.length > 0) {
    warnings.push("⚠️ Low Attendance in:<br>" + lowSubjects.join(", "));
  }

  // ASSIGNMENT CHECK
  let pending = assignments.filter(a => !a.completed);

  if (pending.length > 0) {
    let names = pending.map(a => a.name);
    warnings.push("📚 Pending Assignments:<br>" + names.join(", "));
  }

  // DISPLAY
  let box = document.getElementById("smartWarn");

  if (!box) return;

  if (warnings.length === 0) {
    box.innerHTML = "✅ Attendance ≥ 80% & All Assignments Completed";
    box.style.color = "green";
  } else {
    box.innerHTML = warnings.join("<br><br>");
    box.style.color = "red";
  }
}