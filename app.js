/**
 * GTX CONSULTING - WEB PRESENTATION ENGINE
 * Gerencia transições suaves, atalhos de teclado, navegação por gestos,
 * visão geral em grade dos 11 slides, personalização em tempo real e persistência local.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentSlide = 0;
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let isLiveEditActive = false;
  let isOverviewOpen = false;

  // DOM Elements
  const progressFill = document.getElementById('progressFill');
  const currentSlideNum = document.getElementById('currentSlideNum');
  const totalSlidesNum = document.getElementById('totalSlidesNum');
  const footerBulletsNav = document.getElementById('footerBulletsNav');
  const btnPrevSlide = document.getElementById('btnPrevSlide');
  const btnNextSlide = document.getElementById('btnNextSlide');
  
  // Modals & Panels
  const overviewModal = document.getElementById('overviewModal');
  const btnToggleOverview = document.getElementById('btnToggleOverview');
  const btnCloseOverview = document.getElementById('btnCloseOverview');
  const overviewGrid = document.getElementById('overviewGrid');

  const customizerModal = document.getElementById('customizerModal');
  const btnOpenCustomizer = document.getElementById('btnOpenCustomizer');
  const btnCloseCustomizer = document.getElementById('btnCloseCustomizer');
  const btnSaveCustomizer = document.getElementById('btnSaveCustomizer');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  const helpModal = document.getElementById('helpModal');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const btnGotItHelp = document.getElementById('btnGotItHelp');

  // Edit Mode & Print
  const btnToggleEditMode = document.getElementById('btnToggleEditMode');
  const liveEditBanner = document.getElementById('liveEditBanner');
  const btnSaveInlineEdits = document.getElementById('btnSaveInlineEdits');
  const btnPrintPdf = document.getElementById('btnPrintPdf');
  const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');

  // Client Data Fields
  const headerClientName = document.getElementById('headerClientName');
  const coverClientName = document.getElementById('coverClientName');
  const coverProjectCycle = document.getElementById('coverProjectCycle');
  const clientBadgeDisplay = document.getElementById('clientBadgeDisplay');

  // Input Fields in Customizer Modal
  const inputClientName = document.getElementById('inputClientName');
  const inputProjectDuration = document.getElementById('inputProjectDuration');
  const inputKickoffDate = document.getElementById('inputKickoffDate');
  const inputLeadPartner = document.getElementById('inputLeadPartner');
  const inputClientSponsor = document.getElementById('inputClientSponsor');

  // 1. Initialize Presentation
  function init() {
    totalSlidesNum.textContent = String(totalSlides).padStart(2, '0');
    renderBullets();
    renderOverviewGrid();
    loadStoredClientData();
    loadStoredInlineEdits();

    // Check URL hash (e.g. #slide-3)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#slide-')) {
      const idx = parseInt(hash.replace('#slide-', ''), 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < totalSlides) {
        goToSlide(idx, false);
      } else {
        goToSlide(0, false);
      }
    } else {
      goToSlide(0, false);
    }

    setupEventListeners();
  }

  // 2. Render Bullets in Footer (11 Slides)
  function renderBullets() {
    if (!footerBulletsNav) return;
    footerBulletsNav.innerHTML = '';
    slides.forEach((slide, idx) => {
      const bullet = document.createElement('button');
      bullet.className = 'bullet-btn';
      bullet.setAttribute('data-target-index', idx);
      const title = slide.getAttribute('data-title') || `Slide ${idx + 1}`;
      bullet.setAttribute('title', `${idx + 1}. ${title}`);
      bullet.textContent = idx + 1;
      bullet.addEventListener('click', () => goToSlide(idx));
      footerBulletsNav.appendChild(bullet);
    });
  }

  // 3. Render Overview Grid Modal (11 Slides)
  function renderOverviewGrid() {
    if (!overviewGrid) return;
    overviewGrid.innerHTML = '';
    slides.forEach((slide, idx) => {
      const title = slide.getAttribute('data-title') || `Slide ${idx + 1}`;
      const subtitle = slide.querySelector('.slide-title')?.textContent || 
                       slide.querySelector('.cover-title')?.textContent || 'Apresentação GTX';
      
      const card = document.createElement('div');
      card.className = 'overview-thumb-card';
      if (idx === currentSlide) card.classList.add('active');

      card.innerHTML = `
        <div class="thumb-header">
          <span class="thumb-num">${String(idx + 1).padStart(2, '0')}</span>
          <span style="font-size: 0.7rem; color: #676767; text-transform: uppercase;">GTX ↗</span>
        </div>
        <div class="thumb-title">${title}</div>
        <div class="thumb-desc">${subtitle.substring(0, 60).trim()}...</div>
      `;

      card.addEventListener('click', () => {
        goToSlide(idx);
        closeOverview();
      });

      overviewGrid.appendChild(card);
    });
  }

  // 4. Slide Navigation
  function goToSlide(targetIndex, updateHash = true) {
    if (targetIndex < 0 || targetIndex >= totalSlides) return;

    currentSlide = targetIndex;

    slides.forEach((slide, idx) => {
      slide.classList.remove('active', 'prev', 'next');
      if (idx === currentSlide) {
        slide.classList.add('active');
      } else if (idx < currentSlide) {
        slide.classList.add('prev');
      } else {
        slide.classList.add('next');
      }
    });

    // Update Counter & Progress Bar
    if (currentSlideNum) currentSlideNum.textContent = String(currentSlide + 1).padStart(2, '0');
    if (progressFill) {
      const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
      progressFill.style.width = `${progressPercent}%`;
    }

    // Update Bullets
    if (footerBulletsNav) {
      const bullets = footerBulletsNav.querySelectorAll('.bullet-btn');
      bullets.forEach((b, idx) => {
        b.classList.toggle('active', idx === currentSlide);
      });
    }

    // Update Overview Cards
    if (overviewGrid) {
      const thumbCards = overviewGrid.querySelectorAll('.overview-thumb-card');
      thumbCards.forEach((c, idx) => {
        c.classList.toggle('active', idx === currentSlide);
      });
    }

    // Update Arrows State
    if (btnPrevSlide) btnPrevSlide.disabled = (currentSlide === 0);
    if (btnNextSlide) btnNextSlide.disabled = (currentSlide === totalSlides - 1);

    // Update URL Hash
    if (updateHash) {
      window.history.replaceState(null, null, `#slide-${currentSlide + 1}`);
    }

    // Scroll active slide to top
    if (slides[currentSlide]) {
      slides[currentSlide].scrollTop = 0;
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }

  // 5. Overview Modal Controls
  function openOverview() {
    isOverviewOpen = true;
    if (overviewModal) overviewModal.classList.add('open');
  }

  function closeOverview() {
    isOverviewOpen = false;
    if (overviewModal) overviewModal.classList.remove('open');
  }

  function toggleOverview() {
    if (isOverviewOpen) closeOverview();
    else openOverview();
  }

  // 6. Customizer Modal Controls
  function openCustomizer() {
    if (inputClientName && headerClientName) {
      inputClientName.value = headerClientName.textContent.trim();
    }
    if (inputProjectDuration && coverProjectCycle) {
      inputProjectDuration.value = coverProjectCycle.textContent.trim();
    }
    if (customizerModal) customizerModal.classList.add('open');
  }

  function closeCustomizer() {
    if (customizerModal) customizerModal.classList.remove('open');
  }

  function saveCustomizerData() {
    const clientName = inputClientName ? inputClientName.value.trim() : 'Fretou Brasil × GTX';
    const duration = inputProjectDuration ? inputProjectDuration.value.trim() : 'Exercício 2026';
    const kickoff = inputKickoffDate ? inputKickoffDate.value.trim() : '15 de Janeiro de 2027';

    // Update DOM
    if (headerClientName) headerClientName.textContent = clientName;
    if (coverClientName) coverClientName.textContent = clientName;
    if (coverProjectCycle) coverProjectCycle.textContent = duration;

    // Store in localStorage
    const customData = {
      clientName,
      duration,
      kickoff
    };
    localStorage.setItem('gtx_fretou_custom_data', JSON.stringify(customData));

    closeCustomizer();
    showToast('Dados da apresentação atualizados com sucesso! ↗');
  }

  function resetCustomizerDefaults() {
    localStorage.removeItem('gtx_fretou_custom_data');
    if (headerClientName) headerClientName.textContent = 'Fretou Brasil × GTX';
    if (coverClientName) coverClientName.textContent = 'Fretou Brasil';
    if (coverProjectCycle) coverProjectCycle.textContent = 'Exercício 2026';
    closeCustomizer();
    showToast('Valores padrões restaurados.');
  }

  function loadStoredClientData() {
    try {
      const raw = localStorage.getItem('gtx_fretou_custom_data');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.clientName) {
          if (headerClientName) headerClientName.textContent = data.clientName;
          if (coverClientName) coverClientName.textContent = data.clientName;
        }
        if (data.duration && coverProjectCycle) coverProjectCycle.textContent = data.duration;
      }
    } catch (e) {
      console.warn('Could not load custom data:', e);
    }
  }

  // 7. Live Inline Edit Mode
  function toggleLiveEditMode() {
    isLiveEditActive = !isLiveEditActive;
    document.body.classList.toggle('live-edit-active', isLiveEditActive);
    if (btnToggleEditMode) btnToggleEditMode.classList.toggle('active', isLiveEditActive);

    const editableElements = document.querySelectorAll('[data-editable]');
    editableElements.forEach(el => {
      el.setAttribute('contenteditable', isLiveEditActive ? 'true' : 'false');
    });

    if (isLiveEditActive) {
      showToast('Modo Edição Ativo: Clique em qualquer texto para editar! ✏️');
    } else {
      saveInlineEdits();
    }
  }

  function saveInlineEdits() {
    const edits = {};
    const editableElements = document.querySelectorAll('[data-editable]');
    editableElements.forEach(el => {
      const key = el.getAttribute('data-editable');
      edits[key] = el.innerHTML;
    });

    localStorage.setItem('gtx_fretou_inline_edits', JSON.stringify(edits));
    showToast('Alterações de texto salvas com sucesso! 💾');
  }

  function loadStoredInlineEdits() {
    try {
      const raw = localStorage.getItem('gtx_fretou_inline_edits');
      if (raw) {
        const edits = JSON.parse(raw);
        Object.keys(edits).forEach(key => {
          const el = document.querySelector(`[data-editable="${key}"]`);
          if (el) el.innerHTML = edits[key];
        });
      }
    } catch (e) {
      console.warn('Could not load inline edits:', e);
    }
  }

  // 8. Help Modal
  function openHelp() {
    if (helpModal) helpModal.classList.add('open');
  }

  function closeHelp() {
    if (helpModal) helpModal.classList.remove('open');
  }

  // 9. Toast Notifications
  function showToast(message) {
    let toast = document.getElementById('gtx-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gtx-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '75px';
      toast.style.right = '2rem';
      toast.style.background = '#141414';
      toast.style.border = '1px solid #2878FF';
      toast.style.color = '#FFFFFF';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '8px';
      toast.style.fontSize = '0.85rem';
      toast.style.fontWeight = '600';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(40,120,255,0.4)';
      toast.style.zIndex = '9999';
      toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
    }, 3200);
  }

  // 10. Fullscreen Toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // 11. Event Listeners Setup
  function setupEventListeners() {
    // Navigation Arrows
    if (btnPrevSlide) btnPrevSlide.addEventListener('click', prevSlide);
    if (btnNextSlide) btnNextSlide.addEventListener('click', nextSlide);

    // Header Logo back to slide 1
    const brandHeaderLogo = document.getElementById('brandHeaderLogo');
    if (brandHeaderLogo) {
      brandHeaderLogo.addEventListener('click', () => goToSlide(0));
    }

    // Modals
    if (btnToggleOverview) btnToggleOverview.addEventListener('click', toggleOverview);
    if (btnCloseOverview) btnCloseOverview.addEventListener('click', closeOverview);

    if (btnOpenCustomizer) btnOpenCustomizer.addEventListener('click', openCustomizer);
    if (clientBadgeDisplay) clientBadgeDisplay.addEventListener('click', openCustomizer);
    if (btnCloseCustomizer) btnCloseCustomizer.addEventListener('click', closeCustomizer);
    if (btnSaveCustomizer) btnSaveCustomizer.addEventListener('click', saveCustomizerData);
    if (btnResetDefaults) btnResetDefaults.addEventListener('click', resetCustomizerDefaults);

    // Edit Mode
    if (btnToggleEditMode) btnToggleEditMode.addEventListener('click', toggleLiveEditMode);
    if (btnSaveInlineEdits) btnSaveInlineEdits.addEventListener('click', saveInlineEdits);

    // Print / PDF
    if (btnPrintPdf) btnPrintPdf.addEventListener('click', () => window.print());

    // Fullscreen
    if (btnToggleFullscreen) btnToggleFullscreen.addEventListener('click', toggleFullscreen);

    // Help
    if (btnCloseHelp) btnCloseHelp.addEventListener('click', closeHelp);
    if (btnGotItHelp) btnGotItHelp.addEventListener('click', closeHelp);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );

      if (isTyping) {
        if (e.key === 'Escape') activeEl.blur();
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ': // Spacebar
          e.preventDefault();
          nextSlide();
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'Backspace':
          e.preventDefault();
          prevSlide();
          break;

        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;

        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;

        case 'g':
        case 'G':
        case 'o':
        case 'O':
          toggleOverview();
          break;

        case 'e':
        case 'E':
          toggleLiveEditMode();
          break;

        case 'f':
        case 'F':
          toggleFullscreen();
          break;

        case 'p':
        case 'P':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            window.print();
          }
          break;

        case 'h':
        case 'H':
        case '?':
          openHelp();
          break;

        case 'Escape':
          closeOverview();
          closeCustomizer();
          closeHelp();
          break;
      }
    });

    // Touch / Swipe Gestures for Mobile & Tablets
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) nextSlide();
        else prevSlide();
      }
    }, { passive: true });
  }

  // Initialize
  init();
});
