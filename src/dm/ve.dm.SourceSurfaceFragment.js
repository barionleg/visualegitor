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

	if ( coveringRange ) {
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
	var i, l, data,
		isPlainText = true;

	if ( typeof content !== 'string' ) {
		for ( i = 0, l = content.length; i < l; i++ ) {
			data = content[ i ];
			if ( typeof data === 'string' ) {
				continue;
			}
			if ( Array.isArray( data ) || ve.dm.LinearData.static.getType( data ) !== 'paragraph' ) {
				isPlainText = false;
				break;
			}
		}
		if ( !isPlainText ) {
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
ve.dm.SourceSurfaceFragment.prototype.insertDocument = function ( doc ) {
	var conversionPromise,
		range = this.getSelection().getCoveringRange(),
		fragment = this;

	if ( !range ) {
		return this;
	}

	conversionPromise = this.convertDocument( doc ).always( function ( source ) {
		fragment.removeContent();

		if ( source ) {
			// Parent method
			ve.dm.SourceSurfaceFragment.super.prototype.insertContent.call( fragment, source.trim() );
		}
	} );

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
