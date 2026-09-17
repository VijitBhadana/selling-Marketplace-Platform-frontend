import type { JsonLdNode } from '@/lib/seo';

// schema.org structured data. `<` is escaped so user-written text (shop names,
// descriptions) can't close the <script> tag early.
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const doc = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(doc).replace(/</g, '\\u003c') }}
    />
  );
}
