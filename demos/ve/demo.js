/*!
 * VisualEditor standalone demo
 *
 * @copyright 2011-2014 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

$( function () {

	function getDemoPageItems() {
		var name, items = [];
		for ( name in ve.demoPages ) {
			items.push(
				new OO.ui.MenuItemWidget( ve.demoPages[name],  { 'label': name } )
			);
		}
		return items;
	}

	var currentTarget,
		initialPage,

		$menu = $( '.ve-demo-menu' ),
		$targetContainer = $( '.ve-demo-editor' ),
		lang = $.i18n().locale,
		dir = $targetContainer.css( 'direction' ) || 'ltr',

		// Menu widgets
		pageMenu = new OO.ui.InlineMenuWidget( {
			'menu': {
				'items': getDemoPageItems()
			}
		} ),
		pageLabel = new OO.ui.LabelWidget(
			{ 'label': 'Page', 'input': pageMenu }
		),

		convertButton = new OO.ui.ButtonWidget( { '$': this.$, 'label': 'Edit HTML' } ),
		languageTextInput = new OO.ui.TextInputWidget( { '$': this.$, 'value': lang } ),
		languageDirectionButton = new OO.ui.ButtonWidget( { '$': this.$, 'label': 'Set language & direction' } ),
		directionSelect = new OO.ui.ButtonSelectWidget().addItems( [
			new OO.ui.ButtonOptionWidget( 'rtl', { '$': this.$, 'icon': 'text-dir-rtl' } ),
			new OO.ui.ButtonOptionWidget( 'ltr', { '$': this.$, 'icon': 'text-dir-ltr' } )
		] ),
		sourceMode = false,
		sourceTextInput = new OO.ui.TextInputWidget( {
			'$': this.$,
			'multiline': true,
			'autosize': true,
			'maxRows': 999,
			'classes': ['ve-demo-source']
		} );

	// Initialization
	pageMenu.getMenu().on( 'select', function ( item ) {
		var page = item.getData();
		if ( window.history.replaceState ) {
			window.history.replaceState( null, document.title, '#!/src/' + page );
		}
		loadPage( page );
	} );

	languageDirectionButton.on( 'click', function () {
		$.i18n().locale = lang = languageTextInput.getValue();
		dir = directionSelect.getSelectedItem().getData();

		// HACK: Override/restore message functions for qqx mode
		if ( lang === 'qqx' ) {
			ve.init.platform.getMessage = function ( key ) { return key; };
		} else {
			ve.init.platform.getMessage = ve.init.sa.Platform.prototype.getMessage;
		}

		// Re-bind as getMessage may have changed
		OO.ui.msg = ve.bind( ve.init.platform.getMessage, ve.init.platform );

		// HACK: Re-initialize page to load message files
		ve.init.platform.initialize().done( function () {
			loadPage( location.hash.slice( 7 ), true );
		} );
	} );

	convertButton.on( 'click', function () {
		var doc, html, $documentNode,
			surfaceView = currentTarget.getSurface().getView();

		sourceMode = !sourceMode;
		if ( sourceMode ) {
			doc = ve.dm.converter.getDomFromModel( currentTarget.getSurface().getModel().getDocument() );
			html = ve.properInnerHtml( doc.body );
			$documentNode = surfaceView.getDocument().getDocumentNode().$element;

			sourceTextInput.$element.show();
			sourceTextInput.setValue( html ).adjustSize();
			sourceTextInput.$element.hide();

			$documentNode.slideUp().promise().done( function () {
				convertButton.setLabel( 'VisualEditor' );
				sourceTextInput.$element.slideDown().promise().done( function () {
					sourceTextInput.focus();
				} );
				if ( ve.debug ) {
					currentTarget.debugBar.$element.remove();
				}
			} );
		} else {
			loadTarget( sourceTextInput.getValue() );
		}
	} );

	directionSelect.selectItem( directionSelect.getItemFromData( dir ) );

	$menu.append(
		$( '<div>' ).addClass( 've-ui-debugBar-commands' ).append(
			pageLabel.$element,
			pageMenu.$element,
			$( ve.ui.DebugBar.static.dividerTemplate ),
			convertButton.$element,
			$( ve.ui.DebugBar.static.dividerTemplate ),
			languageTextInput.$element,
			directionSelect.$element,
			languageDirectionButton.$element
		)
	);

	/**
	 * Load a page into the editor
	 *
	 * @private
	 * @param {string} src Path of html to load
	 * @param {boolean} [forceDir] Force directionality to its current value, otherwise guess from src
	 */
	function loadPage( src, forceDir ) {
		if ( !forceDir ) {
			dir = src.match( /rtl\.html$/ ) ? 'rtl' : 'ltr';
		}

		$.ajax( {
			url: src,
			dataType: 'text'
		} ).always( function ( result, status ) {
			var pageHtml;

			if ( status === 'error' ) {
				pageHtml = '<p><i>Failed loading page ' + $( '<span>' ).text( src ).html() + '</i></p>';
			} else {
				pageHtml = result;
			}

			loadTarget( pageHtml );
		} );
	}

	function loadTarget( pageHtml ) {
		var $container = $( '<div>' );
		$targetContainer.slideUp().promise().done( function () {
			if ( currentTarget ) {
				currentTarget.destroy();
			}

			convertButton.setLabel( 'Edit HTML' );

			// Container needs to be visually hidden, but not display:none
			// so that the toolbar can be measured
			$targetContainer.empty().show().css( {
				'height': 0,
				'overflow': 'hidden'
			} );

			$targetContainer.css( 'direction', dir );

			// The container must be attached to the DOM before
			// the target is initialised
			$targetContainer.append( $container );

			$targetContainer.show();
			currentTarget = new ve.init.sa.Target(
				$container,
				ve.dm.converter.getModelFromDom(
					ve.createDocumentFromHtml( pageHtml ),
					$targetContainer.ownerDocument,
					lang,
					dir
				)
			);

			currentTarget.on( 'surfaceReady', function () {
				var surfaceView = currentTarget.getSurface().getView();
				// Container must be properly hidden before slideDown animation
				$targetContainer.removeAttr( 'style' ).hide()
					// Restore directionality
					.css( 'direction', dir );

				$targetContainer.slideDown().promise().done( function () {
					surfaceView.focus();
					surfaceView.$element.append( sourceTextInput.$element.hide() );
				} );
			} );
		} );
	}

	// Open initial page
	if ( /^#!\/src\/.+$/.test( location.hash ) ) {
		initialPage = location.hash.slice( 7 );
	} else {
		initialPage = pageMenu.getMenu().getFirstSelectableItem().getData();
		// Per W3 spec, history.replaceState does not fire hashchange
	}
	pageMenu.getMenu().selectItem( pageMenu.getMenu().getItemFromData( initialPage ) );

	window.addEventListener( 'hashchange', function () {
		if ( /^#!\/src\/.+$/.test( location.hash ) ) {
			pageMenu.getMenu().selectItem( pageMenu.getMenu().getItemFromData( location.hash.slice( 7 ) ) );
		}
	} );

} );
