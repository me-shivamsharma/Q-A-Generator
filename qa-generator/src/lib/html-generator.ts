import { GlossaryTerm, MCQQuestion } from './ai-service';

export class HTMLGenerator {
  static generateGlossaryHTML(terms: GlossaryTerm[], title: string = 'Glossary'): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            color: #333333;
        }
        
        h1 {
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .glossary-container {
            display: grid;
            gap: 15px;
        }
        
        .glossary-item {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 12px 15px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .term {
            font-family: Arial, sans-serif;
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .definition {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #555555;
            line-height: 1.5;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #888888;
        }
        
        @media print {
            body { font-size: 10px; }
            h1 { font-size: 12px; }
            .glossary-item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="glossary-container">
        ${terms.map(term => `
        <div class="glossary-item">
            <div class="term">${term.term}</div>
            <div class="definition">${term.definition}</div>
        </div>
        `).join('')}
    </div>
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
    
    return html.trim();
  }

  static generateQuestionsHTML(
    reviewQuestions: MCQQuestion[], 
    assessmentQuestions: MCQQuestion[], 
    title: string = 'Questions'
  ): string {
    const allQuestions = [...reviewQuestions, ...assessmentQuestions];
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            color: #333333;
        }
        
        h1 {
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 20px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        
        .question-container {
            margin-bottom: 25px;
            background: #f8f9fa;
            border-radius: 6px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .question-number {
            font-weight: bold;
            color: #3498db;
            margin-bottom: 8px;
        }
        
        .question-text {
            font-family: Arial, sans-serif;
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 12px;
        }
        
        .options {
            margin-bottom: 15px;
        }
        
        .option {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin-bottom: 5px;
            padding: 3px 0;
        }
        
        .explanations {
            background: #ffffff;
            border-radius: 4px;
            padding: 12px;
            border-left: 3px solid #27ae60;
        }
        
        .explanation-title {
            font-weight: bold;
            color: #27ae60;
            margin-bottom: 8px;
            font-size: 11px;
        }
        
        .explanation {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin-bottom: 4px;
            line-height: 1.4;
        }
        
        .correct-answer {
            font-weight: bold;
            color: #27ae60;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #888888;
        }
        
        @media print {
            body { font-size: 10px; }
            h1 { font-size: 12px; }
            h2 { font-size: 11px; }
            .question-container { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    ${reviewQuestions.length > 0 ? `
    <h2>Review Questions</h2>
    ${reviewQuestions.map((q, index) => this.generateQuestionHTML(q, index + 1)).join('')}
    ` : ''}
    
    ${assessmentQuestions.length > 0 ? `
    <h2>Assessment Questions</h2>
    ${assessmentQuestions.map((q, index) => this.generateQuestionHTML(q, index + 1)).join('')}
    ` : ''}
    
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
    
    return html.trim();
  }

  private static generateQuestionHTML(question: MCQQuestion, number: number): string {
    return `
    <div class="question-container">
        <div class="question-number">Question ${number}</div>
        <div class="question-text">${question.question}</div>
        
        <div class="options">
            <div class="option">a) ${question.options.a}</div>
            <div class="option">b) ${question.options.b}</div>
            <div class="option">c) ${question.options.c}</div>
            <div class="option">d) ${question.options.d}</div>
        </div>
        
        <div class="explanations">
            <div class="explanation-title">Answer Explanation:</div>
            <div class="explanation ${question.correctAnswer === 'a' ? 'correct-answer' : ''}">
                a) ${question.explanations.a}
            </div>
            <div class="explanation ${question.correctAnswer === 'b' ? 'correct-answer' : ''}">
                b) ${question.explanations.b}
            </div>
            <div class="explanation ${question.correctAnswer === 'c' ? 'correct-answer' : ''}">
                c) ${question.explanations.c}
            </div>
            <div class="explanation ${question.correctAnswer === 'd' ? 'correct-answer' : ''}">
                d) ${question.explanations.d}
            </div>
        </div>
    </div>`;
  }

  static generateCourseOverviewHTML(overview: string, title: string = 'Course Overview'): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            color: #333333;
        }
        
        h1 {
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .overview-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .overview-content p {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
            margin-bottom: 15px;
            text-align: justify;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #888888;
        }
        
        @media print {
            body { font-size: 10px; }
            h1 { font-size: 12px; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="overview-content">
        ${overview.split('\n\n').map(paragraph => `<p>${paragraph.trim()}</p>`).join('')}
    </div>
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
    
    return html.trim();
  }
}
