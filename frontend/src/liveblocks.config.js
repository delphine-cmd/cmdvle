import { createClient } from "@liveblocks/client";

export const client = createClient({
  publicApiKey: process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY,
});
