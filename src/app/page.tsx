import ClientHome from '@/components/ClientHome';
import { getBooks } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const books = await getBooks();
  return <ClientHome books={books} />;
}
