
// Selectors
const allProductsLink = document.getElementById("all-products-link");
const categoryButtons = document.querySelectorAll(".ellipse > div");
const items = document.querySelectorAll(".Item_container");

// Remove active only from categories
function clearCategoryActive() {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
}

// Show ALL products (pero walang active highlight dito)
allProductsLink.addEventListener("click", (e) => {
    e.preventDefault();

    clearCategoryActive(); // clear only category highlights

    items.forEach(item => item.style.display = "flex");

    window.scrollTo({
        top: document.querySelector(".ItemsWrapper").offsetTop,
        behavior: "smooth"
    });
});

// CATEGORY FILTER
categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const category = btn.dataset.category;

        clearCategoryActive();
        btn.classList.add("active"); // highlight category

        items.forEach(item => {
            item.style.display = item.dataset.category === category ? "flex" : "none";
        });

        window.scrollTo({
            top: document.querySelector(".ItemsWrapper").offsetTop,
            behavior: "smooth"
        });
    });
});
