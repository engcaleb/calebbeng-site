import { requireAdmin } from "@/lib/recoverbright/auth";
import { getAllArticles, getArticleById } from "@/lib/recoverbright/articles";
import { togglePublished, toggleFeatured, deleteArticle } from "./actions";
import { ArticleForm } from "./ArticleForm";

export const metadata = { title: "Articles — Admin" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  await requireAdmin();
  const [articles, editArticle] = await Promise.all([
    getAllArticles(),
    edit ? getArticleById(edit) : Promise.resolve(null),
  ]);

  const categories = [
    ...new Set(articles.map((a) => a.category).filter(Boolean) as string[]),
  ];

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[#1c1a17]/8 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              RecoverBright · Admin
            </p>
            <h1 className="mt-0.5 text-lg font-medium text-[#1c1a17]">
              Articles
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/recoverbright/admin/products"
              className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
            >
              Products →
            </a>
            <a
              href="/recoverbright/admin/defaults"
              className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
            >
              Defaults →
            </a>
            <span className="rounded-full bg-[#1c1a17]/6 px-3 py-1 font-mono text-[12px] text-[#1c1a17]/50">
              {articles.length} article{articles.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        <section className="rounded-lg border border-[#1c1a17]/10 bg-white p-6">
          <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1c1a17]/50">
            {editArticle ? `Editing — ${editArticle.title}` : "New Article"}
          </h2>
          <ArticleForm
            article={editArticle ?? undefined}
            existingCategories={categories}
          />
        </section>

        {articles.length > 0 && (
          <section>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#1c1a17]/8">
                  <th className="th">Title</th>
                  <th className="th">Category</th>
                  <th className="th">Status</th>
                  <th className="th">Featured</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-[#1c1a17]/5"
                  >
                    <td className="td">
                      <div className="flex items-center gap-3">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt=""
                            className="h-10 w-16 shrink-0 rounded border border-[#1c1a17]/8 object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-[#1c1a17]">
                            {article.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#1c1a17]/30">
                            /articles/{article.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="td text-[#1c1a17]/50">
                      {article.category || "—"}
                    </td>
                    <td className="td">
                      <form
                        action={togglePublished.bind(
                          null,
                          article.id,
                          !article.is_published,
                        )}
                      >
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-0.5 font-mono text-[11px] transition ${
                            article.is_published
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-[#1c1a17]/5 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
                          }`}
                        >
                          {article.is_published ? "Published" : "Draft"}
                        </button>
                      </form>
                    </td>
                    <td className="td">
                      <form
                        action={toggleFeatured.bind(
                          null,
                          article.id,
                          !article.is_featured,
                        )}
                      >
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-0.5 font-mono text-[11px] transition ${
                            article.is_featured
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-[#1c1a17]/5 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
                          }`}
                        >
                          {article.is_featured ? "Featured" : "Not featured"}
                        </button>
                      </form>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/recoverbright/admin/articles?edit=${article.id}`}
                          className="font-mono text-[11px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
                        >
                          Edit
                        </a>
                        <form action={deleteArticle.bind(null, article.id)}>
                          <button
                            type="submit"
                            className="font-mono text-[11px] text-red-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
