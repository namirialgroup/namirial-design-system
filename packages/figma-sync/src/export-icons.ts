/**
 * Esporta le icone (componenti lucide-icons/*) da Figma come SVG in apps/docs/public/icons.
 * Le immagini sono quelle presenti come componenti in Figma, non da pacchetti React.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FIGMA_API = "https://api.figma.com/v1";
const LUCIDE_PREFIX = "lucide-icons/";
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 80;
const SVG_CONCURRENCY = 25;

interface FigmaComponent {
  id: string;
  name: string;
}

interface FigmaImagesResponse {
  err: string | null;
  images?: Record<string, string>;
}

function slugFromName(name: string): string {
  if (name.startsWith(LUCIDE_PREFIX)) {
    return name.slice(LUCIDE_PREFIX.length).trim();
  }
  return name;
}

export async function exportIconsToDocs(
  options: {
    componentLibraryId: string;
    accessToken: string;
    snapshotsDir: string;
    docsPublicDir: string;
  }
): Promise<{ exported: number; failed: number }> {
  const componentsPath = join(options.snapshotsDir, "current-components.json");
  if (!existsSync(componentsPath)) {
    return { exported: 0, failed: 0 };
  }

  const components = JSON.parse(readFileSync(componentsPath, "utf-8")) as FigmaComponent[];
  const icons = components.filter((c) => c.name.startsWith(LUCIDE_PREFIX));
  if (icons.length === 0) {
    return { exported: 0, failed: 0 };
  }

  const iconsDir = join(options.docsPublicDir, "icons");
  mkdirSync(iconsDir, { recursive: true });

  const idToSlug = new Map(icons.map((c) => [c.id, slugFromName(c.name)]));
  const ids = icons.map((c) => c.id);
  let exported = 0;
  let failed = 0;

  const headers = {
    "X-Figma-Token": options.accessToken,
    Accept: "application/json",
  };

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const idsParam = batch.map((id) => encodeURIComponent(id)).join(",");
    const url = `${FIGMA_API}/images/${options.componentLibraryId}?ids=${idsParam}&format=svg`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn("  Export icone: batch API fallita", res.status);
      failed += batch.length;
      continue;
    }
    const data = (await res.json()) as FigmaImagesResponse;
    const images = data.images ?? {};
    const hasAnyInBatch = batch.some((id) => images[id] ?? images[id.replace(/:/g, "-")]);
    if (!hasAnyInBatch && batch.length > 0) {
      console.warn("  Export icone: batch senza URL (ids:", batch.slice(0, 3).join(", "), "...). Verifica file key e permessi.");
    }
    const toFetch: { id: string; url: string; slug: string }[] = [];
    for (const id of batch) {
      const urlOrNull = images[id] ?? images[id.replace(/:/g, "-")];
      const slug = idToSlug.get(id);
      if (!slug || !urlOrNull) {
        if (slug) failed++;
        continue;
      }
      toFetch.push({ id, url: urlOrNull, slug });
    }

    const safeSlug = (s: string) => s.replace(/[^a-zA-Z0-9-_]/g, "-");
    const fetchOne = async (item: { url: string; slug: string }): Promise<{ slug: string; svg: string } | null> => {
      try {
        const res = await fetch(item.url);
        if (!res.ok) return null;
        const svg = await res.text();
        return { slug: item.slug, svg };
      } catch {
        return null;
      }
    };

    for (let j = 0; j < toFetch.length; j += SVG_CONCURRENCY) {
      const chunk = toFetch.slice(j, j + SVG_CONCURRENCY);
      const results = await Promise.all(chunk.map((item) => fetchOne(item)));
      for (const r of results) {
        if (r) {
          writeFileSync(join(iconsDir, `${safeSlug(r.slug)}.svg`), r.svg, "utf-8");
          exported++;
        } else {
          failed++;
        }
      }
    }

    if (i + BATCH_SIZE < ids.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return { exported, failed };
}
