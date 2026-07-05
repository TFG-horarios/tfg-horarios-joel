import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export function useScheduleExport() {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const exportPDF = async (
    filename: string,
    successMessage: string = 'Horario exportado con éxito',
    errorMessage: string = 'Error al generar el PDF'
  ) => {
    if (!gridRef.current) return;
    const isDark = document.documentElement.classList.contains('dark');

    try {
      setIsExportingPDF(true);

      const node = gridRef.current;
      const width = Math.max(node.scrollWidth, node.clientWidth);
      const height = Math.max(node.scrollHeight, node.clientHeight);

      const imgData = await toPng(node, {
        backgroundColor: isDark ? '#0a0a0b' : '#ffffff',
        width,
        height,
        pixelRatio: 2,
        style: {
          margin: '0',
          transform: 'none',
          width: `${width}px`,
          height: `${height}px`,
        },
      });

      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${filename}.pdf`);
      toast.success(successMessage);
    } catch (error) {
      console.error('Error generating PDF', error);
      toast.error(errorMessage);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return { isExportingPDF, gridRef, exportPDF };
}
