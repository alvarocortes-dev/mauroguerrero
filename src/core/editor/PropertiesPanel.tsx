"use client";

import { useEditorStore } from "./store";
// I need an API endpoint for getting the upload URL.

export const PropertiesPanel = () => {
  const { layout, selectedId, updateItem, removeItem, selectItem } =
    useEditorStore();

  if (!layout || !selectedId) return null;

  const item = layout.items.find((i) => i.id === selectedId);
  if (!item) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Get signature and params
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: layout.slug }),
      });

      if (!res.ok) throw new Error("Failed to get upload signature");

      const { signature, timestamp, apiKey, cloudName, folder } =
        await res.json();

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error?.message || "Upload failed");
      }

      const data = await uploadRes.json();

      // 3. Update item
      updateItem(item.id, {
        src: data.secure_url,
        publicId: data.public_id,
      });
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    }
  };

  return (
    <div className="fixed right-6 top-6 w-80 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Propiedades</h3>
        <button
          onClick={() => selectItem(null)}
          className="text-neutral-400 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="text-xs font-medium uppercase text-neutral-500">
          Tipo: {item.type}
        </div>

        {item.type === "image" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Imagen URL</label>
              <input
                type="text"
                value={item.src}
                onChange={(e) => updateItem(item.id, { src: e.target.value })}
                className="w-full rounded-md border border-neutral-200 p-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Subir Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Alt Text</label>
              <input
                type="text"
                value={item.alt}
                onChange={(e) => updateItem(item.id, { alt: e.target.value })}
                className="w-full rounded-md border border-neutral-200 p-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Caption</label>
              <input
                type="text"
                value={item.caption || ""}
                onChange={(e) =>
                  updateItem(item.id, { caption: e.target.value })
                }
                className="w-full rounded-md border border-neutral-200 p-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm">Ancho</label>
                <input
                  type="number"
                  value={item.width}
                  onChange={(e) =>
                    updateItem(item.id, {
                      width: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm">Alto</label>
                <input
                  type="number"
                  value={item.height}
                  onChange={(e) =>
                    updateItem(item.id, {
                      height: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border border-neutral-200 p-2 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {item.type === "text" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm">Contenido</label>
            <textarea
              value={item.content}
              onChange={(e) => updateItem(item.id, { content: e.target.value })}
              className="h-32 w-full rounded-md border border-neutral-200 p-2 text-sm"
            />
          </div>
        )}

        {item.type === "spacer" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm">Altura (px)</label>
            <input
              type="number"
              value={item.height}
              onChange={(e) =>
                updateItem(item.id, { height: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-md border border-neutral-200 p-2 text-sm"
            />
          </div>
        )}

        <hr className="my-2 border-neutral-100" />

        <button
          onClick={() => removeItem(item.id)}
          className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          Eliminar bloque
        </button>
      </div>
    </div>
  );
};
