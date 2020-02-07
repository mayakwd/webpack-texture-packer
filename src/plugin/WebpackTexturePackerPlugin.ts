import Compilation = webpack.compilation.Compilation;
import Compiler = webpack.Compiler;
import * as path from "path";
import {SyncHook} from "tapable";
import webpack = require("webpack");
import {WebpackPluginInstance} from "webpack/declarations/WebpackOptions";
import {AtlasBuilder} from "./AtlasBuilder";
import {IAssetsConfiguration} from "./config/IAssetsConfiguration";

export class WebpackTexturePackerPlugin implements WebpackPluginInstance {
  private static readonly PLUGIN_NAME = "webpack-texture-packer";

  private static joinAssetPath(...parts: string[]): string {
    return path.posix.join(...parts.map((value) => value.replace(/\\/g, "/")));
  }

  public constructor(
    private readonly assetsConfiguration: IAssetsConfiguration,
  ) {
  }

  public apply(compiler: Compiler) {
    // @ts-ignore
    if (compiler.hooks.texturePackerEmitAtlas !== undefined) {
      throw new Error("Hook texturePackerEmitAtlas already in use");
    }
    // @ts-ignore
    if (compiler.hooks.texturePackerEmitComplete !== undefined) {
      throw new Error("Hook texturePackerEmitAtlas already in use");
    }

    // @ts-ignore
    compiler.hooks.texturePackerEmitAtlas = new SyncHook(["atlas", "extra"]);
    // @ts-ignore
    compiler.hooks.texturePackerEmitComplete = new SyncHook();
    compiler.hooks.beforeCompile.tapAsync(WebpackTexturePackerPlugin.PLUGIN_NAME, this.beforeCompileHook.bind(this));
    compiler.hooks.emit.tapPromise(WebpackTexturePackerPlugin.PLUGIN_NAME, this.emitHook.bind(this));
  }

  private beforeCompileHook(_: any, callback: (error?: Error) => void) {
    let error;
    if (!this.assetsConfiguration) {
      error = new Error("Asset configurations should be defined");
    }
    callback(error);
  }

  private emitHook(compilation: Compilation): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const {rootDir, items, packerOptions} = this.assetsConfiguration;
        for (const atlasConfig of items) {
          const atlasBuilder = new AtlasBuilder(atlasConfig, packerOptions, rootDir);
          const atlasParts = [];
          for (const item of await atlasBuilder.build()) {
            const buffer = item.buffer;
            const size = buffer.length;
            const outputPath = this.getOutputPath(item.name, atlasConfig.outDir);
            atlasParts.push({path: outputPath, content: buffer});
            compilation.assets[outputPath] = {
              source: () => buffer,
              size: () => size,
            };
          }
          // @ts-ignore
          compilation.compiler.hooks.texturePackerEmitAtlas.call(atlasParts, atlasConfig.extra);
        }
        // @ts-ignore
        compilation.compiler.hooks.texturePackerEmitComplete.call();
      } catch (err) {
        reject(err);
      }
      resolve();
    });
  }

  private getOutputPath(name: string, outDir: string = ""): string {
    const {outDir: rootOutDir = ""} = this.assetsConfiguration;
    return WebpackTexturePackerPlugin.joinAssetPath(rootOutDir, outDir, name);
  }
}
