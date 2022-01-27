import path from "path";
import webpack, {Compilation, Compiler, WebpackPluginInstance} from "webpack";
import {AtlasBuilder} from "./AtlasBuilder";
import {AtlasStructure} from "./AtlasStructure";
import {IAssetsConfiguration} from "./config/IAssetsConfiguration";
import {getWebpackTexturePackerPluginHooks} from "./hooks/hooks";
import {AtlasStructureCache} from "./utils/AtlasStructureCache";
import {joinAssetPath} from "./utils/joinAssetPath";

export class WebpackTexturePackerPlugin implements WebpackPluginInstance {
  public static readonly PLUGIN_NAME = "webpack-texture-packer";
  private readonly cache: AtlasStructureCache;

  public constructor(
    private readonly assetsConfiguration: IAssetsConfiguration,
  ) {
    this.cache = new AtlasStructureCache(WebpackTexturePackerPlugin.PLUGIN_NAME);
  }

  public apply(compiler: Compiler) {
    compiler.hooks.beforeRun.tapPromise(WebpackTexturePackerPlugin.PLUGIN_NAME, this.beforeRun);
    const {useCache = true} = this.assetsConfiguration;
    compiler.hooks.shouldEmit.tap(WebpackTexturePackerPlugin.PLUGIN_NAME, () => true);
    compiler.hooks.thisCompilation.tap(WebpackTexturePackerPlugin.PLUGIN_NAME, (compilation: Compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: WebpackTexturePackerPlugin.PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_DERIVED,
        }, () => this.emitHook(compilation),
      );
      if (useCache) {
        compilation.hooks.processAssets.tapPromise({
          name: WebpackTexturePackerPlugin.PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
        }, () => this.readCache(compilation));
        compilation.hooks.processAssets.tapPromise({
          name: WebpackTexturePackerPlugin.PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        }, () => this.writeCache(compilation));
      }
    });
    compiler.hooks.afterCompile.tap(WebpackTexturePackerPlugin.PLUGIN_NAME, this.addAssetsFoldersToWatch);
  }

  private addAssetsFoldersToWatch = (compilation: Compilation) => {
    const {rootDir = "", items} = this.assetsConfiguration;
    for (const item of items) {
      const dir = path.join(rootDir, item.rootDir ?? "");
      if (typeof item.source === "string") {
        compilation.contextDependencies.add(path.join(dir, item.source));
      } else if (Array.isArray(item.source)) {
        item.source.forEach((sourceItem) => {
          if (typeof sourceItem === "string") {
            compilation.contextDependencies.add(path.join(dir, sourceItem));
          } else {
            compilation.contextDependencies.add(path.join(dir, sourceItem.path));
          }
        });
      } else if (item.source?.path !== undefined) {
        compilation.contextDependencies.add(path.join(dir, item.source.path));
      }
    }
  };

  private beforeRun = async (compiler: Compiler): Promise<void> => {
    if (!this.assetsConfiguration) {
      throw new Error("Asset configurations should be defined");
    }
  };

  private readCache = async (compilation: Compilation): Promise<void> => {
    const {rootDir = "", items, packerOptions} = this.assetsConfiguration;
    await this.cache.load(compilation);
    for (const atlasConfig of items) {
      const structure = new AtlasStructure(rootDir, atlasConfig, packerOptions);
      await structure.load();

      const name = path.join(atlasConfig.outDir ?? "", atlasConfig.name);
      const cachedStructure = this.cache.get(name);
      if (cachedStructure === undefined || !structure.equals(AtlasStructure.fromStructure(cachedStructure))) {
        this.cache.set(name, structure);
      }
    }
  };

  private writeCache = async (compilation: Compilation): Promise<void> => {
    await this.cache.write(compilation);
  };

  private emitHook = async (compilation: Compilation): Promise<void> => {
    const hooks = getWebpackTexturePackerPluginHooks(compilation);
    const logger = compilation.getLogger(WebpackTexturePackerPlugin.PLUGIN_NAME);
    for (const {name, structure, assets: cachedAssets} of this.cache.items) {
      let atlasParts;
      if (cachedAssets === undefined || cachedAssets.length === 0 || cachedAssets.length % 2 !== 0) {
        atlasParts = [];
        try {
          const atlasBuilder = new AtlasBuilder(structure);
          const result = await atlasBuilder.build(compilation);
          if (result !== undefined) {
            for (const item of result) {
              const buffer = item.buffer;
              const outputPath = this.getOutputPath(item.name, structure.config.outDir);
              atlasParts.push({path: outputPath, content: buffer});
              compilation.emitAsset(outputPath, new webpack.sources.RawSource(buffer));
            }
            this.cache.set(name, structure, result);
          }
        } catch (e) {
          logger.error(`Failed to build atlas ${name}`, e);
        }
        logger.debug(`Atlas ${name} rebuilt`);
      } else {
        atlasParts = cachedAssets.map((item) => {
          const outputPath = this.getOutputPath(item.name, structure.config.outDir);
          compilation.emitAsset(outputPath, new webpack.sources.RawSource(item.buffer));
          return {path: outputPath, content: item.buffer};
        });
        logger.debug(`Atlas ${name} rebuilt from cache`);
      }

      await hooks.texturePackerEmitAtlas.promise(atlasParts, structure.config.extra);
    }
    await hooks.texturePackerEmitComplete.promise();
  };

  private getOutputPath(name: string, outDir: string = ""): string {
    const {outDir: rootOutDir = ""} = this.assetsConfiguration;
    return joinAssetPath(rootOutDir, outDir, name);
  }
}
