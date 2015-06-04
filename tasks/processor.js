var cheerio = require('cheerio');
var prism = require('./prism.js');

/*
 * Hello
 */
module.exports = {

	/**
	 * 
	 * @param {string} html
	 * @param {string} common
	 * @returns {string}
	 */
	process: function(html, map, title, id) {
		var $ = cheerio.load(html);
		$('html').attr('id', id);
		processTags($, map, title);
		processPrism($);
		return $.html();
	}
};

// Private .....................................................................

function processTags($, map, title) {
	$('title').text($('title').text() + ' – ' + title);
	$('title').after(pretty([
		'<meta charset="UTF-8"/>',
		'<link rel="stylesheet" href="/css/styles.min.css"/>',
		'<link rel="prefetch" href="/img/gui.svg"/>',
		'<link rel="prefetch" href="/img/edb.svg"/>'
	]));
	$('main').after(pretty([
		'<aside>',
		'\t<nav id="nav">' + htmlmenu(map,'\t\t\t\t'),
		'\t</nav>',
		'</aside>'
	]));
	$('aside').after(pretty([
		'<script src="/js/scripts.min.js"></script>'
	]));
}

function processPrism($) {
	$('script[type="text/plain"]').each(function(i, script) {
		script = $(script);
		var code = unindent(script.text());
		var clas = script.attr('class');
		var lang = clas.split('-')[1];
		var gram = prism.languages[lang];
		var html = prism.highlight(code, gram, lang);
		script.replaceWith(
			$.parseHTML([
				'<pre class="' + clas + '">',
					'<code>' + html + '</code>',
				'</pre>'
			].join('\n'))
		);
	});
}

/**
 * Properly indent those tags.
 * @param {Array<string>} tags
 * @returns {string}
 */
function pretty(tags) {
	return '\n\t' + tags.map(function(tag) {
		return '\t' + tag;
	}).join('\n\t');
}

/**
 * Unindent.
 * @param {string} code
 * @returns {string}
 */
function unindent(code) {
	var tabs = /^\n+\s+/.exec(code)[0].replace(/\n/g, '');
	return code.split('\n').map(function(line, i) {
		return line.replace(tabs, '');
	}).join('\n').trim ();
}

/**
 * Better render the menu as static HTML before the robot gets here.
 * @param {string|Array} sitemap
 * @param {string} tabs
 * @rturns {string}
 */
function htmlmenu(sitemap, tabs) {
	sitemap = Array.isArray(sitemap) ? sitemap : JSON.parse(sitemap);
	return '\n' + sitemap.map(function (i) {
		return (
			tabs + '<li>' +
				'<a href="' + i[1] + '">' + i[0] + '</a>' + 
				(i[2] ? '<nav>' + htmlmenu(i[2], tabs + '\t') + '</nav>' : '' ) +
			'</li>'
		);
	}).join("\n");
}
