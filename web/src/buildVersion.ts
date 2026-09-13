/** Вшивается при pack.ps1 из ObjectModule.ВерсияПриложения() — версия React-бандла в Template.bin. */
declare const __EDO_UI_VERSION__: string;

export const UI_BUILD_VERSION =
  typeof __EDO_UI_VERSION__ !== "undefined" && __EDO_UI_VERSION__ ? __EDO_UI_VERSION__ : "0.0.0-dev";
