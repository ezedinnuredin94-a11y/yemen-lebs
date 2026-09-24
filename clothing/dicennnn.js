
      const buttons = document.querySelectorAll('.tab-btn');
      const pieces = document.querySelectorAll('#grid .piece');

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');

pieces.forEach(piece => {
  const image = piece.querySelector('img');

  image.addEventListener('click', event => {
    event.stopPropagation();

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add('open');
  });
});

lightboxClose.addEventListener('click', () => {
  lightbox.classList.remove('open');
  lightboxImage.src = '';
});

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) {
    lightbox.classList.remove('open');
    lightboxImage.src = '';
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    lightbox.classList.remove('open');
    lightboxImage.src = '';
  }
});


      function filterCategory(category, showAll = false) {
        document.querySelectorAll('.more-overlay').forEach(el => el.remove());

        const matchingPieces = Array.from(pieces).filter(piece => piece.getAttribute('data-cat') === category);

        pieces.forEach(p => p.classList.remove('show'));

        matchingPieces.forEach((piece, index) => {
          if (showAll || index < 4) {
            piece.classList.add('show');
          }

          if (!showAll && index === 3 && matchingPieces.length > 4) {
            const remaining = matchingPieces.length - 4;
            const overlay = document.createElement('div');
            overlay.className = 'more-overlay';
            overlay.textContent = `+${remaining} More`;

            overlay.addEventListener('click', (e) => {
              e.stopPropagation();
              filterCategory(category, true);
            });

            piece.appendChild(overlay);
          }
        });
      }

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          button.classList.add('active');

          const cat = button.getAttribute('data-cat');
          filterCategory(cat, false);
        });
      });

      filterCategory('illustrator', false);
  