/*!
 * VisualEditor UserInterface GoogleMapsDialog class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/* global google */

/**
 * Dialog for editing Google maps.
 *
 * @class
 * @extends ve.ui.NodeDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.GoogleMapsDialog = function VeUiGoogleMapsDialog( config ) {
	// Parent constructor
	ve.ui.GoogleMapsDialog.super.call( this, config );

	this.mapsApiPromise = null;
};

/* Inheritance */

OO.inheritClass( ve.ui.GoogleMapsDialog, ve.ui.NodeDialog );

/* Static Properties */

ve.ui.GoogleMapsDialog.static.name = 'googleMaps';

ve.ui.GoogleMapsDialog.static.title = 'Google map';
	//OO.ui.deferMsg( 'visualeditor-dialog-reference-title' );

ve.ui.GoogleMapsDialog.static.size = 'large';

ve.ui.GoogleMapsDialog.static.icon = 'map-marker';

ve.ui.GoogleMapsDialog.static.actions = [
	{
		action: 'apply',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-apply' ),
		flags: [ 'progressive', 'primary' ],
		modes: 'edit'
	},
	{
		action: 'insert',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-insert' ),
		flags: [ 'primary', 'constructive' ],
		modes: 'insert'
	},
	{
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-cancel' ),
		flags: 'safe',
		modes: [ 'insert', 'edit', 'insert-select' ]
	}
];

ve.ui.GoogleMapsDialog.static.modelClasses = [ ve.dm.GoogleMapsNode ];

/**
 * @inheritdoc
 */
ve.ui.GoogleMapsDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.GoogleMapsDialog.super.prototype.initialize.call( this );

	var panel, mapTypeSelectField, dimensionsField, alignField, /*renderMode, */
		dialog = this;

	this.mapTypeSelect = new OO.ui.ButtonSelectWidget( {
		$: this.$
	} ).addItems( [
		new OO.ui.ButtonOptionWidget( { data: 'roadmap', label: 'Road map' } ),
		new OO.ui.ButtonOptionWidget( { data: 'satellite', label: 'Satellite' } ),
		new OO.ui.ButtonOptionWidget( { data: 'terrain', label: 'Terrain' } ),
		new OO.ui.ButtonOptionWidget( { data: 'hybrid', label: 'Hybrid' } )
	] ).on( 'choose', function ( item ) {
		if ( dialog.map ) {
			dialog.map.setMapTypeId( item.getData() );
		}
	} );

	// this.renderModeSelect = new OO.ui.ButtonSelectWidget( {
	// 	$: this.$
	// } ).addItems( [
	// 	new OO.ui.ButtonOptionWidget( { data: 'static', label: 'Static image' } ),
	// 	new OO.ui.ButtonOptionWidget( { data: 'dynamic', label: 'Interactive' } )
	// ] );

	this.align = new ve.ui.AlignWidget( {
		$: this.$,
		dir: this.getDir()
	} );

	this.$map = this.$( '<div>' ).addClass( 've-ui-googleMapsDialog-mapWidget' );
	this.map = null;
	this.scalable = null;

	this.dimensionsWidget = new ve.ui.DimensionsWidget( {}, {
		$: this.$
	} ).connect( this, {
		widthChange: 'onDimensionsChange',
		heightChange: 'onDimensionsChange'
	} );

	panel = new OO.ui.PanelLayout( {
		$: this.$,
		padded: true,
		expanded: false
	} );

	mapTypeSelectField = new OO.ui.FieldLayout( this.mapTypeSelect, {
		$: this.$,
		align: 'right',
		label: 'Map type'
	} );

	// renderModeField = new OO.ui.FieldLayout( this.renderModeSelect, {
	// 	$: this.$,
	// 	align: 'right',
	// 	label: 'Embedding'
	// } );

	alignField = new OO.ui.FieldLayout( this.align, {
		$: this.$,
		align: 'right',
		label: 'Alignment'
	} );

	dimensionsField = new OO.ui.FieldLayout( this.dimensionsWidget, {
		$: this.$,
		align: 'right',
		label: 'Size'
	} );

	panel.$element.append( mapTypeSelectField.$element/*, renderModeField.$element*/, alignField.$element, dimensionsField.$element, this.$map );
	this.$body.append( panel.$element );
};

ve.ui.GoogleMapsDialog.prototype.onDimensionsChange = function () {
	var center = this.map && this.map.getCenter(),
		dialog = this;

	this.$map.css( this.dimensionsWidget.getDimensions() );
	this.setSize( this.size );

	this.loadMapsApi().done( function () {
		google.maps.event.trigger( dialog.map, 'resize' );
		if ( center ) {
			dialog.map.setCenter( center );
		}
	} );
};

/**
 * @inheritdoc
 */
ve.ui.GoogleMapsDialog.prototype.getActionProcess = function ( action ) {
	if ( action === 'insert' || action === 'apply' ) {
		return new OO.ui.Process( function () {
			var center, latitude, longitude, zoom,
				surfaceModel = this.getFragment().getSurface(),
				dimensions = this.scalable.getBoundedDimensions(
					this.dimensionsWidget.getDimensions()
				);

			if ( this.map ) {
				center = this.map.getCenter();
				latitude = center.lat();
				longitude = center.lng();
				zoom = this.map.getZoom();
			} else if ( this.selectedNode ) {
				latitude = this.selectedNode.getAttribute( 'latitude' );
				longitude = this.selectedNode.getAttribute( 'longitude' );
				zoom = this.selectedNode.getAttribute( 'zoom' );
			} else {
				// Map not loaded in insert, can't insert
				return;
			}

			if ( this.selectedNode ) {
				surfaceModel.change(
					ve.dm.Transaction.newFromAttributeChanges(
						surfaceModel.getDocument(),
						this.selectedNode.getOuterRange().start,
						{
							mapType: this.mapTypeSelect.getSelectedItem().getData(),
							latitude: latitude,
							longitude: longitude,
							align: this.align.getSelectedItem().getData(),
							width: dimensions.width,
							height: dimensions.height,
							zoom: zoom
						}
					)
				);
			} else {
				this.fragment = this.getFragment().collapseToEnd();
				this.getFragment().insertContent( [
					{
						type: ve.dm.GoogleMapsNode.static.name,
						attributes: {
							base: '//maps.googleapis.com/maps/api/staticmap',
							mapType: this.mapTypeSelect.getSelectedItem().getData(),
							latitude: latitude,
							longitude: longitude,
							align: this.align.getSelectedItem().getData(),
							width: dimensions.width,
							height: dimensions.height,
							zoom: zoom
						}
					},
					{ type: '/' + ve.dm.GoogleMapsNode.static.name }
				] );
			}
			this.close( { action: action } );
		}, this );
	}
	return ve.ui.GoogleMapsDialog.super.prototype.getActionProcess.call( this, action );
};

/**
 * @inheritdoc
 * @param {Object} [data] Setup data
 * @param {boolean} [data.useExistingReference] Open the dialog in "use existing reference" mode
 */
ve.ui.GoogleMapsDialog.prototype.getSetupProcess = function ( data ) {
	data = data || {};
	return ve.ui.GoogleMapsDialog.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			this.actions.setMode( this.selectedNode ? 'edit' : 'insert' );
			this.mapTypeSelect.selectItem(
				this.mapTypeSelect.getItemFromData(
					( this.selectedNode && this.selectedNode.getAttribute( 'mapType' ) ) || 'roadmap'
				)
			);
			// this.renderModeSelect.selectItem(
			// 	this.renderModeSelect.getItemFromData(
			// 		( this.selectedNode && this.selectedNode.getAttribute( 'renderMode' ) ) || 'static'
			// 	)
			// );

			this.scalable = this.selectedNode ?
				this.selectedNode.getScalable() :
				ve.dm.GoogleMapsNode.static.createScalable( 400, 300 );

			this.loadMapsApi().done( this.setupMap.bind( this ) );
			this.dimensionsWidget.setDimensions( this.scalable.getCurrentDimensions() );
			this.align.selectItem( this.align.getItemFromData(
				( this.selectedNode && this.selectedNode.getAttribute( 'align' ) ) || 'center'
			) );
		}, this );
};

ve.ui.GoogleMapsDialog.prototype.loadMapsApi = function () {
	var callback, $script, deferred;
	if ( !this.mapsApiPromise ) {
		deferred = $.Deferred();

		if ( !( window.google && window.google.maps ) ) {
			callback = '_mapscallback' + Math.round( Math.random() * 100000 );
			$script = this.$( '<script>' );

			window[ callback ] = function () {
				delete window[ callback ];
				deferred.resolve();
			};

			$script.attr( 'src', '//maps.googleapis.com/maps/api/js?v=3.exp&callback=' + callback );
			this.$( 'body' ).append( $script );
		} else {
			deferred.resolve();
		}
		this.mapsApiPromise = deferred.promise();
	}
	return this.mapsApiPromise;
};

ve.ui.GoogleMapsDialog.prototype.setupMap = function () {
	var center, zoom;

	if ( !this.map ) {
		this.map = new google.maps.Map( this.$map[ 0 ], {
			mapTypeControl: false,
			streetViewControl: false
		} );
	}

	if ( this.selectedNode ) {
		center = new google.maps.LatLng(
			this.selectedNode.getAttribute( 'latitude' ),
			this.selectedNode.getAttribute( 'longitude' )
		);
		zoom = this.selectedNode.getAttribute( 'zoom' );
	} else {
		center = new google.maps.LatLng( 0, 0 );
		zoom = 2;
	}
	this.map.setCenter( center );
	this.map.setZoom( zoom );
	this.map.setMapTypeId( this.mapTypeSelect.getSelectedItem().getData() );
};

/**
 * @inheritdoc
 */
ve.ui.GoogleMapsDialog.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.GoogleMapsDialog.super.prototype.getTeardownProcess.call( this, data )
		.first( function () {
			this.dimensionsWidget.clear();
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.GoogleMapsDialog );
