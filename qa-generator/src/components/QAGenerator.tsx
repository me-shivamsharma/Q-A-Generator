'use client';

import { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { GenerationForm } from './GenerationForm';
import { ResultsDisplay } from './ResultsDisplay';
import { GlossaryTerm, MCQQuestion, LearningObjective } from '@/lib/ai-service';

export interface GeneratedContent {
  glossary?: GlossaryTerm[];
  reviewQuestions?: MCQQuestion[];
  assessmentQuestions?: MCQQuestion[];
  learningObjective?: LearningObjective;
  courseOverview?: string;
}

export interface ProcessedFile {
  sessionId: string;
  text: string;
  pages: number;
  filename: string;
  wordCount: number;
}

export function QAGenerator() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'generate' | 'results'>('upload');
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileProcessed = (file: ProcessedFile) => {
    setProcessedFile(file);
    setCurrentStep('generate');
    setError(null);
  };

  const handleGenerate = async (options: {
    generateGlossary: boolean;
    generateReviewQuestions: boolean;
    generateAssessmentQuestions: boolean;
    generateLearningObjective: boolean;
    generateCourseOverview: boolean;
    numReviewQuestions: number;
    numAssessmentQuestions: number;
    previousTerms: string[];
  }) => {
    if (!processedFile) return;

    setIsGenerating(true);
    setError(null);
    const content: GeneratedContent = {};

    try {
      // Generate content based on selected options
      const promises: Promise<void>[] = [];

      if (options.generateGlossary) {
        promises.push(
          fetch('/api/generate/glossary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              transcriptText: processedFile.text,
              previousTerms: options.previousTerms,
              sessionId: processedFile.sessionId
            })
          }).then(res => res.json()).then(data => {
            if (data.success) content.glossary = data.data;
          })
        );
      }

      if (options.generateReviewQuestions) {
        promises.push(
          fetch('/api/generate/review-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              transcriptText: processedFile.text,
              numQuestions: options.numReviewQuestions,
              sessionId: processedFile.sessionId
            })
          }).then(res => res.json()).then(data => {
            if (data.success) content.reviewQuestions = data.data;
          })
        );
      }

      if (options.generateAssessmentQuestions) {
        promises.push(
          fetch('/api/generate/assessment-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              transcriptText: processedFile.text,
              numQuestions: options.numAssessmentQuestions,
              sessionId: processedFile.sessionId
            })
          }).then(res => res.json()).then(data => {
            if (data.success) content.assessmentQuestions = data.data;
          })
        );
      }

      if (options.generateLearningObjective) {
        promises.push(
          fetch('/api/generate/learning-objective', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              transcriptText: processedFile.text,
              sessionId: processedFile.sessionId
            })
          }).then(res => res.json()).then(data => {
            if (data.success) content.learningObjective = data.data;
          })
        );
      }

      if (options.generateCourseOverview) {
        promises.push(
          fetch('/api/generate/course-overview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              transcriptText: processedFile.text,
              sessionId: processedFile.sessionId
            })
          }).then(res => res.json()).then(data => {
            if (data.courseOverview) content.courseOverview = data.courseOverview;
          })
        );
      }



      await Promise.all(promises);
      setGeneratedContent(content);
      setCurrentStep('results');

    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setProcessedFile(null);
    setGeneratedContent({});
    setError(null);
  };

  const handleBackToGenerate = () => {
    setCurrentStep('generate');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${
            currentStep === 'upload' ? 'text-blue-600' : 
            currentStep === 'generate' || currentStep === 'results' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'upload' ? 'bg-blue-100 border-2 border-blue-600' :
              currentStep === 'generate' || currentStep === 'results' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {currentStep === 'generate' || currentStep === 'results' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <span className="font-medium">Upload PDF</span>
          </div>

          <div className={`w-8 h-1 ${
            currentStep === 'generate' || currentStep === 'results' ? 'bg-green-600' : 'bg-gray-300'
          }`} />

          <div className={`flex items-center space-x-2 ${
            currentStep === 'generate' ? 'text-blue-600' : 
            currentStep === 'results' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'generate' ? 'bg-blue-100 border-2 border-blue-600' :
              currentStep === 'results' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {currentStep === 'results' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <span className="font-medium">Generate Content</span>
          </div>

          <div className={`w-8 h-1 ${
            currentStep === 'results' ? 'bg-green-600' : 'bg-gray-300'
          }`} />

          <div className={`flex items-center space-x-2 ${
            currentStep === 'results' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'results' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              <Download className="w-5 h-5" />
            </div>
            <span className="font-medium">View Results</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium">Generating content...</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStep === 'upload' && (
          <FileUpload onFileProcessed={handleFileProcessed} />
        )}

        {currentStep === 'generate' && processedFile && (
          <GenerationForm
            processedFile={processedFile}
            onGenerate={handleGenerate}
            onBack={handleReset}
          />
        )}

        {currentStep === 'results' && (
          <ResultsDisplay
            generatedContent={generatedContent}
            onBack={handleBackToGenerate}
            onReset={handleReset}
            onUpdateContent={setGeneratedContent}
          />
        )}
      </div>
    </div>
  );
}
