/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === "ENOTDIR" || err.code === "EBADF") {
        if (dirFile.endsWith(".tsx") || dirFile.endsWith(".ts")) {
          filelist.push(dirFile);
        }
      } else {
        throw err;
      }
    }
  });
  return filelist;
};

const dirs = [
  path.join(__dirname, "app"),
  path.join(__dirname, "components"),
  path.join(__dirname, "actions"),
];

let files = [];
dirs.forEach((d) => {
  files = files.concat(walkSync(d));
});

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  // Replace shadow classes
  content = content.replace(/\bshadow-[a-zA-Z0-9/-]+\b/g, "");
  content = content.replace(/\bhover:shadow-[a-zA-Z0-9/-]+\b/g, "");
  content = content.replace(/\bshadow\b/g, ""); // just "shadow"

  // Replace rounded classes
  content = content.replace(/\brounded-xl\b/g, "rounded-lg");
  content = content.replace(/\brounded-2xl\b/g, "rounded-lg");
  content = content.replace(/\brounded-3xl\b/g, "rounded-lg");

  // Replace border-slate-100 with border-slate-200
  content = content.replace(/\bborder-slate-100\b/g, "border-slate-200");

  // Clean up double spaces created by regex
  content = content.replace(/  +/g, " ");

  // Fix `className=" "` empty classNames if any, though unlikely to break it.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated ${file}`);
  }
});
