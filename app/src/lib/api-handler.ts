import { NextRequest, NextResponse } from 'next/server';
import { readCollection, addItem, updateItem, deleteItem, generateId, CollectionName } from '@/lib/data';

export function createCollectionHandler(collection: CollectionName) {
  async function GET() {
    try {
      const items = await readCollection(collection);
      return NextResponse.json(items);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const now = new Date().toISOString();
      const newItem = { id: generateId(), ...body, createdAt: now, updatedAt: now };
      const created = await addItem(collection, newItem);
      return NextResponse.json(created, { status: 201 });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  return { GET, POST };
}

export function createItemHandler(collection: CollectionName) {
  async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const body = await request.json();
      const updated = await updateItem(collection, id, { ...body, updatedAt: new Date().toISOString() });
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(updated);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      await deleteItem(collection, id);
      return new NextResponse(null, { status: 204 });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  return { PUT, DELETE };
}
