// USER CONNECTION (your login system preserved)
let user = JSON.parse(localStorage.getItem("user"));
if (user) {
  document.getElementById("Username").innerText = "Welcome, " + user.username;
}

// LOGOUT
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// SCROLL
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

//////////////////////////////////////////////////
// ASSIGNMENTS
//////////////////////////////////////////////////
let assignments = JSON.parse(localStorage.getItem("assignments")) || [];

function displayAssignments() {
  let list = document.getElementById("assignList");
  let past = document.getElementById("pastList");

  list.innerHTML = "";
  past.innerHTML = "";

  let today = new Date();

  assignments.forEach(a => {
    let li = document.createElement("li");
    let due = new Date(a.date);

    li.innerText = `${a.name} - ${a.date}`;

    if (due < today) {
      li.classList.add("overdue");
      past.appendChild(li);
    } else {
      list.appendChild(li);
    }
  });
}

function addAssignment() {
  let name = document.getElementById("assignName").value;
  let date = document.getElementById("assignDate").value;

  if (!name || !date) return alert("Enter all fields");

  assignments.push({ name, date });
  localStorage.setItem("assignments", JSON.stringify(assignments));

  displayAssignments();
}

displayAssignments();

//////////////////////////////////////////////////
// ATTENDANCE
//////////////////////////////////////////////////
function calc(t, a, perId, barId) {
  if (t > 0) {
    let per = (a / t) * 100;
    document.getElementById(perId).innerText = per.toFixed(1) + "%";
    document.getElementById(barId).style.width = per + "%";
    return per;
  }
  return 0;
}

function updateAll() {
  calc(mT.value, mA.value, "mPer", "mBar");
  calc(pT.value, pA.value, "pPer", "pBar");
  calc(cT.value, cA.value, "cPer", "cBar");
  calc(wT.value, wA.value, "wPer", "wBar");
}

function check() {
  let m = calc(mT.value, mA.value, "mPer", "mBar");
  let p = calc(pT.value, pA.value, "pPer", "pBar");
  let c = calc(cT.value, cA.value, "cPer", "cBar");
  let w = calc(wT.value, wA.value, "wPer", "wBar");

  if (m>=80 && p>=80 && c>=80 && w>=80)
    result.innerHTML = "Eligible";
  else
    result.innerHTML = " Not Eligible";
}

//////////////////////////////////////////////////
// MARKS GRAPH
//////////////////////////////////////////////////
let ctx = document.getElementById("marksChart");

new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Maths", "Physics", "Programming", "Web Dev"],
    datasets: [{
      label: "Marks",
      data: [85, 78, 92, 88]
    }]
  }
});