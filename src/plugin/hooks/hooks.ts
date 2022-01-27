import {AsyncSeriesHook} from "tapable";
import {Compilation} from "webpack";

const hookMap = new WeakMap();

export function getWebpackTexturePackerPluginHooks(compilation: Compilation): WebpackTexturePackerPluginHooks {
  let hooks = hookMap.get(compilation);
  if (hooks === undefined) {
    hooks = createPluginHooks();
    hookMap.set(compilation, hooks);
  }
  return hooks;
}

interface WebpackTexturePackerPluginHooks {
  texturePackerEmitAtlas: AsyncSeriesHook<[{ path: string, content: Buffer }[], any | undefined]>;
  texturePackerEmitComplete: AsyncSeriesHook<void>;
}

function createPluginHooks(): WebpackTexturePackerPluginHooks {
  return {
    texturePackerEmitAtlas: new AsyncSeriesHook(["atlas", "extra"]),
    texturePackerEmitComplete: new AsyncSeriesHook(),
  };
}
