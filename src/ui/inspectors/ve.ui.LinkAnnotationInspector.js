/*!
 * VisualEditor UserInterface LinkAnnotationInspector class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * Inspector for linked content.
 *
 * @class
 * @extends ve.ui.AnnotationInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.LinkAnnotationInspector = function VeUiLinkAnnotationInspector() {
	// Parent constructor
	ve.ui.LinkAnnotationInspector.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.LinkAnnotationInspector, ve.ui.AnnotationInspector );

/* Static properties */

ve.ui.LinkAnnotationInspector.static.name = 'link';

ve.ui.LinkAnnotationInspector.static.modelClasses = [ ve.dm.LinkAnnotation ];

/* Methods */

/**
 * Handle annotation input change events
 */
ve.ui.LinkAnnotationInspector.prototype.onAnnotationInputChange = function () {
	this.contents.label.placeholder = this.contents.annotation.value;
	this.updateActions();
};

/**
 * Update the actions based on the annotation state
 */
ve.ui.LinkAnnotationInspector.prototype.updateActions = function () {
	var inspector = this,
		annotation = this.contents.annotation.value,
		isValid = annotation && this.contents.validate()

	inspector.actions.forEach( { actions: [ 'done', 'insert' ] }, function ( action ) {
		action.setDisabled( !isValid );
	} );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.shouldRemoveAnnotation = function () {
	return !this.contents.annotation.value;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getInsertionText = function () {
	return this.contents.label.value.trim() || this.contents.href();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getAnnotation = function () {
	return this.contents.annotation.value;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getAnnotationFromFragment = function ( fragment ) {
	var text = fragment.getText();

	return text ? new ve.dm.LinkAnnotation( {
		type: 'link',
		attributes: { href: text }
	} ) : null;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.initialize = function () {
	var inspector = this;
	// Parent method
	ve.ui.LinkAnnotationInspector.super.prototype.initialize.call( this );

	Vue.component('ooui-field', {
		template: `<div>
			<span class="oo-ui-fieldLayout-header"><label class="oo-ui-labelElement-label">{{ label }}</label></span>
			<div class="oo-ui-fieldLayout-field">
				<div class="oo-ui-widget oo-ui-widget-enabled">
					<slot></slot>
				</div>
			</div>
		</div>`,
		props: [ 'label' ],
	});
	Vue.component('ooui-input-text', {
		template: `
			<div class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-textInputWidget oo-ui-textInputWidget-type-text">
				<input ref="input" type="text" class="oo-ui-inputWidget-input"
					:value="value"
					@input="$emit('input', $event.target.value)"
					:disabled="disabled"
					:placeholder="placeholder"
				/>
			</div>
		`,
		props: [ 'value', 'disabled', 'placeholder' ],
		methods: {
			focus: function () {
				this.$refs.input.focus();
			},
			blur: function () {
				this.$refs.input.blur();
			}
		}
	});
	Vue.component('ve-input-annotation', {
		template: `<ooui-input-text ref="input"
			v-model="annotation"
			:disabled="disabled"
			:placeholder="placeholder"
		></ooui-input-text>`,
		props: [ 'value', 'disabled', 'placeholder' ],
		data: function() {
			return {
				newValue: this.value,
			}
		},
		computed: {
			// we have "value" which is a ve.dm.LinkAnnotation
			annotation: {
				get: function() {
					return this.newValue ? this.newValue.getHref() : '';
				},
				set: function( value ) {
					if ( value == '' ) {
						this.newValue = null;
					} else {
						this.newValue = new ve.dm.LinkAnnotation( {
							type: 'link',
							attributes: {
								href: value
							}
						} );
					}
					this.$emit( 'input', this.newValue );
				}
			}
		},
		watch: {
			value: function( value ) {
				this.newValue = value;
			}
		},
		methods: {
			focus: function () {
				this.$refs.input.focus();
			},
			blur: function () {
				this.$refs.input.blur();
			}
		}
	});
	this.contents = new Vue({
		el: document.createElement( 'div' ),
		template: `<div class="oo-ui-layout oo-ui-fieldLayout oo-ui-fieldLayout-align-top">
			<div class="oo-ui-fieldLayout-body">
				<ooui-field v-if="mobile" :label="label.label">
					<ooui-input-text ref="label"
						v-model="label.value"
						v-bind="label"
					></ooui-input-text>
				</ooui-field>
				<ooui-field :label="mobile ? '' : annotation.label">
					<ve-input-annotation ref="annotation"
						v-model="annotation.value"
						v-bind="annotation"
					></ve-input-annotation>
				</ooui-field>
			</div>
		</div>`,
		data: {
			mobile: OO.ui.isMobile(),
			annotation: {
				value: '',
				label: ve.msg( 'visualeditor-linkinspector-title' ),
				placeholder: '',
				disabled: false,
			},
			label: {
				value: '',
				label: ve.msg( 'visualeditor-linkcontext-label-label' ),
				placeholder: '',
				disabled: false,
			},
		},
		watch: {
			annotation: {
				deep: true,
				handler: function() { inspector.onAnnotationInputChange(); },
			},
			label: {
				deep: true,
				handler: function() { inspector.onAnnotationInputChange(); },
			},
		},
		methods: {
			validate: function() {
				return !!this.annotation.value;
			},
			focus: function () {
				this.$refs.annotation && this.$refs.annotation.focus();
			},
			blur: function () {
				this.$refs.annotation && this.$refs.annotation.blur();
			},
			href: function() {
				return this.annotation.value ? this.annotation.value.getHref() : '';
			}
		}
	});
	this.form.$element.append( this.contents.$el );
};

/**
 * Create a link label widget
 *
 * @return {OO.ui.TextInputWidget} Link label widget
 */
ve.ui.LinkAnnotationInspector.prototype.createLabelInput = function () {
	return new OO.ui.TextInputWidget();
};

/**
 * Create a link annotation widget
 *
 * @return {ve.ui.LinkAnnotationWidget} Link annotation widget
 */
ve.ui.LinkAnnotationInspector.prototype.createAnnotationInput = function () {
	return new ve.ui.LinkAnnotationWidget();
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.shouldInsertText = function () {
	if ( ve.ui.LinkAnnotationInspector.super.prototype.shouldInsertText.call( this ) ) {
		// Adding a new link
		return true;
	}
	if ( OO.ui.isMobile() ) {
		return !this.contents.label.disabled &&
			// Don't touch it if the plaintext value hasn't changed, to preserve internal annotations if possible
			this.contents.label.value.trim() !== this.initialLabel.trim();
	}
	return false;
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getSetupProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getSetupProcess.call( this, data )
		.next( function () {
			var title = ve.msg(
					this.isReadOnly() ?
						'visualeditor-linkinspector-title' : (
							this.isNew ?
								'visualeditor-linkinspector-title-add' :
								'visualeditor-linkinspector-title-edit'
						)
				),
				fragment = this.getFragment();
			this.title.setLabel( title ).setTitle( title );
			this.initialLabel = fragment.getText();

			this.contents.label.disabled = !fragment.containsOnlyText();
			this.contents.label.value = this.initialLabel;
			this.contents.annotation.disabled = this.isReadOnly();
			this.contents.annotation.value = this.initialAnnotation;

			this.updateActions();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getReadyProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getReadyProcess.call( this, data )
		.next( function () {
			if ( !OO.ui.isMobile() ) {
				this.contents.focus();
			}

			// Clear validation state, so that we don't get "invalid" state immediately on focus
			// this.annotationInput.getTextInputWidget().setValidityFlag( true );
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getHoldProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getHoldProcess.call( this, data )
		.next( function () {
			this.contents.blur();
		}, this );
};

/**
 * @inheritdoc
 */
ve.ui.LinkAnnotationInspector.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.LinkAnnotationInspector.super.prototype.getTeardownProcess.call( this, data )
		.next( function () {
			this.contents.annotation.value = null;
			this.contents.label.placeholder = '';
			this.contents.label.value = '';
		}, this );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.LinkAnnotationInspector );
