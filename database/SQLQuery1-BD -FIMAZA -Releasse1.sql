-- ==========================================================
-- SCRIPT: Modelo F�sico de la Base de Datos (Actualizado)
-- PROYECTO: Transformaci�n Digital Del Negocio Fimaza
-- MOTOR: Microsoft SQL Server (T-SQL)
-- ==========================================================

CREATE DATABASE DB_FIMAZA;
GO

USE DB_FIMAZA;
GO

-- ==========================================================
-- 1. TABLAS MAESTRAS (Dimensiones independientes)
-- ==========================================================

CREATE TABLE cargo (
    id_cargo INT IDENTITY(1,1),
    nombre_cargo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_cargo PRIMARY KEY (id_cargo)
);

CREATE TABLE marca (
    id_marca INT IDENTITY(1,1),
    nombre_marca VARCHAR(100) NOT NULL,
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_marca PRIMARY KEY (id_marca)
);

CREATE TABLE categoria (
    id_categoria INT IDENTITY(1,1),
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_categoria PRIMARY KEY (id_categoria)
);

-- NUEVA TABLA: G�nero para catalogaci�n de productos
CREATE TABLE genero (
    id_genero INT IDENTITY(1,1),
    nombre_genero VARCHAR(50) NOT NULL, -- 'Hombre', 'Mujer', 'Unisex', 'Ni�o', 'Ni�a'
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_genero PRIMARY KEY (id_genero)
);

CREATE TABLE talla (
    id_talla INT IDENTITY(1,1),
    numero_talla VARCHAR(10) NOT NULL,
    CONSTRAINT PK_talla PRIMARY KEY (id_talla)
);

CREATE TABLE color (
    id_color INT IDENTITY(1,1),
    nombre_color VARCHAR(50) NOT NULL,
    CONSTRAINT PK_color PRIMARY KEY (id_color)
);

CREATE TABLE tipo_movimiento (
    id_tipo_movimiento INT IDENTITY(1,1),
    nombre_movimiento VARCHAR(50) NOT NULL,
    naturaleza VARCHAR(20) NOT NULL, -- 'Entrada' o 'Salida'
    CONSTRAINT PK_tipo_movimiento PRIMARY KEY (id_tipo_movimiento),
    CONSTRAINT CHK_naturaleza CHECK (naturaleza IN ('Entrada', 'Salida'))
);

CREATE TABLE proveedor (
    id_proveedor INT IDENTITY(1,1),
    ruc VARCHAR(15) NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NULL,
    direccion VARCHAR(255) NULL,
    email VARCHAR(100) NULL,
    CONSTRAINT PK_proveedor PRIMARY KEY (id_proveedor),
    CONSTRAINT UQ_proveedor_ruc UNIQUE (ruc)
);

CREATE TABLE cliente (
    id_cliente INT IDENTITY(1,1),
    tipo_documento VARCHAR(10) NOT NULL, -- DNI, RUC, CE
    numero_documento VARCHAR(20) NOT NULL,
    nombres_razon_social VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NULL,
    CONSTRAINT PK_cliente PRIMARY KEY (id_cliente),
    CONSTRAINT UQ_cliente_documento UNIQUE (tipo_documento, numero_documento)
);

CREATE TABLE promocion (
    id_promocion INT IDENTITY(1,1),
    nombre_promocion VARCHAR(100) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_promocion PRIMARY KEY (id_promocion),
    CONSTRAINT CHK_porcentaje CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100),
    CONSTRAINT CHK_fechas_promocion CHECK (fecha_fin >= fecha_inicio)
);

-- ==========================================================
-- 2. M�DULO DE PERSONAL Y SEGURIDAD
-- ==========================================================

CREATE TABLE empleado (
    id_empleado INT IDENTITY(1,1),
    id_cargo INT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento_identidad VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_empleado PRIMARY KEY (id_empleado),
    CONSTRAINT UQ_empleado_dni UNIQUE (documento_identidad),
    CONSTRAINT FK_empleado_cargo FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
);

CREATE TABLE auditoria_sesion (
    id_sesion INT IDENTITY(1,1),
    id_empleado INT NOT NULL,
    fecha_ingreso DATETIME DEFAULT GETDATE() NOT NULL,
    fecha_salida DATETIME NULL,
    direccion_ip VARCHAR(50) NULL,
    CONSTRAINT PK_auditoria_sesion PRIMARY KEY (id_sesion),
    CONSTRAINT FK_auditoria_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

-- NUEVA TABLA: Log de actividades del sistema (acciones realizadas)
CREATE TABLE actividad_log (
    id_actividad INT IDENTITY(1,1),
    id_empleado INT NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,  -- LOGIN, LOGOUT, STOCK_UPDATE, SALE_COMPLETED, PRODUCT_CREATED, etc.
    detalle VARCHAR(500) NOT NULL,
    fecha DATETIME DEFAULT GETDATE() NOT NULL,
    CONSTRAINT PK_actividad_log PRIMARY KEY (id_actividad),
    CONSTRAINT FK_actividad_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

-- ==========================================================
-- 3. M�DULO DE CAT�LOGO DE CALZADO
-- ==========================================================

CREATE TABLE producto (
    id_producto INT IDENTITY(1,1),
    id_marca INT NOT NULL,
    id_categoria INT NOT NULL,
    id_genero INT NOT NULL, -- Relaci�n agregada aqu�
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    estado BIT DEFAULT 1 NOT NULL,
    CONSTRAINT PK_producto PRIMARY KEY (id_producto),
    CONSTRAINT FK_producto_marca FOREIGN KEY (id_marca) REFERENCES marca(id_marca),
    CONSTRAINT FK_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    CONSTRAINT FK_producto_genero FOREIGN KEY (id_genero) REFERENCES genero(id_genero) -- FK al nuevo cat�logo
);

CREATE TABLE producto_variante (
    id_variante INT IDENTITY(1,1),
    id_producto INT NOT NULL,
    id_talla INT NOT NULL,
    id_color INT NOT NULL,
    codigo_barras VARCHAR(50) NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    CONSTRAINT PK_producto_variante PRIMARY KEY (id_variante),
    CONSTRAINT UQ_variante_codigo UNIQUE (codigo_barras),
    CONSTRAINT FK_variante_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    CONSTRAINT FK_variante_talla FOREIGN KEY (id_talla) REFERENCES talla(id_talla),
    CONSTRAINT FK_variante_color FOREIGN KEY (id_color) REFERENCES color(id_color),
    CONSTRAINT CHK_precios CHECK (precio_venta >= precio_compra)
);

-- ==========================================================
-- 4. M�DULO DE GESTI�N DE INVENTARIO
-- ==========================================================

CREATE TABLE inventario (
    id_inventario INT IDENTITY(1,1),
    id_variante INT NOT NULL,
    stock_actual INT DEFAULT 0 NOT NULL,
    stock_minimo INT DEFAULT 5 NOT NULL,
    CONSTRAINT PK_inventario PRIMARY KEY (id_inventario),
    CONSTRAINT UQ_inventario_variante UNIQUE (id_variante),
    CONSTRAINT FK_inventario_variante FOREIGN KEY (id_variante) REFERENCES producto_variante(id_variante),
    CONSTRAINT CHK_stock_actual CHECK (stock_actual >= 0)
);

CREATE TABLE historial_movimiento (
    id_movimiento INT IDENTITY(1,1),
    id_inventario INT NOT NULL,
    id_tipo_movimiento INT NOT NULL,
    id_empleado INT NOT NULL,
    cantidad INT NOT NULL,
    fecha_movimiento DATETIME DEFAULT GETDATE() NOT NULL,
    observaciones VARCHAR(255) NULL,
    CONSTRAINT PK_historial_movimiento PRIMARY KEY (id_movimiento),
    CONSTRAINT FK_movimiento_inventario FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario),
    CONSTRAINT FK_movimiento_tipo FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento),
    CONSTRAINT FK_movimiento_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT CHK_cantidad_mov CHECK (cantidad > 0)
);

CREATE TABLE alerta_stock (
    id_alerta INT IDENTITY(1,1),
    id_inventario INT NOT NULL,
    fecha_generacion DATETIME DEFAULT GETDATE() NOT NULL,
    estado_alerta VARCHAR(20) DEFAULT 'Pendiente' NOT NULL,
    CONSTRAINT PK_alerta_stock PRIMARY KEY (id_alerta),
    CONSTRAINT FK_alerta_inventario FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario),
    CONSTRAINT CHK_estado_alerta CHECK (estado_alerta IN ('Pendiente', 'Resuelta'))
);

-- ==========================================================
-- 5. M�DULO DE COMPRAS (ABASTECIMIENTO)
-- ==========================================================

CREATE TABLE compra_cabecera (
    id_compra INT IDENTITY(1,1),
    id_proveedor INT NOT NULL,
    id_empleado INT NOT NULL,
    numero_factura VARCHAR(50) NOT NULL,
    fecha_compra DATETIME DEFAULT GETDATE() NOT NULL,
    total_compra DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Completada' NOT NULL,
    CONSTRAINT PK_compra_cabecera PRIMARY KEY (id_compra),
    CONSTRAINT FK_compra_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT FK_compra_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE TABLE compra_detalle (
    id_detalle_compra INT IDENTITY(1,1),
    id_compra INT NOT NULL,
    id_variante INT NOT NULL,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT PK_compra_detalle PRIMARY KEY (id_detalle_compra),
    CONSTRAINT FK_detcompra_cabecera FOREIGN KEY (id_compra) REFERENCES compra_cabecera(id_compra),
    CONSTRAINT FK_detcompra_variante FOREIGN KEY (id_variante) REFERENCES producto_variante(id_variante),
    CONSTRAINT CHK_cant_compra CHECK (cantidad > 0)
);

-- ==========================================================
-- 6. M�DULO DE VENTAS Y FACTURACI�N
-- ==========================================================

CREATE TABLE venta_cabecera (
    id_venta INT IDENTITY(1,1),
    id_cliente INT NULL,
    id_empleado_vendedor INT NOT NULL,
    fecha_venta DATETIME DEFAULT GETDATE() NOT NULL,
    total_venta DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Completada' NOT NULL,
    CONSTRAINT PK_venta_cabecera PRIMARY KEY (id_venta),
    CONSTRAINT FK_venta_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    CONSTRAINT FK_venta_empleado FOREIGN KEY (id_empleado_vendedor) REFERENCES empleado(id_empleado),
    CONSTRAINT CHK_estado_venta CHECK (estado IN ('Completada', 'Anulada'))
);

CREATE TABLE venta_detalle (
    id_detalle_venta INT IDENTITY(1,1),
    id_venta INT NOT NULL,
    id_variante INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_aplicado DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT PK_venta_detalle PRIMARY KEY (id_detalle_venta),
    CONSTRAINT FK_detventa_cabecera FOREIGN KEY (id_venta) REFERENCES venta_cabecera(id_venta),
    CONSTRAINT FK_detventa_variante FOREIGN KEY (id_variante) REFERENCES producto_variante(id_variante),
    CONSTRAINT CHK_cant_venta CHECK (cantidad > 0)
);

CREATE TABLE comprobante (
    id_comprobante INT IDENTITY(1,1),
    id_venta INT NOT NULL,
    tipo_comprobante VARCHAR(20) NOT NULL, -- Boleta, Factura
    serie VARCHAR(10) NOT NULL,
    numero_correlativo VARCHAR(20) NOT NULL,
    fecha_emision DATETIME DEFAULT GETDATE() NOT NULL,
    CONSTRAINT PK_comprobante PRIMARY KEY (id_comprobante),
    CONSTRAINT UQ_comprobante_correlativo UNIQUE (tipo_comprobante, serie, numero_correlativo),
    CONSTRAINT FK_comprobante_venta FOREIGN KEY (id_venta) REFERENCES venta_cabecera(id_venta),
    CONSTRAINT CHK_tipo_comp CHECK (tipo_comprobante IN ('Boleta', 'Factura'))
);

CREATE TABLE promocion_aplicada (
    id_promocion_aplicada INT IDENTITY(1,1),
    id_venta INT NOT NULL,
    id_promocion INT NOT NULL,
    monto_descontado DECIMAL(10,2) NOT NULL,
    CONSTRAINT PK_promocion_aplicada PRIMARY KEY (id_promocion_aplicada),
    CONSTRAINT FK_promo_venta FOREIGN KEY (id_venta) REFERENCES venta_cabecera(id_venta),
    CONSTRAINT FK_promo_maestro FOREIGN KEY (id_promocion) REFERENCES promocion(id_promocion)
);
GO

-- ==========================================================
-- 7. OPTIMIZACI�N EN EL MODELO F�SICO (�ndices No Agrupados)
-- ==========================================================

CREATE NONCLUSTERED INDEX IX_producto_variante_codigo ON producto_variante(codigo_barras);
CREATE NONCLUSTERED INDEX IX_venta_cabecera_fecha ON venta_cabecera(fecha_venta);
CREATE NONCLUSTERED INDEX IX_compra_cabecera_fecha ON compra_cabecera(fecha_compra);
CREATE NONCLUSTERED INDEX IX_historial_movimiento_fecha ON historial_movimiento(fecha_movimiento);
CREATE NONCLUSTERED INDEX IX_actividad_log_fecha ON actividad_log(fecha);
CREATE NONCLUSTERED INDEX IX_actividad_log_empleado ON actividad_log(id_empleado);
GO