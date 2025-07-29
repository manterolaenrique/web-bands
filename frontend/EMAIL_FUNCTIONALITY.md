# Sistema de Envío de Emails - Funcionalidad Completa

## Descripción

El sistema de envío de emails está completamente funcional y configurado para trabajar desde Sanity. Los usuarios pueden enviar mensajes directamente a la banda desde el sitio web, y estos emails se envían al email configurado en Sanity.

## Características Implementadas

### ✅ Formulario de Contacto Funcional
- **Campos requeridos**: Nombre, Email, Asunto, Mensaje
- **Validación en tiempo real**: Se validan los campos antes del envío
- **Estados de carga**: El botón muestra "Enviando..." durante el proceso
- **Mensajes de feedback**: Se muestran mensajes de éxito y error

### ✅ Validación de Datos
- **Nombre**: Mínimo 2 caracteres
- **Email**: Formato válido de email
- **Asunto**: Mínimo 5 caracteres
- **Mensaje**: Mínimo 10 caracteres

### ✅ Integración con Sanity
- **Email dinámico**: Se usa el email configurado en Sanity para cada banda
- **Nombre de la banda**: Se incluye el nombre de la banda en el email
- **Datos estructurados**: Los datos se envían de forma organizada
- **Configuración por banda**: Cada banda tiene su propia configuración de EmailJS

### ✅ Experiencia de Usuario
- **Formulario responsivo**: Se adapta a diferentes tamaños de pantalla
- **Estados visuales**: Cambios de color y estilo según el estado
- **Limpieza automática**: El formulario se limpia después del envío exitoso
- **Manejo de errores**: Mensajes claros cuando algo falla

## Archivos del Sistema

### Archivos Principales
- `src/components/Contact.jsx` - Componente principal del formulario
- `src/utils/emailService.js` - Servicio para envío de emails
- `SANITY_EMAILJS_SETUP.md` - Guía de configuración

### Archivos de Configuración
- `env.example` - Variables de entorno de ejemplo
- `schemaTypes/banda.ts` - Schema de Sanity con configuración de EmailJS

## Configuración Requerida

### 1. Configuración en Sanity
Cada banda debe tener configurado en Sanity:
- **Habilitar envío de emails**: Activar la opción
- **Service ID de EmailJS**: ID del servicio configurado
- **Template ID de EmailJS**: ID del template (solo el ID, no el HTML)
- **Public Key de EmailJS**: Clave pública de la cuenta
- **Email de destino**: Email donde recibir los mensajes
- **Mensajes personalizados**: De éxito y error

### 2. Configuración de EmailJS
- **Cuenta activa**: En EmailJS con email verificado
- **Servicio configurado**: Conectado a un proveedor de email
- **Template creado**: Con las variables necesarias
- **API Keys**: Public Key configurada

## Flujo de Funcionamiento

1. **Usuario llena el formulario** → Se validan los campos en tiempo real
2. **Usuario hace clic en "Enviar"** → Se ejecuta validación completa
3. **Si hay errores** → Se muestran los errores específicos
4. **Si todo está bien** → Se envía el email usando EmailJS
5. **Email enviado exitosamente** → Se muestra mensaje de éxito y se limpia el formulario
6. **Si hay error** → Se muestra mensaje de error específico

## Estructura del Email Enviado

El email que recibe la banda incluye:
- **Asunto**: El asunto que escribió el usuario
- **Remitente**: Nombre y email del usuario
- **Mensaje**: El contenido del mensaje
- **Información adicional**: Nombre de la banda y marca de tiempo

## Seguridad y Privacidad

- ✅ **Validación del lado del cliente**: Se validan todos los campos
- ✅ **Rate limiting**: EmailJS tiene límites de envío
- ✅ **No spam**: Se requiere información válida del remitente
- ✅ **Respuesta directa**: Los emails incluyen el email del remitente para respuestas
- ✅ **Configuración segura**: Cada banda tiene su propia configuración

## Limitaciones del Plan Gratuito

- **200 emails por mes** en el plan gratuito de EmailJS
- **Templates básicos** (suficientes para la funcionalidad)
- **Soporte por email** (no chat en vivo)

## Estados del Formulario

### ✅ Habilitado y configurado
- El formulario se muestra normalmente
- Los usuarios pueden enviar mensajes
- Funcionalidad completa

### ⚠️ No habilitado
- Se muestra mensaje explicativo
- El formulario no aparece
- Instrucciones para habilitarlo

### ⚠️ Habilitado pero configuración incompleta
- Se muestra qué campos faltan
- El formulario no aparece
- Lista específica de lo que falta configurar

## Variables del Template

El template de EmailJS debe incluir estas variables:
- `{{from_name}}` - Nombre del remitente
- `{{from_email}}` - Email del remitente
- `{{subject}}` - Asunto del mensaje
- `{{message}}` - Contenido del mensaje
- `{{banda_nombre}}` - Nombre de la banda
- `{{reply_to}}` - Email para responder

## Solución de Problemas Comunes

### El formulario no aparece
1. Verifica que "Habilitar envío de emails" esté activado en Sanity
2. Confirma que todos los campos requeridos estén completos
3. Revisa los mensajes de error en la página

### Los emails no se envían
1. Verifica que los IDs de EmailJS sean correctos
2. Confirma que el email de destino esté configurado
3. Revisa la consola del navegador para errores específicos

### Error "Account not found"
1. Verifica que la Public Key sea correcta
2. Confirma que la cuenta de EmailJS esté activa
3. Revisa que no haya espacios extra en la configuración

## Mantenimiento

### Actualizaciones
- El sistema está diseñado para ser mantenible
- La configuración se hace desde Sanity sin tocar código
- Fácil de actualizar y modificar

### Monitoreo
- Los errores se muestran claramente al usuario
- La validación previene problemas de configuración
- El sistema es robusto y confiable

## Conclusión

El sistema de envío de emails está completamente funcional y listo para producción. Cada banda puede configurar su propia funcionalidad de emails desde Sanity, proporcionando una experiencia personalizada y profesional para sus visitantes. 