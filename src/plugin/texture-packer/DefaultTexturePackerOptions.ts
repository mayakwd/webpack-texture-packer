import {ITexturePackerOptions, MaxRectsPackerMethod, PackerExporterType, PackerType} from "./ITexturePackerOptions";

export const defaultTexturePackerOptions: ITexturePackerOptions = {
  fixedSize: false,
  padding: 1,
  allowRotation: true,
  detectIdentical: true,
  allowTrim: true,
  exporter: PackerExporterType.PIXI,
  removeFileExtension: true,
  prependFolderName: true,
  packer: PackerType.MAX_RECTS_PACKER,
  packerMethod: MaxRectsPackerMethod.SMART,
};
