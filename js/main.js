const defaultPlayers = [
  { title: "Олексій Коваль", number: 7, role: "setter", roleName: "Зв'язуючий (Капітан)", image: "" },
  { title: "Максим Бойко", number: 10, role: "spiker", roleName: "Догравальник", image: "" },
  { title: "Дмитро Швець", number: 15, role: "middle", roleName: "Центральний блокуючий", image: "" },
  { title: "Артем Кравченко", number: 1, role: "libero", roleName: "Ліберо", image: "" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderPlayers(defaultPlayers);
  setupFilters();
});

function renderPlayers(players) {
  const grid = document.getElementById("players-grid");
  if (!grid) return;

  grid.innerHTML = players.map(player => `
    <div class="player-card" data-role="${player.role}">
      <div class="player-number">#${player.number}</div>
      ${player.image 
        ? `<img src="${player.image}" alt="${player.title}" class="player-img">`
        : `<div class="player-img">🏐</div>`
      }
      <div class="player-name">${player.title}</div>
      <div class="player-role">${player.roleName || getRoleName(player.role)}</div>
    </div>
  `).join('');
}

function getRoleName(role) {
  const roles = {
    setter: "Зв'язуючий",
    spiker: "Догравальник",
    middle: "Центральний блокуючий",
    opposite: "Діагональний",
    libero: "Ліберо"
  };
  return roles[role] || "Гравець";
}

function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const filter = e.target.getAttribute('data-filter');
      const cards = document.querySelectorAll('.player-card');

      cards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-role') === filter) {
          card.style.display = 'block';
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}