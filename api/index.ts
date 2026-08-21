import type { Request, Response } from 'express';

type ExpressHandler = (request: Request, response: Response) => void;

let appPromise: Promise<ExpressHandler> | null = null;

async function getApp(): Promise<ExpressHandler> {
  if (!appPromise) {
    appPromise = import('../server.js').then(({ createApp }) => createApp());
  }

  return appPromise;
}

export default async function handler(request: Request, response: Response) {
  try {
    const app = await getApp();
    return app(request, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown initialization error';
    console.error('Failed to initialize the CRM API function:', error);

    return response.status(500).json({
      error: 'CRM API initialization failed.',
      diagnostic: message
    });
  }
}
