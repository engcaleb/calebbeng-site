import { requireAdmin } from "@/lib/recoverbright/auth";
import { getProducts, getProductById } from "@/lib/recoverbright/products";
import { toggleProductActive } from "./actions";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Product Catalog — Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  await requireAdmin();
  const [products, editProduct] = await Promise.all([
    getProducts(),
    edit ? getProductById(edit) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {/* Header */}
      <header className="border-b border-[#1c1a17]/8 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1c1a17]/35">
              Recover Bright · Admin
            </p>
            <h1 className="mt-0.5 text-lg font-medium text-[#1c1a17]">
              Product Catalog
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/recoverbright/admin/defaults"
              className="font-mono text-[12px] text-[#1c1a17]/40 hover:text-[#1c1a17]"
            >
              Defaults →
            </a>
            <span className="rounded-full bg-[#1c1a17]/6 px-3 py-1 font-mono text-[12px] text-[#1c1a17]/50">
              {products.length} products
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Add / Edit form */}
        <section className="rounded-lg border border-[#1c1a17]/10 bg-white p-6">
          <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1c1a17]/50">
            {editProduct ? `Editing — ${editProduct.name}` : "Add Product"}
          </h2>
          <ProductForm product={editProduct ?? undefined} />
        </section>

        {/* Product list */}
        {products.length > 0 && (
          <section>
            <div className="overflow-hidden rounded-lg border border-[#1c1a17]/10">
              <table className="w-full text-sm">
                <thead className="border-b border-[#1c1a17]/8 bg-white">
                  <tr>
                    <th className="th">Sort</th>
                    <th className="th">Name</th>
                    <th className="th">Category</th>
                    <th className="th">Instructions</th>
                    <th className="th">Buy URL</th>
                    <th className="th">Active</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1a17]/5 bg-white">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className={
                        p.is_active ? "" : "opacity-45"
                      }
                    >
                      <td className="td font-mono text-[12px] text-[#1c1a17]/40">
                        {p.sort_order}
                      </td>
                      <td className="td font-medium text-[#1c1a17]">
                        <div>{p.name}</div>
                        <div className="font-mono text-[11px] text-[#1c1a17]/35">
                          {p.slug}
                        </div>
                      </td>
                      <td className="td text-[12px] text-[#1c1a17]/55">
                        {p.category}
                      </td>
                      <td className="td max-w-[200px] text-[12px] text-[#1c1a17]/55">
                        {p.default_instructions ? (
                          <span
                            title={p.default_instructions}
                            className="block overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {p.default_instructions}
                          </span>
                        ) : (
                          <span className="text-[#1c1a17]/25">—</span>
                        )}
                      </td>
                      <td className="td max-w-[140px] font-mono text-[11px] text-[#1c1a17]/45">
                        {p.buy_url ? (
                          <a
                            href={p.buy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden text-ellipsis whitespace-nowrap underline underline-offset-2 hover:text-[#1c1a17]"
                          >
                            {p.buy_url.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-[#1c1a17]/25">—</span>
                        )}
                      </td>
                      <td className="td">
                        <form action={toggleProductActive}>
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(p.is_active)}
                          />
                          <button
                            type="submit"
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] transition ${
                              p.is_active
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-[#1c1a17]/6 text-[#1c1a17]/40 hover:bg-[#1c1a17]/10"
                            }`}
                          >
                            {p.is_active ? "Active" : "Inactive"}
                          </button>
                        </form>
                      </td>
                      <td className="td">
                        <a
                          href={`/recoverbright/admin/products?edit=${p.id}`}
                          className="font-mono text-[11px] text-[#1c1a17]/40 underline underline-offset-2 hover:text-[#1c1a17]"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
