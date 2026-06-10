export type CsvRosterRow = {
  name?: string;
  email?: string;
  company?: string;
};

export function buildRosterCsv(
  rows: CsvRosterRow[],
  header = "name,email,company",
): Buffer {
  const lines = rows.map((row) =>
    [row.name ?? "", row.email ?? "", row.company ?? ""].join(","),
  );
  return Buffer.from([header, ...lines].join("\n"), "utf-8");
}

export function buildRawCsv(content: string): Buffer {
  return Buffer.from(content, "utf-8");
}

export type CsvOfferingRow = {
  name?: string;
  type?: string;
  description?: string;
  basePrice?: string;
};

export function buildOfferingCsv(
  rows: CsvOfferingRow[],
  header = "name,type,description,basePrice",
): Buffer {
  const lines = rows.map((row) =>
    [
      row.name ?? "",
      row.type ?? "",
      row.description ?? "",
      row.basePrice ?? "",
    ].join(","),
  );
  return Buffer.from([header, ...lines].join("\n"), "utf-8");
}
