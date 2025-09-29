import { getAllGeneratedPreviews } from '../../lib/generated-content';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const previews = await getAllGeneratedPreviews();
    return NextResponse.json(previews);
  } catch (error) {
    console.error('Failed to get generated previews:', error);
    return NextResponse.json({ error: 'Failed to load previews' }, { status: 500 });
  }
}