// CanarIAgentic - Evervault Card Effect in Vanilla JavaScript
// Compatible with Hono + TailwindCSS architecture

class EvervaultCard {
    constructor(element) {
        this.element = element;
        this.canvas = null;
        this.ctx = null;
        this.characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHovering = false;
        this.animationFrame = null;
        this.grid = [];
        this.columns = 0;
        this.rows = 0;
        this.cellSize = 18;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupGrid();
        this.bindEvents();
        this.animate();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '5';
        this.canvas.style.opacity = '1.0';
        
        this.ctx = this.canvas.getContext('2d');
        this.element.appendChild(this.canvas);
        
        this.resize();
    }
    
    resize() {
        const rect = this.element.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.columns = Math.ceil(rect.width / this.cellSize);
        this.rows = Math.ceil(rect.height / this.cellSize);
        
        this.setupGrid();
    }
    
    setupGrid() {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.columns; j++) {
                this.grid[i][j] = {
                    char: this.getRandomChar(),
                    opacity: Math.random() * 0.3 + 0.15, // Base opacity entre 0.15-0.45
                    targetOpacity: Math.random() * 0.3 + 0.15,
                    lastChange: Date.now(),
                    changeInterval: 150 + Math.random() * 300,
                    revealed: false,
                    revealTime: 0
                };
            }
        }
    }
    
    getRandomChar() {
        return this.characters[Math.floor(Math.random() * this.characters.length)];
    }
    
    bindEvents() {
        this.element.addEventListener('mouseenter', (e) => {
            this.isHovering = true;
        });
        
        this.element.addEventListener('mouseleave', (e) => {
            this.isHovering = false;
            // Reset all revealed characters after leaving
            setTimeout(() => {
                if (!this.isHovering) {
                    this.grid.forEach(row => {
                        row.forEach(cell => {
                            cell.revealed = false;
                            cell.revealTime = 0;
                        });
                    });
                }
            }, 500);
        });
        
        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    animate() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    update() {
        const now = Date.now();
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                const cell = this.grid[i][j];
                const cellX = j * this.cellSize;
                const cellY = i * this.cellSize;
                
                // Check if mouse is near this cell
                if (this.isHovering) {
                    const distance = Math.sqrt(
                        Math.pow(this.mouseX - cellX - this.cellSize / 2, 2) +
                        Math.pow(this.mouseY - cellY - this.cellSize / 2, 2)
                    );
                    
                    const revealRadius = 120;
                    if (distance < revealRadius) {
                        cell.revealed = true;
                        cell.revealTime = now;
                        // Create ripple effect - MUCHO más visible
                        const intensity = (revealRadius - distance) / revealRadius;
                        cell.targetOpacity = Math.min(1.0, 0.5 + intensity * 0.5);
                    } else if (cell.revealed && now - cell.revealTime > 2000) {
                        // Fade out después de 2 segundos
                        cell.revealed = false;
                        cell.targetOpacity = Math.random() * 0.3 + 0.15;
                    }
                }
                
                // Update character periodically - más frecuente para más dinamismo
                if (now - cell.lastChange > cell.changeInterval) {
                    if (!cell.revealed || Math.random() > 0.6) {
                        cell.char = this.getRandomChar();
                        cell.lastChange = now;
                        cell.changeInterval = 80 + Math.random() * 150; // Más rápido
                    }
                }
                
                // Smooth opacity transition
                const opacityDiff = cell.targetOpacity - cell.opacity;
                cell.opacity += opacityDiff * 0.1;
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set font
        this.ctx.font = '11px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw characters
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                const cell = this.grid[i][j];
                const x = j * this.cellSize + this.cellSize / 2;
                const y = i * this.cellSize + this.cellSize / 2;
                
                if (cell.revealed) {
                    // Revealed characters - AZULES SÚPER VISIBLES DE LA EMPRESA
                    const distance = Math.sqrt(
                        Math.pow(this.mouseX - x, 2) + Math.pow(this.mouseY - y, 2)
                    );
                    
                    // Crear gradiente con azules súper intensos y visibles
                    if (distance < 40) {
                        // Muy cerca - AZUL SECUNDARIO MÁXIMA INTENSIDAD (#3b82f6)
                        this.ctx.fillStyle = `rgba(59, 130, 246, 1.0)`; 
                    } else if (distance < 80) {
                        // Distancia media - AZUL ACCENT MÁXIMA INTENSIDAD (#06b6d4)
                        this.ctx.fillStyle = `rgba(6, 182, 212, 0.95)`;
                    } else {
                        // Más lejos - AZUL SECUNDARIO VISIBLE
                        this.ctx.fillStyle = `rgba(59, 130, 246, 0.8)`;
                    }
                } else {
                    // Normal characters - AZUL OSCURO SÚPER VISIBLE
                    this.ctx.fillStyle = `rgba(37, 99, 235, 0.6)`;
                }
                
                this.ctx.fillText(cell.char, x, y);
            }
        }
        
        // Add glow effect when hovering - AZULES SÚPER INTENSOS
        if (this.isHovering) {
            const glowRadius = 180;
            const gradient = this.ctx.createRadialGradient(
                this.mouseX, this.mouseY, 0,
                this.mouseX, this.mouseY, glowRadius
            );
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // AZUL SECUNDARIO central intenso
            gradient.addColorStop(0.3, 'rgba(6, 182, 212, 0.3)'); // AZUL ACCENT intenso
            gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.15)'); // AZUL SECUNDARIO suave
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Añadir un segundo anillo de brillo SÚPER intenso
            const innerGlowRadius = 80;
            const innerGradient = this.ctx.createRadialGradient(
                this.mouseX, this.mouseY, 0,
                this.mouseX, this.mouseY, innerGlowRadius
            );
            innerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)'); // AZUL SECUNDARIO máximo
            innerGradient.addColorStop(0.4, 'rgba(6, 182, 212, 0.5)'); // AZUL ACCENT máximo
            innerGradient.addColorStop(0.8, 'rgba(59, 130, 246, 0.25)'); // AZUL SECUNDARIO medio
            innerGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = innerGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Main App Functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Evervault Card for Hero Section
    const heroSection = document.getElementById('home');
    if (heroSection) {
        // Create evervault container
        const evervaultContainer = document.createElement('div');
        evervaultContainer.className = 'evervault-card-bg';
        evervaultContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 5;
            pointer-events: none;
        `;
        
        // Insert before existing content
        heroSection.insertBefore(evervaultContainer, heroSection.firstChild);
        
        // Initialize Evervault effect
        new EvervaultCard(evervaultContainer);
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
            
            // Change icon
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close mobile menu when clicking on links
        document.querySelectorAll('.mobile-menu-link').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('open');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            // Loading state
            submitButton.innerHTML = '<div class="spinner mr-2"></div>Enviando...';
            submitButton.disabled = true;
            
            try {
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
                    this.reset();
                } else {
                    showNotification(result.message || 'Error al enviar el mensaje', 'error');
                }
            } catch (error) {
                showNotification('Error de conexión. Inténtalo de nuevo.', 'error');
                console.error('Contact form error:', error);
            } finally {
                // Reset button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Newsletter Form Handling
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<div class="spinner mr-2"></div>Suscribiendo...';
            submitButton.disabled = true;
            
            try {
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                const response = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('¡Suscripción exitosa!', 'success');
                    this.reset();
                } else {
                    showNotification(result.message || 'Error en la suscripción', 'error');
                }
            } catch (error) {
                showNotification('Error de conexión', 'error');
                console.error('Newsletter error:', error);
            } finally {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all sections with fade-in animation
    document.querySelectorAll('.section-fade-in').forEach(section => {
        observer.observe(section);
    });

    // Enhanced AI background mouse interaction - DISABLED for Evervault effect
    // All previous animations are now disabled to prevent interference with Evervault
    console.log('Previous AI animations disabled - Evervault effect active');

    // Initialize Cookie Management
    initializeCookieManagement();
});

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    notification.className += ` ${bgColor} text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Cookie Management System
function initializeCookieManagement() {
    // Check if user has already made a decision
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (!cookieConsent) {
        showCookieBanner();
    } else {
        const consentData = JSON.parse(cookieConsent);
        applyCookieSettings(consentData.settings);
    }
}

function showCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('show');
        
        // Accept all cookies
        const acceptAllBtn = document.getElementById('accept-all-cookies');
        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', function() {
                const settings = {
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    preferences: true
                };
                saveCookieConsent('accept_all', settings);
                hideCookieBanner();
            });
        }
        
        // Reject all cookies (except necessary)
        const rejectAllBtn = document.getElementById('reject-all-cookies');
        if (rejectAllBtn) {
            rejectAllBtn.addEventListener('click', function() {
                const settings = {
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    preferences: false
                };
                saveCookieConsent('reject_all', settings);
                hideCookieBanner();
            });
        }
        
        // Customize cookies
        const customizeBtn = document.getElementById('cookie-settings-btn');
        if (customizeBtn) {
            customizeBtn.addEventListener('click', function() {
                showCookieSettings();
            });
        }
    }
}

function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.remove('show');
        banner.classList.add('hide');
    }
}

function showCookieSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
        modal.classList.add('show');
        
        // Save custom settings
        const saveSettingsBtn = document.getElementById('save-cookie-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', function() {
                const analyticsCheckbox = document.getElementById('analytics-cookies');
                const marketingCheckbox = document.getElementById('marketing-cookies');
                const preferencesCheckbox = document.getElementById('preferences-cookies');
                
                const settings = {
                    necessary: true, // Always true
                    analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
                    marketing: marketingCheckbox ? marketingCheckbox.checked : false,
                    preferences: preferencesCheckbox ? preferencesCheckbox.checked : false
                };
                saveCookieConsent('custom', settings);
                hideCookieSettings();
                hideCookieBanner();
            });
        }
        
        // Close modal
        const closeSettingsBtn = document.getElementById('close-cookie-settings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', function() {
                hideCookieSettings();
            });
        }
    }
}

function hideCookieSettings() {
    const modal = document.getElementById('cookie-settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function saveCookieConsent(decisionType, settings) {
    const consentData = {
        decision_type: decisionType,
        settings: settings,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    
    // Send to backend for legal compliance
    try {
        const response = await fetch('/api/cookie-consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: getUserId(),
                decision_type: decisionType,
                cookie_settings: settings,
                page_url: window.location.href
            })
        });
        
        const result = await response.json();
        console.log('Cookie consent logged:', result);
    } catch (error) {
        console.error('Error logging cookie consent:', error);
    }
    
    // Apply settings
    applyCookieSettings(settings);
}

function applyCookieSettings(settings) {
    // Apply cookie settings based on user preferences
    if (settings.analytics) {
        // Enable analytics cookies (Google Analytics, etc.)
        console.log('Analytics cookies enabled');
    }
    
    if (settings.marketing) {
        // Enable marketing cookies
        console.log('Marketing cookies enabled');
    }
    
    if (settings.preferences) {
        // Enable preferences cookies
        console.log('Preferences cookies enabled');
    }
}

function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now();
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Performance optimizations
// Debounce function for mouse events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

console.log('CanarIAgentic App initialized with Evervault effect');