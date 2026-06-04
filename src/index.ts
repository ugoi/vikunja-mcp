#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { VikunjaClient, cleanTask, cleanProject } from "./api.js";

const apiUrl = process.env.VIKUNJA_API_URL;
const apiToken = process.env.VIKUNJA_API_TOKEN;

if (!apiUrl || !apiToken) {
  console.error("VIKUNJA_API_URL and VIKUNJA_API_TOKEN must be set");
  process.exit(1);
}

const client = new VikunjaClient(apiUrl, apiToken);

const server = new McpServer({
  name: "vikunja",
  version: "0.1.0",
});

// --- Projects ---

server.tool(
  "list_projects",
  "List all projects",
  { page: z.number().optional(), per_page: z.number().optional() },
  async ({ page, per_page }) => {
    const projects = await client.listProjects(page, per_page);
    return { content: [{ type: "text", text: JSON.stringify(projects.map(cleanProject), null, 2) }] };
  },
);

server.tool(
  "get_project",
  "Get a project by ID",
  { id: z.number().describe("Project ID") },
  async ({ id }) => {
    const project = await client.getProject(id);
    return { content: [{ type: "text", text: JSON.stringify(cleanProject(project), null, 2) }] };
  },
);

server.tool(
  "create_project",
  "Create a new project",
  {
    title: z.string(),
    description: z.string().optional(),
    parent_project_id: z.number().optional(),
    hex_color: z.string().optional(),
  },
  async (args) => {
    const project = await client.createProject(args);
    return { content: [{ type: "text", text: JSON.stringify(cleanProject(project), null, 2) }] };
  },
);

server.tool(
  "update_project",
  "Update an existing project",
  {
    id: z.number().describe("Project ID"),
    title: z.string().optional(),
    description: z.string().optional(),
    is_archived: z.boolean().optional(),
    hex_color: z.string().optional(),
  },
  async ({ id, ...data }) => {
    const project = await client.updateProject(id, data);
    return { content: [{ type: "text", text: JSON.stringify(cleanProject(project), null, 2) }] };
  },
);

server.tool(
  "delete_project",
  "Delete a project",
  { id: z.number().describe("Project ID") },
  async ({ id }) => {
    await client.deleteProject(id);
    return { content: [{ type: "text", text: `Project ${id} deleted` }] };
  },
);

// --- Tasks ---

server.tool(
  "list_tasks",
  "List tasks. Filter by project, search, or list all.",
  {
    project_id: z.number().optional().describe("Filter by project ID"),
    page: z.number().optional(),
    per_page: z.number().optional(),
    sort_by: z.string().optional().describe("Sort field: id, title, due_date, priority, done, created, updated"),
    order_by: z.string().optional().describe("asc or desc"),
    filter: z.string().optional().describe("Vikunja filter string, e.g. 'done = false && priority >= 3'"),
    search: z.string().optional().describe("Search tasks by title"),
  },
  async (args) => {
    const tasks = await client.listTasks(args);
    return { content: [{ type: "text", text: JSON.stringify(tasks.map(cleanTask), null, 2) }] };
  },
);

server.tool(
  "get_task",
  "Get a single task by ID",
  { id: z.number().describe("Task ID") },
  async ({ id }) => {
    const task = await client.getTask(id);
    return { content: [{ type: "text", text: JSON.stringify(cleanTask(task), null, 2) }] };
  },
);

server.tool(
  "create_task",
  "Create a task in a project",
  {
    project_id: z.number().describe("Project ID to create task in"),
    title: z.string(),
    description: z.string().optional(),
    priority: z.number().min(0).max(5).optional().describe("0=unset, 1=low, 2=medium, 3=high, 4=urgent, 5=do-now"),
    due_date: z.string().optional().describe("ISO 8601 date string"),
    done: z.boolean().optional(),
  },
  async ({ project_id, ...data }) => {
    const task = await client.createTask(project_id, data);
    return { content: [{ type: "text", text: JSON.stringify(cleanTask(task), null, 2) }] };
  },
);

server.tool(
  "update_task",
  "Update an existing task",
  {
    id: z.number().describe("Task ID"),
    title: z.string().optional(),
    description: z.string().optional(),
    done: z.boolean().optional(),
    priority: z.number().min(0).max(5).optional(),
    due_date: z.string().optional(),
    percent_done: z.number().min(0).max(1).optional(),
  },
  async ({ id, ...data }) => {
    const task = await client.updateTask(id, data);
    return { content: [{ type: "text", text: JSON.stringify(cleanTask(task), null, 2) }] };
  },
);

server.tool(
  "delete_task",
  "Delete a task",
  { id: z.number().describe("Task ID") },
  async ({ id }) => {
    await client.deleteTask(id);
    return { content: [{ type: "text", text: `Task ${id} deleted` }] };
  },
);

server.tool(
  "bulk_create_tasks",
  "Create multiple tasks in a project at once",
  {
    project_id: z.number().describe("Project ID"),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.number().min(0).max(5).optional(),
      due_date: z.string().optional(),
    })).describe("Array of tasks to create"),
  },
  async ({ project_id, tasks }) => {
    const results = await client.bulkCreateTasks(project_id, tasks);
    const created = results.filter((r) => r.task).length;
    const failed = results.filter((r) => r.error).length;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ created, failed, results: results.map((r) => r.task ? { id: r.task.id, title: r.task.title } : { error: r.error }) }, null, 2),
      }],
    };
  },
);

// --- Labels ---

server.tool(
  "list_labels",
  "List all labels",
  { page: z.number().optional(), per_page: z.number().optional() },
  async ({ page, per_page }) => {
    const labels = await client.listLabels(page, per_page);
    return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
  },
);

server.tool(
  "create_label",
  "Create a new label",
  {
    title: z.string(),
    hex_color: z.string().optional().describe("Hex color like #ff0000"),
    description: z.string().optional(),
  },
  async (args) => {
    const label = await client.createLabel(args);
    return { content: [{ type: "text", text: JSON.stringify(label, null, 2) }] };
  },
);

server.tool(
  "add_label_to_task",
  "Add a label to a task",
  {
    task_id: z.number().describe("Task ID"),
    label_id: z.number().describe("Label ID"),
  },
  async ({ task_id, label_id }) => {
    await client.addLabelToTask(task_id, label_id);
    return { content: [{ type: "text", text: `Label ${label_id} added to task ${task_id}` }] };
  },
);

server.tool(
  "remove_label_from_task",
  "Remove a label from a task",
  {
    task_id: z.number().describe("Task ID"),
    label_id: z.number().describe("Label ID"),
  },
  async ({ task_id, label_id }) => {
    await client.removeLabelFromTask(task_id, label_id);
    return { content: [{ type: "text", text: `Label ${label_id} removed from task ${task_id}` }] };
  },
);

// --- Comments ---

server.tool(
  "list_comments",
  "List comments on a task",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    const comments = await client.listComments(task_id);
    return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
  },
);

server.tool(
  "add_comment",
  "Add a comment to a task",
  {
    task_id: z.number().describe("Task ID"),
    comment: z.string().describe("Comment text"),
  },
  async ({ task_id, comment }) => {
    const result = await client.createComment(task_id, comment);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
