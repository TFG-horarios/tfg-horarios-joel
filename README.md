# SkEdu

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TFG-horarios_tfg-horarios-joel&metric=alert_status&token=69c813461bdbea4b4ba957afa1ed3cd686a5c0a5)](https://sonarcloud.io/summary/new_code?id=TFG-horarios_tfg-horarios-joel)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=TFG-horarios_tfg-horarios-joel&metric=coverage&token=69c813461bdbea4b4ba957afa1ed3cd686a5c0a5)](https://sonarcloud.io/summary/new_code?id=TFG-horarios_tfg-horarios-joel)

## Acceder a la aplicación desplegada

Para acceder a la aplicación desplegada, se debe acceder desde la red privada de la Universidad de La Laguna. La URL de acceso es: [http://10.6.128.22/](http://10.6.128.22/)

La documentación de la API en Scalar se encuentra en la siguiente URL: [http://10.6.128.22/reference](http://10.6.128.22/reference)

## Datos de prueba
En el directorio `data` se encuentran los CSV de las entidades académicas del Grado de Ingeniería Informática de La Universidad de La Laguna. Estos datos no son los datos reales de la Universidad, sino que son datos de prueba para poder probar la aplicación.

## Desarrollo

```bash
bun install
```

To run:

```bash
bun run db:up
```

```bash
bun run dev
```