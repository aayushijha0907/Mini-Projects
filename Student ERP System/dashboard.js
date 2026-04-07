function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "logout.html";
}

function showSection(section) {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("attendance").classList.add("hidden");
  document.getElementById("assignments").classList.add("hidden");
  document.getElementById("faculty").classList.add("hidden");

  document.getElementById(section).classList.remove("hidden");
}

function calculate() {
  let total = document.getElementById("total").value;
  let attended = document.getElementById("attended").value;

  if (total == "" || total == 0) {
    alert("Enter valid data");
    return;
  }

  let percent = (attended / total) * 100;
  let text = "Attendance: " + percent.toFixed(2) + "%";

  if (percent < 80) {
    text += " ⚠ LOW ATTENDANCE";
  }

  document.getElementById("attendanceResult").innerText = text;
}


// Predefined assignments (FINAL YEAR STYLE)
const assignments = [
  { subject: "DSA", due: "2026-04-10" },
  { subject: "Maths", due: "2026-04-12" },
  { subject: "DBMS", due: "2026-04-15" },
  { subject: "Web Dev", due: "2026-04-18" }
];

function loadAssignments() {
  let list = document.getElementById("assignmentList");
  list.innerHTML = "";

  let today = new Date();

  assignments.forEach(a => {
    let li = document.createElement("li");

    let dueDate = new Date(a.due);
    let diff = (dueDate - today) / (1000 * 60 * 60 * 24);

    li.innerText = `${a.subject} - Due: ${a.due}`;

    // 🔥 SMART FLASH LOGIC
    if (diff <= 2) {
      li.classList.add("urgent");   // red flashing
    } else if (diff <= 5) {
      li.classList.add("warning");  // orange flashing
    }

    list.appendChild(li);
  });
}

// FLASH BASED ON DATE
function highlightAssignments() {
  let items = document.querySelectorAll("#assignmentList li");
  let today = new Date();

  items.forEach(item => {
    let due = new Date(item.getAttribute("data-date"));
    let diff = (due - today) / (1000 * 60 * 60 * 24);

    if (diff <= 2) {
      item.classList.add("urgent");
    } else if (diff <= 5) {
      item.classList.add("warning");
    }
  });
}

// SEARCH FUNCTION
function searchAssignment() {
  let input = document.getElementById("searchBox").value.toLowerCase();
  let items = document.querySelectorAll("#assignmentList li");

  items.forEach(item => {
    let text = item.innerText.toLowerCase();

    if (text.includes(input)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function searchAssignment() {
  let input = document.getElementById("searchBox").value.toLowerCase();
  let items = document.querySelectorAll("#assignmentList li");

  items.forEach(item => {
    let text = item.innerText.toLowerCase();

    if (text.includes(input)) {
      item.style.display = "list-item";  // 🔥 FIXED
    } else {
      item.style.display = "none";
    }
  });
}

function highlightAssignments() {
  let items = document.querySelectorAll("#assignmentList li");
  let today = new Date();

  items.forEach(item => {
    let due = new Date(item.getAttribute("data-date"));

    let diff = (due - today) / (1000 * 60 * 60 * 24);

    console.log(item.innerText, diff); // 🔍 DEBUG

    if (diff <= 2) {
      item.classList.add("urgent");
    } else if (diff <= 5) {
      item.classList.add("warning");
    }
  });
}

// RUN ON LOAD
window.onload = function () {
  highlightAssignments();
};

function loadAssignments() {
  let list = document.getElementById("assignmentList");

  assignments.forEach(a => {
    let li = document.createElement("li");
    li.innerText = a.subject + " - Due: " + a.due;

    list.appendChild(li);
  });
}

// Graph fix
window.onload = function () {
  const ctx = document.getElementById("chart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["DSA", "Maths", "DBMS", "Web Dev"],
      datasets: [{
        label: "Marks",
        data: [85, 78, 90, 88],
        backgroundColor: ["#3498db","#e74c3c","#2ecc71","#9b59b6"]
      }]
    }
  });
}