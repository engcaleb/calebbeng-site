import { notFound } from "next/navigation";
import { requireDoctor } from "@/lib/recoverbright/auth";
import { getPageForEditor, getDefaultProductIds } from "@/lib/recoverbright/portal-pages";
import { getActiveProducts } from "@/lib/recoverbright/products";
import { PageEditor } from "./PageEditor";

type Params = Promise<{ pageId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  await params;
  return { title: `Edit Page — Portal` };
}

export default async function EditPagePage({ params }: { params: Params }) {
  const { pageId } = await params;

  const [doctor, allProducts] = await Promise.all([
    requireDoctor(),
    getActiveProducts(),
  ]);

  const page = await getPageForEditor(pageId, doctor.practice_id);
  if (!page) notFound();

  const defaultProductIds = await getDefaultProductIds(page.surgery_type);

  return (
    <main className="min-h-screen bg-[#f9f7f4] p-8">
      <div className="mx-auto max-w-3xl">
        <PageEditor
          page={page}
          allProducts={allProducts}
          practiceSlug={doctor.practice.slug}
          defaultProductIds={defaultProductIds}
        />
      </div>
    </main>
  );
}
