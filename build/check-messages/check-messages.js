'use strict';

const fs = require( 'fs' );
const glob = require( 'glob' );
const minimist = require( 'minimist' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const repoRoot = process.cwd();

const args = minimist( process.argv.slice( 2 ) );
const messageFilesPattern = args.messageFilesPattern || '**/en.json';
const sourceCodePattern = args.sourceCodePattern || '**/{src,resources,rebaser,includes,modules}/**/*.{js,php}';
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

let extensionDescriptions = '';
const extensionPath = path.join( repoRoot, 'extension.json' );
if ( fs.existsSync( extensionPath ) ) {
	const extension = require( extensionPath );
	extensionDescriptions += ( extension.namemsg || '' ) + ' ' + ( extension.descriptionmsg || '' );
}

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

const totalMessages = messageKeys.length;

function findKeysInSourceCode( fileContent ) {
	// eslint-disable-next-line security/detect-non-literal-regexp
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

// Check extension description messages
checkContents( extensionDescriptions );

const { exec } = require( 'child_process' );

// Function to search the entire Git repository for a missing message key using the pickaxe option
function findKeyInGitHistory( missingKey ) {
	return new Promise( ( resolve, reject ) => {
		const gitCommand = `git log -S"${missingKey}" --oneline --name-only --pretty=format:"%h%n%s" --`;

		// eslint-disable-next-line security/detect-child-process
		exec( gitCommand, ( error, stdout ) => {
			if ( error ) {
				resolve( null );
				return;
			}

			const results = stdout.trim().split( '\n\n' );

			results.some( ( result ) => {
				const lines = result.trim().split( '\n' );
				const commitHash = lines[ 0 ];
				const subject = lines[ 1 ];
				// Ignore i18n files
				const files = lines.slice( 2 ).filter(
					// JSON i18n
					( file ) => !file.endsWith( '.json' ) &&
					// Old .i18n.php files
					!file.endsWith( 'i18n.php' )
				);
				if ( !files.length ) {
					return false;
				}
				resolve( {
					commitHash,
					subject,
					files
				} );
				return true;
			} );
			resolve( null );
		} );
	} );
}

function checkMissingKey( missingKey ) {
	findKeyInGitHistoryAndContentsWithPickaxe( missingKey )
		.then( ( result ) => {
			console.log( `Key '${missingKey}' was last found in the following commit and file(s):` );
			console.log( `Commit: ${result.commitHash}, File(s): ${result.files.join( ',' )}` );
		}, () => {
			console.log( `Key '${missingKey}' was not found in the Git history and file contents.` );
		} )
		.catch( ( error ) => {
			console.error( `Error searching Git history and file contents: ${error}` );
		} );
}

// Report unused or undocumented keys
if ( messageKeys.length > 0 ) {
	Promise.all( messageKeys.map( findKeyInGitHistory ) ).then( function ( gitInfos ) {
		console.log( chalk.yellow( `\nWarning: ${messageKeys.length} unused or undocumented keys found (out of ${totalMessages}):\n` ) );
		messageKeys.forEach( ( key, i ) => {
			console.log( chalk.yellow( `* ${key}` ) );
			console.log( '         en: ' + chalk.dim( `${messages[ key ].replace( /\n/g, '\n             ' )}` ) );
			console.log( '        qqq: ' + chalk.dim( `${messagesQqq[ key ].replace( /\n/g, '\n             ' )}` ) );
			const gitInfo = gitInfos[ i ];
			if ( gitInfo ) {
				console.log( '  last seen: ' + chalk.dim( gitInfo.commitHash ) );
				console.log( '    subject: ' + chalk.dim( gitInfo.subject ) );
				console.log( '      files: ' + chalk.dim( gitInfo.files.join( '\n             ' ) ) );
			} else {
				console.log( chalk.red( '             not found in git history' ) );
			}
		} );
	} );
} else {
	console.log( `All ${totalMessages} keys are used or documented in the source code.` );
}
