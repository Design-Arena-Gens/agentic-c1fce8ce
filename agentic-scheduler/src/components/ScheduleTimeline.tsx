import { ScheduleResult } from '@/lib/types';

interface Props {
  result: ScheduleResult;
}

export function ScheduleTimeline({ result }: Props) {
  const slices = result.timeline;
  const start = slices.length ? slices[0].start : 0;
  const end = slices.length ? slices[slices.length - 1].end : 0;
  const total = Math.max(end - start, 1);
  const ticks = buildTicks(start, end, 8);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="relative flex h-20 w-full">
          {slices.map((slice) => {
            const width = ((slice.end - slice.start) / total) * 100;
            const isIdle = slice.name.startsWith('Idle');
            return (
              <div
                key={`${slice.id}-${slice.start}`}
                style={{ width: `${width}%`, backgroundColor: slice.color }}
                className={[
                  'relative flex flex-col items-center justify-center border-r border-white/20 text-xs font-semibold',
                  isIdle ? 'text-slate-700' : 'text-white',
                ].join(' ')}
              >
                <span className="px-2 text-center">
                  {slice.name}
                  <span className="ml-1 font-normal">
                    ({slice.start} → {slice.end})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <div className="flex justify-between">
            {ticks.map((tick) => (
              <span key={tick} className="font-medium">
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildTicks(start: number, end: number, maxTicks: number) {
  if (end <= start) return [start];
  const span = end - start;
  const step = Math.max(1, Math.round(span / maxTicks));
  const ticks: number[] = [];
  for (let value = start; value <= end; value += step) {
    ticks.push(value);
  }
  if (!ticks.includes(end)) {
    ticks.push(end);
  }
  return ticks;
}
