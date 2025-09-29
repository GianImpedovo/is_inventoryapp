
# Inventory (PostgreSQL)

Esta es una versión lista para usar con **PostgreSQL** (compatible con AWS RDS) de la app de inventario.

## 1) Variables de entorno
Crea un archivo `.env` basado en `.env.example`:

```env
DATABASE_URL=postgres://<USER>:<PASS>@<HOST>:5432/<DBNAME>
PGSSL=true
PORT=3000
```

> Para desarrollo local, puedes usar Postgres local y `PGSSL=false`.

## 2) Instalar y correr
```bash
npm install
npm run start
# abre http://localhost:3000
```

La app auto-crea la tabla `products` al iniciar.

## 3) Crear DB en AWS RDS (PostgreSQL)
1. Entra a RDS > Create database > **Standard create**.
2. Engine: **PostgreSQL** (versión 15+).
3. Templates: **Free tier** si aplica.
4. Credenciales: usuario y password.
5. Conectividad: **Public access = Yes** (para pruebas) y agrega tu IP en el **Security Group** (puerto 5432).
6. Crea la instancia y espera a que quede en `Available`.
7. Crea la base `<DBNAME>` (si el endpoint viene con `postgres` por defecto):
   ```bash
   psql "host=<ENDPOINT> user=<USER> dbname=postgres password=<PASS> sslmode=require" -c 'CREATE DATABASE <DBNAME>;'
   ```
8. Ajusta `DATABASE_URL` con tu endpoint y DB.

## 4) Deploy en EC2 (Ubuntu)
```bash
# En tu EC2
sudo apt update && sudo apt install -y nodejs npm postgresql-client
git clone <TU_REPO_FORK> inventory-pg
cd inventory-pg
cp .env.example .env  # edita con tu URL real a RDS
npm install
NODE_ENV=production npm start
# o instala pm2 para que quede en background:
sudo npm i -g pm2
pm2 start server.js --name inventory
pm2 save
pm2 startup
```

Asegúrate de abrir el puerto 3000 en el Security Group de la EC2 o usa Nginx como reverse proxy.

## 5) Endpoints
- `GET /api/health`
- `GET /api/products`
- `POST /api/products` `{ name, category, quantity, price, description }`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## 6) Migración desde SQLite
Si tuvieras datos en SQLite, puedes exportarlos a CSV y reinsertarlos en Postgres:
```sql
-- en sqlite3
.headers on
.mode csv
.once products.csv
SELECT * FROM products;

-- en psql
\copy products(name,category,quantity,price,description,created_at,updated_at) FROM 'products.csv' CSV HEADER;
```
