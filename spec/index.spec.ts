import * as path from "path";
import {Stats} from "webpack";
import webpack = require("webpack");
import {PackerExporterType, WebpackTexturePackerPlugin} from "../src";

jest.setTimeout(30000);

describe("plugin tests", () => {
  it("running", (done) => {
    webpack({
        mode: "production",
        entry: path.join(__dirname, "fixtures/index.js"),
        output: {
          path: path.join(__dirname, "dist"),
          filename: "index_bundle.js",
        },
        plugins: [new WebpackTexturePackerPlugin({
          rootDir: path.join(__dirname, "fixtures/simple/assets"),
          items: [
            {
              outDir: "assets/atlases",
              name: "enemies",
              source: "enemies",
              packerOptions: {exporter: PackerExporterType.PIXI, removeFileExtension: true},
            },
            {
              name: "environment",
              outDir: "assets/atlases",
              source: [
                {
                  path: "environment",
                },
                {
                  path: "weapons",
                  exclude: "weapon_r*",
                  recursive: true,
                },
              ],
            },
            {
              rootDir: "ui",
              name: "ui",
              outDir: "assets/ui",
            },
          ],
        })],
      },
      (error: Error, stats: Stats) => {
        expect(error)
          .toBeNull();
        done();
      });
  });
});
