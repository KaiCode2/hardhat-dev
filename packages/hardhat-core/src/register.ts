import debug from "debug";

import { HardhatContext } from "./internal/context";
import { loadConfigAndTasks } from "./internal/core/config/config-loading";
import { ArgumentsParser } from "./internal/cli/ArgumentsParser";
import { getEnvHardhatArguments } from "./internal/core/params/env-variables";
import { HARDHAT_PARAM_DEFINITIONS } from "./internal/core/params/hardhat-params";
import { Environment } from "./internal/core/runtime-environment";
import {
  loadTsNode,
  willRunWithTypescript,
} from "./internal/core/typescript-support";
import {
  disableReplWriterShowProxy,
  isNodeCalledWithoutAScript,
} from "./internal/util/console";

if (!HardhatContext.isCreated()) {
  require("source-map-support/register");

  const ctx = HardhatContext.createHardhatContext();

  if (isNodeCalledWithoutAScript()) {
    disableReplWriterShowProxy();
  }

  let hardhatArguments = getEnvHardhatArguments(
    HARDHAT_PARAM_DEFINITIONS,
    process.env
  );

  if (process.env.argv !== undefined) {
    const argumentsParser = new ArgumentsParser();

    hardhatArguments = argumentsParser.parseHardhatArguments(
      HARDHAT_PARAM_DEFINITIONS,
      hardhatArguments,
      JSON.parse(process.env.argv).slice(2)
    ).hardhatArguments;
  }

  if (hardhatArguments.verbose) {
    debug.enable("hardhat*");
  }

  if (willRunWithTypescript(hardhatArguments.config)) {
    loadTsNode(hardhatArguments.tsconfig, hardhatArguments.typecheck);
  }

  const { resolvedConfig, userConfig } = loadConfigAndTasks(hardhatArguments);

  const env = new Environment(
    resolvedConfig,
    hardhatArguments,
    ctx.tasksDSL.getTaskDefinitions(),
    ctx.extendersManager.getExtenders(),
    ctx.experimentalHardhatNetworkMessageTraceHooks,
    userConfig
  );

  ctx.setHardhatRuntimeEnvironment(env);

  env.injectToGlobal();
}
