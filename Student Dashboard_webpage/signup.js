function signup() {
  let username = document.getElementById("newUser").value.trim();
  let password = document.getElementById("newPass").value.trim();

  // Validation
  if (username === "" || password === "") {
    alert("Please fill all fields");
    return;
  }

  // Create user object
  let user = {
    username: username,
    password: password
  };

  // Store in localStorage
  localStorage.setItem("user", JSON.stringify(user));

  alert("Account created successfully!");

  // Redirect to login
  window.location.href = "login.html";
}