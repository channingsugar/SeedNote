(function () {
  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox) return;

  const lightboxImage = document.getElementById('mediaLightboxImage');
  const lightboxViewport = document.getElementById('mediaLightboxViewport');
  const lightboxCanvas = document.getElementById('mediaLightboxCanvas');
  const lightboxCount = lightbox.querySelector('.media-lightbox-count');
  const closeButton = lightbox.querySelector('.media-lightbox-close');
  const previousButton = lightbox.querySelector('.media-lightbox-prev');
  const nextButton = lightbox.querySelector('.media-lightbox-next');
  const zoomOutButton = lightbox.querySelector('.media-zoom-out');
  const zoomResetButton = lightbox.querySelector('.media-zoom-reset');
  const zoomInButton = lightbox.querySelector('.media-zoom-in');
  let activeGallery = null;
  let activeItems = [];
  let activeIndex = 0;
  let zoomScale = 1;
  let baseImageWidth = 0;
  let baseImageHeight = 0;
  let isDragging = false;
  let didDrag = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScrollLeft = 0;
  let dragStartScrollTop = 0;

  function calculateBaseImageSize() {
    if (!lightboxImage.naturalWidth || !lightboxImage.naturalHeight) return false;
    const viewportHeight = lightboxViewport.clientHeight;
    if (!lightboxViewport.clientWidth || !viewportHeight) return false;
    // 所有大图统一以可用高度为基准锁定比例，横向超出部分交给拖拽浏览。
    const fitScale = viewportHeight / lightboxImage.naturalHeight;
    baseImageWidth = lightboxImage.naturalWidth * fitScale;
    baseImageHeight = lightboxImage.naturalHeight * fitScale;
    return true;
  }

  function updateZoomLayout(preserveCenter = false) {
    if (!baseImageWidth || !baseImageHeight) {
      if (!calculateBaseImageSize()) return;
    }
    const viewportWidth = lightboxViewport.clientWidth;
    const viewportHeight = lightboxViewport.clientHeight;
    const oldCanvasWidth = Math.max(lightboxCanvas.scrollWidth, viewportWidth);
    const oldCanvasHeight = Math.max(lightboxCanvas.scrollHeight, viewportHeight);
    const centerRatioX = preserveCenter
      ? (lightboxViewport.scrollLeft + viewportWidth / 2) / oldCanvasWidth
      : .5;
    const centerRatioY = preserveCenter
      ? (lightboxViewport.scrollTop + viewportHeight / 2) / oldCanvasHeight
      : .5;
    const imageWidth = baseImageWidth * zoomScale;
    const imageHeight = baseImageHeight * zoomScale;
    const canvasWidth = Math.max(viewportWidth, imageWidth);
    const canvasHeight = Math.max(viewportHeight, imageHeight);

    lightboxCanvas.style.width = `${canvasWidth}px`;
    lightboxCanvas.style.height = `${canvasHeight}px`;
    lightboxImage.style.width = `${imageWidth}px`;
    lightboxImage.style.height = `${imageHeight}px`;
    const isPannable = imageWidth > viewportWidth + 1 || imageHeight > viewportHeight + 1;
    lightboxViewport.classList.toggle('is-pannable', isPannable);
    lightboxViewport.classList.toggle('is-zoomed', zoomScale > 1);
    zoomResetButton.textContent = `${Math.round(zoomScale * 100)}%`;
    zoomOutButton.disabled = zoomScale <= 1;
    zoomInButton.disabled = zoomScale >= 8;

    lightboxViewport.scrollLeft = Math.max(0, centerRatioX * canvasWidth - viewportWidth / 2);
    lightboxViewport.scrollTop = Math.max(0, centerRatioY * canvasHeight - viewportHeight / 2);
  }

  function resetZoom() {
    zoomScale = 1;
    baseImageWidth = 0;
    baseImageHeight = 0;
    isDragging = false;
    didDrag = false;
    lightboxViewport.classList.remove('is-dragging');
    lightboxViewport.classList.remove('is-pannable');
    if (!calculateBaseImageSize()) return;
    updateZoomLayout(false);
  }

  function changeZoom(delta) {
    const nextScale = Math.min(8, Math.max(1, zoomScale + delta));
    if (nextScale === zoomScale) return;
    zoomScale = nextScale;
    updateZoomLayout(true);
  }

  function updatePagingControls() {
    const hasMultipleItems = activeItems.length > 1;
    previousButton.hidden = !hasMultipleItems;
    nextButton.hidden = !hasMultipleItems;
    lightboxCount.textContent = `${activeIndex + 1} / ${activeItems.length}`;
  }

  function showImage(index) {
    if (!activeItems.length) return;
    activeIndex = (index + activeItems.length) % activeItems.length;
    const item = activeItems[activeIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    updatePagingControls();
    resetZoom();

    if (activeGallery) {
      const mainImage = activeGallery.querySelector('.gallery-main');
      const thumbnails = activeGallery.querySelectorAll('.gallery-thumb');
      mainImage.src = item.src;
      thumbnails.forEach((thumbnail, thumbnailIndex) => {
        thumbnail.classList.toggle('is-active', thumbnailIndex === activeIndex);
      });
    }
  }

  function openItems(items, index = 0, gallery = null) {
    const validItems = items.filter((item) => item.src);
    if (!validItems.length) return;
    activeGallery = gallery;
    activeItems = validItems;
    showImage(index);
    if (!lightbox.open) lightbox.showModal();
    requestAnimationFrame(resetZoom);
  }

  function openGallery(gallery) {
    const thumbnails = [...gallery.querySelectorAll('.gallery-thumb')];
    const items = thumbnails.map((thumbnail) => ({
      src: thumbnail.dataset.src,
      alt: thumbnail.dataset.alt
    }));
    const selectedIndex = Math.max(0, thumbnails.findIndex((thumbnail) => thumbnail.classList.contains('is-active')));
    openItems(items, selectedIndex, gallery);
  }

  function openStandalone(figure) {
    const group = figure.dataset.lightboxGroup;
    const figures = group
      ? [...document.querySelectorAll('[data-lightbox-src]')].filter((item) => item.dataset.lightboxGroup === group)
      : [figure];
    const items = figures.map((item) => ({ src: item.dataset.lightboxSrc, alt: item.dataset.lightboxAlt }));
    openItems(items, Math.max(0, figures.indexOf(figure)));
  }

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const mainImage = gallery.querySelector('.gallery-main');
    const openButton = gallery.querySelector('.gallery-open');
    const thumbnails = gallery.querySelectorAll('.gallery-thumb');

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        mainImage.src = thumbnail.dataset.src;
        thumbnails.forEach((item) => item.classList.remove('is-active'));
        thumbnail.classList.add('is-active');
      });
    });

    openButton?.addEventListener('click', () => openGallery(gallery));
    mainImage.addEventListener('click', () => openGallery(gallery));
    mainImage.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openGallery(gallery);
      }
    });
  });

  document.querySelectorAll('[data-lightbox-src]').forEach((figure) => {
    const image = figure.querySelector('img');
    const openButton = figure.querySelector('.gallery-open');
    openButton?.addEventListener('click', () => openStandalone(figure));
    const skipImageClick = figure.classList.contains('provider-card') || figure.getAttribute('data-kind') === 'scroll';
    if (!skipImageClick) image?.addEventListener('click', () => openStandalone(figure));
    image?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStandalone(figure);
      }
    });
  });

  const valueGallery = [...document.querySelectorAll('[data-value-gallery]')];
  const valueItems = valueGallery.map((item) => {
    const image = item.querySelector('img');
    return {
      src: item.dataset.fullSrc || image?.getAttribute('src') || '',
      alt: image?.alt || '服务场景图片'
    };
  });
  valueGallery.forEach((item, index) => {
    item.addEventListener('click', () => openItems(valueItems, index));
  });

  const opportunityOpen = document.querySelector('.opportunity-quadrant-open');
  opportunityOpen?.addEventListener('click', () => {
    const image = opportunityOpen.querySelector('img');
    openItems([{ src: image?.getAttribute('src') || '', alt: image?.alt || '机会象限图' }]);
  });

  previousButton.addEventListener('click', () => showImage(activeIndex - 1));
  nextButton.addEventListener('click', () => showImage(activeIndex + 1));
  zoomOutButton.addEventListener('click', () => changeZoom(-1));
  zoomInButton.addEventListener('click', () => changeZoom(1));
  zoomResetButton.addEventListener('click', resetZoom);
  lightboxImage.addEventListener('click', () => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    if (zoomScale > 1) resetZoom();
    else changeZoom(1);
  });
  lightboxViewport.addEventListener('pointerdown', (event) => {
    if (!lightboxViewport.classList.contains('is-pannable')) return;
    isDragging = true;
    didDrag = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartScrollLeft = lightboxViewport.scrollLeft;
    dragStartScrollTop = lightboxViewport.scrollTop;
    lightboxViewport.classList.add('is-dragging');
    lightboxViewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  lightboxViewport.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    if (Math.abs(event.clientX - dragStartX) > 4 || Math.abs(event.clientY - dragStartY) > 4) didDrag = true;
    lightboxViewport.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
    lightboxViewport.scrollTop = dragStartScrollTop - (event.clientY - dragStartY);
  });
  function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    lightboxViewport.classList.remove('is-dragging');
    if (event.pointerId !== undefined && lightboxViewport.hasPointerCapture(event.pointerId)) {
      lightboxViewport.releasePointerCapture(event.pointerId);
    }
  }
  lightboxViewport.addEventListener('pointerup', stopDragging);
  lightboxViewport.addEventListener('pointercancel', stopDragging);
  lightboxImage.addEventListener('load', () => {
    if (lightbox.open) requestAnimationFrame(resetZoom);
  });
  closeButton.addEventListener('click', () => {
    resetZoom();
    lightbox.close();
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      resetZoom();
      lightbox.close();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.open) return;
    if (event.key === 'ArrowLeft' && activeItems.length > 1) showImage(activeIndex - 1);
    if (event.key === 'ArrowRight' && activeItems.length > 1) showImage(activeIndex + 1);
    if (event.key === '+' || event.key === '=') changeZoom(1);
    if (event.key === '-') changeZoom(-1);
    if (event.key === '0') resetZoom();
  });
  window.addEventListener('resize', () => {
    if (lightbox.open) resetZoom();
  });
})();

