import * as Buffer from "buffer";
import {packAsync} from "free-tex-packer-core";
import {promisify} from "util";
import {Compilation} from "webpack";
import {AtlasStructure, IAssetStructure, IAtlasPair} from "./AtlasStructure";
import {defaultTexturePackerOptions} from "./texture-packer/DefaultTexturePackerOptions";

/** @internal */
export class AtlasBuilder {
  private static readonly APP_INFO = {
    appInfo: {
      displayName: "webpack-texture-packer",
      url: "https://github.com/mayakwd/webpack-texture-packer",
    },
  };

  public constructor(
    private readonly structure: AtlasStructure,
  ) {
  }

  public async build(compilation: Compilation):
    Promise<IAtlasPair[]> {
    const texturePackerOptions = this.getTexturePackerOptions();
    return await packAsync(
      await this.readFilesFromAssetsList(compilation, this.structure.assets),
      texturePackerOptions,
    );
  }

  private getTexturePackerOptions() {
    const {name, packerOptions, overwrite} = this.structure.config;
    const overwriteOptions = packerOptions !== undefined && overwrite;
    const globalPackerOptions = this.structure.options || defaultTexturePackerOptions;
    return Object.assign({},
      overwriteOptions ? undefined : globalPackerOptions,
      packerOptions,
      {textureName: name},
      AtlasBuilder.APP_INFO,
    );
  }

  private async readFilesFromAssetsList(compilation: Compilation, assetsList: IAssetStructure[]): Promise<{ path: string; contents: Buffer }[]> {
    const result = [];
    for (const value of assetsList) {
      let content;
      try {
        content = await promisify(compilation.inputFileSystem.readFile)(value.path);
      } catch (e) {
        // Skip file
      }
      if (content !== undefined) {
        result.push({
          path: value.name,
          contents: content as Buffer,
        });
      }
    }
    return result;
  }
}
