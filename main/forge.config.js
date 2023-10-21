const path = require("path");

module.exports = {
   packagerConfig: {
      asar: true,
      icon: path.join(__dirname, "dist", "assets", "logo", "logo_ico_256x256.ico"),
   },
   makers: [
      {
         name: "@electron-forge/maker-squirrel",
         config: {
            name: "screenmix",
            iconUrl: path.join(__dirname, "dist", "assets", "logo", "logo_ico_256x256.ico"),
            setupIcon: path.join(__dirname, "dist", "assets", "logo", "logo_ico_256x256.ico"),
         },
      },
      {
         name: "@electron-forge/maker-zip",
         platforms: ["darwin"],
      },
      {
         name: "@electron-forge/maker-deb",
         config: {},
      },
      {
         name: "@electron-forge/maker-rpm",
         config: {},
      },
   ],
};
