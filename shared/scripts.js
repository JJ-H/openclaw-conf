// ============================================
// SLIDE PRESENTATION CONTROLLER
// ============================================
class SlidePresentation {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.isScrolling = false;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupKeyboardNav();
        this.setupTouchNav();
        this.setupProgressBar();
        this.setupNavDots();
        this.updateProgress();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        this.currentSlide = Array.from(this.slides).indexOf(entry.target);
                        this.updateNavDots();
                        this.updateProgress();
                    }
                });
            },
            { threshold: 0.5 }
        );

        this.slides.forEach((slide) => observer.observe(slide));
    }

    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;
            }
        });
    }

    setupTouchNav() {
        let touchStartY = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartY, touchEndY);
        }, { passive: true });
    }

    handleSwipe(startY, endY) {
        const threshold = 50;
        const diff = startY - endY;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }

    setupProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    setupNavDots() {
        const navDots = document.getElementById('navDots');
        if (!navDots) return;

        navDots.innerHTML = '';
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            dot.addEventListener('click', () => this.goToSlide(index));
            navDots.appendChild(dot);
        });

        this.updateNavDots();
    }

    updateNavDots() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.slides[index].scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// ============================================
// INLINE EDITOR
// ============================================
class InlineEditor {
    constructor() {
        this.isActive = false;
        this.editableElements = [];
        this.init();
    }

    init() {
        this.createEditUI();
        this.setupEventListeners();
        this.loadSavedContent();
    }

    createEditUI() {
        // Create hotzone
        const hotzone = document.createElement('div');
        hotzone.className = 'edit-hotzone';
        document.body.appendChild(hotzone);

        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'edit-toggle';
        toggle.id = 'editToggle';
        toggle.innerHTML = '✏️';
        toggle.title = 'Edit mode (E)';
        document.body.appendChild(toggle);

        // Create save indicator
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.id = 'saveIndicator';
        indicator.textContent = '已自动保存';
        document.body.appendChild(indicator);

        this.hotzone = hotzone;
        this.toggle = toggle;
        this.indicator = indicator;
    }

    setupEventListeners() {
        let hideTimeout = null;

        // Hotzone hover with 400ms grace period
        this.hotzone.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            this.toggle.classList.add('show');
        });

        this.hotzone.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                if (!this.isActive) this.toggle.classList.remove('show');
            }, 400);
        });

        this.toggle.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });

        this.toggle.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                if (!this.isActive) this.toggle.classList.remove('show');
            }, 400);
        });

        // Click handlers
        this.hotzone.addEventListener('click', () => this.toggleEditMode());
        this.toggle.addEventListener('click', () => this.toggleEditMode());

        // Keyboard shortcut for edit mode toggle
        document.addEventListener('keydown', (e) => {
            const isEditing = e.target.getAttribute('contenteditable') === 'true';
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if ((e.key === 'e' || e.key === 'E') && !isEditing && !isInput) {
                e.preventDefault();
                this.toggleEditMode();
            }
        });

        // Auto-save on input
        document.addEventListener('input', (e) => {
            if (e.target.getAttribute('contenteditable') === 'true') {
                this.autoSave();
            }
        });

        // Ctrl+S to save and export
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportFile();
            }
        });
    }

    toggleEditMode() {
        this.isActive = !this.isActive;
        this.toggle.classList.toggle('active', this.isActive);

        if (this.isActive) {
            this.enableEditing();
        } else {
            this.disableEditing();
        }
    }

    enableEditing() {
        // Find all editable text elements
        const selectors = [
            '.slide-title',
            '.slide-subtitle',
            '.slide-heading',
            '.slide-text',
            '.concept-title',
            '.concept-desc',
            '.feature-title',
            '.feature-desc',
            '.stat-label',
            '.terminal-input',
            '.terminal-output',
            '.event-info div'
        ];

        this.editableElements = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.setAttribute('contenteditable', 'true');
                el.setAttribute('data-editable-id', `${selector}-${index}`);
                this.editableElements.push(el);
            });
        });

        this.showIndicator('编辑模式已开启，点击文字即可编辑');
    }

    disableEditing() {
        this.editableElements.forEach(el => {
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-editable-id');
        });
        this.editableElements = [];
        this.showIndicator('编辑模式已关闭');
    }

    autoSave() {
        const content = {};
        this.editableElements.forEach(el => {
            const id = el.getAttribute('data-editable-id');
            if (id) {
                content[id] = el.innerHTML;
            }
        });
        localStorage.setItem('openclaw-ppt-content', JSON.stringify(content));
        this.showIndicator('已自动保存');
    }

    loadSavedContent() {
        const saved = localStorage.getItem('openclaw-ppt-content');
        if (!saved) return;

        try {
            const content = JSON.parse(saved);
            Object.keys(content).forEach(id => {
                const el = document.querySelector(`[data-editable-id="${id}"]`);
                if (el) {
                    el.innerHTML = content[id];
                }
            });
        } catch (e) {
            console.error('Failed to load saved content:', e);
        }
    }

    showIndicator(message) {
        this.indicator.textContent = message;
        this.indicator.classList.add('show');
        setTimeout(() => {
            this.indicator.classList.remove('show');
        }, 2000);
    }

    exportFile() {
        const html = document.documentElement.outerHTML;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'openclaw-gitee-ppt-edited.html';
        a.click();
        URL.revokeObjectURL(url);
        this.showIndicator('文件已导出');
    }
}

// ============================================
// LIGHTBOX FUNCTIONALITY
// ============================================
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// ============================================
// TAB SWITCHING
// ============================================
function showTab(tabId, btn) {
    // Find the closest tab container (terminal-window) to isolate this tab group
    const container = btn.closest('.terminal-window');
    
    // Hide all content and tabs within this specific container
    container.querySelectorAll('.install-content').forEach(content => {
        content.classList.remove('active');
    });
    container.querySelectorAll('.install-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected content
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// ============================================
// COPY TO CLIPBOARD
// ============================================
async function copyToClipboard(elementId, btn) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Get text content, removing HTML tags
    let text = element.innerText || element.textContent;

    // Try modern clipboard API first (HTTPS only)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            showCopySuccess(btn);
            return;
        } catch (err) {
            console.log('Clipboard API failed, falling back:', err);
        }
    }

    // Fallback for HTTP environments
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            showCopySuccess(btn);
        } else {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showCopyError(btn);
    }
}

function showCopySuccess(btn) {
    const originalHTML = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '<span>✓</span> 已复制';

    setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalHTML;
    }, 2000);
}

function showCopyError(btn) {
    btn.innerHTML = '<span>❌</span> 失败';
    setTimeout(() => {
        btn.innerHTML = '<span>📋</span> 复制';
    }, 2000);
}

// ============================================
// INITIALIZE
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SlidePresentation();
        new InlineEditor();
    });
} else {
    new SlidePresentation();
    new InlineEditor();
}
