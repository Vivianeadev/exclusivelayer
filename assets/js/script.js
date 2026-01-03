// assets/js/script.js - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Exclusive Layer - JavaScript inicializado');
    
    // ================= MENU MOBILE =================
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            const isDisplayed = navLinks.style.display === 'flex';
            navLinks.style.display = isDisplayed ? 'none' : 'flex';
            
            if (!isDisplayed) {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                navLinks.style.zIndex = '1000';
            }
        });
        
        // Fechar menu ao clicar em um link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinks.style.display = 'none';
                }
            });
        });
    }
    
    // ================= SCROLL SUAVE =================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Fechar menu mobile se aberto
                if (window.innerWidth <= 768 && navLinks && navLinks.style.display === 'flex') {
                    navLinks.style.display = 'none';
                }
                
                // Scroll suave
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Atualizar URL sem recarregar
                history.pushState(null, null, targetId);
            }
        });
    });
    
    // ================= FORMULÁRIO =================
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação simples
            const nome = this.querySelector('input[type="text"]').value.trim();
            const email = this.querySelector('input[type="email"]').value.trim();
            const mensagem = this.querySelector('textarea').value.trim();
            
            if (!nome || !email || !mensagem) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            if (!isValidEmail(email)) {
                alert('Por favor, insira um email válido.');
                return;
            }
            
            // Simulação de envio
            console.log('📤 Enviando formulário:', { nome, email, mensagem });
            alert('✅ Mensagem enviada com sucesso! Entraremos em contato em breve.');
            this.reset();
        });
    }
    
    // ================= HEADER SCROLL =================
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                header.style.background = 'white';
                header.style.backdropFilter = 'none';
            }
        }
    });
    
    // ================= ANIMAÇÕES AO SCROLL =================
    function initAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);
        
        // Observar elementos para animação
        document.querySelectorAll('.service-card, .about-content, .contact-form').forEach(el => {
            observer.observe(el);
        });
    }
    
    // ================= FUNÇÕES AUXILIARES =================
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // ================= INICIALIZAR TUDO =================
    initAnimations();
    
    // Log de sucesso
    console.log('✅ Todos os scripts foram inicializados com sucesso!');
    
    // Adicionar classe de JS carregado ao body
    document.body.classList.add('js-loaded');
});

// Tratar erros globais
window.addEventListener('error', function(e) {
    console.error('❌ Erro no JavaScript:', e.error);
});

// Forçar recarregamento do CSS ao trocar de aba (para alguns bugs)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(sheet => {
            sheet.href = sheet.href.replace(/\?.*|$/, '?' + Date.now());
        });
    }
});