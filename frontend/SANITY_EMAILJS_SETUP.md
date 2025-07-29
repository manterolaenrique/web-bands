# Configuración de EmailJS desde Sanity

## Descripción

El sistema de envío de emails está configurado para funcionar directamente desde Sanity para cada banda. Esto permite que cada banda tenga su propia configuración de EmailJS sin necesidad de variables de entorno.

## Configuración en Sanity

### 1. Acceder a la configuración

1. Ve a tu **Sanity Studio**
2. Selecciona una **Banda**
3. Ve a la sección **"Información de Contacto"**
4. Busca la subsección **"Configuración de EmailJS"**

### 2. Habilitar el formulario

1. **Activa** la opción "Habilitar envío de emails"
2. Esto mostrará todos los campos de configuración necesarios

### 3. Configurar EmailJS

#### Paso 1: Crear cuenta en EmailJS
1. Ve a [EmailJS](https://www.emailjs.com/) y crea una cuenta gratuita
2. Verifica tu email

#### Paso 2: Configurar servicio de email
1. En EmailJS Dashboard, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor (Gmail, Outlook, etc.)
4. Conecta tu cuenta de email
5. Copia el **Service ID** generado

#### Paso 3: Crear template de email
1. Ve a **"Email Templates"** en EmailJS
2. Haz clic en **"Create New Template"**
3. Usa este template como base:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Nuevo mensaje de contacto</title>
</head>
<body>
    <h2>Nuevo mensaje de contacto - {{banda_nombre}}</h2>
    
    <p><strong>De:</strong> {{from_name}} ({{from_email}})</p>
    <p><strong>Asunto:</strong> {{subject}}</p>
    
    <h3>Mensaje:</h3>
    <p>{{message}}</p>
    
    <hr>
    <p><small>Este mensaje fue enviado desde el formulario de contacto de {{banda_nombre}}</small></p>
</body>
</html>
```

4. Copia el **Template ID** generado (solo el ID, no el contenido HTML)

#### Paso 4: Obtener Public Key
1. Ve a **"Account" → "API Keys"** en EmailJS
2. Copia tu **Public Key**

### 4. Completar configuración en Sanity

Ahora completa los campos en Sanity:

- **Service ID de EmailJS**: Pega el Service ID de EmailJS
- **Template ID de EmailJS**: Pega el Template ID de EmailJS (solo el ID)
- **Public Key de EmailJS**: Pega tu Public Key
- **Email de destino**: Email donde recibirás los mensajes (opcional, por defecto usa el email principal)
- **Mensaje de éxito personalizado**: Mensaje que se mostrará al enviar exitosamente
- **Mensaje de error personalizado**: Mensaje que se mostrará si hay errores

## Variables disponibles en el template

- `{{from_name}}` - Nombre del remitente
- `{{from_email}}` - Email del remitente
- `{{subject}}` - Asunto del mensaje
- `{{message}}` - Contenido del mensaje
- `{{banda_nombre}}` - Nombre de la banda
- `{{reply_to}}` - Email para responder (igual al from_email)

## Nota sobre el formato de las claves

**Public Key**: El formato puede variar según la versión de EmailJS. Algunas claves empiezan con `user_` y otras no. Lo importante es que tenga al menos 10 caracteres y sea la clave correcta de tu cuenta.

**Template ID**: Debe ser solo el ID del template (ej: `template_abc123`), no el contenido HTML completo.

## Ventajas de esta configuración

### ✅ Configuración por banda
- Cada banda puede tener su propia configuración de EmailJS
- No necesitas variables de entorno globales
- Configuración independiente y segura

### ✅ Gestión desde Sanity
- Todo se configura desde el CMS
- No necesitas tocar código
- Fácil de mantener y actualizar

### ✅ Flexibilidad
- Diferentes emails de destino por banda
- Mensajes personalizados de éxito/error
- Configuración opcional (se puede deshabilitar)

### ✅ Validación automática
- El sistema verifica que la configuración esté completa
- Muestra mensajes claros si falta algo
- Previene errores de configuración

## Estados del formulario

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

## Ejemplo de configuración completa

```json
{
  "habilitado": true,
  "service_id": "service_abc123",
  "template_id": "template_xyz789", 
  "public_key": "user_def456",
  "email_destino": "contacto@banda.com",
  "mensaje_exito": "¡Gracias por tu mensaje! Te responderemos en 24 horas.",
  "mensaje_error": "Hubo un problema al enviar tu mensaje. Intenta nuevamente."
}
```

## Solución de problemas

### El formulario no aparece
1. Verifica que "Habilitar envío de emails" esté activado
2. Confirma que todos los campos requeridos estén completos
3. Revisa los mensajes de error en la página

### Los emails no se envían
1. Verifica que los IDs de EmailJS sean correctos
2. Confirma que el email de destino esté configurado
3. Revisa la consola del navegador para errores específicos

### Configuración incompleta
1. Completa todos los campos marcados como faltantes
2. Guarda los cambios en Sanity
3. Recarga la página para ver los cambios

## Notas importantes

- **Plan gratuito**: 200 emails por mes en EmailJS
- **Seguridad**: Cada banda tiene su propia configuración
- **Backup**: El email principal de la banda se usa como respaldo
- **Personalización**: Mensajes de éxito/error personalizables
- **Validación**: Verificación automática de configuración completa 