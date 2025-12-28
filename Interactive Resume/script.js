// ====== ELEMENT REFERENCES ======
const output = document.getElementById("output");
const input = document.getElementById("commandInput");
const popupContainer = document.getElementById("popup-container");

// ====== INTRO TEXT (TYPING EFFECT) ======
const introText = [
  "Initializing system...",
  "Loading portfolio modules...",
  "",
  "Hi, I am Aayushi Jha",
  "B.Tech Computer Engineering Student",
  "Cyber Security Enthusiast | AI-assisted Developer",
  "",
  "Type 'help' to see available commands."
];

let lineIndex = 0;
let charIndex = 0;

// ====== TYPEWRITER FUNCTION ======
function typeIntro() {
  if (lineIndex < introText.length) {
    if (charIndex < introText[lineIndex].length) {
      output.innerHTML += introText[lineIndex].charAt(charIndex);
      charIndex++;
      setTimeout(typeIntro, 40);
    } else {
      output.innerHTML += "<br>";
      charIndex = 0;
      lineIndex++;
      setTimeout(typeIntro, 300);
    }
  }
}

typeIntro();

// ====== AUTO SCROLL ======
function scrollDown() {
  const terminal = document.querySelector(".terminal");
  terminal.scrollTop = terminal.scrollHeight;
}

// ====== INPUT COMMAND HANDLER ======
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const command = input.value.toLowerCase().trim();
    output.innerHTML += `<br><span class="prompt">aayushi@portfolio:~$</span> ${command}`;
    input.value = "";

    handleCommand(command);
    scrollDown();
  }
});

// ====== COMMAND LOGIC ======
function handleCommand(cmd) {
  switch (cmd) {

    case "help":
      output.innerHTML += `
        <br><br>Available commands:
        <br>• about      → Know more about me
        <br>• skills     → View my skills
        <br>• projects   → View my projects
        <br>• clear      → Clear terminal
      `;
      break;

    case "about":
      output.innerHTML += `
        <br><br>I am a Computer Engineering undergraduate at NMIMS Navi Mumbai.
        <br>I am deeply interested in Cyber Security, AI-assisted development,
        <br>automation, and real-world problem solving.
        <br><br>I enjoy working with Arduino and Raspberry Pi,
        <br>exploring network security concepts, and building logical solutions.
      `;
      break;

    case "skills":
      showSkillsPopup();
      break;

    case "projects":
      output.innerHTML += `
        <br><br>Projects:
        <br>• Cyber Security mini projects
        <br>• Arduino & automation experiments
        <br>• Python-based automation scripts
      `;
      break;

    case "clear":
      output.innerHTML = "";
      break;

    default:
      output.innerHTML += `<br>Command not found. Type 'help'.`;
  }
}

// ====== SKILLS POPUP ======
function showSkillsPopup() {
  popupContainer.innerHTML = `
    <div class="popup">
      <span class="close-btn" onclick="closePopup()">✕</span>

      <h3>Programming</h3>
      <ul>
        <li><b>C</b> – logic building, college assignments, problem solving</li>
        <li><b>Python</b> – automation scripts, AI-assisted development</li>
      </ul>

      <h3>Cyber Security</h3>
      <ul>
        <li>Network and OS hardening</li>
        <li>SIEM tools and security playbooks</li>
        <li>Cyberlaw fundamentals</li>
      </ul>

      <h3>Hardware & Tools</h3>
      <ul>
        <li>Arduino UNO R3, Raspberry Pi</li>
        <li>AutoCAD, TinkerCAD</li>
        <li>GitHub version control</li>
      </ul>
    </div>
  `;
}

// ====== CLOSE POPUP ======
function closePopup() {
  popupContainer.innerHTML = "";
}
