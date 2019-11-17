import {ITexturePackerOptions} from "../..";
import {IAtlasConfiguration} from "./IAtlasConfiguration";

export interface IAssetsConfiguration {
  /**
   * Assets root directory
   *
   * @default undefined
   */
  rootDir?: string;
  /**
   * Output directory
   * Will be used to combine result output path for any atlas
   *
   * Notice: path should be defined as relative to webpack output path.
   *  If you defined webpack output.path as "dist" and outDir as "assets", final output path will be "dist/assets"
   *
   * @default undefined
   */
  outDir?: string;
  /**
   * Atlas configurations
   * @see IAtlasConfiguration
   */
  items: IAtlasConfiguration[];

  /**
   * Global texture packer options
   * @see ITexturePackerOptions
   * @see defaultTexturePackerOptions
   */
  packerOptions?: ITexturePackerOptions;
}
