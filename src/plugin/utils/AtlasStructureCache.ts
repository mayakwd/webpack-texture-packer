import * as Buffer from "buffer";
import findCacheDir from "find-cache-dir";
import os from "os";
import path from "path";
import {Compilation, WebpackError} from "webpack";
import {AtlasStructure, IAtlasPair, IAtlasStructure} from "../AtlasStructure";
import {WebpackTexturePackerPlugin} from "../WebpackTexturePackerPlugin";

export class AtlasStructureCache {
  private readonly cacheDir: string;
  private hash: Record<string, AtlasStructure> = {};
  private assets: Record<string, IAtlasPair[] | undefined> = {};

  public constructor(private readonly name: string) {
    this.cacheDir = findCacheDir({name, create: true}) || os.tmpdir();
  }

  public get items(): { name: string, structure: AtlasStructure, assets?: IAtlasPair[] }[] {
    const result = [];
    for (const [name, structure] of Object.entries(this.hash)) {
      result.push({name, structure, assets: this.assets[name]});
    }
    return result;
  }

  public set(name: string, structure: AtlasStructure, asset?: IAtlasPair[]) {
    this.hash[name] = structure;
    if (asset !== undefined) {
      structure.resultAssetNames = asset.map((item) => item.name);
    }
    this.assets[name] = asset;
  }

  public get(name: string): AtlasStructure | undefined {
    return this.hash[name];
  }

  public delete(name: string): void {
    delete this.hash[name];
  }

  public async load(compilation: Compilation): Promise<void> {
    const {compiler} = compilation;
    const logger = compiler.getInfrastructureLogger(WebpackTexturePackerPlugin.PLUGIN_NAME);
    const cache = compilation.getCache(WebpackTexturePackerPlugin.PLUGIN_NAME);

    let data: Record<string, IAtlasStructure> | undefined;
    try {
      data = JSON.parse(await cache.getPromise( this.name + ".hash", null));
    } catch (e) {
      compilation.warnings.push(e as WebpackError);
      logger.warn("Cache loading failed", e);
      return;
    }

    if (data === undefined) {
      logger.info('Cache is missing, will be rebuilt');
      return;
    }
    logger.info('Cache loaded successfully');
    for (const [key, value] of Object.entries(data)) {
      this.hash[key] = AtlasStructure.fromStructure(value);
      if (value.resultAssetNames !== undefined) {
        const resultAssets = [];
        try {
          for (const resultAssetName of value.resultAssetNames) {
            const buffer: Buffer = (await cache.getPromise(value.hash + "_" + resultAssetName, null));
            if (buffer !== undefined) {
              resultAssets.push({name: resultAssetName, buffer});
            }
          }
          this.assets[key] = resultAssets;
        } catch (e) {
          // need to rebuild
        }
      }
    }
  }

  public async write(compilation: Compilation): Promise<void> {
    const {compiler} = compilation;
    const logger = compiler.getInfrastructureLogger(WebpackTexturePackerPlugin.PLUGIN_NAME);
    const cache = compilation.getCache(WebpackTexturePackerPlugin.PLUGIN_NAME);
    try {
      await cache.storePromise(this.name + ".hash", null, JSON.stringify(this.hash));
    } catch (e) {
      logger.warn("Failed to save cache", e);
    }
    for (const [key, value] of Object.entries(this.hash)) {
      if (key !== undefined) {
        const assets = this.assets[key];
        if (assets !== undefined) {
          for (const asset of assets) {
            try {
              await cache.storePromise(value.hash + "_" + asset.name, null, asset.buffer);
            } catch (e) {
              logger.warn(`Failed to save built atlas "${asset.name}" to cache`, e);
              compilation.warnings.push(e as WebpackError);
            }
          }
        }
      }
    }
  }
}
