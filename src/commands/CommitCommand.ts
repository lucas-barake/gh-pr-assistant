import { Command, Prompt } from "@effect/cli";
import { Effect, String } from "effect";
import { AiGenerator } from "@/services/AiGenerator/AiGenerator.js";
import { GitClient } from "@/services/GitClient.js";
import { contextLinesOption, contextOption, modelOption, OptionsContext } from "@/Options.js";

export const CommitCommand = Command.make(
  "commit",
  { contextOption, contextLinesOption, modelOption },
  Effect.fn(
    function* (_opts) {
      const ai = yield* AiGenerator;
      const git = yield* GitClient;

      const diff = yield* git.getStagedDiff();
      if (String.isEmpty(diff)) {
        yield* Effect.log("No staged changes found. Nothing to commit.");
        return;
      }

      yield* Effect.log("Generating commit message...");
      const message = yield* ai.generateCommitMessage(diff);
      yield* Effect.log(`Generated commit message:\n\n${message}\n`);

      const confirm = yield* Prompt.confirm({
        message: "Would you like to commit with this message?",
      });

      if (confirm) {
        yield* git.commit(message);
        yield* Effect.log("✅ Successfully committed changes!");
      }
    },
    (self, opts) => self.pipe(OptionsContext.provide(opts)),
  ),
);
