'use strict';

const fs = require( 'fs' );
const glob = require( 'glob' );
const minimist = require( 'minimist' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const repoRoot = process.cwd();

const args = minimist( process.argv.slice( 2 ) );
const messageFilesPattern = args.messageFilesPattern || '**/en.json';
const sourceCodePattern = args.sourceCodePattern || '{**/{src,rebaser,includes,modules}/**/*.{js,php},extension.json}';
const ignore = args.ignore || [
	'**/node_modules/**',
	'**/build/**',
	'**/dist/**',
	'**/docs/**',
	'**/demos/**',
	'**/tests/**',
	'**/vendor/**',
	'**/lib/**'
];

// Load and merge the message files from the repo root
const messages = {};
const messagesQqq = {};

const messageFiles = glob.sync( messageFilesPattern, { ignore: ignore } );

let allMessageValues = '';

messageFiles.forEach( ( messageFile ) => {
	const messageFilePath = path.join( repoRoot, messageFile );
	// eslint-disable-next-line security/detect-non-literal-require
	const messageData = require( messageFilePath );
	Object.assign( messages, messageData );
	allMessageValues += Object.values( messages ).join( '\n' );

	// eslint-disable-next-line security/detect-non-literal-require
	const messageDataQqq = require( messageFilePath.replace( 'en.json', 'qqq.json' ) );
	Object.assign( messagesQqq, messageDataQqq );
} );

// Collect all message keys from the message file
const messageKeys = Object.keys( messages )
	.filter( ( key ) =>
		// e.g. @metadata is ignored
		!key.startsWith( '@' ) &&
		// Some MW messages are consistently generated, and
		// are easy to search for usages
		!key.startsWith( 'tag-' ) &&
		!key.startsWith( 'apihelp-' )
	);

function findKeysInSourceCode( fileContent ) {
	const messageKeysPattern = new RegExp( '(?:^|[^a-z-])(' + messageKeys.join( '|' ) + ')(?:$|[^a-z-])', 'g' );
	// eslint-disable-next-line es-x/no-string-prototype-matchall
	return Array.from( fileContent.matchAll( messageKeysPattern ), ( m ) => m[ 1 ] );
}

// Search for JavaScript files using glob pattern
const files = glob.sync(
	sourceCodePattern,
	{
		root: repoRoot,
		ignore: ignore
	}
);

function checkContents( contents ) {
	const keysInSourceCode = findKeysInSourceCode( contents );

	// Mark keys as found
	keysInSourceCode.forEach( ( key ) => {
		const index = messageKeys.indexOf( key );
		if ( index !== -1 ) {
			messageKeys.splice( index, 1 );
		}
	} );
}

// Check defined source files
files.forEach( ( filePath ) => {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	const fileContent = fs.readFileSync( filePath, 'utf8' );
	checkContents( fileContent );
} );

// Also check messages values, and messages can transclude other messages
checkContents( allMessageValues );

// Report unused or undocumented keys
if ( messageKeys.length > 0 ) {
	console.log( chalk.yellow( '\nWarning: Unused or undocumented keys found:\n' ) );
	messageKeys.forEach( ( key ) => {
		console.log( chalk.yellow( `* ${key}` ) );
		console.log( `     en: ${messages[ key ].replace( /\n/g, '\n         ' )}` );
		console.log( `    qqq: ${messagesQqq[ key ].replace( /\n/g, '\n         ' )}` );
	} );
} else {
	console.log( 'All keys are used in the source code.' );
}
