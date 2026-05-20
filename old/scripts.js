const $ = (sel, el=document) => el.querySelector(sel);

    // Sanity checks (simple "test cases" for required DOM structure)
    // These help catch regressions early in development.
    window.addEventListener('DOMContentLoaded', () => {
      console.assert(!!document.querySelector('aside.sidebar'), 'Sidebar should exist');
      console.assert(!!document.querySelector('img.avatar'), 'Avatar image should exist');
      console.assert(!!document.querySelector('#about'), 'About section should exist');
      console.assert(!!document.querySelector('#experience'), 'Experience section should exist');
      console.assert(!!document.querySelector('#projects'), 'Projects section should exist');
      console.assert(!!document.querySelector('#education'), 'Education section should exist');
      console.assert(!!document.querySelector('#skills'), 'Skills section should exist');

      // Theme toggle
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const saved = localStorage.getItem('theme');
      if(saved === 'dark' || (!saved && prefersDark)) document.documentElement.classList.add('dark');
      const themeBtn = $('#themeToggle');
      if(themeBtn){
        themeBtn.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
          themeBtn.setAttribute('aria-pressed', String(isDark));
        });
      }

      // Footer year
      const y = $('#year');
      if(y) y.textContent = new Date().getFullYear();

      // Smooth scroll for internal nav
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href').slice(1);
          const el = document.getElementById(id);
          if(el){ e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
      });
    });

function applyMobileStyles() {
    if (/iPhone|iPod|Android/i.test(navigator.userAgent)) {
        document.body.style.zoom = "90%";
    }
}

// News section toggle functionality
let newsExpanded = false;

function toggleNews() {
    const hiddenItems = document.querySelectorAll('.news-item.hidden');
    const toggleBtn = document.getElementById('news-toggle-btn');
    
    if (!newsExpanded) {
        // Show all hidden items
        hiddenItems.forEach(item => {
            item.classList.remove('hidden');
        });
        toggleBtn.textContent = 'Show less';
        newsExpanded = true;
    } else {
        // Hide items beyond the first 3
        const allItems = document.querySelectorAll('.news-item');
        for (let i = 3; i < allItems.length; ++i) {
            allItems[i].classList.add('hidden');
        }
        toggleBtn.textContent = 'Show more';
        newsExpanded = false;
    }
}

// Call the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", applyMobileStyles);