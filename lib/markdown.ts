import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Deck, VocabEntry } from "./types";

const DECKS_DIR = path.join(process.cwd(), "data", "decks");

export function getAllDecks(): Deck[] {
  if (!fs.existsSync(DECKS_DIR)) {
    fs.mkdirSync(DECKS_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(DECKS_DIR).filter(f => f.endsWith(".md"));
  return files.map(file => parseDeckFile(path.join(DECKS_DIR, file)));
}

export function getDeck(slug: string): Deck | null {
  const filePath = path.join(DECKS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseDeckFile(filePath);
}

function parseDeckFile(filePath: string): Deck {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data, content: body } = matter(content);

  const slug = path.basename(filePath, ".md");

  const cards = parseMarkdownTable(body);

  return {
    slug,
    name: data.name || slug,
    description: data.description || "",
    language_from: data.language_from || "en",
    language_to: data.language_to || "de",
    cards
  };
}

function parseMarkdownTable(content: string): VocabEntry[] {
  const lines = content.split("\n").map(l => l.trim()).filter(l => l);

  // Find the table
  const tableStart = lines.findIndex(l => l.startsWith("|") && l.includes("front"));
  if (tableStart === -1) return [];

  // Skip header and separator
  const dataLines = lines.slice(tableStart + 2).filter(l => l.startsWith("|"));

  const entries: VocabEntry[] = [];

  for (const line of dataLines) {
    const cells = line.split("|").map(c => c.trim()).filter(c => c);
    if (cells.length >= 2) {
      entries.push({
        front: cells[0],
        back: cells[1],
        notes: cells[2] || undefined
      });
    }
  }

  return entries;
}
