import { initDb, getWriteDb } from './db';
import fs from 'fs';

interface PartTemplate {
  name: string;
  category: string;
}

interface ModelDef {
  name: string;
  slug: string;
  yearStart: number;
  yearEnd?: number;
}

interface BrandDef {
  name: string;
  slug: string;
  models: ModelDef[];
}

interface CompatibilityDef {
  fromModel: string;
  partName: string;
  toModel: string;
  refNumber?: string;
  avgPrice?: number;
  savingsPercent?: number;
  source?: string;
}

interface AdaptationDef {
  modelSlug: string;
  partName: string;
  title: string;
  description: string;
  donorModel: string;
  donorBrand: string;
  difficulty: string;
}

const brandDefaultPrices: Record<string, number> = {
  fiat: 0.85,
  volkswagen: 0.90,
  chevrolet: 1.00,
  ford: 1.05,
  honda: 1.30,
  toyota: 1.35,
};

const basePrices: Record<string, number> = {
  Farol: 350,
  Lanterna: 200,
  'Para-choque': 450,
  Radiador: 300,
  'Vidro para-brisa': 400,
  'Capô': 600,
  'Retrovisor': 150,
  'Maçaneta': 80,
  'Grade dianteira': 180,
  'Palheta de limpador': 40,
  PastilhaFreioDianteira: 120,
  PastilhaFreioTraseira: 110,
  DiscoFreioDianteiro: 200,
  DiscoFreioTraseiro: 180,
  AmortecedorDianteiro: 250,
  AmortecedorTraseiro: 230,
  FiltroÓleo: 30,
  FiltroAr: 45,
  FiltroCombustível: 35,
  Bateria: 320,
  CorreiaDentada: 90,
  VelasIgnição: 60,
  BombaCombustível: 280,
  Alternador: 450,
  MotorPartida: 350,
  BobinaIgnição: 130,
  SensorLambda: 200,
  VálvulaTermostática: 70,
  MangueiraRadiador: 55,
};

const modelPriceOverrides: Record<string, Record<string, number>> = {
  'corolla-2020': { Bateria: 420, Farol: 550 },
  'civic-2020': { Farol: 500, 'Capô': 800 },
  'gol-2020': { 'Para-choque': 350, Farol: 280 },
  'onix-2020': { Radiador: 250, Bateria: 280 },
};

const partTemplates: PartTemplate[] = [
  { name: 'Farol', category: 'Iluminação' },
  { name: 'Lanterna', category: 'Iluminação' },
  { name: 'Para-choque', category: 'Funilaria' },
  { name: 'Radiador', category: 'Arrefecimento' },
  { name: 'Vidro para-brisa', category: 'Funilaria' },
  { name: 'Capô', category: 'Funilaria' },
  { name: 'Retrovisor', category: 'Funilaria' },
  { name: 'Maçaneta', category: 'Funilaria' },
  { name: 'Grade dianteira', category: 'Funilaria' },
  { name: 'Palheta de limpador', category: 'Acessórios' },
  { name: 'PastilhaFreioDianteira', category: 'Freios' },
  { name: 'PastilhaFreioTraseira', category: 'Freios' },
  { name: 'DiscoFreioDianteiro', category: 'Freios' },
  { name: 'DiscoFreioTraseiro', category: 'Freios' },
  { name: 'AmortecedorDianteiro', category: 'Suspensão' },
  { name: 'AmortecedorTraseiro', category: 'Suspensão' },
  { name: 'FiltroÓleo', category: 'Manutenção' },
  { name: 'FiltroAr', category: 'Manutenção' },
  { name: 'FiltroCombustível', category: 'Manutenção' },
  { name: 'Bateria', category: 'Elétrica' },
  { name: 'CorreiaDentada', category: 'Motor' },
  { name: 'VelasIgnição', category: 'Motor' },
  { name: 'BombaCombustível', category: 'Motor' },
  { name: 'Alternador', category: 'Elétrica' },
  { name: 'MotorPartida', category: 'Elétrica' },
  { name: 'BobinaIgnição', category: 'Motor' },
  { name: 'SensorLambda', category: 'Motor' },
  { name: 'VálvulaTermostática', category: 'Arrefecimento' },
  { name: 'MangueiraRadiador', category: 'Arrefecimento' },
];

const brands: BrandDef[] = [
  {
    name: 'Fiat', slug: 'fiat',
    models: [
      { name: 'Uno 2020', slug: 'uno-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Mobi 2020', slug: 'mobi-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Cronos 2020', slug: 'cronos-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Pulse 2022', slug: 'pulse-2022', yearStart: 2022 },
      { name: 'Strada 2020', slug: 'strada-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Toro 2020', slug: 'toro-2020', yearStart: 2020, yearEnd: 2023 },
    ],
  },
  {
    name: 'Volkswagen', slug: 'volkswagen',
    models: [
      { name: 'Gol 2020', slug: 'gol-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Polo 2020', slug: 'polo-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'T-Cross 2020', slug: 'tcross-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Nivus 2021', slug: 'nivus-2021', yearStart: 2021 },
      { name: 'Taos 2021', slug: 'taos-2021', yearStart: 2021 },
      { name: 'Virtus 2020', slug: 'virtus-2020', yearStart: 2020, yearEnd: 2023 },
    ],
  },
  {
    name: 'Chevrolet', slug: 'chevrolet',
    models: [
      { name: 'Onix 2020', slug: 'onix-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Onix Plus 2020', slug: 'onixplus-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Tracker 2020', slug: 'tracker-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Cruze 2020', slug: 'cruze-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'S10 2020', slug: 's10-2020', yearStart: 2020, yearEnd: 2023 },
    ],
  },
  {
    name: 'Ford', slug: 'ford',
    models: [
      { name: 'Ka 2020', slug: 'ka-2020', yearStart: 2020, yearEnd: 2021 },
      { name: 'EcoSport 2020', slug: 'ecosport-2020', yearStart: 2020, yearEnd: 2021 },
      { name: 'Ranger 2020', slug: 'ranger-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Territory 2021', slug: 'territory-2021', yearStart: 2021 },
    ],
  },
  {
    name: 'Honda', slug: 'honda',
    models: [
      { name: 'Civic 2020', slug: 'civic-2020', yearStart: 2020, yearEnd: 2022 },
      { name: 'HR-V 2020', slug: 'hrv-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Fit 2020', slug: 'fit-2020', yearStart: 2020, yearEnd: 2021 },
      { name: 'City 2020', slug: 'city-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'CR-V 2020', slug: 'crv-2020', yearStart: 2020, yearEnd: 2023 },
    ],
  },
  {
    name: 'Toyota', slug: 'toyota',
    models: [
      { name: 'Corolla 2020', slug: 'corolla-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Corolla Cross 2021', slug: 'corollacross-2021', yearStart: 2021 },
      { name: 'Yaris 2020', slug: 'yaris-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'Hilux 2020', slug: 'hilux-2020', yearStart: 2020, yearEnd: 2023 },
      { name: 'SW4 2020', slug: 'sw4-2020', yearStart: 2020, yearEnd: 2023 },
    ],
  },
];

const compatibilities: CompatibilityDef[] = [
  { fromModel: 'mobi-2020', partName: 'Farol', toModel: 'uno-2020', savingsPercent: 25, source: 'Mecânico' },
  { fromModel: 'mobi-2020', partName: 'Lanterna', toModel: 'uno-2020', savingsPercent: 20, source: 'Mecânico' },
  { fromModel: 'mobi-2020', partName: 'Para-choque', toModel: 'uno-2020', savingsPercent: 30, source: 'Mecânico' },
  { fromModel: 'polo-2020', partName: 'PastilhaFreioDianteira', toModel: 'virtus-2020', refNumber: 'VW-1234', savingsPercent: 15 },
  { fromModel: 'polo-2020', partName: 'DiscoFreioDianteiro', toModel: 'virtus-2020', refNumber: 'VW-2345', savingsPercent: 15 },
  { fromModel: 'gol-2020', partName: 'FiltroÓleo', toModel: 'polo-2020', savingsPercent: 40 },
  { fromModel: 'gol-2020', partName: 'FiltroAr', toModel: 'polo-2020', savingsPercent: 35 },
  { fromModel: 'onixplus-2020', partName: 'Farol', toModel: 'onix-2020', savingsPercent: 20 },
  { fromModel: 'onixplus-2020', partName: 'Lanterna', toModel: 'onix-2020', savingsPercent: 18 },
  { fromModel: 'onixplus-2020', partName: 'Para-choque', toModel: 'onix-2020', savingsPercent: 22 },
  { fromModel: 'ka-2020', partName: 'Retrovisor', toModel: 'ecosport-2020', savingsPercent: 30 },
  { fromModel: 'ka-2020', partName: 'Maçaneta', toModel: 'ecosport-2020', savingsPercent: 25 },
  { fromModel: 'cronos-2020', partName: 'PastilhaFreioDianteira', toModel: 'pulse-2022', refNumber: 'FIAT-3456', savingsPercent: 20 },
  { fromModel: 'cronos-2020', partName: 'AmortecedorDianteiro', toModel: 'pulse-2022', savingsPercent: 25 },
  { fromModel: 'tracker-2020', partName: 'Bateria', toModel: 'onix-2020', savingsPercent: 35 },
  { fromModel: 'tcross-2020', partName: 'Alternador', toModel: 'nivus-2021', refNumber: 'VW-4567', savingsPercent: 15 },
  { fromModel: 'tcross-2020', partName: 'MotorPartida', toModel: 'nivus-2021', refNumber: 'VW-5678', savingsPercent: 15 },
  { fromModel: 'city-2020', partName: 'FiltroÓleo', toModel: 'fit-2020', savingsPercent: 30 },
  { fromModel: 'city-2020', partName: 'VelasIgnição', toModel: 'fit-2020', savingsPercent: 25 },
  { fromModel: 'city-2020', partName: 'CorreiaDentada', toModel: 'fit-2020', savingsPercent: 20 },
  { fromModel: 'yaris-2020', partName: 'PastilhaFreioDianteira', toModel: 'corolla-2020', refNumber: 'TOY-6789', savingsPercent: 40 },
  { fromModel: 'yaris-2020', partName: 'Bateria', toModel: 'corolla-2020', savingsPercent: 35 },
  { fromModel: 'crv-2020', partName: 'SensorLambda', toModel: 'civic-2020', refNumber: 'HON-7890', savingsPercent: 30 },
  { fromModel: 's10-2020', partName: 'Bateria', toModel: 'tracker-2020', savingsPercent: 25 },
  { fromModel: 'ranger-2020', partName: 'Alternador', toModel: 'ecosport-2020', savingsPercent: 30 },
];

const adaptations: AdaptationDef[] = [
  { modelSlug: 'gol-2020', partName: 'Farol', title: 'Farol de Milo em Gol', description: 'Adaptação de farol do VW Polo 2020 em Gol. Requer suporte novo e conector específico.', donorModel: 'Polo 2020', donorBrand: 'Volkswagen', difficulty: 'Média' },
  { modelSlug: 'uno-2020', partName: 'Para-choque', title: 'Para-choque de Mobi em Uno', description: 'Para-choque dianteiro do Mobi 2020 com pequenas modificações nos suportes laterais.', donorModel: 'Mobi 2020', donorBrand: 'Fiat', difficulty: 'Fácil' },
  { modelSlug: 'onix-2020', partName: 'CentralMultimídia', title: 'Central MyLink de Cruze em Onix', description: 'Instalação da central MyLink do Cruze 2020 em Onix. Requer moldura personalizada e adaptação de chicote.', donorModel: 'Cruze 2020', donorBrand: 'Chevrolet', difficulty: 'Difícil' },
  { modelSlug: 'ka-2020', partName: 'Banco', title: 'Banco de EcoSport em Ka', description: 'Bancos dianteiros do EcoSport 2020 com adaptação dos trilhos.', donorModel: 'EcoSport 2020', donorBrand: 'Ford', difficulty: 'Média' },
  { modelSlug: 'polo-2020', partName: 'Roda', title: 'Rodas de Golf GTI em Polo', description: 'Rodas originais de Golf GTI 2019 em Polo 2020 com adaptadores de furação.', donorModel: 'Golf GTI 2019', donorBrand: 'Volkswagen', difficulty: 'Média' },
  { modelSlug: 'corolla-2020', partName: 'Bancos', title: 'Bancos Elétricos de Camry em Corolla', description: 'Adaptação de bancos elétricos com memória do Camry para Corolla. Requer adaptação elétrica e mecânica dos trilhos.', donorModel: 'Camry 2020', donorBrand: 'Toyota', difficulty: 'Difícil' },
];

export function seed() {
  const dbPath = require('path').join(process.cwd(), 'data', 'crosspecas.db');

  if (fs.existsSync(dbPath)) {
    console.log('Removing old database...');
    fs.unlinkSync(dbPath);
  }

  initDb();
  const db = getWriteDb();

  for (const brand of brands) {
    db.prepare('INSERT INTO brands (name, slug) VALUES (?, ?)').run(brand.name, brand.slug);
    const brandRow = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brand.slug) as any;
    for (const model of brand.models) {
      db.prepare('INSERT INTO models (brand_id, name, slug, year_start, year_end) VALUES (?, ?, ?, ?, ?)')
        .run(brandRow.id, model.name, model.slug, model.yearStart, model.yearEnd ?? null);
    }
  }

  const modelIds: Record<string, number> = {};
  for (const m of db.prepare('SELECT id, slug FROM models').all() as any[]) {
    modelIds[m.slug] = m.id;
  }

  const modelBrand: Record<string, string> = {};
  for (const brand of brands) {
    for (const model of brand.models) {
      modelBrand[model.slug] = brand.slug;
    }
  }

  const partIds: Record<string, Record<string, number>> = {};
  const insertPart = db.prepare('INSERT INTO parts (model_id, name, category, ref_number, avg_price) VALUES (?, ?, ?, ?, ?)');

  for (const brand of brands) {
    const brandMultiplier = brandDefaultPrices[brand.slug] ?? 1.0;
    for (const model of brand.models) {
      partIds[model.slug] = {};
      for (const tmpl of partTemplates) {
        let price = Math.round((basePrices[tmpl.name] ?? 100) * brandMultiplier);
        const override = modelPriceOverrides[model.slug]?.[tmpl.name];
        if (override) price = override;

        const res = insertPart.run(modelIds[model.slug], tmpl.name, tmpl.category, null, price);
        partIds[model.slug][tmpl.name] = Number(res.lastInsertRowid);
      }
    }
  }

  let compatCount = 0;
  const insertCompat = db.prepare('INSERT INTO compatibilities (part_id, compatible_model_id, ref_number, avg_price, savings_percent, source) VALUES (?, ?, ?, ?, ?, ?)');

  for (const comp of compatibilities) {
    const partId = partIds[comp.fromModel]?.[comp.partName];
    if (!partId || !modelIds[comp.toModel]) continue;
    insertCompat.run(partId, modelIds[comp.toModel], comp.refNumber ?? null, comp.avgPrice ?? null, comp.savingsPercent ?? null, comp.source ?? null);
    compatCount++;
  }

  let adaptCount = 0;
  const insertAdapt = db.prepare('INSERT INTO adaptations (part_id, title, description, donor_model, donor_brand, difficulty) VALUES (?, ?, ?, ?, ?, ?)');
  for (const ad of adaptations) {
    const partId = partIds[ad.modelSlug]?.[ad.partName];
    if (!partId) continue;
    insertAdapt.run(partId, ad.title, ad.description, ad.donorModel, ad.donorBrand, ad.difficulty);
    adaptCount++;
  }

  const totalModels = Object.keys(modelIds).length;
  const totalParts = db.prepare('SELECT COUNT(*) as c FROM parts').get() as any;
  console.log(`Seed: ${brands.length} marcas, ${totalModels} modelos, ${totalParts.c} peças, ${compatCount} compatibilidades, ${adaptCount} adaptações.`);
}
