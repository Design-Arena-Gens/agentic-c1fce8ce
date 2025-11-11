'use client';

import { useMemo, useState } from 'react';
import {
  AlgorithmKey,
  ProcessInput,
  ProcessSpec,
  ScheduleRequestPayload,
  ScheduleResult,
} from '@/lib/types';
import { ScheduleTimeline } from './ScheduleTimeline';

const algorithmLabels: Record<AlgorithmKey, string> = {
  FCFS: 'First Come First Served',
  SJF: 'Shortest Job First',
  RoundRobin: 'Round Robin',
  Priority: 'Priority Scheduling',
};

const defaultProcesses: ProcessInput[] = [
  {
    id: 'P1',
    name: 'Video Encoder',
    arrivalTime: 0,
    burstTime: 52,
    priority: 2,
    features: {
      ioBound: 0.2,
      memoryFootprint: 768,
      historicalWait: 25,
      cpuIntensity: 0.92,
      deadlineFlexibility: 0.2,
      estimatedBurst: 55,
    },
  },
  {
    id: 'P2',
    name: 'Search Index Update',
    arrivalTime: 3,
    burstTime: 35,
    priority: 1,
    features: {
      ioBound: 0.4,
      memoryFootprint: 1024,
      historicalWait: 45,
      cpuIntensity: 0.7,
      deadlineFlexibility: 0.3,
      estimatedBurst: 40,
    },
  },
  {
    id: 'P3',
    name: 'Analytics Batch',
    arrivalTime: 4,
    priority: 4,
    features: {
      ioBound: 0.6,
      memoryFootprint: 512,
      historicalWait: 80,
      cpuIntensity: 0.45,
      deadlineFlexibility: 0.7,
      estimatedBurst: 32,
    },
  },
  {
    id: 'P4',
    name: 'Realtime Aggregator',
    arrivalTime: 7,
    features: {
      ioBound: 0.3,
      memoryFootprint: 384,
      historicalWait: 20,
      cpuIntensity: 0.88,
      deadlineFlexibility: 0.4,
      estimatedBurst: 36,
    },
  },
];

const createEmptyProcess = (): ProcessInput => ({
  id: `P${Math.random().toString(16).slice(2, 6)}`,
  name: 'New Process',
  arrivalTime: 0,
  features: {
    ioBound: 0.5,
    memoryFootprint: 256,
    historicalWait: 40,
    cpuIntensity: 0.5,
    deadlineFlexibility: 0.5,
    estimatedBurst: 30,
  },
});

export function SchedulerDashboard() {
  const [processes, setProcesses] = useState<ProcessInput[]>(defaultProcesses);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<AlgorithmKey[]>([
    'FCFS',
    'SJF',
    'RoundRobin',
    'Priority',
  ]);
  const [roundRobinQuantum, setRoundRobinQuantum] = useState(6);
  const [usePredictions, setUsePredictions] = useState(true);
  const [results, setResults] = useState<ScheduleResult[]>([]);
  const [resolved, setResolved] = useState<ProcessSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeProcess = (id: string) => {
    setProcesses((prev) => prev.filter((process) => process.id !== id));
  };

  const handleProcessChange = (
    id: string,
    field: keyof ProcessInput | keyof ProcessInput['features'],
    value: number | string,
    nested = false,
  ) => {
    setProcesses((prev) =>
      prev.map((process) => {
        if (process.id !== id) return process;
        if (nested && field in process.features) {
          const numeric = Number(value);
          if (Number.isNaN(numeric)) {
            return process;
          }
          let nextValue = numeric;
          if (
            field === 'ioBound' ||
            field === 'cpuIntensity' ||
            field === 'deadlineFlexibility'
          ) {
            nextValue = Math.min(1, Math.max(0, nextValue));
          } else if (field === 'memoryFootprint') {
            nextValue = Math.max(32, nextValue);
          } else if (field === 'historicalWait') {
            nextValue = Math.max(0, nextValue);
          } else if (field === 'estimatedBurst') {
            nextValue = Math.max(1, nextValue);
          }
          return {
            ...process,
            features: {
              ...process.features,
              [field]: nextValue,
            },
          };
        }
        if (field === 'name') {
          return { ...process, name: String(value) };
        }
        if (value === '' && (field === 'burstTime' || field === 'priority')) {
          return { ...process, [field]: undefined } as ProcessInput;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
          return process;
        }
        const coerced =
          field === 'priority'
            ? Math.min(5, Math.max(1, Math.round(numeric)))
            : Math.max(0, numeric);
        return {
          ...process,
          [field]: coerced,
        };
      }),
    );
  };

  const toggleAlgorithm = (algorithm: AlgorithmKey) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(algorithm)
        ? prev.filter((item) => item !== algorithm)
        : [...prev, algorithm],
    );
  };

  const resetToExamples = () => {
    setProcesses(defaultProcesses.map((process) => ({
      ...process,
      features: { ...process.features },
    })));
    setResults([]);
    setResolved([]);
  };

  const payload = useMemo<ScheduleRequestPayload>(
    () => ({
      processes,
      selectedAlgorithms,
      roundRobinQuantum,
      usePredictions,
    }),
    [processes, roundRobinQuantum, selectedAlgorithms, usePredictions],
  );

  const runScheduling = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message || 'Failed to run scheduling');
      }
      const data = (await response.json()) as {
        results: ScheduleResult[];
        resolvedProcesses: ProcessSpec[];
      };
      setResults(data.results);
      setResolved(data.resolvedProcesses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Intelligent Job Scheduling Control Plane
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Combine classical operating system schedulers with AI-driven burst time and
            priority forecasts. Provide real execution data to continuously improve the
            model.
          </p>
        </div>
        <div className="space-y-6 p-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={usePredictions}
                  onChange={(event) => setUsePredictions(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Use AI predictions for burst time and priority
              </label>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Round Robin Quantum</span>
                <input
                  type="number"
                  min={1}
                  value={roundRobinQuantum}
                  onChange={(event) => setRoundRobinQuantum(Number(event.target.value) || 1)}
                  className="w-20 rounded-md border border-slate-300 px-2 py-1 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={resetToExamples}
                className="ml-auto rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Load Example Processes
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(algorithmLabels).map(([key, label]) => {
                const algorithm = key as AlgorithmKey;
                const active = selectedAlgorithms.includes(algorithm);
                return (
                  <button
                    key={algorithm}
                    type="button"
                    onClick={() => toggleAlgorithm(algorithm)}
                    className={[
                      'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Process</th>
                  <th className="px-3 py-2">Arrival</th>
                  <th className="px-3 py-2">Burst (actual)</th>
                  <th className="px-3 py-2">Priority (actual)</th>
                  <th className="px-3 py-2">IO Bound</th>
                  <th className="px-3 py-2">Memory (MB)</th>
                  <th className="px-3 py-2">Historical Wait</th>
                  <th className="px-3 py-2">CPU Intensity</th>
                  <th className="px-3 py-2">Deadline Flex.</th>
                  <th className="px-3 py-2">Estimated Burst</th>
                  <th className="px-3 py-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {processes.map((process) => (
                  <tr key={process.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-2">
                      <input
                        type="text"
                        value={process.name}
                        onChange={(event) =>
                          handleProcessChange(process.id, 'name', event.target.value)
                        }
                        className="w-40 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={process.arrivalTime}
                        onChange={(event) =>
                          handleProcessChange(process.id, 'arrivalTime', event.target.value)
                        }
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={process.burstTime ?? ''}
                        placeholder="AI"
                        onChange={(event) =>
                          handleProcessChange(process.id, 'burstTime', event.target.value)
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={process.priority ?? ''}
                        placeholder="AI"
                        onChange={(event) =>
                          handleProcessChange(process.id, 'priority', event.target.value)
                        }
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={process.features.ioBound}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'ioBound',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={64}
                        value={process.features.memoryFootprint}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'memoryFootprint',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={process.features.historicalWait}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'historicalWait',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={process.features.cpuIntensity}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'cpuIntensity',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={process.features.deadlineFlexibility}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'deadlineFlexibility',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={process.features.estimatedBurst}
                        onChange={(event) =>
                          handleProcessChange(
                            process.id,
                            'estimatedBurst',
                            event.target.value,
                            true,
                          )
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeProcess(process.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setProcesses((prev) => [...prev, createEmptyProcess()])}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Add Process
              </button>
              <button
                type="button"
                onClick={runScheduling}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Running…
                  </>
                ) : (
                  'Run Scheduler'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {resolved.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Resolved Process Snapshot</h3>
          <p className="mt-1 text-sm text-blue-800">
            These are the values used by the scheduler after fusing inputs with the AI
            predictor.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100 text-left text-sm text-blue-900">
              <thead className="bg-blue-100 text-xs uppercase tracking-wide text-blue-700">
                <tr>
                  <th className="px-3 py-2">Process</th>
                  <th className="px-3 py-2">Arrival</th>
                  <th className="px-3 py-2">Burst</th>
                  <th className="px-3 py-2">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {resolved.map((process) => (
                  <tr key={process.id}>
                    <td className="px-3 py-2 font-medium">{process.name}</td>
                    <td className="px-3 py-2">{process.arrivalTime}</td>
                    <td className="px-3 py-2">{process.burstTime}</td>
                    <td className="px-3 py-2">{process.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={result.algorithm}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {algorithmLabels[result.algorithm]}
                </h3>
                <p className="text-sm text-slate-600">
                  Average wait {result.metrics.averageWaitingTime.toFixed(2)} • Average
                  response {result.metrics.averageResponseTime.toFixed(2)} • Throughput{' '}
                  {result.metrics.throughput.toFixed(2)} jobs/unit
                </p>
              </div>
              <div className="space-y-5 p-6">
                <ScheduleTimeline result={result} />
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Process</th>
                        <th className="px-3 py-2">Waiting</th>
                        <th className="px-3 py-2">Turnaround</th>
                        <th className="px-3 py-2">Response</th>
                        <th className="px-3 py-2">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.perProcess.map((process) => (
                        <tr key={process.id}>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {process.name}
                          </td>
                          <td className="px-3 py-2">{process.waitingTime}</td>
                          <td className="px-3 py-2">{process.turnaroundTime}</td>
                          <td className="px-3 py-2">{process.responseTime}</td>
                          <td className="px-3 py-2">{process.completionTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Avg Waiting Time"
                    value={result.metrics.averageWaitingTime.toFixed(2)}
                    unit="units"
                  />
                  <MetricCard
                    label="Avg Turnaround Time"
                    value={result.metrics.averageTurnaroundTime.toFixed(2)}
                    unit="units"
                  />
                  <MetricCard
                    label="CPU Utilization"
                    value={result.metrics.cpuUtilization.toFixed(1)}
                    unit="%"
                  />
                  <MetricCard
                    label="Makespan"
                    value={result.metrics.makespan.toFixed(1)}
                    unit="units"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {value}
        <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  );
}
