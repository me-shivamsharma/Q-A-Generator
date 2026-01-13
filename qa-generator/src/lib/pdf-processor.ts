import pdf from 'pdf-parse';

export interface ProcessedPDF {
  text: string;
  pages: number;
  filename: string;
}

export class PDFProcessor {
  static async extractText(buffer: Buffer, filename: string): Promise<ProcessedPDF> {
    try {
      const data = await pdf(buffer);
      
      return {
        text: data.text,
        pages: data.numpages,
        filename
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validatePDF(buffer: Buffer): boolean {
    // Check if buffer starts with PDF signature
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    return buffer.subarray(0, 4).equals(pdfSignature);
  }

  static cleanText(text: string): string {
    // Remove excessive whitespace and normalize line breaks
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }
}
