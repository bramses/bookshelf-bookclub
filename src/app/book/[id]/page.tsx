import ClientHome from '@/components/ClientHome';
import { getBooks } from '@/lib/data';

export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({
    id: book.id,
  }));
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const books = await getBooks();
  
  return <ClientHome initialBookId={id} books={books} />;
}
