/*!
 * VisualEditor UserInterface UrlStringTransferHandler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Handle pastes and drag-and-drop of URLs and links.
 * Attempts to preserve link titles when possible.
 *
 * @class
 * @extends ve.ui.PlainTextStringTransferHandler
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {ve.ui.DataTransferItem} item
 */
ve.ui.UrlStringTransferHandler = function VeUiUrlStringTransferHandler() {
	// Parent constructor
	ve.ui.UrlStringTransferHandler.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.UrlStringTransferHandler, ve.ui.PlainTextStringTransferHandler );

/* Static properties */

ve.ui.UrlStringTransferHandler.static.name = 'urlString';

ve.ui.UrlStringTransferHandler.static.types = [
	// DnD standard, no title information
	'text/uri-list',
	// Firefox type, preserves title
	'text/x-moz-url',
	// Used in GNOME drag-and-drop
	'text/x-uri',
	// Identify links in pasted plain text as well
	'text/plain'
];

ve.ui.UrlStringTransferHandler.static.handlesPaste = true;

/**
 * RegExp matching an external url.
 * @property {RegExp}
 * @private
 */
ve.ui.UrlStringTransferHandler.static.urlRegExp = null; // Initialized below

ve.init.Platform.static.initializedPromise.then( function () {
	ve.ui.UrlStringTransferHandler.static.urlRegExp =
		new RegExp(
			ve.init.platform.getExternalLinkUrlProtocolsRegExp().source +
				'\\S+$'
		);
} );

/* Methods */

ve.ui.UrlStringTransferHandler.static.matchFunction = function ( item ) {
	// Match all specific mime types
	if (
		ve.ui.UrlStringTransferHandler.static.types.indexOf( item.type ) >= 0 &&
		item.type !== 'text/plain'
	) {
		return true;
	}

	// If the type if unspecified or text/plain, then let's check whether it
	// is a valid URL.
	return ve.ui.UrlStringTransferHandler.static.urlRegExp.test(
		item.getAsString()
	);
};

/**
 * @inheritdoc
 */
ve.ui.UrlStringTransferHandler.prototype.process = function () {
	var links,
		htmldoc,
		result,
		surface = this.surface,
		linkAction = ve.ui.actionFactory.create( 'link', surface ),
		data = this.item.getAsString();

	switch ( this.item.type ) {
	case 'text/uri-list':
		// text/uri-list has embedded comments; remove them before autolinking.
		// In theory the embedded comments can be used for link titles,
		// but I've never seen this done by real apps.  You could add
		// code here to annotate the links with the comment information
		// if you can find a spec for how it should be done.
		links = data.replace( /^#.*(\r\n?|\n|$)/mg, '' ).trim()
			.split( /[\r\n]+/g ).map( function ( line ) {
				return { href: line, title: line };
			} );

		// When Google Chrome uses this mime type the link titles can
		// be extracted from the 'text/html' version of the item.
		// Let's try that.
		if ( ve.getProp( this.item.data, 'dataTransfer', 'getData' ) ) {
			htmldoc = this.item.data.dataTransfer.getData( 'text/html' );
			if ( htmldoc ) {
				htmldoc = ve.createDocumentFromHtml( htmldoc );
				links = $.makeArray( htmldoc.querySelectorAll( 'a[href]' ) )
					.map( function ( a ) {
						return { href: a.href, title: a.textContent };
					} );
			}
		}
		break;
	case 'text/x-moz-url':
		// text/x-moz-url includes titles with the links
		// Use 'trim' to eliminate trailing newline, if present
		links = data.match( /^(.*)(\r\n?|\n)(.*)$/mg ).map( function ( item ) {
			item = item.split( /[\r\n]+/ );
			return { href: item[0], title: item[1] };
		} );
		break;
	default:
		// A single URL
		links = [ { href: data.trim(), title: data } ];
		break;
	}

	// Create linked text.
	result = [];
	links.forEach( function ( link ) {
		var i,
			store = surface.getModel().getDocument().getStore(),
			annotation = linkAction.getLinkAnnotation( link.href ),
			annotationSet = new ve.dm.AnnotationSet( store, store.indexes( [
				annotation
			] ) ),
			content = link.title.split( '' );
		ve.dm.Document.static.addAnnotationsToData( content, annotationSet );
		for ( i = 0; i < content.length; i++ ) {
			result.push( content[i] );
		}
		result.push( ' ' );
	} );
	this.resolve( result );
};

/* Registration */

ve.ui.dataTransferHandlerFactory.register( ve.ui.UrlStringTransferHandler );
