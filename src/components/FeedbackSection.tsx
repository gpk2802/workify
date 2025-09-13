'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface FeedbackInsight {
  type: 'skill' | 'experience' | 'education' | 'achievement';
  description: string;
  confidence?: number;
  severity?: 'low' | 'medium' | 'high';
}

interface FeedbackRecommendation {
  type: 'skill' | 'experience' | 'presentation' | 'content';
  action: string;
  priority: 'low' | 'medium' | 'high';
}

interface Feedback {
  id: string;
  selection_probability: number;
  semantic_similarity_score: number;
  skill_coverage_score: number;
  experience_alignment_score: number;
  strengths: FeedbackInsight[];
  gaps: FeedbackInsight[];
  recommendations: FeedbackRecommendation[];
  created_at: string;
}

interface FeedbackSectionProps {
  tailorId: string;
}

export default function FeedbackSection({ tailorId }: FeedbackSectionProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [tailorId]);

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback/${tailorId}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/feedback/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tailorId }),
      });

      if (response.ok) {
        await fetchFeedback(); // Refresh feedback
      } else {
        console.error('Failed to generate feedback');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBadgeVariant = (probability: number) => {
    if (probability >= 80) return 'success' as const;
    if (probability >= 60) return 'warning' as const;
    return 'destructive' as const;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Application Feedback
          </CardTitle>
          <CardDescription>
            Analyzing your application strength...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Application Feedback
          </CardTitle>
          <CardDescription>
            Get detailed insights about your application strength
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Generate AI-powered feedback to understand your application strength
            </p>
            <Button 
              onClick={generateFeedback} 
              disabled={generating}
              className="bg-primary hover:bg-primary/90"
            >
              {generating ? 'Generating...' : 'Generate Feedback'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Probability Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Selection Probability
          </CardTitle>
          <CardDescription>
            AI-predicted likelihood of being selected for this position
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {feedback.selection_probability}%
              </span>
              <Badge variant={getProbabilityBadgeVariant(feedback.selection_probability)}>
                {feedback.selection_probability >= 80 ? 'High' : 
                 feedback.selection_probability >= 60 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <Progress value={feedback.selection_probability} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">Semantic Match</div>
                <div className="text-muted-foreground">{feedback.semantic_similarity_score}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Skill Coverage</div>
                <div className="text-muted-foreground">{feedback.skill_coverage_score}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Experience</div>
                <div className="text-muted-foreground">{feedback.experience_alignment_score}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Key Strengths
            </CardTitle>
            <CardDescription>
              Areas where your profile aligns well with the job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">{strength.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {strength.type}
                      </Badge>
                      {strength.confidence && (
                        <span className="text-xs text-green-600">
                          {Math.round(strength.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gaps */}
      {feedback.gaps && feedback.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Skills or experience that could strengthen your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.gaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getSeverityColor(gap.severity || 'medium')}`} />
                  <div>
                    <p className="font-medium text-yellow-800">{gap.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {gap.type}
                      </Badge>
                      {gap.severity && (
                        <Badge 
                          variant={gap.severity === 'high' ? 'destructive' : gap.severity === 'medium' ? 'warning' : 'secondary'}
                          className="text-xs"
                        >
                          {gap.severity} priority
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {feedback.recommendations && feedback.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to improve your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getPriorityColor(rec.priority)}`} />
                  <div>
                    <p className="font-medium text-blue-800">{rec.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
