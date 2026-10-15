const API_BASE = '/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: any;
}

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('garaa-token');
  }

  private static getOrgId(): string | null {
    return localStorage.getItem('garaa-org-id');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const orgId = this.getOrgId();
    if (orgId && !headers.has('X-Organization-Id')) {
      headers.set('X-Organization-Id', orgId);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      data: null as any,
      error: `Network error: ${response.statusText}`
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data.data;
  }

  // Auth Endpoints
  public static async register(payload: { companyName: string; fullName: string; email: string; password: string }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async login(payload: { email: string; password: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async getProfile() {
    return this.request<any>('/auth/me');
  }

  // Dashboard Stats
  public static async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Verifications
  public static async listVerifications(params?: { status?: string; category?: string; search?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ total: number; items: any[] }>(`/verifications${qs ? `?${qs}` : ''}`);
  }

  public static async getVerification(id: string) {
    return this.request<any>(`/verifications/${id}`);
  }

  public static async createVerification(payload: {
    subjectName: string;
    documentCategory: string;
    documentId?: string;
    subjectDob?: string;
    declaredIdentifier?: string;
    extractedText?: string;
  }) {
    return this.request<any>('/verifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async submitReviewDecision(id: string, decision: 'VERIFIED' | 'REJECTED' | 'UNABLE_TO_VERIFY', notes: string) {
    return this.request<any>(`/verifications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes })
    });
  }

  // Document Upload
  public static async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ document: any; duplicates: string[] }>('/documents/upload', {
      method: 'POST',
      body: formData
    });
  }

  public static getDownloadUrl(documentId: string): string {
    return `${API_BASE}/documents/${documentId}/download`;
  }

  // Reports
  public static async getReport(id: string) {
    return this.request<any>(`/reports/${id}`);
  }

  public static getCsvUrl(id: string): string {
    return `${API_BASE}/reports/${id}/csv`;
  }

  // API Keys
  public static async listApiKeys() {
    return this.request<any[]>('/api-keys');
  }

  public static async createApiKey(name: string, scopes?: string[]) {
    return this.request<any>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes })
    });
  }

  public static async revokeApiKey(id: string) {
    return this.request<any>(`/api-keys/${id}`, {
      method: 'DELETE'
    });
  }

  // Webhooks
  public static async listWebhooks() {
    return this.request<any[]>('/webhooks');
  }

  public static async createWebhook(payload: { url: string; description?: string; events?: string[] }) {
    return this.request<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async deleteWebhook(id: string) {
    return this.request<any>(`/webhooks/${id}`, {
      method: 'DELETE'
    });
  }

  public static async testWebhook(id: string) {
    return this.request<any>(`/webhooks/${id}/test`, {
      method: 'POST'
    });
  }

  public static async listWebhookDeliveries() {
    return this.request<any[]>('/webhooks/deliveries');
  }

  // Organization & Members
  public static async getOrganization() {
    return this.request<any>('/organizations/current');
  }

  public static async listMembers() {
    return this.request<any[]>('/organizations/members');
  }

  public static async inviteMember(payload: { email: string; fullName: string; role: 'ADMIN' | 'MEMBER' | 'REVIEWER' }) {
    return this.request<any>('/organizations/members/invite', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async removeMember(id: string) {
    return this.request<any>(`/organizations/members/${id}`, {
      method: 'DELETE'
    });
  }

  // Audit Logs
  public static async listAuditLogs() {
    return this.request<any[]>('/audit-logs');
  }

  // Support
  public static async sendFeedback(feedback: string, userEmail?: string) {
    return this.request<any>('/support/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedback, userEmail })
    });
  }

  public static async sendBugReport(report: string, userEmail?: string) {
    return this.request<any>('/support/bug', {
      method: 'POST',
      body: JSON.stringify({ report, userEmail })
    });
  }

  // Intelligence
  public static async screenIntelligence(subjectName: string, documentIdentifier?: string) {
    return this.request<any>('/intelligence/screen', {
      method: 'POST',
      body: JSON.stringify({ subjectName, documentIdentifier })
    });
  }

  // Admin
  public static async getAdminOverview() {
    return this.request<any>('/admin/overview');
  }

  public static async getAdminReviewQueue() {
    return this.request<any[]>('/admin/review-queue');
  }
}
