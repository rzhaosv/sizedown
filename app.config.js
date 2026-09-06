// Web export needs a base URL because the app is served from tryforma.app/sizedown/app/.
// Setting experiments.baseUrl in app.json breaks native builds (asset paths), so apply it only when WEB_BASE_URL is set:
//   WEB_BASE_URL=/sizedown/app npx expo export -p web --output-dir ../forma/web/sizedown/app
module.exports = ({ config }) => ({
  ...config,
  experiments: process.env.WEB_BASE_URL ? { ...(config.experiments || {}), baseUrl: process.env.WEB_BASE_URL } : config.experiments,
});
