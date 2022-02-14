import configJson from '../config/config.json';
import { Action } from './model/action.model';
import { Config, ListingLookup } from './model/config.model';
import { Notifier } from './stuff/notifier';
import {
  getParser,
  getRandomFrequencyMS,
  log,
  readCacheFile,
  skipRun,
  writeCacheFile
} from './utils';

export const config: Config = configJson as Config;
export const notifier = new Notifier();

loop();
run();

function loop() {
  if (skipRun()) {
    setTimeout(() => loop(), 10 * 60 * 1000);
    return;
  }

  const delayMS = getRandomFrequencyMS();
  const delayMin = Math.floor(delayMS / 1000 / 60);
  log(`Next delay: ${delayMin} min`);

  setTimeout(() => {
    run();
    loop();
  }, delayMS);
}

async function run() {
  log('Starting');

  // load in cache file
  const cache = readCacheFile();

  for (const lookup of config.lookups) {
    const parser = getParser(lookup);
    const actions = await parser.run(cache);
    executeActions(lookup, actions);
  }

  writeCacheFile(cache);
}

function executeActions(lookup: ListingLookup, actions: Action[]) {
  if (actions.length > 5) {
    log(`TOO MANY ACTIONS. ABORTING`);
    return;
  } else if (!actions.length) {
    log(`No actions to execute`);
    return;
  }

  log(`Executing ${actions.length} actions`);

  for (const action of actions) {
    notifier.send(lookup, action);
  }

  log(`Finished executing actions`);
}
