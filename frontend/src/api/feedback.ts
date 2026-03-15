import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackPayload {
  type: 'NPS' | 'FEATURE_REQUEST' | 'CSAT';
  score?: number;
  comment: string | null;
  title?: string;
  page: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const feedbackApi = {
  /**
   * GET /api/feedback/should-show → ApiResponse<Boolean>
   * The API client interceptor already unwraps ApiResponse.data,
   * so response.data is the Boolean value directly.
   */
  shouldShow: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<boolean>('/feedback/should-show');
      // After interceptor unwraps ApiResponse, response.data is the boolean
      return response.data === true;
    } catch {
      return false;
    }
  },

  /**
   * POST /api/feedback → ApiResponse<Void>
   * Backend expects SubmitFeedbackRequest: { type, score, comment, page }
   */
  submit: async (data: FeedbackPayload): Promise<void> => {
    await apiClient.post('/feedback', data);
  },
};
