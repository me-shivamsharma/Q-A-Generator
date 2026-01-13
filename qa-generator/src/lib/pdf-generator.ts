import { GlossaryTerm } from './ai-service';

export class PDFGenerator {
  static async generateGlossaryPDF(terms: GlossaryTerm[], filename: string = 'glossary.pdf'): Promise<void> {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Glossary', 20, 20);
    
    // Reset font for content
    doc.setFontSize(11);
    let yPosition = 35;
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;
    const lineHeight = 7;
    const maxWidth = 170;

    terms.forEach((term, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = 20;
      }

      // Term (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(`${term.term}.`, 20, yPosition);
      yPosition += lineHeight;

      // Definition (normal)
      doc.setFont('helvetica', 'normal');
      const definitionLines = doc.splitTextToSize(term.definition, maxWidth);
      definitionLines.forEach((line: string) => {
        if (yPosition > pageHeight - marginBottom) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += lineHeight;
      });

      // Add spacing between terms
      yPosition += 3;
    });

    // Save the PDF
    doc.save(filename);
  }
}

