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
      span.style.cursor = "pointer"; // make it clear it's clickable

      span.addEventListener("click", () => {
        let currentText = textarea.value.trim();
        if (currentText) {
          // Avoid duplicates
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




// On Find Recipes button click
const findRecipesBtn = document.querySelector(".btn.primary");
const textarea = document.querySelector(".text-box textarea");

if (findRecipesBtn) {
  findRecipesBtn.addEventListener("click", (e) => {
    e.preventDefault(); // stop instant redirect

    const ingredients = textarea.value
      .split(",")
      .map(i => i.trim().toLowerCase())
      .filter(i => i); // remove empty

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

if (document.body.contains(document.querySelector(".cards"))) {
  fetch("../assets/data.json")
    .then(res => res.json())
    .then(data => {
      const recipes = data.recipes; // make sure your data.json has a `recipes` array
      const cardsContainer = document.querySelector(".cards");

      // Get stored ingredients
      const userIngredients = JSON.parse(localStorage.getItem("userIngredients")) || [];

      // Clear default cards
      cardsContainer.innerHTML = "";

      // Filter recipes based on matching ingredients
      const filtered = recipes.filter(recipe =>
        recipe.ingredients.some(ing => userIngredients.includes(ing.toLowerCase()))
      );

      if (filtered.length === 0) {
        cardsContainer.innerHTML = `<p style="font-size: 28px; font-weight: bold; color: #ff9019ff; text-align: center; margin-top: 10px ; margin-bottom: 50px;">No recipes found for your ingredients!</p>`;
        return;
      }

      // Render filtered recipes
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
            <a href="#" class="recipe-link">
              View Recipe <span class="link-arrow">→</span>
            </a>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    })
    .catch(err => console.error("Error loading recipes:", err));
}




// frontend JavaScript

// Toggle mobile menu
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});


// Character Counter for textarea  (ingredients page)
const charCount = document.querySelector(".char-count");

if (textarea && charCount) {
  textarea.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length}/500 characters`;
  });
}
