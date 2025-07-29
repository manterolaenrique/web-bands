# Configuración de EmailJS para Envío de Emails

Este proyecto utiliza EmailJS para enviar emails desde el formulario de contacto sin necesidad de un backend. Sigue estos pasos para configurarlo:

## 1. Crear cuenta en EmailJS

1. Ve a [EmailJS](https://www.emailjs.com/) y crea una cuenta gratuita
2. Verifica tu email

## 2. Configurar un servicio de email

1. En el dashboard de EmailJS, ve a "Email Services"
2. Haz clic en "Add New Service"
3. Selecciona tu proveedor de email (Gmail, Outlook, etc.)
4. Conecta tu cuenta de email
5. Anota el **Service ID** que se genera

## 3. Crear un template de email

1. Ve a "Email Templates"
2. Haz clic en "Create New Template"
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

4. Anota el **Template ID** que se genera

## 4. Obtener la Public Key

1. Ve a "Account" → "API Keys"
2. Copia tu **Public Key**

## 5. Configurar variables de entorno

Crea o modifica el archivo `.env` en la carpeta `frontend/`:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=tu_service_id_aqui
VITE_EMAILJS_TEMPLATE_ID=tu_template_id_aqui
VITE_EMAILJS_PUBLIC_KEY=tu_public_key_aqui
```

## 6. Verificar configuración

1. Asegúrate de que el email de la banda esté configurado en Sanity
2. Reinicia el servidor de desarrollo
3. Prueba el formulario de contacto

## Variables disponibles en el template

- `{{from_name}}` - Nombre del remitente
- `{{from_email}}` - Email del remitente
- `{{subject}}` - Asunto del mensaje
- `{{message}}` - Contenido del mensaje
- `{{banda_nombre}}` - Nombre de la banda
- `{{reply_to}}` - Email para responder (igual al from_email)

## Notas importantes

- El plan gratuito de EmailJS permite 200 emails por mes
- Los emails se envían desde tu cuenta de email configurada
- Las respuestas irán directamente al email del remitente
- El formulario incluye validación de campos
- Se muestran mensajes de éxito y error al usuario

## Solución de problemas

### Error: "Configuración de EmailJS incompleta"
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que los archivos `.env` estén en la carpeta correcta

### Error: "Email de la banda no configurado"
- Verifica que el campo `email` esté configurado en Sanity para la banda

### Los emails no se envían
- Verifica que el Service ID y Template ID sean correctos
- Revisa la consola del navegador para errores específicos
- Verifica que tu cuenta de EmailJS esté activa 