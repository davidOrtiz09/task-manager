import { vi, describe, it, expect, beforeEach } from "vitest";

// Re-import the module fresh for each test so the globalThis singleton resets.
async function freshStore() {
  vi.resetModules();
  delete (globalThis as Record<string, unknown>).__store__;
  return import("@/lib/store");
}

describe("store", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).__store__;
  });

  describe("tasks", () => {
    it("addTask returns a task with the given title and no completedAt", async () => {
      const { addTask } = await freshStore();
      const task = addTask("Buy groceries");
      expect(task.title).toBe("Buy groceries");
      expect(task.completedAt).toBeNull();
      expect(task.id).toBeTruthy();
    });

    it("listTasks returns all added tasks", async () => {
      const { addTask, listTasks } = await freshStore();
      addTask("Task A");
      addTask("Task B");
      expect(listTasks()).toHaveLength(2);
    });

    it("completeTask sets completedAt and returns the updated task", async () => {
      const { addTask, completeTask } = await freshStore();
      const task = addTask("Write report");
      const completed = completeTask(task.id);
      expect(completed).not.toBeNull();
      expect(completed!.completedAt).toBeTruthy();
    });

    it("completeTask returns null when task is already completed", async () => {
      const { addTask, completeTask } = await freshStore();
      const task = addTask("Write report");
      completeTask(task.id);
      expect(completeTask(task.id)).toBeNull();
    });

    it("getTask returns undefined for unknown id", async () => {
      const { getTask } = await freshStore();
      expect(getTask("non-existent")).toBeUndefined();
    });
  });

  describe("emails", () => {
    it("addEmail prepends so listEmails is newest-first", async () => {
      const { addEmail, listEmails } = await freshStore();
      addEmail({ subject: "First", body: "", kind: "immediate" });
      addEmail({ subject: "Second", body: "", kind: "recurring" });
      const [head] = listEmails();
      expect(head.subject).toBe("Second");
    });
  });

  describe("sms", () => {
    it("addSms prepends so listSms is newest-first", async () => {
      const { addSms, listSms } = await freshStore();
      addSms("First message");
      addSms("Second message");
      const [head] = listSms();
      expect(head.body).toBe("Second message");
    });
  });
});
