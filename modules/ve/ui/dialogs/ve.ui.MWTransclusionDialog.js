/*!
 * VisualEditor user interface MWTransclusionDialog class.
 *
 * @copyright 2011-2013 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/*global mw */

/**
 * Document dialog.
 *
 * See https://raw.github.com/wikimedia/mediawiki-extensions-TemplateData/master/spec.templatedata.json
 * for the latest version of the TemplateData specification.
 *
 * @class
 * @extends ve.ui.PagedDialog
 *
 * @constructor
 * @param {ve.ui.Surface} surface
 * @param {Object} [config] Config options
 */
ve.ui.MWTransclusionDialog = function VeUiMWTransclusionDialog( surface, config ) {
	// Configuration initialization
	config = ve.extendObject( {}, config, {
		'editable': true,
		'adders': [
			{
				'name': 'template',
				'icon': 'template',
				'title': ve.msg( 'visualeditor-dialog-transclusion-add-template' )
			},
			{
				'name': 'content',
				'icon': 'source',
				'title': ve.msg( 'visualeditor-dialog-transclusion-add-content' )
			}
		]
	} );

	// Parent constructor
	ve.ui.PagedDialog.call( this, surface, config );

	// Properties
	this.node = null;
	this.transclusion = null;
};

/* Inheritance */

ve.inheritClass( ve.ui.MWTransclusionDialog, ve.ui.PagedDialog );

/* Static Properties */

ve.ui.MWTransclusionDialog.static.titleMessage = 'visualeditor-dialog-transclusion-title';

ve.ui.MWTransclusionDialog.static.icon = 'template';

ve.ui.MWTransclusionDialog.static.modelClasses = [ ve.dm.MWTransclusionNode ];

/* Methods */

/**
 * Handle frame ready events.
 *
 * @method
 */
ve.ui.MWTransclusionDialog.prototype.initialize = function () {
	// Call parent method
	ve.ui.PagedDialog.prototype.initialize.call( this );

	// Events
	this.outlineControlsWidget.connect( this, {
		'move': 'onOutlineControlsMove',
		'add': 'onOutlineControlsAdd'
	} );
};

/**
 * Handle frame open events.
 *
 * @method
 */
ve.ui.MWTransclusionDialog.prototype.onOpen = function () {
	// Parent method
	ve.ui.PagedDialog.prototype.onOpen.call( this );

	// Sanity check
	this.node = this.surface.getView().getFocusedNode();

	// Properties
	this.transclusion = new ve.dm.MWTransclusionModel();

	// Initialization
	if ( this.node instanceof ve.ce.MWTransclusionNode ) {
		this.transclusion.load( ve.copyObject( this.node.getModel().getAttribute( 'mw' ) ) )
			.always( ve.bind( this.setupPages, this ) );
	} else {
		this.transclusion.addPlaceholder();
		this.setupPages();
	}
};

/**
 * Handle window close events.
 *
 * @param {string} action Action that caused the window to be closed
 */
ve.ui.MWTransclusionDialog.prototype.onClose = function ( action ) {
	var surfaceModel = this.surface.getModel(),
		obj = this.transclusion.getPlainObject();

	// Save changes
	if ( action === 'apply' ) {

		if ( this.node instanceof ve.ce.MWTransclusionNode ) {
			surfaceModel.getFragment().changeAttributes( { 'mw': obj } );
		} else {
			surfaceModel.getFragment().collapseRangeToEnd().insertContent( [
				{
					'type': 'mwTransclusionInline',
					'attributes': {
						'mw': obj
					}
				},
				{ 'type': '/mwTransclusionInline' }
			] );
		}
	}

	this.clearPages();
	this.node = null;
	this.content = null;

	// Parent method
	ve.ui.PagedDialog.prototype.onClose.call( this );
};

/**
 * Handle add part events.
 *
 * @method
 * @param {ve.dm.MWTransclusionPartModel} part Added part
 */
ve.ui.MWTransclusionDialog.prototype.onAddPart = function ( part ) {
	var i, len, page, params, param, names;

	if ( part instanceof ve.dm.MWTemplateModel ) {
		page = this.getTemplatePage( part );
	} else if ( part instanceof ve.dm.MWTransclusionContentModel ) {
		page = this.getContentPage( part );
	} else if ( part instanceof ve.dm.MWTemplatePlaceholderModel ) {
		page = this.getPlaceholderPage( part );
	}
	if ( page ) {
		page.index = this.getPageIndex( part );
		this.addPage( part.getId(), page );
		if ( part instanceof ve.dm.MWTemplateModel ) {
			names = part.getParameterNames();
			params = part.getParameters();
			for ( i = 0, len = names.length; i < len; i++ ) {
				param = params[names[i]];
				page = this.getParameterPage( param );
				page.index = this.getPageIndex( param );
				this.addPage( param.getId(), page );
			}
			part.connect( this, { 'add': 'onAddParameter', 'remove': 'onRemoveParameter' } );
		}
	}
};

/**
 * Handle remove part events.
 *
 * @method
 * @param {ve.dm.MWTransclusionPartModel} part Removed part
 */
ve.ui.MWTransclusionDialog.prototype.onRemovePart = function ( part ) {
	var name, params;

	if ( part instanceof ve.dm.MWTemplateModel ) {
		params = part.getParameters();
		for ( name in params ) {
			this.removePage( params[name].getId() );
		}
		part.disconnect( this );
	}
	this.removePage( part.getId() );
};

/**
 * Handle add param events.
 *
 * @method
 * @param {ve.dm.MWTemplateParameterModel} param Added param
 */
ve.ui.MWTransclusionDialog.prototype.onAddParameter = function ( param ) {
	var page = this.getParameterPage( param );
	page.index = this.getPageIndex( param );
	this.addPage( param.getId(), page );
};

/**
 * Handle remove param events.
 *
 * @method
 * @param {ve.dm.MWTemplateParameterModel} param Removed param
 */
ve.ui.MWTransclusionDialog.prototype.onRemoveParameter = function ( param ) {
	this.removePage( param.getId() );
	// Return to template page
	this.setPageByName( param.getTemplate().getId() );
};

/**
 * Handle outline controls move events.
 *
 * @method
 * @param {number} places Number of places to move the selected item
 */
ve.ui.MWTransclusionDialog.prototype.onOutlineControlsMove = function ( places ) {
	var part, index, name,
		parts = this.transclusion.getParts(),
		item = this.outlineWidget.getSelectedItem();

	if ( item ) {
		name = item.getData();
		part = this.transclusion.getPartFromId( name );
		index = ve.indexOf( part, parts );
		this.transclusion.removePart( part );
		this.transclusion.addPart( part, index + places );
		this.setPageByName( name );
	}
};

/**
 * Handle outline controls add events.
 *
 * @method
 * @param {string} type Type of item to add
 */
ve.ui.MWTransclusionDialog.prototype.onOutlineControlsAdd = function ( type ) {
	var part;

	switch ( type ) {
		case 'content':
			part = this.transclusion.addContent( '', this.getPartInsertionIndex() );
			this.setPageByName( part.getId() );
			break;
		case 'template':
			part = this.transclusion.addPlaceholder( this.getPartInsertionIndex() );
			this.setPageByName( part.getId() );
			break;
	}
};

/**
 * Get an index for part insertion.
 *
 * @method
 * @return {number} Index to insert new parts at
 */
ve.ui.MWTransclusionDialog.prototype.getPartInsertionIndex = function () {
	var parts = this.transclusion.getParts(),
		item = this.outlineWidget.getSelectedItem();

	if ( item ) {
		return ve.indexOf( this.transclusion.getPartFromId( item.getData() ), parts ) + 1;
	}
	return parts.length;
};

/**
 * Set the page by name.
 *
 * Page names are always the ID of the part or param they represent.
 *
 * @method
 * @param {string} name Page name
 */
ve.ui.MWTransclusionDialog.prototype.setPageByName = function ( name ) {
	this.outlineWidget.selectItem( this.outlineWidget.getItemFromData( name ) );
};

/**
 * Get the page index of an item.
 *
 * @method
 * @param {ve.dm.MWTransclusionPartModel|ve.dm.MWTemplateParameterModel} item Part or parameter
 * @returns {number} Page index of item
 */
ve.ui.MWTransclusionDialog.prototype.getPageIndex = function ( item ) {
	// Build pages from parts
	var i, iLen, j, jLen, part, names,
		parts = this.transclusion.getParts(),
		index = 0;

	// Populate pages
	for ( i = 0, iLen = parts.length; i < iLen; i++ ) {
		part = parts[i];
		if ( part === item ) {
			return index;
		}
		index++;
		if ( part instanceof ve.dm.MWTemplateModel ) {
			names = part.getParameterNames();
			for ( j = 0, jLen = names.length; j < jLen; j++ ) {
				if ( part.getParameter( names[j] ) === item ) {
					return index;
				}
				index++;
			}
		}
	}
	return -1;
};

/**
 * Synchronize pages with transclusion.
 *
 * @method
 */
ve.ui.MWTransclusionDialog.prototype.setupPages = function () {
	// Build pages from parts
	var i, iLen, j, jLen, part, param, names,
		parts = this.transclusion.getParts();

	// Populate pages
	for ( i = 0, iLen = parts.length; i < iLen; i++ ) {
		part = parts[i];
		if ( part instanceof ve.dm.MWTemplateModel ) {
			// Add template page
			this.addPage( part.getId(), this.getTemplatePage( part ) );
			// Listen for changes to parameters
			part.connect( this, { 'add': 'onAddParameter', 'remove': 'onRemoveParameter' } );
			// Add parameter pages
			names = part.getParameterNames();
			for ( j = 0, jLen = names.length; j < jLen; j++ ) {
				param = part.getParameter( names[j] );
				this.addPage( param.getId(), this.getParameterPage( param ) );
			}
		} else if ( part instanceof ve.dm.MWTransclusionContentModel ) {
			// Add wikitext page
			this.addPage( part.getId(), this.getContentPage( part ) );
		} else if ( part instanceof ve.dm.MWTemplatePlaceholderModel ) {
			// Add template placeholder page
			this.addPage( part.getId(), this.getPlaceholderPage( part ) );
		}
	}

	// Listen for changes to parts
	this.transclusion.connect( this, { 'add': 'onAddPart', 'remove': 'onRemovePart' } );
};

/**
 * Get page for transclusion content.
 *
 * @method
 * @param {ve.dm.MWTransclusionContentModel} content Content model
 */
ve.ui.MWTransclusionDialog.prototype.getContentPage = function ( content ) {
	var valueFieldset, textInput, optionsFieldset, removeButton;

	valueFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-content' ),
		'icon': 'source'
	} );

	textInput = new ve.ui.TextInputWidget( { '$$': this.frame.$$, 'multiline': true } );
	textInput.setValue( content.getValue() );
	textInput.connect( this, { 'change': function () {
		content.setValue( textInput.getValue() );
	} } );
	textInput.$.addClass( 've-ui-mwTransclusionDialog-input' );
	valueFieldset.$.append( textInput.$ );

	optionsFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-options' ),
		'icon': 'settings'
	} );

	removeButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-remove-content' ),
		'flags': ['destructive']
	} );
	removeButton.connect( this, { 'click': function () {
		content.remove();
	} } );
	optionsFieldset.$.append( removeButton.$ );

	return {
		'label': ve.msg( 'visualeditor-dialog-transclusion-content' ),
		'icon': 'source',
		'$content': valueFieldset.$.add( optionsFieldset.$ ),
		'moveable': true
	};
};

/**
 * Get page for a template.
 *
 * @method
 * @param {ve.dm.MWTemplateModel} template Template model
 */
ve.ui.MWTransclusionDialog.prototype.getTemplatePage = function ( template ) {
	var infoFieldset, addParameterFieldset, addParameterInput, addParameterButton, optionsFieldset,
		removeButton,
		spec = template.getSpec(),
		label = spec.getLabel(),
		description = spec.getDescription();

	function addParameter() {
		var param = template.addParameter( addParameterInput.getValue() );
		addParameterInput.setValue();
		this.setPageByName( param.getId() );
	}

	infoFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': label,
		'icon': 'template'
	} );

	if ( description ) {
		infoFieldset.$.append( $( '<div>' ).text( description ) );
	}

	addParameterFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-add-param' ),
		'icon': 'parameter'
	} );
	addParameterFieldset.$.addClass( 've-ui-mwTransclusionDialog-addParameterFieldset' );
	addParameterInput = new ve.ui.TextInputWidget( {
		'$$': this.frame.$$,
		'placeholder': ve.msg( 'visualeditor-dialog-transclusion-param-name' )
	} );
	addParameterButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-add-param' ),
		'disabled': true
	} );
	addParameterButton.connect( this, { 'click': addParameter } );
	addParameterInput.connect( this, {
		'enter': addParameter,
		'change': function ( value ) {
			var names = template.getParameterNames();
			addParameterButton.setDisabled( value === '' || names.indexOf( value ) !== -1 );
		}
	} );
	addParameterFieldset.$.append( addParameterInput.$, addParameterButton.$ );

	optionsFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-options' ),
		'icon': 'settings'
	} );

	removeButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-remove-template' ),
		'flags': ['destructive']
	} );
	removeButton.connect( this, { 'click': function () {
		template.remove();
	} } );
	optionsFieldset.$.append( removeButton.$ );

	return {
		'label': label,
		'icon': 'template',
		'$content': infoFieldset.$.add( addParameterFieldset.$ ).add( optionsFieldset.$ ),
		'moveable': true
	};
};

/**
 * Get page for a parameter.
 *
 * @method
 * @param {ve.dm.MWTemplateParameterModel} parameter Parameter model
 */
ve.ui.MWTransclusionDialog.prototype.getParameterPage = function ( parameter ) {
	var valueFieldset, optionsFieldset, textInput, inputLabel, removeButton,
		spec = parameter.getTemplate().getSpec(),
		name = parameter.getName(),
		label = spec.getParameterLabel( name ),
		description = spec.getParameterDescription( name );

	valueFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': label,
		'icon': 'parameter'
	} );

	if ( description ) {
		inputLabel = new ve.ui.InputLabelWidget( {
			'$$': this.frame.$$,
			'input': textInput,
			'label': description
		} );
		valueFieldset.$.append( inputLabel.$ );
	}

	textInput = new ve.ui.TextInputWidget( { '$$': this.frame.$$, 'multiline': true } );
	textInput.setValue( parameter.getValue() );
	textInput.connect( this, { 'change': function () {
		parameter.setValue( textInput.getValue() );
	} } );
	textInput.$.addClass( 've-ui-mwTransclusionDialog-input' );
	valueFieldset.$.append( textInput.$ );

	optionsFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-options' ),
		'icon': 'settings'
	} );

	removeButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-remove-param' ),
		'flags': ['destructive']
	} );
	removeButton.connect( this, { 'click': function () {
		parameter.remove();
	} } );
	optionsFieldset.$.append( removeButton.$ );

	// TODO: Use spec.required
	// TODO: Use spec.deprecation
	// TODO: Use spec.default
	// TODO: Use spec.type

	return {
		'label': label,
		'icon': 'parameter',
		'level': 1,
		'$content': valueFieldset.$.add( optionsFieldset.$ )
	};
};

/**
 * Get page for a parameter.
 *
 * @method
 * @param {ve.dm.MWTemplateParameterModel} parameter Parameter model
 */
ve.ui.MWTransclusionDialog.prototype.getPlaceholderPage = function ( placeholder ) {
	var addTemplateFieldset, addTemplateInput, addTemplateButton, optionsFieldset, removeButton,
		label = ve.msg( 'visualeditor-dialog-transclusion-placeholder' );

	function addTemplate() {
		var target, part,
			parts = placeholder.getTransclusion().getParts(),
			value = addTemplateInput.getValue(),
			href = value;

		if ( href.charAt( 0 ) !== ':' ) {
			href = mw.config.get( 'wgFormattedNamespaces' )[10] + ':' + href;
		}

		target = { 'href': new mw.Title( href ).getPrefixedText(), 'wt': value };
		part = this.transclusion.addTemplate( target, ve.indexOf( placeholder, parts ) );
		this.setPageByName( part.getId() );
		placeholder.remove();
	}

	addTemplateFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': label,
		'icon': 'parameter'
	} );
	addTemplateFieldset.$.addClass( 've-ui-mwTransclusionDialog-addTemplateFieldset' );

	addTemplateInput = new ve.ui.MWTitleInputWidget( {
		'$$': this.frame.$$, '$overlay': this.$overlay, 'namespace': 10
	} );
	addTemplateButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-add-template' ),
		'flags': ['constructive'],
		'disabled': true
	} );
	addTemplateInput.connect( this, {
		'change': function () {
			addTemplateButton.setDisabled( addTemplateInput.getValue() === '' );
		},
		'enter': addTemplate
	} );
	addTemplateButton.connect( this, { 'click': addTemplate } );
	addTemplateFieldset.$.append( addTemplateInput.$, addTemplateButton.$ );

	optionsFieldset = new ve.ui.FieldsetLayout( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-options' ),
		'icon': 'settings'
	} );

	removeButton = new ve.ui.ButtonWidget( {
		'$$': this.frame.$$,
		'label': ve.msg( 'visualeditor-dialog-transclusion-remove-template' ),
		'flags': ['destructive']
	} );
	removeButton.connect( this, { 'click': function () {
		placeholder.remove();
	} } );
	optionsFieldset.$.append( removeButton.$ );

	return {
		'label': $( '<span>' )
			.addClass( 've-ui-mwTransclusionDialog-placeholder-label' )
			.text( label ),
		'icon': 'template',
		'$content': addTemplateFieldset.$.add( optionsFieldset.$ )
	};
};

/* Registration */

ve.ui.dialogFactory.register( 'mwTransclusion', ve.ui.MWTransclusionDialog );

ve.ui.viewRegistry.register( 'mwTransclusion', ve.ui.MWTransclusionDialog );
