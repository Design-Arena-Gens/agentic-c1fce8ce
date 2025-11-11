## AI Job Scheduler

This project delivers an intelligent operating system job scheduler that fuses classical CPU scheduling algorithms with machine learning forecasts. It is built with Next.js 16, React Server Components, and Tailwind CSS, ready to deploy to Vercel.

### Features

- **Schedulers**: First Come First Served, Shortest Job First, Round Robin, and Priority scheduling with full per-process metrics.
- **AI integration**: Random forest regression predicts burst times and priorities from workload characteristics (I/O boundness, memory footprint, historical wait time, CPU intensity, and deadline flexibility).
- **Continuous learning**: When you provide real execution results, the model retrains incrementally to improve future predictions.
- **Interactive dashboard**: Configure workloads, tweak algorithm selections, inspect Gantt timelines, and compare KPIs side by side.

### Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to explore the dashboard. The API route at `/api/schedule` accepts JSON payloads matching `ScheduleRequestPayload` (see `src/lib/types.ts`) and returns per-algorithm schedule plans.

### Production Build

```bash
npm run build
npm run start
```

### Project Structure

- `src/app/page.tsx` – landing page that renders the dashboard.
- `src/components/` – React components for data entry, visualization, and metrics.
- `src/lib/scheduling.ts` – FCFS, SJF, Round Robin, and Priority implementations with metric calculations.
- `src/lib/prediction-engine.ts` – Random-forest powered predictor with seed dataset and heuristics.
- `src/app/api/schedule/route.ts` – API endpoint that fuses user input with AI predictions and runs the selected algorithms.

### Extending

- Plug in real telemetry by persisting execution traces and passing them to the `/api/schedule` route.
- Adjust feature engineering or swap the random forest with alternative models.
- Add more scheduling disciplines (e.g., Multilevel Feedback Queue) by extending `AlgorithmKey` and `algorithmDispatch`.

This repository is optimized for deployment on Vercel. Use `vercel deploy --prod` when you're ready to ship.
