'use strict';

const fs = require( 'fs' );
const glob = require( 'glob' );
const minimist = require( 'minimist' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const repoRoot = process.cwd();

const args = minimist( process.argv.slice( 2 ) );
const messageFilesPattern = args.messageFilesPattern || '**/en.json';
const sourceCodePattern = args.sourceCodePattern || '**/{src,resources,rebaser,includes,modules}/**/*.{js,php,vue,html}';
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
const noGit = args.nogit;

// Load and merge the message files from the repo root
const messages = {};
const messagesQqq = {};

console.log( 'Finding i18n files...' );
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
[ 'extension.json', 'skin.json' ].forEach( ( file ) => {
	const extensionPath = path.join( repoRoot, file );
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	if ( fs.existsSync( extensionPath ) ) {
		// eslint-disable-next-line security/detect-non-literal-require
		const extension = require( extensionPath );
		extensionDescriptions += ( extension.namemsg || '' ) + ' ' + ( extension.descriptionmsg || '' );
	}
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

const totalMessages = messageKeys.length;

function findKeysInSourceCode( fileContent ) {
	// eslint-disable-next-line security/detect-non-literal-regexp
	const messageKeysPattern = new RegExp( '(?:^|[^a-z-])(' + messageKeys.join( '|' ) + ')(?:$|[^a-z-])', 'g' );
	// eslint-disable-next-line es-x/no-string-prototype-matchall
	return Array.from( fileContent.matchAll( messageKeysPattern ), ( m ) => m[ 1 ] );
}

console.log( 'Searching code for message keys...' );
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
	if ( fs.lstatSync( filePath ).isDirectory() ) {
		// Some directories may end .js etc
		return;
	}
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
	return new Promise( ( resolve ) => {
		// TODO: This will false-positive on substring matches.
		// Should use a regex like we with file contents, but this
		// is very slow:
		// git log --pickaxe-regex -S"[^a-z-]${missingKey}[^a-z-]" ...
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
				const gitFiles = lines.slice( 2 ).filter(
					// JSON i18n
					( file ) => !file.endsWith( '.json' ) &&
					// Old .i18n.php files
					!file.endsWith( 'i18n.php' )
				);
				if ( !gitFiles.length ) {
					return false;
				}
				resolve( {
					commitHash,
					subject,
					files: gitFiles
				} );
				return true;
			} );
			resolve( null );
		} );
	} );
}

if ( messageKeys.length > 0 ) {
	console.log( 'Searching git history for missing message keys...' );
	// TODO: Instead of running a git command for each key, we should build
	// a combined regex and do one search, like we do with file contents.
	const gitPromise = noGit ? Promise.resolve( null ) : Promise.all( messageKeys.map( findKeyInGitHistory ) );
	gitPromise.then( function ( gitInfos ) {
		console.log( chalk.yellow( `\nWarning: ${messageKeys.length} unused or undocumented keys found (out of ${totalMessages}):\n` ) );
		const messagesByCommit = {};
		const gitInfoByHash = {};
		messageKeys.forEach( ( key, i ) => {
			console.log( chalk.yellow( `* ${key}` ) );
			console.log( '         en: ' + chalk.dim( `${messages[ key ].replace( /\n/g, '\n             ' )}` ) );
			console.log( '        qqq: ' + chalk.dim( `${( messagesQqq[ key ] || '' ).replace( /\n/g, '\n             ' )}` ) );
			if ( gitInfos ) {
				const gitInfo = gitInfos[ i ];
				if ( gitInfo ) {
					console.log( '  last seen: ' + chalk.dim( gitInfo.commitHash ) );
					console.log( '    subject: ' + chalk.dim( gitInfo.subject ) );
					console.log( '      files: ' + chalk.dim( gitInfo.files.join( '\n             ' ) ) );
					messagesByCommit[ gitInfo.commitHash ] = messagesByCommit[ gitInfo.commitHash ] || [];
					messagesByCommit[ gitInfo.commitHash ].push( key );
					gitInfoByHash[ gitInfo.commitHash ] = gitInfo;
				} else {
					console.log( chalk.red( '             not found in git history' ) );
				}
			}
		} );
		const messagesByCommitMultiple = Object.keys( messagesByCommit ).filter( ( hash ) => messagesByCommit[ hash ].length > 1 );
		if ( messagesByCommitMultiple.length ) {
			console.log( '\nCommits with multiple messages last seen:\n' );
			messagesByCommitMultiple.forEach( function ( hash ) {
				console.log( chalk.yellow( `* ${hash}` ) + ' ' + gitInfoByHash[ hash ].subject );
				messagesByCommit[ hash ].forEach( function ( key ) {
					console.log( `   - ${key}` );
				} );
			} );
		}
		// eslint-disable-next-line no-process-exit
		process.exit( 1 );
	} );
} else {
	console.log( `All ${totalMessages} keys are used or documented in the source code.` );
}
