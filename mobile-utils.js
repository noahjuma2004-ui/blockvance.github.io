/**
 * Mobile Utilities - Blockvance
 * Optional JavaScript helpers for improved mobile experience
 * Include in your HTML: <script src="mobile-utils.js"></script>
 */

// 1. PREVENT ZOOM ON DOUBLE-TAP
(function() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    let now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
})();

// 2. SMOOTH SCROLL FOR ANCHOR LINKS
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// 3. DETECT MOBILE DEVICE
const IsMobile = {
  Android: function() {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function() {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function() {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function() {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function() {
    return (IsMobile.Android() || IsMobile.BlackBerry() || 
            IsMobile.iOS() || IsMobile.Opera() || IsMobile.Windows());
  }
};

// Usage: if (IsMobile.Android()) { console.log("Android device"); }

// 4. DISABLE PINCH ZOOM ON MOBILE (optional)
function disablePinchZoom() {
  document.addEventListener('touchmove', function(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
}

// Usage: disablePinchZoom();
// Comment this out to allow pinch-zoom

// 5. IMPROVE INPUT FOCUS ON MOBILE
document.querySelectorAll('input, textarea, select').forEach(input => {
  input.addEventListener('focus', function() {
    // Scroll the input into view when focused
    setTimeout(() => {
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
});

// 6. HANDLE MOBILE KEYBOARD
window.addEventListener('keyboardDidShow', function() {
  document.body.classList.add('keyboard-visible');
});

window.addEventListener('keyboardDidHide', function() {
  document.body.classList.remove('keyboard-visible');
});

// 7. DETECT SCREEN ORIENTATION
function handleOrientationChange() {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
  
  if (isPortrait) {
    document.body.classList.remove('landscape');
    document.body.classList.add('portrait');
  }
  if (isLandscape) {
    document.body.classList.remove('portrait');
    document.body.classList.add('landscape');
  }
}

window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Run on page load
document.addEventListener('DOMContentLoaded', handleOrientationChange);

// 8. IMPROVE LINK TOUCH TARGETS
(function() {
  const links = document.querySelectorAll('a, button');
  links.forEach(link => {
    const rect = link.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      link.style.padding = link.style.padding || '12px 16px';
    }
  });
})();

// 9. PREVENT RUBBER BAND EFFECT ON iOS
document.addEventListener('touchmove', function(event) {
  if (event.target === document.body) {
    event.preventDefault();
  }
}, { passive: false });

// 10. VIBRATION FEEDBACK ON BUTTON CLICK (requires permission)
function addVibrationFeedback() {
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
      if (navigator.vibrate) {
        navigator.vibrate(10); // 10ms vibration
      }
    });
  });
}

// Usage: addVibrationFeedback();

// 11. HANDLE VIEWPORT HEIGHT CHANGES (mobile keyboard)
function handleViewportHeight() {
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
}

handleViewportHeight();

// You can now use var(--vh) in CSS for 100vh on mobile:
// height: calc(var(--vh, 1vh) * 100);

// 12. OPTIMIZE FOR HIGH DPI SCREENS
if (window.devicePixelRatio > 1) {
  document.querySelectorAll('img[src]').forEach(img => {
    const srcset = img.getAttribute('data-srcset-2x');
    if (srcset) {
      img.srcset = srcset;
    }
  });
}

// 13. LAZY LOAD IMAGES
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// 14. SOCIAL MEDIA FRIENDLY - SHARE FUNCTIONALITY
function shareToSocial(platform, url, title, description) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || document.title);
  const encodedDesc = encodeURIComponent(description || '');
  
  let shareUrl = '';
  
  switch(platform.toLowerCase()) {
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

// Usage: shareToSocial('whatsapp', '', 'Check out Blockvance!');

// 15. NETWORK STATUS CHECK
window.addEventListener('online', function() {
  console.log('Connection restored');
  document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
  console.log('Connection lost');
  document.body.classList.add('offline');
});

// Log initial status
console.log('Online status:', navigator.onLine);

console.log('✅ Mobile utilities loaded successfully');
