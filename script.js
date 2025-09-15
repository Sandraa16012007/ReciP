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
