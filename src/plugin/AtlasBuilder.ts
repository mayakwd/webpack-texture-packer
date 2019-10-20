import texPacker from "free-tex-packer-core";
import * as fs from "fs";
import {Minimatch} from "minimatch";
import * as path from "path";
import {readdirAsync, Stats} from "readdir-enhanced";
import {AssetsSource, IAssetsSourceConfiguration, IAtlasConfiguration} from "./config/IAtlasConfiguration";
import {defaultTexturePackerOptions} from "./texture-packer/DefaultTexturePackerOptions";
import {ITexturePackerOptions} from "./texture-packer/ITexturePackerOptions";

/** @internal */
export class AtlasBuilder {
  private static readonly APP_INFO = {
    appInfo: {
      displayName: "webpack-texture-packer",
      url: "https://github.com/mayakwd/webpack-texture-packer",
    },
  };

  private readonly assetsRootDir: string;

  public constructor(
    private readonly atlasConfig: IAtlasConfiguration,
    private readonly globalPackerOptions?: ITexturePackerOptions,
    globalAssetsRootDir: string = "",
  ) {
    const {rootDir = "", source = ""} = atlasConfig;
    if (rootDir === "" && source === "") {
      throw new Error("rootDir and/or source must be defined, but both empty");
    }
    this.assetsRootDir = path.join(globalAssetsRootDir, rootDir);
  }

  public async build(): Promise<Array<{ name: string, buffer: Buffer }>> {
    const {source = ""} = this.atlasConfig;
    const assetsList = await this.readAssetsListFromSource(source);
    const texturePackerOptions = this.getTexturePackerOptions();
    if (assetsList.length === 0) {
      return [];
    }
    return new Promise((resolve, reject) => texPacker(
      this.readFilesFromAssetsList(assetsList),
      texturePackerOptions,
      (result: IPackedAtlasPair[], err?: Error) => {
        if (!err) { resolve(result); } else { reject(err); }
      }));
  }

  private getTexturePackerOptions() {
    const {name, packerOptions, overwrite} = this.atlasConfig;
    const overwriteOptions = packerOptions !== undefined && overwrite;
    const globalPackerOptions = this.globalPackerOptions || defaultTexturePackerOptions;
    return Object.assign({},
      overwriteOptions ? undefined : globalPackerOptions,
      packerOptions,
      {textureName: name},
      AtlasBuilder.APP_INFO,
    );
  }

  private async readAssetsListFromSource(source: AssetsSource): Promise<IAsset[]> {
    let assetsList: IAsset[] = [];

    const recursive = this.atlasConfig.recursive;
    const relativePath = this.assetsRootDir;

    if (Array.isArray(source) && source.length > 0) {
      if (typeof source[0] === "string") {
        for (const sourcePath of (source as string[])) {
          assetsList = assetsList.concat(await readAssetsList({
            dir: path.join(this.assetsRootDir, sourcePath),
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
                dir: path.join(this.assetsRootDir, sourceConfig.path),
                relativePath,
                recursive: sourceConfigRecursive,
                exclude: sourceConfig.exclude,
              }),
          );
        }
      }
    } else if (typeof source === "string") {
      assetsList = await readAssetsList({
        dir: path.join(this.assetsRootDir, source),
        relativePath,
        recursive,
      });
    } else {
      const assetsConfig = source as IAssetsSourceConfiguration;
      const assetsRootPath = path.join(this.assetsRootDir, assetsConfig.path);
      assetsList = await readAssetsList({
        dir: assetsRootPath,
        relativePath,
        recursive: assetsConfig.recursive || recursive,
        exclude: assetsConfig.exclude,
      });
    }
    return assetsList;
  }

  private readFilesFromAssetsList(assetsList: IAsset[]): Array<{ path: string; contents: Buffer }> {
    return assetsList.map((value) => ({
      path: value.name,
      contents: fs.readFileSync(value.path),
    }));
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

interface IAsset {
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

async function readAssetsList(params: IReadAssetsListParams): Promise<IAsset[]> {
  const {recursive = true} = params;
  const options = {deep: recursive, filter: createFilters(params.exclude)};

  const files = await readdirAsync(params.dir, options);
  return files
    .filter((filename) => !fs.statSync(path.join(params.dir, filename)).isDirectory())
    .map((filename) => {
      return {
        path: path.join(params.dir, filename),
        name: getAssetName(params, filename),
      };
    });
}

function matches(filename: string, matchers: FileMatchFunction[]) {
  return matchers.every((matcher) => matcher(filename));
}

type FileMatchFunction = (filename: string) => boolean;

interface IPackedAtlasPair {
  name: string;
  buffer: Buffer;
}
