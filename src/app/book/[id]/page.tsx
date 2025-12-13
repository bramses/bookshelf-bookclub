import ClientHome from '@/components/ClientHome';
import { getBooks } from '@/lib/data';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  noStore();
  const { id } = await params;
  const books = await getBooks();
  
  return <ClientHome initialBookId={id} books={books} />;
}
