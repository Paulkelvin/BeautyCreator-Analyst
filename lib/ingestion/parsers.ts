import Papa from "papaparse";
import { readSheet, type Row } from "read-excel-file/node";

export async function parseUploadedComments(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "json") {
    const parsed = JSON.parse(buffer.toString("utf8"));
    return Array.isArray(parsed) ? parsed : parsed.comments ?? parsed.data ?? [];
  }

  if (extension === "csv") {
    const parsed = Papa.parse<Record<string, unknown>>(buffer.toString("utf8"), {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors.map((error) => error.message).join("; "));
    }

    return parsed.data;
  }

  if (extension === "xlsx") {
    const rows = await readSheet(buffer);
    const [headers, ...body] = rows;
    if (!headers) {
      return [];
    }

    return body.map((row: Row) =>
      Object.fromEntries(headers.map((header, index: number) => [String(header), row[index] ?? ""]))
    );
  }

  throw new Error("Unsupported file type. Upload CSV, XLSX, or JSON.");
}
