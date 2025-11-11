import { SchedulerDashboard } from '@/components/SchedulerDashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 pb-16 pt-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            AI-Augmented Scheduler
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Adaptive CPU scheduling with machine learning predictions
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Experiment with First Come First Served, Shortest Job First, Round Robin, and
            Priority scheduling. Feed the model with real execution characteristics to
            refine burst time and priority estimates in real time.
          </p>
        </header>
        <SchedulerDashboard />
      </div>
    </div>
  );
}
