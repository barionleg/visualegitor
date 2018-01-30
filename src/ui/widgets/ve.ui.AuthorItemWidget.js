/*!
 * VisualEditor UserInterface AuthorItemWidget class.
 *
 * @copyright 2011-2018 VisualEditor Team and others; see http://ve.mit-license.org
 * @license The MIT License (MIT); see LICENSE.txt
 */

/* global CP */

/**
 * UserInterface AuthorItemWidget
 *
 * @class
 * @extends OO.ui.Widget
 * @mixins OO.ui.mixin.IconElement
 * @mixins OO.ui.mixin.LabelElement
 *
 * @constructor
 * @param {ve.dm.SurfaceSynchronizer} synchronizer Surface synchronizer
 * @param {jQuery} $overlay Overlay in which to attach popups (e.g. color picker)
 * @param {Object} [config] Configuration options
 */
ve.ui.AuthorItemWidget = function VeUiAuthorItemWidget( synchronizer, $overlay, config ) {
	var item = this;

	config = config || {};

	// Parent constructor
	ve.ui.AuthorItemWidget.super.call( this, config );

	// Mixin constructors
	OO.ui.mixin.LabelElement.call( this, config );

	this.synchronizer = synchronizer;
	this.editable = !!config.editable;
	this.authorId = config.authorId;

	this.$color = $( '<div>' ).addClass( 've-ui-authorItemWidget-color' );
	this.$element.append( this.$color );

	if ( this.editable ) {
		this.input = new OO.ui.TextInputWidget( {
			classes: [ 've-ui-authorItemWidget-nameInput' ]
		} );

		this.colorPicker = new CP( this.$color[ 0 ] );
		this.colorPicker.on( 'change', function ( color ) {
			item.$color.css( 'background-color', '#' + color );
		} );
		this.colorPicker.on( 'exit', function ( /* color */ ) {
			// TODO: this.synchronizer.setAuthorColor( ... )
		} );

		this.colorPicker.picker.classList.add( 've-ui-authorItemWidget-colorPicker' );
		this.colorPicker.fit = function () {
			this.picker.style.left = item.$element[ 0 ].offsetLeft + 'px';
			this.picker.style.top = item.$element[ 0 ].offsetTop + 'px';
			$overlay.append( this.picker );
		};

		this.$element
			.addClass( 've-ui-authorItemWidget-editable' )
			.append( this.input.$element );
	} else {
		this.$element.append( this.$label );
	}

	this.update();

	this.$element.addClass( 've-ui-authorItemWidget' );
};

/* Inheritance */

OO.inheritClass( ve.ui.AuthorItemWidget, OO.ui.Widget );

OO.mixinClass( ve.ui.AuthorItemWidget, OO.ui.mixin.IconElement );

OO.mixinClass( ve.ui.AuthorItemWidget, OO.ui.mixin.LabelElement );

/* Methods */

/**
 * Set author ID
 *
 * @param {number} authorId Author ID
 */
ve.ui.AuthorItemWidget.prototype.setAuthorId = function ( authorId ) {
	this.authorId = authorId;
};

/**
 * Update name and color from synchronizer
 */
ve.ui.AuthorItemWidget.prototype.update = function () {
	var name = this.synchronizer.authorNames[ this.authorId ],
		color = this.synchronizer.constructor.static.getAuthorColor( this.authorId );

	this.$color.css( 'background-color', '#' + color );

	if ( this.editable ) {
		this.input.setValue( name );
		this.colorPicker.set( '#' + color );
	} else {
		this.setLabel( name );
	}
};
