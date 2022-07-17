export const manifest = {
	appDir: "_app",
	assets: new Set(["logo.png","logo.pxd/QuickLook/Icon.tiff","logo.pxd/QuickLook/Thumbnail.tiff","logo.pxd/data/CB14ED7E-F707-4EAF-9820-D482138ED25C","logo.pxd/metadata.info","manifest.json","p2pt.umd.min.js"]),
	mimeTypes: {".png":"image/png",".tiff":"image/tiff",".json":"application/json",".js":"application/javascript"},
	_: {
		entry: {"file":"immutable/start-e0aaf2dd.js","imports":["immutable/start-e0aaf2dd.js","immutable/chunks/index-efba8a9f.js","immutable/chunks/singletons-cdeec3fd.js"],"stylesheets":[]},
		nodes: [
			() => import('../output/server/nodes/0.js'),
			() => import('../output/server/nodes/1.js'),
			() => import('../output/server/nodes/2.js')
		],
		routes: [
			{
				type: 'page',
				id: "",
				pattern: /^\/$/,
				names: [],
				types: [],
				path: "/",
				shadow: null,
				a: [0,2],
				b: [1]
			},
			{
				type: 'endpoint',
				id: "cipherHash",
				pattern: /^\/cipherHash\/?$/,
				names: [],
				types: [],
				load: () => import('../output/server/entries/endpoints/cipherHash.js')
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
