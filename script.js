const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particlesArray = [];
const speciesList = [];
let nextSpeciesId = 0;
let mouseStrength = 1; // Default mouse influence strength

const MAX_PARTICLES = 2000;

const mouse = {
  x: null,
  y: null,
  radius: 150,
  vx: 0,
  vy: 0,
};

class Particle {
  constructor(species) {
    this.species = species;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.updateSize();
    this.velocityX = (Math.random() * 2 - 1) * species.speed;
    this.velocityY = (Math.random() * 2 - 1) * species.speed;
    this.angle = Math.random() * Math.PI * 2; // For curved movement
    this.layer = Math.random(); // Random layer weight
  }


  updateSize() {
    this.size = Math.max(
      3, // Minimum size for visibility
      this.species.avgSize +
        (Math.random() - 0.5) * this.species.sizeVariation * 4 // Intense variation
    );
  }

  draw() {
    ctx.fillStyle = this.species.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    // Check collision toggle state
    const collisionEnabled = document.getElementById("collisionCheckbox").checked;
  
    // Mouse influence
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance < mouse.radius) {
      this.velocityX += mouse.vx * 0.05 * mouseStrength;
      this.velocityY += mouse.vy * 0.05 * mouseStrength;
    }
  
    // Decelerate mouse effect
    mouse.vx *= 0.99999;
    mouse.vy *= 0.99999;
  
    // Whirlpool and goal influence
    const goalDx = this.species.goalX - this.x;
    const goalDy = this.species.goalY - this.y;
    const goalDistance = Math.sqrt(goalDx * goalDx + goalDy * goalDy);
  
    const whirlpoolEffect = this.species.whirlpool * 0.1;
    if (goalDistance > this.size) {
      if (whirlpoolEffect > 0) {
        const tangentX = -goalDy / goalDistance;
        const tangentY = goalDx / goalDistance;
        this.velocityX += tangentX * whirlpoolEffect;
        this.velocityY += tangentY * whirlpoolEffect;
      }
      this.velocityX += (goalDx / goalDistance) * (1 - whirlpoolEffect) * this.species.schoolStrength;
      this.velocityY += (goalDy / goalDistance) * (1 - whirlpoolEffect) * this.species.schoolStrength;
    } else {
      this.species.goalX = Math.random() * canvas.width;
      this.species.goalY = Math.random() * canvas.height;
    }

    if (this.species.river > 0) {
      const riverForceX = Math.cos(this.species.riverDirection) * this.species.river;
      const riverForceY = Math.sin(this.species.riverDirection) * this.species.river;
      this.velocityX += riverForceX;
      this.velocityY += riverForceY;
    }

    // Repulsion
    particlesArray.forEach((particle) => {
      const dx = particle.x - this.x;
      const dy = particle.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      if (distance < this.species.viewDistance && particle !== this) {
        const angle = Math.atan2(dy, dx);
        const force = (this.species.repulsion * (this.species.viewDistance - distance)) / this.species.viewDistance;
  
        this.velocityX -= Math.cos(angle) * force;
        this.velocityY -= Math.sin(angle) * force;
      }
    });
  
    // Handle collision only if enabled
    if (collisionEnabled) {
      particlesArray.forEach((particle) => {
        const dx = particle.x - this.x;
        const dy = particle.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < this.size + particle.size && particle !== this) {
          const angle = Math.atan2(dy, dx);
          const overlap = (this.size + particle.size - distance) * 0.1;
          this.velocityX -= Math.cos(angle) * overlap;
          this.velocityY -= Math.sin(angle) * overlap;
          particle.velocityX += Math.cos(angle) * overlap;
          particle.velocityY += Math.sin(angle) * overlap;
        }
      });
    }
  
    // Path Curvature influence
    if (this.species.curveStrength > 0) {
      this.angle += this.species.curveStrength;
      this.velocityX += Math.cos(this.angle) * 0.1;
      this.velocityY += Math.sin(this.angle) * 0.1;
    }
  
    // Apply speed cap
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    if (speed > this.species.speed) {
      this.velocityX *= 0.98;
      this.velocityY *= 0.98;
    }
  
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
  
    // Screen edge wrap-around
    if (this.x > canvas.width) this.x = 0;
    if (this.x < 0) this.x = canvas.width;
    if (this.y > canvas.height) this.y = 0;
    if (this.y < 0) this.y = canvas.height;
  
    this.draw();
  }
}  

function addSpecies() {
  const tutorialArrow = document.getElementById("tutorialArrow");
  if (tutorialArrow) {
    tutorialArrow.style.display = "none"; // Hide the tutorial arrow
  }

  const id = nextSpeciesId++;
  const newSpecies = {
    id,
    name: `Species ${id}`,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    speed: Math.random() * 3 + 1,
    avgSize: Math.random() * 10 + 3,
    sizeVariation: Math.random() * 5,
    schoolStrength: Math.random() * 0.02 + 0.005, // Attraction
    repulsion: Math.random() * 0.02 + 0.005, // Repulsion
    viewDistance: Math.random() * 100 + 50,
    count: Math.floor(Math.random() * 20 + 10),
    curveStrength: Math.random() * 0.1,
    whirlpool: Math.random(),
    river: 0, // Default river strength
    riverDirection: Math.random() * Math.PI * 2, // Random initial direction
    goalX: Math.random() * canvas.width,
    goalY: Math.random() * canvas.height,
  };
  speciesList.push(newSpecies);
  createSpeciesUI(newSpecies);
  addParticles(newSpecies, newSpecies.count);
}



function addParticles(species, count) {
  if (particlesArray.length + count > MAX_PARTICLES) {
    displayErrorMessage(
      `Cannot add more than ${MAX_PARTICLES} particles. You can add ${
        MAX_PARTICLES - particlesArray.length
      } more.`
    );
    return;
  }

  for (let i = 0; i < count; i++) {
    particlesArray.push(new Particle(species));
  }
}

function createSpeciesUI(species) {
  const speciesDiv = document.createElement("div");
  speciesDiv.classList.add("control-group");
  speciesDiv.id = `species-${species.id}`;

  speciesDiv.innerHTML = `
    <h3>
      <span class="color-indicator" style="background: ${species.color};"></span>${species.name}
      <span class="settings-icon" onclick="toggleMenu(${species.id})">⚙️</span>
    </h3>

    <div class="slider-group" style="display: none;">
      <label>Color: 
        <input type="color" value="${species.color}" onchange="updateSpecies(${species.id}, 'color', this.value)">
      </label>
      <label>Speed 🏃: 
        <input type="range" min="0.5" max="5" step="0.1" value="${species.speed}" onchange="updateSpecies(${species.id}, 'speed', parseFloat(this.value))">
      </label>
      <label>Count: 
        <input type="number" min="1" max="100" value="${species.count}" onchange="updateCount(${species.id}, this.value)">
      </label>
      <label>Average Size 📏: 
        <input type="range" min="3" max="15" step="0.1" value="${species.avgSize}" onchange="updateSize(${species.id}, 'avgSize', parseFloat(this.value))">
      </label>
      <label>Size Variation : 
        <input type="range" min="0" max="10" step="0.1" value="${species.sizeVariation}" onchange="updateSize(${species.id}, 'sizeVariation', parseFloat(this.value))">
      </label>
      <label>Attraction 🧲: 
        <input type="range" min="0.0" max="0.05" step="0.001" value="${species.schoolStrength}" onchange="updateSpecies(${species.id}, 'schoolStrength', parseFloat(this.value))">
      </label>
      <label>Repulsion ⬅️➡️: 
        <input type="range" min="0" max="0.05" step="0.001" value="${species.repulsion}" onchange="updateSpecies(${species.id}, 'repulsion', parseFloat(this.value))">
      </label>
      <label>Path Curvature 🌊: 
        <input type="range" min="0" max="0.1" step="0.01" value="${species.curveStrength}" onchange="updateSpecies(${species.id}, 'curveStrength', parseFloat(this.value))">
      </label>
      <label>Whirlpool 🔄: 
        <input type="range" min="0" max="1" step="0.01" value="${species.whirlpool}" onchange="updateSpecies(${species.id}, 'whirlpool', parseFloat(this.value))">
      </label>
      <label>River 🏊‍♂️: 
       <input type="range" min="0" max="0.2" step="0.01" value="${species.river}" onchange="updateSpecies(${species.id}, 'river', parseFloat(this.value))">
      </label>
      <button onclick="removeSpecies(${species.id})">Delete</button>
    </div>
  `;
  document.getElementById("speciesList").appendChild(speciesDiv);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}



function openColorPicker(id) {
  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = speciesList.find((s) => s.id === id).color;
  colorInput.style.display = "none";
  colorInput.onchange = (e) => updateSpecies(id, "color", e.target.value);
  document.body.appendChild(colorInput);
  colorInput.click();
  document.body.removeChild(colorInput);
}

function toggleMenu(id) {
  const sliderGroup = document.querySelector(`#species-${id} .slider-group`);
  if (sliderGroup) {
    sliderGroup.style.display =
      sliderGroup.style.display === "none" ? "block" : "none";
  }
}

function togglePanel() {
  const controlPanel = document.getElementById("controlPanel");
  const toggleArrow = document.getElementById("toggleArrow");
  controlPanel.classList.toggle("minimized");
  toggleArrow.innerText = controlPanel.classList.contains("minimized")
    ? "⬅️"
    : "➡️";
}

function updateSpecies(id, property, value) {
  const species = speciesList.find((s) => s.id === id);
  if (species) {
    species[property] = value;

    // Update the color of the color-indicator in the UI if property is 'color'
    if (property === "color") {
      const colorIndicator = document.querySelector(
        `#species-${id} .color-indicator`
      );
      if (colorIndicator) {
        colorIndicator.style.backgroundColor = value;
      }
    }
  }
}

function updateSize(id, property, value) {
  const species = speciesList.find((s) => s.id === id);
  if (species) {
    species[property] = value;
    particlesArray
      .filter((p) => p.species.id === id)
      .forEach((p) => p.updateSize());
  }
}

function updateCount(id, value) {
  const species = speciesList.find((s) => s.id === id);
  if (species) {
    const newCount = parseInt(value);
    const diff = newCount - species.count;

    if (diff > 0) {
      // Add particles if new count is higher
      addParticles(species, diff);
    } else {
      // Remove particles if new count is lower
      particlesArray.splice(
        0,
        particlesArray.length,
        ...particlesArray.filter(
          (p) =>
            p.species.id !== id ||
            Math.random() > Math.abs(diff) / species.count
        )
      );
    }
    species.count = newCount;
  }
}

function removeSpecies(id) {
  const speciesIndex = speciesList.findIndex((s) => s.id === id);
  if (speciesIndex !== -1) {
    speciesList.splice(speciesIndex, 1);
    particlesArray.splice(
      0,
      particlesArray.length,
      ...particlesArray.filter((p) => p.species.id !== id)
    );
    document.getElementById(`species-${id}`).remove();
  }
}

function displayErrorMessage(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 3000);
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw mouse influence indicator
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fill();
  ctx.closePath();

  // Sort particles by their layer
  particlesArray.sort((a, b) => a.layer - b.layer);

  // Update and draw each particle
  particlesArray.forEach((particle) => particle.update());

  requestAnimationFrame(animate);
}


window.addEventListener("mousemove", (event) => {
  mouse.vx = event.movementX;
  mouse.vy = event.movementY;
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particlesArray.length = 0;
  speciesList.forEach((species) => addParticles(species, species.count));
});

document.getElementById("mouseStrength").addEventListener("input", (e) => {
  mouseStrength = parseFloat(e.target.value);
});

document.getElementById("backgroundColorPicker").addEventListener("input", (event) => {
  const newColor = event.target.value;
  canvas.style.backgroundColor = newColor; // Dynamically updates the canvas background
});




// Tutorial Popup Initialization
document.addEventListener('DOMContentLoaded', () => {
  const tutorialButton = document.createElement('button');
  tutorialButton.id = 'tutorialButton';
  tutorialButton.innerText = 'Tutorial';
  tutorialButton.style.position = 'absolute';
  tutorialButton.style.bottom = '60px'; // Adjust position relative to collision toggle
  tutorialButton.style.left = '20px';
  tutorialButton.style.zIndex = '100';
  document.body.appendChild(tutorialButton);

  const tutorialPopup = document.createElement('div');
  tutorialPopup.id = 'tutorialPopup';
  tutorialPopup.innerHTML = `
    <h3>Tutorial</h3>
    <ul>
      <li><strong>Add Species:</strong> Adds a new species of particles to the simulation.</li>
      <li><strong>Color:</strong> Customize the color of the particles.</li>
      <li><strong>Speed:</strong> Adjust the speed of the particles.</li>
      <li><strong>Attraction:</strong> Controls how strongly particles group together.</li>
      <li><strong>Repulsion:</strong> Controls how strongly particles push away from each other.</li>
      <li><strong>River:</strong> Adds a current that moves particles in a specific direction.</li>
      <li><strong>Whirlpool:</strong> Causes particles to spin around their goals.</li>
      <li><strong>Collision:</strong> Toggles whether particles collide with each other.</li>
      <li><strong>Mouse Strength:</strong> Controls how strongly particles react to the mouse.</li>
    </ul>
    <button id="closeTutorial">Close</button>
  `;
  tutorialPopup.style.position = 'fixed';
  tutorialPopup.style.top = '50%';
  tutorialPopup.style.left = '50%';
  tutorialPopup.style.transform = 'translate(-50%, -50%)';
  tutorialPopup.style.padding = '20px';
  tutorialPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  tutorialPopup.style.color = 'white';
  tutorialPopup.style.borderRadius = '10px';
  tutorialPopup.style.zIndex = '1000';
  tutorialPopup.style.display = 'none';
  document.body.appendChild(tutorialPopup);

  tutorialButton.addEventListener('click', () => {
    tutorialPopup.style.display = 'block';
  });

  tutorialPopup.addEventListener('click', (e) => {
    if (e.target.id === 'closeTutorial' || e.target === tutorialPopup) {
      tutorialPopup.style.display = 'none';
    }
  });
});



animate();
