/*!
 * VisualEditor HTML sanitization utilities.
 *
 * @copyright 2011-2019 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global DOMPurify */

/**
 * Parse and sanitize an HTML string, making user HTML safe to load on the page
 *
 * @param {string} html HTML
 * @param {boolean} returnDocument If true, return whole document; else return node list
 * @return {NodeList|HTMLDocument} Node list or HTML document
 */
ve.sanitizeHtml = function ( html, returnDocument ) {
	// TODO: Move MW-specific rules to ve-mw
	var options,
		addTags = [ 'figure-inline' ],
		addAttrs = [
			'srcset',
			// RDFa
			'about', 'rel', 'resource', 'property', 'content', 'datatype', 'typeof'
		];
	options = {
		ADD_TAGS: addTags,
		ADD_ATTR: addAttrs,
		ADD_URI_SAFE_ATTR: addAttrs,
		FORBID_TAGS: [ 'style' ]
	};
	if ( !returnDocument ) {
		options.FORCE_BODY = true;
		options.RETURN_DOM_FRAGMENT = true;
		return DOMPurify.sanitize( html, options ).childNodes;
	}
	options.RETURN_DOM = true;
	return DOMPurify.sanitize( html, options ).ownerDocument;
};

ve.sanitizeHtmlToDocument = function ( html ) {
	return ve.sanitizeHtml( html, true );
};
