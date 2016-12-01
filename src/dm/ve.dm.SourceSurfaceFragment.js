/*!
 * VisualEditor DataModel SourceSurfaceFragment class.
 *
 * @copyright 2011-2016 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Surface fragment for editing surfaces in source mode.
 *
 * @class
 * @extends ve.dm.SurfaceFragment
 *
 * @constructor
 * @param {ve.dm.Document} doc
 */
ve.dm.SourceSurfaceFragment = function VeDmSourceSurfaceFragment() {
	// Parent constructors
	ve.dm.SourceSurfaceFragment.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.SourceSurfaceFragment, ve.dm.SurfaceFragment );

/**
 * @inheritdoc
 */
ve.dm.SourceSurfaceFragment.prototype.annotateContent = function () {
	var fragment, tempDocument, rangeInDocument, tempSurfaceModel,
		originalDocument = this.getDocument(),
		coveringRange = this.getSelection().getCoveringRange();

	if ( !coveringRange.isCollapsed() ) {
		tempDocument = originalDocument.shallowCloneFromRange( coveringRange );
		rangeInDocument = tempDocument.originalRange;
	} else {
		tempDocument = new ve.dm.Document(
			[
				{ type: 'paragraph', internal: { generated: 'wrapper' } }, { type: '/paragraph' },
				{ type: 'internalList' }, { type: '/internalList' }
			],
			null, null, null, null,
			originalDocument.getLang(),
			originalDocument.getDir()
		);
		rangeInDocument = new ve.Range( 1 );
	}
	tempSurfaceModel = new ve.dm.Surface( tempDocument );
	fragment = tempSurfaceModel.getLinearFragment( rangeInDocument );
	fragment.annotateContent.apply( fragment, arguments );

	this.insertDocument( fragment.getDocument() );

	return this;
};

/**
 * @inheritdoc
 */
ve.dm.SourceSurfaceFragment.prototype.insertContent = function ( content ) {
	var data;

	if ( typeof content !== 'string' ) {
		data = new ve.dm.ElementLinearData( new ve.dm.IndexValueStore(), content );
		if ( !data.isPlainText( null, false, [ 'paragraph' ] ) ) {
			this.insertDocument( new ve.dm.Document( content.concat( [ { type: 'internalList' }, { type: '/internalList' } ] ) ) );
			return this;
		}
	}

	// Parent method
	return ve.dm.SourceSurfaceFragment.super.prototype.insertContent.call( this, content );
};

/**
 * @inheritdoc
 */
ve.dm.SourceSurfaceFragment.prototype.insertDocument = function ( doc, newDocRange ) {
	var range = this.getSelection().getCoveringRange(),
		fragment = this;

	if ( !range ) {
		return this;
	}

	newDocRange = newDocRange || new ve.Range( 0, doc.getInternalList().getListNode().getOuterRange().start );

	if ( doc.data.isPlainText( newDocRange, false, [ 'paragraph' ] ) ) {
		return ve.dm.SourceSurfaceFragment.super.prototype.insertContent.call( this, doc.data.getDataSlice( newDocRange ) );
	}

	/* conversionPromise = */ this.convertDocument( doc )
		.done( function ( source ) {
			fragment.removeContent();

			if ( source ) {
				// Parent method
				ve.dm.SourceSurfaceFragment.super.prototype.insertContent.call( fragment, source.trim() );
			}
		} )
		.fail( function () {
			ve.error( 'Failed to convert document', arguments );
		} );

	return this;
};

/**
 * @inheritdoc
 */
ve.dm.SourceSurfaceFragment.prototype.wrapAllNodes = function ( wrapOuter, wrapEach ) {
	var i, node, nodes,
		content,
		range = this.getSelection().getCoveringRange();

	if ( !range ) {
		return this;
	}

	function getOpening( element ) {
		element.internal = {
			whitespace: [ '\n', '\n', '\n', '\n' ]
		};
		return element;
	}

	function getClosing( element ) {
		return { type: '/' + element.type };
	}

	if ( !Array.isArray( wrapOuter ) ) {
		wrapOuter = [ wrapOuter ];
	}

	wrapEach = wrapEach || [];

	if ( !Array.isArray( wrapEach ) ) {
		wrapEach = [ wrapEach ];
	}

	nodes = this.getSelectedLeafNodes();

	content = wrapOuter.map( getOpening );
	for ( i = 0; i < nodes.length; i++ ) {
		node = nodes[ i ];
		content = content
			.concat( wrapEach.map( getOpening ) )
			.concat( this.getSurface().getLinearFragment( node.getRange() ).getText().split( '' ) )
			.concat( wrapEach.reverse().map( getClosing ) );
	}
	content = content.concat( wrapOuter.reverse().map( getClosing ) );

	this.insertContent( content );

	return this;
};

/**
 * Convert sub document to source text
 *
 * The default implementation converts to HTML synchronously.
 *
 * If the conversion is asynchornous it should lock the surface
 * until complete.
 *
 * @param {ve.dm.Document} doc Document
 * @return {jQuery.Promise} Promise with resolves with source, or rejects
 */
ve.dm.SourceSurfaceFragment.prototype.convertDocument = function ( doc ) {
	if ( !doc.data.hasContent() ) {
		return $.Deferred().reject().promise();
	} else {
		return $.Deferred().resolve(
			ve.properInnerHtml(
				ve.dm.converter.getDomFromModel( doc ).body
			)
		).promise();
	}
};
