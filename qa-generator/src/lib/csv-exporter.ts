import * as XLSX from 'xlsx';
import { MCQQuestion } from './ai-service';

export interface CSVRow {
  question: string;
  optionA: string;
  explanationA: string;
  optionB: string;
  explanationB: string;
  optionC: string;
  explanationC: string;
  optionD: string;
  explanationD: string;
  correctOption: string;
}

export class CSVExporter {
  // Helper function to strip markdown bold formatting
  private static stripMarkdown(text: string): string {
    return text.replace(/\*\*/g, '');
  }

  // Helper function to check if text contains "Correct –" (indicating it should be bold)
  private static isCorrectAnswer(text: string): boolean {
    return text.includes('Correct –') || text.includes('**Correct');
  }

  static convertQuestionsToCSV(questions: MCQQuestion[]): CSVRow[] {
    return questions.map(q => ({
      question: q.question,
      optionA: q.options.a,
      explanationA: this.stripMarkdown(q.explanations.a),
      optionB: q.options.b,
      explanationB: this.stripMarkdown(q.explanations.b),
      optionC: q.options.c,
      explanationC: this.stripMarkdown(q.explanations.c),
      optionD: q.options.d,
      explanationD: this.stripMarkdown(q.explanations.d),
      correctOption: q.correctAnswer
    }));
  }

  static generateXLSX(reviewQuestions: MCQQuestion[], assessmentQuestions: MCQQuestion[]): Buffer {
    // Define header row
    const headerRow = [
      'Question',
      'Option A',
      'Explanation A',
      'Option B',
      'Explanation B',
      'Option C',
      'Explanation C',
      'Option D',
      'Explanation D',
      'Correct Option'
    ];

    // Combine all questions in order
    const reviewData = this.convertQuestionsToCSV(reviewQuestions);
    const assessmentData = this.convertQuestionsToCSV(assessmentQuestions);

    // Create worksheet data with headers
    const reviewWorksheetData = [
      headerRow,
      ...reviewData.map(row => [
        row.question,
        row.optionA,
        row.explanationA,
        row.optionB,
        row.explanationB,
        row.optionC,
        row.explanationC,
        row.optionD,
        row.explanationD,
        row.correctOption
      ])
    ];

    const assessmentWorksheetData = [
      headerRow,
      ...assessmentData.map(row => [
        row.question,
        row.optionA,
        row.explanationA,
        row.optionB,
        row.explanationB,
        row.optionC,
        row.explanationC,
        row.optionD,
        row.explanationD,
        row.correctOption
      ])
    ];

    // Create workbook with separate worksheets
    const workbook = XLSX.utils.book_new();

    // Always create at least one worksheet to avoid "Workbook is empty" error
    if (reviewQuestions.length > 0) {
      const reviewWorksheet = XLSX.utils.aoa_to_sheet(reviewWorksheetData);
      try {
        this.applyHeaderFormatting(reviewWorksheet);
        this.applyBoldFormatting(reviewWorksheet, reviewQuestions);
      } catch (formatError) {
        console.warn('Formatting error, continuing without formatting:', formatError);
      }
      XLSX.utils.book_append_sheet(workbook, reviewWorksheet, 'Review Questions');
    } else {
      // Create empty worksheet with just headers if no review questions
      const emptyReviewWorksheet = XLSX.utils.aoa_to_sheet([headerRow]);
      try {
        this.applyHeaderFormatting(emptyReviewWorksheet);
      } catch (formatError) {
        console.warn('Formatting error, continuing without formatting:', formatError);
      }
      XLSX.utils.book_append_sheet(workbook, emptyReviewWorksheet, 'Review Questions');
    }

    if (assessmentQuestions.length > 0) {
      const assessmentWorksheet = XLSX.utils.aoa_to_sheet(assessmentWorksheetData);
      try {
        this.applyHeaderFormatting(assessmentWorksheet);
        this.applyBoldFormatting(assessmentWorksheet, assessmentQuestions);
      } catch (formatError) {
        console.warn('Formatting error, continuing without formatting:', formatError);
      }
      XLSX.utils.book_append_sheet(workbook, assessmentWorksheet, 'Assessment Questions');
    } else {
      // Create empty worksheet with just headers if no assessment questions
      const emptyAssessmentWorksheet = XLSX.utils.aoa_to_sheet([headerRow]);
      try {
        this.applyHeaderFormatting(emptyAssessmentWorksheet);
      } catch (formatError) {
        console.warn('Formatting error, continuing without formatting:', formatError);
      }
      XLSX.utils.book_append_sheet(workbook, emptyAssessmentWorksheet, 'Assessment Questions');
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // Apply bold formatting to header row
  private static applyHeaderFormatting(worksheet: XLSX.WorkSheet): void {
    const headerRow = 0;
    const numColumns = 10; // Question, Option A, Explanation A, Option B, Explanation B, Option C, Explanation C, Option D, Explanation D, Correct Option

    for (let col = 0; col < numColumns; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = worksheet[cellAddress];

      if (cell) {
        if (!cell.s) cell.s = {};
        cell.s.font = { bold: true };
      }
    }
  }

  // Apply bold formatting to cells containing correct answers
  private static applyBoldFormatting(worksheet: XLSX.WorkSheet, questions: MCQQuestion[]): void {
    questions.forEach((question, rowIndex) => {
      // Data starts at row 1 (row 0 is header), so add 1 to rowIndex
      const dataRowIndex = rowIndex + 1;
      // Column indices: 0=question, 1=optA, 2=explA, 3=optB, 4=explB, 5=optC, 6=explC, 7=optD, 8=explD, 9=correct
      const explanationColumns = [2, 4, 6, 8]; // Columns for explanations A, B, C, D
      const options = ['a', 'b', 'c', 'd'];

      explanationColumns.forEach((colIndex, optIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: dataRowIndex, c: colIndex });
        const cell = worksheet[cellAddress];

        if (cell && this.isCorrectAnswer(question.explanations[options[optIndex] as 'a' | 'b' | 'c' | 'd'])) {
          // Apply bold formatting to correct answer cells
          if (!cell.s) cell.s = {};
          cell.s.font = { bold: true };
        }
      });
    });
  }

  static generateCSVString(reviewQuestions: MCQQuestion[], assessmentQuestions: MCQQuestion[]): string {
    const allQuestions = [...reviewQuestions, ...assessmentQuestions];
    const csvData = this.convertQuestionsToCSV(allQuestions);

    // Convert to CSV string without headers
    const csvRows = csvData.map(row => [
      this.escapeCSVField(row.question),
      this.escapeCSVField(row.optionA),
      this.escapeCSVField(row.explanationA),
      this.escapeCSVField(row.optionB),
      this.escapeCSVField(row.explanationB),
      this.escapeCSVField(row.optionC),
      this.escapeCSVField(row.explanationC),
      this.escapeCSVField(row.optionD),
      this.escapeCSVField(row.explanationD),
      row.correctOption
    ].join(','));

    return csvRows.join('\n');
  }

  static generateSeparateCSVStrings(reviewQuestions: MCQQuestion[], assessmentQuestions: MCQQuestion[]): {
    reviewCSV: string;
    assessmentCSV: string;
  } {
    const reviewData = this.convertQuestionsToCSV(reviewQuestions);
    const assessmentData = this.convertQuestionsToCSV(assessmentQuestions);

    const reviewCSV = reviewData.map(row => [
      this.escapeCSVField(row.question),
      this.escapeCSVField(row.optionA),
      this.escapeCSVField(row.explanationA),
      this.escapeCSVField(row.optionB),
      this.escapeCSVField(row.explanationB),
      this.escapeCSVField(row.optionC),
      this.escapeCSVField(row.explanationC),
      this.escapeCSVField(row.optionD),
      this.escapeCSVField(row.explanationD),
      row.correctOption
    ].join(',')).join('\n');

    const assessmentCSV = assessmentData.map(row => [
      this.escapeCSVField(row.question),
      this.escapeCSVField(row.optionA),
      this.escapeCSVField(row.explanationA),
      this.escapeCSVField(row.optionB),
      this.escapeCSVField(row.explanationB),
      this.escapeCSVField(row.optionC),
      this.escapeCSVField(row.explanationC),
      this.escapeCSVField(row.optionD),
      this.escapeCSVField(row.explanationD),
      row.correctOption
    ].join(',')).join('\n');

    return { reviewCSV, assessmentCSV };
  }

  private static escapeCSVField(field: string): string {
    // Escape quotes and wrap in quotes if necessary
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  static generateFilename(prefix: string = 'qa-export'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.xlsx`;
  }
}
