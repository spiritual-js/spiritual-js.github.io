var cheerio = require('cheerio');
var prism = require('./prism.js');
var beautify_html = require('js-beautify').html;

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
		processTags($, map, title, id);
		processPrism($);
		return beautify_html($.html(), {
			indent_size: 1,
			indent_char: '\t',
			indent_inner_html: true
		});
	}
};

// Private .....................................................................

/**
 * TODO: Enable zoom again (by not using position:fixed in the CSS).
 */
function processTags($, map, title, id) {
	var root = $('<div id="root"></div>');
	var html = $('html');
	var body = $('body');
	var main = $('main');
	var titl = $('title');
	var text = titl.text();
	if(text !== title) {
		titl.text(text + ' – ' + title);
	}
	titl.after(join([
		'<meta charset="UTF-8"/>',
		'<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />',
		'<link rel="stylesheet" href="/css/styles.min.css"/>',
		'<link rel="prefetch" href="/img/gui.svg"/>',
		'<link rel="prefetch" href="/img/edb.svg"/>'
	]));
	root.append(join([
		'<header>',
			'<nav>',
				'<li><a class="toggle">',
					'<span>&mdash;</span>',
					'<span>&mdash;</span>',
					'<span>&mdash;</span>',
				'</a></li>',
				'<li><a href="/gui/" class="spiritual-gui">GUI</a></li>',
				'<li><a href="/edb/" class="spiritual-edb">EDB</a></li>',
				'<li><a href="/edbml/" class="spiritual-edbml">EDBML</a></li>',
			'</nav>',
		'</header>'
	]));
	root.find('a[class="spiritual-' + id + '"]').addClass('selected');
	root.append(main);
	root.append(join([
		'<aside>',
			'<nav id="nav">',
				htmlmenu(map,'\t\t\t\t'),
			'</nav>',
		'</aside>'
	]));
	body.append(root);
	body.append(join([
		'<script src="/js/scripts.js"></script>'
	]));
	html.attr('lang', 'en');
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

function join(tags) {
	return tags.join('\n');
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
 * @param {string} tabs (not needed now that some modules handles it)
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
