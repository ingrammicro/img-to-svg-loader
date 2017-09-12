const fs = require('fs');

const attrLookup = {
	id: /id\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g,
	class: /class\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g,
	width: /width\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g,
	height: /height\s*=\s*['\\"]([^'\"]*?)['\"][^>]/g
}

var cleanSVG = function(svg) {
	var width = attrLookup.width.exec(svg)
	var height = attrLookup.height.exec(svg)
	if (width && width[0]) {
		svg = svg.replace(width[0], '');
	}
	if (height && height[0]) {
		svg = svg.replace(height[0], '');
	}
	return svg;
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
			subs.push(new Promise((resolve, reject) => {
				var img = matches[0];
				var svgPath = matches[1];
				var ids = attrLookup.id.exec(img)
				var classes = attrLookup.class.exec(img)
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