import TasksPanel from "@/components/TasksPanel";
import EmailsPanel from "@/components/EmailsPanel";
import SmsPanel from "@/components/SmsPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Task Manager</h1>
      </header>

      <main className="flex flex-1 divide-x divide-gray-200 overflow-hidden">
        <section className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <TasksPanel />
        </section>

        <section className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <EmailsPanel />
        </section>

        <section className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <SmsPanel />
        </section>
      </main>
    </div>
  );
}
