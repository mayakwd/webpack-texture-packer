import {ITexturePackerOptions} from "../..";
import {IAssetsConfiguration} from "./IAssetsConfiguration";

/**
 * Atlas configuration
 */
export interface IAtlasConfiguration {
  /**
   * Atlas name
   * Will be used to create atlas scheme and atlas texture.
   *
   * For example, if you defined:
   *  - {@link IAssetsConfiguration.outDir} as "assets"
   *  - {@link IAtlasConfiguration.outDir} as "gameplay"
   *  - {@link IAtlasConfiguration.name} as "enemies"
   *  Then result texture name will be "assets/gameplay/enemies.png" and scheme "assets/gameplay/enemies.json"
   */
  name: string;
  /**
   * Output directory
   * Will be used as part of output path for atlas
   *
   * For example, if you defined:
   *  - {@link IAssetsConfiguration.outDir} as "assets"
   *  - {@link IAtlasConfiguration.outDir} as "gameplay"
   *  - {@link IAtlasConfiguration.name} as "enemies"
   *
   * @default undefined
   */
  outDir?: string;
  /**
   * Assets root directory
   * Will be used to combine rootDir path for atlas assets
   *
   * Notice: rootDir is relative to {@link IAssetsConfiguration.rootDir}
   * For example: If you defined {@link IAssetsConfiguration.rootDir} as "assets-source", and {@link rootDir} as
   * "enemies" final rootDir path will be "assets-source/enemies"
   *
   * @default undefined
   */
  rootDir?: string;
  /**
   * Asset source(s)
   * Defines path(s) where texture packer should search for asset files.
   * Search will be recursive by default (all assets in the nested folders will added to final atlas), if you want
   * to prevent recursive search see {@see IAssetsSourceConfiguration}
   * @see AssetsSource
   */
  source?: AssetsSource;
  /**
   * Applies recursive search for every source
   * @default true
   */
  recursive?: boolean;
  /**
   * Texture packer options
   * @see ITexturePackerOptions
   */
  packerOptions?: ITexturePackerOptions;
  /**
   * Value indicates whether overwrite global texture packer options for this atlas.
   * - If `true` - global texture packer options will be replaced
   * - If `false` - specified options will be merged with global
   * @default false
   */
  overwrite?: boolean;
}

export type AssetsSource = string | string[] | IAssetsSourceConfiguration | IAssetsSourceConfiguration [];

/**
 * Assets source configuration
 */
export interface IAssetsSourceConfiguration {
  /**
   * Assets source path
   */
  path: string;
  /**
   * Apply recursive search
   *
   * @default true
   */
  recursive?: boolean;
  /**
   * Exclude pattern(s)
   * For excludes you can use {@link https://www.npmjs.com/package/glob glob pattern}
   */
  exclude?: string | string[];
}
