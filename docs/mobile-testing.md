# Mobile Testing

## Objetivo
Tener una forma simple y repetible para probar mobile real desde celular y corregir rapido.

## Como levantarlo
Desde `apps/web`:

```bash
npm run dev:mobile
```

Ese comando deja Next escuchando en toda la red local por `http://0.0.0.0:3000`.

## Como abrirlo en el celular
1. Conecta el celular y la PC a la misma Wi-Fi.
2. Busca la IP local de la PC.
3. Abre en el celular `http://IP_DE_TU_PC:3000`.

Ejemplo:

```text
http://10.199.106.8:3000
```

## Recomendacion importante
Si antes instalaste la PWA en el celular:

1. Cierra la app instalada.
2. Borra la instalacion anterior o limpia datos/cache del navegador.
3. Vuelve a abrir la URL desde el navegador.

En desarrollo no usamos `service worker`, asi evitamos falsos estados offline.

## Como pasarme un bug mobile
Cuando veas un error, mandame:

- ruta exacta, por ejemplo `/dashboard/bands/123`
- que esperabas y que paso
- captura o video
- modelo de celular
- navegador usado

Con eso yo lo reproduzco en viewport mobile y ajusto el UI o el flujo.

## Flujo recomendado
1. Vos probas en celular real.
2. Me pasas captura + ruta.
3. Yo reproduzco con Playwright mobile y corrijo.
4. Volves a abrir la misma URL en el celu y validamos.
