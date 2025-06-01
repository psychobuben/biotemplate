const sections = ['section1', 'section1-1', 'section1-2','section1-3', 'section1-4', 'section1-5', 'section1-6','section1-7', 'section3'];
let currentSectionIndex = 0;
const loadedSections = new Set();
let observer; // musíme mít globálně, kvůli případnému odpojení

function loadSection(name, append = false) {
  if (append && loadedSections.has(name)) return Promise.resolve();

  return fetch(`sections/${name}.html`)
    .then(response => {
      if (!response.ok) throw new Error('Sekce nenalezena.');
      return response.text();
    })
    .then(html => {
      const content = document.getElementById('content');

      const sectionContainer = document.createElement('section');
      sectionContainer.id = name;
      sectionContainer.classList.add('section-wrapper');
      sectionContainer.innerHTML = html;

      if (append) {
        content.appendChild(sectionContainer);
      } else {
        content.innerHTML = '';
        content.appendChild(sectionContainer);
      }

      loadedSections.add(name);
      currentSectionIndex = sections.indexOf(name);
      updateActiveNav(name);

      
    })
    .catch(error => {
      console.error(error);
      document.getElementById('content').innerHTML = `<p>Chyba načítání: ${error.message}</p>`;
    });
}

function updateActiveNav(name) {
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.section === name);
  });
}

// Navigace klikem
document.querySelectorAll('nav a[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = e.target.getAttribute('data-section');
    const target = document.getElementById(section);
    if (target) {
      history.pushState(null, '', `#${section}`);
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Načti všechny sekce po sobě
async function loadAllSectionsInOrder() {
  const content = document.getElementById('content');
  content.innerHTML = '';
  loadedSections.clear();

  // Předem odpojíme observer, aby nezachytil „náhodný“ stav
  if (observer) observer.disconnect();

  for (const section of sections) {
    await loadSection(section, true);
  }

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView();
      updateActiveNav(hash);
    }
  }

  // Až po načtení všeho znovu zapneme observer
  setupIntersectionObserver();
}

// Připojování observeru na všechny sekce
function setupIntersectionObserver() {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        history.replaceState(null, '', `#${id}`);
        updateActiveNav(id);
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.3 // upravit podle výšky sekcí
  });

  document.querySelectorAll('.section-wrapper').forEach(section => {
    observer.observe(section);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllSectionsInOrder();
});
