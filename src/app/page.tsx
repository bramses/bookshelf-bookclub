import ClientHome from '@/components/ClientHome';
import { getBooks } from '@/lib/data';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  noStore();
  const books = await getBooks();
  console.log('Fetched books:', books.map(b => ({ title: b.title, description: b.description?.substring(0, 20) })));
  return <ClientHome books={books} />;
}
