
// carousel.js

let slides = document.querySelectorAll(".display");
let index = 0;

function showSlide(i) {
  slides.forEach(slide => slide.classList.remove("active"));
  slides[i].classList.add("active");
}

document.getElementById("next").onclick = () => {
  index = (index + 1) % slides.length;
  showSlide(index);
};

document.getElementById("prev").onclick = () => {
  index = (index - 1 + slides.length) % slides.length;
  showSlide(index);
};

// Auto-slide every 5 seconds
setInterval(() => {
  index = (index + 1) % slides.length;
  showSlide(index);
}, 5000);
