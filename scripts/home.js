/* =======================================================
   KarenFlix — JS mínimo para Home
   Incluye:
   - Nav overlay/solid
   - Hamburguesa + panel móvil + scrim
   - Dropdown de Géneros (desktop)
   - Barra de búsqueda (toggle + submit)
   - Hero carrusel auto-armable
   ======================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------ Selecciones base ------------------ */
  const header = document.querySelector('.home-nav');
  const mainMenu = document.querySelector('.main');          // menú desktop
  const brandLink = document.getElementById('brandLink');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const panel = document.getElementById('panel');
  const navPanel = document.getElementById('navPanel');
  const scrim = document.getElementById('scrim');
  const closePanelBtn = document.getElementById('closePanel');

  // Géneros (desktop)
  const genreBtn = document.getElementById('genreBtn');
  const genreMenu = document.getElementById('genreMenu');
  const genreLabel = document.getElementById('genreLabel');

  // Búsqueda
  const searchBtn = document.getElementById('searchBtn');
  const navSearch = document.getElementById('navSearch'); // debe estar dentro del header
  const searchInput = document.getElementById('searchInput');

  const BP = 768; // breakpoint móvil

  /* ------------------ Utilidades ------------------ */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const trapScroll = (lock) => {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  };

  /* ------------------ Nav overlay/solid ------------------ */
  const updateHeaderBg = () => {
    if (window.scrollY > 10) {
      header?.classList.add('solid');
      header?.classList.remove('overlay');
    } else {
      header?.classList.add('overlay');
      header?.classList.remove('solid');
    }
  };
  updateHeaderBg();
  window.addEventListener('scroll', updateHeaderBg, { passive: true });

  /* ------------------ Panel móvil ------------------ */
  function openPanel() {
    if (!panel) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    hamburgerBtn?.classList.add('active');
    hamburgerBtn?.setAttribute('aria-expanded', 'true');
    scrim?.removeAttribute('hidden');
    trapScroll(true);
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    hamburgerBtn?.classList.remove('active');
    hamburgerBtn?.setAttribute('aria-expanded', 'false');
    scrim?.setAttribute('hidden', '');
    trapScroll(false);
  }

  hamburgerBtn?.addEventListener('click', () => {
    panel?.classList.contains('open') ? closePanel() : openPanel();
  });
  scrim?.addEventListener('click', closePanel);
  closePanelBtn?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePanel(); closeSearch(); closeGenres(); }
  });

  // Cerrar panel al pasar a desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > BP) closePanel();
  });

  /* ------------------ Construir menú móvil ------------------ */
  function hydrateMobilePanel() {
    if (!navPanel || !mainMenu) return;
    navPanel.innerHTML = '';

    // 1) Copiar items del menú principal
    const links = qsa('.item', mainMenu);
    links.forEach(a => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href') || '#';
      link.textContent = a.textContent?.trim() || 'Enlace';
      link.addEventListener('click', closePanel);
      navPanel.appendChild(link);
    });

    // 2) Grupo de géneros
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = 'Géneros';
    navPanel.appendChild(title);

    GENRES.forEach(g => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = g;
      btn.addEventListener('click', () => {
        // TODO: tu navegación por género
        // window.location.href = `./genre.html?g=${encodeURIComponent(g)}`;
        closePanel();
      });
      navPanel.appendChild(btn);
    });
  }

  /* ------------------ Dropdown de Géneros (desktop) ------------------ */
  const GENRES = [
    'Acción', 'Aventura', 'Animación', 'Comedia', 'Crimen', 'Documental', 'Drama',
    'Familia', 'Fantasía', 'Historia', 'Terror', 'Misterio', 'Romance', 'Ciencia ficción', 'Suspenso', 'Bélica', 'Western'
  ];

  function renderGenres() {
    if (!genreMenu) return;
    genreMenu.innerHTML = '';
    GENRES.forEach(g => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = g;
      b.addEventListener('click', () => {
        // TODO: tu navegación por género
        // window.location.href = `./genre.html?g=${encodeURIComponent(g)}`;
        closeGenres();
      });
      genreMenu.appendChild(b);
    });
  }

  function openGenres() {
    if (!genreBtn || !genreMenu) return;
    genreBtn.setAttribute('aria-expanded', 'true');
    genreMenu.removeAttribute('hidden');
    document.addEventListener('click', onClickOutsideGenres);
  }

  function closeGenres() {
    if (!genreBtn || !genreMenu) return;
    genreBtn.setAttribute('aria-expanded', 'false');
    genreMenu.setAttribute('hidden', '');
    document.removeEventListener('click', onClickOutsideGenres);
  }

  function onClickOutsideGenres(e) {
    const inside = genreBtn.contains(e.target) || genreMenu.contains(e.target);
    if (!inside) closeGenres();
  }

  genreBtn?.addEventListener('click', () => {
    const open = genreBtn.getAttribute('aria-expanded') === 'true';
    open ? closeGenres() : openGenres();
  });

  renderGenres();
  hydrateMobilePanel();

  /* ------------------ Búsqueda en nav ------------------ */
  function openSearch() {
    if (!navSearch) return;
    navSearch.classList.add('open');
    navSearch.setAttribute('aria-hidden', 'false');
    header?.classList.add('search-open');
    setTimeout(() => searchInput?.focus(), 0);
  }
  function closeSearch() {
    if (!navSearch) return;
    navSearch.classList.remove('open');
    navSearch.setAttribute('aria-hidden', 'true');
    header?.classList.remove('search-open');
    searchInput?.blur();
  }

  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    navSearch?.classList.contains('open') ? closeSearch() : openSearch();
  });

  navSearch?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (searchInput?.value || '').trim();
    if (!q) return closeSearch();
    // TODO: reemplaza con tu lógica real de búsqueda
    window.location.href = `./search.html?q=${encodeURIComponent(q)}`;
  });

  // Cerrar búsqueda con click fuera
  document.addEventListener('click', (e) => {
    if (!navSearch?.classList.contains('open')) return;
    const hit = navSearch.contains(e.target) || searchBtn?.contains(e.target);
    if (!hit) closeSearch();
  });

  /* ------------------ Hero carrusel (auto-armable) ------------------ */
  function initHeroCarousel(rootSel, data, opts = {}) {
    const options = { duration: 6000, pauseOnHover: true, ...opts };
    const root = typeof rootSel === 'string' ? qs(rootSel) : rootSel;
    if (!root || !Array.isArray(data) || !data.length) return;

    root.innerHTML = `
      <div class="hero-track" aria-live="polite"></div>
      <button class="hero-nav prev" aria-label="Anterior">❮</button>
      <button class="hero-nav next" aria-label="Siguiente">❯</button>
      <div class="hero-dots" role="tablist" aria-label="Paginación"></div>
    `;

    const track = qs('.hero-track', root);
    const prev = qs('.hero-nav.prev', root);
    const next = qs('.hero-nav.next', root);
    const dotsB = qs('.hero-dots', root);

    // Crear slides + dots
    data.forEach((it, i) => {
      const art = document.createElement('article');
      art.className = 'hero-slide' + (i === 0 ? ' is-active' : '');
      art.style.backgroundImage = `url("${it.bg}")`;
      art.setAttribute('role', 'group');
      art.setAttribute('aria-roledescription', 'slide');
      art.setAttribute('aria-label', `${i + 1} de ${data.length}`);

      const genresTxt = Array.isArray(it.genres) ? it.genres.join(' • ') : (it.genres || '');
      const meta = [
        it.rating != null ? `⭐ ${it.rating}` : null,
        genresTxt || null
      ].filter(Boolean).join(' • ');

      art.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-content">
          ${it.year ? `<p class="hero-year">${it.year}</p>` : ''}
          <h2 class="hero-title">${it.title ?? ''}</h2>
          ${meta ? `<p class="hero-meta">${meta}</p>` : ''}
          ${it.description ? `<p class="hero-desc">${it.description}</p>` : ''}
          <div class="hero-actions">
            ${it.trailerUrl ? `<a href="${it.trailerUrl}" class="btn btn-primary">▶ Ver Trailer</a>` : ''}
            <a class="btn btn-ghost" href="${it.reviewUrl || '#'}">Reseñar</a>
          </div>
        </div>`;
      track.appendChild(art);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.role = 'tab';
      dot.ariaLabel = `Ir al slide ${i + 1}`;
      if (i === 0) dot.setAttribute('aria-selected', 'true');
      dotsB.appendChild(dot);
    });

    const slides = qsa('.hero-slide', track);
    const dots = qsa('button', dotsB);

    let index = 0, timer = null;

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === index ? 'true' : 'false'));
    };
    const nextSlide = () => go(index + 1);
    const prevSlide = () => go(index - 1);

    const play = () => { stop(); timer = setInterval(nextSlide, options.duration); };
    const stop = () => { if (timer) clearInterval(timer); };

    // Controles
    next?.addEventListener('click', () => { nextSlide(); play(); });
    prev?.addEventListener('click', () => { prevSlide(); play(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); play(); }));

    // Teclado y hover
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { nextSlide(); play(); }
      if (e.key === 'ArrowLeft') { prevSlide(); play(); }
    });
    if (options.pauseOnHover) {
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', play);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', play);
    }

    // Swipe táctil
    let startX = 0, dx = 0, dragging = false;
    root.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dragging = true; stop(); }, { passive: true });
    root.addEventListener('touchmove', (e) => { if (!dragging) return; dx = e.touches[0].clientX - startX; }, { passive: true });
    root.addEventListener('touchend', () => {
      if (!dragging) return;
      if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); }
      dragging = false; dx = 0; play();
    });

    // Inicio
    go(0);
    play();
  }

  /* ------------------ Datos del hero ------------------ */
  // Si defines window.FEATURED en otro script, lo usará; si no, usamos demo:
  const featured = (window.FEATURED && Array.isArray(window.FEATURED) && window.FEATURED.length)
    ? window.FEATURED
    : [
      {
        title: "The Batman",
        year: 2022,
        rating: 7.7,
        genres: ["Acción", "Drama"],
        description: "Batman es llamado a intervenir cuando el alcalde de Gotham City es asesinado. Pronto, su investigación le lleva a descubrir una red de corrupción relacionada con su propio pasado oscuro.",
        bg: "https://beam-images.warnermediacdn.com/BEAM_LWM_DELIVERABLES/dfa50804-e6f6-4fa2-a732-693dbc50527b/37082735-6715-11ef-96ad-02805d6a02df?host=wbd-images.prod-vod.h264.io&partner=beamcom",
        trailerUrl: "https://www.youtube.com/watch?v=mqqft2x_Aa4",
        reviewUrl: "#reseña-batman"
      },
      {
        title: "Dune: Part Two",
        year: 2023,
        rating: 8.5,
        genres: ["Sci-Fi", "Aventura"],
        description: "Paul une a los Fremen mientras se prepara para la guerra…",
        bg: "https://4kwallpapers.com/images/wallpapers/dune-part-two-movie-7680x4320-15307.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w"
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        year: 2023,
        rating: 8.7,
        genres: ["Animación", "Acción"],
        description: "Miles viaja a través del multiverso junto a Gwen…",
        bg: "https://galaxydrivein.com.au/wp-content/uploads/2023/07/spider-man-across-the-spider-verse-poster.webp",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg"
      }
    ];


  /* ------------------ Inicializaciones ------------------ */
  hydrateMobilePanel();
  initHeroCarousel('#hero', featured, { duration: 6500 });

  // Logo abre el panel en móvil (opcional)
  brandLink?.addEventListener('click', (e) => {
    if (window.innerWidth <= BP) {
      e.preventDefault();
      openPanel();
    }
  });
});
 /* ============================
   ROWS / CAROUSELES DE TARJETAS
   ============================ */

/** Inicializa una fila horizontal .row (flechas + drag) */
function initCardRow(section){
  const track = section.querySelector('.row-track');
  const prev  = section.querySelector('.row-nav.prev');
  const next  = section.querySelector('.row-nav.next');
  if(!track) return;

  const step = () => Math.max(track.clientWidth * 0.9, 300);

  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left:  step(), behavior: 'smooth' }));

  // Drag/Swipe con pointer events (mouse + touch)
  let down = false, startX = 0, startLeft = 0;
  track.addEventListener('pointerdown', e => {
    down = true; startX = e.clientX; startLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if(!down) return;
    track.scrollLeft = startLeft + (startX - e.clientX);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(type =>
    track.addEventListener(type, () => down = false)
  );
}
/* =====================================================
   Featured: fondo dinámico + carrusel de posters
   ===================================================== */

function initFeaturedShowcase(sel, data){
  const root  = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if(!root || !Array.isArray(data) || !data.length) return;

  const bgA   = root.querySelector('.featured-bg__img.is-a');
  const bgB   = root.querySelector('.featured-bg__img.is-b');
  const track = root.querySelector('#fTrack');

  const fYear   = root.querySelector('#fYear');
  const fTitle  = root.querySelector('#fTitle');
  const fMeta   = root.querySelector('#fMeta');
  const fDesc   = root.querySelector('#fDesc');
  const fPlay   = root.querySelector('#fPlay');
  const fReview = root.querySelector('#fReview');

  // Crea tarjetas
  track.innerHTML = '';
  data.forEach((it) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.bg = it.bg || '';
    card.innerHTML = `
      <div class="card__poster">
        <img src="${it.poster}" alt="${it.title}" width="300" height="450" loading="lazy">
      </div>
      <h3 class="card__title">${it.title}</h3>
      <p class="card__meta">${Array.isArray(it.genres) ? it.genres.join(' • ') : (it.genres||'')}</p>
    `;
    track.appendChild(card);
  });

  const cards = [...track.querySelectorAll('.card')];

  // Crossfade del fondo
  let useA = true;
  const swapBg = (url='') => {
    const show = useA ? bgA : bgB;
    const hide = useA ? bgB : bgA;
    show.style.backgroundImage = url ? `url("${url}")` : '';
    show.style.opacity = 1;
    hide.style.opacity = 0;
    useA = !useA;
  };

  // Actualiza columna izquierda + activo + fondo
  const showIdx = (idx) => {
    const it = data[idx];
    if(!it) return;
    cards.forEach((c,i)=> c.classList.toggle('is-active', i===idx));
    fYear.textContent  = it.year ?? '';
    fTitle.textContent = it.title ?? '';
    fMeta.textContent  = [
      (it.rating != null ? `⭐ ${it.rating}` : null),
      (Array.isArray(it.genres) ? it.genres.join(' • ') : it.genres)
    ].filter(Boolean).join(' • ');
    fDesc.textContent  = it.description ?? '';
    if (it.playUrl)   fPlay.href   = it.playUrl;   else fPlay.removeAttribute('href');
    if (it.reviewUrl) fReview.href = it.reviewUrl; else fReview.removeAttribute('href');
    swapBg(it.bg || '');
    current = idx;
  };

  // Índice más visible según scroll
  const nearestIndex = () => {
    const sl = track.scrollLeft;
    let best = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - sl);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  };

  // Navegación por flechas
  const prevBtn = root.querySelector('.row-nav.prev');
  const nextBtn = root.querySelector('.row-nav.next');
  const stepX   = () => Math.max(track.clientWidth * 0.9, 300);

  prevBtn?.addEventListener('click', () => {
    track.scrollBy({ left: -stepX(), behavior: 'smooth' });
    setTimeout(()=> showIdx(nearestIndex()), 260);
  });
  nextBtn?.addEventListener('click', () => {
    track.scrollBy({ left:  stepX(), behavior: 'smooth' });
    setTimeout(()=> showIdx(nearestIndex()), 260);
  });

  // Scroll/drag: sincroniza fondo + texto con la tarjeta que quedó al frente
  let raf = null;
  track.addEventListener('scroll', () => {
    if(raf) return;
    raf = requestAnimationFrame(()=>{
      showIdx(nearestIndex());
      raf = null;
    });
  }, { passive:true });

  // Hover: cambia de inmediato
  cards.forEach((c,i)=> c.addEventListener('mouseenter', ()=> showIdx(i)));

  // Drag con pointer events (opcional, mejora UX)
  let down=false, sx=0, sl0=0;
  track.addEventListener('pointerdown', e=>{ down=true; sx=e.clientX; sl0=track.scrollLeft; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', e=>{ if(down) track.scrollLeft = sl0 + (sx - e.clientX); });
  ['pointerup','pointercancel','pointerleave'].forEach(t=> track.addEventListener(t, ()=> down=false));

  // Inicial
  let current = 0;
  bgA.style.backgroundImage = `url("${data[0].bg || ''}")`;
  bgA.style.opacity = 1; bgB.style.opacity = 0;
  showIdx(0);
}

/* ====== Datos de ejemplo (reemplaza por los tuyos) ====== */
const FEATURED_SHOWS = [
  {
    title: "The Last of Us",
    year: 2023, rating: 7.5, genres: ["Acción", "Thriller"],
    description: "Joel y Ellie, una pareja conectada a través de la dureza del mundo...",
    poster: "https://m.media-amazon.com/images/I/51aMeL-tTYL._UF894,1000_QL80_.jpg",
    bg:     "https://film-book.com/wp-content/uploads/2023/01/the-last-of-us-tv-show-poster-banner-01-700x400-1.jpg",
    playUrl: "#", reviewUrl: "#"
  },
  {
    title: "Stranger Things",
    year: 2022, rating: 8.7, genres: ["Sci-Fi", "Aventura"],
    description: "Un grupo de amigos enfrenta fuerzas sobrenaturales en Hawkins.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjg2NmM0MTEtYWY2Yy00NmFlLTllNTMtMjVkZjEwMGVlNzdjXkEyXkFqcGc@._V1_.jpg",
    bg:     "https://upload.wikimedia.org/wikipedia/commons/3/38/Stranger_Things_logo.png",
    playUrl: "#"
  },
  {
    title: "The Last of Us",
    year: 2023, rating: 7.5, genres: ["Acción", "Thriller"],
    description: "Joel y Ellie, una pareja conectada a través de la dureza del mundo...",
    poster: "https://m.media-amazon.com/images/I/51aMeL-tTYL._UF894,1000_QL80_.jpg",
    bg:     "https://film-book.com/wp-content/uploads/2023/01/the-last-of-us-tv-show-poster-banner-01-700x400-1.jpg",
    playUrl: "#", reviewUrl: "#"
  },
  {
    title: "Stranger Things",
    year: 2022, rating: 8.7, genres: ["Sci-Fi", "Aventura"],
    description: "Un grupo de amigos enfrenta fuerzas sobrenaturales en Hawkins.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjg2NmM0MTEtYWY2Yy00NmFlLTllNTMtMjVkZjEwMGVlNzdjXkEyXkFqcGc@._V1_.jpg",
    bg:     "https://upload.wikimedia.org/wikipedia/commons/3/38/Stranger_Things_logo.png",
    playUrl: "#"
  },
  {
    title: "The Last of Us",
    year: 2023, rating: 7.5, genres: ["Acción", "Thriller"],
    description: "Joel y Ellie, una pareja conectada a través de la dureza del mundo...",
    poster: "https://m.media-amazon.com/images/I/51aMeL-tTYL._UF894,1000_QL80_.jpg",
    bg:     "https://film-book.com/wp-content/uploads/2023/01/the-last-of-us-tv-show-poster-banner-01-700x400-1.jpg",
    playUrl: "#", reviewUrl: "#"
  }

  // ... añade más
];

/* Lanza el featured cuando cargue el DOM */
document.addEventListener('DOMContentLoaded', () => {
  initFeaturedShowcase('#featured', FEATURED_SHOWS);
});
