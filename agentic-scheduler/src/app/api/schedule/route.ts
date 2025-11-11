import { NextResponse } from 'next/server';
import {
  AlgorithmKey,
  ProcessInput,
  ProcessSpec,
  ScheduleRequestPayload,
  ScheduleResponsePayload,
} from '@/lib/types';
import { getPredictionEngine } from '@/lib/prediction-engine';
import {
  fcfsSchedule,
  prioritySchedule,
  roundRobinSchedule,
  sjfSchedule,
} from '@/lib/scheduling';

const algorithmDispatch: Record<AlgorithmKey, (processes: ProcessSpec[], quantum: number) => ReturnType<typeof fcfsSchedule>> = {
  FCFS: (processes) => fcfsSchedule(processes),
  SJF: (processes) => sjfSchedule(processes),
  RoundRobin: (processes, quantum) => roundRobinSchedule(processes, quantum),
  Priority: (processes) => prioritySchedule(processes),
};

function coerceProcess(input: ProcessInput, usePredictions: boolean) {
  const engine = getPredictionEngine();
  const features = input.features;
  if (!features) {
    throw new Error(`Missing feature vector for process ${input.name}`);
  }

  const prediction = engine.predict(features);
  const resolvedBurst = usePredictions
    ? prediction.burst
    : input.burstTime ?? prediction.burst;
  const resolvedPriority = usePredictions
    ? prediction.priority
    : input.priority ?? prediction.priority;

  if (!Number.isFinite(resolvedBurst) || resolvedBurst <= 0) {
    throw new Error(
      `Invalid burst time for process ${input.name}. Provide a positive value.`,
    );
  }

  return {
    process: {
      id: input.id,
      name: input.name,
      arrivalTime: Math.max(0, Math.round(input.arrivalTime)),
      burstTime: Math.round(resolvedBurst),
      priority: Math.round(resolvedPriority),
    } satisfies ProcessSpec,
    features,
    providedBurst: input.burstTime,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ScheduleRequestPayload;
    const { processes = [], selectedAlgorithms = [], roundRobinQuantum = 4, usePredictions = true } = payload;

    if (!processes.length) {
      return NextResponse.json(
        { error: 'Provide at least one process to schedule.' },
        { status: 400 },
      );
    }

    const engine = getPredictionEngine();
    const resolved = processes.map((process) =>
      coerceProcess(process, usePredictions),
    );

    // Update the model with user-provided ground truth
    for (const item of resolved) {
      if (typeof item.providedBurst === 'number') {
        engine.record(item.process, item.features);
      }
    }

    const uniqueAlgorithms = [...new Set(selectedAlgorithms)];
    if (!uniqueAlgorithms.length) {
      uniqueAlgorithms.push('FCFS', 'SJF', 'RoundRobin', 'Priority');
    }

    const quantum = Math.max(1, Math.round(roundRobinQuantum));
    const results = uniqueAlgorithms.map((key) => {
      const runner = algorithmDispatch[key];
      if (!runner) {
        throw new Error(`Unsupported algorithm ${key}`);
      }
      return runner(
        resolved.map((item) => item.process),
        quantum,
      );
    });

    const response: ScheduleResponsePayload = {
      results,
      resolvedProcesses: resolved.map((item) => item.process),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
