import { NextRequest } from 'next/server';
import { getBrands, getModelsByBrand, getPartsByModel, getCompatibilities, getAdaptations } from '@/lib/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'brands':
        return Response.json(getBrands());
      case 'models': {
        const brand = searchParams.get('brand');
        if (!brand) return Response.json({ error: 'brand required' }, { status: 400 });
        return Response.json(getModelsByBrand(brand));
      }
      case 'parts': {
        const model = searchParams.get('model');
        if (!model) return Response.json({ error: 'model required' }, { status: 400 });
        return Response.json(getPartsByModel(model));
      }
      case 'compatibilities': {
        const partId = searchParams.get('partId');
        if (!partId) return Response.json({ error: 'partId required' }, { status: 400 });
        return Response.json(getCompatibilities(Number(partId)));
      }
      case 'adaptations': {
        const partId = searchParams.get('partId');
        if (!partId) return Response.json({ error: 'partId required' }, { status: 400 });
        return Response.json(getAdaptations(Number(partId)));
      }
      default:
        return Response.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  try {
    if (action === 'vote') {
      const { id, delta } = await request.json();
      if (!id || (delta !== 1 && delta !== -1)) {
        return Response.json({ error: 'invalid vote' }, { status: 400 });
      }
      const { getWriteDb } = await import('@/lib/db');
      getWriteDb().prepare('UPDATE adaptations SET votes = votes + ? WHERE id = ?').run(delta, id);
      return Response.json({ success: true });
    }
    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  try {
    if (action === 'submit-adaptation') {
      const { partId, title, description, donorBrand, donorModel, difficulty } = await request.json();
      if (!partId || !title) {
        return Response.json({ error: 'partId and title required' }, { status: 400 });
      }
      const { getWriteDb } = await import('@/lib/db');
      getWriteDb().prepare('INSERT INTO adaptations (part_id, title, description, donor_model, donor_brand, difficulty) VALUES (?, ?, ?, ?, ?, ?)').run(partId, title, description ?? '', donorModel ?? '', donorBrand ?? '', difficulty ?? 'Média');
      return Response.json({ success: true });
    }
    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
