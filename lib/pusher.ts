import Pusher from "pusher-js";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  throw new Error("Pusher environment variables not configured");
}

export const pusher = new Pusher(pusherKey, {
  cluster: pusherCluster,
});
