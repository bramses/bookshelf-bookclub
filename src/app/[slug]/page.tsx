import ClientHome from '@/components/ClientHome';
import { getBooks } from '@/lib/data';

export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({
    slug: book.slug,
  }));
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const books = await getBooks();
  return <ClientHome initialBookSlug={slug} books={books} />;
}
