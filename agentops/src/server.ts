import express from 'express';
import { z } from 'zod';
import { runOpsAgent } from './agent/index.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const key = req.header('x-api-key');
  if (!process.env.APP_API_KEY) {
    return res.status(500).json({ error: 'APP_API_KEY is not configured' });
  }
  if (key !== process.env.APP_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

app.post('/api/proposals', async (req, res, next) => {
  try {
    const schema = z.object({ message: z.string().min(5) });
    const { message } = schema.parse(req.body);
    const output = await runOpsAgent({
      input: `User request:\n${message}`,
      toolbox: { propose_migration: true },
    });
    res.json(output);
  } catch (error) {
    next(error);
  }
});

app.post('/api/proposals/:id/approve', async (req, res, next) => {
  try {
    const schema = z.object({
      branch: z.string().optional(),
      title: z.string().optional(),
    });
    const { branch, title } = schema.parse(req.body);
    const output = await runOpsAgent({
      input: `Approve proposal ${req.params.id}${title ? ` title=${title}` : ''}${branch ? ` branch=${branch}` : ''}`,
      toolbox: { approve_proposal: true },
    });
    res.json(output);
  } catch (error) {
    next(error);
  }
});

app.get('/api/proposals/:id', async (req, res, next) => {
  try {
    const output = await runOpsAgent({
      input: `Status of proposal ${req.params.id}`,
      toolbox: { status_report: true },
    });
    res.json(output);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`AgentOps API on :${port}`);
});
