# OSM Free Coins Monitor

Aplicacion Next.js desplegable en Vercel que ejecuta un cron cada hora para:

1. Obtener token de OSM.
2. Consultar disponibilidad de videos con `videos/start`.
3. Intentar recompensas con `videos/watched` variando `capVariation` y `rewardVariation`.
4. Consumir cada reward con `bosscoinwallet/consumereward`.
5. Persistir y mostrar historial de ejecuciones en la home.

## Arquitectura

- `src/lib/services/osm-auth.ts`: obtencion de token.
- `src/lib/services/osm-video.ts`: llamadas `start` y `watched`.
- `src/lib/services/osm-reward.ts`: consumo de reward.
- `src/lib/services/osm-orchestrator.ts`: flujo completo con control de errores.
- `src/lib/repositories/run-logger.ts`: persistencia de ejecuciones (Vercel KV o fallback en memoria local).
- `src/app/api/cron/osm-hourly/route.ts`: endpoint del cron protegido por secreto.
- `src/app/api/health/route.ts`: healthcheck de entorno/configuracion.
- `src/app/page.tsx`: dashboard con metricas e historial.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores reales.

Variables obligatorias:

- `OSM_USERNAME`
- `OSM_PASSWORD`
- `OSM_CLIENT_ID`
- `OSM_CLIENT_SECRET`
- `OSM_APP_VERSION`
- `OSM_PLATFORM_ID_TOKEN`
- `OSM_PLATFORM_ID_VIDEO`
- `OSM_ORIGIN`
- `OSM_REFERER`
- `OSM_ACCEPT_LANGUAGE`
- `OSM_USER_AGENT`
- `CRON_SECRET`

Persistencia en Vercel KV:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Opcionales de control:

- `OSM_REWARD_VARIATION_MAX` (default `1`)
- `OSM_CAP_VARIATION_MAX` (default `60`)
- `OSM_REQUEST_TIMEOUT_MS` (default `15000`)
- `OSM_REQUEST_RETRIES` (default `2`)

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Disparo externo

El endpoint `/api/cron/osm-hourly` esta listo para ser invocado desde otro servidor.

`vercel.json` no incluye cron interno.

Proteccion del endpoint:

- `Authorization: Bearer <CRON_SECRET>`
- o header `x-cron-secret`
- o query `?secret=`

## Pruebas manuales

Ejecutar una corrida manual:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/osm-hourly
```

Healthcheck:

```bash
curl http://localhost:3000/api/health
```

## Seguridad

- No guardar secretos ni tokens en repositorio.
- Rotar credenciales expuestas previamente.
- Revisar terminos y autorizacion de uso de endpoints de OSM.
