export const exportToCsv = (rows, fileName) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const safe = String(Array.isArray(value) ? value.join(" | ") : value ?? "");
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
