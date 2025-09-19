// ------------------------------
// Load Common Ingredients from data.json
// ------------------------------
fetch("../assets/data.json")
  .then(res => res.json())
  .then(data => {
    const commonIngredients = data.commonIngredients;
    const tagsContainer = document.querySelector(".common-ingredients .tags");
    const textarea = document.querySelector(".text-box textarea");
    tagsContainer.innerHTML = "";

    // Emoji mapping for common ingredients
    const emojiMap = {
      "Chicken": "🍗",
      "Rice": "🍚",
      "Egg": "🥚",
      "Cheese": "🧀",
      "Potato": "🥔",
      "Onion": "🧅",
      "Bread": "🍞",
      "Tomato": "🍅"
    };

    commonIngredients.forEach(item => {
      const span = document.createElement("span");
      span.textContent = `${emojiMap[item] || "🍴"} ${item}`;
      span.style.cursor = "pointer";

      span.addEventListener("click", () => {
        let currentText = textarea.value.trim();
        if (currentText) {
          const ingredientsArray = currentText.split(",").map(i => i.trim().toLowerCase());
          if (!ingredientsArray.includes(item.toLowerCase())) {
            textarea.value = currentText + ", " + item;
          }
        } else {
          textarea.value = item;
        }

        document.querySelector(".char-count").textContent = `${textarea.value.length}/500 characters`;
      });

      tagsContainer.appendChild(span);
    });
  })
  .catch(err => console.error("Error loading data.json:", err));

// ------------------------------
// Find Recipes Button
// ------------------------------
const findRecipesBtn = document.querySelector(".btn.primary");
const textarea = document.querySelector(".text-box textarea");

if (findRecipesBtn) {
  findRecipesBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const ingredients = textarea.value
      .split(",")
      .map(i => i.trim().toLowerCase())
      .filter(i => i);

    if (ingredients.length === 0) {
      alert("Please enter at least one ingredient!");
      return;
    }

    // Save to localStorage
    localStorage.setItem("userIngredients", JSON.stringify(ingredients));

    // Redirect to recipes page
    window.location.href = "recipes.html";
  });
}

// ------------------------------
// Load Recipes on recipes.html
// ------------------------------
if (document.body.contains(document.querySelector(".cards"))) {
  fetch("../assets/data.json")
    .then(res => res.json())
    .then(data => {
      const recipes = data.recipes;
      const cardsContainer = document.querySelector(".cards");

      const userIngredients = JSON.parse(localStorage.getItem("userIngredients")) || [];

      cardsContainer.innerHTML = "";

      const filtered = recipes.filter(recipe =>
        recipe.ingredients.some(ing => userIngredients.includes(ing.toLowerCase()))
      );

      if (filtered.length === 0) {
        cardsContainer.innerHTML = `<p style="font-size:28px;font-weight:bold;color:#ff9019;text-align:center;margin-top:10px;margin-bottom:50px;">No recipes found for your ingredients!</p>`;
        return;
      }

      filtered.forEach(recipe => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
          <div class="card-header">
            <img class="recipe-image" src="../assets/${recipe.image}" alt="${recipe.title}">
            <span class="badge">${recipe.difficulty}</span>
          </div>
          <div class="card-body">
            <h3>${recipe.title}</h3>
            <div class="meta">⏱ ${recipe.time} • 🍽 ${recipe.servings} servings</div>
            <p class="desc">${recipe.desc}</p>
            <div class="tags">
              ${recipe.ingredients.map(ing => `<span class="tag">${ing}</span>`).join("")}
            </div>
            <a href="recipe-info.html?id=${encodeURIComponent(recipe.id)}" class="recipe-link">
            View Recipe <span class="link-arrow">→</span>
          </a>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    })
    .catch(err => console.error("Error loading recipes:", err));
}

// ------------------------------
// Mobile Menu Toggle
// ------------------------------
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// ------------------------------
// Character Counter for textarea
// ------------------------------
const charCount = document.querySelector(".char-count");

if (textarea && charCount) {
  textarea.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length}/500 characters`;
  });
}


// ------------------------------
// Hugging Face AI Ingredient Detection
// ------------------------------
const fileInput = document.getElementById("ingredient-upload");
const uploadStatus = document.getElementById("upload-status");
const spinner = document.getElementById("loading-spinner");


const HF_SPACE_URL = "https://sandra-1601-food-ingredient-detector.hf.space/api/predict";

if (fileInput) {
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadStatus.textContent = "Detecting ingredients...";
    spinner.style.display = "block";

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1]; // strip "data:image/...;base64,"

        const payload = {
          data: [
            {
              data: base64data,
              orig_name: file.name,
              mime_type: file.type,
              is_stream: false
            }
          ]
        };

        const response = await fetch(HF_SPACE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("🔎 Full API Response:", result);

        spinner.style.display = "none";

        if (!result || !result.data) {
          uploadStatus.textContent = "⚠️ Unexpected API response!";
          return;
        }

        // Log what comes inside result.data
        console.log("📦 result.data:", result.data);

        // Some Spaces wrap predictions in result.data[0], others in result.data
        let predictions = Array.isArray(result.data[0]) ? result.data[0] : result.data;
        console.log("✅ Predictions after parsing:", predictions);

        if (!predictions || predictions.length === 0) {
          uploadStatus.textContent = "⚠️ No ingredients detected!";
          return;
        }

        // Extract labels + dedupe
        const detected = [
          ...new Set(
            predictions
              .filter(item => item.score && item.score > 0.1)
              .map(item => item.label.toLowerCase())
          )
        ];

        console.log("🥗 Final detected ingredients:", detected);

        if (detected.length > 0) {
          const current = textarea.value
            .split(",")
            .map(i => i.trim().toLowerCase())
            .filter(i => i);

          const combined = Array.from(new Set([...current, ...detected]));
          textarea.value = combined.join(", ");

          charCount.textContent = `${textarea.value.length}/500 characters`;
          uploadStatus.textContent = "✅ Ingredients detected and added!";
        } else {
          uploadStatus.textContent = "⚠️ No clear ingredients found!";
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("❌ Error:", err);
      spinner.style.display = "none";
      uploadStatus.textContent = "⚠️ Something went wrong!";
    }
  });
}



// recipe info page js

// recipe-info.js
document.addEventListener("DOMContentLoaded", () => {
  initializeRecipeDetail();
});

function initializeRecipeDetail() {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get("id");
  if (!recipeId) return;

  fetch("../assets/data.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch data.json");
      return res.json();
    })
    .then(data => {
      if (!data.recipes) throw new Error("No recipes found in data.json");

      // Find the recipe (convert id to string for comparison)
      const recipe = data.recipes.find(r => r.id.toString() === recipeId);
      if (!recipe) {
        const container = document.querySelector(".recipe-detail-container");
        if (container) container.innerHTML = "<p>Recipe not found!</p>";
        return;
      }

      // --- Hero Section ---
      const heroImage = document.querySelector(".hero-image");
      if (heroImage) {
        heroImage.src = `../assets/${recipe.image}`;
        heroImage.alt = recipe.title;
      }

      const heroTitle = document.querySelector(".recipe-hero-title");
      if (heroTitle) heroTitle.textContent = recipe.title;

      const heroDesc = document.querySelector(".recipe-hero-description");
      if (heroDesc) heroDesc.textContent = recipe.desc;

      const difficultyBadge = document.querySelector(".difficulty-badge");
      if (difficultyBadge) difficultyBadge.textContent = recipe.difficulty;

      const ecoBadge = document.querySelector(".eco-badge");
      if (ecoBadge) ecoBadge.textContent = `🌱 +50 Points`;

      // --- Stats ---
      const statTime = document.querySelector(".recipe-stats .stat-item:nth-child(1) .stat-value");
      if (statTime) statTime.textContent = recipe.time;

      const statServings = document.querySelector(".recipe-stats .stat-item:nth-child(2) .stat-value");
      if (statServings) statServings.textContent = recipe.servings;

      const statCO2 = document.querySelector(".eco-stat .stat-value");
      if (statCO2) statCO2.textContent = "~ 40%";

      const carbonDesc = document.querySelector(".carbon-footprint .impact-description");
      if (carbonDesc) carbonDesc.textContent = `This recipe has 40% lower carbon footprint than ordering takeout 🌍`;

      const ecoPoints = document.querySelector(".impact-value");
      if (ecoPoints) ecoPoints.textContent = `+50 Eco Points`;

      // --- Ingredients ---
      const ingredientsList = document.getElementById("ingredientsList");
      const missingTags = document.getElementById("missingTags");
      if (ingredientsList) ingredientsList.innerHTML = "";
      if (missingTags) missingTags.innerHTML = "";

      const userIngredients = JSON.parse(localStorage.getItem("userIngredients")) || [];
      let availableCount = 0;

      recipe.ingredients.forEach(ing => {
        if (ingredientsList) {
          const div = document.createElement("div");
          div.className = "ingredient-item";
          div.textContent = ing;

          if (userIngredients.includes(ing.toLowerCase())) {
            div.classList.add("available");
            availableCount++;
          } else if (missingTags) {
            const span = document.createElement("span");
            span.className = "missing-tag";
            span.textContent = ing;
            missingTags.appendChild(span);
          }

          ingredientsList.appendChild(div);
        }
      });

      const availableEl = document.getElementById("availableCount");
      if (availableEl) availableEl.textContent = availableCount;

      const totalEl = document.getElementById("totalCount");
      if (totalEl) totalEl.textContent = recipe.ingredients.length;

      // --- Cooking Steps ---
      const stepsList = document.getElementById("stepsList");
      if (stepsList) stepsList.innerHTML = "";
      recipe.steps.forEach((step, index) => {
        if (stepsList) {
          const div = document.createElement("div");
          div.className = "step-item";
          div.innerHTML = `<strong>Step ${index + 1}:</strong> ${step}`;
          stepsList.appendChild(div);
        }
      });

     

      // --- Sustainable Tips ---
      const tipsList = document.getElementById("tipsList");
      if (tipsList) tipsList.innerHTML = "";

      if (recipe.tip) {
        // Ensure tip is an array
        const tipsArray = Array.isArray(recipe.tip) ? recipe.tip : [recipe.tip];

        tipsArray.forEach(tip => {
          const div = document.createElement("div");
          div.className = "tip-item";
          div.innerHTML = `${tip}`;
          tipsList.appendChild(div);
        });
      } else if (tipsList) {
        tipsList.innerHTML = "<p>No sustainable tips available.</p>";
      }

    })
    .catch(err => {
      console.error("Error loading recipe data:", err);
      const container = document.querySelector(".recipe-detail-container");
      if (container) container.innerHTML = `<p>Failed to load recipe data: ${err.message}</p>`;
    });
}

