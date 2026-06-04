import { serve } from "inngest/next";
import { functions, inngest } from "@/lib/jobs/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions
});
