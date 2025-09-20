const Client = window.GradioClient;

// ------------------------------
// Global DOM Elements Cache
// ------------------------------
let mainTextarea;
let charCount;
let findRecipesBtn;
let fileInput;
let uploadStatus;
let spinner;

// ------------------------------
// Initialize DOM Elements
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initializeDOMElements();
  loadCommonIngredients();
  initializeEventListeners();
  
  // Check if we're on recipes page
  if (document.body.contains(document.querySelector(".cards"))) {
    loadRecipes();
  }
  
  // Check if we're on recipe detail page
  if (window.location.pathname.includes('recipe-info.html')) {
    initializeRecipeDetail();
  }
});

function initializeDOMElements() {
  mainTextarea = document.querySelector(".text-box textarea");
  charCount = document.querySelector(".char-count");
  findRecipesBtn = document.querySelector(".btn.primary");
  fileInput = document.getElementById("ingredient-upload");
  uploadStatus = document.getElementById("upload-status");
  spinner = document.getElementById("loading-spinner");
}

// ------------------------------
// Utility Functions
// ------------------------------
function showError(message) {
  console.error(message);
  if (uploadStatus) {
    uploadStatus.textContent = `⚠️ ${message}`;
  }
}

function updateCharacterCount() {
  if (mainTextarea && charCount) {
    charCount.textContent = `${mainTextarea.value.length}/500 characters`;
  }
}

// Ingredient matching system
function createIngredientMatcher() {
  const ingredientMap = {
    // Rice variations
    'rice': ['rice', 'basmati rice', 'jasmine rice', 'brown rice', 'white rice', 'boiled rice', 'steamed rice', 'fried rice', 'rice grain', 'long grain rice'],
    
    // Potato variations  
    'potato': ['potato', 'potatoes', 'mashed potato', 'mashed potatoes', 'boiled potato', 'boiled potatoes', 'baked potato', 'roasted potato', 'french fries', 'chips', 'hash browns'],
    
    // Chicken variations
    'chicken': ['chicken', 'chicken breast', 'chicken thigh', 'chicken leg', 'grilled chicken', 'roasted chicken', 'fried chicken', 'chicken fillet', 'boneless chicken', 'chicken pieces'],
    
    // Egg variations
    'egg': ['egg', 'eggs', 'boiled egg', 'fried egg', 'scrambled egg', 'poached egg', 'hard boiled egg', 'soft boiled egg', 'beaten egg'],
    
    // Tomato variations
    'tomato': ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'fresh tomato', 'ripe tomato', 'diced tomato', 'chopped tomato', 'tomato sauce', 'crushed tomato'],
    
    // Onion variations
    'onion': ['onion', 'onions', 'red onion', 'white onion', 'yellow onion', 'chopped onion', 'diced onion', 'sliced onion', 'caramelized onion'],
    
    // Cheese variations
    'cheese': ['cheese', 'cheddar cheese', 'mozzarella cheese', 'parmesan cheese', 'swiss cheese', 'cream cheese', 'cottage cheese', 'feta cheese', 'goat cheese'],
    
    // Bread variations
    'bread': ['bread', 'white bread', 'whole wheat bread', 'sourdough bread', 'rye bread', 'bread slice', 'bread loaf', 'toast', 'baguette', 'pita bread'],
    
    // Common cooking terms to ignore/simplify
    'pasta': ['pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'linguine', 'fettuccine', 'rigatoni', 'angel hair pasta'],
    'butter': ['butter', 'salted butter', 'unsalted butter', 'melted butter', 'softened butter'],
    'oil': ['oil', 'olive oil', 'vegetable oil', 'cooking oil', 'coconut oil', 'sunflower oil'],
    'garlic': ['garlic', 'garlic clove', 'minced garlic', 'chopped garlic', 'garlic powder'],
    'salt': ['salt', 'sea salt', 'table salt', 'kosher salt', 'rock salt'],
    'pepper': ['pepper', 'black pepper', 'white pepper', 'ground pepper', 'cracked pepper']
  };

  // Create reverse lookup for quick matching
  const reverseMap = {};
  Object.keys(ingredientMap).forEach(baseIngredient => {
    ingredientMap[baseIngredient].forEach(variation => {
      reverseMap[variation.toLowerCase()] = baseIngredient;
    });
  });

  return {
    // Find base ingredient from user input
    findBaseIngredient: function(userInput) {
      const cleanInput = userInput.toLowerCase().trim();
      
      // Direct match
      if (reverseMap[cleanInput]) {
        return reverseMap[cleanInput];
      }
      
      // Partial match - check if user input contains any known ingredient
      for (const [baseIngredient, variations] of Object.entries(ingredientMap)) {
        for (const variation of variations) {
          if (cleanInput.includes(variation.toLowerCase()) || variation.toLowerCase().includes(cleanInput)) {
            return baseIngredient;
          }
        }
      }
      
      // No match found, return original
      return cleanInput;
    },
    
    // Check if user ingredient matches recipe ingredient
    matchesRecipeIngredient: function(userIngredient, recipeIngredient) {
      const userBase = this.findBaseIngredient(userIngredient);
      const recipeBase = this.findBaseIngredient(recipeIngredient);
      
      // Direct base match
      if (userBase === recipeBase) return true;
      
      // Check if either contains the other
      const userLower = userIngredient.toLowerCase();
      const recipeLower = recipeIngredient.toLowerCase();
      
      return userLower.includes(recipeLower) || recipeLower.includes(userLower);
    }
  };
}

const ingredientMatcher = createIngredientMatcher();

function addIngredientsToTextarea(newIngredients) {
  if (!mainTextarea || !Array.isArray(newIngredients)) return;
  
  const currentText = mainTextarea.value.trim();
  let currentIngredients = [];
  
  if (currentText) {
    currentIngredients = currentText.split(",").map(i => i.trim().toLowerCase());
  }
  
  const combinedIngredients = Array.from(new Set([
    ...currentIngredients,
    ...newIngredients.map(i => i.toLowerCase())
  ]));
  
  mainTextarea.value = combinedIngredients.join(", ");
  updateCharacterCount();
}

// ------------------------------
// Load Common Ingredients from data.json
// ------------------------------
function loadCommonIngredients() {
  fetch("../assets/data.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load ingredients data");
      return res.json();
    })
    .then(data => {
      if (!data.commonIngredients) {
        throw new Error("Common ingredients not found in data");
      }
      
      renderCommonIngredients(data.commonIngredients);
    })
    .catch(err => {
      console.error("Error loading common ingredients:", err);
      // Don't show error to user for this non-critical feature
    });
}

function renderCommonIngredients(commonIngredients) {
  const tagsContainer = document.querySelector(".common-ingredients .tags");
  if (!tagsContainer) return;
  
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

  tagsContainer.innerHTML = "";

  commonIngredients.forEach(item => {
    const span = document.createElement("span");
    span.textContent = `${emojiMap[item] || "🍴"} ${item}`;
    span.style.cursor = "pointer";

    span.addEventListener("click", () => {
      addIngredientsToTextarea([item]);
    });

    tagsContainer.appendChild(span);
  });
}

// ------------------------------
// Event Listeners Initialization
// ------------------------------
function initializeEventListeners() {
  // Find Recipes Button
  if (findRecipesBtn) {
    findRecipesBtn.addEventListener("click", handleFindRecipes);
  }

  // Mobile Menu Toggle
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Character Counter for textarea
  if (mainTextarea) {
    mainTextarea.addEventListener("input", updateCharacterCount);
  }

  // File Upload for AI Ingredient Detection
  if (fileInput) {
    fileInput.addEventListener("change", handleImageUpload);
  }
}

// ------------------------------
// Find Recipes Handler
// ------------------------------
function handleFindRecipes(e) {
  e.preventDefault();

  if (!mainTextarea) {
    showError("Text input not found");
    return;
  }

  const ingredients = mainTextarea.value
    .split(",")
    .map(i => i.trim().toLowerCase())
    .filter(i => i);

  if (ingredients.length === 0) {
    alert("Please enter at least one ingredient!");
    return;
  }

  // Save to localStorage
  try {
    localStorage.setItem("userIngredients", JSON.stringify(ingredients));
    // Redirect to recipes page
    window.location.href = "recipes.html";
  } catch (err) {
    console.error("Error saving ingredients:", err);
    showError("Failed to save ingredients");
  }
}

// ------------------------------
// Hugging Face AI Ingredient Detection
// ------------------------------
async function handleImageUpload() {
  const file = fileInput.files[0];
  if (!file) return;

  if (!uploadStatus || !spinner) {
    console.error("Upload UI elements not found");
    return;
  }

  uploadStatus.textContent = "Detecting ingredients...";
  spinner.style.display = "block";

  try {
    // Connect to Hugging Face Space
    const client = await Client.connect("sandra-1601/food-ingredient-detector");

    // Run prediction
    const result = await client.predict("/predict", {
      image: file,
    });

    console.log("🔎 Full API Response:", result);

    spinner.style.display = "none";

    if (!result || !result.data || !Array.isArray(result.data)) {
      uploadStatus.textContent = "⚠️ Unexpected API response!";
      return;
    }

    // The API returns nested arrays: result.data[0] contains the predictions
    let predictions = result.data[0];
    
    if (!Array.isArray(predictions)) {
      uploadStatus.textContent = "⚠️ No predictions found in response!";
      return;
    }

    // Extract ingredient labels from the prediction objects
    const detected = [
      ...new Set(
        predictions
          .filter(item => item && typeof item === 'object' && item.label) // Only valid prediction objects
          .map(item => item.label.toLowerCase().trim()) // Extract the label
          .filter(label => label && label.length > 0) // Remove empty labels
      )
    ];

    console.log("🥗 Final detected ingredients:", detected);

    if (detected.length > 0) {
      addIngredientsToTextarea(detected);
      uploadStatus.textContent = "✅ Ingredients detected and added!";
    } else {
      uploadStatus.textContent = "⚠️ No clear ingredients found! Try typing them manually";
    }

  } catch (err) {
    console.error("❌ Error:", err);
    spinner.style.display = "none";
    uploadStatus.textContent = "⚠️ Something went wrong with ingredient detection! Try typing them manually";
  }
}

// ------------------------------
// Load Recipes on recipes.html
// ------------------------------
function loadRecipes() {
  fetch("../assets/data.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load recipes data");
      return res.json();
    })
    .then(data => {
      if (!data.recipes) {
        throw new Error("Recipes not found in data");
      }
      
      renderRecipes(data.recipes);
    })
    .catch(err => {
      console.error("Error loading recipes:", err);
      const cardsContainer = document.querySelector(".cards");
      if (cardsContainer) {
        cardsContainer.innerHTML = `<p style="font-size:28px;font-weight:bold;color:#ff9019;text-align:center;margin-top:10px;margin-bottom:50px;">Failed to load recipes. Please try again later.</p>`;
      }
    });
}

function renderRecipes(recipes) {
  const cardsContainer = document.querySelector(".cards");
  if (!cardsContainer) return;

  let userIngredients = [];
  try {
    userIngredients = JSON.parse(localStorage.getItem("userIngredients")) || [];
  } catch (err) {
    console.error("Error reading user ingredients:", err);
  }

  cardsContainer.innerHTML = "";

  // Use smart ingredient matching
  const filtered = recipes.filter(recipe => {
    if (!recipe.ingredients) return false;
    
    return recipe.ingredients.some(recipeIngredient => 
      userIngredients.some(userIngredient => 
        ingredientMatcher.matchesRecipeIngredient(userIngredient, recipeIngredient)
      )
    );
  });

  if (filtered.length === 0) {
    cardsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="font-size:28px;font-weight:bold;color:#ff9019;margin-bottom:20px;">No recipes found for your ingredients!</p>
        <p style="font-size:16px;color:#666;">Try adding more common ingredients like rice, chicken, or vegetables.</p>
      </div>`;
    return;
  }

  // Sort by relevance (number of matching ingredients)
  const sortedFiltered = filtered.sort((a, b) => {
    const aMatches = a.ingredients.filter(recipeIng => 
      userIngredients.some(userIng => 
        ingredientMatcher.matchesRecipeIngredient(userIng, recipeIng)
      )
    ).length;
    
    const bMatches = b.ingredients.filter(recipeIng => 
      userIngredients.some(userIng => 
        ingredientMatcher.matchesRecipeIngredient(userIng, recipeIng)
      )
    ).length;
    
    return bMatches - aMatches; // Sort by most matches first
  });

  sortedFiltered.forEach(recipe => {
    const card = document.createElement("div");
    card.classList.add("card");

    // Calculate match percentage for display
    const matchingIngredients = recipe.ingredients.filter(recipeIng => 
      userIngredients.some(userIng => 
        ingredientMatcher.matchesRecipeIngredient(userIng, recipeIng)
      )
    ).length;
    
    const matchPercentage = Math.round((matchingIngredients / recipe.ingredients.length) * 100);

    card.innerHTML = `
      <div class="card-header">
        <img class="recipe-image" src="../assets/${recipe.image}" alt="${recipe.title}">
        <span class="badge">${recipe.difficulty || 'Medium'}</span>
        <span class="match-badge" style="position: absolute; top: 10px; left: 10px; background: #16a34a; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
          ${matchPercentage}% match
        </span>
      </div>
      <div class="card-body">
        <h3>${recipe.title}</h3>
        <div class="meta">⏱ ${recipe.time} • 🍽 ${recipe.servings} servings</div>
        <p class="desc">${recipe.desc}</p>
        <div class="tags">
          ${recipe.ingredients.map(ing => {
            const isMatched = userIngredients.some(userIng => 
              ingredientMatcher.matchesRecipeIngredient(userIng, ing)
            );
            return `<span class="tag ${isMatched ? 'matched' : ''}" style="${isMatched ? 'background: #dcfce7; color: #166534; border: 1px solid #16a34a;' : ''}">${ing}</span>`;
          }).join("")}
        </div>
        <a href="recipe-info.html?id=${encodeURIComponent(recipe.id)}" class="recipe-link">
          View Recipe <span class="link-arrow">→</span>
        </a>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}

// ------------------------------
// Recipe Detail Page Logic
// ------------------------------
function initializeRecipeDetail() {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get("id");
  
  if (!recipeId) {
    showRecipeError("Recipe ID not found in URL");
    return;
  }

  fetch("../assets/data.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch recipe data");
      return res.json();
    })
    .then(data => {
      if (!data.recipes) throw new Error("No recipes found in data");

      const recipe = data.recipes.find(r => r.id.toString() === recipeId);
      if (!recipe) {
        showRecipeError("Recipe not found");
        return;
      }

      renderRecipeDetail(recipe);
    })
    .catch(err => {
      console.error("Error loading recipe data:", err);
      showRecipeError(`Failed to load recipe: ${err.message}`);
    });
}

function showRecipeError(message) {
  const container = document.querySelector(".recipe-detail-container");
  if (container) {
    container.innerHTML = `<p style="text-align: center; color: #ff9019; font-size: 1.5rem;">${message}</p>`;
  }
}

function renderRecipeDetail(recipe) {
  // Update Hero Section
  updateElement(".hero-image", el => {
    el.src = `../assets/${recipe.image}`;
    el.alt = recipe.title;
  });
  
  updateElement(".recipe-hero-title", el => el.textContent = recipe.title);
  updateElement(".recipe-hero-description", el => el.textContent = recipe.desc);
  updateElement(".difficulty-badge", el => el.textContent = recipe.difficulty);
  updateElement(".eco-badge", el => el.textContent = "🌱 +50 Points");

  // Update Stats
  updateElement(".recipe-stats .stat-item:nth-child(1) .stat-value", el => el.textContent = recipe.time);
  updateElement(".recipe-stats .stat-item:nth-child(2) .stat-value", el => el.textContent = recipe.servings);
  updateElement(".eco-stat .stat-value", el => el.textContent = "~ 40%");
  updateElement(".carbon-footprint .impact-description", el => 
    el.textContent = "This recipe has 40% lower carbon footprint than ordering takeout 🌍"
  );
  updateElement(".impact-value", el => el.textContent = "+50 Eco Points");

  // Render Ingredients
  renderRecipeIngredients(recipe);
  
  // Render Cooking Steps
  renderCookingSteps(recipe);
  
  // Render Sustainable Tips
  renderSustainableTips(recipe);
}

function updateElement(selector, updateFn) {
  const element = document.querySelector(selector);
  if (element && updateFn) {
    updateFn(element);
  }
}

function renderRecipeIngredients(recipe) {
  const ingredientsList = document.getElementById("ingredientsList");
  const missingTags = document.getElementById("missingTags");
  
  if (!ingredientsList) return;
  
  ingredientsList.innerHTML = "";
  if (missingTags) missingTags.innerHTML = "";

  let userIngredients = [];
  try {
    userIngredients = JSON.parse(localStorage.getItem("userIngredients")) || [];
  } catch (err) {
    console.error("Error reading user ingredients:", err);
  }

  let availableCount = 0;

  // Use ingredientsWithQuantity if available, otherwise fall back to ingredients
  const ingredientsToRender = recipe.ingredientsWithQuantity || 
    (recipe.ingredients ? recipe.ingredients.map(ing => ({name: ing, quantity: "", unit: ""})) : []);

  if (ingredientsToRender.length > 0) {
    ingredientsToRender.forEach(ingredientObj => {
      const div = document.createElement("div");
      div.className = "ingredient-item";
      
      // Format ingredient display with quantity
      const ingredientName = ingredientObj.name || ingredientObj;
      const quantity = ingredientObj.quantity || "";
      const unit = ingredientObj.unit || "";
      
      // Create display text with quantity and unit
      let displayText = ingredientName;
      if (quantity && quantity !== "to taste") {
        displayText = `${quantity}${unit ? ' ' + unit : ''} ${ingredientName}`;
      } else if (quantity === "to taste") {
        displayText = `${ingredientName} (${quantity})`;
      }
      
      div.innerHTML = `
        <div class="ingredient-content">
          <span class="ingredient-name">${displayText}</span>
        </div>
      `;

      // Use smart matching to check if user has this ingredient
      const isAvailable = userIngredients.some(userIngredient => 
        ingredientMatcher.matchesRecipeIngredient(userIngredient, ingredientName)
      );

      if (isAvailable) {
        div.classList.add("available");
        availableCount++;
        
        // Show which user ingredient matched
        const matchingUserIngredient = userIngredients.find(userIng => 
          ingredientMatcher.matchesRecipeIngredient(userIng, ingredientName)
        );
        if (matchingUserIngredient !== ingredientName.toLowerCase()) {
          div.title = `✅ You have: ${matchingUserIngredient}`;
        } else {
          div.title = `✅ You have this ingredient`;
        }
      } else if (missingTags) {
        const span = document.createElement("span");
        span.className = "missing-tag";
        span.textContent = ingredientName;
        missingTags.appendChild(span);
      }

      ingredientsList.appendChild(div);
    });
  }

  // Update counters based on unique ingredient names (not quantities)
  const uniqueIngredients = recipe.ingredients ? recipe.ingredients.length : ingredientsToRender.length;
  updateElement("#availableCount", el => el.textContent = availableCount);
  updateElement("#totalCount", el => el.textContent = uniqueIngredients);
}

function renderCookingSteps(recipe) {
  const stepsList = document.getElementById("stepsList");
  if (!stepsList || !recipe.steps) return;
  
  stepsList.innerHTML = "";
  recipe.steps.forEach((step, index) => {
    const div = document.createElement("div");
    div.className = "step-item";
    div.innerHTML = `<strong>Step ${index + 1}:</strong> ${step}`;
    stepsList.appendChild(div);
  });
}

function renderSustainableTips(recipe) {
  const tipsList = document.getElementById("tipsList");
  if (!tipsList) return;
  
  tipsList.innerHTML = "";

  if (recipe.tip) {
    const tipsArray = Array.isArray(recipe.tip) ? recipe.tip : [recipe.tip];

    tipsArray.forEach(tip => {
      const div = document.createElement("div");
      div.className = "tip-item";
      div.innerHTML = tip;
      tipsList.appendChild(div);
    });
  } else {
    tipsList.innerHTML = "<p>No sustainable tips available.</p>";
  }
} 