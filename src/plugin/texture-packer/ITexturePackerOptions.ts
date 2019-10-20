/**
 * Trim mode for sprites
 *
 * @see ITexturePackerOptions.trimMode
 * @see ITexturePackerOptions.allowTrim
 */
export enum TrimMode {
  /**
   * Remove transparent pixels from sides, but left original frame size
   *
   * For example:
   *  Original sprite has size 64x64, after removing transparent pixels its real size will be reduced to 32x28,
   *  which will be written as frame size, but original frame size will stay the same: 64x64
   */
  TRIM = "trim",
  /**
   * Remove transparent pixels from sides, and update frame size
   *
   * For example:
   *  Original sprite has size 64x64, after removing transparent pixels its real size will be reduced to 32x28,
   *  which will be written as frame size, and original frame size will be reduced to the same dimensions
   */
  CROP = "crop",
}

/**
 * Output atlas texture format
 *
 * @see ITexturePackerOptions.textureFormat
 */
export enum TextureFormat {
  PNG = "png",
  JPG = "jpg",
}

/**
 * Atlas packer type.
 * There are two implementations which could be used
 *
 * @see ITexturePackerOptions.packer
 * @see ITexturePackerOptions.packerMethod
 * @see MaxRectsBinMethod
 * @see MaxRectsPackerMethod
 */
export enum PackerType {
  MAX_RECTS_BIN = "MaxRectsBin",
  MAX_RECTS_PACKER = "MaxRectsPacker",
}

/**
 * MaxRectsBin packer method
 *
 * @see ITexturePackerOptions.packerMethod
 */
export enum MaxRectsBinMethod {
  BEST_SHORT_SIDE_FIT = "BestShortSideFit",
  BEST_LONG_SIDE_FIT = "BestLongSideFit",
  BEST_AREA_FIT = "BestAreaFit",
  BOTTOM_LEFT_RULE = "BottomLeftRule",
  CONTACT_POINT_RULE = "ContactPointRule",
}

/**
 * MaxRectsPacker packer method
 *
 * @see ITexturePackerOptions.packerMethod
 */
export enum MaxRectsPackerMethod {
  SMART = "Smart",
  SQUARE = "Square",
  SMART_SQUARE = "SmartSquare",
}

/**
 * Packer exporter type
 * Predefined exporter types (supported popular formats)
 * Instead of predefined type you could use custom exporter
 *
 * @see ITexturePackerOptions.exporter
 * @see IPackerExporter
 */
export enum PackerExporterType {
  JSON_HASH = "JsonHash",
  JSON_ARRAY = "JsonArray",
  CSS = "Css",
  OLD_CSS = "OldCss",
  PIXI = "Pixi",
  PHASER_HASH = "PhaserHash",
  PHASER_ARRAY = "PhaserArray",
  PHASER3 = "Phaser3",
  XML = "XML",
  STARLING = "Starling",
  COCOS2D = "Cocos2d",
  SPINE = "Spine",
  UNREAL = "Unreal",
  UIKIT = "UIKit",
  UNITY3D = "Unity3D",
}

/**
 * Bitmap filter, applicable to output atlas texture
 *
 * @see ITexturePackerOptions.filter
 */
export enum BitmapFilterType {
  GRAYSCALE = "grayscale",
  MASK = "mask",
  NONE = "none",
}

/**
 * Texture packer options
 */
export interface ITexturePackerOptions {
  /**
   * Name of output files.
   *
   * @default pack-result
   */
  textureName?: string;

  /**
   * Max single texture width in pixels
   *
   * @default 2048
   */
  width?: number;
  /**
   * Max single texture height in pixels
   *
   * @default 2048
   */
  height?: number;
  /**
   * Fixed texture size
   *
   * @default false
   */
  fixedSize?: boolean;
  /**
   * Force power of two textures sizes
   *
   * @default false
   */
  powerOfTwo?: boolean;
  /**
   * Spaces in pixels around images
   *
   * @default 0
   */
  padding?: number;
  /**
   * Extrude border pixels size around images
   *
   * @default 0
   */
  extrude?: number;
  /**
   * Allow image rotation
   * @default true
   */
  allowRotation?: boolean;
  /**
   * Allow detect identical images
   *
   * @default true
   */
  detectIdentical?: boolean;
  /**
   * Allow trim images
   *
   * @default true
   */
  allowTrim?: boolean;
  /**
   * Trim mode
   *
   * @default {@link TrimMode.TRIM}
   * @see {@link TrimMode}
   * @see {@link allowTrim}
   */
  trimMode?: TrimMode;
  /**
   * Threshold alpha value
   *
   * @default 0
   */
  alphaThreshold?: number;
  /**
   * Remove file extensions from frame names
   *
   * @default false
   */
  removeFileExtension?: boolean;
  /**
   * Prepend folder name to frame names
   *
   * @default true
   */
  prependFolderName?: boolean;
  /**
   * Output file format
   *
   * @default {@link TextureFormat.PNG}
   * @see {@link TextureFormat}
   */
  textureFormat?: TextureFormat;
  /**
   * Export texture as base64 string to atlas meta tag
   *
   * @default false
   */
  base64Export?: boolean;
  /**
   * Scale size and positions in atlas
   *
   * @default 1
   */
  scale?: number;
  /**
   * "Tinify" texture using TinyPNG
   *
   * @default false
   */
  tinify?: boolean;
  /**
   * TinyPNG key
   *
   * @default empty string
   */
  tinifyKey?: string;
  /**
   * Type of packer
   * @see PackerType
   * @default {@link PackerType.MAX_RECTS_BIN}
   */
  packer?: PackerType;
  /**
   * Pack method
   *
   * @default {@link MaxRectsBinMethod.BEST_SHORT_SIDE_FIT}
   * @see MaxRectsBinMethod
   * @see MaxRectsPackerMethod
   */
  packerMethod?: MaxRectsBinMethod | MaxRectsPackerMethod;
  /**
   * Name of predefined exporter (), or custom exporter (see below)
   *
   * @default JsonHash
   */
  exporter?: PackerExporterType | IPackerExporter;
  /**
   * Bitmap filter type
   *
   * @see BitmapFilterType
   * @default {@link BitmapFilterType.NONE}
   */
  filter?: BitmapFilterType;
  /**
   * External application info.
   * Required fields: url and version
   *
   * @default null
   */
  appInfo?: any;
}

/**
 * Texture packer uses {@link http://mustache.github.io/ | mustache} template engine.
 * Look at documentation how to create custom exporter:
 * {@link https://www.npmjs.com/package/free-tex-packer-core#custom-exporter}
 */
export interface IPackerExporter {
  /**
   * File extension
   */
  fileExt: string;
  /**
   * Path to template file (content could be used instead)
   * @see {@link content}
   */
  template?: string;
  /**
   * Template content (template path could be used instead)
   * @see {@link template}
   */
  content?: string;
}
