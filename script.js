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
      "Eggs": "🥚",
      "Pasta": "🍝",
      "Potatoes": "🥔",
      "Onions": "🧅",
      "Garlic": "🧄",
      "Tomatoes": "🍅"
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
            <a href="#" class="recipe-link">View Recipe <span class="link-arrow">→</span></a>
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

// Hugging Face API config
const HF_API_TOKEN = "YOUR_HF_API_TOKEN"; // Replace with your token
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/openfoodfacts/ingredient-detection";

if (fileInput) {
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadStatus.classList.remove("show");
    uploadStatus.textContent = "Detecting ingredients...";
    spinner.style.display = "block";
    uploadStatus.classList.add("show");

    try {
      const response = await fetch(HF_MODEL_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_TOKEN}`
        },
        body: file
      });

      const result = await response.json();

      spinner.style.display = "none"; // hide spinner after response

      if (result.error) {
        uploadStatus.textContent = "⚠️ Error: " + result.error;
        uploadStatus.classList.add("show");
        return;
      }

      const detected = result.filter(item => item.score > 0.3).map(item => item.label);

      if (detected.length > 0) {
        const current = textarea.value.split(",").map(i => i.trim().toLowerCase());
        const combined = Array.from(new Set([...current, ...detected.map(i => i.toLowerCase())]));
        textarea.value = combined.join(", ");

        charCount.textContent = `${textarea.value.length}/500 characters`;
        uploadStatus.textContent = "✅ Ingredients detected and added above!";
      } else {
        uploadStatus.textContent = "⚠️ No ingredients detected. Please type them manually!";
      }

      uploadStatus.classList.add("show");

    } catch (err) {
      console.error("Error:", err);
      spinner.style.display = "none";
      uploadStatus.textContent = "⚠️ Something went wrong!";
      uploadStatus.classList.add("show");
    }

  });
}





