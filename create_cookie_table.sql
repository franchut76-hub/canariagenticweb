-- Crear tabla para consentimientos de cookies (cumplimiento legal GDPR)
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

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_timestamp ON cookie_consents(timestamp);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_decision_type ON cookie_consents(decision_type);

-- Habilitar RLS (Row Level Security) para privacidad
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT desde el servicio
CREATE POLICY "Allow insert cookie consents" ON cookie_consents
  FOR INSERT WITH CHECK (true);

-- Política para permitir SELECT solo para administradores (opcional)
CREATE POLICY "Allow admin read cookie consents" ON cookie_consents
  FOR SELECT USING (false); -- Solo administradores podrán leer

-- Comentarios de documentación
COMMENT ON TABLE cookie_consents IS 'Tabla para almacenar consentimientos de cookies para cumplimiento legal GDPR';
COMMENT ON COLUMN cookie_consents.user_id IS 'ID único anónimo del usuario';
COMMENT ON COLUMN cookie_consents.decision_type IS 'Tipo de decisión: accept_all, reject_all, custom';
COMMENT ON COLUMN cookie_consents.cookie_settings IS 'Configuración específica de cookies en formato JSON';
COMMENT ON COLUMN cookie_consents.ip_address IS 'Dirección IP del usuario (para auditoría legal)';
COMMENT ON COLUMN cookie_consents.consent_version IS 'Versión de la política de cookies aceptada';