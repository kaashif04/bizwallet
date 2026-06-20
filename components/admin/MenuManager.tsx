"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currencySymbol } from "@/lib/format";
import type { MenuPatch, OwnerMenuItem } from "@/lib/admin/owner-types";

const SYM = currencySymbol("MYR");

export default function MenuManager({
  outletId,
  initial,
}: {
  outletId: string;
  initial: OwnerMenuItem[];
}) {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<OwnerMenuItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(
    id: string,
    fields: MenuPatch,
    optimistic: (it: OwnerMenuItem) => OwnerMenuItem
  ) {
    setError(null);
    setItems((prev) => prev.map((it) => (it.id === id ? optimistic(it) : it)));
    const { error } = await supabase.from("menu_items").update(fields).eq("id", id);
    if (error) setError(error.message);
  }

  async function toggleAvailable(it: OwnerMenuItem) {
    const target = !it.isAvailable;
    await patch(it.id, { is_available: target }, (x) => ({
      ...x,
      isAvailable: target,
    }));
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setItems(prev);
    }
  }

  async function add(form: {
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
  }): Promise<boolean> {
    setError(null);
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        outlet_id: outletId,
        name: form.name,
        category: form.category || null,
        price: form.price,
        stock_quantity: form.stock,
        description: form.description || null,
      })
      .select("id,name,description,category,price,stock_quantity,is_available")
      .single();

    if (error) {
      setError(error.message);
      return false;
    }
    if (data) {
      setItems((prev) => [
        {
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: Number(data.price),
          stockQuantity: data.stock_quantity,
          isAvailable: data.is_available,
        },
        ...prev,
      ]);
    }
    return true;
  }

  const categories = Array.from(
    new Set(items.map((i) => i.category ?? "Uncategorized"))
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {adding ? "Close" : "+ Add item"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {adding && (
        <AddItemForm
          onAdd={async (f) => {
            const ok = await add(f);
            if (ok) setAdding(false);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No menu items yet — add your first item.
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold text-slate-500">{cat}</h3>
              <div className="space-y-2">
                {items
                  .filter((i) => (i.category ?? "Uncategorized") === cat)
                  .map((it) => (
                    <MenuRow
                      key={it.id}
                      item={it}
                      onToggle={() => toggleAvailable(it)}
                      onSave={patch}
                      onDelete={() => remove(it.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuRow({
  item,
  onToggle,
  onSave,
  onDelete,
}: {
  item: OwnerMenuItem;
  onToggle: () => void;
  onSave: (
    id: string,
    fields: MenuPatch,
    optimistic: (it: OwnerMenuItem) => OwnerMenuItem
  ) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [stock, setStock] = useState(String(item.stockQuantity));
  const [desc, setDesc] = useState(item.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const nextPrice = Number(price) || 0;
    const nextStock = Math.max(0, parseInt(stock, 10) || 0);
    const nextName = name.trim() || item.name;
    const nextCategory = category.trim() || null;
    const nextDesc = desc.trim() || null;
    await onSave(
      item.id,
      {
        name: nextName,
        category: nextCategory,
        description: nextDesc,
        price: nextPrice,
        stock_quantity: nextStock,
      },
      (x) => ({
        ...x,
        name: nextName,
        category: nextCategory,
        description: nextDesc,
        price: nextPrice,
        stockQuantity: nextStock,
      })
    );
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-brand-300 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Category" value={category} onChange={setCategory} />
          <Input label="Price (RM)" type="number" value={price} onChange={setPrice} />
          <Input label="Stock" type="number" value={stock} onChange={setStock} />
          <div className="sm:col-span-2">
            <Input label="Description" value={desc} onChange={setDesc} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${
        item.isAvailable ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
        {item.description && (
          <p className="truncate text-xs text-slate-500">{item.description}</p>
        )}
        <p className="mt-0.5 text-sm font-semibold text-brand-700">
          {SYM}
          {item.price.toFixed(2)}{" "}
          <span className="font-normal text-slate-500">
            · Stock: {item.stockQuantity}
          </span>
        </p>
      </div>
      <Toggle on={item.isAvailable} onClick={onToggle} />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}

function AddItemForm({
  onAdd,
}: {
  onAdd: (f: {
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setBusy(true);
    await onAdd({
      name: name.trim(),
      category: category.trim(),
      price: Number(price) || 0,
      stock: Math.max(0, parseInt(stock, 10) || 0),
      description: description.trim(),
    });
    setBusy(false);
  }

  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={setName} placeholder="Spicy Ramen" />
        <Input label="Category" value={category} onChange={setCategory} placeholder="Mains" />
        <Input
          label="Price (RM)"
          type="number"
          value={price}
          onChange={setPrice}
          placeholder="0.00"
        />
        <Input
          label="Stock"
          type="number"
          value={stock}
          onChange={setStock}
          placeholder="0"
        />
        <div className="sm:col-span-2">
          <Input
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Short description"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add item"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
      />
    </label>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? "Available" : "Unavailable"}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}
