import axios from "axios";
import { env } from "../../config/env";
import { ApiError } from "../../shared/errors/apiError.js";
import type { ExecuteCodeInput } from "./coding.validation";

export interface ExecutionOutput {
  status?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
}

export const isCodingConfigured = () => Boolean(env.JUDGE0_BASE_URL);

export const codingService = {
  async execute(input: ExecuteCodeInput): Promise<ExecutionOutput> {
    if (!env.JUDGE0_BASE_URL) {
      throw ApiError.unavailable(
        "Coding execution is not configured. Set JUDGE0_BASE_URL to an isolated Judge0 instance",
      );
    }
    const headers = env.JUDGE0_API_KEY
      ? { "X-Auth-Token": env.JUDGE0_API_KEY }
      : {};
    try {
      const { data } = await axios.post(
        `${env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: input.source_code,
          language_id: input.language_id,
          stdin: input.stdin,
          cpu_time_limit: input.time_limit,
          memory_limit: input.memory_limit,
        },
        { headers, timeout: 30000 },
      );
      return {
        status: data.status?.description,
        stdout: data.stdout,
        stderr: data.stderr,
        compile_output: data.compile_output,
        time: data.time,
        memory: data.memory,
      };
    } catch {
      throw ApiError.unavailable(
        "The code execution service could not process this request",
      );
    }
  },
};
