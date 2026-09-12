import Pusher from "pusher-js";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher | null {
  if (!pusherKey || !pusherCluster) return null;
  if (!pusherInstance) {
    pusherInstance = new Pusher(pusherKey, { cluster: pusherCluster });
  }
  return pusherInstance;
}
