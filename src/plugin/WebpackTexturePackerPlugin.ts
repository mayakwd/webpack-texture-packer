import webpack = require("webpack");
import Compilation = webpack.compilation.Compilation;
import Compiler = webpack.Compiler;
import * as path from "path";
import {SyncHook} from "tapable";
import {WebpackPluginInstance} from "webpack/declarations/WebpackOptions";
import {AtlasBuilder} from "./AtlasBuilder";
import {IAssetsConfiguration} from "./config/IAssetsConfiguration";

export class WebpackTexturePackerPlugin implements WebpackPluginInstance {
  private static readonly PLUGIN_NAME = "webpack-texture-packer";

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
    compiler.hooks.texturePackerEmitAtlas = new SyncHook(["atlas"]);
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
          compilation.compiler.hooks.texturePackerEmitAtlas.call(atlasParts);
        }
      } catch (err) {
        reject(err);
      }
      resolve();
    });
  }

  private getOutputPath(name: string, outDir: string = ""): string {
    const {outDir: rootOutDir = ""} = this.assetsConfiguration;
    return path.join(rootOutDir, outDir, name);
  }
}
