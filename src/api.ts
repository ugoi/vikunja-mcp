const ZERO_DATE = "0001-01-01T00:00:00Z";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class VikunjaClient {
  constructor(
    private baseUrl: string,
    private token: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    const init: RequestInit = { method: opts.method ?? "GET", headers };

    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, init);
    const data = await res.json();

    if (!res.ok) {
      const msg = (data as { message?: string }).message ?? res.statusText;
      throw new Error(`Vikunja API ${res.status}: ${msg}`);
    }
    return data as T;
  }

  // --- Projects ---

  async listProjects(page = 1, perPage = 50) {
    return this.request<any[]>("/projects", {
      params: { page, per_page: perPage },
    });
  }

  async getProject(id: number) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(data: { title: string; description?: string; parent_project_id?: number; hex_color?: string }) {
    return this.request<any>("/projects", { method: "PUT", body: data });
  }

  async updateProject(id: number, data: Record<string, unknown>) {
    return this.request<any>(`/projects/${id}`, { method: "POST", body: data });
  }

  async deleteProject(id: number) {
    return this.request<any>(`/projects/${id}`, { method: "DELETE" });
  }

  // --- Tasks ---

  async listTasks(params: { project_id?: number; page?: number; per_page?: number; sort_by?: string; order_by?: string; filter?: string; search?: string } = {}) {
    if (params.project_id) {
      const { project_id, ...rest } = params;
      return this.request<any[]>(`/projects/${project_id}/tasks`, { params: rest as any });
    }
    return this.request<any[]>("/tasks/all", { params: params as any });
  }

  async getTask(id: number) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(projectId: number, data: { title: string; description?: string; priority?: number; due_date?: string; labels?: any[]; done?: boolean }) {
    return this.request<any>(`/projects/${projectId}/tasks`, { method: "PUT", body: data });
  }

  async updateTask(id: number, data: Record<string, unknown>) {
    return this.request<any>(`/tasks/${id}`, { method: "POST", body: data });
  }

  async deleteTask(id: number) {
    return this.request<any>(`/tasks/${id}`, { method: "DELETE" });
  }

  async bulkCreateTasks(projectId: number, tasks: { title: string; description?: string; priority?: number; due_date?: string }[]) {
    const results: { index: number; task?: any; error?: string }[] = [];
    for (let i = 0; i < tasks.length; i++) {
      try {
        const task = await this.createTask(projectId, tasks[i]);
        results.push({ index: i, task });
      } catch (e: any) {
        results.push({ index: i, error: e.message });
      }
    }
    return results;
  }

  // --- Labels ---

  async listLabels(page = 1, perPage = 50) {
    return this.request<any[]>("/labels", { params: { page, per_page: perPage } });
  }

  async createLabel(data: { title: string; hex_color?: string; description?: string }) {
    return this.request<any>("/labels", { method: "PUT", body: data });
  }

  async addLabelToTask(taskId: number, labelId: number) {
    return this.request<any>(`/tasks/${taskId}/labels`, { method: "PUT", body: { label_id: labelId } });
  }

  async removeLabelFromTask(taskId: number, labelId: number) {
    return this.request<any>(`/tasks/${taskId}/labels/${labelId}`, { method: "DELETE" });
  }

  // --- Comments ---

  async listComments(taskId: number) {
    return this.request<any[]>(`/tasks/${taskId}/comments`);
  }

  async createComment(taskId: number, comment: string) {
    return this.request<any>(`/tasks/${taskId}/comments`, { method: "PUT", body: { comment } });
  }
}

export function cleanTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    done: t.done,
    priority: t.priority,
    project_id: t.project_id,
    due_date: t.due_date === ZERO_DATE ? undefined : t.due_date,
    labels: t.labels?.map((l: any) => ({ id: l.id, title: l.title })) ?? [],
    assignees: t.assignees?.map((a: any) => ({ id: a.id, username: a.username })) ?? [],
    percent_done: t.percent_done,
    identifier: t.identifier,
    created: t.created,
    updated: t.updated,
  };
}

export function cleanProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    description: p.description || undefined,
    is_archived: p.is_archived,
    parent_project_id: p.parent_project_id || undefined,
    created: p.created,
    updated: p.updated,
  };
}
