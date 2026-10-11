import { json } from '@sveltejs/kit';
import { getVapidPublicKey } from '$lib/server/push';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const publicKey = getVapidPublicKey();
  return json({ publicKey });
};
