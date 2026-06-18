// ⚠️ API KEY TMDB
const API_KEY = 'd6034ac010f3fce6e88a7ac9c3f02326';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Elementos DOM
const mainContent = document.getElementById('mainContent');
const genresNav = document.getElementById('genresNav');
const mobileGenres = document.getElementById('mobileGenres');
const mobileMenu = document.getElementById('mobileMenu');
const movieModal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const searchInput = document.getElementById('searchInput');
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const userDropdown = document.getElementById('userDropdown');
const userMenu = document.getElementById('userMenu');
const favCountEl = document.getElementById('fav-count');

// Estado do Usuário
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let favorites = currentUser ? JSON.parse(localStorage.getItem('favorites_' + currentUser.email)) || [] : [];

// Ano no footer
document.getElementById('year').textContent = new Date().getFullYear();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    loadHome();
    updateAuthUI();
});

// Toggle Menu Mobile
function toggleMenu() {
    mobileMenu.classList.toggle('active');
}

// Toggle User Dropdown
function toggleUserDropdown() {
    if (!currentUser) return;
    userDropdown.classList.toggle('active');
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// Carregar Gêneros
async function loadGenres() {
    try {
        const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
        const data = await res.json();
        const genres = data.genres.slice(0, 6);
        
        genresNav.innerHTML = genres.map(g => 
            `<button onclick="loadByGenre(${g.id}, '${g.name}')">${g.name}</button>`
        ).join('');
        
        mobileGenres.innerHTML = data.genres.map(g => 
            `<button onclick="loadByGenre(${g.id}, '${g.name}'); toggleMenu()">${g.name}</button>`
        ).join('');
    } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
    }
}

// Carregar Home
async function loadHome() {
    mainContent.innerHTML = '<div class="loading">Carregando...</div>';
    
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
        mainContent.innerHTML = '<div class="error">Erro ao carregar filmes. Verifique sua API Key.</div>';
        console.error(error);
    }
}

// Criar Card de Filme
function createMovieCard(movie) {
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const poster = movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const isFav = favorites.includes(movie.id);
    
    return `
        <div class="movie-card" onclick="loadMovieDetails(${movie.id})">
            <div class="movie-poster">
                ${poster ? `<img src="${poster}" alt="${movie.title}" loading="lazy">` : '<div class="no-image">🎬</div>'}
                <button class="btn-fav-card ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${movie.id}, '${movie.title}', this)">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <div class="movie-rating">⭐ ${rating}</div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">📅 ${year}</p>
            </div>
        </div>
    `;
}

// Carregar por Gênero
async function loadByGenre(genreId, genreName) {
    mainContent.innerHTML = '<div class="loading">Carregando...</div>';
    
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
        mainContent.innerHTML = '<div class="error">Erro ao carregar filmes.</div>';
        console.error(error);
    }
}

// Carregar Detalhes do Filme
async function loadMovieDetails(movieId) {
    movieModal.classList.add('active');
    modalBody.innerHTML = '<div class="loading">Carregando...</div>';
    document.body.style.overflow = 'hidden';
    
    try {
        const [movie, credits, videos] = await Promise.all([
            fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`).then(r => r.json())
        ]);
        
        const trailers = videos.results.filter(v => v.type === 'Trailer' && v.site === 'YouTube').slice(0, 3);
        const cast = credits.cast.slice(0, 10);
        const poster = movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null;
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
        const voteCount = movie.vote_count ? movie.vote_count.toLocaleString('pt-BR') : '0';
        const isFav = favorites.includes(movie.id);
        
        modalBody.innerHTML = `
            <div class="modal-poster">
                ${poster ? `<img src="${poster}" alt="${movie.title}">` : '<div class="no-image">🎬</div>'}
            </div>
            
            <div class="modal-info">
                <h1 class="modal-title">${movie.title}</h1>
                
                <button class="btn-fav-modal ${isFav ? 'active' : ''}" onclick="toggleFavorite(${movie.id}, '${movie.title}', this)">
                    ${isFav ? '❤️' : '🤍'} ${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                </button>
                
                <div class="modal-meta">
                    <span>📅 ${year}</span>
                    <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                    <span>⏱️ ${runtime}</span>
                    <span>👥 ${voteCount} votos</span>
                </div>
                
                <div class="modal-genres">
                    ${movie.genres.map(g => `<span>${g.name}</span>`).join('')}
                </div>
                
                <div class="modal-overview">
                    <h3>📖 Sinopse</h3>
                    <p>${movie.overview || 'Sinopse não disponível.'}</p>
                </div>
                
                ${trailers.length > 0 ? `
                    <div class="modal-trailer">
                        <h3>🎬 Trailer${trailers.length > 1 ? 's' : ''}</h3>
                        <div class="trailers-list">
                            ${trailers.map(trailer => `
                                <div class="trailer-item">
                                    <h4>${trailer.name}</h4>
                                    <div class="trailer-container">
                                        <iframe src="https://www.youtube.com/embed/${trailer.key}" 
                                                title="${trailer.name}"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowfullscreen>
                                        </iframe>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<div class="modal-trailer"><p style="color: var(--text-gray);">🎬 Trailer não disponível.</p></div>'}
                
                ${cast.length > 0 ? `
                    <div class="modal-cast">
                        <h3>🎭 Elenco Principal</h3>
                        <div class="cast-list">
                            ${cast.map(actor => `
                                <div class="cast-item">
                                    ${actor.profile_path 
                                        ? `<img src="${IMAGE_BASE}${actor.profile_path}" alt="${actor.name}">`
                                        : `<div class="no-photo">👤</div>`
                                    }
                                    <div class="cast-name">${actor.name}</div>
                                    <div class="cast-character">${actor.character}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = '<div class="error">Erro ao carregar detalhes.</div>';
        console.error(error);
    }
}

// Fechar Modal
function closeModal() {
    movieModal.classList.remove('active');
    modalBody.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora
movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        closeModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && movieModal.classList.contains('active')) {
        closeModal();
    }
});

// ==================== SISTEMA DE LOGIN ====================

function openAuthModal(type = 'login') {
    authModal.classList.add('active');
    toggleAuthForm(type);
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function toggleAuthForm(type) {
    if (type === 'register') {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    } else {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    }
}

function doRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirmPass = document.getElementById('regConfirmPass').value;
    
    if (!name || !email || !pass) {
        showToast('⚠️ Preencha todos os campos!', 'error');
        return;
    }
    
    if (pass.length < 6) {
        showToast('⚠️ Senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (pass !== confirmPass) {
        showToast('⚠️ Senhas não coincidem!', 'error');
        return;
    }
    
    if (localStorage.getItem('user_' + email)) {
        showToast('⚠️ Este email já está cadastrado!', 'error');
        return;
    }
    
    const newUser = {
        name,
        email,
        pass,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('user_' + email, JSON.stringify(newUser));
    showToast('✅ Conta criada com sucesso! Faça login.', 'success');
    toggleAuthForm('login');
}

function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    
    if (!email || !pass) {
        showToast('⚠️ Preencha email e senha!', 'error');
        return;
    }
    
    const userData = localStorage.getItem('user_' + email);
    
    if (!userData) {
        showToast('⚠️ Usuário não encontrado!', 'error');
        return;
    }
    
    const user = JSON.parse(userData);
    
    if (user.pass !== pass) {
        showToast('⚠️ Senha incorreta!', 'error');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    favorites = JSON.parse(localStorage.getItem('favorites_' + email)) || [];
    
    closeAuthModal();
    updateAuthUI();
    showToast(`🎉 Bem-vindo, ${user.name}!`, 'success');
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        favorites = [];
        updateAuthUI();
        showToast('👋 Você saiu da conta.', 'success');
        loadHome();
    }
}

function updateAuthUI() {
    const btnLogin = document.querySelector('.btn-login');
    const favCountEl = document.getElementById('fav-count');
    
    if (currentUser) {
        btnLogin.style.display = 'none';
        userDropdown.style.display = 'block';
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        favCountEl.textContent = favorites.length;
    } else {
        btnLogin.style.display = 'block';
        userDropdown.style.display = 'none';
        favCountEl.textContent = '0';
    }
}

// ==================== SISTEMA DE FAVORITOS ====================

function toggleFavorite(movieId, movieTitle, btn) {
    if (!currentUser) {
        showToast('🔐 Faça login para salvar favoritos!', 'error');
        openAuthModal();
        return;
    }
    
    const index = favorites.indexOf(movieId);
    
    if (index === -1) {
        favorites.push(movieId);
        btn.classList.add('active');
        btn.innerHTML = '❤️ Remover dos Favoritos';
        showToast(`❤️ ${movieTitle} adicionado aos favoritos!`, 'success');
    } else {
        favorites.splice(index, 1);
        btn.classList.remove('active');
        btn.innerHTML = '🤍 Adicionar aos Favoritos';
        showToast(`🗑️ ${movieTitle} removido dos favoritos!`, 'success');
    }
    
    localStorage.setItem('favorites_' + currentUser.email, JSON.stringify(favorites));
    updateAuthUI();
}

function openFavorites() {
    if (!currentUser) {
        showToast('🔐 Faça login para ver seus favoritos!', 'error');
        openAuthModal();
        return;
    }
    
    if (favorites.length === 0) {
        mainContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❤️</div>
                <h3>Nenhum Favorito</h3>
                <p>Clique no coração nos filmes para salvar aqui!</p>
            </div>
        `;
        return;
    }
    
    mainContent.innerHTML = '<div class="loading">Carregando favoritos...</div>';
    
    const promises = favorites.map(id => 
        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=pt-BR`).then(r => r.json())
    );
    
    Promise.all(promises).then(movies => {
        const validMovies = movies.filter(m => !m.success);
        mainContent.innerHTML = `
            <section class="section">
                <h2 class="section-title">❤️ Meus Favoritos (${validMovies.length})</h2>
                <div class="movies-grid">
                    ${validMovies.map(movie => createMovieCard(movie)).join('')}
                </div>
            </section>
        `;
    });
}

// ==================== PERFIL ====================

function openProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profileFavorites').value = favorites.length + ' filmes';
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProfile() {
    profileModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('profileMessage').className = 'form-message';
}

function updateProfile() {
    const newName = document.getElementById('profileName').value.trim();
    
    if (!newName) {
        showToast('⚠️ Nome é obrigatório!', 'error');
        return;
    }
    
    currentUser.name = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
    
    const msg = document.getElementById('profileMessage');
    msg.textContent = '✅ Perfil atualizado com sucesso!';
    msg.className = 'form-message success';
    
    updateAuthUI();
    
    setTimeout(() => {
        closeProfile();
    }, 1500);
}

profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        closeProfile();
    }
});

// ==================== BUSCA ====================

async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        showToast('⚠️ Digite pelo menos 2 caracteres!', 'error');
        return;
    }
    
    mainContent.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.results.length === 0) {
            mainContent.innerHTML = `<div class="error">🔍 Nenhum filme encontrado para "${query}"</div>`;
            return;
        }
        
        mainContent.innerHTML = `
            <section class="section">
                <h2 class="section-title">🔍 Resultados para "${query}"</h2>
                <div class="movies-grid">
                    ${data.results.map(movie => createMovieCard(movie)).join('')}
                </div>
            </section>
        `;
    } catch (error) {
        mainContent.innerHTML = '<div class="error">Erro na busca.</div>';
        console.error(error);
    }
}

// ==================== TOAST NOTIFICATION ====================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
