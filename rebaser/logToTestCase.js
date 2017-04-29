/* eslint-disable no-console */

var ve = require( '../dist/ve-rebaser.js' );

/**
 * Parse log file contents.
 *
 * @param {string} log Newline-separated list of JSON objects
 * @return {Object[]} Array of parsed objects
 */
function parseLog( log ) {
	var i,
		result = [],
		lines = log.split( '\n' );
	for ( i = 0; i < lines.length; i++ ) {
		result.push( JSON.parse( lines[ i ] ) );
	}
	return result;
}

function toTestCase( parsedLog ) {
	var i, type, author, changes, newChanges,
		clients = [],
		ops = [],
		clientUnsentCounts = {};
	for ( i = 0; i < parsedLog.length; i++ ) {
		type = parsedLog[ i ].type;
		author = parsedLog[ i ].author;
		if ( type === 'newClient' ) {
			clients.push( author );
			clientUnsentCounts[ author ] = 0;
		} else if ( type === 'applyChange' ) {
			ops.push( [ author, 'deliver' ] );
		} else if ( type === 'acceptChange' ) {
			changes = ve.dm.Change.static.unserialize( parsedLog[ i ].unsent, null, true );
			newChanges = changes.mostRecent( changes.start + clientUnsentCounts[ author ] );
			if ( newChanges.getLength() > 0 ) {
				ops.push( [ author, 'apply', newChanges.serialize( true ) ] );
				clientUnsentCounts[ author ] = changes.getLength();
			}

			ops.push( [ author, 'receive' ] );
		} else if ( type === 'submitChange' ) {
			changes = ve.dm.Change.static.unserialize( parsedLog[ i ].change );
			newChanges = changes.mostRecent( changes.start + clientUnsentCounts[ author ] );
			if ( newChanges.getLength() > 0 ) {
				ops.push( [ author, 'apply', newChanges.serialize( true ) ] );
				clientUnsentCounts[ author ] = 0;
			}
			ops.push( [ author, 'submit' ] );
		}
	}
	return {
		initialData: [],
		clients: clients,
		ops: ops
	};
}

// acceptChange
// submitChange
// applyChange
// newClient
// disconnect
