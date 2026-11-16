import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { nextId } from '@/lib/ids';
import { useAuth } from '@/context/AuthContext';
import { Marca, Categoria, Genero, Talla, Color, Cargo } from '@/types';

interface CatalogsContextType {
  marcas: Marca[];
  categorias: Categoria[];
  generos: Genero[];
  tallas: Talla[];
  colores: Color[];
  cargos: Cargo[];
  isLoading: boolean;
  addMarca: (data: Omit<Marca, 'id'>) => Promise<Marca>;
  addCategoria: (data: Omit<Categoria, 'id'>) => Promise<Categoria>;
  addGenero: (data: Omit<Genero, 'id'>) => Promise<Genero>;
  addTalla: (data: Omit<Talla, 'id'>) => Promise<Talla>;
  addColor: (data: Omit<Color, 'id'>) => Promise<Color>;
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

const INITIAL_CARGOS: Cargo[] = [
  { id: 1, nombre_cargo: 'Administrador', descripcion: 'Acceso completo al sistema', estado: true },
  { id: 2, nombre_cargo: 'Vendedor', descripcion: 'Registro de ventas y consulta de inventario', estado: true },
  { id: 3, nombre_cargo: 'Almacenero', descripcion: 'Gestion de inventario', estado: true },
];

const CatalogsContext = createContext<CatalogsContextType | undefined>(undefined);

function mapMarca(row: any): Marca {
  return { id: Number(row.id), nombre_marca: row.nombre_marca, estado: Boolean(row.estado) };
}

function mapCategoria(row: any): Categoria {
  return {
    id: Number(row.id),
    nombre_categoria: row.nombre_categoria,
    descripcion: row.descripcion ?? undefined,
  };
}

function mapGenero(row: any): Genero {
  return { id: Number(row.id), nombre_genero: row.nombre_genero, estado: Boolean(row.estado) };
}

function mapTalla(row: any): Talla {
  return { id: Number(row.id), numero_talla: row.numero_talla };
}

function mapColor(row: any): Color {
  return { id: Number(row.id), nombre_color: row.nombre_color };
}

function mapCargo(row: any): Cargo {
  return {
    id: Number(row.id),
    nombre_cargo: row.nombre_cargo,
    descripcion: row.descripcion ?? undefined,
    estado: Boolean(row.estado),
  };
}

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [marcas, setMarcas] = useState<Marca[]>(INITIAL_MARCAS);
  const [categorias, setCategorias] = useState<Categoria[]>(INITIAL_CATEGORIAS);
  const [generos, setGeneros] = useState<Genero[]>(INITIAL_GENEROS);
  const [tallas, setTallas] = useState<Talla[]>(INITIAL_TALLAS);
  const [colores, setColores] = useState<Color[]>(INITIAL_COLORES);
  const [cargos, setCargos] = useState<Cargo[]>(INITIAL_CARGOS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [marcasResult, categoriasResult, generosResult, tallasResult, coloresResult, cargosResult] =
        await Promise.all([
          supabase.from('marcas').select('*').order('id'),
          supabase.from('categorias').select('*').order('id'),
          supabase.from('generos').select('*').order('id'),
          supabase.from('tallas').select('*').order('id'),
          supabase.from('colores').select('*').order('id'),
          supabase.from('cargos').select('*').order('id'),
        ]);

      if (marcasResult.error) throw marcasResult.error;
      if (categoriasResult.error) throw categoriasResult.error;
      if (generosResult.error) throw generosResult.error;
      if (tallasResult.error) throw tallasResult.error;
      if (coloresResult.error) throw coloresResult.error;
      if (cargosResult.error) throw cargosResult.error;

      setMarcas((marcasResult.data ?? []).map(mapMarca));
      setCategorias((categoriasResult.data ?? []).map(mapCategoria));
      setGeneros((generosResult.data ?? []).map(mapGenero));
      setTallas((tallasResult.data ?? []).map(mapTalla));
      setColores((coloresResult.data ?? []).map(mapColor));
      setCargos((cargosResult.data ?? []).map(mapCargo));
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMarca = async (data: Omit<Marca, 'id'>): Promise<Marca> => {
    const newItem: Marca = { ...data, id: nextId() };
    const { error } = await supabase.from('marcas').insert(newItem);
    if (error) throw error;
    setMarcas(previous => [...previous, newItem]);
    return newItem;
  };

  const addCategoria = async (data: Omit<Categoria, 'id'>): Promise<Categoria> => {
    const newItem: Categoria = { ...data, id: nextId() };
    const { error } = await supabase.from('categorias').insert({
      ...newItem,
      descripcion: newItem.descripcion ?? null,
    });
    if (error) throw error;
    setCategorias(previous => [...previous, newItem]);
    return newItem;
  };

  const addGenero = async (data: Omit<Genero, 'id'>): Promise<Genero> => {
    const newItem: Genero = { ...data, id: nextId() };
    const { error } = await supabase.from('generos').insert(newItem);
    if (error) throw error;
    setGeneros(previous => [...previous, newItem]);
    return newItem;
  };

  const addTalla = async (data: Omit<Talla, 'id'>): Promise<Talla> => {
    const newItem: Talla = { ...data, id: nextId() };
    const { error } = await supabase.from('tallas').insert(newItem);
    if (error) throw error;
    setTallas(previous => [...previous, newItem]);
    return newItem;
  };

  const addColor = async (data: Omit<Color, 'id'>): Promise<Color> => {
    const newItem: Color = { ...data, id: nextId() };
    const { error } = await supabase.from('colores').insert(newItem);
    if (error) throw error;
    setColores(previous => [...previous, newItem]);
    return newItem;
  };

  return (
    <CatalogsContext.Provider
      value={{
        marcas,
        categorias,
        generos,
        tallas,
        colores,
        cargos,
        isLoading,
        addMarca,
        addCategoria,
        addGenero,
        addTalla,
        addColor,
      }}
    >
      {children}
    </CatalogsContext.Provider>
  );
}

export function useCatalogs() {
  const context = useContext(CatalogsContext);
  if (!context) throw new Error('useCatalogs must be used within CatalogsProvider');
  return context;
}
