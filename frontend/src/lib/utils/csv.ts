import Papa from 'papaparse';

export function downloadCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  const csvStr = Papa.unparse(data);

  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
