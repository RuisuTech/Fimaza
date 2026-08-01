import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Marca, Categoria, Genero, Talla, Color, TipoMovimiento, Cargo } from '@/types';

interface CatalogsContextType {
  marcas: Marca[];
  categorias: Categoria[];
  generos: Genero[];
  tallas: Talla[];
  colores: Color[];
  tiposMovimiento: TipoMovimiento[];
  cargos: Cargo[];
  isLoading: boolean;
  addMarca: (data: Omit<Marca, 'id'>) => void;
  addCategoria: (data: Omit<Categoria, 'id'>) => void;
  addGenero: (data: Omit<Genero, 'id'>) => void;
  addTalla: (data: Omit<Talla, 'id'>) => void;
  addColor: (data: Omit<Color, 'id'>) => void;
}

const INITIAL_MARCAS: Marca[] = [
  { id: 1, nombre_marca: 'Nike', estado: true },
  { id: 2, nombre_marca: 'Adidas', estado: true },
  { id: 3, nombre_marca: 'New Balance', estado: true },
  { id: 4, nombre_marca: 'Puma', estado: true },
  { id: 5, nombre_marca: 'Reebok', estado: true },
  { id: 6, nombre_marca: 'Converse', estado: true },
  { id: 7, nombre_marca: 'Vans', estado: true },
  { id: 8, nombre_marca: 'Under Armour', estado: true },
];

const INITIAL_CATEGORIAS: Categoria[] = [
  { id: 1, nombre_categoria: 'Running', descripcion: 'Zapatillas para correr' },
  { id: 2, nombre_categoria: 'Casual', descripcion: 'Uso diario' },
  { id: 3, nombre_categoria: 'Basketball', descripcion: 'Baloncesto' },
  { id: 4, nombre_categoria: 'Football', descripcion: 'Futbol' },
  { id: 5, nombre_categoria: 'Training', descripcion: 'Entrenamiento' },
  { id: 6, nombre_categoria: 'Skate', descripcion: 'Skateboarding' },
];

const INITIAL_GENEROS: Genero[] = [
  { id: 1, nombre_genero: 'Hombre', estado: true },
  { id: 2, nombre_genero: 'Mujer', estado: true },
  { id: 3, nombre_genero: 'Unisex', estado: true },
  { id: 4, nombre_genero: 'Niño', estado: true },
  { id: 5, nombre_genero: 'Niña', estado: true },
];

const INITIAL_TALLAS: Talla[] = [
  { id: 1, numero_talla: '35' },
  { id: 2, numero_talla: '36' },
  { id: 3, numero_talla: '37' },
  { id: 4, numero_talla: '38' },
  { id: 5, numero_talla: '39' },
  { id: 6, numero_talla: '40' },
  { id: 7, numero_talla: '41' },
  { id: 8, numero_talla: '42' },
  { id: 9, numero_talla: '43' },
  { id: 10, numero_talla: '44' },
  { id: 11, numero_talla: '45' },
];

const INITIAL_COLORES: Color[] = [
  { id: 1, nombre_color: 'Negro' },
  { id: 2, nombre_color: 'Blanco' },
  { id: 3, nombre_color: 'Rojo' },
  { id: 4, nombre_color: 'Azul' },
  { id: 5, nombre_color: 'Verde' },
  { id: 6, nombre_color: 'Gris' },
  { id: 7, nombre_color: 'Rosa' },
  { id: 8, nombre_color: 'Naranja' },
  { id: 9, nombre_color: 'Beige' },
];

const INITIAL_TIPOS_MOVIMIENTO: TipoMovimiento[] = [
  { id: 1, nombre_movimiento: 'Compra', naturaleza: 'Entrada' },
  { id: 2, nombre_movimiento: 'Ajuste positivo', naturaleza: 'Entrada' },
  { id: 3, nombre_movimiento: 'Ajuste negativo', naturaleza: 'Salida' },
  { id: 4, nombre_movimiento: 'Merma', naturaleza: 'Salida' },
];

const INITIAL_CARGOS: Cargo[] = [
  { id: 1, nombre_cargo: 'Administrador', descripcion: 'Acceso completo al sistema', estado: true },
  { id: 2, nombre_cargo: 'Vendedor', descripcion: 'Registro de ventas y consulta de inventario', estado: true },
  { id: 3, nombre_cargo: 'Almacenero', descripcion: 'Gestion de inventario', estado: true },
];

const KEYS = {
  marcas: '@catalog_marcas',
  categorias: '@catalog_categorias',
  generos: '@catalog_generos',
  tallas: '@catalog_tallas',
  colores: '@catalog_colores',
  tiposMovimiento: '@catalog_tipos_movimiento',
  cargos: '@catalog_cargos',
};

const CatalogsContext = createContext<CatalogsContextType | undefined>(undefined);

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [marcas, setMarcas] = useState<Marca[]>(INITIAL_MARCAS);
  const [categorias, setCategorias] = useState<Categoria[]>(INITIAL_CATEGORIAS);
  const [generos, setGeneros] = useState<Genero[]>(INITIAL_GENEROS);
  const [tallas, setTallas] = useState<Talla[]>(INITIAL_TALLAS);
  const [colores, setColores] = useState<Color[]>(INITIAL_COLORES);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>(INITIAL_TIPOS_MOVIMIENTO);
  const [cargos, setCargos] = useState<Cargo[]>(INITIAL_CARGOS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [m, c, g, t, co, tm, ca] = await Promise.all([
        AsyncStorage.getItem(KEYS.marcas),
        AsyncStorage.getItem(KEYS.categorias),
        AsyncStorage.getItem(KEYS.generos),
        AsyncStorage.getItem(KEYS.tallas),
        AsyncStorage.getItem(KEYS.colores),
        AsyncStorage.getItem(KEYS.tiposMovimiento),
        AsyncStorage.getItem(KEYS.cargos),
      ]);
      if (m) setMarcas(JSON.parse(m));
      if (c) setCategorias(JSON.parse(c));
      if (g) setGeneros(JSON.parse(g));
      if (t) setTallas(JSON.parse(t));
      if (co) setColores(JSON.parse(co));
      if (tm) setTiposMovimiento(JSON.parse(tm));
      if (ca) setCargos(JSON.parse(ca));
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const save = async (key: string, data: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const addMarca = (data: Omit<Marca, 'id'>) => {
    const newItem = { ...data, id: Date.now() };
    const updated = [...marcas, newItem];
    setMarcas(updated);
    save(KEYS.marcas, updated);
  };

  const addCategoria = (data: Omit<Categoria, 'id'>) => {
    const newItem = { ...data, id: Date.now() };
    const updated = [...categorias, newItem];
    setCategorias(updated);
    save(KEYS.categorias, updated);
  };

  const addGenero = (data: Omit<Genero, 'id'>) => {
    const newItem = { ...data, id: Date.now() };
    const updated = [...generos, newItem];
    setGeneros(updated);
    save(KEYS.generos, updated);
  };

  const addTalla = (data: Omit<Talla, 'id'>) => {
    const newItem = { ...data, id: Date.now() };
    const updated = [...tallas, newItem];
    setTallas(updated);
    save(KEYS.tallas, updated);
  };

  const addColor = (data: Omit<Color, 'id'>) => {
    const newItem = { ...data, id: Date.now() };
    const updated = [...colores, newItem];
    setColores(updated);
    save(KEYS.colores, updated);
  };

  return (
    <CatalogsContext.Provider value={{
      marcas, categorias, generos, tallas, colores, tiposMovimiento, cargos,
      isLoading, addMarca, addCategoria, addGenero, addTalla, addColor,
    }}>
      {children}
    </CatalogsContext.Provider>
  );
}

export function useCatalogs() {
  const context = useContext(CatalogsContext);
  if (!context) throw new Error('useCatalogs must be used within CatalogsProvider');
  return context;
}
