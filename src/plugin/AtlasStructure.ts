import Buffer from "buffer";
import fs from "fs";
import {Minimatch} from "minimatch";
import path from "path";
import {readdirAsync, Stats} from "readdir-enhanced";
import {AssetsSource, IAssetsSourceConfiguration, IAtlasConfiguration} from "./config/IAtlasConfiguration";
import {getHash} from "./getHash";
import {TexturePackerOptions} from "./texture-packer/TexturePackerOptions";
import {deepEqual} from "./utils/deepEqual";

export interface IAtlasStructure {
  readonly assets: IAssetStructure[];
  readonly rootDir: string;
  readonly config: IAtlasConfiguration;
  readonly options?: TexturePackerOptions;
  readonly hash: string;
  readonly resultAssetNames?: string[];
}

export interface IAtlasPair {
  name: string;
  buffer: Buffer;
}

export class AtlasStructure implements IAtlasStructure {
  public static fromStructure(structure: IAtlasStructure): AtlasStructure {
    const result = new AtlasStructure(structure.rootDir, structure.config, structure.options);
    result._assets = structure.assets;
    result._hashToAsset = structure.assets.reduce((map, item) => {
      map.set(item.hash, item);
      return map;
    }, new Map<string, IAssetStructure>());
    result.resultAssetNames = structure.resultAssetNames;
    return result;
  }

  public resultAssetNames?: string[];

  private _assets: IAssetStructure[] = [];
  private _hashToAsset: Map<string, IAssetStructure> = new Map();

  public constructor(
    public readonly rootDir: string,
    public readonly config: IAtlasConfiguration,
    public readonly options?: TexturePackerOptions) {
  }

  public get assets(): IAssetStructure[] {
    return this._assets;
  }

  public get hash(): string {
    return getHash(this.config.name, this.config.rootDir ?? "", this.config.outDir ?? "");
  }

  public equals(other: AtlasStructure): boolean {
    const result = this.hash && other.hash
      && deepEqual(this.options, other.options)
      && deepEqual(this.config, other.config) && this._assets.length === other._assets.length;
    if (!result) {
      return false;
    }

    const otherAssets = new Set(other._assets);
    for (const asset of this._assets) {
      const otherAsset = other._hashToAsset.get(asset.hash);
      if (otherAsset === undefined || !deepEqual(otherAsset, asset)) {
        return false;
      }
      otherAssets.delete(otherAsset);
    }
    return otherAssets.size === 0;
  }

  public async load(): Promise<IAssetStructure[]> {
    this._assets = await this.readAssetsListFromSource(this.config.source ?? "");
    this._hashToAsset = this._assets.reduce((map, item) => {
      map.set(item.hash, item);
      return map;
    }, new Map<string, IAssetStructure>());
    return this._assets;
  }

  public toJSON(): any {
    return {
      resultAssetNames: this.resultAssetNames,
      assets: this.assets,
      hash: this.hash,
      rootDir: this.rootDir,
      config: this.config,
      options: this.options,
    };
  }

  private async readAssetsListFromSource(source: AssetsSource): Promise<IAssetStructure[]> {
    let assetsList: IAssetStructure[] = [];

    const recursive = this.config.recursive;
    const relativePath = this.rootDir;

    if (Array.isArray(source) && source.length > 0) {
      if (typeof source[0] === "string") {
        for (const sourcePath of (source as string[])) {
          assetsList = assetsList.concat(await readAssetsList({
            dir: path.join(this.rootDir, this.config.rootDir ?? "", sourcePath),
            relativePath,
            recursive,
          }));
        }
      } else {
        assetsList = [];
        for (const sourceConfig of (source as IAssetsSourceConfiguration[])) {
          const {recursive: sourceConfigRecursive = recursive} = sourceConfig;
          assetsList = assetsList.concat(
            await readAssetsList(
              {
                dir: path.join(this.rootDir, this.config.rootDir ?? "", sourceConfig.path),
                relativePath,
                recursive: sourceConfigRecursive,
                exclude: sourceConfig.exclude,
              }),
          );
        }
      }
    } else if (typeof source === "string") {
      assetsList = await readAssetsList({
        dir: path.join(this.rootDir, this.config.rootDir ?? "", source),
        relativePath,
        recursive,
      });
    } else {
      const assetsConfig = source as IAssetsSourceConfiguration;
      const assetsRootPath = path.join(this.rootDir, this.config.rootDir ?? "", assetsConfig.path);
      assetsList = await readAssetsList({
        dir: assetsRootPath,
        relativePath,
        recursive: assetsConfig.recursive || recursive,
        exclude: assetsConfig.exclude,
      });
    }
    return assetsList;
  }
}

const IMAGES_MATCHER = new Minimatch("**/*.{png,gif,jpg,bmp,tiff}");
const IMAGES_FILTER = (filename: string) => IMAGES_MATCHER.match(filename);

interface IReadAssetsListParams {
  dir: string;
  relativePath: string;
  recursive?: boolean;
  exclude?: string | string[];
}

export interface IAssetStructure {
  hash: string;
  path: string;
  name: string;
}

function createFilters(excludePattern?: string | string[]) {
  const filters = [IMAGES_FILTER];
  if (excludePattern !== undefined) {
    if (typeof excludePattern === "string") {
      excludePattern = [excludePattern];
    }

    for (const pattern of excludePattern) {
      const excludeMatcher = new Minimatch(pattern);
      const excludeFilter = (filename: string) => {
        return !excludeMatcher.match(filename);
      };
      filters.push(excludeFilter);
    }
  }

  return (stats: Stats) => {
    return stats.isDirectory() || matches(stats.path, filters);
  };
}

function getAssetName(params: IReadAssetsListParams, filename: string) {
  const fullPath = path.join(params.dir, filename);
  const assetRelativeName = path.relative(params.relativePath, fullPath);
  return path.posix
             .format(path.parse(assetRelativeName))
             .replace(/\\/g, "/");
}

async function readAssetsList(params: IReadAssetsListParams): Promise<IAssetStructure[]> {
  const {recursive = true} = params;
  const options = {deep: recursive, filter: createFilters(params.exclude)};

  const files = await readdirAsync(params.dir, options);
  return files
    .map((filename) => ({name: filename, stats: fs.statSync(path.join(params.dir, filename))}))
    .filter(({name, stats}) => !stats.isDirectory())
    .map(({name, stats}) => {
      const assetName = getAssetName(params, name);
      return {
        hash: getHash(`${assetName}${stats.mtimeMs}${stats.size}${stats.birthtimeMs}`),
        path: path.join(params.dir, name),
        name: assetName,
      };
    });
}

function matches(filename: string, matchers: FileMatchFunction[]) {
  return matchers.every((matcher) => matcher(filename));
}

type FileMatchFunction = (filename: string) => boolean;
