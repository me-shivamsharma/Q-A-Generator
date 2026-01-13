'use client';

import { useState } from 'react';
import { ArrowLeft, Settings, FileText, HelpCircle, Target, BookOpen } from 'lucide-react';
import { ProcessedFile } from './QAGenerator';

interface GenerationFormProps {
  processedFile: ProcessedFile;
  onGenerate: (options: {
    generateGlossary: boolean;
    generateReviewQuestions: boolean;
    generateAssessmentQuestions: boolean;
    generateLearningObjective: boolean;
    generateCourseOverview: boolean;
    numReviewQuestions: number;
    numAssessmentQuestions: number;
    previousTerms: string[];
  }) => void;
  onBack: () => void;
}

export function GenerationForm({ processedFile, onGenerate, onBack }: GenerationFormProps) {
  const [generateGlossary, setGenerateGlossary] = useState(true);
  const [generateReviewQuestions, setGenerateReviewQuestions] = useState(true);
  const [generateAssessmentQuestions, setGenerateAssessmentQuestions] = useState(true);
  const [generateLearningObjective, setGenerateLearningObjective] = useState(true);
  const [generateCourseOverview, setGenerateCourseOverview] = useState(true);

  const [numReviewQuestions, setNumReviewQuestions] = useState(5);
  const [numAssessmentQuestions, setNumAssessmentQuestions] = useState(5);
  const [previousTerms, setPreviousTerms] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const previousTermsArray = previousTerms
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0);

    onGenerate({
      generateGlossary,
      generateReviewQuestions,
      generateAssessmentQuestions,
      generateLearningObjective,
      generateCourseOverview,
      numReviewQuestions,
      numAssessmentQuestions,
      previousTerms: previousTermsArray
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Generation</h2>
          <p className="text-gray-600">
            Select what content to generate from your transcript
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* File Info */}
      <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <div>
          <p className="font-medium text-blue-900">{processedFile.filename}</p>
          <p className="text-sm text-blue-700">
            {processedFile.pages} pages • {processedFile.wordCount.toLocaleString()} words
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Generation Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Content Generation Options
          </h3>

          {/* Glossary */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="glossary"
                checked={generateGlossary}
                onChange={(e) => setGenerateGlossary(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="glossary" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span>Generate Glossary</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Extract 10-12 technical terms with definitions, alphabetically ordered
                </p>
                
                {generateGlossary && (
                  <div className="mt-3">
                    <label htmlFor="previousTerms" className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Terms to Avoid (comma-separated)
                    </label>
                    <textarea
                      id="previousTerms"
                      value={previousTerms}
                      onChange={(e) => setPreviousTerms(e.target.value)}
                      placeholder="API, Database, Authentication..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review Questions */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="reviewQuestions"
                checked={generateReviewQuestions}
                onChange={(e) => setGenerateReviewQuestions(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="reviewQuestions" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span>Generate Review Questions</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Easy-level multiple choice questions (70% True/False format)
                </p>
                
                {generateReviewQuestions && (
                  <div className="mt-3">
                    <label htmlFor="numReview" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      id="numReview"
                      min="1"
                      max="50"
                      value={numReviewQuestions}
                      onChange={(e) => setNumReviewQuestions(parseInt(e.target.value) || 5)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assessment Questions */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="assessmentQuestions"
                checked={generateAssessmentQuestions}
                onChange={(e) => setGenerateAssessmentQuestions(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="assessmentQuestions" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  <span>Generate Assessment Questions</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Moderate-level multiple choice questions (no True/False)
                </p>
                
                {generateAssessmentQuestions && (
                  <div className="mt-3">
                    <label htmlFor="numAssessment" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      id="numAssessment"
                      min="1"
                      max="50"
                      value={numAssessmentQuestions}
                      onChange={(e) => setNumAssessmentQuestions(parseInt(e.target.value) || 5)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Learning Objective */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="learningObjective"
                checked={generateLearningObjective}
                onChange={(e) => setGenerateLearningObjective(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="learningObjective" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Generate Learning Objective</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Single objective (max 160 characters) following Bloom&apos;s Taxonomy Levels 2 & 3
                </p>
              </div>
            </div>
          </div>

          {/* Course Overview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="courseOverview"
                checked={generateCourseOverview}
                onChange={(e) => setGenerateCourseOverview(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="courseOverview" className="flex items-center space-x-2 font-medium text-gray-900 cursor-pointer">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Generate Course Overview</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  2-3 paragraph overview including speaker name and title, avoiding &quot;masterclass&quot;
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={!generateGlossary && !generateReviewQuestions && !generateAssessmentQuestions && !generateLearningObjective && !generateCourseOverview}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Content
          </button>
        </div>
      </form>
    </div>
  );
}
