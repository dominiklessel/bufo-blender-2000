// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "bufo-blender-2000",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "lessel-xyz",
          region: "eu-central-1",
        },
      },
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("BufoBlender2000Bucket", {
      public: false,
    });

    const hono = new sst.aws.Function("Hono", {
      link: [bucket],
      url: true,
      timeout: "90 seconds",
      runtime: "nodejs22.x",
      memory: "8192 MB",
      nodejs: {
        install: ["canvas"],
      },
      handler: "src/functions/process.handler",
      copyFiles: [
        { from: "src/functions/all-the-bufo", to: "all-the-bufo" },
        {
          from: "src/functions/emoji-metadata.json",
          to: "emoji-metadata.json",
        },
      ],
    });

    return {
      url: hono.url,
    };
  },
});
