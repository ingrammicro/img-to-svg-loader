const fs = require('fs');

var cleanSVG = function(svg) {
	var width = /\ width\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g.exec(svg)
	var height = /\ height\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g.exec(svg)
	var cleanSVG = svg;
	if (width && width[0]) {
		cleanSVG = cleanSVG.replace(width[0], ' ');
	}
	if (height && height[0]) {
		cleanSVG = cleanSVG.replace(height[0], ' ');
	}
	return cleanSVG;
}

var addAttr = function (attr, value, data) {
	var tag = '<svg ';
	var idx = data.indexOf(tag) + tag.length;
	if (idx && attr && value) {
		data = data.slice(0, idx) + attr+'=\"'+value + '\" ' + data.slice(idx);
	}
	return data
}

var checkExtension = function(file, ext) {
	return file && file.slice(file.length - 4, file.length) == ext
}

module.exports = function(source) {
	var callback = this.async();
	const imgTagSrcRegex = /<img\s[^>]*?src\s*=\s*['\\"]([^'\"]*?)['\"][^>]*?>/g;

	var subs = [];
	var output = source;

	while ((matches = imgTagSrcRegex.exec(source)) !== null) {
		if (checkExtension(matches[1], '.svg')) {
			((matches) => {
				subs.push(new Promise((resolve, reject) => {
					var img = matches[0];
					var svgPath = matches[1];
					var ids = /\ id\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g.exec(img)
					var classes = /\ class\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g.exec(img)
					this.resolve(this.context, svgPath, (error, result) => {
						if (!error) {
							fs.readFile(result, 'utf8', (error, data) => {
								if (!error) {
									if (ids && ids[1]) {
										data = addAttr('id', ids[1], data)
									}
									if (classes && classes[1]) {
										data = addAttr('class', classes[1], data)
									}
									data = cleanSVG(data);
									resolve([img, data])
								} else {
									reject(error)
								}
							})
						} else {
							reject(error)
						}
					})
				}));
			})(matches)
		}
	}

	Promise.all(subs).then(function(result) {
		for (sub of result) {
			output = output.replace(sub[0], sub[1]);
		}
		callback(null, output)
	}).catch((error) => {
		callback(error);
	});
};
