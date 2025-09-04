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

// API endpoint for cookie consent logging (legal compliance)
app.post('/api/cookie-consent', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      user_id, 
      decision_type, 
      cookie_settings, 
      ip_address, 
      user_agent, 
      page_url 
    } = body
    
    // Basic validation
    if (!user_id || !decision_type || !cookie_settings) {
      return c.json({ success: false, message: 'Datos incompletos' }, 400)
    }
    
    // Prepare consent data with all metadata for legal compliance
    const consentData = {
      user_id: user_id,
      decision_type: decision_type,
      cookie_settings: cookie_settings,
      ip_address: ip_address || c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      user_agent: user_agent || c.req.header('User-Agent') || 'unknown',
      page_url: page_url || c.req.header('Referer') || window?.location?.href || 'unknown',
      timestamp: new Date().toISOString(),
      consent_version: '1.0'
    }
    
    // Get Supabase credentials from environment variables (secure)
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    // Try to save to Supabase first
    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseResponse = await fetch(supabaseUrl + '/rest/v1/cookie_consents', {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(consentData)
        })
        
        if (supabaseResponse.ok) {
          console.log('✅ Cookie consent saved to Supabase:', {
            user_id: consentData.user_id,
            decision_type: consentData.decision_type,
            timestamp: consentData.timestamp
          })
          
          return c.json({ 
            success: true, 
            message: 'Consentimiento registrado en base de datos',
            storage: 'supabase'
          })
        } else {
          throw new Error('Supabase error: ' + supabaseResponse.status)
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase unavailable, using fallback:', supabaseError.message)
      }
    }
    
    // Fallback: Log locally for compliance (always works)
    console.log('📝 Cookie consent logged (legal compliance):', {
      ...consentData,
      note: 'Stored locally - create Supabase table for database storage'
    })
    
    return c.json({ 
      success: true, 
      message: 'Consentimiento registrado correctamente',
      storage: 'local_logs'
    })
    
  } catch (error) {
    console.error('❌ Cookie consent error:', error)
    return c.json({ 
      success: false, 
      message: 'Error interno del servidor' 
    }, 500)
  }
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CanarIAgentic'
  })
})

// API endpoint to initialize cookie consent table in Supabase
app.post('/api/init-cookie-table', async (c) => {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json({ success: false, message: 'Supabase no configurado' }, 400)
    }
    
    // Create cookie_consents table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        decision_type TEXT NOT NULL CHECK (decision_type IN ('accept_all', 'reject_all', 'custom')),
        cookie_settings JSONB NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        page_url TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        consent_version TEXT DEFAULT '1.0',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
      CREATE INDEX IF NOT EXISTS idx_cookie_consents_timestamp ON cookie_consents(timestamp);
    `
    
    // Execute SQL using Supabase REST API
    const response = await fetch(supabaseUrl + '/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createTableSQL })
    })
    
    if (response.ok) {
      console.log('Cookie consents table initialized successfully')
      return c.json({ 
        success: true, 
        message: 'Tabla de consentimientos inicializada correctamente' 
      })
    } else {
      const errorText = await response.text()
      console.error('Failed to initialize cookie table:', errorText)
      return c.json({ 
        success: false, 
        message: 'Error al inicializar tabla: ' + errorText 
      }, 500)
    }
  } catch (error) {
    console.error('Cookie table initialization error:', error)
    return c.json({ 
      success: false, 
      message: 'Error interno del servidor' 
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
        <meta name="description" content="CanarIAgentic - Agencia especializada en soluciones de inteligencia artificial para empresas. Formación, consultoría y desarrollo de agentes IA.">
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
            
            /* 3D Service Cards Animation Styles */
            .services-grid {
                perspective: 1000px;
            }
            
            .service-card-3d {
                transform-style: preserve-3d;
                transition: all 0.2s ease-linear;
                transform-origin: center center;
            }
            
            .service-card-3d:hover {
                transform-style: preserve-3d;
            }
            
            /* 3D Card Elements */
            .service-card-3d .h-48 {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            .service-card-3d .p-8 {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            .service-card-3d h3 {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            .service-card-3d p {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            .service-card-3d a {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            .service-card-3d i {
                transform-style: preserve-3d;
                transition: transform 0.2s ease-linear;
            }
            
            /* Enhanced hover effects for 3D cards */
            .service-card-3d:hover {
                box-shadow: 
                    0 25px 50px -12px rgba(0, 0, 0, 0.25),
                    0 0 50px rgba(59, 130, 246, 0.15);
            }
            
            .service-card-3d:hover .h-48 {
                transform: translateZ(20px);
            }
            
            .service-card-3d:hover h3 {
                transform: translateZ(30px);
            }
            
            .service-card-3d:hover p {
                transform: translateZ(15px);
            }
            
            .service-card-3d:hover a {
                transform: translateZ(40px);
            }
            
            /* Enhanced 3D effects */
            .service-card-3d:hover .h-48 i {
                transform: translateZ(30px) scale(1.1);
            }
            
            /* Hero Parallax Styles */
            .hero-parallax-container {
                perspective: 1000px;
                transform-style: preserve-3d;
                opacity: 0.4; /* Reduced opacity so it doesn't interfere with text */
                z-index: 1; /* Behind content */
            }
            
            .parallax-row {
                position: absolute;
                width: 100%;
                height: 300px; /* Reduced height */
                display: flex;
                flex-wrap: nowrap;
                gap: 2rem;
                transform-style: preserve-3d;
            }
            
            .parallax-row-1 {
                top: 5%; /* Moved higher */
                animation: parallaxMoveRight 60s linear infinite;
            }
            
            .parallax-row-2 {
                top: 35%; /* Adjusted to not overlap with main content */
                animation: parallaxMoveLeft 45s linear infinite;
            }
            
            .parallax-row-3 {
                top: 75%; /* Moved lower */
                animation: parallaxMoveRight 50s linear infinite;
            }
            
            @keyframes parallaxMoveRight {
                0% { transform: translateX(-100%) rotateY(-15deg) rotateX(5deg); }
                100% { transform: translateX(calc(100vw + 100%)) rotateY(-15deg) rotateX(5deg); }
            }
            
            @keyframes parallaxMoveLeft {
                0% { transform: translateX(calc(100vw + 100%)) rotateY(15deg) rotateX(-5deg); }
                100% { transform: translateX(-100%) rotateY(15deg) rotateX(-5deg); }
            }
            
            @keyframes cardPulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.6; }
            }
            
            /* AI-Specific Visual Elements */
            
            /* AI Dashboard Chart Animation */
            .chart-container {
                display: flex;
                align-items: end;
                justify-content: space-between;
                height: 60px;
                padding: 0 10px;
            }
            
            .chart-bar {
                width: 12px;
                background: linear-gradient(to top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
                border-radius: 2px;
                animation: chartPulse 2s ease-in-out infinite;
            }
            
            @keyframes chartPulse {
                0%, 100% { transform: scaleY(0.8); }
                50% { transform: scaleY(1.2); }
            }
            
            .metrics-display {
                margin-top: 10px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .metric {
                margin-bottom: 3px;
            }
            
            .metric-value {
                color: #00ff88;
                font-weight: bold;
            }
            
            /* Neural Network Visualization */
            .network-visualization {
                position: relative;
                height: 100px;
                padding: 10px;
            }
            
            .network-layer {
                display: flex;
                flex-direction: column;
                position: absolute;
                gap: 8px;
            }
            
            .network-layer:nth-child(1) { left: 10px; top: 10px; }
            .network-layer:nth-child(2) { left: 50%; top: 5px; transform: translateX(-50%); }
            .network-layer:nth-child(3) { right: 10px; top: 20px; }
            
            .neuron {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                animation: neuronPulse 3s ease-in-out infinite;
            }
            
            .neuron.active {
                background: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
            }
            
            @keyframes neuronPulse {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }
            
            .connections {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1;
            }
            
            .connection {
                position: absolute;
                height: 1px;
                background: rgba(255, 255, 255, 0.2);
                animation: connectionFlow 2s ease-in-out infinite;
            }
            
            .connection.active {
                background: #00ff88;
                box-shadow: 0 0 3px rgba(0, 255, 136, 0.8);
            }
            
            @keyframes connectionFlow {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            
            /* Machine Learning Training */
            .training-progress {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            .progress-ring {
                position: relative;
                width: 60px;
                height: 60px;
            }
            
            .progress-circle {
                width: 100%;
                height: 100%;
                border: 3px solid rgba(255, 255, 255, 0.2);
                border-top: 3px solid #00ff88;
                border-radius: 50%;
                animation: progressSpin 2s linear infinite;
            }
            
            @keyframes progressSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 14px;
                font-weight: bold;
                color: #00ff88;
            }
            
            .training-stats {
                font-size: 9px;
                color: rgba(255, 255, 255, 0.8);
                text-align: center;
            }
            
            .stat-item {
                margin-bottom: 2px;
            }
            
            /* Data Pipeline Flow */
            .pipeline-flow {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 10px;
            }
            
            .pipeline-step {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .step-node {
                background: rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 9px;
                color: white;
                min-width: 60px;
                text-align: center;
            }
            
            .step-node.active {
                background: #00ff88;
                color: #000;
                animation: nodeGlow 2s ease-in-out infinite;
            }
            
            .step-node.processing {
                background: #ffaa00;
                color: #000;
                animation: nodeProcessing 1.5s ease-in-out infinite;
            }
            
            @keyframes nodeGlow {
                0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
                50% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.8); }
            }
            
            @keyframes nodeProcessing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .flow-arrow {
                width: 20px;
                height: 2px;
                background: rgba(255, 255, 255, 0.3);
                position: relative;
            }
            
            .flow-arrow.active {
                background: #00ff88;
            }
            
            .flow-arrow.active::after {
                content: '';
                position: absolute;
                right: -4px;
                top: -2px;
                width: 0;
                height: 0;
                border-left: 4px solid #00ff88;
                border-top: 3px solid transparent;
                border-bottom: 3px solid transparent;
            }
            
            /* AI Agent Interface */
            .agent-interface {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 10px;
            }
            
            .agent-avatar {
                position: relative;
                width: 50px;
                height: 50px;
            }
            
            .avatar-core {
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #00ff88, #00aa66);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .avatar-core.pulsing {
                animation: avatarPulse 2s ease-in-out infinite;
            }
            
            @keyframes avatarPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 255, 136, 0.3); }
                50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(0, 255, 136, 0.6); }
            }
            
            .avatar-ring {
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                border: 2px solid rgba(0, 255, 136, 0.3);
                border-radius: 50%;
                animation: ringRotate 3s linear infinite;
            }
            
            @keyframes ringRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .agent-status {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ff4444;
            }
            
            .status-indicator.active {
                background: #00ff88;
                animation: statusBlink 2s ease-in-out infinite;
            }
            
            @keyframes statusBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .agent-metrics {
                width: 100%;
                font-size: 9px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .metric-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 4px;
            }
            
            .metric-fill {
                height: 100%;
                background: linear-gradient(to right, #00ff88, #00aa66);
                animation: metricFlow 3s ease-in-out infinite;
            }
            
            @keyframes metricFlow {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }
            
            /* Automation Flow */
            .automation-diagram {
                padding: 15px 10px;
            }
            
            .workflow-step {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .step-icon {
                font-size: 18px;
                margin-right: 8px;
                animation: iconBounce 2s ease-in-out infinite;
            }
            
            .step-icon.processing {
                animation: iconSpin 1s linear infinite;
            }
            
            @keyframes iconBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            
            @keyframes iconSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .automation-stats {
                margin-top: 10px;
                font-size: 9px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .stat {
                margin-bottom: 3px;
                padding: 2px 6px;
                background: rgba(0, 255, 136, 0.2);
                border-radius: 8px;
                display: inline-block;
                margin-right: 5px;
            }
            
            .parallax-card {
                flex-shrink: 0;
                width: 280px;
                height: 350px;
                border-radius: 20px;
                overflow: hidden;
                transform-style: preserve-3d;
                transition: all 0.3s ease;
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.1),
                    0 10px 20px rgba(0, 0, 0, 0.06);
            }
            
            .parallax-card:hover {
                transform: translateY(-10px) scale(1.05);
                box-shadow: 
                    0 30px 60px rgba(0, 0, 0, 0.2),
                    0 15px 30px rgba(0, 0, 0, 0.1);
            }
            
            .card-content {
                width: 100%;
                height: 100%;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
            }
            
            .card-content::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.05) 50%,
                    rgba(0, 0, 0, 0.1) 100%
                );
                pointer-events: none;
            }
            
            .card-header {
                text-align: center;
                z-index: 1;
                position: relative;
            }
            
            .card-preview {
                z-index: 1;
                position: relative;
            }
            
            .preview-line, .preview-button, .preview-input,
            .preview-square, .preview-quote, .preview-author,
            .preview-pill, .preview-chart, .preview-website,
            .preview-document, .preview-bar, .preview-circle,
            .preview-arrow, .preview-node, .preview-dot {
                border-radius: 4px;
                opacity: 0.7;
            }
            
            .preview-line { height: 8px; }
            .preview-button { height: 24px; }
            .preview-input { height: 20px; }
            .preview-square { aspect-ratio: 1; }
            .preview-quote { height: 40px; }
            .preview-author { height: 12px; }
            .preview-pill { height: 12px; }
            .preview-chart { height: 50px; }
            .preview-website { height: 40px; }
            .preview-document { height: 32px; }
            
            /* Responsive parallax */
            @media (max-width: 768px) {
                .parallax-card {
                    width: 220px;
                    height: 280px;
                }
                
                .card-content {
                    padding: 1.5rem;
                }
                
                .card-header i {
                    font-size: 2rem !important;
                }
                
                .card-header h3 {
                    font-size: 1rem !important;
                }
            }
            
            /* Hero content positioning */
            .hero-content {
                backdrop-filter: blur(8px);
                background: rgba(255, 255, 255, 0.1);
                border-radius: 30px;
                padding: 2rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                z-index: 30; /* Ensure it's above parallax */
                position: relative;
            }
            
            /* Enhanced text readability */
            .hero-content h1 {
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .hero-content p {
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            /* Additional AI Elements Styles */
            
            /* Strategy Analysis */
            .strategy-analysis {
                padding: 10px;
            }
            
            .analysis-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .analysis-box {
                background: rgba(255, 255, 255, 0.1);
                padding: 8px;
                border-radius: 6px;
                text-align: center;
            }
            
            .box-value {
                font-size: 12px;
                font-weight: bold;
                color: #ffaa00;
            }
            
            .box-label {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .recommendation-panel {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .rec-item {
                margin-bottom: 3px;
                padding: 2px 4px;
                border-radius: 3px;
            }
            
            .rec-item.active {
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
            }
            
            /* Training Platform */
            .training-interface {
                padding: 10px;
            }
            
            .course-progress {
                margin-bottom: 12px;
            }
            
            .course-item {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 5px;
                font-size: 8px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .course-item.completed {
                color: #00ff88;
            }
            
            .course-item.active {
                color: #ffaa00;
                animation: courseGlow 2s ease-in-out infinite;
            }
            
            .course-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
            }
            
            .course-item.completed .course-dot {
                background: #00ff88;
            }
            
            .course-item.active .course-dot {
                background: #ffaa00;
                animation: dotPulse 1s ease-in-out infinite;
            }
            
            @keyframes courseGlow {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }
            
            @keyframes dotPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            
            .skill-meter {
                font-size: 9px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .skill-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 4px;
            }
            
            .skill-fill {
                height: 100%;
                background: linear-gradient(to right, #3b82f6, #06b6d4);
                border-radius: 3px;
                animation: skillProgress 3s ease-in-out infinite;
            }
            
            @keyframes skillProgress {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; transform: scaleY(1.2); }
            }
            
            /* Predictive Analytics */
            .prediction-charts {
                padding: 10px;
                position: relative;
                height: 80px;
            }
            
            .trend-line {
                position: relative;
                height: 50px;
                background: linear-gradient(to right, transparent 0%, rgba(0, 255, 136, 0.1) 50%, rgba(255, 170, 0, 0.1) 100%);
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .data-points {
                position: absolute;
                width: 100%;
                height: 100%;
            }
            
            .point {
                position: absolute;
                width: 6px;
                height: 6px;
                background: #00ff88;
                border-radius: 50%;
                animation: pointGlow 2s ease-in-out infinite;
            }
            
            .point.prediction {
                background: #ffaa00;
                animation: pointPrediction 3s ease-in-out infinite;
            }
            
            .point.active {
                background: #ff4444;
                transform: scale(1.5);
            }
            
            @keyframes pointGlow {
                0%, 100% { box-shadow: 0 0 3px rgba(0, 255, 136, 0.5); }
                50% { box-shadow: 0 0 8px rgba(0, 255, 136, 0.8); }
            }
            
            @keyframes pointPrediction {
                0%, 100% { opacity: 0.6; box-shadow: 0 0 3px rgba(255, 170, 0, 0.5); }
                50% { opacity: 1; box-shadow: 0 0 8px rgba(255, 170, 0, 0.8); }
            }
            
            .forecast-info {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .forecast-item {
                margin-bottom: 2px;
                color: #ffaa00;
            }
            
            /* NLP Analysis */
            .nlp-interface {
                padding: 10px;
            }
            
            .text-analysis {
                margin-bottom: 12px;
            }
            
            .analysis-bubble {
                background: rgba(255, 255, 255, 0.1);
                padding: 4px 8px;
                border-radius: 10px;
                margin-bottom: 4px;
                font-size: 8px;
                animation: bubbleFloat 3s ease-in-out infinite;
            }
            
            .analysis-bubble.positive {
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
            }
            
            .analysis-bubble.neutral {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
            }
            
            .analysis-bubble.processing {
                background: rgba(255, 170, 0, 0.2);
                color: #ffaa00;
                animation: bubbleProcessing 1.5s ease-in-out infinite;
            }
            
            @keyframes bubbleFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }
            
            @keyframes bubbleProcessing {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            .nlp-metrics {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .metric-circle {
                position: relative;
                width: 40px;
                height: 40px;
                margin-bottom: 5px;
            }
            
            .circle-progress {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: conic-gradient(#00ff88 0deg, #00ff88 calc(var(--progress) * 3.6deg), rgba(255, 255, 255, 0.2) calc(var(--progress) * 3.6deg));
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .circle-text {
                font-size: 10px;
                font-weight: bold;
                color: #00ff88;
            }
            
            .metric-label {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            /* Computer Vision */
            .vision-interface {
                padding: 10px;
            }
            
            .detection-grid {
                position: relative;
                height: 60px;
                background: linear-gradient(45deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1));
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .detection-box {
                position: absolute;
                width: 30px;
                height: 30px;
                top: 15px;
            }
            
            .detection-box:first-child { left: 20px; }
            .detection-box:last-child { right: 20px; }
            
            .box-outline {
                width: 100%;
                height: 100%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
            }
            
            .detection-box.active .box-outline {
                border-color: #00ff88;
                animation: detectionScan 2s ease-in-out infinite;
            }
            
            @keyframes detectionScan {
                0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.3); }
                50% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.6); }
            }
            
            .detection-label {
                position: absolute;
                bottom: -15px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 7px;
                color: #00ff88;
                background: rgba(0, 0, 0, 0.7);
                padding: 1px 4px;
                border-radius: 2px;
            }
            
            .vision-stats {
                font-size: 9px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .stat-row {
                margin-bottom: 2px;
            }
            
            .stat-row span {
                color: #00ff88;
                font-weight: bold;
            }
            
            /* Deep Learning Architecture */
            .dl-architecture {
                padding: 10px;
            }
            
            .layer-stack {
                margin-bottom: 10px;
            }
            
            .dl-layer {
                background: rgba(255, 255, 255, 0.1);
                padding: 4px 8px;
                border-radius: 4px;
                margin-bottom: 4px;
                font-size: 8px;
                text-align: center;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .dl-layer.input {
                background: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }
            
            .dl-layer.hidden {
                background: rgba(147, 51, 234, 0.3);
                color: #9333ea;
            }
            
            .dl-layer.hidden.active {
                background: rgba(147, 51, 234, 0.5);
                animation: layerProcess 2s ease-in-out infinite;
            }
            
            .dl-layer.output {
                background: rgba(0, 255, 136, 0.3);
                color: #00ff88;
            }
            
            @keyframes layerProcess {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(147, 51, 234, 0.5); }
            }
            
            .dl-info {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .info-item {
                margin-bottom: 2px;
            }
            
            /* Real-time Analytics */
            .realtime-dashboard {
                padding: 10px;
            }
            
            .live-chart {
                height: 50px;
                display: flex;
                align-items: end;
                justify-content: space-between;
                padding: 0 10px;
                margin-bottom: 10px;
                background: linear-gradient(to top, rgba(0, 255, 136, 0.1), transparent);
                border-radius: 4px;
            }
            
            .chart-line {
                display: flex;
                align-items: end;
                gap: 3px;
                height: 100%;
            }
            
            .line-segment {
                width: 8px;
                background: linear-gradient(to top, #00ff88, rgba(0, 255, 136, 0.6));
                border-radius: 2px 2px 0 0;
                animation: realtimePulse 1.5s ease-in-out infinite;
            }
            
            @keyframes realtimePulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; transform: scaleY(1.1); }
            }
            
            .live-metrics {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .live-value {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .value-number {
                font-size: 12px;
                font-weight: bold;
                color: #00ff88;
                animation: numberFlicker 3s ease-in-out infinite;
            }
            
            @keyframes numberFlicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .value-label {
                font-size: 7px;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .status-indicator.live {
                width: 12px;
                height: 12px;
                background: #00ff88;
                animation: liveIndicator 1s ease-in-out infinite;
            }
            
            @keyframes liveIndicator {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.2); }
            }
            
            /* AI-Powered Search */
            .search-interface {
                padding: 10px;
            }
            
            .search-query {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.1);
                padding: 6px 10px;
                border-radius: 15px;
                margin-bottom: 10px;
            }
            
            .query-text {
                font-size: 8px;
                color: rgba(255, 255, 255, 0.9);
                font-style: italic;
            }
            
            .search-spinner {
                width: 12px;
                height: 12px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid #00ff88;
                border-radius: 50%;
                animation: searchSpin 1s linear infinite;
            }
            
            @keyframes searchSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .search-results {
                max-height: 60px;
                overflow: hidden;
            }
            
            .result-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 3px 6px;
                margin-bottom: 3px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                font-size: 7px;
                animation: resultAppear 0.5s ease-out;
            }
            
            .result-item:nth-child(1) { animation-delay: 0.1s; }
            .result-item:nth-child(2) { animation-delay: 0.2s; }
            .result-item:nth-child(3) { animation-delay: 0.3s; }
            
            @keyframes resultAppear {
                0% { opacity: 0; transform: translateX(-10px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            
            .result-score {
                color: #00ff88;
                font-weight: bold;
            }
            
            .result-text {
                color: rgba(255, 255, 255, 0.9);
            }
            
            /* Responsive adjustments for AI elements */
            @media (max-width: 768px) {
                .chart-container, .live-chart {
                    height: 40px;
                }
                
                .chart-bar, .line-segment {
                    width: 8px;
                }
                
                .network-layer {
                    gap: 6px;
                }
                
                .neuron {
                    width: 12px;
                    height: 12px;
                }
                
                .progress-ring {
                    width: 45px;
                    height: 45px;
                }
                
                .agent-avatar {
                    width: 40px;
                    height: 40px;
                }
                
                .detection-box {
                    width: 25px;
                    height: 25px;
                }
                
                .metric-circle {
                    width: 35px;
                    height: 35px;
                }
                
                .training-stats, .vision-stats, .dl-info {
                    font-size: 8px;
                }
            }
            
            /* Performance optimizations */
            .parallax-card * {
                will-change: transform, opacity;
            }
            
            .chart-bar, .neuron, .progress-circle, .avatar-core {
                transform: translateZ(0);
                backface-visibility: hidden;
            }
            
            /* Infinite Moving Testimonials */
            .infinite-testimonials-container {
                height: 400px;
                mask-image: linear-gradient(to right, transparent, white 10%, white 90%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, white 10%, white 90%, transparent);
            }
            
            .testimonials-scroller {
                display: flex;
                gap: 2rem;
                animation: scroll-left 40s linear infinite;
                width: max-content;
                min-width: 100%;
            }
            
            .testimonials-scroller:hover {
                animation-play-state: paused;
            }
            
            @keyframes scroll-left {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(calc(-100% - 2rem));
                }
            }
            
            @keyframes scroll-right {
                0% {
                    transform: translateX(calc(-100% - 2rem));
                }
                100% {
                    transform: translateX(0);
                }
            }
            
            .testimonial-card {
                flex-shrink: 0;
                width: 380px;
                background: linear-gradient(180deg, #fafafa, #f5f5f5);
                border: 1px solid #e2e8f0;
                border-radius: 1rem;
                padding: 2rem;
                position: relative;
                overflow: hidden;
                box-shadow: 
                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                    0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transition: all 0.3s ease;
                transform: translateZ(0);
                backface-visibility: hidden;
            }
            
            .testimonial-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 
                    0 20px 25px -5px rgba(0, 0, 0, 0.15),
                    0 10px 10px -5px rgba(0, 0, 0, 0.1);
            }
            
            .testimonial-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    135deg,
                    rgba(59, 130, 246, 0.05) 0%,
                    rgba(6, 182, 212, 0.05) 50%,
                    rgba(16, 185, 129, 0.05) 100%
                );
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .testimonial-card:hover::before {
                opacity: 1;
            }
            
            .card-glow {
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(
                    135deg,
                    rgba(59, 130, 246, 0.3),
                    rgba(6, 182, 212, 0.3),
                    rgba(16, 185, 129, 0.3)
                );
                border-radius: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
                filter: blur(4px);
            }
            
            .testimonial-card:hover .card-glow {
                opacity: 0.6;
                animation: glowPulse 2s ease-in-out infinite;
            }
            
            @keyframes glowPulse {
                0%, 100% { 
                    opacity: 0.6; 
                    transform: scale(1);
                }
                50% { 
                    opacity: 0.8; 
                    transform: scale(1.02);
                }
            }
            
            .testimonial-card blockquote {
                font-size: 0.95rem;
                line-height: 1.6;
                position: relative;
                z-index: 1;
            }
            
            .testimonial-card blockquote::before {
                content: '"';
                font-size: 3rem;
                color: rgba(59, 130, 246, 0.3);
                position: absolute;
                top: -0.5rem;
                left: -0.5rem;
                font-family: Georgia, serif;
                line-height: 1;
            }
            
            .testimonial-card .fas.fa-star {
                margin-right: 0.25rem;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
                transition: all 0.3s ease;
            }
            
            .testimonial-card:hover .fas.fa-star {
                transform: scale(1.1);
                filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4));
            }
            
            /* Author avatar enhancements */
            .testimonial-card .w-12.h-12 {
                transition: all 0.3s ease;
                position: relative;
            }
            
            .testimonial-card:hover .w-12.h-12 {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .testimonial-card .w-12.h-12::after {
                content: '';
                position: absolute;
                inset: -2px;
                border-radius: 50%;
                background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.5), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
            }
            
            .testimonial-card:hover .w-12.h-12::after {
                opacity: 1;
                animation: avatarShine 2s ease-in-out infinite;
            }
            
            @keyframes avatarShine {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(180deg); }
            }
            
            /* Responsive design for testimonials */
            @media (max-width: 768px) {
                .infinite-testimonials-container {
                    height: 350px;
                }
                
                .testimonial-card {
                    width: 320px;
                    padding: 1.5rem;
                }
                
                .testimonial-card blockquote {
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                
                .testimonials-scroller {
                    gap: 1rem;
                    animation-duration: 30s;
                }
                
                .testimonial-card blockquote::before {
                    font-size: 2.5rem;
                    top: -0.3rem;
                    left: -0.3rem;
                }
            }
            
            /* Smooth scroll performance optimization */
            .testimonials-scroller {
                will-change: transform;
                transform: translateZ(0);
                backface-visibility: hidden;
            }
            
            .testimonial-card {
                will-change: transform, box-shadow;
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
            

            
            .logo-text {
                font-family: 'Inter', sans-serif;
                font-size: 1.5rem;
                font-weight: 700;
                background: linear-gradient(135deg, #1e3a8a, #2563eb, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            .logo-text .ia-highlight {
                background: linear-gradient(135deg, #3b82f6, #60a5fa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
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
            
            /* Custom Select Styles */
            .service-select {
                background-color: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .service-select option {
                background-color: #1e293b;
                color: white;
                padding: 12px;
                border: none;
                transition: all 0.2s ease;
            }
            
            .service-select option:hover {
                background-color: #334155;
                color: #06b6d4;
            }
            
            .service-select option:checked {
                background-color: #06b6d4;
                color: white;
            }
            
            /* AI Background Animation */
            .ai-background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 1;
            }
            
            .particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #06b6d4, #3b82f6);
                border-radius: 50%;
                opacity: 0.6;
                animation: float-particles 20s linear infinite;
            }
            
            .particle:nth-child(2n) {
                background: linear-gradient(45deg, #8b5cf6, #06b6d4);
                animation-duration: 25s;
                animation-delay: -5s;
            }
            
            .particle:nth-child(3n) {
                background: linear-gradient(45deg, #3b82f6, #8b5cf6);
                animation-duration: 30s;
                animation-delay: -10s;
            }
            
            .particle:nth-child(4n) {
                width: 3px;
                height: 3px;
                background: linear-gradient(45deg, #06b6d4, #10b981);
                animation-duration: 35s;
                animation-delay: -15s;
            }
            
            .particle:nth-child(5n) {
                width: 5px;
                height: 5px;
                background: linear-gradient(45deg, #3b82f6, #06b6d4);
                animation-duration: 22s;
                animation-delay: -8s;
            }
            
            /* Logo flotante de CanarIAgentic */
            .logo-particle {
                position: absolute;
                width: 60px;
                height: 80px;
                opacity: 0.7;
                animation: float-logo 45s linear infinite;
                animation-delay: -20s;
                z-index: 2;
            }
            
            .logo-symbol {
                width: 40px;
                height: 40px;
                margin: 0 auto 8px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .cc-symbol {
                position: relative;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .cc-symbol::before,
            .cc-symbol::after {
                content: 'C';
                position: absolute;
                font-size: 24px;
                font-weight: bold;
                color: #60a5fa;
                text-shadow: 
                    0 2px 4px rgba(96, 165, 250, 0.3),
                    0 0 8px rgba(96, 165, 250, 0.2);
                animation: logoGlow 3s ease-in-out infinite;
            }
            
            .cc-symbol::before {
                transform: translateX(-3px);
                z-index: 1;
            }
            
            .cc-symbol::after {
                transform: translateX(3px);
                z-index: 2;
                opacity: 0.8;
            }
            
            .logo-text {
                font-size: 9px;
                font-weight: 600;
                text-align: center;
                line-height: 1.2;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .logo-text .canar {
                color: #60a5fa;
                text-shadow: 0 1px 2px rgba(96, 165, 250, 0.3);
            }
            
            .logo-text .ia {
                color: #ffffff;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
            }
            
            .logo-text .gentic {
                color: #60a5fa;
                text-shadow: 0 1px 2px rgba(96, 165, 250, 0.3);
            }
            
            @keyframes float-logo {
                0% {
                    transform: translateY(120vh) translateX(-50px) rotate(0deg);
                    opacity: 0;
                }
                5% {
                    opacity: 0.7;
                }
                95% {
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(-120px) translateX(150px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes logoGlow {
                0%, 100% {
                    text-shadow: 
                        0 2px 4px rgba(96, 165, 250, 0.3),
                        0 0 8px rgba(96, 165, 250, 0.2);
                }
                50% {
                    text-shadow: 
                        0 2px 6px rgba(96, 165, 250, 0.5),
                        0 0 16px rgba(96, 165, 250, 0.4),
                        0 0 24px rgba(96, 165, 250, 0.2);
                }
            }
            
            @keyframes float-particles {
                0% {
                    transform: translateY(100vh) translateX(0px) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.6;
                }
                90% {
                    opacity: 0.6;
                }
                100% {
                    transform: translateY(-100px) translateX(100px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .neural-network {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.1;
            }
            
            .neural-connection {
                position: absolute;
                height: 1px;
                background: linear-gradient(90deg, transparent, #06b6d4, transparent);
                animation: flow-data 3s linear infinite;
            }
            
            @keyframes pulse-node {
                0%, 100% {
                    transform: scale(1);
                    opacity: 0.5;
                }
                50% {
                    transform: scale(1.5);
                    opacity: 1;
                }
            }
            
            @keyframes flow-data {
                0% {
                    opacity: 0;
                    transform: scaleX(0);
                }
                50% {
                    opacity: 1;
                    transform: scaleX(1);
                }
                100% {
                    opacity: 0;
                    transform: scaleX(0);
                }
            }
            
            .ai-waves {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0.08;
                background: 
                    radial-gradient(ellipse 800px 400px at 50% 0%, #06b6d4, transparent),
                    radial-gradient(ellipse 600px 300px at 100% 50%, #3b82f6, transparent),
                    radial-gradient(ellipse 700px 350px at 0% 100%, #8b5cf6, transparent);
                transition: transform 0.15s ease-out;
                will-change: transform;
            }
            
            .neural-node {
                position: absolute;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #06b6d4, #3b82f6);
                border-radius: 50%;
                animation: pulse-node 4s ease-in-out infinite;
                transition: transform 0.1s ease-out;
                will-change: transform;
            }
            
            .particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #06b6d4, #3b82f6);
                border-radius: 50%;
                opacity: 0.6;
                animation: float-particles 20s linear infinite;
                transition: transform 0.2s ease-out;
                will-change: transform;
            }
            
            /* Cookie Banner Styles */
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1e293b, #334155);
                color: white;
                padding: 20px;
                box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 9999;
                transform: translateY(100%);
                transition: transform 0.4s ease-in-out;
            }
            
            .cookie-banner.show {
                transform: translateY(0);
            }
            
            .cookie-banner.hide {
                transform: translateY(100%);
            }
            
            .cookie-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                padding: 20px;
            }
            
            .cookie-settings-modal.show {
                opacity: 1;
                visibility: visible;
            }
            
            .cookie-settings-content {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
            }
            
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #cbd5e1;
                transition: .3s;
                border-radius: 24px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #06b6d4;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(26px);
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
                            <div class="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center animate-float">
                                <i class="fas fa-robot text-white text-lg"></i>
                            </div>
                            <span class="logo-text">Canar<span class="ia-highlight">IA</span>gentic</span>
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
            
            <!-- Hero Parallax Background -->
            <div class="hero-parallax-container absolute inset-0 pointer-events-none">
                <!-- First Row - AI Analytics & Data Visualization -->
                <div class="parallax-row parallax-row-1">
                    <!-- AI Performance Dashboard -->
                    <div class="parallax-card ai-dashboard" data-title="AI Performance Analytics">
                        <div class="card-content bg-gradient-to-br from-cyan-600 to-blue-800">
                            <div class="card-header">
                                <i class="fas fa-chart-line text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">AI Performance</h4>
                            </div>
                            <div class="ai-chart">
                                <div class="chart-container">
                                    <div class="chart-bar" style="height: 60%; animation-delay: 0s;"></div>
                                    <div class="chart-bar" style="height: 85%; animation-delay: 0.2s;"></div>
                                    <div class="chart-bar" style="height: 72%; animation-delay: 0.4s;"></div>
                                    <div class="chart-bar" style="height: 95%; animation-delay: 0.6s;"></div>
                                    <div class="chart-bar" style="height: 88%; animation-delay: 0.8s;"></div>
                                </div>
                                <div class="metrics-display">
                                    <div class="metric">Accuracy: <span class="metric-value">98.7%</span></div>
                                    <div class="metric">Speed: <span class="metric-value">2.3s</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Neural Network Visualization -->
                    <div class="parallax-card neural-network" data-title="Neural Network Processing">
                        <div class="card-content bg-gradient-to-br from-purple-600 to-indigo-800">
                            <div class="card-header">
                                <i class="fas fa-brain text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Neural Network</h4>
                            </div>
                            <div class="network-visualization">
                                <div class="network-layer">
                                    <div class="neuron active" style="animation-delay: 0s;"></div>
                                    <div class="neuron active" style="animation-delay: 0.1s;"></div>
                                    <div class="neuron" style="animation-delay: 0.2s;"></div>
                                </div>
                                <div class="network-layer">
                                    <div class="neuron" style="animation-delay: 0.3s;"></div>
                                    <div class="neuron active" style="animation-delay: 0.4s;"></div>
                                    <div class="neuron active" style="animation-delay: 0.5s;"></div>
                                    <div class="neuron" style="animation-delay: 0.6s;"></div>
                                </div>
                                <div class="network-layer">
                                    <div class="neuron active" style="animation-delay: 0.7s;"></div>
                                    <div class="neuron" style="animation-delay: 0.8s;"></div>
                                </div>
                                <div class="connections">
                                    <div class="connection active" style="animation-delay: 0.9s;"></div>
                                    <div class="connection" style="animation-delay: 1s;"></div>
                                    <div class="connection active" style="animation-delay: 1.1s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Machine Learning Model Training -->
                    <div class="parallax-card ml-training" data-title="ML Model Training">
                        <div class="card-content bg-gradient-to-br from-green-600 to-emerald-800">
                            <div class="card-header">
                                <i class="fas fa-cogs text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Model Training</h4>
                            </div>
                            <div class="training-progress">
                                <div class="progress-ring">
                                    <div class="progress-circle"></div>
                                    <div class="progress-text">87%</div>
                                </div>
                                <div class="training-stats">
                                    <div class="stat-item">Epoch: <span>247/300</span></div>
                                    <div class="stat-item">Loss: <span>0.0023</span></div>
                                    <div class="stat-item">ETA: <span>12min</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Data Processing Pipeline -->
                    <div class="parallax-card data-pipeline" data-title="Data Processing Pipeline">
                        <div class="card-content bg-gradient-to-br from-orange-600 to-red-800">
                            <div class="card-header">
                                <i class="fas fa-stream text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Data Pipeline</h4>
                            </div>
                            <div class="pipeline-flow">
                                <div class="pipeline-step">
                                    <div class="step-node active">Raw Data</div>
                                    <div class="flow-arrow active"></div>
                                </div>
                                <div class="pipeline-step">
                                    <div class="step-node processing">Processing</div>
                                    <div class="flow-arrow"></div>
                                </div>
                                <div class="pipeline-step">
                                    <div class="step-node">AI Model</div>
                                    <div class="flow-arrow"></div>
                                </div>
                                <div class="pipeline-step">
                                    <div class="step-node">Insights</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Agent Interface -->
                    <div class="parallax-card ai-agent" data-title="AI Agent Interface">
                        <div class="card-content bg-gradient-to-br from-violet-600 to-purple-800">
                            <div class="card-header">
                                <i class="fas fa-robot text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">AI Agent</h4>
                            </div>
                            <div class="agent-interface">
                                <div class="agent-avatar">
                                    <div class="avatar-core pulsing"></div>
                                    <div class="avatar-ring"></div>
                                </div>
                                <div class="agent-status">
                                    <div class="status-indicator active"></div>
                                    <div class="status-text">Active</div>
                                </div>
                                <div class="agent-metrics">
                                    <div class="metric-bar">
                                        <div class="metric-fill" style="width: 92%;"></div>
                                    </div>
                                    <div class="metric-label">Efficiency: 92%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Second Row - Automation & Consulting -->
                <div class="parallax-row parallax-row-2">
                    <!-- Business Process Automation -->
                    <div class="parallax-card automation-flow" data-title="Process Automation">
                        <div class="card-content bg-gradient-to-br from-teal-600 to-cyan-800">
                            <div class="card-header">
                                <i class="fas fa-magic text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Automation</h4>
                            </div>
                            <div class="automation-diagram">
                                <div class="workflow-step">
                                    <div class="step-icon">📊</div>
                                    <div class="step-arrow active"></div>
                                </div>
                                <div class="workflow-step">
                                    <div class="step-icon processing">🤖</div>
                                    <div class="step-arrow"></div>
                                </div>
                                <div class="workflow-step">
                                    <div class="step-icon">✅</div>
                                </div>
                                <div class="automation-stats">
                                    <div class="stat">↑ 340% Efficiency</div>
                                    <div class="stat">↓ 89% Time Saved</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Strategic Consulting Dashboard -->
                    <div class="parallax-card consulting-dashboard" data-title="Strategic Analysis">
                        <div class="card-content bg-gradient-to-br from-amber-600 to-orange-800">
                            <div class="card-header">
                                <i class="fas fa-lightbulb text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Strategy</h4>
                            </div>
                            <div class="strategy-analysis">
                                <div class="analysis-grid">
                                    <div class="analysis-box">
                                        <div class="box-value">$2.4M</div>
                                        <div class="box-label">ROI Projected</div>
                                    </div>
                                    <div class="analysis-box">
                                        <div class="box-value">67%</div>
                                        <div class="box-label">Cost Reduction</div>
                                    </div>
                                </div>
                                <div class="recommendation-panel">
                                    <div class="rec-item active">✓ Implement AI Chatbots</div>
                                    <div class="rec-item">◦ Automate Data Entry</div>
                                    <div class="rec-item">◦ ML Predictive Analytics</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Training Platform -->
                    <div class="parallax-card training-platform" data-title="AI Training Platform">
                        <div class="card-content bg-gradient-to-br from-blue-600 to-indigo-800">
                            <div class="card-header">
                                <i class="fas fa-graduation-cap text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Training</h4>
                            </div>
                            <div class="training-interface">
                                <div class="course-progress">
                                    <div class="course-item completed">
                                        <div class="course-dot"></div>
                                        <div class="course-name">AI Fundamentals</div>
                                    </div>
                                    <div class="course-item active">
                                        <div class="course-dot"></div>
                                        <div class="course-name">Machine Learning</div>
                                    </div>
                                    <div class="course-item">
                                        <div class="course-dot"></div>
                                        <div class="course-name">Deep Learning</div>
                                    </div>
                                </div>
                                <div class="skill-meter">
                                    <div class="skill-bar">
                                        <div class="skill-fill" style="width: 78%;"></div>
                                    </div>
                                    <div class="skill-text">AI Proficiency: 78%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Predictive Analytics -->
                    <div class="parallax-card predictive-analytics" data-title="Predictive Analytics">
                        <div class="card-content bg-gradient-to-br from-emerald-600 to-green-800">
                            <div class="card-header">
                                <i class="fas fa-chart-area text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Predictions</h4>
                            </div>
                            <div class="prediction-charts">
                                <div class="trend-line">
                                    <div class="data-points">
                                        <div class="point" style="left: 10%; bottom: 30%;"></div>
                                        <div class="point" style="left: 25%; bottom: 45%;"></div>
                                        <div class="point active" style="left: 40%; bottom: 60%;"></div>
                                        <div class="point prediction" style="left: 55%; bottom: 75%;"></div>
                                        <div class="point prediction" style="left: 70%; bottom: 85%;"></div>
                                    </div>
                                </div>
                                <div class="forecast-info">
                                    <div class="forecast-item">Next Quarter: ↗ +23%</div>
                                    <div class="forecast-item">Confidence: 94.2%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- NLP & Text Analysis -->
                    <div class="parallax-card nlp-analysis" data-title="Natural Language Processing">
                        <div class="card-content bg-gradient-to-br from-rose-600 to-pink-800">
                            <div class="card-header">
                                <i class="fas fa-comments text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">NLP Engine</h4>
                            </div>
                            <div class="nlp-interface">
                                <div class="text-analysis">
                                    <div class="analysis-bubble positive">
                                        Sentiment: Positive 😊
                                    </div>
                                    <div class="analysis-bubble neutral">
                                        Intent: Product Inquiry
                                    </div>
                                    <div class="analysis-bubble processing">
                                        Processing response...
                                    </div>
                                </div>
                                <div class="nlp-metrics">
                                    <div class="metric-circle">
                                        <div class="circle-progress" style="--progress: 89"></div>
                                        <div class="circle-text">89%</div>
                                    </div>
                                    <div class="metric-label">Accuracy</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Third Row - Advanced AI & Technology -->
                <div class="parallax-row parallax-row-3">
                    <!-- Computer Vision System -->
                    <div class="parallax-card computer-vision" data-title="Computer Vision AI">
                        <div class="card-content bg-gradient-to-br from-indigo-600 to-purple-800">
                            <div class="card-header">
                                <i class="fas fa-eye text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Computer Vision</h4>
                            </div>
                            <div class="vision-interface">
                                <div class="detection-grid">
                                    <div class="detection-box active">
                                        <div class="box-outline"></div>
                                        <div class="detection-label">Object: 97%</div>
                                    </div>
                                    <div class="detection-box">
                                        <div class="box-outline"></div>
                                        <div class="detection-label">Face: 94%</div>
                                    </div>
                                </div>
                                <div class="vision-stats">
                                    <div class="stat-row">FPS: <span>30</span></div>
                                    <div class="stat-row">Accuracy: <span>96.8%</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Deep Learning Model -->
                    <div class="parallax-card deep-learning" data-title="Deep Learning Architecture">
                        <div class="card-content bg-gradient-to-br from-violet-600 to-indigo-800">
                            <div class="card-header">
                                <i class="fas fa-project-diagram text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Deep Learning</h4>
                            </div>
                            <div class="dl-architecture">
                                <div class="layer-stack">
                                    <div class="dl-layer input">Input Layer</div>
                                    <div class="dl-layer hidden active">Hidden Layer 1</div>
                                    <div class="dl-layer hidden">Hidden Layer 2</div>
                                    <div class="dl-layer output">Output Layer</div>
                                </div>
                                <div class="dl-info">
                                    <div class="info-item">Layers: 4</div>
                                    <div class="info-item">Neurons: 2,048</div>
                                    <div class="info-item">Weights: 1.2M</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Real-time Analytics -->
                    <div class="parallax-card realtime-analytics" data-title="Real-time Analytics">
                        <div class="card-content bg-gradient-to-br from-emerald-600 to-teal-800">
                            <div class="card-header">
                                <i class="fas fa-tachometer-alt text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Real-time Data</h4>
                            </div>
                            <div class="realtime-dashboard">
                                <div class="live-chart">
                                    <div class="chart-line">
                                        <div class="line-segment" style="height: 40%; animation-delay: 0s;"></div>
                                        <div class="line-segment" style="height: 65%; animation-delay: 0.1s;"></div>
                                        <div class="line-segment" style="height: 55%; animation-delay: 0.2s;"></div>
                                        <div class="line-segment" style="height: 80%; animation-delay: 0.3s;"></div>
                                        <div class="line-segment" style="height: 70%; animation-delay: 0.4s;"></div>
                                    </div>
                                </div>
                                <div class="live-metrics">
                                    <div class="live-value">
                                        <span class="value-number">1,247</span>
                                        <span class="value-label">Events/sec</span>
                                    </div>
                                    <div class="status-indicator live"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI-Powered Search -->
                    <div class="parallax-card ai-search" data-title="AI-Powered Search">
                        <div class="card-content bg-gradient-to-br from-cyan-600 to-blue-800">
                            <div class="card-header">
                                <i class="fas fa-search text-white text-3xl mb-3"></i>
                                <h4 class="text-white text-sm font-bold">Smart Search</h4>
                            </div>
                            <div class="search-interface">
                                <div class="search-query">
                                    <div class="query-text">"Find similar products..."</div>
                                    <div class="search-spinner"></div>
                                </div>
                                <div class="search-results">
                                    <div class="result-item">
                                        <div class="result-score">98%</div>
                                        <div class="result-text">Product A</div>
                                    </div>
                                    <div class="result-item">
                                        <div class="result-score">94%</div>
                                        <div class="result-text">Product B</div>
                                    </div>
                                    <div class="result-item">
                                        <div class="result-score">87%</div>
                                        <div class="result-text">Product C</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- AI Animated Background (maintained but with lower opacity) -->
            <div class="ai-background opacity-30">
                <!-- AI Waves -->
                <div class="ai-waves"></div>
                
                <!-- Neural Network -->
                <div class="neural-network">
                    <!-- Neural Nodes -->
                    <div class="neural-node" style="top: 20%; left: 15%; animation-delay: 0s;"></div>
                    <div class="neural-node" style="top: 30%; left: 25%; animation-delay: 0.5s;"></div>
                    <div class="neural-node" style="top: 40%; left: 35%; animation-delay: 1s;"></div>
                    <div class="neural-node" style="top: 60%; left: 45%; animation-delay: 1.5s;"></div>
                    <div class="neural-node" style="top: 70%; left: 55%; animation-delay: 2s;"></div>
                    <div class="neural-node" style="top: 25%; left: 65%; animation-delay: 0.3s;"></div>
                    <div class="neural-node" style="top: 45%; left: 75%; animation-delay: 0.8s;"></div>
                    <div class="neural-node" style="top: 15%; left: 85%; animation-delay: 1.3s;"></div>
                    
                    <!-- Neural Connections -->
                    <div class="neural-connection" style="top: 25%; left: 15%; width: 120px; transform: rotate(25deg); animation-delay: 0.2s;"></div>
                    <div class="neural-connection" style="top: 35%; left: 25%; width: 140px; transform: rotate(-15deg); animation-delay: 0.7s;"></div>
                    <div class="neural-connection" style="top: 50%; left: 35%; width: 130px; transform: rotate(45deg); animation-delay: 1.2s;"></div>
                    <div class="neural-connection" style="top: 65%; left: 45%; width: 110px; transform: rotate(-30deg); animation-delay: 1.7s;"></div>
                    <div class="neural-connection" style="top: 30%; left: 55%; width: 150px; transform: rotate(60deg); animation-delay: 0.4s;"></div>
                    <div class="neural-connection" style="top: 40%; left: 65%; width: 125px; transform: rotate(-45deg); animation-delay: 0.9s;"></div>
                </div>
                
                <!-- Floating Particles -->
                <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
                <div class="particle" style="left: 20%; animation-delay: 2s;"></div>
                <div class="particle" style="left: 30%; animation-delay: 4s;"></div>
                <div class="particle" style="left: 40%; animation-delay: 6s;"></div>
                <div class="particle" style="left: 50%; animation-delay: 8s;"></div>
                <div class="particle" style="left: 60%; animation-delay: 10s;"></div>
                <div class="particle" style="left: 70%; animation-delay: 12s;"></div>
                <div class="particle" style="left: 80%; animation-delay: 14s;"></div>
                <div class="particle" style="left: 90%; animation-delay: 16s;"></div>
                <div class="particle" style="left: 15%; animation-delay: 1s;"></div>
                <div class="particle" style="left: 35%; animation-delay: 3s;"></div>
                <div class="particle" style="left: 55%; animation-delay: 5s;"></div>
                <div class="particle" style="left: 75%; animation-delay: 7s;"></div>
                <div class="particle" style="left: 85%; animation-delay: 9s;"></div>
                <div class="particle" style="left: 25%; animation-delay: 11s;"></div>
            </div>
            
            <!-- Original Background Elements -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-5"></div>
            <div class="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
            <div class="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow"></div>
            
            <!-- Hero Content - Positioned over parallax -->
            <div class="hero-content relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center">
                <div class="animate-fade-in">
                    <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Transformando Empresas con
                        <span class="gradient-text block mt-2">Inteligencia Artificial</span>
                    </h1>
                    <p class="text-xl md:text-2xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
                        CanarIAgentic es tu partner en soluciones de IA que impulsa la innovación y eficiencia empresarial a través de tecnología vanguardista y estrategias personalizadas.
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
            
            <!-- Logo Flotante de CanarIAgentic -->
            <div class="logo-particle" style="left: 15%; top: 80%;">
                <div class="logo-symbol">
                    <div class="cc-symbol"></div>
                </div>
                <div class="logo-text">
                    <span class="canar">Canar</span><span class="ia">IA</span><span class="gentic">gentic</span>
                </div>
            </div>
            
            <!-- Segunda instancia del logo (con diferentes tiempos) -->
            <div class="logo-particle" style="left: 75%; top: 20%; animation-delay: -35s; animation-duration: 50s;">
                <div class="logo-symbol">
                    <div class="cc-symbol"></div>
                </div>
                <div class="logo-text">
                    <span class="canar">Canar</span><span class="ia">IA</span><span class="gentic">gentic</span>
                </div>
            </div>
            
            <!-- Tercera instancia del logo (con diferentes tiempos) -->
            <div class="logo-particle" style="left: 45%; top: 50%; animation-delay: -12s; animation-duration: 40s;">
                <div class="logo-symbol">
                    <div class="cc-symbol"></div>
                </div>
                <div class="logo-text">
                    <span class="canar">Canar</span><span class="ia">IA</span><span class="gentic">gentic</span>
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
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col h-full">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
                                <i class="fas fa-graduation-cap text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Formación Personalizada de IA</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Desarrollamos programas de capacitación a medida para que tu equipo domine las herramientas y conceptos de inteligencia artificial más avanzados.
                        </p>
                        <ul class="space-y-3 mb-8 flex-grow">
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
                        <button onclick="openModal('formacion')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors mt-auto">
                            <i class="fas fa-eye mr-2"></i>Ver Detalles
                        </button>
                    </div>
                    
                    <!-- Pillar 2: Consultoría -->
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col h-full">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style="animation-delay: 0.2s;">
                                <i class="fas fa-lightbulb text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Consultoría Vanguardista</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Ayudamos a las empresas a identificar oportunidades de mejora e innovación mediante el análisis estratégico con inteligencia artificial.
                        </p>
                        <ul class="space-y-3 mb-8 flex-grow">
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
                        <button onclick="openModal('consultoria')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors mt-auto">
                            <i class="fas fa-eye mr-2"></i>Ver Detalles
                        </button>
                    </div>
                    
                    <!-- Pillar 3: Agentes -->
                    <div class="section-fade-in hover-lift bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col h-full">
                        <div class="text-center mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style="animation-delay: 0.4s;">
                                <i class="fas fa-cogs text-white text-3xl"></i>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Creación de Agentes IA</h3>
                        </div>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            Diseñamos e implementamos agentes inteligentes que automatizan y optimizan los procesos empresariales de manera eficiente.
                        </p>
                        <ul class="space-y-3 mb-8 flex-grow">
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
                        <a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center mt-auto">
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
                
                <div class="services-grid grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
                    <!-- Service 1 -->
                    <div class="service-card-3d section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift flex flex-col h-full">
                        <div class="h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <i class="fas fa-chalkboard-teacher text-white text-6xl"></i>
                        </div>
                        <div class="p-8 flex flex-col flex-grow">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Formación en IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed flex-grow">
                                Programas de capacitación personalizados para que tu equipo domine las herramientas y conceptos de inteligencia artificial más relevantes.
                            </p>
                            <a href="#contact" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift mt-auto">
                                <i class="fas fa-info"></i>
                                <span>Más Información</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Service 2 -->
                    <div class="service-card-3d section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift flex flex-col h-full">
                        <div class="h-48 bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                            <i class="fas fa-chart-line text-white text-6xl"></i>
                        </div>
                        <div class="p-8 flex flex-col flex-grow">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Consultoría de IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed flex-grow">
                                Análisis estratégico para identificar oportunidades de mejora e innovación mediante la implementación de inteligencia artificial.
                            </p>
                            <a href="#contact" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift mt-auto">
                                <i class="fas fa-info"></i>
                                <span>Más Información</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Service 3 -->
                    <div class="service-card-3d section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift flex flex-col h-full">
                        <div class="h-48 bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                            <i class="fas fa-robot text-white text-6xl"></i>
                        </div>
                        <div class="p-8 flex flex-col flex-grow">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Desarrollo de Agentes IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed flex-grow">
                                Creación e implementación de agentes inteligentes que automatizan y optimizan los procesos empresariales de forma efectiva.
                            </p>
                            <a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift mt-auto">
                                <i class="fas fa-external-link-alt"></i>
                                <span>Ver Demostración</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Service 4 - Páginas Web y Marketing Digital -->
                    <div class="service-card-3d section-fade-in bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover-lift flex flex-col h-full">
                        <div class="h-48 bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                            <i class="fas fa-globe-europe text-white text-6xl"></i>
                        </div>
                        <div class="p-8 flex flex-col flex-grow">
                            <h3 class="text-2xl font-bold text-slate-800 mb-4">Páginas Web y Marketing Digital IA</h3>
                            <p class="text-slate-600 mb-6 leading-relaxed flex-grow">
                                Diseñamos sitios web modernos optimizados con SEO y campañas de marketing digital impulsadas por IA para maximizar tu presencia online y conversiones.
                            </p>
                            <a href="#contact" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 hover-lift mt-auto">
                                <i class="fas fa-info"></i>
                                <span>Más Información</span>
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
                
                <!-- Infinite Moving Testimonials -->
                <div class="infinite-testimonials-container relative overflow-hidden">
                    <div class="testimonials-scroller" id="testimonialsScroller">
                        <!-- Testimonial 1 -->
                        <div class="testimonial-card">
                            <div class="card-glow"></div>
                            <div class="flex items-center text-yellow-400 mb-4">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <blockquote class="text-slate-600 mb-6 italic leading-relaxed">
                                "La formación en IA que recibimos de CanarIAgentic transformó completamente nuestros procesos. Ahora somos 40% más eficientes en análisis de datos y hemos implementado 3 nuevos modelos predictivos."
                            </blockquote>
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
                        <div class="testimonial-card">
                            <div class="card-glow"></div>
                            <div class="flex items-center text-yellow-400 mb-4">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <blockquote class="text-slate-600 mb-6 italic leading-relaxed">
                                "Los agentes IA desarrollados por CanarIAgentic han automatizado nuestro servicio al cliente. Reducimos tiempos de respuesta en un 60% y mejoramos la satisfacción del cliente significativamente."
                            </blockquote>
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
                        <div class="testimonial-card">
                            <div class="card-glow"></div>
                            <div class="flex items-center text-yellow-400 mb-4">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <blockquote class="text-slate-600 mb-6 italic leading-relaxed">
                                "La consultoría estratégica nos ayudó a identificar oportunidades que no veíamos. ROI positivo en solo 3 meses. Su expertise en IA transformó nuestra visión de negocio."
                            </blockquote>
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
                        
                        <!-- Testimonial 4 - Additional -->
                        <div class="testimonial-card">
                            <div class="card-glow"></div>
                            <div class="flex items-center text-yellow-400 mb-4">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <blockquote class="text-slate-600 mb-6 italic leading-relaxed">
                                "El desarrollo de nuestro chatbot inteligente superó todas las expectativas. Procesamos 10x más consultas con mayor precisión. CanarIAgentic entiende perfectamente las necesidades empresariales."
                            </blockquote>
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    JS
                                </div>
                                <div>
                                    <h4 class="font-semibold text-slate-800">Javier Santana</h4>
                                    <p class="text-slate-500">CTO, StartupTech Canarias</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Testimonial 5 - Additional -->
                        <div class="testimonial-card">
                            <div class="card-glow"></div>
                            <div class="flex items-center text-yellow-400 mb-4">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                            </div>
                            <blockquote class="text-slate-600 mb-6 italic leading-relaxed">
                                "La implementación de machine learning en nuestros procesos de manufacturing redujo defectos en un 85%. El equipo de CanarIAgentic demostró un conocimiento técnico excepcional."
                            </blockquote>
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    LM
                                </div>
                                <div>
                                    <h4 class="font-semibold text-slate-800">Laura Martín</h4>
                                    <p class="text-slate-500">Directora Operaciones, Manufactura Plus</p>
                                </div>
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
                                    <p class="opacity-80">soporte@canariagentic.com</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                                    <i class="fas fa-phone text-accent text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold">Teléfono</h4>
                                    <p class="opacity-80">+34 649 823 612</p>
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
                                <select name="service" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-accent focus:outline-none transition-colors service-select">
                                    <option value="">Seleccionar servicio</option>
                                    <option value="formacion">Formación en IA</option>
                                    <option value="consultoria">Consultoría de IA</option>
                                    <option value="agentes">Desarrollo de Agentes IA</option>
                                    <option value="webmarketing">Páginas Web y Marketing Digital IA</option>
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
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <!-- Company Info -->
                    <div>
                        <div class="flex items-center space-x-3 mb-6">
                            <div class="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center animate-float">
                                <i class="fas fa-robot text-white text-lg"></i>
                            </div>
                            <span class="text-2xl font-bold text-white">Canar<span class="text-accent">IA</span>gentic</span>
                        </div>
                        <p class="text-slate-400 mb-6 leading-relaxed">
                            Somos una agencia canaria especializada en soluciones de inteligencia artificial para empresas. 
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
                            <li><a href="#services" class="text-slate-400 hover:text-white transition-colors">Web y Marketing IA</a></li>
                            <li><a href="https://studio.pickaxe.co/STUDIOD9VCTFILPI7W0YP" target="_blank" class="text-slate-400 hover:text-white transition-colors">Demo Agentes</a></li>
                        </ul>
                    </div>
                    
                    <!-- Legal -->
                    <div>
                        <h4 class="text-xl font-semibold mb-6">Legal</h4>
                        <ul class="space-y-3">
                            <li><a href="#" onclick="showPrivacyPolicy()" class="text-slate-400 hover:text-white transition-colors">Política de Privacidad</a></li>
                            <li><a href="#" onclick="showCookiePolicy()" class="text-slate-400 hover:text-white transition-colors">Política de Cookies</a></li>
                            <li><a href="#" onclick="showTermsOfService()" class="text-slate-400 hover:text-white transition-colors">Términos de Servicio</a></li>
                            <li><a href="#" onclick="cookieManager.showSettings()" class="text-slate-400 hover:text-white transition-colors">Configurar Cookies</a></li>
                            <li><a href="#contact" class="text-slate-400 hover:text-white transition-colors">Contacto Legal</a></li>
                        </ul>
                    </div>
                </div>
                
                <!-- Bottom -->
                <div class="border-t border-slate-800 mt-12 pt-8">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <p class="text-slate-400 mb-4 md:mb-0">&copy; 2024 CanarIAgentic. Todos los derechos reservados. Hecho con ❤️ en Canarias.</p>
                        <div class="flex space-x-4 text-sm">
                            <a href="#" onclick="showPrivacyPolicy()" class="text-slate-500 hover:text-slate-300 transition-colors">Privacidad</a>
                            <a href="#" onclick="showCookiePolicy()" class="text-slate-500 hover:text-slate-300 transition-colors">Cookies</a>
                            <a href="#" onclick="showTermsOfService()" class="text-slate-500 hover:text-slate-300 transition-colors">Términos</a>
                        </div>
                    </div>
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
        <div id="notification" class="fixed bottom-8 right-8 bg-green-500 text-white p-6 rounded-xl shadow-2xl transform translate-y-full transition-transform duration-300 z-50 max-w-sm opacity-0">
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
                    notification.className = 'fixed bottom-8 right-8 bg-green-500 text-white p-6 rounded-xl shadow-2xl transition-all duration-300 z-50 max-w-sm';
                } else {
                    notification.className = 'fixed bottom-8 right-8 bg-red-500 text-white p-6 rounded-xl shadow-2xl transition-all duration-300 z-50 max-w-sm';
                }
                
                // Show notification with animation
                notification.style.transform = 'translateY(0)';
                notification.style.opacity = '1';
                
                // Hide after 4 seconds with smooth animation
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(100%)';
                }, 4000);
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
            
            // AI Waves Mouse Interaction
            let mouseX = 0;
            let mouseY = 0;
            let targetX = 0;
            let targetY = 0;
            
            // Track mouse movement
            document.addEventListener('mousemove', (e) => {
                mouseX = (e.clientX / window.innerWidth) * 100;
                mouseY = (e.clientY / window.innerHeight) * 100;
            });
            
            // Smooth animation function
            function animateWaves() {
                // Smooth interpolation
                targetX += (mouseX - targetX) * 0.05;
                targetY += (mouseY - targetY) * 0.05;
                
                const aiWaves = document.querySelector('.ai-waves');
                if (aiWaves) {
                    // Calculate transform based on mouse position
                    const translateX = (targetX - 50) * 0.5;  // Reduced movement intensity
                    const translateY = (targetY - 50) * 0.5;
                    const rotation = (targetX - 50) * 0.02;   // Subtle rotation
                    const scale = 1 + ((targetX + targetY) / 200) * 0.1; // Subtle scale
                    
                    aiWaves.style.transform = \`translateX(\${translateX}px) translateY(\${translateY}px) rotate(\${rotation}deg) scale(\${scale})\`;
                }
                
                // Also animate neural network nodes
                const neuralNodes = document.querySelectorAll('.neural-node');
                neuralNodes.forEach((node, index) => {
                    const delay = index * 0.1;
                    const offsetX = Math.sin((targetX + delay) * 0.02) * 2;
                    const offsetY = Math.cos((targetY + delay) * 0.02) * 2;
                    
                    node.style.transform = \`translate(\${offsetX}px, \${offsetY}px) scale(\${1 + Math.sin((targetX + targetY + delay) * 0.01) * 0.2})\`;
                });
                
                // Animate neural connections
                const neuralConnections = document.querySelectorAll('.neural-connection');
                neuralConnections.forEach((connection, index) => {
                    const intensity = 0.5 + (Math.sin((targetX + targetY + index * 10) * 0.02) * 0.5);
                    connection.style.opacity = intensity * 0.3;  // Keep it subtle
                });
                
                // Continue animation
                requestAnimationFrame(animateWaves);
            }
            
            // Start the animation
            animateWaves();
            
            // Add mouse interaction to particles
            const particles = document.querySelectorAll('.particle');
            document.addEventListener('mousemove', (e) => {
                particles.forEach((particle, index) => {
                    const rect = particle.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const deltaX = e.clientX - centerX;
                    const deltaY = e.clientY - centerY;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    // Repel particles when mouse is near (within 100px)
                    if (distance < 100) {
                        const force = (100 - distance) / 100;
                        const pushX = (deltaX / distance) * force * -20;
                        const pushY = (deltaY / distance) * force * -20;
                        
                        particle.style.transform = \`translate(\${pushX}px, \${pushY}px) scale(\${1 + force * 0.5})\`;
                    } else {
                        particle.style.transform = 'translate(0px, 0px) scale(1)';
                    }
                });
            });
        
        // Cookie Management System
        class CookieManager {
            constructor() {
                this.cookieSettings = {
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    functional: false
                };
                this.init();
            }
            
            init() {
                this.loadCookieSettings();
                if (!this.hasUserDecision()) {
                    this.showCookieBanner();
                }
                this.bindEvents();
            }
            
            hasUserDecision() {
                return localStorage.getItem('cookieDecision') !== null;
            }
            
            showCookieBanner() {
                setTimeout(() => {
                    const banner = document.getElementById('cookie-banner');
                    if (banner) {
                        banner.classList.add('show');
                        console.log('Cookie banner shown');
                    }
                }, 1000);
            }
            
            hideCookieBanner() {
                const banner = document.getElementById('cookie-banner');
                if (banner) {
                    banner.classList.remove('show');
                    banner.classList.add('hide');
                }
            }
            
            async saveDecision(type) {
                // Save to localStorage
                localStorage.setItem('cookieDecision', type);
                localStorage.setItem('cookieSettings', JSON.stringify(this.cookieSettings));
                localStorage.setItem('cookieTimestamp', new Date().toISOString());
                
                // Save to Supabase for legal compliance
                await this.logCookieConsent(type);
                
                this.hideCookieBanner();
            }
            
            async logCookieConsent(decision) {
                try {
                    const consentData = {
                        user_id: this.getUserId(),
                        decision_type: decision,
                        cookie_settings: this.cookieSettings,
                        user_agent: navigator.userAgent,
                        page_url: window.location.href
                    };
                    
                    const response = await fetch('/api/cookie-consent', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(consentData)
                    });
                    
                    if (response.ok) {
                        console.log('Cookie consent logged successfully');
                    } else {
                        console.warn('Failed to log cookie consent:', response.status);
                    }
                } catch (error) {
                    console.warn('Error logging cookie consent:', error);
                }
            }
            
            getUserId() {
                let userId = localStorage.getItem('anonymousUserId');
                if (!userId) {
                    userId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
                    localStorage.setItem('anonymousUserId', userId);
                }
                return userId;
            }
            
            loadCookieSettings() {
                const saved = localStorage.getItem('cookieSettings');
                if (saved) {
                    this.cookieSettings = { ...this.cookieSettings, ...JSON.parse(saved) };
                }
            }
            
            async acceptAll() {
                this.cookieSettings = {
                    necessary: true,
                    analytics: true,
                    marketing: true,
                    functional: true
                };
                await this.saveDecision('accept_all');
            }
            
            async rejectAll() {
                this.cookieSettings = {
                    necessary: true,
                    analytics: false,
                    marketing: false,
                    functional: false
                };
                await this.saveDecision('reject_all');
            }
            
            showSettings() {
                const modal = document.getElementById('cookie-settings-modal');
                if (modal) {
                    modal.classList.add('show');
                    this.updateSettingsUI();
                }
            }
            
            hideSettings() {
                const modal = document.getElementById('cookie-settings-modal');
                if (modal) modal.classList.remove('show');
            }
            
            updateSettingsUI() {
                Object.keys(this.cookieSettings).forEach(key => {
                    const toggle = document.getElementById('cookie-' + key);
                    if (toggle) toggle.checked = this.cookieSettings[key];
                });
            }
            
            async saveCustomSettings() {
                Object.keys(this.cookieSettings).forEach(key => {
                    const toggle = document.getElementById('cookie-' + key);
                    if (toggle && key !== 'necessary') {
                        this.cookieSettings[key] = toggle.checked;
                    }
                });
                await this.saveDecision('custom');
                this.hideSettings();
            }
            
            bindEvents() {
                // Wait for DOM to be ready
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupEventListeners();
                });
                
                // Also try to bind immediately in case DOM is already ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.setupEventListeners();
                    });
                } else {
                    this.setupEventListeners();
                }
            }
            
            setupEventListeners() {
                // Banner buttons
                const acceptBtn = document.getElementById('accept-all-cookies');
                const rejectBtn = document.getElementById('reject-all-cookies');
                const settingsBtn = document.getElementById('cookie-settings-btn');
                
                if (acceptBtn) {
                    acceptBtn.addEventListener('click', () => {
                        console.log('Accept all clicked');
                        this.acceptAll();
                    });
                }
                if (rejectBtn) {
                    rejectBtn.addEventListener('click', () => {
                        console.log('Reject all clicked');
                        this.rejectAll();
                    });
                }
                if (settingsBtn) {
                    settingsBtn.addEventListener('click', () => {
                        console.log('Settings clicked');
                        this.showSettings();
                    });
                }
                
                // Settings modal buttons
                const closeSettings = document.getElementById('close-cookie-settings');
                const saveSettings = document.getElementById('save-cookie-settings');
                
                if (closeSettings) {
                    closeSettings.addEventListener('click', () => this.hideSettings());
                }
                if (saveSettings) {
                    saveSettings.addEventListener('click', () => this.saveCustomSettings());
                }
                
                // Modal backdrop
                const modal = document.getElementById('cookie-settings-modal');
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) this.hideSettings();
                    });
                }
            }
        }
        
        // Initialize cookie manager
        const cookieManager = new CookieManager();
        
        // 3D Service Cards Animation Manager
        class ServiceCards3D {
            constructor() {
                this.serviceCards = [];
                this.init();
            }
            
            init() {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.setup3DCards();
                    });
                } else {
                    this.setup3DCards();
                }
            }
            
            setup3DCards() {
                // Get all service cards
                this.serviceCards = document.querySelectorAll('.service-card-3d');
                
                if (this.serviceCards.length === 0) {
                    return; // No cards found, skip animation
                }
                
                // Add mouse tracking to each service card
                this.serviceCards.forEach((card, index) => {
                    this.setupCardTracking(card);
                });
            }
            
            setupCardTracking(card) {
                const cardElements = {
                    header: card.querySelector('.h-48'),
                    content: card.querySelector('.p-8'),
                    title: card.querySelector('h3'),
                    text: card.querySelector('p'),
                    button: card.querySelector('a'),
                    icon: card.querySelector('.h-48 i')
                };
                
                card.addEventListener('mousemove', (e) => {
                    this.handleMouseMove(e, card, cardElements);
                });
                
                card.addEventListener('mouseleave', () => {
                    this.resetCard(card, cardElements);
                });
            }
            
            handleMouseMove(e, card, elements) {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Calculate mouse position relative to card center
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                // Convert to rotation degrees (reduced intensity for subtlety)
                const rotateY = (mouseX / rect.width) * 15;  // Max 15 degrees
                const rotateX = -(mouseY / rect.height) * 15; // Max 15 degrees
                
                // Apply main card rotation
                card.style.transform = 'rotateY(' + rotateY + 'deg) rotateX(' + rotateX + 'deg)';
                
                // Apply layered 3D effects to elements
                if (elements.header) {
                    elements.header.style.transform = 'translateZ(20px) rotateY(' + (rotateY * 0.5) + 'deg)';
                }
                
                if (elements.title) {
                    elements.title.style.transform = 'translateZ(30px) rotateY(' + (rotateY * 0.3) + 'deg)';
                }
                
                if (elements.text) {
                    elements.text.style.transform = 'translateZ(15px) rotateY(' + (rotateY * 0.2) + 'deg)';
                }
                
                if (elements.button) {
                    elements.button.style.transform = 'translateZ(40px) rotateY(' + (rotateY * 0.4) + 'deg) scale(1.02)';
                }
                
                if (elements.icon) {
                    elements.icon.style.transform = 'translateZ(30px) rotateY(' + (rotateY * 0.6) + 'deg) scale(1.1)';
                }
            }
            
            resetCard(card, elements) {
                // Smooth return to original position
                card.style.transform = 'rotateY(0deg) rotateX(0deg)';
                
                // Reset all elements
                Object.values(elements).forEach(element => {
                    if (element) {
                        element.style.transform = 'translateZ(0px) rotateY(0deg) rotateX(0deg) scale(1)';
                    }
                });
            }
        }
        
        // Initialize 3D service cards
        const serviceCards3D = new ServiceCards3D();
        
        // Hero Parallax Manager (Simplified - No scroll dependency)
        class HeroParallax {
            constructor() {
                this.parallaxCards = [];
                this.init();
            }
            
            init() {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.setupParallax();
                    });
                } else {
                    this.setupParallax();
                }
            }
            
            setupParallax() {
                this.parallaxCards = document.querySelectorAll('.parallax-card');
                
                if (this.parallaxCards.length === 0) {
                    return; // Elements not found
                }
                
                // Add hover effects to parallax cards only
                this.addCardInteractions();
                
                // Set initial opacity for cards (no scroll dependency)
                this.setInitialCardStates();
            }
            
            setInitialCardStates() {
                this.parallaxCards.forEach((card, index) => {
                    // Set a subtle animated opacity that cycles
                    const animationDelay = index * 0.5;
                    card.style.animation = 'cardPulse 4s ease-in-out infinite';
                    card.style.animationDelay = animationDelay + 's';
                });
            }
            
            addCardInteractions() {
                this.parallaxCards.forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        card.style.filter = 'blur(0px) brightness(1.1)';
                        card.style.opacity = '0.9';
                        card.style.transform = 'translateY(-15px) scale(1.08)';
                        // Temporarily disable the pulse animation
                        card.style.animation = 'none';
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        // Reset to default states
                        card.style.filter = '';
                        card.style.opacity = '';
                        card.style.transform = '';
                        // Re-enable pulse animation
                        card.style.animation = 'cardPulse 4s ease-in-out infinite';
                    });
                });
            }
        }
        
        // Initialize hero parallax
        const heroParallax = new HeroParallax();
        
        // Infinite Moving Testimonials Manager
        class InfiniteTestimonials {
            constructor() {
                this.scroller = null;
                this.cards = [];
                this.isHovered = false;
                this.init();
            }
            
            init() {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.setupInfiniteScroll();
                    });
                } else {
                    this.setupInfiniteScroll();
                }
            }
            
            setupInfiniteScroll() {
                this.scroller = document.getElementById('testimonialsScroller');
                this.cards = document.querySelectorAll('.testimonial-card');
                
                if (!this.scroller || this.cards.length === 0) {
                    return; // Elements not found
                }
                
                // Clone cards for infinite effect
                this.cloneCards();
                
                // Add interaction listeners
                this.addInteractionListeners();
                
                // Setup intersection observer for performance
                this.setupIntersectionObserver();
            }
            
            cloneCards() {
                // Clone all cards to create seamless infinite loop
                this.cards.forEach(card => {
                    const clone = card.cloneNode(true);
                    this.scroller.appendChild(clone);
                });
                
                // Update cards list to include clones
                this.cards = document.querySelectorAll('.testimonial-card');
            }
            
            addInteractionListeners() {
                // Pause animation on hover over the entire container
                const container = document.querySelector('.infinite-testimonials-container');
                
                if (container) {
                    container.addEventListener('mouseenter', () => {
                        this.isHovered = true;
                        this.scroller.style.animationPlayState = 'paused';
                    });
                    
                    container.addEventListener('mouseleave', () => {
                        this.isHovered = false;
                        this.scroller.style.animationPlayState = 'running';
                    });
                }
                
                // Add individual card interactions
                this.cards.forEach((card, index) => {
                    card.addEventListener('mouseenter', () => {
                        this.highlightCard(card);
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        this.unhighlightCard(card);
                    });
                    
                    // Add click interaction for potential future use
                    card.addEventListener('click', () => {
                        this.handleCardClick(card, index);
                    });
                });
            }
            
            highlightCard(card) {
                // Add subtle highlight effect
                card.style.zIndex = '10';
                card.style.transform = 'translateY(-8px) scale(1.02)';
            }
            
            unhighlightCard(card) {
                // Reset to normal state
                card.style.zIndex = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }
            
            handleCardClick(card, index) {
                // Future enhancement: could open modal or detailed view
                console.log('Testimonial card clicked:', index);
                
                // Add a subtle click feedback
                card.style.transform = 'translateY(-5px) scale(0.98)';
                setTimeout(() => {
                    if (!this.isHovered) {
                        card.style.transform = 'translateY(0) scale(1)';
                    }
                }, 150);
            }
            
            setupIntersectionObserver() {
                // Pause animation when section is not visible for performance
                if (!window.IntersectionObserver) return;
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.scroller.style.animationPlayState = this.isHovered ? 'paused' : 'running';
                        } else {
                            this.scroller.style.animationPlayState = 'paused';
                        }
                    });
                }, { threshold: 0.1 });
                
                const container = document.querySelector('.infinite-testimonials-container');
                if (container) {
                    observer.observe(container);
                }
            }
            
            // Method to dynamically change animation speed
            setSpeed(speed) {
                const durations = {
                    'slow': '60s',
                    'normal': '40s',
                    'fast': '20s'
                };
                
                if (durations[speed]) {
                    this.scroller.style.animationDuration = durations[speed];
                }
            }
            
            // Method to change direction
            setDirection(direction) {
                if (direction === 'right') {
                    this.scroller.style.animationName = 'scroll-right';
                } else {
                    this.scroller.style.animationName = 'scroll-left';
                }
            }
        }
        
        // Initialize infinite testimonials
        const infiniteTestimonials = new InfiniteTestimonials();
        
        // Legal Policies Functions
        function showPrivacyPolicy() {
            const modal = document.getElementById('privacy-policy-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
        
        function showCookiePolicy() {
            const modal = document.getElementById('cookie-policy-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
        
        function showTermsOfService() {
            const modal = document.getElementById('terms-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
        
        function closeLegalModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }
        
        // Make functions globally available
        window.showPrivacyPolicy = showPrivacyPolicy;
        window.showCookiePolicy = showCookiePolicy;
        window.showTermsOfService = showTermsOfService;
        window.closeLegalModal = closeLegalModal;
        
        </script>
        
        <!-- Cookie Banner -->
        <div id="cookie-banner" class="cookie-banner">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-cookie-bite text-accent text-2xl mt-1"></i>
                            <div>
                                <h3 class="font-semibold text-lg mb-2">Configuración de Cookies</h3>
                                <p class="text-sm opacity-90 leading-relaxed">
                                    Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. 
                                    Puedes aceptar todas las cookies o configurar tus preferencias.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3 min-w-max">
                        <button id="reject-all-cookies" class="px-4 py-2 text-sm border border-white/30 rounded-lg hover:bg-white/10 transition-colors">
                            Rechazar Todas
                        </button>
                        <button id="cookie-settings-btn" class="px-4 py-2 text-sm border border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors">
                            Configurar
                        </button>
                        <button id="accept-all-cookies" class="px-6 py-2 text-sm bg-accent hover:bg-accent/90 rounded-lg font-medium transition-colors">
                            Aceptar Todas
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cookie Settings Modal -->
        <div id="cookie-settings-modal" class="cookie-settings-modal">
            <div class="cookie-settings-content">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-slate-800">Configuración de Cookies</h3>
                    <button id="close-cookie-settings" class="text-slate-400 hover:text-slate-600 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <!-- Necessary Cookies -->
                    <div class="flex justify-between items-start">
                        <div class="flex-1 pr-4">
                            <h4 class="font-semibold text-slate-800 mb-2">Cookies Necesarias</h4>
                            <p class="text-sm text-slate-600">
                                Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar.
                            </p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="cookie-necessary" checked disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Analytics Cookies -->
                    <div class="flex justify-between items-start">
                        <div class="flex-1 pr-4">
                            <h4 class="font-semibold text-slate-800 mb-2">Cookies Analíticas</h4>
                            <p class="text-sm text-slate-600">
                                Nos ayudan a entender cómo los visitantes interactúan con el sitio web recopilando información de forma anónima.
                            </p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="cookie-analytics">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Marketing Cookies -->
                    <div class="flex justify-between items-start">
                        <div class="flex-1 pr-4">
                            <h4 class="font-semibold text-slate-800 mb-2">Cookies de Marketing</h4>
                            <p class="text-sm text-slate-600">
                                Se utilizan para rastrear a los visitantes y mostrar anuncios relevantes y atractivos para cada usuario.
                            </p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="cookie-marketing">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <!-- Functional Cookies -->
                    <div class="flex justify-between items-start">
                        <div class="flex-1 pr-4">
                            <h4 class="font-semibold text-slate-800 mb-2">Cookies Funcionales</h4>
                            <p class="text-sm text-slate-600">
                                Permiten recordar tus preferencias y proporcionar características mejoradas y más personales.
                            </p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="cookie-functional">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-4 mt-8">
                    <button id="save-cookie-settings" class="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors">
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Privacy Policy Modal -->
        <div id="privacy-policy-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-3xl font-bold text-slate-800">Política de Privacidad</h3>
                        <button onclick="closeLegalModal('privacy-policy-modal')" class="text-slate-400 hover:text-slate-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="prose prose-lg max-w-none text-slate-600">
                        <p class="text-sm text-slate-500 mb-6">Última actualización: Enero 2024</p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">1. Información que Recopilamos</h4>
                        <p class="mb-4">
                            En CanarIAgentic recopilamos la siguiente información personal cuando usted:
                        </p>
                        <ul class="list-disc pl-6 mb-6">
                            <li><strong>Utiliza nuestro formulario de contacto:</strong> nombre, email, empresa, teléfono y mensaje</li>
                            <li><strong>Navega por nuestro sitio web:</strong> dirección IP, tipo de navegador, páginas visitadas y tiempo de permanencia</li>
                            <li><strong>Interactúa con nuestros servicios:</strong> preferencias de usuario y historial de comunicaciones</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">2. Cómo Utilizamos su Información</h4>
                        <p class="mb-4">Utilizamos su información personal para:</p>
                        <ul class="list-disc pl-6 mb-6">
                            <li>Responder a sus consultas y proporcionarle información sobre nuestros servicios</li>
                            <li>Mejorar nuestro sitio web y servicios mediante análisis de uso</li>
                            <li>Enviarle comunicaciones relacionadas con nuestros servicios (con su consentimiento)</li>
                            <li>Cumplir con nuestras obligaciones legales</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">3. Base Legal para el Tratamiento</h4>
                        <p class="mb-4">
                            Procesamos su información personal basándonos en:
                        </p>
                        <ul class="list-disc pl-6 mb-6">
                            <li><strong>Consentimiento:</strong> Para comunicaciones de marketing y cookies no esenciales</li>
                            <li><strong>Intereses legítimos:</strong> Para mejorar nuestros servicios y seguridad del sitio web</li>
                            <li><strong>Ejecución de contrato:</strong> Para proporcionar los servicios solicitados</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">4. Compartir Información</h4>
                        <p class="mb-6">
                            No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
                        </p>
                        <ul class="list-disc pl-6 mb-6">
                            <li>Proveedores de servicios que nos ayudan a operar nuestro sitio web (como Supabase para almacenamiento de datos)</li>
                            <li>Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">5. Sus Derechos (GDPR)</h4>
                        <p class="mb-4">Bajo el GDPR, usted tiene derecho a:</p>
                        <ul class="list-disc pl-6 mb-6">
                            <li><strong>Acceso:</strong> Solicitar una copia de los datos personales que tenemos sobre usted</li>
                            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                            <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos personales</li>
                            <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado</li>
                            <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                            <li><strong>Limitación:</strong> Solicitar la restricción del procesamiento</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">6. Seguridad de los Datos</h4>
                        <p class="mb-6">
                            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">7. Retención de Datos</h4>
                        <p class="mb-6">
                            Conservamos su información personal solo durante el tiempo necesario para los fines descritos en esta política, o según lo requerido por ley.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">8. Contacto</h4>
                        <p class="mb-4">
                            Para ejercer sus derechos o si tiene preguntas sobre esta política, contáctenos:
                        </p>
                        <ul class="list-none mb-6">
                            <li><strong>Email:</strong> soporte@canariagentic.com</li>
                            <li><strong>Teléfono:</strong> +34 649 823 612</li>
                            <li><strong>Dirección:</strong> Santa Cruz de Tenerife, España</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cookie Policy Modal -->
        <div id="cookie-policy-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-3xl font-bold text-slate-800">Política de Cookies</h3>
                        <button onclick="closeLegalModal('cookie-policy-modal')" class="text-slate-400 hover:text-slate-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="prose prose-lg max-w-none text-slate-600">
                        <p class="text-sm text-slate-500 mb-6">Última actualización: Enero 2024</p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">¿Qué son las Cookies?</h4>
                        <p class="mb-6">
                            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. 
                            Nos permiten recordar sus preferencias y mejorar su experiencia de navegación.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">Tipos de Cookies que Utilizamos</h4>
                        
                        <div class="bg-slate-50 p-6 rounded-xl mb-6">
                            <h5 class="font-semibold text-slate-800 mb-3">Cookies Necesarias</h5>
                            <p class="mb-2">
                                <strong>Propósito:</strong> Esenciales para el funcionamiento básico del sitio web.
                            </p>
                            <p class="mb-2">
                                <strong>Ejemplos:</strong> Configuración de idioma, estado de login, configuración de cookies.
                            </p>
                            <p><strong>Base legal:</strong> Interés legítimo (funcionamiento del sitio web).</p>
                        </div>
                        
                        <div class="bg-slate-50 p-6 rounded-xl mb-6">
                            <h5 class="font-semibold text-slate-800 mb-3">Cookies Analíticas</h5>
                            <p class="mb-2">
                                <strong>Propósito:</strong> Recopilar información sobre cómo los usuarios utilizan nuestro sitio web.
                            </p>
                            <p class="mb-2">
                                <strong>Información recopilada:</strong> Páginas visitadas, tiempo de permanencia, fuente de tráfico.
                            </p>
                            <p><strong>Base legal:</strong> Consentimiento del usuario.</p>
                        </div>
                        
                        <div class="bg-slate-50 p-6 rounded-xl mb-6">
                            <h5 class="font-semibold text-slate-800 mb-3">Cookies de Marketing</h5>
                            <p class="mb-2">
                                <strong>Propósito:</strong> Personalizar publicidad y medir la efectividad de campañas.
                            </p>
                            <p class="mb-2">
                                <strong>Uso:</strong> Mostrar anuncios relevantes y evitar anuncios repetitivos.
                            </p>
                            <p><strong>Base legal:</strong> Consentimiento del usuario.</p>
                        </div>
                        
                        <div class="bg-slate-50 p-6 rounded-xl mb-6">
                            <h5 class="font-semibold text-slate-800 mb-3">Cookies Funcionales</h5>
                            <p class="mb-2">
                                <strong>Propósito:</strong> Recordar preferencias del usuario para mejorar la experiencia.
                            </p>
                            <p class="mb-2">
                                <strong>Ejemplos:</strong> Configuración de diseño, preferencias de contenido.
                            </p>
                            <p><strong>Base legal:</strong> Consentimiento del usuario.</p>
                        </div>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">Gestión de Cookies</h4>
                        <p class="mb-4">Puede gestionar sus preferencias de cookies de las siguientes maneras:</p>
                        <ul class="list-disc pl-6 mb-6">
                            <li><strong>Banner de cookies:</strong> Al visitar nuestro sitio por primera vez</li>
                            <li><strong>Configuración de cookies:</strong> Haciendo clic en "Configurar Cookies" en cualquier momento</li>
                            <li><strong>Configuración del navegador:</strong> A través de la configuración de su navegador web</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">Cookies de Terceros</h4>
                        <p class="mb-6">
                            Algunos de nuestros socios de confianza también pueden establecer cookies en nuestro sitio web para 
                            proporcionar servicios analíticos y de publicidad. Estos terceros tienen sus propias políticas de privacidad.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">Actualizaciones de la Política</h4>
                        <p class="mb-6">
                            Podemos actualizar esta Política de Cookies ocasionalmente. Le notificaremos sobre cambios significativos 
                            a través de nuestro sitio web o por otros medios apropiados.
                        </p>
                        
                        <div class="mt-8 p-4 bg-accent/10 rounded-xl">
                            <p class="text-center">
                                <button onclick="cookieManager.showSettings()" class="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    Configurar Mis Cookies
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Terms of Service Modal -->
        <div id="terms-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <h3 class="text-3xl font-bold text-slate-800">Términos de Servicio</h3>
                        <button onclick="closeLegalModal('terms-modal')" class="text-slate-400 hover:text-slate-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="prose prose-lg max-w-none text-slate-600">
                        <p class="text-sm text-slate-500 mb-6">Última actualización: Enero 2024</p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">1. Aceptación de los Términos</h4>
                        <p class="mb-6">
                            Al acceder y utilizar el sitio web de CanarIAgentic, usted acepta cumplir con estos Términos de Servicio. 
                            Si no está de acuerdo con alguno de estos términos, no utilice nuestros servicios.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">2. Descripción de los Servicios</h4>
                        <p class="mb-4">CanarIAgentic ofrece:</p>
                        <ul class="list-disc pl-6 mb-6">
                            <li>Servicios de consultoría en inteligencia artificial</li>
                            <li>Formación personalizada en IA para empresas</li>
                            <li>Desarrollo de agentes de inteligencia artificial</li>
                            <li>Diseño de páginas web y marketing digital impulsado por IA</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">3. Uso Aceptable</h4>
                        <p class="mb-4">Al utilizar nuestros servicios, usted se compromete a:</p>
                        <ul class="list-disc pl-6 mb-6">
                            <li>Proporcionar información precisa y actualizada</li>
                            <li>No utilizar el sitio web para actividades ilegales o no autorizadas</li>
                            <li>Respetar los derechos de propiedad intelectual</li>
                            <li>No interferir con el funcionamiento normal del sitio web</li>
                        </ul>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">4. Propiedad Intelectual</h4>
                        <p class="mb-6">
                            Todo el contenido de este sitio web, incluyendo pero no limitado a textos, gráficos, logos, iconos, 
                            imágenes, clips de audio, descargas digitales y software, es propiedad de CanarIAgentic y está 
                            protegido por las leyes de propiedad intelectual aplicables.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">5. Limitación de Responsabilidad</h4>
                        <p class="mb-6">
                            CanarIAgentic no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente 
                            que resulte del uso o la incapacidad de usar nuestros servicios, incluso si hemos sido notificados de 
                            la posibilidad de tales daños.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">6. Privacidad</h4>
                        <p class="mb-6">
                            Su privacidad es importante para nosotros. Consulte nuestra Política de Privacidad para obtener 
                            información sobre cómo recopilamos, utilizamos y protegemos su información.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">7. Modificaciones</h4>
                        <p class="mb-6">
                            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
                            entrarán en vigor inmediatamente después de su publicación en el sitio web.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">8. Ley Aplicable</h4>
                        <p class="mb-6">
                            Estos términos se rigen por las leyes de España. Cualquier disputa será resuelta por los tribunales 
                            competentes de Santa Cruz de Tenerife, España.
                        </p>
                        
                        <h4 class="text-xl font-semibold text-slate-800 mb-4">9. Contacto</h4>
                        <p class="mb-4">
                            Si tiene preguntas sobre estos Términos de Servicio, contáctenos:
                        </p>
                        <ul class="list-none mb-6">
                            <li><strong>Email:</strong> soporte@canariagentic.com</li>
                            <li><strong>Teléfono:</strong> +34 649 823 612</li>
                            <li><strong>Dirección:</strong> Santa Cruz de Tenerife, España</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
    </body>
    </html>
  `)
})

export default app