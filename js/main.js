const PROJECT_ID = '26imwxcy';
const DATASET = 'production';

// GROQ-запит для отримання гравців разом із посиланням на фотографію
const QUERY = encodeURIComponent('*[_type == "player"]{ _id, title, number, role, "image": image.asset->url }');

// Резервні дані на випадок відсутності записів у Sanity
const defaultPlayers = [
  { title: "Олексій Коваль", number: 1, role: "setter", image: null },
  { title: "Максим Сидоренко", number: 7, role: "spiker", image: null },
  { title: "Дмитро Бойко", number: 10, role: "middle", image: null }
];

document.addEventListener("DOMContentLoaded", () => {
  fetchPlayers();
});

function fetchPlayers() {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${QUERY}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.result && data.result.length > 0) {
        renderPlayers(data.result);
      } else {
        renderPlayers(defaultPlayers);
      }
      setupFilters();
    })
    .catch(err => {
      console.error('Помилка завантаження даних із Sanity:', err);
      renderPlayers(defaultPlayers);
      setupFilters();
    });
}

function renderPlayers(players) {
  const grid = document.getElementById("team-grid");
  if (!grid) return;

  grid.innerHTML = players.map(player => `
    <div class="player-card" data-role="${player.role || 'all'}">
      <div class="player-photo">
        <img src="${player.image || 'images/default-player.jpg'}" alt="${player.title}">
        <span class="player-number">#${player.number || '-'}</span>
      </div>
      <div class="player-info">
        <h3>${player.title}</h3>
        <p class="player-role">${translateRole(player.role)}</p>
      </div>
    </div>
  `).join("");
}

function translateRole(role) {
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
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const role = btn.dataset.role;
      const cards = document.querySelectorAll(".player-card");

      cards.forEach(card => {
        if (role === "all" || card.dataset.role === role) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}