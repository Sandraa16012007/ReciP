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



// frontend JavaScript

// Toggle mobile menu
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});


// Character Counter for textarea  (ingredients page)
const textarea = document.querySelector("textarea");
const charCount = document.querySelector(".char-count");

if (textarea && charCount) {
  textarea.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length}/500 characters`;
  });
}
