/*!
 * VisualEditor Scheduler class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * @class
 *
 * @constructor
 */
ve.Scheduler = function VeScheduler() {
	// TODO: If we decide to start tracking setTimeout calls within actions, we'll
	// need to keep state here.
 };

/* Inheritance */

OO.initClass( ve.Scheduler );

/* Methods */

/**
 * Perform an action and await a callback
 *
 * The signature of this function is designed to let you leave signals about your intent.
 * You pass the action with side-effects in, and explain the conditions that must be met
 * for further actions to be taken.
 *
 * @param {Function} immediateAction Action to take whose status we want to track
 * @param {Function} completionTest Tests whether action is complete; ideally very cheap
 * @param {number} [delayHint] Optional hint about how long to wait between tests
 * @return {jQuery.Promise} Promise that resolves when the completionTest returns true.
 *         Note that this _could_ already be resolved when it's returned, so there's no
 *         guarantee that your `then` call on it will be delayed.
 */
ve.Scheduler.prototype.call = function ( immediateAction, completionTest, delayHint ) {
	var deferred = $.Deferred(),
		testThenAct = function () {
			if ( completionTest() ) {
				deferred.resolve();
				return;
			}
			setTimeout( testThenAct, delayHint || 0 );
		};

	// In the future, we may want to expand this to track whether other async calls
	// were made within the action.
	immediateAction();

	// Spin up the test cycle
	testThenAct();

	return deferred.promise();
};

/* Initialization */

ve.scheduler = new ve.Scheduler();
