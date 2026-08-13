// Ano automático no footer
document.getElementById("year").textContent = new Date().getFullYear();


// efeito simples no scroll (header leve sombra)
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if(window.scrollY > 50){
    header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
  } else {
    header.style.boxShadow = "none";
  }
});


// animação leve no hero (entrada suave)
window.addEventListener("load", () => {
  const heroText = document.querySelector(".hero-content");
  heroText.style.opacity = "0";
  heroText.style.transform = "translateY(20px)";

  setTimeout(() => {
    heroText.style.transition = "1s ease";
    heroText.style.opacity = "1";
    heroText.style.transform = "translateY(0)";
  }, 200);
});