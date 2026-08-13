// EPASB-EP — comportamentos partilhados

document.addEventListener('DOMContentLoaded', () => {
  // Ano no rodapé
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menu hambúrguer (mobile)
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.nav-mobile');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Fecha o menu ao clicar num link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Contadores animados (EPASB em números)
  const counters = document.querySelectorAll('.counter');
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(progress * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(c => observer.observe(c));
  }

  // Modais do organigrama
  const openers = document.querySelectorAll('[data-open-modal]');
  if (openers.length) {
    const closeModal = (modal) => modal.classList.remove('open');

    openers.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById(btn.dataset.openModal);
        if (modal) modal.classList.add('open');
      });
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
    });

    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(closeModal);
      }
    });
  }
});