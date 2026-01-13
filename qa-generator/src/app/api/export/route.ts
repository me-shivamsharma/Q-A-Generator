import { NextRequest, NextResponse } from 'next/server';
import { CSVExporter } from '@/lib/csv-exporter';
import { MCQQuestion } from '@/lib/ai-service';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { reviewQuestions, assessmentQuestions, format = 'xlsx' } = await request.json();

    if (!reviewQuestions && !assessmentQuestions) {
      return NextResponse.json(
        { error: 'At least one set of questions is required' },
        { status: 400 }
      );
    }

    const review: MCQQuestion[] = reviewQuestions || [];
    const assessment: MCQQuestion[] = assessmentQuestions || [];

    if (format === 'xlsx') {
      try {
        console.log('Generating XLSX with:', { reviewCount: review.length, assessmentCount: assessment.length });
        const buffer = CSVExporter.generateXLSX(review, assessment);
        console.log('XLSX buffer generated, size:', buffer.length);
        const filename = CSVExporter.generateFilename();

        return new NextResponse(buffer as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (xlsxError) {
        console.error('XLSX generation error:', xlsxError);
        throw xlsxError;
      }
    } else if (format === 'csv') {
      // Generate separate CSV files in a ZIP
      const zip = new JSZip();

      const { reviewCSV, assessmentCSV } = CSVExporter.generateSeparateCSVStrings(review, assessment);

      if (review.length > 0) {
        zip.file('review-questions.csv', reviewCSV);
      }
      if (assessment.length > 0) {
        zip.file('assessment-questions.csv', assessmentCSV);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const filename = CSVExporter.generateFilename().replace('.xlsx', '.zip');

      return new NextResponse(zipBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "xlsx" or "csv"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    );
  }
}
