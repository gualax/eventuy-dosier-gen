import fs from "fs/promises";
import path from "path";
import { Dossier } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data", "dossiers");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveDossier(dossier: Dossier): Promise<void> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, `${dossier.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(dossier, null, 2));
}

export async function getDossier(id: string): Promise<Dossier | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getAllDossiers(): Promise<Dossier[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const dossiers: Dossier[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const data = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
        dossiers.push(JSON.parse(data));
      } catch {
        // skip corrupt files
      }
    }
  }
  return dossiers.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function deleteDossier(id: string): Promise<void> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}
