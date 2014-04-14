/*!
 * VisualEditor ContentEditable ContentBranchNode class.
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * ContentEditable content branch node.
 *
 * Content branch nodes can only have content nodes as children.
 *
 * @abstract
 * @extends ve.ce.BranchNode
 * @constructor
 * @param {ve.dm.BranchNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.ContentBranchNode = function VeCeContentBranchNode( model, config ) {
	// Parent constructor
	ve.ce.BranchNode.call( this, model, config );

	// Properties
	this.lastTransaction = null;
	this.unicornAnnotations = null;
	this.unicorns = null;

	// Events
	this.connect( this, { 'childUpdate': 'onChildUpdate' } );
};

/* Inheritance */

OO.inheritClass( ve.ce.ContentBranchNode, ve.ce.BranchNode );

/* Static Members */

/**
 * Whether Enter splits this node type. Must be true for ContentBranchNodes.
 *
 * Warning: overriding this to false in a subclass will cause crashes on Enter key handling.
 *
 * @static
 * @property
 * @inheritable
 */
ve.ce.ContentBranchNode.static.splitOnEnter = true;

/* Static Methods */

/**
 * Append the return value of #getRenderedContents to a DOM element.
 *
 * @param {HTMLElement} container DOM element
 * @param {HTMLElement} wrapper Wrapper returned by #getRenderedContents
 */
ve.ce.ContentBranchNode.static.appendRenderedContents = function ( container, wrapper ) {
	function resolveOriginals( domElement ) {
		var i, len, child;
		for ( i = 0, len = domElement.childNodes.length; i < len; i++ ) {
			child = domElement.childNodes[i];
			if ( child.veOrigNode ) {
				domElement.replaceChild( child.veOrigNode, child );
			} else if ( child.childNodes && child.childNodes.length ) {
				resolveOriginals( child );
			}
		}
	}

	/* Resolve references to the original nodes. */
	resolveOriginals( wrapper );
	while ( wrapper.firstChild ) {
		container.appendChild( wrapper.firstChild );
	}
};

/* Methods */

/**
 * Handle splice events.
 *
 * Rendering is only done once per transaction. If a paragraph has multiple nodes in it then it's
 * possible to receive multiple `childUpdate` events for a single transaction such as annotating
 * across them. State is tracked by storing and comparing the length of the surface model's complete
 * history.
 *
 * This is used to automatically render contents.
 * @see ve.ce.BranchNode#onSplice
 *
 * @method
 */
ve.ce.ContentBranchNode.prototype.onChildUpdate = function ( transaction ) {
	if ( transaction === null || transaction === this.lastTransaction ) {
		this.lastTransaction = transaction;
		return;
	}
	this.renderContents();
};

/**
 * Handle splice events.
 *
 * This is used to automatically render contents.
 * @see ve.ce.BranchNode#onSplice
 *
 * @method
 */
ve.ce.ContentBranchNode.prototype.onSplice = function () {
	// Parent method
	ve.ce.BranchNode.prototype.onSplice.apply( this, arguments );

	// Rerender to make sure annotations are applied correctly
	this.renderContents();
};

/**
 * Get an HTML rendering of the contents.
 *
 * If you are actually going to append the result to a DOM, you need to
 * do this with #appendRenderedContents, which resolves the cloned
 * nodes returned by this function back to their originals.
 *
 * @method
 * @returns {HTMLElement} Wrapper containing rendered contents
 */
ve.ce.ContentBranchNode.prototype.getRenderedContents = function () {
	var i, ilen, j, jlen, item, itemAnnotations, ann, clone, dmSurface, dmRange, relCursor,
		unicorn, img1, img2, annotationsChanged, childLength, offset, htmlItem, ceSurface,
		store = this.model.doc.getStore(),
		annotationStack = new ve.dm.AnnotationSet( store ),
		annotatedHtml = [],
		doc = this.getElementDocument(),
		wrapper = doc.createElement( 'div' ),
		current = wrapper,
		buffer = '',
		node = this;

	function openAnnotation( annotation ) {
		annotationsChanged = true;
		if ( buffer !== '' ) {
			current.appendChild( doc.createTextNode( buffer ) );
			buffer = '';
		}
		// Create a new DOM node and descend into it
		ann = ve.ce.annotationFactory.create(
			annotation.getType(), annotation, node, { '$': node.$ }
		).$element[0];
		current.appendChild( ann );
		current = ann;
	}

	function closeAnnotation() {
		annotationsChanged = true;
		if ( buffer !== '' ) {
			current.appendChild( doc.createTextNode( buffer ) );
			buffer = '';
		}
		// Traverse up
		current = current.parentNode;
	}

	// Gather annotated HTML from the child nodes
	for ( i = 0, ilen = this.children.length; i < ilen; i++ ) {
		annotatedHtml = annotatedHtml.concat( this.children[i].getAnnotatedHtml() );
	}

	// Set relCursor to collapsed selection offset, or -1 if none
	// (in which case we don't need to worry about preannotation)
	relCursor = -1;
	if ( this.getRoot() ) {
		ceSurface = this.getRoot().getSurface();
		dmSurface = ceSurface.getModel();
		dmRange = dmSurface.getTranslatedSelection();
		if ( dmRange && dmRange.start === dmRange.end ) {
			// subtract 1 for CBN opening tag
			relCursor = dmRange.start - this.getOffset() - 1;
		}
	}

	// Splice the unicorn into the collapsed selection offset, if relevant.
	// It will be rendered later if it is needed, else ignored
	if ( relCursor > -1 ) {
		offset = 0;
		for ( i = 0, ilen = annotatedHtml.length; i < ilen; i++ ) {
			htmlItem = annotatedHtml[i][0];
			if ( typeof htmlItem === 'string' ) {
				childLength = 1;
			} else if ( htmlItem.hasClass ) {
				childLength = 2;
			} else {
				ve.log( 'Unknown node type: ', htmlItem );
				throw new Error( 'Unknown node type: ' + htmlItem );
			}
			if ( offset <= relCursor && relCursor < offset + childLength ) {
				unicorn = [
					{}, // unique object, for testing object equality later
					dmSurface.getInsertionAnnotations().storeIndexes
				];
				annotatedHtml.splice( i, 0, unicorn );
				break;
			}
			offset += childLength;
		}
		// Special case for final position
		if ( i === ilen && offset === relCursor ) {
			unicorn = [
				{}, // unique object, for testing object equality later
				dmSurface.getInsertionAnnotations().storeIndexes
			];
			annotatedHtml.push( unicorn );
		}
		if ( !unicorn ) {
			ceSurface.setNotUnicorning( this );
		}
	}

	// Render HTML with annotations
	for ( i = 0, ilen = annotatedHtml.length; i < ilen; i++ ) {
		if ( ve.isArray( annotatedHtml[i] ) ) {
			item = annotatedHtml[i][0];
			itemAnnotations = new ve.dm.AnnotationSet( store, annotatedHtml[i][1] );
		} else {
			item = annotatedHtml[i];
			itemAnnotations = new ve.dm.AnnotationSet( store );
		}

		annotationsChanged = false;
		ve.dm.Converter.openAndCloseAnnotations( annotationStack, itemAnnotations,
			openAnnotation, closeAnnotation
		);

		// Handle the actual item
		if ( typeof item === 'string' ) {
			buffer += item;
		} else if ( unicorn && item === unicorn[0] ) {
			if ( annotationsChanged ) {
				if ( buffer !== '' ) {
					current.appendChild( doc.createTextNode( buffer ) );
					buffer = '';
				}
				img1 = doc.createElement( 'img' );
				img2 = doc.createElement( 'img' );
				img1.className = 've-ce-unicorn ve-ce-pre-unicorn';
				img2.className = 've-ce-unicorn ve-ce-post-unicorn';
				$( img1 ).data( 'dmOffset', ( this.getOffset() + 1 + i ) );
				$( img2 ).data( 'dmOffset', ( this.getOffset() + 1 + i ) );
				if ( ve.debug ) {
					img1.setAttribute( 'src', ve.ce.unicornImgDataUri );
					img2.setAttribute( 'src', ve.ce.unicornImgDataUri );
				} else {
					img1.setAttribute( 'src', ve.ce.minImgDataUri );
					img2.setAttribute( 'src', ve.ce.minImgDataUri );
					img1.style.width = '0px';
					img2.style.width = '0px';
					img1.style.height = '0px';
					img2.style.height = '0px';
				}
				current.appendChild( img1 );
				current.appendChild( img2 );
				this.unicornAnnotations = dmSurface.getInsertionAnnotations();
				this.unicorns = [ img1, img2 ];
				ceSurface.setUnicorning( this );
			} else {
				this.unicornAnnotations = null;
				this.unicorns = null;
				ceSurface.setNotUnicorningAll( this );
			}
		} else {
			if ( buffer !== '' ) {
				current.appendChild( doc.createTextNode( buffer ) );
				buffer = '';
			}
			// DOM equivalent of $( current ).append( item.clone() );
			for ( j = 0, jlen = item.length; j < jlen; j++ ) {
				// Append a clone so as to not relocate the original node
				clone = item[j].cloneNode( true );
				// Store a reference to the original node in a property
				clone.veOrigNode = item[j];
				current.appendChild( clone );
			}
		}
	}
	if ( buffer !== '' ) {
		current.appendChild( doc.createTextNode( buffer ) );
		buffer = '';
	}
	return wrapper;

};

/**
 * Render contents.
 *
 * @method
 */
ve.ce.ContentBranchNode.prototype.renderContents = function () {
	var i, len, node, rendered, oldWrapper, newWrapper;
	if (
		this.root instanceof ve.ce.DocumentNode &&
		this.root.getSurface().isRenderingLocked()
	) {
		return;
	}

	if ( this.root instanceof ve.ce.DocumentNode ) {
		this.root.getSurface().setContentBranchNodeChanged( true );
	}

	rendered = this.getRenderedContents();

	// Return if unchanged. Test by building the new version and checking DOM-equality.
	// However we have to normalize to cope with consecutive text nodes. We can't normalize
	// the attached version, because that would close IMEs.

	oldWrapper = this.$element[0].cloneNode( true );
	newWrapper = this.$element[0].cloneNode( false );
	while ( rendered.firstChild ) {
		newWrapper.appendChild( rendered.firstChild );
	}
	oldWrapper.normalize();
	newWrapper.normalize();
	if ( newWrapper.isEqualNode( oldWrapper ) ) {
		return;
	}

	// Detach all child nodes from this.$element
	for ( i = 0, len = this.$element.length; i < len; i++ ) {
		node = this.$element[i];
		while ( node.firstChild ) {
			node.removeChild( node.firstChild );
		}
	}

	// Reattach nodes
	this.constructor.static.appendRenderedContents( this.$element[0], newWrapper );

	// Add slugs
	this.setupSlugs();

	// Highlight the node in debug mode
	if ( ve.debug ) {
		this.$element.css( 'backgroundColor', '#eee' );
		setTimeout( ve.bind( function () {
			this.$element.css( 'backgroundColor', '' );
		}, this ), 500 );
	}
};

/**
 * Handle teardown event.
 *
 * @method
 */
ve.ce.ContentBranchNode.prototype.onTeardown = function () {
	var ceSurface = this.getRoot().getSurface();
	ve.ce.BranchNode.prototype.onTeardown.call( this );
	ceSurface.setNotUnicorning( this );
};
