function login() {
  let username = document.getElementById("username").value.trim();
  let password = document.getElementById("password").value.trim();

  let storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser) {
    alert("No account found. Please sign up first.");
    return;
  }

  if (username === storedUser.username && password === storedUser.password) {
    // SAVE LOGIN SESSION
    localStorage.setItem("loggedIn", "true");

    // REDIRECT TO DASHBOARD
    window.location.href = "homepage.html";
  } else {
    alert("Incorrect username or password");
  }
}