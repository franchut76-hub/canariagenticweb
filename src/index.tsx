import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// API endpoint for contact form
app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, company, phone, message, service } = body
    
    // Basic validation
    if (!name || !email || !message) {
      return c.json({ success: false, message: 'Faltan campos requeridos' }, 400)
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ success: false, message: 'Email inválido' }, 400)
    }
    
    // Get Supabase credentials from environment variables (secure)
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured')
      // Fallback to console log if Supabase not configured
      console.log('Contact form submission (fallback):', {
        name, email, company, phone, message, service,
        timestamp: new Date().toISOString()
      })
      return c.json({ 
        success: true, 
        message: 'Mensaje recibido correctamente. Te contactaremos pronto.' 
      })
    }
    
    // Prepare contact data
    const contactData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      message: message.trim(),
      service: service || null,
      created_at: new Date().toISOString(),
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      user_agent: c.req.header('User-Agent') || 'unknown'
    }
    
    // Save to Supabase
    const supabaseResponse = await fetch(supabaseUrl + '/rest/v1/contactos', {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(contactData)
    })
    
    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text()
      console.error('Supabase error:', {
        status: supabaseResponse.status,
        statusText: supabaseResponse.statusText,
        error: errorText
      })
      
      // Fallback to console log if Supabase fails
      console.log('Contact form submission (fallback after error):', contactData)
      
      return c.json({ 
        success: true, 
        message: 'Mensaje recibido correctamente. Te contactaremos pronto.' 
      })
    }
    
    console.log('Contact successfully saved to Supabase:', {
      name: contactData.name,
      email: contactData.email,
      timestamp: contactData.created_at
    })
    
    return c.json({ 
      success: true, 
      message: 'Mensaje enviado correctamente. Te contactaremos pronto.' 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return c.json({ 
      success: false, 
      message: 'Error interno del servidor. Inténtalo de nuevo.' 
    }, 500)
  }
})

// API endpoint for newsletter subscription
app.post('/api/newsletter', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return c.json({ success: false, message: 'Email inválido' }, 400)
    }
    
    console.log('Newsletter subscription:', { email, timestamp: new Date().toISOString() })
    
    return c.json({ 
      success: true, 
      message: 'Te has suscrito correctamente al newsletter' 
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return c.json({ 
      success: false, 
      message: 'Error al suscribirse' 
    }, 500)
  }
})

// Default route - Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="CanarIAgentic - Agencia líder en soluciones de inteligencia artificial para empresas. Formación, consultoría y desarrollo de agentes IA.">
        <meta name="keywords" content="inteligencia artificial, IA, consultoría IA, formación IA, agentes IA, transformación digital, Canarias">
        <meta name="author" content="CanarIAgentic">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:title" content="CanarIAgentic - Agencia de Inteligencia Artificial">
        <meta property="og:description" content="Transformando empresas con inteligencia artificial de vanguardia. Formación, consultoría y desarrollo de agentes IA.">
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://canariagentic.pages.dev">
        <meta property="og:image" content="https://canariagentic.pages.dev/static/og-image.jpg">
        
        <!-- Twitter Card Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="CanarIAgentic - Agencia de Inteligencia Artificial">
        <meta name="twitter:description" content="Transformando empresas con inteligencia artificial de vanguardia.">
        
        <title>CanarIAgentic - Agencia de Inteligencia Artificial</title>
        
        <!-- Preload critical resources -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" as="style">
        
        <!-- Critical CSS -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Tailwind Config -->
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            primary: '#0f172a',
                            secondary: '#3b82f6',
                            accent: '#06b6d4',
                            'glass': 'rgba(255, 255, 255, 0.1)'
                        },
                        fontFamily: {
                            'inter': ['Inter', 'sans-serif']
                        },
                        animation: {
                            'float': 'float 3s ease-in-out infinite',
                            'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
                            'slide-up': 'slide-up 0.5s ease-out',
                            'fade-in': 'fade-in 0.6s ease-out'
                        }
                    }
                }
            }
        </script>
        
        <!-- Custom Styles -->
        <style>
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes pulse-glow {
                0% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
                100% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.8); }
            }
            
            @keyframes slide-up {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .glass {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .gradient-text {
                background: linear-gradient(135deg, #06b6d4, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .hover-lift {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            
            html { scroll-behavior: smooth; }
            
            .section-fade-in {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .section-fade-in.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .nav-link {
                position: relative;
                transition: all 0.3s ease;
            }
            
            .nav-link::after {
                content: '';
                position: absolute;
                width: 0;
                height: 2px;
                bottom: -5px;
                left: 50%;
                background: linear-gradient(90deg, #06b6d4, #3b82f6);
                transition: all 0.3s ease;
                transform: translateX(-50%);
            }
            
            .nav-link:hover::after {
                width: 100%;
            }
            
            .btn-gradient {
                background: linear-gradient(135deg, #06b6d4, #3b82f6);
                transition: all 0.3s ease;
            }
            
            .btn-gradient:hover {
                background: linear-gradient(135deg, #0891b2, #2563eb);
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(6, 182, 212, 0.4);
            }
            
            .loading {
                opacity: 0.7;
                pointer-events: none;
            }
            
            .spinner {
                border: 2px solid transparent;
                border-top: 2px solid #06b6d4;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Mobile menu animation */
            .mobile-menu {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-in-out;
            }
            
            .mobile-menu.open {
                max-height: 400px;
            }
            
            /* Parallax effect */
            .parallax {
                background-attachment: fixed;
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            }
            
            /* Custom scrollbar */
            ::-webkit-scrollbar {
                width: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: #f1f5f9;
            }
            
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #06b6d4, #3b82f6);
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #0891b2, #2563eb);
            }
        </style>
    </head>
    <body class="font-inter bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800">
        
        <!-- Navigation -->
        <nav class="fixed w-full top-0 z-50 glass transition-all duration-300" id="navbar">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-20">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <a href="#home" class="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                            <div class="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center animate-float">
                                <i class="fas fa-robot text-white text-xl"></i>
                            </div>
                            <span class="text-2xl font-bold gradient-text">CanarIAgentic</span>
                        </a>
                    </div>
                    
                    <!-- Desktop Navigation -->
                    <div class="hidden md:block">
                        <div class="flex items-center space-x-8">
                            <a href="#home" class="nav-link text-slate-700 hover:text-accent font-medium">Inicio</a>
                            <a href="#pillars" class="nav-link text-slate-700 hover:text-accent font-medium">Pilares</a>
                            <a href="#services" class="nav-link text-slate-700 hover:text-accent font-medium">Servicios</a>
                            <a href="#testimonials" class="nav-link text-slate-700 hover:text-accent font-medium">Testimonios</a>
                            <a href="#contact" class="btn-gradient text-white px-6 py-2 rounded-full font-medium">
                                <i class="fas fa-envelope mr-2"></i>Contacto
                            </a>
                        </div>
                    </div>
                    
                    <!-- Mobile menu button -->
                    <div class="md:hidden">
                        <button id="mobile-menu-btn" class="text-slate-700 hover:text-accent transition-colors">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Mobile Navigation -->
                <div class="md:hidden mobile-menu" id="mobile-menu">
                    <div class="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-lg rounded-lg mt-2">
                        <a href="#home" class="block px-3 py-2 text-slate-700 hover:text-accent font-medium mobile-menu-link">Inicio</a>
                        <a href="#pillars" class="block px-3 py-2 text-slate-700 hover:text-accent font-medium mobile-menu-link">Pilares</a>
                        <a href="#services" class="block px-3 py-2 text-slate-700 hover:text-accent font-medium mobile-menu-link">Servicios</a>
                        <a href="#testimonials" class="block px-3 py-2 text-slate-700 hover:text-accent font-medium mobile-menu-link">Testimonios</a>
                        <a href="#contact" class="block px-3 py-2 text-slate-700 hover:text-accent font-medium mobile-menu-link">Contacto</a>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Hero Section -->
        <section id="home" class="relative min-h-screen flex items-center justify-center overflow-hidden">
            <!-- Background Elements -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-10"></div>
            <div class="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
            <div class="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow"></div>
            
            <div class="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div class="animate-fade-in">
                    <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Transformando Empresas con
                        <span class="gradient-text block mt-2">Inteligencia Artificial</span>
                    </h1>
                    <p class="text-xl md:text-2xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
                        CanarIAgentic es la agencia líder en soluciones de IA que impulsa la innovación y eficiencia empresarial a través de tecnología vanguardista y estrategias personalizadas.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <a href="#contact" class="btn-gradient text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center space-x-3 hover-lift">
                            <i class="fas fa-rocket"></i>
                            <span>Empezar Ahora</span>
                        </a>
                        <a href="#pillars" class="glass text-slate-700 px-8 py-4 rounded-full font-semibold text-lg flex items-center space-x-3 hover-lift">
                            <i class="fas fa-info-circle"></i>
                            <span>Conocer Más</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- Scroll indicator -->
            <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <a href="#pillars" class="text-slate-400 hover:text-accent transition-colors">
                    <i class="fas fa-chevron-down text-2xl"></i>
                </a>
            </div>
        </section>
        
        <!-- Pillars Section -->
        <section id="pillars" class="py-20 lg:py-32">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16 section-fade-in">
                    <h2 class="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
                        Nuestros <span class="gradient-text">Pilares Fundamentales</span>
                    </h2>
                    <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                        En CanarIAgentic basamos nuestra estrategia en tres pilares que garantizan el éxito en la transformación digital de las empresas modernas.
                    </p>
                </div>
                
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Pillar 1: Formación -->
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
                                <i class="fas fa-graduation-cap text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Formación Personalizada de IA</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Desarrollamos programas de capacitación a medida para que tu equipo domine las herramientas y conceptos de inteligencia artificial más avanzados.
                        </p>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Diagnóstico inicial de competencias digitales</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Programas formativos a medida</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Talleres prácticos con casos reales</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Acompañamiento en implementación</span>
                            </li>
                        </ul>
                        <button onclick="openModal('formacion')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors">
                            <i class="fas fa-eye mr-2"></i>Ver Detalles
                        </button>
                    </div>
                    
                    <!-- Pillar 2: Consultoría -->
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style="animation-delay: 0.2s;">
                                <i class="fas fa-lightbulb text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Consultoría Vanguardista</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Ayudamos a las empresas a identificar oportunidades de mejora e innovación mediante el análisis estratégico con inteligencia artificial.
                        </p>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Análisis de madurez digital y de IA</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Identificación de casos de uso prioritarios</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Diseño de estrategias de implementación</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Evaluación de tecnologías y proveedores</span>
                            </li>
                        </ul>
                        <button onclick="openModal('consultoria')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors">
                            <i class="fas fa-eye mr-2"></i>Ver Detalles
                        </button>
                    </div>
                    
                    <!-- Pillar 3: Agentes -->
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style="animation-delay: 0.4s;">
                                <i class="fas fa-cogs text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Creación de Agentes IA</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Diseñamos e implementamos agentes inteligentes que automatizan y optimizan los procesos empresariales de manera eficiente.
                        </p>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Análisis y modelado de procesos</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Diseño de arquitecturas de agentes</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Desarrollo e implementación</span>
                            </li>
                            <li class="flex items-start space-x-3">
                                <i class="fas fa-check-circle text-green-500 mt-1"></i>
                                <span class="text-slate-600">Integración con sistemas existentes</span>
                            </li>
                        </ul>
                        <a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center">
                            <i class="fas fa-external-link-alt mr-2"></i>Ver Demostración
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Services Section -->
        <section id="services" class="py-20 lg:py-32 bg-gradient-to-br from-slate-100 to-blue-100">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16 section-fade-in">
                    <h2 class="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
                        Nuestros <span class="gradient-text">Servicios</span>
                    </h2>
                    <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                        Ofrecemos soluciones integrales de inteligencia artificial adaptadas a las necesidades específicas de cada cliente y sector empresarial.
                    </p>
                </div>
                
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Service 1 -->
                    <div class="section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift">
                        <div class="h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <i class="fas fa-chalkboard-teacher text-white text-6xl"></i>
                        </div>
                        <div class="p-8">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Formación en IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed">
                                Programas de capacitación personalizados para que tu equipo domine las herramientas y conceptos de inteligencia artificial más relevantes.
                            </p>
                            <a href="#contact" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift">
                                <i class="fas fa-info"></i>
                                <span>Más Información</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Service 2 -->
                    <div class="section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift">
                        <div class="h-48 bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                            <i class="fas fa-chart-line text-white text-6xl"></i>
                        </div>
                        <div class="p-8">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Consultoría de IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed">
                                Análisis estratégico para identificar oportunidades de mejora e innovación mediante la implementación de inteligencia artificial.
                            </p>
                            <a href="#contact" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift">
                                <i class="fas fa-info"></i>
                                <span>Más Información</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Service 3 -->
                    <div class="section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift">
                        <div class="h-48 bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                            <i class="fas fa-robot text-white text-6xl"></i>
                        </div>
                        <div class="p-8">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Desarrollo de Agentes IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed">
                                Creación e implementación de agentes inteligentes que automatizan y optimizan los procesos empresariales de forma efectiva.
                            </p>
                            <a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift">
                                <i class="fas fa-external-link-alt"></i>
                                <span>Ver Demostración</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Testimonials Section -->
        <section id="testimonials" class="py-20 lg:py-32">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16 section-fade-in">
                    <h2 class="text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
                        <span class="gradient-text">Testimonios</span> de Clientes
                    </h2>
                    <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                        Descubre lo que dicen las empresas que han confiado en nuestros servicios de inteligencia artificial para transformar sus operaciones.
                    </p>
                </div>
                
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Testimonial 1 -->
                    <div class="section-fade-in bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover-lift">
                        <div class="flex items-center text-yellow-400 mb-4">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p class="text-slate-600 mb-6 italic leading-relaxed">
                            "La formación en IA que recibimos de CanarIAgentic transformó completamente nuestros procesos. Ahora somos 40% más eficientes en análisis de datos."
                        </p>
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-white font-bold mr-4">
                                MR
                            </div>
                            <div>
                                <h4 class="font-semibold text-slate-800">María Rodríguez</h4>
                                <p class="text-slate-500">CEO, TechCorp Canarias</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Testimonial 2 -->
                    <div class="section-fade-in bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover-lift">
                        <div class="flex items-center text-yellow-400 mb-4">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p class="text-slate-600 mb-6 italic leading-relaxed">
                            "Los agentes IA desarrollados por CanarIAgentic han automatizado nuestro servicio al cliente. Reducimos tiempos de respuesta en un 60%."
                        </p>
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-white font-bold mr-4">
                                CL
                            </div>
                            <div>
                                <h4 class="font-semibold text-slate-800">Carlos López</h4>
                                <p class="text-slate-500">Director IT, Innovación S.L.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Testimonial 3 -->
                    <div class="section-fade-in bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover-lift">
                        <div class="flex items-center text-yellow-400 mb-4">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p class="text-slate-600 mb-6 italic leading-relaxed">
                            "La consultoría estratégica nos ayudó a identificar oportunidades que no veíamos. ROI positivo en solo 3 meses."
                        </p>
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white font-bold mr-4">
                                AG
                            </div>
                            <div>
                                <h4 class="font-semibold text-slate-800">Ana García</h4>
                                <p class="text-slate-500">COO, Digital Solutions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Contact Section -->
        <section id="contact" class="py-20 lg:py-32 bg-gradient-to-br from-primary to-secondary">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16 text-white">
                    <h2 class="text-4xl lg:text-5xl font-bold mb-6">
                        Comienza tu <span class="text-accent">Transformación</span> Hoy
                    </h2>
                    <p class="text-xl opacity-90 max-w-3xl mx-auto">
                        Contáctanos para descubrir cómo la inteligencia artificial puede revolucionar tu empresa
                    </p>
                </div>
                
                <div class="grid lg:grid-cols-2 gap-12 items-start">
                    <!-- Contact Info -->
                    <div class="text-white">
                        <h3 class="text-3xl font-bold mb-8">¿Listo para Innovar?</h3>
                        <p class="text-xl mb-8 opacity-90">
                            Nuestro equipo de expertos está preparado para guiarte en cada paso de tu transformación digital con IA.
                        </p>
                        
                        <div class="space-y-6">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-envelope text-accent text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold">Email</h4>
                                    <p class="opacity-80">franchut76business@gmail.com</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-phone text-accent text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold">Teléfono</h4>
                                    <p class="opacity-80">+34 922 150 801</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-map-marker-alt text-accent text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold">Ubicación</h4>
                                    <p class="opacity-80">Santa Cruz de Tenerife, España</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contact Form -->
                    <div class="glass rounded-2xl p-8">
                        <form id="contact-form" class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-white font-medium mb-2">Nombre *</label>
                                    <input type="text" name="name" required 
                                           class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:border-accent focus:outline-none transition-colors">
                                </div>
                                <div>
                                    <label class="block text-white font-medium mb-2">Email *</label>
                                    <input type="email" name="email" required
                                           class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:border-accent focus:outline-none transition-colors">
                                </div>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-white font-medium mb-2">Empresa</label>
                                    <input type="text" name="company"
                                           class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:border-accent focus:outline-none transition-colors">
                                </div>
                                <div>
                                    <label class="block text-white font-medium mb-2">Teléfono</label>
                                    <input type="tel" name="phone"
                                           class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:border-accent focus:outline-none transition-colors">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-white font-medium mb-2">Servicio de Interés</label>
                                <select name="service" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-accent focus:outline-none transition-colors">
                                    <option value="">Seleccionar servicio</option>
                                    <option value="formacion">Formación en IA</option>
                                    <option value="consultoria">Consultoría de IA</option>
                                    <option value="agentes">Desarrollo de Agentes IA</option>
                                    <option value="todo">Todos los servicios</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-white font-medium mb-2">Mensaje *</label>
                                <textarea name="message" rows="4" required
                                          class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:border-accent focus:outline-none transition-colors resize-none"
                                          placeholder="Cuéntanos sobre tu proyecto y cómo podemos ayudarte..."></textarea>
                            </div>
                            
                            <button type="submit" class="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center space-x-2">
                                <span>Enviar Mensaje</span>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        
                        <!-- Alert Messages -->
                        <div id="alert-message" class="hidden mt-4 p-4 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Footer -->
        <footer class="bg-slate-900 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid lg:grid-cols-4 gap-8">
                    <!-- Company Info -->
                    <div class="lg:col-span-2">
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center">
                                <i class="fas fa-robot text-white text-xl"></i>
                            </div>
                            <span class="text-2xl font-bold gradient-text">CanarIAgentic</span>
                        </div>
                        <p class="text-slate-400 mb-6 leading-relaxed">
                            Somos la agencia líder en Canarias especializada en soluciones de inteligencia artificial para empresas. 
                            Transformamos negocios a través de la innovación tecnológica.
                        </p>
                        <div class="flex space-x-4">
                            <a href="#" class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="#" class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
                                <i class="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Quick Links -->
                    <div>
                        <h4 class="text-xl font-semibold mb-6">Enlaces Rápidos</h4>
                        <ul class="space-y-3">
                            <li><a href="#home" class="text-slate-400 hover:text-white transition-colors">Inicio</a></li>
                            <li><a href="#pillars" class="text-slate-400 hover:text-white transition-colors">Pilares</a></li>
                            <li><a href="#services" class="text-slate-400 hover:text-white transition-colors">Servicios</a></li>
                            <li><a href="#testimonials" class="text-slate-400 hover:text-white transition-colors">Testimonios</a></li>
                            <li><a href="#contact" class="text-slate-400 hover:text-white transition-colors">Contacto</a></li>
                        </ul>
                    </div>
                    
                    <!-- Services -->
                    <div>
                        <h4 class="text-xl font-semibold mb-6">Servicios</h4>
                        <ul class="space-y-3">
                            <li><a href="#services" class="text-slate-400 hover:text-white transition-colors">Formación en IA</a></li>
                            <li><a href="#services" class="text-slate-400 hover:text-white transition-colors">Consultoría</a></li>
                            <li><a href="#services" class="text-slate-400 hover:text-white transition-colors">Agentes IA</a></li>
                            <li><a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="text-slate-400 hover:text-white transition-colors">Demo Agentes</a></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Bottom -->
                <div class="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
                    <p>&copy; 2024 CanarIAgentic. Todos los derechos reservados. Hecho con ❤️ en Canarias.</p>
                </div>
            </div>
        </footer>
        
        <!-- Modals -->
        <!-- Formación Modal -->
        <div id="formacion-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-3xl font-bold text-slate-800">Formación Personalizada de IA</h3>
                        <button onclick="closeModal('formacion')" class="text-slate-400 hover:text-slate-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="prose prose-lg max-w-none">
                        <p class="text-slate-600 mb-6">
                            Nuestros programas de formación están diseñados para capacitar a tu equipo en las tecnologías de IA más relevantes para tu sector, 
                            garantizando una adopción exitosa y sostenible.
                        </p>
                        
                        <h4 class="text-2xl font-semibold text-slate-800 mb-4">Metodología</h4>
                        <div class="grid md:grid-cols-2 gap-6 mb-8">
                            <div class="bg-slate-50 p-6 rounded-xl">
                                <h5 class="font-semibold text-slate-800 mb-3">1. Diagnóstico Inicial</h5>
                                <p class="text-slate-600">Evaluamos el nivel actual de competencias digitales y definimos objetivos específicos.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl">
                                <h5 class="font-semibold text-slate-800 mb-3">2. Programa Personalizado</h5>
                                <p class="text-slate-600">Diseñamos un curriculum adaptado a las necesidades y sectores específicos.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl">
                                <h5 class="font-semibold text-slate-800 mb-3">3. Formación Práctica</h5>
                                <p class="text-slate-600">Talleres hands-on con casos de uso reales de tu industria.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl">
                                <h5 class="font-semibold text-slate-800 mb-3">4. Seguimiento</h5>
                                <p class="text-slate-600">Acompañamiento continuo para garantizar la aplicación práctica.</p>
                            </div>
                        </div>
                        
                        <h4 class="text-2xl font-semibold text-slate-800 mb-4">Temarios Disponibles</h4>
                        <ul class="space-y-2 mb-6">
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-green-500"></i>
                                <span>Fundamentos de Inteligencia Artificial</span>
                            </li>
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-green-500"></i>
                                <span>Machine Learning para Empresas</span>
                            </li>
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-green-500"></i>
                                <span>Automatización de Procesos con IA</span>
                            </li>
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-green-500"></i>
                                <span>Análisis Predictivo y Big Data</span>
                            </li>
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-check-circle text-green-500"></i>
                                <span>Ética y Gobernanza de IA</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="text-center">
                        <a href="#contact" onclick="closeModal('formacion')" class="btn-gradient text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center space-x-2">
                            <i class="fas fa-rocket"></i>
                            <span>Solicitar Información</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Consultoría Modal -->
        <div id="consultoria-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-3xl font-bold text-slate-800">Consultoría Vanguardista</h3>
                        <button onclick="closeModal('consultoria')" class="text-slate-400 hover:text-slate-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="prose prose-lg max-w-none">
                        <p class="text-slate-600 mb-6">
                            Nuestro servicio de consultoría te ayuda a identificar oportunidades estratégicas donde la IA puede generar el mayor impacto 
                            en tu organización, maximizando el retorno de inversión.
                        </p>
                        
                        <h4 class="text-2xl font-semibold text-slate-800 mb-4">Proceso de Consultoría</h4>
                        <div class="space-y-6 mb-8">
                            <div class="bg-slate-50 p-6 rounded-xl border-l-4 border-accent">
                                <h5 class="font-semibold text-slate-800 mb-3">Fase 1: Análisis Situacional</h5>
                                <p class="text-slate-600">Evaluamos la madurez digital actual y identificamos procesos candidatos para IA.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl border-l-4 border-secondary">
                                <h5 class="font-semibold text-slate-800 mb-3">Fase 2: Identificación de Oportunidades</h5>
                                <p class="text-slate-600">Priorizamos casos de uso basados en impacto empresarial y viabilidad técnica.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl border-l-4 border-accent">
                                <h5 class="font-semibold text-slate-800 mb-3">Fase 3: Hoja de Ruta</h5>
                                <p class="text-slate-600">Diseñamos una estrategia de implementación gradual con métricas claras de éxito.</p>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-xl border-l-4 border-secondary">
                                <h5 class="font-semibold text-slate-800 mb-3">Fase 4: Plan de Acción</h5>
                                <p class="text-slate-600">Proporcionamos recomendaciones tecnológicas y de proveedores específicas.</p>
                            </div>
                        </div>
                        
                        <h4 class="text-2xl font-semibold text-slate-800 mb-4">Entregables</h4>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <ul class="space-y-2">
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Informe de Madurez Digital</span>
                                    </li>
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Matriz de Casos de Uso Priorizados</span>
                                    </li>
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Hoja de Ruta de Implementación</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <ul class="space-y-2">
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Análisis de ROI Proyectado</span>
                                    </li>
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Recomendaciones Tecnológicas</span>
                                    </li>
                                    <li class="flex items-center space-x-3">
                                        <i class="fas fa-file-alt text-accent"></i>
                                        <span>Plan de Gestión del Cambio</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-8">
                        <a href="#contact" onclick="closeModal('consultoria')" class="btn-gradient text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center space-x-2">
                            <i class="fas fa-rocket"></i>
                            <span>Solicitar Consulta</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Notification -->
        <div id="notification" class="fixed bottom-8 right-8 bg-green-500 text-white p-6 rounded-xl shadow-2xl transform translate-y-full transition-transform duration-300 z-50 max-w-sm">
            <p id="notification-message" class="font-medium"></p>
        </div>
        
        <!-- JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Mobile menu functionality
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('open');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
            
            // Close mobile menu when clicking on links
            document.querySelectorAll('.mobile-menu-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('open');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                });
            });
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        const offsetTop = target.offsetTop - 80;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Navbar background on scroll
            const navbar = document.getElementById('navbar');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('bg-white/95');
                    navbar.classList.remove('glass');
                } else {
                    navbar.classList.remove('bg-white/95');
                    navbar.classList.add('glass');
                }
            });
            
            // Intersection Observer for fade-in animations
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
            
            document.querySelectorAll('.section-fade-in').forEach(el => {
                observer.observe(el);
            });
            
            // Modal functionality
            function openModal(type) {
                const modal = document.getElementById(type + '-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            }
            
            function closeModal(type) {
                const modal = document.getElementById(type + '-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            }
            
            // Close modal when clicking outside
            document.querySelectorAll('[id$="-modal"]').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                        document.body.style.overflow = 'auto';
                    }
                });
            });
            
            // Contact form functionality
            const contactForm = document.getElementById('contact-form');
            const alertMessage = document.getElementById('alert-message');
            
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Show loading state
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalContent = submitBtn.innerHTML;
                submitBtn.innerHTML = '<div class="spinner mx-auto"></div>';
                submitBtn.disabled = true;
                
                try {
                    const formData = new FormData(contactForm);
                    const data = {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        company: formData.get('company'),
                        phone: formData.get('phone'),
                        service: formData.get('service'),
                        message: formData.get('message')
                    };
                    
                    const response = await axios.post('/api/contact', data);
                    
                    if (response.data.success) {
                        showNotification(response.data.message, 'success');
                        contactForm.reset();
                    } else {
                        showNotification(response.data.message, 'error');
                    }
                } catch (error) {
                    console.error('Error sending form:', error);
                    showNotification('Error al enviar el mensaje. Inténtalo de nuevo.', 'error');
                } finally {
                    // Reset button
                    submitBtn.innerHTML = originalContent;
                    submitBtn.disabled = false;
                }
            });
            
            // Notification system
            function showNotification(message, type = 'success') {
                const notification = document.getElementById('notification');
                const messageEl = document.getElementById('notification-message');
                
                messageEl.textContent = message;
                
                // Set colors based on type
                if (type === 'success') {
                    notification.className = 'fixed bottom-8 right-8 bg-green-500 text-white p-6 rounded-xl shadow-2xl transition-transform duration-300 z-50 max-w-sm';
                } else {
                    notification.className = 'fixed bottom-8 right-8 bg-red-500 text-white p-6 rounded-xl shadow-2xl transition-transform duration-300 z-50 max-w-sm';
                }
                
                // Show notification
                notification.style.transform = 'translateY(0)';
                
                // Hide after 5 seconds
                setTimeout(() => {
                    notification.style.transform = 'translateY(100%)';
                }, 5000);
            }
            
            // Add loading animation to buttons
            document.querySelectorAll('.btn-gradient').forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px) scale(1.05)';
                });
                
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
            
            // Parallax effect for hero section
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const heroSection = document.getElementById('home');
                if (heroSection) {
                    const rate = scrolled * -0.5;
                    heroSection.style.transform = \`translateY(\${rate}px)\`;
                }
            });
            
            // Progressive Web App features
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    // Service worker registration would go here
                });
            }
            
            // Analytics and tracking
            function trackEvent(eventName, eventData = {}) {
                // Google Analytics or other tracking would go here
                console.log('Event tracked:', eventName, eventData);
            }
            
            // Track form submissions
            contactForm.addEventListener('submit', () => {
                trackEvent('form_submission', { form_type: 'contact' });
            });
            
            // Track button clicks
            document.querySelectorAll('.btn-gradient').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    trackEvent('button_click', { 
                        button_text: btn.textContent.trim(),
                        button_url: btn.href || btn.onclick?.toString() || 'button'
                    });
                });
            });
            
            // Performance optimization
            const lazyImages = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
            
            // Keyboard accessibility
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    // Close any open modals
                    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
                        if (!modal.classList.contains('hidden')) {
                            modal.classList.add('hidden');
                            document.body.style.overflow = 'auto';
                        }
                    });
                }
            });
            
            // Focus management for accessibility
            function trapFocus(element) {
                const focusableElements = element.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstFocusableElement = focusableElements[0];
                const lastFocusableElement = focusableElements[focusableElements.length - 1];
                
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstFocusableElement) {
                                lastFocusableElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastFocusableElement) {
                                firstFocusableElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                });
            }
            
            // Apply focus trapping to modals
            document.querySelectorAll('[id$="-modal"]').forEach(modal => {
                trapFocus(modal);
            });
        </script>
    </body>
    </html>
  `)
})

export default app