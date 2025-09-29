# Deploy rápido en EC2 (Ubuntu) usando tu propia DB en AWS RDS (PostgreSQL)

> Este instructivo asume que **ya tenés creada** tu instancia EC2 (Ubuntu) y tu instancia **RDS PostgreSQL**. Solo muestra **los comandos** para configurar la EC2, apuntar a tu RDS y correr la app.

---

## 1) Preparar EC2 e instalar dependencias
```bash
# En tu EC2 (SSH)
sudo apt update
sudo apt install -y nodejs npm git postgresql-client
```

## 2) Clonar repo y configurar variables

```bash
git clone https://github.com/GianImpedovo/is_inventoryapp.git
cd is_inventoryapp

# Crear .env con tu URL de RDS
cp .env.example .env
nano .env
```
# Contenido del .env

DATABASE_URL=postgres://<postgres_user>:<tu_password>@<tu-endpoint-rds>.us-east-1.rds.amazonaws.com:5432/inventory
PGSSL=true
PORT=80

```bash
npm install
```

## 3) Probar conexion y crear DB con RDS
```bash
# Probar conexión a RDS
psql "host=<RDS_ENDPOINT> user=<USER> dbname=postgres password=<PASS> sslmode=require" -c "SELECT version();"

# Crear la DB (si aún no existe)
psql "host=<RDS_ENDPOINT> user=<USER> dbname=postgres password=<PASS> sslmode=require" -c "CREATE DATABASE <DBNAME>;"
```

## 4) Permitir que Node escuche puerto 80
```bash
sudo apt install -y libcap2-bin
NODE_BIN="$(readlink -f "$(which node)")"
sudo setcap 'cap_net_bind_service=+ep' "$NODE_BIN"
getcap "$NODE_BIN"   # debe mostrar: cap_net_bind_service=+ep
```

## 5) Habilitar puerto 80 en EC2
En el Security Group de tu instancia EC2, agregá una Inbound rule:
- Type: Custom TCP
- Port: 80
- Source: tu IP (o 0.0.0.0/0 solo para pruebas)

## 6) Iniciar la APP:
```bash
npm run start
```
