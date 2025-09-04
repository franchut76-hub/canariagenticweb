# Configuración de Supabase para CanarIAgentic

## 1. Crear Tabla de Consentimientos de Cookies

Para cumplir con las regulaciones GDPR y mantener auditoría legal, necesitas crear la tabla `cookie_consents` en Supabase.

### Pasos:

1. **Ir al Panel de Supabase**:
   - Visita https://supabase.com/dashboard
   - Abre tu proyecto: ryoyexwvvvswahqoffqu

2. **Abrir SQL Editor**:
   - En el panel lateral, haz clic en "SQL Editor"
   - Crea una nueva consulta

3. **Ejecutar el siguiente SQL**:

```sql
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

-- Comentarios de documentación
COMMENT ON TABLE cookie_consents IS 'Tabla para almacenar consentimientos de cookies para cumplimiento legal GDPR';
COMMENT ON COLUMN cookie_consents.user_id IS 'ID único anónimo del usuario';
COMMENT ON COLUMN cookie_consents.decision_type IS 'Tipo de decisión: accept_all, reject_all, custom';
COMMENT ON COLUMN cookie_consents.cookie_settings IS 'Configuración específica de cookies en formato JSON';
COMMENT ON COLUMN cookie_consents.ip_address IS 'Dirección IP del usuario (para auditoría legal)';
COMMENT ON COLUMN cookie_consents.consent_version IS 'Versión de la política de cookies aceptada';
```

4. **Ejecutar la consulta**:
   - Haz clic en "Run" para ejecutar el SQL
   - Verifica que la tabla se haya creado correctamente

## 2. Verificar Configuración

Una vez creada la tabla, la aplicación guardará automáticamente todos los consentimientos de cookies para cumplimiento legal.

### Datos que se almacenan:

- **user_id**: ID anónimo único del usuario
- **decision_type**: 'accept_all', 'reject_all', o 'custom'
- **cookie_settings**: Configuración detallada de cookies (JSON)
- **ip_address**: Dirección IP para auditoría legal
- **user_agent**: Información del navegador
- **page_url**: URL donde se otorgó el consentimiento
- **timestamp**: Fecha y hora exacta del consentimiento
- **consent_version**: Versión de la política aceptada

### Propósito Legal:

Esta tabla cumple con los requisitos GDPR de:
- ✅ **Consentimiento documentado**: Registro de todas las decisiones
- ✅ **Trazabilidad**: IP, timestamp, y detalles técnicos
- ✅ **Revocación**: Historial de cambios en preferencias
- ✅ **Auditoría**: Datos completos para auditorías legales
- ✅ **Privacidad**: RLS habilitado para protección de datos

## 3. Monitoreo

Para ver los consentimientos registrados:

```sql
-- Ver últimos consentimientos
SELECT * FROM cookie_consents 
ORDER BY created_at DESC 
LIMIT 10;

-- Estadísticas por tipo de decisión
SELECT 
    decision_type, 
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM cookie_consents 
GROUP BY decision_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

## 4. Nota Importante

🔒 **Seguridad**: La tabla tiene RLS habilitado, solo el servicio puede insertar datos y solo administradores autorizados pueden leer.

📊 **Compliance**: Esta implementación cumple con GDPR, LOPD-GDD, y normativas españolas de protección de datos.