# Colección Postman de Run Out

## Importación

Importa estos dos archivos en Postman:

1. `Runout-Simplified.postman_collection.json`
2. `Local.postman_environment.json`

Selecciona el entorno **Run Out - Local** y ejecuta las carpetas en orden, o usa
**Run collection** para ejecutar las peticiones consecutivamente.

## Antes de comenzar

Arranca PostgreSQL y Keycloak:

```bash
docker compose up -d
```

Después arranca la API:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

La colección espera:

- API: `http://localhost:8080`
- Keycloak: `http://localhost:8081`
- Administrador local de Keycloak: `admin` / `admin`
- Proveedor de pagos: `mock`

## Flujo automatizado

La colección realiza lo siguiente:

1. Comprueba la salud del backend.
2. Genera un email único y registra un usuario.
3. Inicia sesión y guarda `accessToken`, `refreshToken` y `userId`.
4. Obtiene un token administrativo de Keycloak local.
5. Localiza el usuario y le asigna el rol `SUPER_ADMIN`.
6. Vuelve a iniciar sesión y sincroniza `SUPER_ADMIN` en el perfil de Run Out.
7. Crea y activa un restaurante y añade un plato.
8. Crea y paga una reserva.
9. Ejecuta el ciclo administrativo: asignar, iniciar, confirmar y entregar.
10. Revela al usuario el restaurante y su menú.

Los scripts pre-request calculan fechas futuras y claves de idempotencia. Los
scripts post-response validan las respuestas y guardan automáticamente los IDs.

La carpeta **Preparar administrador local** es exclusivamente para desarrollo.
En producción, la asignación del rol `SUPER_ADMIN` no debe estar disponible mediante
credenciales predeterminadas ni formar parte de un flujo de usuario.
