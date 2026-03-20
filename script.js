// ========================================
// CONFIGURAÇÕES DA API
// ========================================
const API_KEY = 'd6034ac010f3fce6e88a7ac9c3f02326';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ========================================
// ELEMENTOS DOM
// ========================================
const mainContent = document.getElementById('mainContent');
const genresNav = document.getElementById('genresNav');
const mobileGenres = document.getElementById('mobileGenres');
const mobileMenu = document.getElementById('mobileMenu');
const movieModal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');

// Ano no footer
document.getElementById('year').textContent = new Date().getFullYear();

// ========================================
// CARREGAR GÊNEROS
// ========================================
async function loadGenres() {
  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
    const data = await res.json();
    const genres = data.genres.slice(0, 6);

    // Desktop
    genresNav.innerHTML = `
      <a href="trailers.html" class="nav-link">🎥 Trailers</a>
      ${genres.map(g => `<button onclick="loadByGenre(${g.id}, '${g.name}')">${g.name}</button>`).join('')}
    `;

    // Mobile
    mobileGenres.innerHTML = data.genres.map(g => 
      `<button onclick="loadByGenre(${g.id}, '${g.name}'); toggleMenu()">${g.name}</button>`
    ).join('');

  } catch (error) {
    console.error('Erro ao carregar gêneros:', error);
  }
}

// ========================================
// CARREGAR HOME
// ========================================
async function loadHome() {
  mainContent.innerHTML = '<div class="loading">🎬 Carregando filmes...</div>';
  
  try {
    const [nowPlaying, popular, topRated] = await Promise.all([
      fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`).then(r => r.json())
    ]);

    mainContent.innerHTML = `
      <section class="section">
        <h2 class="section-title">🎬 Em Cartaz</h2>
        <div class="movies-grid">
          ${nowPlaying.results.slice(0, 10).map(movie => createMovieCard(movie)).join('')}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">🔥 Mais Populares</h2>
        <div class="movies-grid">
          ${popular.results.slice(0, 10).map(movie => createMovieCard(movie)).join('')}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">⭐ Melhor Avaliados</h2>
        <div class="movies-grid">
          ${topRated.results.slice(0, 10).map(movie => createMovieCard(movie)).join('')}
        </div>
      </section>
    `;

  } catch (error) {
    mainContent.innerHTML = '<div class="error">❌ Erro ao carregar filmes. Verifique sua conexão.</div>';
    console.error('Erro:', error);
  }
}

// ========================================
// CRIAR CARD DE FILME
// ========================================
function createMovieCard(movie) {
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const poster = movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return `
    <div class="movie-card" onclick="loadMovieDetails(${movie.id})">
      <div class="movie-poster">
        ${poster 
          ? `<img src="${poster}" alt="${movie.title}" loading="lazy">` 
          : '<div class="no-image">🎬</div>'
        }
        <div class="movie-rating">⭐ ${rating}</div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-year">📅 ${year}</p>
      </div>
    </div>
  `;
}

// ========================================
// CARREGAR POR GÊNERO
// ========================================
async function loadByGenre(genreId, genreName) {
  mainContent.innerHTML = '<div class="loading">🎭 Carregando filmes...</div>';
  
  try {
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=${genreId}`);
    const data = await res.json();

    mainContent.innerHTML = `
      <section class="section">
        <h2 class="section-title">🎭 ${genreName}</h2>
        <div class="movies-grid">
          ${data.results.map(movie => createMovieCard(movie)).join('')}
        </div>
      </section>
    `;

  } catch (error) {
    mainContent.innerHTML = '<div class="error">❌ Erro ao carregar filmes.</div>';
    console.error('Erro:', error);
  }
}

// ========================================
// CARREGAR DETALHES DO FILME
// ========================================
async function loadMovieDetails(movieId) {
  movieModal.classList.add('active');
  modalBody.innerHTML = '<div class="loading">🎬 Carregando detalhes...</div>';
  document.body.style.overflow = 'hidden';

  try {
    const [movie, credits, videos] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`).then(r => r.json())
    ]);

    const trailers = videos.results.filter(v => 
      (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
    );
    
    const cast = credits.cast?.slice(0, 10) || [];
    const poster = movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null;
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

    modalBody.innerHTML = `
      <div class="modal-body">
        <div class="modal-poster">
          ${poster ? `<img src="${poster}" alt="${movie.title}">` : '<div class="no-image">🎬</div>'}
        </div>
        
        <div class="modal-info">
          <h2 class="modal-title">${movie.title}</h2>
          
          <div class="modal-meta">
            <span class="rating">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
            <span>📅 ${year}</span>
            <span>⏱️ ${movie.runtime || 'N/A'} min</span>
            <span>📌 ${movie.status || 'N/A'}</span>
          </div>

          <div class="modal-genres">
            ${movie.genres?.map(g => `<span>${g.name}</span>`).join('') || ''}
          </div>

          <h3>📖 Sinopse</h3>
          <p class="modal-overview">${movie.overview || 'Sinopse não disponível.'}</p>

          ${trailers.length > 0 ? `
            <div class="modal-trailers">
              <h3>🎥 ${trailers.length > 1 ? 'Trailers e Teasers' : 'Trailer'}</h3>
              <div class="trailers-list">
                ${trailers.map((trailer, index) => `
                  <div class="trailer-item">
                    ${index === 0 ? `<h4>${trailer.name || 'Trailer Oficial'}</h4>` : ''}
                    <div class="trailer-container">
                      <iframe 
                        src="https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1" 
                        title="${trailer.name || 'Trailer'}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p style="color: var(--text-gray); margin: 20px 0;">😕 Nenhum trailer disponível</p>'}

          ${cast.length > 0 ? `
            <div class="modal-cast">
              <h3>🎭 Elenco Principal</h3>
              <div class="cast-list">
                ${cast.map(actor => `
                  <div class="cast-item">
                    ${actor.profile_path 
                      ? `<img src="${IMAGE_BASE}${actor.profile_path}" alt="${actor.name}">` 
                      : '<div class="no-photo">👤</div>'
                    }
                    <p class="cast-name">${actor.name}</p>
                    <p class="cast-character">${actor.character}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

  } catch (error) {
    modalBody.innerHTML = '<div class="error">❌ Erro ao carregar detalhes.</div>';
    console.error('Erro:', error);
  }
}

// ========================================
// FECHAR MODAL
// ========================================
function closeModal() {
  movieModal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora
movieModal.addEventListener('click', (e) => {
  if (e.target === movieModal) closeModal();
});

// Fechar com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && movieModal.classList.contains('active')) {
    closeModal();
  }
});

// ========================================
// BUSCA
// ========================================
function handleSearch(event) {
  event.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  if (query) loadSearch(query);
}

async function loadSearch(query) {
  mainContent.innerHTML = '<div class="loading">🔍 Buscando...</div>';
  
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
    const data = await res.json();

    mainContent.innerHTML = `
      <section class="section">
        <h2 class="section-title">🔍 Resultados para "${query}"</h2>
        ${data.results.length > 0 
          ? `<div class="movies-grid">${data.results.map(movie => createMovieCard(movie)).join('')}</div>`
          : '<p class="error">😕 Nenhum filme encontrado.</p>'
        }
      </section>
    `;

  } catch (error) {
    mainContent.innerHTML = '<div class="error">❌ Erro na busca.</div>';
    console.error('Erro:', error);
  }
}

// ========================================
// MENU MOBILE
// ========================================
function toggleMenu() {
  mobileMenu.classList.toggle('active');
}

// ========================================
// INICIALIZAR
// ========================================
loadGenres();
loadHome();
