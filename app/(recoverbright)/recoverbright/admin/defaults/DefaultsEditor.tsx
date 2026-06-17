"use client";

import { useState, useTransition, useMemo } from "react";
import { saveDefaults, addSurgeryType } from "./actions";
import type { RwProduct } from "@/lib/recoverbright/products";

type Props = {
  surgeryTypes: string[];
  products: RwProduct[];
  defaultsByType: Record<string, string[]>;
};

export function DefaultsEditor({
  surgeryTypes,
  products,
  defaultsByType: initialDefaultsByType,
}: Props) {
  const [selectedType, setSelectedType] = useState(surgeryTypes[0] ?? "");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [newTypeName, setNewTypeName] = useState("");
  const [isAddingType, startAddTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [types, setTypes] = useState(surgeryTypes);

  const [selectedByType, setSelectedByType] = useState<
    Record<string, Set<string>>
  >(() => {
    const result: Record<string, Set<string>> = {};
    for (const [type, ids] of Object.entries(initialDefaultsByType)) {
      result[type] = new Set(ids);
    }
    return result;
  });

  const selected = selectedByType[selectedType] ?? new Set<string>();

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  function toggleProduct(productId: string) {
    setSelectedByType((prev) => {
      const current = new Set(prev[selectedType] ?? []);
      if (current.has(productId)) {
        current.delete(productId);
      } else {
        current.add(productId);
      }
      return { ...prev, [selectedType]: current };
    });
  }

  function handleSave() {
    const productIds = Array.from(selected);
    startTransition(async () => {
      await saveDefaults(selectedType, productIds);
    });
  }

  function handleAddType() {
    setAddError(null);
    startAddTransition(async () => {
      try {
        await addSurgeryType(newTypeName);
        setTypes((prev) => [...prev, newTypeName.trim()]);
        setSelectedType(newTypeName.trim());
        setNewTypeName("");
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  return (
    <>
      {/* Surgery type tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setSearch("");
            }}
            className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition ${
              selectedType === type
                ? "bg-[#1c1a17] text-white"
                : "bg-[#1c1a17]/6 text-[#1c1a17]/55 hover:bg-[#1c1a17]/12"
            }`}
          >
            {type}
            <span className="ml-1.5 opacity-50">
              {(selectedByType[type] ?? new Set()).size}
            </span>
          </button>
        ))}

        {/* Add new type inline */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => {
              setNewTypeName(e.target.value);
              setAddError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTypeName.trim()) {
                e.preventDefault();
                handleAddType();
              }
            }}
            placeholder="New category…"
            className="w-[140px] rounded-full border border-dashed border-[#1c1a17]/20 bg-transparent px-3 py-1.5 font-mono text-[12px] text-[#1c1a17] placeholder:text-[#1c1a17]/30 focus:border-[#1c1a17]/40 focus:outline-none"
          />
          {newTypeName.trim() && (
            <button
              onClick={handleAddType}
              disabled={isAddingType}
              className="rounded-full bg-[#1c1a17]/8 px-2.5 py-1.5 font-mono text-[11px] text-[#1c1a17]/60 hover:bg-[#1c1a17]/15 disabled:opacity-50"
            >
              {isAddingType ? "…" : "+ Add"}
            </button>
          )}
        </div>
        {addError && (
          <span className="font-mono text-[11px] text-red-500">
            {addError}
          </span>
        )}
      </div>

      {/* Selected type panel */}
      {selectedType && (
        <section className="rounded-lg border border-[#1c1a17]/10 bg-white">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-[#1c1a17]/8 px-6 py-4">
            <div>
              <h2 className="text-[15px] font-medium text-[#1c1a17]">
                {selectedType}
              </h2>
              <p className="font-mono text-[11px] text-[#1c1a17]/40">
                {selected.size} product{selected.size !== 1 ? "s" : ""} selected
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-[#1c1a17]/5 px-6 py-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-transparent font-mono text-[13px] text-[#1c1a17] placeholder:text-[#1c1a17]/30 focus:outline-none"
            />
          </div>

          {/* Product list */}
          <div className="max-h-[520px] overflow-y-auto px-6 py-2">
            {filteredProducts.length === 0 ? (
              <p className="py-6 text-center font-mono text-[12px] text-[#1c1a17]/35">
                No products match &ldquo;{search}&rdquo;
              </p>
            ) : (
              <div className="divide-y divide-[#1c1a17]/5">
                {filteredProducts.map((p) => {
                  const isChecked = selected.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 py-3 hover:bg-[#1c1a17]/[0.02] -mx-2 px-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 shrink-0 accent-[#1c1a17]"
                      />
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded object-contain"
                        />
                      ) : (
                        <span className="inline-block h-9 w-9 shrink-0 rounded bg-[#1c1a17]/5" />
                      )}
                      <span className="flex-1 text-[14px] text-[#1c1a17]">
                        {p.name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-[#1c1a17]/35">
                        {p.category}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
