'use client';

import { useState } from 'react';
import { ArrowLeft, Download, RefreshCw, BookOpen, HelpCircle, Target, Copy, Check, FileText, X, Trash2 } from 'lucide-react';
import { GeneratedContent } from './QAGenerator';

// Helper function to render text with bold markdown
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

interface ResultsDisplayProps {
  generatedContent: GeneratedContent;
  onBack: () => void;
  onReset: () => void;
  onUpdateContent: (content: GeneratedContent) => void;
}

export function ResultsDisplay({ generatedContent, onBack, onReset, onUpdateContent }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'glossary' | 'review' | 'assessment' | 'objective'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});


  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (!generatedContent.reviewQuestions && !generatedContent.assessmentQuestions) {
      alert('No questions available to export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewQuestions: generatedContent.reviewQuestions || [],
          assessmentQuestions: generatedContent.assessmentQuestions || [],
          format
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qa-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      // Strip markdown bold formatting for clean paste into Google Docs
      const cleanText = text.replace(/\*\*/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDeleteGlossaryTerm = (index: number) => {
    if (!confirm('Are you sure you want to delete this glossary term?')) {
      return;
    }
    const updatedGlossary = [...(generatedContent.glossary || [])];
    updatedGlossary.splice(index, 1);
    onUpdateContent({ ...generatedContent, glossary: updatedGlossary });
  };

  const handleDeleteQuestion = async (type: 'review' | 'assessment', index: number, shouldReplace: boolean = false) => {
    const questionType = type === 'review' ? 'review question' : 'assessment question';
    const message = shouldReplace
      ? `Delete this ${questionType} and generate a replacement?`
      : `Are you sure you want to delete this ${questionType}?`;

    if (!confirm(message)) {
      return;
    }

    const questionsKey = type === 'review' ? 'reviewQuestions' : 'assessmentQuestions';
    const updatedQuestions = [...(generatedContent[questionsKey] || [])];
    updatedQuestions.splice(index, 1);

    onUpdateContent({ ...generatedContent, [questionsKey]: updatedQuestions });

    // If replace is requested, generate a new question
    if (shouldReplace) {
      // This would need to call the API to generate 1 new question
      // For now, we'll just show an alert
      alert('Regeneration feature coming soon! The question has been deleted.');
    }
  };



  const handleGlossaryPDFExport = async () => {
    if (!generatedContent.glossary) {
      alert('No glossary available to export');
      return;
    }

    setIsExporting(true);
    try {
      const { PDFGenerator } = await import('@/lib/pdf-generator');
      const filename = `glossary-${new Date().toISOString().slice(0, 10)}.pdf`;
      await PDFGenerator.generateGlossaryPDF(generatedContent.glossary, filename);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Course Overview', icon: FileText, count: generatedContent.courseOverview ? 1 : 0 },
    { id: 'glossary' as const, label: 'Glossary', icon: BookOpen, count: generatedContent.glossary?.length },
    { id: 'review' as const, label: 'Review Questions', icon: HelpCircle, count: generatedContent.reviewQuestions?.length },
    { id: 'assessment' as const, label: 'Assessment Questions', icon: HelpCircle, count: generatedContent.assessmentQuestions?.length },
    { id: 'objective' as const, label: 'Learning Objective', icon: Target, count: generatedContent.learningObjective ? 1 : 0 }
  ].filter(tab => tab.count && tab.count > 0);

  // Set first available tab as active if current tab has no content
  if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Content</h2>
          <p className="text-gray-600">
            Review and export your generated educational content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Upload</span>
          </button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="space-y-3">
        {(generatedContent.reviewQuestions || generatedContent.assessmentQuestions) && (
          <div className="flex items-center justify-end space-x-3 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Export Questions:</span>
            <button
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Separate CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Course Overview */}
        {activeTab === 'overview' && generatedContent.courseOverview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Course Overview</h3>
              <button
                onClick={() => copyToClipboard(generatedContent.courseOverview!, 'overview')}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedStates.overview ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStates.overview ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="prose prose-sm max-w-none">
                {generatedContent.courseOverview.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 mb-4 last:mb-0 leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* Glossary */}
        {activeTab === 'glossary' && generatedContent.glossary && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Glossary Terms</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleGlossaryPDFExport()}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => copyToClipboard(
                    generatedContent.glossary!.map(term => `**${term.term}.** ${term.definition}`).join('\n'),
                    'glossary'
                  )}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {copiedStates.glossary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedStates.glossary ? 'Copied!' : 'Copy All'}</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {generatedContent.glossary.map((term, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{term.term}</h4>
                      <p className="text-gray-700 mt-1">{term.definition}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyToClipboard(`**${term.term}.** ${term.definition}`, `term-${index}`)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy term"
                      >
                        {copiedStates[`term-${index}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteGlossaryTerm(index)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete term"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Questions */}
        {activeTab === 'review' && generatedContent.reviewQuestions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Review Questions</h3>
              <button
                onClick={() => copyToClipboard(
                  generatedContent.reviewQuestions!.map((q) =>
                    `${q.question}\na) ${q.options.a}\nb) ${q.options.b}\nc) ${q.options.c}\nd) ${q.options.d}\n\n**Answer Explanation:**\na) ${q.explanations.a}\nb) ${q.explanations.b}\nc) ${q.explanations.c}\nd) ${q.explanations.d}`
                  ).join('\n\n'),
                  'review'
                )}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedStates.review ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStates.review ? 'Copied!' : 'Copy All'}</span>
              </button>
            </div>
            <div className="space-y-6">
              {generatedContent.reviewQuestions.map((question, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex-1">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => copyToClipboard(
                          `${question.question}\na) ${question.options.a}\nb) ${question.options.b}\nc) ${question.options.c}\nd) ${question.options.d}\n\n**Answer Explanation:**\na) ${question.explanations.a}\nb) ${question.explanations.b}\nc) ${question.explanations.c}\nd) ${question.explanations.d}`,
                          `review-${index}`
                        )}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy question"
                      >
                        {copiedStates[`review-${index}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion('review', index, false)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div key={key} className={`p-2 rounded ${question.correctAnswer === key ? 'bg-green-100 border border-green-300' : 'bg-white'}`}>
                        <span className="font-medium">{key})</span> {value}
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <h5 className="font-bold text-gray-900 mb-2">Answer Explanation:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(question.explanations).map(([key, value]) => (
                        <div key={key} className="text-gray-700">
                          <span className="font-medium">{key})</span> {renderBoldText(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Questions */}
        {activeTab === 'assessment' && generatedContent.assessmentQuestions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Assessment Questions</h3>
              <button
                onClick={() => copyToClipboard(
                  generatedContent.assessmentQuestions!.map((q) =>
                    `${q.question}\na) ${q.options.a}\nb) ${q.options.b}\nc) ${q.options.c}\nd) ${q.options.d}\n\n**Answer Explanation:**\na) ${q.explanations.a}\nb) ${q.explanations.b}\nc) ${q.explanations.c}\nd) ${q.explanations.d}`
                  ).join('\n\n'),
                  'assessment'
                )}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedStates.assessment ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStates.assessment ? 'Copied!' : 'Copy All'}</span>
              </button>
            </div>
            <div className="space-y-6">
              {generatedContent.assessmentQuestions.map((question, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex-1">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => copyToClipboard(
                          `${question.question}\na) ${question.options.a}\nb) ${question.options.b}\nc) ${question.options.c}\nd) ${question.options.d}\n\n**Answer Explanation:**\na) ${question.explanations.a}\nb) ${question.explanations.b}\nc) ${question.explanations.c}\nd) ${question.explanations.d}`,
                          `assessment-${index}`
                        )}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy question"
                      >
                        {copiedStates[`assessment-${index}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion('assessment', index, false)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div key={key} className={`p-2 rounded ${question.correctAnswer === key ? 'bg-green-100 border border-green-300' : 'bg-white'}`}>
                        <span className="font-medium">{key})</span> {value}
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <h5 className="font-bold text-gray-900 mb-2">Answer Explanation:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(question.explanations).map(([key, value]) => (
                        <div key={key} className="text-gray-700">
                          <span className="font-medium">{key})</span> {renderBoldText(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Objective */}
        {activeTab === 'objective' && generatedContent.learningObjective && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Learning Objective</h3>
              <button
                onClick={() => copyToClipboard(generatedContent.learningObjective!.objective, 'objective')}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {copiedStates.objective ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStates.objective ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 text-lg leading-relaxed">
                {generatedContent.learningObjective.objective}
              </p>
              <div className="mt-3 text-sm text-gray-600">
                Character count: {generatedContent.learningObjective.characterCount}/160
              </div>
            </div>
          </div>
        )}
      </div>

      {tabs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No content was generated. Please go back and select content options.</p>
        </div>
      )}
    </div>
  );
}
