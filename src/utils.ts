import fs from 'fs';
import * as _ from 'lodash';
import path from 'path';
import { Change } from './model/action.model';
import { Cache } from './model/cheerio.model';
import { ListingLookup } from './model/config.model';
import { KvParser } from './parser/kv.parser';
import { OkidokiParser } from './parser/okidoki.parser';
import { Parser } from './parser/parser';
import { config } from './server';

const CACHE_FILE = path.join(__dirname, '../config/cache.json');

export const findChangedFields = (a: object, b: object) => {
  if (!a || !b) return [];
  var keys = _.union(_.keys(a), _.keys(b));
  return _.filter(keys, function (key) {
    return a[key] !== b[key];
  });
};

export const log = (msg: string, step = 0) => {
  const now = new Date();
  const h = ('0' + now.getHours()).substr(-2);
  const m = ('0' + now.getMinutes()).substr(-2);
  const s = ('0' + now.getSeconds()).substr(-2);
  const spacing = ' '.repeat(step);
  console.log(`[${h}:${m}:${s}]`, spacing + msg);
};

export const getRandomFrequencyMS = () => {
  const min = config.frequency.min * 1000 * 60;
  const max = config.frequency.max * 1000 * 60;
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const skipRun = () => {
  if (!config.inactiveHours.enabled) {
    return false;
  }

  const currentHour = new Date().getHours();
  // Running eg "14:00" or "14:34" through parseInt will return 14
  const from = parseInt(config.inactiveHours.from);
  const to = parseInt(config.inactiveHours.to);
  return currentHour >= from && currentHour < to;
};

export const readCacheFile = (): Cache => {
  const jsonString = fs.existsSync(CACHE_FILE)
    ? fs.readFileSync(CACHE_FILE)
    : undefined;
  return jsonString
    ? JSON.parse(jsonString?.toString())
    : {
        kv: {},
        okidoki: {},
      };
};

export const writeCacheFile = (cache: Cache) => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, undefined, 2));
};

export const getChanges = (
  changedFields: string[],
  oldObj: object,
  newObj: object
) => {
  const changes: Change[] = [];

  for (const field of changedFields) {
    changes.push({
      from: oldObj[field],
      to: newObj[field],
      field,
    });
  }

  return changes;
};

export const getParser = (lookup: ListingLookup): Parser => {
  if (lookup.url.includes('okidoki.ee')) {
    return new OkidokiParser(lookup);
  } else if (lookup.url.includes('kv.ee')) {
    return new KvParser(lookup);
  }
};
