import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadOnWeb(filename: string, content: string, mimeType: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function exportCsv(
  filename: string,
  rows: (string | number)[][],
): Promise<void> {
  const csv = rows
    .map(row =>
      row
        .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\r\n');
  const content = `\uFEFF${csv}`;

  if (downloadOnWeb(filename, content, 'text/csv;charset=utf-8')) return;

  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error('No hay una carpeta temporal disponible.');

  const uri = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('La hoja de compartir no está disponible.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar CSV',
    UTI: 'public.comma-separated-values-text',
  });
}

export async function exportPdf(html: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('El navegador bloqueó la ventana de impresión.');
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('La hoja de compartir no está disponible.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Descargar PDF',
    UTI: 'com.adobe.pdf',
  });
}
