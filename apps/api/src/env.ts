import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

/**
 * 환경 변수는 저장소 루트의 .env 하나만 사용한다.
 * 파일이 없으면(컨테이너·CI) 이미 주입된 process.env 를 그대로 쓴다. 기존 값은 덮어쓰지 않는다.
 */
export const ROOT_ENV_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env");
loadEnv({ path: ROOT_ENV_PATH, quiet: true });
