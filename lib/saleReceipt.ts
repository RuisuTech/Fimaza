import { escapeHtml } from '@/lib/export';

export interface SaleReceiptItem {
  producto: string;
  talla: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface SaleReceiptData {
  comprobante: string;
  fecha: string;
  cliente: string;
  documentoCliente?: string;
  items: SaleReceiptItem[];
  subtotal: number;
  igv: number;
  total: number;
}

export function buildSaleReceiptHtml(data: SaleReceiptData): string {
  const rows = data.items
    .map(
      item => `
        <tr>
          <td>${escapeHtml(item.producto)}</td>
          <td style="text-align:center">${escapeHtml(item.talla)}</td>
          <td style="text-align:center">${item.cantidad}</td>
          <td style="text-align:right">S/ ${item.precio.toFixed(2)}</td>
          <td style="text-align:right">S/ ${item.subtotal.toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #0B2545; padding: 32px; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .muted { color: #64748b; font-size: 12px; }
          .header { border-bottom: 2px solid #255bb3; padding-bottom: 16px; margin-bottom: 20px; }
          .meta { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #EEF4FB; color: #334155; font-size: 11px; text-align: left; padding: 10px; border-bottom: 1px solid #D5DCE6; }
          td { padding: 10px; border-bottom: 1px solid #E8EDF3; font-size: 12px; }
          .totals { margin-left: auto; width: 260px; margin-top: 20px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
          .total { border-top: 2px solid #D5DCE6; margin-top: 8px; padding-top: 12px; font-size: 20px; font-weight: bold; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8EDF3; text-align: center; color: #64748b; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FIMAZA</h1>
          <div class="muted">BOLETA ELECTRÓNICA</div>
        </div>
        <div class="meta">
          <div>
            <strong>${escapeHtml(data.comprobante)}</strong><br />
            <span class="muted">${escapeHtml(data.fecha)}</span>
          </div>
          <div>
            <strong>${escapeHtml(data.cliente)}</strong><br />
            <span class="muted">${escapeHtml(data.documentoCliente ?? '')}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align:center">Talla</th>
              <th style="text-align:center">Cant.</th>
              <th style="text-align:right">Precio</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><strong>S/ ${data.subtotal.toFixed(2)}</strong></div>
          <div><span>IGV 18%</span><strong>S/ ${data.igv.toFixed(2)}</strong></div>
          <div class="total"><span>Total</span><span>S/ ${data.total.toFixed(2)}</span></div>
        </div>
        <div class="footer">Gracias por su compra · Fimaza Multiplataforma</div>
      </body>
    </html>`;
}
