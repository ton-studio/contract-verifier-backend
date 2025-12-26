import fs from "fs";
import path from "path";
import { binaryPath } from "./binaries";
import { supportedVersionsReader } from "./supported-versions-reader";
import { getLogger } from "./logger";

const logger = getLogger("checkPrereqs");

export async function checkPrerequisites() {
  const missingEnvVars = [
    "VERIFIER_ID",
    "SOURCES_REGISTRY",
    "INFURA_ID",
    "INFURA_SECRET",
    "PRIVATE_KEY",
    "TACT_DEPLOYER_INFURA_ID",
    "TACT_DEPLOYER_INFURA_SECRET",
    "NETWORK",
    "COMPILE_TIMEOUT",
  ]
    .filter((e) => !process.env[e])
    .join(" ");

  if (missingEnvVars) throw new Error("Missing env vars: " + missingEnvVars);
}
