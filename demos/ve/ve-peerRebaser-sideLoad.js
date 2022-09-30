( function () {
parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"EgBh":[function(require,module,exports) {
var e={};e.useBlobBuilder=function(){try{return new Blob([]),!1}catch(e){return!0}}(),e.useArrayBufferView=!e.useBlobBuilder&&function(){try{return 0===new Blob([new Uint8Array([])]).size}catch(e){return!0}}(),module.exports.binaryFeatures=e;var r=module.exports.BlobBuilder;function t(){this._pieces=[],this._parts=[]}"undefined"!=typeof window&&(r=module.exports.BlobBuilder=window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder||window.BlobBuilder),t.prototype.append=function(e){"number"==typeof e?this._pieces.push(e):(this.flush(),this._parts.push(e))},t.prototype.flush=function(){if(this._pieces.length>0){var r=new Uint8Array(this._pieces);e.useArrayBufferView||(r=r.buffer),this._parts.push(r),this._pieces=[]}},t.prototype.getBuffer=function(){if(this.flush(),e.useBlobBuilder){for(var t=new r,i=0,u=this._parts.length;i<u;i++)t.append(this._parts[i]);return t.getBlob()}return new Blob(this._parts)},module.exports.BufferBuilder=t;
},{}],"kdPp":[function(require,module,exports) {
var t=require("./bufferbuilder").BufferBuilder,e=require("./bufferbuilder").binaryFeatures,i={unpack:function(t){return new r(t).unpack()},pack:function(t){var e=new n;return e.pack(t),e.getBuffer()}};function r(t){this.index=0,this.dataBuffer=t,this.dataView=new Uint8Array(this.dataBuffer),this.length=this.dataBuffer.byteLength}function n(){this.bufferBuilder=new t}function u(t){var e=t.charCodeAt(0);return e<=2047?"00":e<=65535?"000":e<=2097151?"0000":e<=67108863?"00000":"000000"}function a(t){return t.length>600?new Blob([t]).size:t.replace(/[^\u0000-\u007F]/g,u).length}module.exports=i,r.prototype.unpack=function(){var t,e=this.unpack_uint8();if(e<128)return e;if((224^e)<32)return(224^e)-32;if((t=160^e)<=15)return this.unpack_raw(t);if((t=176^e)<=15)return this.unpack_string(t);if((t=144^e)<=15)return this.unpack_array(t);if((t=128^e)<=15)return this.unpack_map(t);switch(e){case 192:return null;case 193:return;case 194:return!1;case 195:return!0;case 202:return this.unpack_float();case 203:return this.unpack_double();case 204:return this.unpack_uint8();case 205:return this.unpack_uint16();case 206:return this.unpack_uint32();case 207:return this.unpack_uint64();case 208:return this.unpack_int8();case 209:return this.unpack_int16();case 210:return this.unpack_int32();case 211:return this.unpack_int64();case 212:case 213:case 214:case 215:return;case 216:return t=this.unpack_uint16(),this.unpack_string(t);case 217:return t=this.unpack_uint32(),this.unpack_string(t);case 218:return t=this.unpack_uint16(),this.unpack_raw(t);case 219:return t=this.unpack_uint32(),this.unpack_raw(t);case 220:return t=this.unpack_uint16(),this.unpack_array(t);case 221:return t=this.unpack_uint32(),this.unpack_array(t);case 222:return t=this.unpack_uint16(),this.unpack_map(t);case 223:return t=this.unpack_uint32(),this.unpack_map(t)}},r.prototype.unpack_uint8=function(){var t=255&this.dataView[this.index];return this.index++,t},r.prototype.unpack_uint16=function(){var t=this.read(2),e=256*(255&t[0])+(255&t[1]);return this.index+=2,e},r.prototype.unpack_uint32=function(){var t=this.read(4),e=256*(256*(256*t[0]+t[1])+t[2])+t[3];return this.index+=4,e},r.prototype.unpack_uint64=function(){var t=this.read(8),e=256*(256*(256*(256*(256*(256*(256*t[0]+t[1])+t[2])+t[3])+t[4])+t[5])+t[6])+t[7];return this.index+=8,e},r.prototype.unpack_int8=function(){var t=this.unpack_uint8();return t<128?t:t-256},r.prototype.unpack_int16=function(){var t=this.unpack_uint16();return t<32768?t:t-65536},r.prototype.unpack_int32=function(){var t=this.unpack_uint32();return t<Math.pow(2,31)?t:t-Math.pow(2,32)},r.prototype.unpack_int64=function(){var t=this.unpack_uint64();return t<Math.pow(2,63)?t:t-Math.pow(2,64)},r.prototype.unpack_raw=function(t){if(this.length<this.index+t)throw new Error("BinaryPackFailure: index is out of range "+this.index+" "+t+" "+this.length);var e=this.dataBuffer.slice(this.index,this.index+t);return this.index+=t,e},r.prototype.unpack_string=function(t){for(var e,i,r=this.read(t),n=0,u="";n<t;)(e=r[n])<128?(u+=String.fromCharCode(e),n++):(192^e)<32?(i=(192^e)<<6|63&r[n+1],u+=String.fromCharCode(i),n+=2):(i=(15&e)<<12|(63&r[n+1])<<6|63&r[n+2],u+=String.fromCharCode(i),n+=3);return this.index+=t,u},r.prototype.unpack_array=function(t){for(var e=new Array(t),i=0;i<t;i++)e[i]=this.unpack();return e},r.prototype.unpack_map=function(t){for(var e={},i=0;i<t;i++){var r=this.unpack(),n=this.unpack();e[r]=n}return e},r.prototype.unpack_float=function(){var t=this.unpack_uint32(),e=(t>>23&255)-127;return(0===t>>31?1:-1)*(8388607&t|8388608)*Math.pow(2,e-23)},r.prototype.unpack_double=function(){var t=this.unpack_uint32(),e=this.unpack_uint32(),i=(t>>20&2047)-1023;return(0===t>>31?1:-1)*((1048575&t|1048576)*Math.pow(2,i-20)+e*Math.pow(2,i-52))},r.prototype.read=function(t){var e=this.index;if(e+t<=this.length)return this.dataView.subarray(e,e+t);throw new Error("BinaryPackFailure: read index out of range")},n.prototype.getBuffer=function(){return this.bufferBuilder.getBuffer()},n.prototype.pack=function(t){var i=typeof t;if("string"===i)this.pack_string(t);else if("number"===i)Math.floor(t)===t?this.pack_integer(t):this.pack_double(t);else if("boolean"===i)!0===t?this.bufferBuilder.append(195):!1===t&&this.bufferBuilder.append(194);else if("undefined"===i)this.bufferBuilder.append(192);else{if("object"!==i)throw new Error('Type "'+i+'" not yet supported');if(null===t)this.bufferBuilder.append(192);else{var r=t.constructor;if(r==Array)this.pack_array(t);else if(r==Blob||r==File||t instanceof Blob||t instanceof File)this.pack_bin(t);else if(r==ArrayBuffer)e.useArrayBufferView?this.pack_bin(new Uint8Array(t)):this.pack_bin(t);else if("BYTES_PER_ELEMENT"in t)e.useArrayBufferView?this.pack_bin(new Uint8Array(t.buffer)):this.pack_bin(t.buffer);else if(r==Object||r.toString().startsWith("class"))this.pack_object(t);else if(r==Date)this.pack_string(t.toString());else{if("function"!=typeof t.toBinaryPack)throw new Error('Type "'+r.toString()+'" not yet supported');this.bufferBuilder.append(t.toBinaryPack())}}}this.bufferBuilder.flush()},n.prototype.pack_bin=function(t){var e=t.length||t.byteLength||t.size;if(e<=15)this.pack_uint8(160+e);else if(e<=65535)this.bufferBuilder.append(218),this.pack_uint16(e);else{if(!(e<=4294967295))throw new Error("Invalid length");this.bufferBuilder.append(219),this.pack_uint32(e)}this.bufferBuilder.append(t)},n.prototype.pack_string=function(t){var e=a(t);if(e<=15)this.pack_uint8(176+e);else if(e<=65535)this.bufferBuilder.append(216),this.pack_uint16(e);else{if(!(e<=4294967295))throw new Error("Invalid length");this.bufferBuilder.append(217),this.pack_uint32(e)}this.bufferBuilder.append(t)},n.prototype.pack_array=function(t){var e=t.length;if(e<=15)this.pack_uint8(144+e);else if(e<=65535)this.bufferBuilder.append(220),this.pack_uint16(e);else{if(!(e<=4294967295))throw new Error("Invalid length");this.bufferBuilder.append(221),this.pack_uint32(e)}for(var i=0;i<e;i++)this.pack(t[i])},n.prototype.pack_integer=function(t){if(t>=-32&&t<=127)this.bufferBuilder.append(255&t);else if(t>=0&&t<=255)this.bufferBuilder.append(204),this.pack_uint8(t);else if(t>=-128&&t<=127)this.bufferBuilder.append(208),this.pack_int8(t);else if(t>=0&&t<=65535)this.bufferBuilder.append(205),this.pack_uint16(t);else if(t>=-32768&&t<=32767)this.bufferBuilder.append(209),this.pack_int16(t);else if(t>=0&&t<=4294967295)this.bufferBuilder.append(206),this.pack_uint32(t);else if(t>=-2147483648&&t<=2147483647)this.bufferBuilder.append(210),this.pack_int32(t);else if(t>=-0x8000000000000000&&t<=0x8000000000000000)this.bufferBuilder.append(211),this.pack_int64(t);else{if(!(t>=0&&t<=0x10000000000000000))throw new Error("Invalid integer");this.bufferBuilder.append(207),this.pack_uint64(t)}},n.prototype.pack_double=function(t){var e=0;t<0&&(e=1,t=-t);var i=Math.floor(Math.log(t)/Math.LN2),r=t/Math.pow(2,i)-1,n=Math.floor(r*Math.pow(2,52)),u=Math.pow(2,32),a=e<<31|i+1023<<20|n/u&1048575,p=n%u;this.bufferBuilder.append(203),this.pack_int32(a),this.pack_int32(p)},n.prototype.pack_object=function(t){var e=Object.keys(t).length;if(e<=15)this.pack_uint8(128+e);else if(e<=65535)this.bufferBuilder.append(222),this.pack_uint16(e);else{if(!(e<=4294967295))throw new Error("Invalid length");this.bufferBuilder.append(223),this.pack_uint32(e)}for(var i in t)t.hasOwnProperty(i)&&(this.pack(i),this.pack(t[i]))},n.prototype.pack_uint8=function(t){this.bufferBuilder.append(t)},n.prototype.pack_uint16=function(t){this.bufferBuilder.append(t>>8),this.bufferBuilder.append(255&t)},n.prototype.pack_uint32=function(t){var e=4294967295&t;this.bufferBuilder.append((4278190080&e)>>>24),this.bufferBuilder.append((16711680&e)>>>16),this.bufferBuilder.append((65280&e)>>>8),this.bufferBuilder.append(255&e)},n.prototype.pack_uint64=function(t){var e=t/Math.pow(2,32),i=t%Math.pow(2,32);this.bufferBuilder.append((4278190080&e)>>>24),this.bufferBuilder.append((16711680&e)>>>16),this.bufferBuilder.append((65280&e)>>>8),this.bufferBuilder.append(255&e),this.bufferBuilder.append((4278190080&i)>>>24),this.bufferBuilder.append((16711680&i)>>>16),this.bufferBuilder.append((65280&i)>>>8),this.bufferBuilder.append(255&i)},n.prototype.pack_int8=function(t){this.bufferBuilder.append(255&t)},n.prototype.pack_int16=function(t){this.bufferBuilder.append((65280&t)>>8),this.bufferBuilder.append(255&t)},n.prototype.pack_int32=function(t){this.bufferBuilder.append(t>>>24&255),this.bufferBuilder.append((16711680&t)>>>16),this.bufferBuilder.append((65280&t)>>>8),this.bufferBuilder.append(255&t)},n.prototype.pack_int64=function(t){var e=Math.floor(t/Math.pow(2,32)),i=t%Math.pow(2,32);this.bufferBuilder.append((4278190080&e)>>>24),this.bufferBuilder.append((16711680&e)>>>16),this.bufferBuilder.append((65280&e)>>>8),this.bufferBuilder.append(255&e),this.bufferBuilder.append((4278190080&i)>>>24),this.bufferBuilder.append((16711680&i)>>>16),this.bufferBuilder.append((65280&i)>>>8),this.bufferBuilder.append(255&i)};
},{"./bufferbuilder":"EgBh"}],"iSxC":[function(require,module,exports) {
"use strict";function e(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function t(e){return(t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.extractVersion=o,exports.wrapPeerConnectionEvent=i,exports.disableLog=s,exports.disableWarnings=a,exports.log=p,exports.deprecated=u,exports.detectBrowser=c,exports.compactObject=f,exports.walkStats=l,exports.filterStats=v;var n=!0,r=!0;function o(e,t,n){var r=e.match(t);return r&&r.length>=n&&parseInt(r[n],10)}function i(e,t,n){if(e.RTCPeerConnection){var r=e.RTCPeerConnection.prototype,o=r.addEventListener;r.addEventListener=function(e,r){if(e!==t)return o.apply(this,arguments);var i=function(e){var t=n(e);t&&(r.handleEvent?r.handleEvent(t):r(t))};return this._eventMap=this._eventMap||{},this._eventMap[t]||(this._eventMap[t]=new Map),this._eventMap[t].set(r,i),o.apply(this,[e,i])};var i=r.removeEventListener;r.removeEventListener=function(e,n){if(e!==t||!this._eventMap||!this._eventMap[t])return i.apply(this,arguments);if(!this._eventMap[t].has(n))return i.apply(this,arguments);var r=this._eventMap[t].get(n);return this._eventMap[t].delete(n),0===this._eventMap[t].size&&delete this._eventMap[t],0===Object.keys(this._eventMap).length&&delete this._eventMap,i.apply(this,[e,r])},Object.defineProperty(r,"on"+t,{get:function(){return this["_on"+t]},set:function(e){this["_on"+t]&&(this.removeEventListener(t,this["_on"+t]),delete this["_on"+t]),e&&this.addEventListener(t,this["_on"+t]=e)},enumerable:!0,configurable:!0})}}function s(e){return"boolean"!=typeof e?new Error("Argument type: "+t(e)+". Please use a boolean."):(n=e,e?"adapter.js logging disabled":"adapter.js logging enabled")}function a(e){return"boolean"!=typeof e?new Error("Argument type: "+t(e)+". Please use a boolean."):(r=!e,"adapter.js deprecation warnings "+(e?"disabled":"enabled"))}function p(){if("object"===("undefined"==typeof window?"undefined":t(window))){if(n)return;"undefined"!=typeof console&&"function"==typeof console.log&&console.log.apply(console,arguments)}}function u(e,t){r&&console.warn(e+" is deprecated, please use "+t+" instead.")}function c(e){var t={browser:null,version:null};if(void 0===e||!e.navigator)return t.browser="Not a browser.",t;var{navigator:n}=e;if(n.mozGetUserMedia)t.browser="firefox",t.version=o(n.userAgent,/Firefox\/(\d+)\./,1);else if(n.webkitGetUserMedia||!1===e.isSecureContext&&e.webkitRTCPeerConnection&&!e.RTCIceGatherer)t.browser="chrome",t.version=o(n.userAgent,/Chrom(e|ium)\/(\d+)\./,2);else if(n.mediaDevices&&n.userAgent.match(/Edge\/(\d+).(\d+)$/))t.browser="edge",t.version=o(n.userAgent,/Edge\/(\d+).(\d+)$/,2);else{if(!e.RTCPeerConnection||!n.userAgent.match(/AppleWebKit\/(\d+)\./))return t.browser="Not a supported browser.",t;t.browser="safari",t.version=o(n.userAgent,/AppleWebKit\/(\d+)\./,1),t.supportsUnifiedPlan=e.RTCRtpTransceiver&&"currentDirection"in e.RTCRtpTransceiver.prototype}return t}function d(e){return"[object Object]"===Object.prototype.toString.call(e)}function f(t){return d(t)?Object.keys(t).reduce(function(n,r){var o=d(t[r]),i=o?f(t[r]):t[r],s=o&&!Object.keys(i).length;return void 0===i||s?n:Object.assign(n,e({},r,i))},{}):t}function l(e,t,n){t&&!n.has(t.id)&&(n.set(t.id,t),Object.keys(t).forEach(function(r){r.endsWith("Id")?l(e,e.get(t[r]),n):r.endsWith("Ids")&&t[r].forEach(function(t){l(e,e.get(t),n)})}))}function v(e,t,n){var r=n?"outbound-rtp":"inbound-rtp",o=new Map;if(null===t)return o;var i=[];return e.forEach(function(e){"track"===e.type&&e.trackIdentifier===t.id&&i.push(e)}),i.forEach(function(t){e.forEach(function(n){n.type===r&&n.trackId===t.id&&l(e,n,o)})}),o}
},{}],"s6SN":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetUserMedia=i;var e=t(require("../utils.js"));function r(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return r=function(){return e},e}function t(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=r();if(t&&t.has(e))return t.get(e);var o={},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var a=n?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(o,i,a):o[i]=e[i]}return o.default=e,t&&t.set(e,o),o}function o(e){return(o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}var n=e.log;function i(e,r){var t=e&&e.navigator;if(t.mediaDevices){var i=function(e){if("object"!==o(e)||e.mandatory||e.optional)return e;var r={};return Object.keys(e).forEach(function(t){if("require"!==t&&"advanced"!==t&&"mediaSource"!==t){var n="object"===o(e[t])?e[t]:{ideal:e[t]};void 0!==n.exact&&"number"==typeof n.exact&&(n.min=n.max=n.exact);var i=function(e,r){return e?e+r.charAt(0).toUpperCase()+r.slice(1):"deviceId"===r?"sourceId":r};if(void 0!==n.ideal){r.optional=r.optional||[];var a={};"number"==typeof n.ideal?(a[i("min",t)]=n.ideal,r.optional.push(a),(a={})[i("max",t)]=n.ideal,r.optional.push(a)):(a[i("",t)]=n.ideal,r.optional.push(a))}void 0!==n.exact&&"number"!=typeof n.exact?(r.mandatory=r.mandatory||{},r.mandatory[i("",t)]=n.exact):["min","max"].forEach(function(e){void 0!==n[e]&&(r.mandatory=r.mandatory||{},r.mandatory[i(e,t)]=n[e])})}}),e.advanced&&(r.optional=(r.optional||[]).concat(e.advanced)),r},a=function(e,a){if(r.version>=61)return a(e);if((e=JSON.parse(JSON.stringify(e)))&&"object"===o(e.audio)){var c=function(e,r,t){r in e&&!(t in e)&&(e[t]=e[r],delete e[r])};c((e=JSON.parse(JSON.stringify(e))).audio,"autoGainControl","googAutoGainControl"),c(e.audio,"noiseSuppression","googNoiseSuppression"),e.audio=i(e.audio)}if(e&&"object"===o(e.video)){var d=e.video.facingMode;d=d&&("object"===o(d)?d:{ideal:d});var u,s=r.version<66;if(d&&("user"===d.exact||"environment"===d.exact||"user"===d.ideal||"environment"===d.ideal)&&(!t.mediaDevices.getSupportedConstraints||!t.mediaDevices.getSupportedConstraints().facingMode||s))if(delete e.video.facingMode,"environment"===d.exact||"environment"===d.ideal?u=["back","rear"]:"user"!==d.exact&&"user"!==d.ideal||(u=["front"]),u)return t.mediaDevices.enumerateDevices().then(function(r){var t=(r=r.filter(function(e){return"videoinput"===e.kind})).find(function(e){return u.some(function(r){return e.label.toLowerCase().includes(r)})});return!t&&r.length&&u.includes("back")&&(t=r[r.length-1]),t&&(e.video.deviceId=d.exact?{exact:t.deviceId}:{ideal:t.deviceId}),e.video=i(e.video),n("chrome: "+JSON.stringify(e)),a(e)});e.video=i(e.video)}return n("chrome: "+JSON.stringify(e)),a(e)},c=function(e){return r.version>=64?e:{name:{PermissionDeniedError:"NotAllowedError",PermissionDismissedError:"NotAllowedError",InvalidStateError:"NotAllowedError",DevicesNotFoundError:"NotFoundError",ConstraintNotSatisfiedError:"OverconstrainedError",TrackStartError:"NotReadableError",MediaDeviceFailedDueToShutdown:"NotAllowedError",MediaDeviceKillSwitchOn:"NotAllowedError",TabCaptureError:"AbortError",ScreenCaptureError:"AbortError",DeviceCaptureError:"AbortError"}[e.name]||e.name,message:e.message,constraint:e.constraint||e.constraintName,toString:function(){return this.name+(this.message&&": ")+this.message}}};if(t.getUserMedia=function(e,r,o){a(e,function(e){t.webkitGetUserMedia(e,r,function(e){o&&o(c(e))})})}.bind(t),t.mediaDevices.getUserMedia){var d=t.mediaDevices.getUserMedia.bind(t.mediaDevices);t.mediaDevices.getUserMedia=function(e){return a(e,function(e){return d(e).then(function(r){if(e.audio&&!r.getAudioTracks().length||e.video&&!r.getVideoTracks().length)throw r.getTracks().forEach(function(e){e.stop()}),new DOMException("","NotFoundError");return r},function(e){return Promise.reject(c(e))})})}}}}
},{"../utils.js":"iSxC"}],"VHa8":[function(require,module,exports) {
"use strict";function e(e,i){e.navigator.mediaDevices&&"getDisplayMedia"in e.navigator.mediaDevices||e.navigator.mediaDevices&&("function"==typeof i?e.navigator.mediaDevices.getDisplayMedia=function(a){return i(a).then(function(i){var t=a.video&&a.video.width,o=a.video&&a.video.height,d=a.video&&a.video.frameRate;return a.video={mandatory:{chromeMediaSource:"desktop",chromeMediaSourceId:i,maxFrameRate:d||3}},t&&(a.video.mandatory.maxWidth=t),o&&(a.video.mandatory.maxHeight=o),e.navigator.mediaDevices.getUserMedia(a)})}:console.error("shimGetDisplayMedia: getSourceId argument is not a function"))}Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetDisplayMedia=e;
},{}],"uI5X":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimMediaStream=a,exports.shimOnTrack=c,exports.shimGetSendersWithDtmf=p,exports.shimGetStats=d,exports.shimSenderReceiverGetStats=h,exports.shimAddTrackRemoveTrackWithNative=f,exports.shimAddTrackRemoveTrack=m,exports.shimPeerConnection=u,exports.fixNegotiationNeeded=l,Object.defineProperty(exports,"shimGetUserMedia",{enumerable:!0,get:function(){return t.shimGetUserMedia}}),Object.defineProperty(exports,"shimGetDisplayMedia",{enumerable:!0,get:function(){return r.shimGetDisplayMedia}});var e=i(require("../utils.js")),t=require("./getusermedia"),r=require("./getdisplaymedia");function n(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return n=function(){return e},e}function i(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=n();if(t&&t.has(e))return t.get(e);var r={},i=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var s=i?Object.getOwnPropertyDescriptor(e,o):null;s&&(s.get||s.set)?Object.defineProperty(r,o,s):r[o]=e[o]}return r.default=e,t&&t.set(e,r),r}function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e){return(s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function a(e){e.MediaStream=e.MediaStream||e.webkitMediaStream}function c(t){if("object"!==s(t)||!t.RTCPeerConnection||"ontrack"in t.RTCPeerConnection.prototype)e.wrapPeerConnectionEvent(t,"track",function(e){return e.transceiver||Object.defineProperty(e,"transceiver",{value:{receiver:e.receiver}}),e});else{Object.defineProperty(t.RTCPeerConnection.prototype,"ontrack",{get:function(){return this._ontrack},set:function(e){this._ontrack&&this.removeEventListener("track",this._ontrack),this.addEventListener("track",this._ontrack=e)},enumerable:!0,configurable:!0});var r=t.RTCPeerConnection.prototype.setRemoteDescription;t.RTCPeerConnection.prototype.setRemoteDescription=function(){var e=this;return this._ontrackpoly||(this._ontrackpoly=function(r){r.stream.addEventListener("addtrack",function(n){var i;i=t.RTCPeerConnection.prototype.getReceivers?e.getReceivers().find(function(e){return e.track&&e.track.id===n.track.id}):{track:n.track};var o=new Event("track");o.track=n.track,o.receiver=i,o.transceiver={receiver:i},o.streams=[r.stream],e.dispatchEvent(o)}),r.stream.getTracks().forEach(function(n){var i;i=t.RTCPeerConnection.prototype.getReceivers?e.getReceivers().find(function(e){return e.track&&e.track.id===n.id}):{track:n};var o=new Event("track");o.track=n,o.receiver=i,o.transceiver={receiver:i},o.streams=[r.stream],e.dispatchEvent(o)})},this.addEventListener("addstream",this._ontrackpoly)),r.apply(this,arguments)}}}function p(e){if("object"===s(e)&&e.RTCPeerConnection&&!("getSenders"in e.RTCPeerConnection.prototype)&&"createDTMFSender"in e.RTCPeerConnection.prototype){var t=function(e,t){return{track:t,get dtmf(){return void 0===this._dtmf&&("audio"===t.kind?this._dtmf=e.createDTMFSender(t):this._dtmf=null),this._dtmf},_pc:e}};if(!e.RTCPeerConnection.prototype.getSenders){e.RTCPeerConnection.prototype.getSenders=function(){return this._senders=this._senders||[],this._senders.slice()};var r=e.RTCPeerConnection.prototype.addTrack;e.RTCPeerConnection.prototype.addTrack=function(e,n){var i=r.apply(this,arguments);return i||(i=t(this,e),this._senders.push(i)),i};var n=e.RTCPeerConnection.prototype.removeTrack;e.RTCPeerConnection.prototype.removeTrack=function(e){n.apply(this,arguments);var t=this._senders.indexOf(e);-1!==t&&this._senders.splice(t,1)}}var i=e.RTCPeerConnection.prototype.addStream;e.RTCPeerConnection.prototype.addStream=function(e){var r=this;this._senders=this._senders||[],i.apply(this,[e]),e.getTracks().forEach(function(e){r._senders.push(t(r,e))})};var o=e.RTCPeerConnection.prototype.removeStream;e.RTCPeerConnection.prototype.removeStream=function(e){var t=this;this._senders=this._senders||[],o.apply(this,[e]),e.getTracks().forEach(function(e){var r=t._senders.find(function(t){return t.track===e});r&&t._senders.splice(t._senders.indexOf(r),1)})}}else if("object"===s(e)&&e.RTCPeerConnection&&"getSenders"in e.RTCPeerConnection.prototype&&"createDTMFSender"in e.RTCPeerConnection.prototype&&e.RTCRtpSender&&!("dtmf"in e.RTCRtpSender.prototype)){var a=e.RTCPeerConnection.prototype.getSenders;e.RTCPeerConnection.prototype.getSenders=function(){var e=this,t=a.apply(this,[]);return t.forEach(function(t){return t._pc=e}),t},Object.defineProperty(e.RTCRtpSender.prototype,"dtmf",{get:function(){return void 0===this._dtmf&&("audio"===this.track.kind?this._dtmf=this._pc.createDTMFSender(this.track):this._dtmf=null),this._dtmf}})}}function d(e){if(e.RTCPeerConnection){var t=e.RTCPeerConnection.prototype.getStats;e.RTCPeerConnection.prototype.getStats=function(){var e=this,[r,n,i]=arguments;if(arguments.length>0&&"function"==typeof r)return t.apply(this,arguments);if(0===t.length&&(0===arguments.length||"function"!=typeof r))return t.apply(this,[]);var o=function(e){var t={};return e.result().forEach(function(e){var r={id:e.id,timestamp:e.timestamp,type:{localcandidate:"local-candidate",remotecandidate:"remote-candidate"}[e.type]||e.type};e.names().forEach(function(t){r[t]=e.stat(t)}),t[r.id]=r}),t},s=function(e){return new Map(Object.keys(e).map(function(t){return[t,e[t]]}))};if(arguments.length>=2){return t.apply(this,[function(e){n(s(o(e)))},r])}return new Promise(function(r,n){t.apply(e,[function(e){r(s(o(e)))},n])}).then(n,i)}}}function h(t){if("object"===s(t)&&t.RTCPeerConnection&&t.RTCRtpSender&&t.RTCRtpReceiver){if(!("getStats"in t.RTCRtpSender.prototype)){var r=t.RTCPeerConnection.prototype.getSenders;r&&(t.RTCPeerConnection.prototype.getSenders=function(){var e=this,t=r.apply(this,[]);return t.forEach(function(t){return t._pc=e}),t});var n=t.RTCPeerConnection.prototype.addTrack;n&&(t.RTCPeerConnection.prototype.addTrack=function(){var e=n.apply(this,arguments);return e._pc=this,e}),t.RTCRtpSender.prototype.getStats=function(){var t=this;return this._pc.getStats().then(function(r){return e.filterStats(r,t.track,!0)})}}if(!("getStats"in t.RTCRtpReceiver.prototype)){var i=t.RTCPeerConnection.prototype.getReceivers;i&&(t.RTCPeerConnection.prototype.getReceivers=function(){var e=this,t=i.apply(this,[]);return t.forEach(function(t){return t._pc=e}),t}),e.wrapPeerConnectionEvent(t,"track",function(e){return e.receiver._pc=e.srcElement,e}),t.RTCRtpReceiver.prototype.getStats=function(){var t=this;return this._pc.getStats().then(function(r){return e.filterStats(r,t.track,!1)})}}if("getStats"in t.RTCRtpSender.prototype&&"getStats"in t.RTCRtpReceiver.prototype){var o=t.RTCPeerConnection.prototype.getStats;t.RTCPeerConnection.prototype.getStats=function(){if(arguments.length>0&&arguments[0]instanceof t.MediaStreamTrack){var e,r,n,i=arguments[0];return this.getSenders().forEach(function(t){t.track===i&&(e?n=!0:e=t)}),this.getReceivers().forEach(function(e){return e.track===i&&(r?n=!0:r=e),e.track===i}),n||e&&r?Promise.reject(new DOMException("There are more than one sender or receiver for the track.","InvalidAccessError")):e?e.getStats():r?r.getStats():Promise.reject(new DOMException("There is no sender or receiver for the track.","InvalidAccessError"))}return o.apply(this,arguments)}}}}function f(e){e.RTCPeerConnection.prototype.getLocalStreams=function(){var e=this;return this._shimmedLocalStreams=this._shimmedLocalStreams||{},Object.keys(this._shimmedLocalStreams).map(function(t){return e._shimmedLocalStreams[t][0]})};var t=e.RTCPeerConnection.prototype.addTrack;e.RTCPeerConnection.prototype.addTrack=function(e,r){if(!r)return t.apply(this,arguments);this._shimmedLocalStreams=this._shimmedLocalStreams||{};var n=t.apply(this,arguments);return this._shimmedLocalStreams[r.id]?-1===this._shimmedLocalStreams[r.id].indexOf(n)&&this._shimmedLocalStreams[r.id].push(n):this._shimmedLocalStreams[r.id]=[r,n],n};var r=e.RTCPeerConnection.prototype.addStream;e.RTCPeerConnection.prototype.addStream=function(e){var t=this;this._shimmedLocalStreams=this._shimmedLocalStreams||{},e.getTracks().forEach(function(e){if(t.getSenders().find(function(t){return t.track===e}))throw new DOMException("Track already exists.","InvalidAccessError")});var n=this.getSenders();r.apply(this,arguments);var i=this.getSenders().filter(function(e){return-1===n.indexOf(e)});this._shimmedLocalStreams[e.id]=[e].concat(i)};var n=e.RTCPeerConnection.prototype.removeStream;e.RTCPeerConnection.prototype.removeStream=function(e){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},delete this._shimmedLocalStreams[e.id],n.apply(this,arguments)};var i=e.RTCPeerConnection.prototype.removeTrack;e.RTCPeerConnection.prototype.removeTrack=function(e){var t=this;return this._shimmedLocalStreams=this._shimmedLocalStreams||{},e&&Object.keys(this._shimmedLocalStreams).forEach(function(r){var n=t._shimmedLocalStreams[r].indexOf(e);-1!==n&&t._shimmedLocalStreams[r].splice(n,1),1===t._shimmedLocalStreams[r].length&&delete t._shimmedLocalStreams[r]}),i.apply(this,arguments)}}function m(e,t){if(e.RTCPeerConnection){if(e.RTCPeerConnection.prototype.addTrack&&t.version>=65)return f(e);var r=e.RTCPeerConnection.prototype.getLocalStreams;e.RTCPeerConnection.prototype.getLocalStreams=function(){var e=this,t=r.apply(this);return this._reverseStreams=this._reverseStreams||{},t.map(function(t){return e._reverseStreams[t.id]})};var n=e.RTCPeerConnection.prototype.addStream;e.RTCPeerConnection.prototype.addStream=function(t){var r=this;if(this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},t.getTracks().forEach(function(e){if(r.getSenders().find(function(t){return t.track===e}))throw new DOMException("Track already exists.","InvalidAccessError")}),!this._reverseStreams[t.id]){var i=new e.MediaStream(t.getTracks());this._streams[t.id]=i,this._reverseStreams[i.id]=t,t=i}n.apply(this,[t])};var i=e.RTCPeerConnection.prototype.removeStream;e.RTCPeerConnection.prototype.removeStream=function(e){this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},i.apply(this,[this._streams[e.id]||e]),delete this._reverseStreams[this._streams[e.id]?this._streams[e.id].id:e.id],delete this._streams[e.id]},e.RTCPeerConnection.prototype.addTrack=function(t,r){var n=this;if("closed"===this.signalingState)throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");var i=[].slice.call(arguments,1);if(1!==i.length||!i[0].getTracks().find(function(e){return e===t}))throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.","NotSupportedError");if(this.getSenders().find(function(e){return e.track===t}))throw new DOMException("Track already exists.","InvalidAccessError");this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{};var o=this._streams[r.id];if(o)o.addTrack(t),Promise.resolve().then(function(){n.dispatchEvent(new Event("negotiationneeded"))});else{var s=new e.MediaStream([t]);this._streams[r.id]=s,this._reverseStreams[s.id]=r,this.addStream(s)}return this.getSenders().find(function(e){return e.track===t})},["createOffer","createAnswer"].forEach(function(t){var r=e.RTCPeerConnection.prototype[t],n=o({},t,function(){var e=this,t=arguments;return arguments.length&&"function"==typeof arguments[0]?r.apply(this,[function(r){var n=c(e,r);t[0].apply(null,[n])},function(e){t[1]&&t[1].apply(null,e)},arguments[2]]):r.apply(this,arguments).then(function(t){return c(e,t)})});e.RTCPeerConnection.prototype[t]=n[t]});var s=e.RTCPeerConnection.prototype.setLocalDescription;e.RTCPeerConnection.prototype.setLocalDescription=function(){return arguments.length&&arguments[0].type?(arguments[0]=(e=this,t=arguments[0],r=t.sdp,Object.keys(e._reverseStreams||[]).forEach(function(t){var n=e._reverseStreams[t],i=e._streams[n.id];r=r.replace(new RegExp(n.id,"g"),i.id)}),new RTCSessionDescription({type:t.type,sdp:r})),s.apply(this,arguments)):s.apply(this,arguments);var e,t,r};var a=Object.getOwnPropertyDescriptor(e.RTCPeerConnection.prototype,"localDescription");Object.defineProperty(e.RTCPeerConnection.prototype,"localDescription",{get:function(){var e=a.get.apply(this);return""===e.type?e:c(this,e)}}),e.RTCPeerConnection.prototype.removeTrack=function(e){var t,r=this;if("closed"===this.signalingState)throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");if(!e._pc)throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.","TypeError");if(!(e._pc===this))throw new DOMException("Sender was not created by this connection.","InvalidAccessError");this._streams=this._streams||{},Object.keys(this._streams).forEach(function(n){r._streams[n].getTracks().find(function(t){return e.track===t})&&(t=r._streams[n])}),t&&(1===t.getTracks().length?this.removeStream(this._reverseStreams[t.id]):t.removeTrack(e.track),this.dispatchEvent(new Event("negotiationneeded")))}}function c(e,t){var r=t.sdp;return Object.keys(e._reverseStreams||[]).forEach(function(t){var n=e._reverseStreams[t],i=e._streams[n.id];r=r.replace(new RegExp(i.id,"g"),n.id)}),new RTCSessionDescription({type:t.type,sdp:r})}}function u(e,t){!e.RTCPeerConnection&&e.webkitRTCPeerConnection&&(e.RTCPeerConnection=e.webkitRTCPeerConnection),e.RTCPeerConnection&&t.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){var r=e.RTCPeerConnection.prototype[t],n=o({},t,function(){return arguments[0]=new("addIceCandidate"===t?e.RTCIceCandidate:e.RTCSessionDescription)(arguments[0]),r.apply(this,arguments)});e.RTCPeerConnection.prototype[t]=n[t]})}function l(t,r){e.wrapPeerConnectionEvent(t,"negotiationneeded",function(e){var t=e.target;if(!(r.version<72||t.getConfiguration&&"plan-b"===t.getConfiguration().sdpSemantics)||"stable"===t.signalingState)return e})}
},{"../utils.js":"iSxC","./getusermedia":"s6SN","./getdisplaymedia":"VHa8"}],"NZ1C":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.filterIceServers=n;var r=t(require("../utils"));function e(){if("function"!=typeof WeakMap)return null;var r=new WeakMap;return e=function(){return r},r}function t(r){if(r&&r.__esModule)return r;if(null===r||"object"!=typeof r&&"function"!=typeof r)return{default:r};var t=e();if(t&&t.has(r))return t.get(r);var n={},u=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i)){var f=u?Object.getOwnPropertyDescriptor(r,i):null;f&&(f.get||f.set)?Object.defineProperty(n,i,f):n[i]=r[i]}return n.default=r,t&&t.set(r,n),n}function n(e,t){var n=!1;return(e=JSON.parse(JSON.stringify(e))).filter(function(e){if(e&&(e.urls||e.url)){var t=e.urls||e.url;e.url&&!e.urls&&r.deprecated("RTCIceServer.url","RTCIceServer.urls");var u="string"==typeof t;return u&&(t=[t]),t=t.filter(function(r){if(0===r.indexOf("stun:"))return!1;var e=r.startsWith("turn")&&!r.startsWith("turn:[")&&r.includes("transport=udp");return e&&!n?(n=!0,!0):e&&!n}),delete e.url,e.urls=u?t[0]:t,!!t.length}})}
},{"../utils":"iSxC"}],"YHvh":[function(require,module,exports) {
"use strict";var r={generateIdentifier:function(){return Math.random().toString(36).substr(2,10)}};r.localCName=r.generateIdentifier(),r.splitLines=function(r){return r.trim().split("\n").map(function(r){return r.trim()})},r.splitSections=function(r){return r.split("\nm=").map(function(r,e){return(e>0?"m="+r:r).trim()+"\r\n"})},r.getDescription=function(e){var t=r.splitSections(e);return t&&t[0]},r.getMediaSections=function(e){var t=r.splitSections(e);return t.shift(),t},r.matchPrefix=function(e,t){return r.splitLines(e).filter(function(r){return 0===r.indexOf(t)})},r.parseCandidate=function(r){for(var e,t={foundation:(e=0===r.indexOf("a=candidate:")?r.substring(12).split(" "):r.substring(10).split(" "))[0],component:parseInt(e[1],10),protocol:e[2].toLowerCase(),priority:parseInt(e[3],10),ip:e[4],address:e[4],port:parseInt(e[5],10),type:e[7]},a=8;a<e.length;a+=2)switch(e[a]){case"raddr":t.relatedAddress=e[a+1];break;case"rport":t.relatedPort=parseInt(e[a+1],10);break;case"tcptype":t.tcpType=e[a+1];break;case"ufrag":t.ufrag=e[a+1],t.usernameFragment=e[a+1];break;default:t[e[a]]=e[a+1]}return t},r.writeCandidate=function(r){var e=[];e.push(r.foundation),e.push(r.component),e.push(r.protocol.toUpperCase()),e.push(r.priority),e.push(r.address||r.ip),e.push(r.port);var t=r.type;return e.push("typ"),e.push(t),"host"!==t&&r.relatedAddress&&r.relatedPort&&(e.push("raddr"),e.push(r.relatedAddress),e.push("rport"),e.push(r.relatedPort)),r.tcpType&&"tcp"===r.protocol.toLowerCase()&&(e.push("tcptype"),e.push(r.tcpType)),(r.usernameFragment||r.ufrag)&&(e.push("ufrag"),e.push(r.usernameFragment||r.ufrag)),"candidate:"+e.join(" ")},r.parseIceOptions=function(r){return r.substr(14).split(" ")},r.parseRtpMap=function(r){var e=r.substr(9).split(" "),t={payloadType:parseInt(e.shift(),10)};return e=e[0].split("/"),t.name=e[0],t.clockRate=parseInt(e[1],10),t.channels=3===e.length?parseInt(e[2],10):1,t.numChannels=t.channels,t},r.writeRtpMap=function(r){var e=r.payloadType;void 0!==r.preferredPayloadType&&(e=r.preferredPayloadType);var t=r.channels||r.numChannels||1;return"a=rtpmap:"+e+" "+r.name+"/"+r.clockRate+(1!==t?"/"+t:"")+"\r\n"},r.parseExtmap=function(r){var e=r.substr(9).split(" ");return{id:parseInt(e[0],10),direction:e[0].indexOf("/")>0?e[0].split("/")[1]:"sendrecv",uri:e[1]}},r.writeExtmap=function(r){return"a=extmap:"+(r.id||r.preferredId)+(r.direction&&"sendrecv"!==r.direction?"/"+r.direction:"")+" "+r.uri+"\r\n"},r.parseFmtp=function(r){for(var e,t={},a=r.substr(r.indexOf(" ")+1).split(";"),n=0;n<a.length;n++)t[(e=a[n].trim().split("="))[0].trim()]=e[1];return t},r.writeFmtp=function(r){var e="",t=r.payloadType;if(void 0!==r.preferredPayloadType&&(t=r.preferredPayloadType),r.parameters&&Object.keys(r.parameters).length){var a=[];Object.keys(r.parameters).forEach(function(e){r.parameters[e]?a.push(e+"="+r.parameters[e]):a.push(e)}),e+="a=fmtp:"+t+" "+a.join(";")+"\r\n"}return e},r.parseRtcpFb=function(r){var e=r.substr(r.indexOf(" ")+1).split(" ");return{type:e.shift(),parameter:e.join(" ")}},r.writeRtcpFb=function(r){var e="",t=r.payloadType;return void 0!==r.preferredPayloadType&&(t=r.preferredPayloadType),r.rtcpFeedback&&r.rtcpFeedback.length&&r.rtcpFeedback.forEach(function(r){e+="a=rtcp-fb:"+t+" "+r.type+(r.parameter&&r.parameter.length?" "+r.parameter:"")+"\r\n"}),e},r.parseSsrcMedia=function(r){var e=r.indexOf(" "),t={ssrc:parseInt(r.substr(7,e-7),10)},a=r.indexOf(":",e);return a>-1?(t.attribute=r.substr(e+1,a-e-1),t.value=r.substr(a+1)):t.attribute=r.substr(e+1),t},r.parseSsrcGroup=function(r){var e=r.substr(13).split(" ");return{semantics:e.shift(),ssrcs:e.map(function(r){return parseInt(r,10)})}},r.getMid=function(e){var t=r.matchPrefix(e,"a=mid:")[0];if(t)return t.substr(6)},r.parseFingerprint=function(r){var e=r.substr(14).split(" ");return{algorithm:e[0].toLowerCase(),value:e[1]}},r.getDtlsParameters=function(e,t){return{role:"auto",fingerprints:r.matchPrefix(e+t,"a=fingerprint:").map(r.parseFingerprint)}},r.writeDtlsParameters=function(r,e){var t="a=setup:"+e+"\r\n";return r.fingerprints.forEach(function(r){t+="a=fingerprint:"+r.algorithm+" "+r.value+"\r\n"}),t},r.parseCryptoLine=function(r){var e=r.substr(9).split(" ");return{tag:parseInt(e[0],10),cryptoSuite:e[1],keyParams:e[2],sessionParams:e.slice(3)}},r.writeCryptoLine=function(e){return"a=crypto:"+e.tag+" "+e.cryptoSuite+" "+("object"==typeof e.keyParams?r.writeCryptoKeyParams(e.keyParams):e.keyParams)+(e.sessionParams?" "+e.sessionParams.join(" "):"")+"\r\n"},r.parseCryptoKeyParams=function(r){if(0!==r.indexOf("inline:"))return null;var e=r.substr(7).split("|");return{keyMethod:"inline",keySalt:e[0],lifeTime:e[1],mkiValue:e[2]?e[2].split(":")[0]:void 0,mkiLength:e[2]?e[2].split(":")[1]:void 0}},r.writeCryptoKeyParams=function(r){return r.keyMethod+":"+r.keySalt+(r.lifeTime?"|"+r.lifeTime:"")+(r.mkiValue&&r.mkiLength?"|"+r.mkiValue+":"+r.mkiLength:"")},r.getCryptoParameters=function(e,t){return r.matchPrefix(e+t,"a=crypto:").map(r.parseCryptoLine)},r.getIceParameters=function(e,t){var a=r.matchPrefix(e+t,"a=ice-ufrag:")[0],n=r.matchPrefix(e+t,"a=ice-pwd:")[0];return a&&n?{usernameFragment:a.substr(12),password:n.substr(10)}:null},r.writeIceParameters=function(r){return"a=ice-ufrag:"+r.usernameFragment+"\r\na=ice-pwd:"+r.password+"\r\n"},r.parseRtpParameters=function(e){for(var t={codecs:[],headerExtensions:[],fecMechanisms:[],rtcp:[]},a=r.splitLines(e)[0].split(" "),n=3;n<a.length;n++){var s=a[n],i=r.matchPrefix(e,"a=rtpmap:"+s+" ")[0];if(i){var p=r.parseRtpMap(i),c=r.matchPrefix(e,"a=fmtp:"+s+" ");switch(p.parameters=c.length?r.parseFmtp(c[0]):{},p.rtcpFeedback=r.matchPrefix(e,"a=rtcp-fb:"+s+" ").map(r.parseRtcpFb),t.codecs.push(p),p.name.toUpperCase()){case"RED":case"ULPFEC":t.fecMechanisms.push(p.name.toUpperCase())}}}return r.matchPrefix(e,"a=extmap:").forEach(function(e){t.headerExtensions.push(r.parseExtmap(e))}),t},r.writeRtpDescription=function(e,t){var a="";a+="m="+e+" ",a+=t.codecs.length>0?"9":"0",a+=" UDP/TLS/RTP/SAVPF ",a+=t.codecs.map(function(r){return void 0!==r.preferredPayloadType?r.preferredPayloadType:r.payloadType}).join(" ")+"\r\n",a+="c=IN IP4 0.0.0.0\r\n",a+="a=rtcp:9 IN IP4 0.0.0.0\r\n",t.codecs.forEach(function(e){a+=r.writeRtpMap(e),a+=r.writeFmtp(e),a+=r.writeRtcpFb(e)});var n=0;return t.codecs.forEach(function(r){r.maxptime>n&&(n=r.maxptime)}),n>0&&(a+="a=maxptime:"+n+"\r\n"),a+="a=rtcp-mux\r\n",t.headerExtensions&&t.headerExtensions.forEach(function(e){a+=r.writeExtmap(e)}),a},r.parseRtpEncodingParameters=function(e){var t,a=[],n=r.parseRtpParameters(e),s=-1!==n.fecMechanisms.indexOf("RED"),i=-1!==n.fecMechanisms.indexOf("ULPFEC"),p=r.matchPrefix(e,"a=ssrc:").map(function(e){return r.parseSsrcMedia(e)}).filter(function(r){return"cname"===r.attribute}),c=p.length>0&&p[0].ssrc,o=r.matchPrefix(e,"a=ssrc-group:FID").map(function(r){return r.substr(17).split(" ").map(function(r){return parseInt(r,10)})});o.length>0&&o[0].length>1&&o[0][0]===c&&(t=o[0][1]),n.codecs.forEach(function(r){if("RTX"===r.name.toUpperCase()&&r.parameters.apt){var e={ssrc:c,codecPayloadType:parseInt(r.parameters.apt,10)};c&&t&&(e.rtx={ssrc:t}),a.push(e),s&&((e=JSON.parse(JSON.stringify(e))).fec={ssrc:c,mechanism:i?"red+ulpfec":"red"},a.push(e))}}),0===a.length&&c&&a.push({ssrc:c});var u=r.matchPrefix(e,"b=");return u.length&&(u=0===u[0].indexOf("b=TIAS:")?parseInt(u[0].substr(7),10):0===u[0].indexOf("b=AS:")?1e3*parseInt(u[0].substr(5),10)*.95-16e3:void 0,a.forEach(function(r){r.maxBitrate=u})),a},r.parseRtcpParameters=function(e){var t={},a=r.matchPrefix(e,"a=ssrc:").map(function(e){return r.parseSsrcMedia(e)}).filter(function(r){return"cname"===r.attribute})[0];a&&(t.cname=a.value,t.ssrc=a.ssrc);var n=r.matchPrefix(e,"a=rtcp-rsize");t.reducedSize=n.length>0,t.compound=0===n.length;var s=r.matchPrefix(e,"a=rtcp-mux");return t.mux=s.length>0,t},r.parseMsid=function(e){var t,a=r.matchPrefix(e,"a=msid:");if(1===a.length)return{stream:(t=a[0].substr(7).split(" "))[0],track:t[1]};var n=r.matchPrefix(e,"a=ssrc:").map(function(e){return r.parseSsrcMedia(e)}).filter(function(r){return"msid"===r.attribute});return n.length>0?{stream:(t=n[0].value.split(" "))[0],track:t[1]}:void 0},r.parseSctpDescription=function(e){var t,a=r.parseMLine(e),n=r.matchPrefix(e,"a=max-message-size:");n.length>0&&(t=parseInt(n[0].substr(19),10)),isNaN(t)&&(t=65536);var s=r.matchPrefix(e,"a=sctp-port:");if(s.length>0)return{port:parseInt(s[0].substr(12),10),protocol:a.fmt,maxMessageSize:t};if(r.matchPrefix(e,"a=sctpmap:").length>0){var i=r.matchPrefix(e,"a=sctpmap:")[0].substr(10).split(" ");return{port:parseInt(i[0],10),protocol:i[1],maxMessageSize:t}}},r.writeSctpDescription=function(r,e){var t=[];return t="DTLS/SCTP"!==r.protocol?["m="+r.kind+" 9 "+r.protocol+" "+e.protocol+"\r\n","c=IN IP4 0.0.0.0\r\n","a=sctp-port:"+e.port+"\r\n"]:["m="+r.kind+" 9 "+r.protocol+" "+e.port+"\r\n","c=IN IP4 0.0.0.0\r\n","a=sctpmap:"+e.port+" "+e.protocol+" 65535\r\n"],void 0!==e.maxMessageSize&&t.push("a=max-message-size:"+e.maxMessageSize+"\r\n"),t.join("")},r.generateSessionId=function(){return Math.random().toString().substr(2,21)},r.writeSessionBoilerplate=function(e,t,a){var n=void 0!==t?t:2;return"v=0\r\no="+(a||"thisisadapterortc")+" "+(e||r.generateSessionId())+" "+n+" IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"},r.writeMediaSection=function(e,t,a,n){var s=r.writeRtpDescription(e.kind,t);if(s+=r.writeIceParameters(e.iceGatherer.getLocalParameters()),s+=r.writeDtlsParameters(e.dtlsTransport.getLocalParameters(),"offer"===a?"actpass":"active"),s+="a=mid:"+e.mid+"\r\n",e.direction?s+="a="+e.direction+"\r\n":e.rtpSender&&e.rtpReceiver?s+="a=sendrecv\r\n":e.rtpSender?s+="a=sendonly\r\n":e.rtpReceiver?s+="a=recvonly\r\n":s+="a=inactive\r\n",e.rtpSender){var i="msid:"+n.id+" "+e.rtpSender.track.id+"\r\n";s+="a="+i,s+="a=ssrc:"+e.sendEncodingParameters[0].ssrc+" "+i,e.sendEncodingParameters[0].rtx&&(s+="a=ssrc:"+e.sendEncodingParameters[0].rtx.ssrc+" "+i,s+="a=ssrc-group:FID "+e.sendEncodingParameters[0].ssrc+" "+e.sendEncodingParameters[0].rtx.ssrc+"\r\n")}return s+="a=ssrc:"+e.sendEncodingParameters[0].ssrc+" cname:"+r.localCName+"\r\n",e.rtpSender&&e.sendEncodingParameters[0].rtx&&(s+="a=ssrc:"+e.sendEncodingParameters[0].rtx.ssrc+" cname:"+r.localCName+"\r\n"),s},r.getDirection=function(e,t){for(var a=r.splitLines(e),n=0;n<a.length;n++)switch(a[n]){case"a=sendrecv":case"a=sendonly":case"a=recvonly":case"a=inactive":return a[n].substr(2)}return t?r.getDirection(t):"sendrecv"},r.getKind=function(e){return r.splitLines(e)[0].split(" ")[0].substr(2)},r.isRejected=function(r){return"0"===r.split(" ",2)[1]},r.parseMLine=function(e){var t=r.splitLines(e)[0].substr(2).split(" ");return{kind:t[0],port:parseInt(t[1],10),protocol:t[2],fmt:t.slice(3).join(" ")}},r.parseOLine=function(e){var t=r.matchPrefix(e,"o=")[0].substr(2).split(" ");return{username:t[0],sessionId:t[1],sessionVersion:parseInt(t[2],10),netType:t[3],addressType:t[4],address:t[5]}},r.isValidSDP=function(e){if("string"!=typeof e||0===e.length)return!1;for(var t=r.splitLines(e),a=0;a<t.length;a++)if(t[a].length<2||"="!==t[a].charAt(1))return!1;return!0},"object"==typeof module&&(module.exports=r);
},{}],"NJ2u":[function(require,module,exports) {
"use strict";var e=require("sdp");function t(e){return{inboundrtp:"inbound-rtp",outboundrtp:"outbound-rtp",candidatepair:"candidate-pair",localcandidate:"local-candidate",remotecandidate:"remote-candidate"}[e.type]||e.type}function r(t,r,n,a,i){var s=e.writeRtpDescription(t.kind,r);if(s+=e.writeIceParameters(t.iceGatherer.getLocalParameters()),s+=e.writeDtlsParameters(t.dtlsTransport.getLocalParameters(),"offer"===n?"actpass":i||"active"),s+="a=mid:"+t.mid+"\r\n",t.rtpSender&&t.rtpReceiver?s+="a=sendrecv\r\n":t.rtpSender?s+="a=sendonly\r\n":t.rtpReceiver?s+="a=recvonly\r\n":s+="a=inactive\r\n",t.rtpSender){var o=t.rtpSender._initialTrackId||t.rtpSender.track.id;t.rtpSender._initialTrackId=o;var c="msid:"+(a?a.id:"-")+" "+o+"\r\n";s+="a="+c,s+="a=ssrc:"+t.sendEncodingParameters[0].ssrc+" "+c,t.sendEncodingParameters[0].rtx&&(s+="a=ssrc:"+t.sendEncodingParameters[0].rtx.ssrc+" "+c,s+="a=ssrc-group:FID "+t.sendEncodingParameters[0].ssrc+" "+t.sendEncodingParameters[0].rtx.ssrc+"\r\n")}return s+="a=ssrc:"+t.sendEncodingParameters[0].ssrc+" cname:"+e.localCName+"\r\n",t.rtpSender&&t.sendEncodingParameters[0].rtx&&(s+="a=ssrc:"+t.sendEncodingParameters[0].rtx.ssrc+" cname:"+e.localCName+"\r\n"),s}function n(e,t){var r=!1;return(e=JSON.parse(JSON.stringify(e))).filter(function(e){if(e&&(e.urls||e.url)){var n=e.urls||e.url;e.url&&!e.urls&&console.warn("RTCIceServer.url is deprecated! Use urls instead.");var a="string"==typeof n;return a&&(n=[n]),n=n.filter(function(e){return 0===e.indexOf("turn:")&&-1!==e.indexOf("transport=udp")&&-1===e.indexOf("turn:[")&&!r?(r=!0,!0):0===e.indexOf("stun:")&&t>=14393&&-1===e.indexOf("?transport=udp")}),delete e.url,e.urls=a?n[0]:n,!!n.length}})}function a(e,t){var r={codecs:[],headerExtensions:[],fecMechanisms:[]},n=function(e,t){e=parseInt(e,10);for(var r=0;r<t.length;r++)if(t[r].payloadType===e||t[r].preferredPayloadType===e)return t[r]},a=function(e,t,r,a){var i=n(e.parameters.apt,r),s=n(t.parameters.apt,a);return i&&s&&i.name.toLowerCase()===s.name.toLowerCase()};return e.codecs.forEach(function(n){for(var i=0;i<t.codecs.length;i++){var s=t.codecs[i];if(n.name.toLowerCase()===s.name.toLowerCase()&&n.clockRate===s.clockRate){if("rtx"===n.name.toLowerCase()&&n.parameters&&s.parameters.apt&&!a(n,s,e.codecs,t.codecs))continue;(s=JSON.parse(JSON.stringify(s))).numChannels=Math.min(n.numChannels,s.numChannels),r.codecs.push(s),s.rtcpFeedback=s.rtcpFeedback.filter(function(e){for(var t=0;t<n.rtcpFeedback.length;t++)if(n.rtcpFeedback[t].type===e.type&&n.rtcpFeedback[t].parameter===e.parameter)return!0;return!1});break}}}),e.headerExtensions.forEach(function(e){for(var n=0;n<t.headerExtensions.length;n++){var a=t.headerExtensions[n];if(e.uri===a.uri){r.headerExtensions.push(a);break}}}),r}function i(e,t,r){return-1!=={offer:{setLocalDescription:["stable","have-local-offer"],setRemoteDescription:["stable","have-remote-offer"]},answer:{setLocalDescription:["have-remote-offer","have-local-pranswer"],setRemoteDescription:["have-local-offer","have-remote-pranswer"]}}[t][e].indexOf(r)}function s(e,t){var r=e.getRemoteCandidates().find(function(e){return t.foundation===e.foundation&&t.ip===e.ip&&t.port===e.port&&t.priority===e.priority&&t.protocol===e.protocol&&t.type===e.type});return r||e.addRemoteCandidate(t),!r}function o(e,t){var r=new Error(t);return r.name=e,r.code={NotSupportedError:9,InvalidStateError:11,InvalidAccessError:15,TypeError:void 0,OperationError:void 0}[e],r}module.exports=function(c,d){function p(e,t){t.addTrack(e),t.dispatchEvent(new c.MediaStreamTrackEvent("addtrack",{track:e}))}function l(e,t,r,n){var a=new Event("track");a.track=t,a.receiver=r,a.transceiver={receiver:r},a.streams=n,c.setTimeout(function(){e._dispatchEvent("track",a)})}var f=function(t){var r=this,a=document.createDocumentFragment();if(["addEventListener","removeEventListener","dispatchEvent"].forEach(function(e){r[e]=a[e].bind(a)}),this.canTrickleIceCandidates=null,this.needNegotiation=!1,this.localStreams=[],this.remoteStreams=[],this._localDescription=null,this._remoteDescription=null,this.signalingState="stable",this.iceConnectionState="new",this.connectionState="new",this.iceGatheringState="new",t=JSON.parse(JSON.stringify(t||{})),this.usingBundle="max-bundle"===t.bundlePolicy,"negotiate"===t.rtcpMuxPolicy)throw o("NotSupportedError","rtcpMuxPolicy 'negotiate' is not supported");switch(t.rtcpMuxPolicy||(t.rtcpMuxPolicy="require"),t.iceTransportPolicy){case"all":case"relay":break;default:t.iceTransportPolicy="all"}switch(t.bundlePolicy){case"balanced":case"max-compat":case"max-bundle":break;default:t.bundlePolicy="balanced"}if(t.iceServers=n(t.iceServers||[],d),this._iceGatherers=[],t.iceCandidatePoolSize)for(var i=t.iceCandidatePoolSize;i>0;i--)this._iceGatherers.push(new c.RTCIceGatherer({iceServers:t.iceServers,gatherPolicy:t.iceTransportPolicy}));else t.iceCandidatePoolSize=0;this._config=t,this.transceivers=[],this._sdpSessionId=e.generateSessionId(),this._sdpSessionVersion=0,this._dtlsRole=void 0,this._isClosed=!1};Object.defineProperty(f.prototype,"localDescription",{configurable:!0,get:function(){return this._localDescription}}),Object.defineProperty(f.prototype,"remoteDescription",{configurable:!0,get:function(){return this._remoteDescription}}),f.prototype.onicecandidate=null,f.prototype.onaddstream=null,f.prototype.ontrack=null,f.prototype.onremovestream=null,f.prototype.onsignalingstatechange=null,f.prototype.oniceconnectionstatechange=null,f.prototype.onconnectionstatechange=null,f.prototype.onicegatheringstatechange=null,f.prototype.onnegotiationneeded=null,f.prototype.ondatachannel=null,f.prototype._dispatchEvent=function(e,t){this._isClosed||(this.dispatchEvent(t),"function"==typeof this["on"+e]&&this["on"+e](t))},f.prototype._emitGatheringStateChange=function(){var e=new Event("icegatheringstatechange");this._dispatchEvent("icegatheringstatechange",e)},f.prototype.getConfiguration=function(){return this._config},f.prototype.getLocalStreams=function(){return this.localStreams},f.prototype.getRemoteStreams=function(){return this.remoteStreams},f.prototype._createTransceiver=function(e,t){var r=this.transceivers.length>0,n={track:null,iceGatherer:null,iceTransport:null,dtlsTransport:null,localCapabilities:null,remoteCapabilities:null,rtpSender:null,rtpReceiver:null,kind:e,mid:null,sendEncodingParameters:null,recvEncodingParameters:null,stream:null,associatedRemoteMediaStreams:[],wantReceive:!0};if(this.usingBundle&&r)n.iceTransport=this.transceivers[0].iceTransport,n.dtlsTransport=this.transceivers[0].dtlsTransport;else{var a=this._createIceAndDtlsTransports();n.iceTransport=a.iceTransport,n.dtlsTransport=a.dtlsTransport}return t||this.transceivers.push(n),n},f.prototype.addTrack=function(e,t){if(this._isClosed)throw o("InvalidStateError","Attempted to call addTrack on a closed peerconnection.");var r;if(this.transceivers.find(function(t){return t.track===e}))throw o("InvalidAccessError","Track already exists.");for(var n=0;n<this.transceivers.length;n++)this.transceivers[n].track||this.transceivers[n].kind!==e.kind||(r=this.transceivers[n]);return r||(r=this._createTransceiver(e.kind)),this._maybeFireNegotiationNeeded(),-1===this.localStreams.indexOf(t)&&this.localStreams.push(t),r.track=e,r.stream=t,r.rtpSender=new c.RTCRtpSender(e,r.dtlsTransport),r.rtpSender},f.prototype.addStream=function(e){var t=this;if(d>=15025)e.getTracks().forEach(function(r){t.addTrack(r,e)});else{var r=e.clone();e.getTracks().forEach(function(e,t){var n=r.getTracks()[t];e.addEventListener("enabled",function(e){n.enabled=e.enabled})}),r.getTracks().forEach(function(e){t.addTrack(e,r)})}},f.prototype.removeTrack=function(e){if(this._isClosed)throw o("InvalidStateError","Attempted to call removeTrack on a closed peerconnection.");if(!(e instanceof c.RTCRtpSender))throw new TypeError("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.");var t=this.transceivers.find(function(t){return t.rtpSender===e});if(!t)throw o("InvalidAccessError","Sender was not created by this connection.");var r=t.stream;t.rtpSender.stop(),t.rtpSender=null,t.track=null,t.stream=null,-1===this.transceivers.map(function(e){return e.stream}).indexOf(r)&&this.localStreams.indexOf(r)>-1&&this.localStreams.splice(this.localStreams.indexOf(r),1),this._maybeFireNegotiationNeeded()},f.prototype.removeStream=function(e){var t=this;e.getTracks().forEach(function(e){var r=t.getSenders().find(function(t){return t.track===e});r&&t.removeTrack(r)})},f.prototype.getSenders=function(){return this.transceivers.filter(function(e){return!!e.rtpSender}).map(function(e){return e.rtpSender})},f.prototype.getReceivers=function(){return this.transceivers.filter(function(e){return!!e.rtpReceiver}).map(function(e){return e.rtpReceiver})},f.prototype._createIceGatherer=function(e,t){var r=this;if(t&&e>0)return this.transceivers[0].iceGatherer;if(this._iceGatherers.length)return this._iceGatherers.shift();var n=new c.RTCIceGatherer({iceServers:this._config.iceServers,gatherPolicy:this._config.iceTransportPolicy});return Object.defineProperty(n,"state",{value:"new",writable:!0}),this.transceivers[e].bufferedCandidateEvents=[],this.transceivers[e].bufferCandidates=function(t){var a=!t.candidate||0===Object.keys(t.candidate).length;n.state=a?"completed":"gathering",null!==r.transceivers[e].bufferedCandidateEvents&&r.transceivers[e].bufferedCandidateEvents.push(t)},n.addEventListener("localcandidate",this.transceivers[e].bufferCandidates),n},f.prototype._gather=function(t,r){var n=this,a=this.transceivers[r].iceGatherer;if(!a.onlocalcandidate){var i=this.transceivers[r].bufferedCandidateEvents;this.transceivers[r].bufferedCandidateEvents=null,a.removeEventListener("localcandidate",this.transceivers[r].bufferCandidates),a.onlocalcandidate=function(i){if(!(n.usingBundle&&r>0)){var s=new Event("icecandidate");s.candidate={sdpMid:t,sdpMLineIndex:r};var o=i.candidate,c=!o||0===Object.keys(o).length;if(c)"new"!==a.state&&"gathering"!==a.state||(a.state="completed");else{"new"===a.state&&(a.state="gathering"),o.component=1,o.ufrag=a.getLocalParameters().usernameFragment;var d=e.writeCandidate(o);s.candidate=Object.assign(s.candidate,e.parseCandidate(d)),s.candidate.candidate=d,s.candidate.toJSON=function(){return{candidate:s.candidate.candidate,sdpMid:s.candidate.sdpMid,sdpMLineIndex:s.candidate.sdpMLineIndex,usernameFragment:s.candidate.usernameFragment}}}var p=e.getMediaSections(n._localDescription.sdp);p[s.candidate.sdpMLineIndex]+=c?"a=end-of-candidates\r\n":"a="+s.candidate.candidate+"\r\n",n._localDescription.sdp=e.getDescription(n._localDescription.sdp)+p.join("");var l=n.transceivers.every(function(e){return e.iceGatherer&&"completed"===e.iceGatherer.state});"gathering"!==n.iceGatheringState&&(n.iceGatheringState="gathering",n._emitGatheringStateChange()),c||n._dispatchEvent("icecandidate",s),l&&(n._dispatchEvent("icecandidate",new Event("icecandidate")),n.iceGatheringState="complete",n._emitGatheringStateChange())}},c.setTimeout(function(){i.forEach(function(e){a.onlocalcandidate(e)})},0)}},f.prototype._createIceAndDtlsTransports=function(){var e=this,t=new c.RTCIceTransport(null);t.onicestatechange=function(){e._updateIceConnectionState(),e._updateConnectionState()};var r=new c.RTCDtlsTransport(t);return r.ondtlsstatechange=function(){e._updateConnectionState()},r.onerror=function(){Object.defineProperty(r,"state",{value:"failed",writable:!0}),e._updateConnectionState()},{iceTransport:t,dtlsTransport:r}},f.prototype._disposeIceAndDtlsTransports=function(e){var t=this.transceivers[e].iceGatherer;t&&(delete t.onlocalcandidate,delete this.transceivers[e].iceGatherer);var r=this.transceivers[e].iceTransport;r&&(delete r.onicestatechange,delete this.transceivers[e].iceTransport);var n=this.transceivers[e].dtlsTransport;n&&(delete n.ondtlsstatechange,delete n.onerror,delete this.transceivers[e].dtlsTransport)},f.prototype._transceive=function(t,r,n){var i=a(t.localCapabilities,t.remoteCapabilities);r&&t.rtpSender&&(i.encodings=t.sendEncodingParameters,i.rtcp={cname:e.localCName,compound:t.rtcpParameters.compound},t.recvEncodingParameters.length&&(i.rtcp.ssrc=t.recvEncodingParameters[0].ssrc),t.rtpSender.send(i)),n&&t.rtpReceiver&&i.codecs.length>0&&("video"===t.kind&&t.recvEncodingParameters&&d<15019&&t.recvEncodingParameters.forEach(function(e){delete e.rtx}),t.recvEncodingParameters.length?i.encodings=t.recvEncodingParameters:i.encodings=[{}],i.rtcp={compound:t.rtcpParameters.compound},t.rtcpParameters.cname&&(i.rtcp.cname=t.rtcpParameters.cname),t.sendEncodingParameters.length&&(i.rtcp.ssrc=t.sendEncodingParameters[0].ssrc),t.rtpReceiver.receive(i))},f.prototype.setLocalDescription=function(t){var r,n,s=this;if(-1===["offer","answer"].indexOf(t.type))return Promise.reject(o("TypeError",'Unsupported type "'+t.type+'"'));if(!i("setLocalDescription",t.type,s.signalingState)||s._isClosed)return Promise.reject(o("InvalidStateError","Can not set local "+t.type+" in state "+s.signalingState));if("offer"===t.type)r=e.splitSections(t.sdp),n=r.shift(),r.forEach(function(t,r){var n=e.parseRtpParameters(t);s.transceivers[r].localCapabilities=n}),s.transceivers.forEach(function(e,t){s._gather(e.mid,t)});else if("answer"===t.type){r=e.splitSections(s._remoteDescription.sdp),n=r.shift();var c=e.matchPrefix(n,"a=ice-lite").length>0;r.forEach(function(t,r){var i=s.transceivers[r],o=i.iceGatherer,d=i.iceTransport,p=i.dtlsTransport,l=i.localCapabilities,f=i.remoteCapabilities;if(!(e.isRejected(t)&&0===e.matchPrefix(t,"a=bundle-only").length)&&!i.rejected){var u=e.getIceParameters(t,n),v=e.getDtlsParameters(t,n);c&&(v.role="server"),s.usingBundle&&0!==r||(s._gather(i.mid,r),"new"===d.state&&d.start(o,u,c?"controlling":"controlled"),"new"===p.state&&p.start(v));var h=a(l,f);s._transceive(i,h.codecs.length>0,!1)}})}return s._localDescription={type:t.type,sdp:t.sdp},"offer"===t.type?s._updateSignalingState("have-local-offer"):s._updateSignalingState("stable"),Promise.resolve()},f.prototype.setRemoteDescription=function(t){var r=this;if(-1===["offer","answer"].indexOf(t.type))return Promise.reject(o("TypeError",'Unsupported type "'+t.type+'"'));if(!i("setRemoteDescription",t.type,r.signalingState)||r._isClosed)return Promise.reject(o("InvalidStateError","Can not set remote "+t.type+" in state "+r.signalingState));var n={};r.remoteStreams.forEach(function(e){n[e.id]=e});var f=[],u=e.splitSections(t.sdp),v=u.shift(),h=e.matchPrefix(v,"a=ice-lite").length>0,m=e.matchPrefix(v,"a=group:BUNDLE ").length>0;r.usingBundle=m;var g=e.matchPrefix(v,"a=ice-options:")[0];return r.canTrickleIceCandidates=!!g&&g.substr(14).split(" ").indexOf("trickle")>=0,u.forEach(function(i,o){var l=e.splitLines(i),u=e.getKind(i),g=e.isRejected(i)&&0===e.matchPrefix(i,"a=bundle-only").length,y=l[0].substr(2).split(" ")[2],S=e.getDirection(i,v),T=e.parseMsid(i),E=e.getMid(i)||e.generateIdentifier();if(g||"application"===u&&("DTLS/SCTP"===y||"UDP/DTLS/SCTP"===y))r.transceivers[o]={mid:E,kind:u,protocol:y,rejected:!0};else{var C,P,w,R,_,k,b,x,D;!g&&r.transceivers[o]&&r.transceivers[o].rejected&&(r.transceivers[o]=r._createTransceiver(u,!0));var I,L,M=e.parseRtpParameters(i);g||(I=e.getIceParameters(i,v),(L=e.getDtlsParameters(i,v)).role="client"),b=e.parseRtpEncodingParameters(i);var O=e.parseRtcpParameters(i),G=e.matchPrefix(i,"a=end-of-candidates",v).length>0,j=e.matchPrefix(i,"a=candidate:").map(function(t){return e.parseCandidate(t)}).filter(function(e){return 1===e.component});if(("offer"===t.type||"answer"===t.type)&&!g&&m&&o>0&&r.transceivers[o]&&(r._disposeIceAndDtlsTransports(o),r.transceivers[o].iceGatherer=r.transceivers[0].iceGatherer,r.transceivers[o].iceTransport=r.transceivers[0].iceTransport,r.transceivers[o].dtlsTransport=r.transceivers[0].dtlsTransport,r.transceivers[o].rtpSender&&r.transceivers[o].rtpSender.setTransport(r.transceivers[0].dtlsTransport),r.transceivers[o].rtpReceiver&&r.transceivers[o].rtpReceiver.setTransport(r.transceivers[0].dtlsTransport)),"offer"!==t.type||g){if("answer"===t.type&&!g){P=(C=r.transceivers[o]).iceGatherer,w=C.iceTransport,R=C.dtlsTransport,_=C.rtpReceiver,k=C.sendEncodingParameters,x=C.localCapabilities,r.transceivers[o].recvEncodingParameters=b,r.transceivers[o].remoteCapabilities=M,r.transceivers[o].rtcpParameters=O,j.length&&"new"===w.state&&(!h&&!G||m&&0!==o?j.forEach(function(e){s(C.iceTransport,e)}):w.setRemoteCandidates(j)),m&&0!==o||("new"===w.state&&w.start(P,I,"controlling"),"new"===R.state&&R.start(L)),!a(C.localCapabilities,C.remoteCapabilities).codecs.filter(function(e){return"rtx"===e.name.toLowerCase()}).length&&C.sendEncodingParameters[0].rtx&&delete C.sendEncodingParameters[0].rtx,r._transceive(C,"sendrecv"===S||"recvonly"===S,"sendrecv"===S||"sendonly"===S),!_||"sendrecv"!==S&&"sendonly"!==S?delete C.rtpReceiver:(D=_.track,T?(n[T.stream]||(n[T.stream]=new c.MediaStream),p(D,n[T.stream]),f.push([D,_,n[T.stream]])):(n.default||(n.default=new c.MediaStream),p(D,n.default),f.push([D,_,n.default])))}}else{(C=r.transceivers[o]||r._createTransceiver(u)).mid=E,C.iceGatherer||(C.iceGatherer=r._createIceGatherer(o,m)),j.length&&"new"===C.iceTransport.state&&(!G||m&&0!==o?j.forEach(function(e){s(C.iceTransport,e)}):C.iceTransport.setRemoteCandidates(j)),x=c.RTCRtpReceiver.getCapabilities(u),d<15019&&(x.codecs=x.codecs.filter(function(e){return"rtx"!==e.name})),k=C.sendEncodingParameters||[{ssrc:1001*(2*o+2)}];var N,A=!1;if("sendrecv"===S||"sendonly"===S){if(A=!C.rtpReceiver,_=C.rtpReceiver||new c.RTCRtpReceiver(C.dtlsTransport,u),A)D=_.track,T&&"-"===T.stream||(T?(n[T.stream]||(n[T.stream]=new c.MediaStream,Object.defineProperty(n[T.stream],"id",{get:function(){return T.stream}})),Object.defineProperty(D,"id",{get:function(){return T.track}}),N=n[T.stream]):(n.default||(n.default=new c.MediaStream),N=n.default)),N&&(p(D,N),C.associatedRemoteMediaStreams.push(N)),f.push([D,_,N])}else C.rtpReceiver&&C.rtpReceiver.track&&(C.associatedRemoteMediaStreams.forEach(function(e){var t,r,n=e.getTracks().find(function(e){return e.id===C.rtpReceiver.track.id});n&&(t=n,(r=e).removeTrack(t),r.dispatchEvent(new c.MediaStreamTrackEvent("removetrack",{track:t})))}),C.associatedRemoteMediaStreams=[]);C.localCapabilities=x,C.remoteCapabilities=M,C.rtpReceiver=_,C.rtcpParameters=O,C.sendEncodingParameters=k,C.recvEncodingParameters=b,r._transceive(r.transceivers[o],!1,A)}}}),void 0===r._dtlsRole&&(r._dtlsRole="offer"===t.type?"active":"passive"),r._remoteDescription={type:t.type,sdp:t.sdp},"offer"===t.type?r._updateSignalingState("have-remote-offer"):r._updateSignalingState("stable"),Object.keys(n).forEach(function(e){var t=n[e];if(t.getTracks().length){if(-1===r.remoteStreams.indexOf(t)){r.remoteStreams.push(t);var a=new Event("addstream");a.stream=t,c.setTimeout(function(){r._dispatchEvent("addstream",a)})}f.forEach(function(e){var n=e[0],a=e[1];t.id===e[2].id&&l(r,n,a,[t])})}}),f.forEach(function(e){e[2]||l(r,e[0],e[1],[])}),c.setTimeout(function(){r&&r.transceivers&&r.transceivers.forEach(function(e){e.iceTransport&&"new"===e.iceTransport.state&&e.iceTransport.getRemoteCandidates().length>0&&(console.warn("Timeout for addRemoteCandidate. Consider sending an end-of-candidates notification"),e.iceTransport.addRemoteCandidate({}))})},4e3),Promise.resolve()},f.prototype.close=function(){this.transceivers.forEach(function(e){e.iceTransport&&e.iceTransport.stop(),e.dtlsTransport&&e.dtlsTransport.stop(),e.rtpSender&&e.rtpSender.stop(),e.rtpReceiver&&e.rtpReceiver.stop()}),this._isClosed=!0,this._updateSignalingState("closed")},f.prototype._updateSignalingState=function(e){this.signalingState=e;var t=new Event("signalingstatechange");this._dispatchEvent("signalingstatechange",t)},f.prototype._maybeFireNegotiationNeeded=function(){var e=this;"stable"===this.signalingState&&!0!==this.needNegotiation&&(this.needNegotiation=!0,c.setTimeout(function(){if(e.needNegotiation){e.needNegotiation=!1;var t=new Event("negotiationneeded");e._dispatchEvent("negotiationneeded",t)}},0))},f.prototype._updateIceConnectionState=function(){var e,t={new:0,closed:0,checking:0,connected:0,completed:0,disconnected:0,failed:0};if(this.transceivers.forEach(function(e){e.iceTransport&&!e.rejected&&t[e.iceTransport.state]++}),e="new",t.failed>0?e="failed":t.checking>0?e="checking":t.disconnected>0?e="disconnected":t.new>0?e="new":t.connected>0?e="connected":t.completed>0&&(e="completed"),e!==this.iceConnectionState){this.iceConnectionState=e;var r=new Event("iceconnectionstatechange");this._dispatchEvent("iceconnectionstatechange",r)}},f.prototype._updateConnectionState=function(){var e,t={new:0,closed:0,connecting:0,connected:0,completed:0,disconnected:0,failed:0};if(this.transceivers.forEach(function(e){e.iceTransport&&e.dtlsTransport&&!e.rejected&&(t[e.iceTransport.state]++,t[e.dtlsTransport.state]++)}),t.connected+=t.completed,e="new",t.failed>0?e="failed":t.connecting>0?e="connecting":t.disconnected>0?e="disconnected":t.new>0?e="new":t.connected>0&&(e="connected"),e!==this.connectionState){this.connectionState=e;var r=new Event("connectionstatechange");this._dispatchEvent("connectionstatechange",r)}},f.prototype.createOffer=function(){var t=this;if(t._isClosed)return Promise.reject(o("InvalidStateError","Can not call createOffer after close"));var n=t.transceivers.filter(function(e){return"audio"===e.kind}).length,a=t.transceivers.filter(function(e){return"video"===e.kind}).length,i=arguments[0];if(i){if(i.mandatory||i.optional)throw new TypeError("Legacy mandatory/optional constraints not supported.");void 0!==i.offerToReceiveAudio&&(n=!0===i.offerToReceiveAudio?1:!1===i.offerToReceiveAudio?0:i.offerToReceiveAudio),void 0!==i.offerToReceiveVideo&&(a=!0===i.offerToReceiveVideo?1:!1===i.offerToReceiveVideo?0:i.offerToReceiveVideo)}for(t.transceivers.forEach(function(e){"audio"===e.kind?--n<0&&(e.wantReceive=!1):"video"===e.kind&&--a<0&&(e.wantReceive=!1)});n>0||a>0;)n>0&&(t._createTransceiver("audio"),n--),a>0&&(t._createTransceiver("video"),a--);var s=e.writeSessionBoilerplate(t._sdpSessionId,t._sdpSessionVersion++);t.transceivers.forEach(function(r,n){var a=r.track,i=r.kind,s=r.mid||e.generateIdentifier();r.mid=s,r.iceGatherer||(r.iceGatherer=t._createIceGatherer(n,t.usingBundle));var o=c.RTCRtpSender.getCapabilities(i);d<15019&&(o.codecs=o.codecs.filter(function(e){return"rtx"!==e.name})),o.codecs.forEach(function(e){"H264"===e.name&&void 0===e.parameters["level-asymmetry-allowed"]&&(e.parameters["level-asymmetry-allowed"]="1"),r.remoteCapabilities&&r.remoteCapabilities.codecs&&r.remoteCapabilities.codecs.forEach(function(t){e.name.toLowerCase()===t.name.toLowerCase()&&e.clockRate===t.clockRate&&(e.preferredPayloadType=t.payloadType)})}),o.headerExtensions.forEach(function(e){(r.remoteCapabilities&&r.remoteCapabilities.headerExtensions||[]).forEach(function(t){e.uri===t.uri&&(e.id=t.id)})});var p=r.sendEncodingParameters||[{ssrc:1001*(2*n+1)}];a&&d>=15019&&"video"===i&&!p[0].rtx&&(p[0].rtx={ssrc:p[0].ssrc+1}),r.wantReceive&&(r.rtpReceiver=new c.RTCRtpReceiver(r.dtlsTransport,i)),r.localCapabilities=o,r.sendEncodingParameters=p}),"max-compat"!==t._config.bundlePolicy&&(s+="a=group:BUNDLE "+t.transceivers.map(function(e){return e.mid}).join(" ")+"\r\n"),s+="a=ice-options:trickle\r\n",t.transceivers.forEach(function(n,a){s+=r(n,n.localCapabilities,"offer",n.stream,t._dtlsRole),s+="a=rtcp-rsize\r\n",!n.iceGatherer||"new"===t.iceGatheringState||0!==a&&t.usingBundle||(n.iceGatherer.getLocalCandidates().forEach(function(t){t.component=1,s+="a="+e.writeCandidate(t)+"\r\n"}),"completed"===n.iceGatherer.state&&(s+="a=end-of-candidates\r\n"))});var p=new c.RTCSessionDescription({type:"offer",sdp:s});return Promise.resolve(p)},f.prototype.createAnswer=function(){var t=this;if(t._isClosed)return Promise.reject(o("InvalidStateError","Can not call createAnswer after close"));if("have-remote-offer"!==t.signalingState&&"have-local-pranswer"!==t.signalingState)return Promise.reject(o("InvalidStateError","Can not call createAnswer in signalingState "+t.signalingState));var n=e.writeSessionBoilerplate(t._sdpSessionId,t._sdpSessionVersion++);t.usingBundle&&(n+="a=group:BUNDLE "+t.transceivers.map(function(e){return e.mid}).join(" ")+"\r\n"),n+="a=ice-options:trickle\r\n";var i=e.getMediaSections(t._remoteDescription.sdp).length;t.transceivers.forEach(function(e,s){if(!(s+1>i)){if(e.rejected)return"application"===e.kind?"DTLS/SCTP"===e.protocol?n+="m=application 0 DTLS/SCTP 5000\r\n":n+="m=application 0 "+e.protocol+" webrtc-datachannel\r\n":"audio"===e.kind?n+="m=audio 0 UDP/TLS/RTP/SAVPF 0\r\na=rtpmap:0 PCMU/8000\r\n":"video"===e.kind&&(n+="m=video 0 UDP/TLS/RTP/SAVPF 120\r\na=rtpmap:120 VP8/90000\r\n"),void(n+="c=IN IP4 0.0.0.0\r\na=inactive\r\na=mid:"+e.mid+"\r\n");var o;if(e.stream)"audio"===e.kind?o=e.stream.getAudioTracks()[0]:"video"===e.kind&&(o=e.stream.getVideoTracks()[0]),o&&d>=15019&&"video"===e.kind&&!e.sendEncodingParameters[0].rtx&&(e.sendEncodingParameters[0].rtx={ssrc:e.sendEncodingParameters[0].ssrc+1});var c=a(e.localCapabilities,e.remoteCapabilities);!c.codecs.filter(function(e){return"rtx"===e.name.toLowerCase()}).length&&e.sendEncodingParameters[0].rtx&&delete e.sendEncodingParameters[0].rtx,n+=r(e,c,"answer",e.stream,t._dtlsRole),e.rtcpParameters&&e.rtcpParameters.reducedSize&&(n+="a=rtcp-rsize\r\n")}});var s=new c.RTCSessionDescription({type:"answer",sdp:n});return Promise.resolve(s)},f.prototype.addIceCandidate=function(t){var r,n=this;return t&&void 0===t.sdpMLineIndex&&!t.sdpMid?Promise.reject(new TypeError("sdpMLineIndex or sdpMid required")):new Promise(function(a,i){if(!n._remoteDescription)return i(o("InvalidStateError","Can not add ICE candidate without a remote description"));if(t&&""!==t.candidate){var c=t.sdpMLineIndex;if(t.sdpMid)for(var d=0;d<n.transceivers.length;d++)if(n.transceivers[d].mid===t.sdpMid){c=d;break}var p=n.transceivers[c];if(!p)return i(o("OperationError","Can not add ICE candidate"));if(p.rejected)return a();var l=Object.keys(t.candidate).length>0?e.parseCandidate(t.candidate):{};if("tcp"===l.protocol&&(0===l.port||9===l.port))return a();if(l.component&&1!==l.component)return a();if((0===c||c>0&&p.iceTransport!==n.transceivers[0].iceTransport)&&!s(p.iceTransport,l))return i(o("OperationError","Can not add ICE candidate"));var f=t.candidate.trim();0===f.indexOf("a=")&&(f=f.substr(2)),(r=e.getMediaSections(n._remoteDescription.sdp))[c]+="a="+(l.type?f:"end-of-candidates")+"\r\n",n._remoteDescription.sdp=e.getDescription(n._remoteDescription.sdp)+r.join("")}else for(var u=0;u<n.transceivers.length&&(n.transceivers[u].rejected||(n.transceivers[u].iceTransport.addRemoteCandidate({}),(r=e.getMediaSections(n._remoteDescription.sdp))[u]+="a=end-of-candidates\r\n",n._remoteDescription.sdp=e.getDescription(n._remoteDescription.sdp)+r.join(""),!n.usingBundle));u++);a()})},f.prototype.getStats=function(e){if(e&&e instanceof c.MediaStreamTrack){var t=null;if(this.transceivers.forEach(function(r){r.rtpSender&&r.rtpSender.track===e?t=r.rtpSender:r.rtpReceiver&&r.rtpReceiver.track===e&&(t=r.rtpReceiver)}),!t)throw o("InvalidAccessError","Invalid selector.");return t.getStats()}var r=[];return this.transceivers.forEach(function(e){["rtpSender","rtpReceiver","iceGatherer","iceTransport","dtlsTransport"].forEach(function(t){e[t]&&r.push(e[t].getStats())})}),Promise.all(r).then(function(e){var t=new Map;return e.forEach(function(e){e.forEach(function(e){t.set(e.id,e)})}),t})};["RTCRtpSender","RTCRtpReceiver","RTCIceGatherer","RTCIceTransport","RTCDtlsTransport"].forEach(function(e){var r=c[e];if(r&&r.prototype&&r.prototype.getStats){var n=r.prototype.getStats;r.prototype.getStats=function(){return n.apply(this).then(function(e){var r=new Map;return Object.keys(e).forEach(function(n){e[n].type=t(e[n]),r.set(n,e[n])}),r})}}});var u=["createOffer","createAnswer"];return u.forEach(function(e){var t=f.prototype[e];f.prototype[e]=function(){var e=arguments;return"function"==typeof e[0]||"function"==typeof e[1]?t.apply(this,[arguments[2]]).then(function(t){"function"==typeof e[0]&&e[0].apply(null,[t])},function(t){"function"==typeof e[1]&&e[1].apply(null,[t])}):t.apply(this,arguments)}}),(u=["setLocalDescription","setRemoteDescription","addIceCandidate"]).forEach(function(e){var t=f.prototype[e];f.prototype[e]=function(){var e=arguments;return"function"==typeof e[1]||"function"==typeof e[2]?t.apply(this,arguments).then(function(){"function"==typeof e[1]&&e[1].apply(null)},function(t){"function"==typeof e[2]&&e[2].apply(null,[t])}):t.apply(this,arguments)}}),["getStats"].forEach(function(e){var t=f.prototype[e];f.prototype[e]=function(){var e=arguments;return"function"==typeof e[1]?t.apply(this,arguments).then(function(){"function"==typeof e[1]&&e[1].apply(null)}):t.apply(this,arguments)}}),f};
},{"sdp":"YHvh"}],"YdKx":[function(require,module,exports) {
"use strict";function e(e){var r=e&&e.navigator,t=r.mediaDevices.getUserMedia.bind(r.mediaDevices);r.mediaDevices.getUserMedia=function(e){return t(e).catch(function(e){return Promise.reject(function(e){return{name:{PermissionDeniedError:"NotAllowedError"}[e.name]||e.name,message:e.message,constraint:e.constraint,toString:function(){return this.name}}}(e))})}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetUserMedia=e;
},{}],"P3bV":[function(require,module,exports) {
"use strict";function e(e){"getDisplayMedia"in e.navigator&&e.navigator.mediaDevices&&(e.navigator.mediaDevices&&"getDisplayMedia"in e.navigator.mediaDevices||(e.navigator.mediaDevices.getDisplayMedia=e.navigator.getDisplayMedia.bind(e.navigator)))}Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetDisplayMedia=e;
},{}],"XRic":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimPeerConnection=p,exports.shimReplaceTrack=a,Object.defineProperty(exports,"shimGetUserMedia",{enumerable:!0,get:function(){return n.shimGetUserMedia}}),Object.defineProperty(exports,"shimGetDisplayMedia",{enumerable:!0,get:function(){return i.shimGetDisplayMedia}});var e=s(require("../utils")),t=require("./filtericeservers"),r=o(require("rtcpeerconnection-shim")),n=require("./getusermedia"),i=require("./getdisplaymedia");function o(e){return e&&e.__esModule?e:{default:e}}function c(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return c=function(){return e},e}function s(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=c();if(t&&t.has(e))return t.get(e);var r={},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var o=n?Object.getOwnPropertyDescriptor(e,i):null;o&&(o.get||o.set)?Object.defineProperty(r,i,o):r[i]=e[i]}return r.default=e,t&&t.set(e,r),r}function p(n,i){if(n.RTCIceGatherer&&(n.RTCIceCandidate||(n.RTCIceCandidate=function(e){return e}),n.RTCSessionDescription||(n.RTCSessionDescription=function(e){return e}),i.version<15025)){var o=Object.getOwnPropertyDescriptor(n.MediaStreamTrack.prototype,"enabled");Object.defineProperty(n.MediaStreamTrack.prototype,"enabled",{set:function(e){o.set.call(this,e);var t=new Event("enabled");t.enabled=e,this.dispatchEvent(t)}})}!n.RTCRtpSender||"dtmf"in n.RTCRtpSender.prototype||Object.defineProperty(n.RTCRtpSender.prototype,"dtmf",{get:function(){return void 0===this._dtmf&&("audio"===this.track.kind?this._dtmf=new n.RTCDtmfSender(this):"video"===this.track.kind&&(this._dtmf=null)),this._dtmf}}),n.RTCDtmfSender&&!n.RTCDTMFSender&&(n.RTCDTMFSender=n.RTCDtmfSender);var c=(0,r.default)(n,i.version);n.RTCPeerConnection=function(r){return r&&r.iceServers&&(r.iceServers=(0,t.filterIceServers)(r.iceServers,i.version),e.log("ICE servers after filtering:",r.iceServers)),new c(r)},n.RTCPeerConnection.prototype=c.prototype}function a(e){!e.RTCRtpSender||"replaceTrack"in e.RTCRtpSender.prototype||(e.RTCRtpSender.prototype.replaceTrack=e.RTCRtpSender.prototype.setTrack)}
},{"../utils":"iSxC","./filtericeservers":"NZ1C","rtcpeerconnection-shim":"NJ2u","./getusermedia":"YdKx","./getdisplaymedia":"P3bV"}],"GzSv":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetUserMedia=n;var e=o(require("../utils"));function t(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return t=function(){return e},e}function o(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var o=t();if(o&&o.has(e))return o.get(e);var r={},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var a=n?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(r,i,a):r[i]=e[i]}return r.default=e,o&&o.set(e,r),r}function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function n(t,o){var n=t&&t.navigator,i=t&&t.MediaStreamTrack;if(n.getUserMedia=function(t,o,r){e.deprecated("navigator.getUserMedia","navigator.mediaDevices.getUserMedia"),n.mediaDevices.getUserMedia(t).then(o,r)},!(o.version>55&&"autoGainControl"in n.mediaDevices.getSupportedConstraints())){var a=function(e,t,o){t in e&&!(o in e)&&(e[o]=e[t],delete e[t])},s=n.mediaDevices.getUserMedia.bind(n.mediaDevices);if(n.mediaDevices.getUserMedia=function(e){return"object"===r(e)&&"object"===r(e.audio)&&(e=JSON.parse(JSON.stringify(e)),a(e.audio,"autoGainControl","mozAutoGainControl"),a(e.audio,"noiseSuppression","mozNoiseSuppression")),s(e)},i&&i.prototype.getSettings){var p=i.prototype.getSettings;i.prototype.getSettings=function(){var e=p.apply(this,arguments);return a(e,"mozAutoGainControl","autoGainControl"),a(e,"mozNoiseSuppression","noiseSuppression"),e}}if(i&&i.prototype.applyConstraints){var u=i.prototype.applyConstraints;i.prototype.applyConstraints=function(e){return"audio"===this.kind&&"object"===r(e)&&(e=JSON.parse(JSON.stringify(e)),a(e,"autoGainControl","mozAutoGainControl"),a(e,"noiseSuppression","mozNoiseSuppression")),u.apply(this,[e])}}}}
},{"../utils":"iSxC"}],"UuGU":[function(require,module,exports) {
"use strict";function e(e,i){e.navigator.mediaDevices&&"getDisplayMedia"in e.navigator.mediaDevices||e.navigator.mediaDevices&&(e.navigator.mediaDevices.getDisplayMedia=function(a){if(!a||!a.video){var t=new DOMException("getDisplayMedia without video constraints is undefined");return t.name="NotFoundError",t.code=8,Promise.reject(t)}return!0===a.video?a.video={mediaSource:i}:a.video.mediaSource=i,e.navigator.mediaDevices.getUserMedia(a)})}Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimGetDisplayMedia=e;
},{}],"Fzdr":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimOnTrack=s,exports.shimPeerConnection=c,exports.shimSenderGetStats=p,exports.shimReceiverGetStats=u,exports.shimRemoveStream=f,exports.shimRTCDataChannel=d,exports.shimAddTransceiver=C,exports.shimGetParameters=y,exports.shimCreateOffer=l,exports.shimCreateAnswer=m,Object.defineProperty(exports,"shimGetUserMedia",{enumerable:!0,get:function(){return t.shimGetUserMedia}}),Object.defineProperty(exports,"shimGetDisplayMedia",{enumerable:!0,get:function(){return n.shimGetDisplayMedia}});var e=o(require("../utils")),t=require("./getusermedia"),n=require("./getdisplaymedia");function r(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return r=function(){return e},e}function o(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=r();if(t&&t.has(e))return t.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var a=o?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(n,i,a):n[i]=e[i]}return n.default=e,t&&t.set(e,n),n}function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e){return(a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function s(e){"object"===a(e)&&e.RTCTrackEvent&&"receiver"in e.RTCTrackEvent.prototype&&!("transceiver"in e.RTCTrackEvent.prototype)&&Object.defineProperty(e.RTCTrackEvent.prototype,"transceiver",{get:function(){return{receiver:this.receiver}}})}function c(e,t){if("object"===a(e)&&(e.RTCPeerConnection||e.mozRTCPeerConnection)){!e.RTCPeerConnection&&e.mozRTCPeerConnection&&(e.RTCPeerConnection=e.mozRTCPeerConnection),t.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){var n=e.RTCPeerConnection.prototype[t],r=i({},t,function(){return arguments[0]=new("addIceCandidate"===t?e.RTCIceCandidate:e.RTCSessionDescription)(arguments[0]),n.apply(this,arguments)});e.RTCPeerConnection.prototype[t]=r[t]});var n={inboundrtp:"inbound-rtp",outboundrtp:"outbound-rtp",candidatepair:"candidate-pair",localcandidate:"local-candidate",remotecandidate:"remote-candidate"},r=e.RTCPeerConnection.prototype.getStats;e.RTCPeerConnection.prototype.getStats=function(){var[e,o,i]=arguments;return r.apply(this,[e||null]).then(function(e){if(t.version<53&&!o)try{e.forEach(function(e){e.type=n[e.type]||e.type})}catch(r){if("TypeError"!==r.name)throw r;e.forEach(function(t,r){e.set(r,Object.assign({},t,{type:n[t.type]||t.type}))})}return e}).then(o,i)}}}function p(e){if("object"===a(e)&&e.RTCPeerConnection&&e.RTCRtpSender&&!(e.RTCRtpSender&&"getStats"in e.RTCRtpSender.prototype)){var t=e.RTCPeerConnection.prototype.getSenders;t&&(e.RTCPeerConnection.prototype.getSenders=function(){var e=this,n=t.apply(this,[]);return n.forEach(function(t){return t._pc=e}),n});var n=e.RTCPeerConnection.prototype.addTrack;n&&(e.RTCPeerConnection.prototype.addTrack=function(){var e=n.apply(this,arguments);return e._pc=this,e}),e.RTCRtpSender.prototype.getStats=function(){return this.track?this._pc.getStats(this.track):Promise.resolve(new Map)}}}function u(t){if("object"===a(t)&&t.RTCPeerConnection&&t.RTCRtpSender&&!(t.RTCRtpSender&&"getStats"in t.RTCRtpReceiver.prototype)){var n=t.RTCPeerConnection.prototype.getReceivers;n&&(t.RTCPeerConnection.prototype.getReceivers=function(){var e=this,t=n.apply(this,[]);return t.forEach(function(t){return t._pc=e}),t}),e.wrapPeerConnectionEvent(t,"track",function(e){return e.receiver._pc=e.srcElement,e}),t.RTCRtpReceiver.prototype.getStats=function(){return this._pc.getStats(this.track)}}}function f(t){!t.RTCPeerConnection||"removeStream"in t.RTCPeerConnection.prototype||(t.RTCPeerConnection.prototype.removeStream=function(t){var n=this;e.deprecated("removeStream","removeTrack"),this.getSenders().forEach(function(e){e.track&&t.getTracks().includes(e.track)&&n.removeTrack(e)})})}function d(e){e.DataChannel&&!e.RTCDataChannel&&(e.RTCDataChannel=e.DataChannel)}function C(e){if("object"===a(e)&&e.RTCPeerConnection){var t=e.RTCPeerConnection.prototype.addTransceiver;t&&(e.RTCPeerConnection.prototype.addTransceiver=function(){this.setParametersPromises=[];var e=arguments[1],n=e&&"sendEncodings"in e;n&&e.sendEncodings.forEach(function(e){if("rid"in e){if(!/^[a-z0-9]{0,16}$/i.test(e.rid))throw new TypeError("Invalid RID value provided.")}if("scaleResolutionDownBy"in e&&!(parseFloat(e.scaleResolutionDownBy)>=1))throw new RangeError("scale_resolution_down_by must be >= 1.0");if("maxFramerate"in e&&!(parseFloat(e.maxFramerate)>=0))throw new RangeError("max_framerate must be >= 0.0")});var r=t.apply(this,arguments);if(n){var{sender:o}=r,i=o.getParameters();"encodings"in i&&(1!==i.encodings.length||0!==Object.keys(i.encodings[0]).length)||(i.encodings=e.sendEncodings,o.sendEncodings=e.sendEncodings,this.setParametersPromises.push(o.setParameters(i).then(function(){delete o.sendEncodings}).catch(function(){delete o.sendEncodings})))}return r})}}function y(e){if("object"===a(e)&&e.RTCRtpSender){var t=e.RTCRtpSender.prototype.getParameters;t&&(e.RTCRtpSender.prototype.getParameters=function(){var e=t.apply(this,arguments);return"encodings"in e||(e.encodings=[].concat(this.sendEncodings||[{}])),e})}}function l(e){if("object"===a(e)&&e.RTCPeerConnection){var t=e.RTCPeerConnection.prototype.createOffer;e.RTCPeerConnection.prototype.createOffer=function(){var e=arguments,n=this;return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(function(){return t.apply(n,e)}).finally(function(){n.setParametersPromises=[]}):t.apply(this,arguments)}}}function m(e){if("object"===a(e)&&e.RTCPeerConnection){var t=e.RTCPeerConnection.prototype.createAnswer;e.RTCPeerConnection.prototype.createAnswer=function(){var e=arguments,n=this;return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(function(){return t.apply(n,e)}).finally(function(){n.setParametersPromises=[]}):t.apply(this,arguments)}}}
},{"../utils":"iSxC","./getusermedia":"GzSv","./getdisplaymedia":"UuGU"}],"t1lL":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimLocalStreamsAPI=n,exports.shimRemoteStreamsAPI=i,exports.shimCallbacksAPI=a,exports.shimGetUserMedia=c,exports.shimConstraints=s,exports.shimRTCIceServerUrls=d,exports.shimTrackEventTransceiver=f,exports.shimCreateOfferLegacy=p,exports.shimAudioContext=u;var e=r(require("../utils"));function t(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return t=function(){return e},e}function r(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=t();if(r&&r.has(e))return r.get(e);var o={},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var a=n?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(o,i,a):o[i]=e[i]}return o.default=e,r&&r.set(e,o),o}function o(e){return(o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function n(e){if("object"===o(e)&&e.RTCPeerConnection){if("getLocalStreams"in e.RTCPeerConnection.prototype||(e.RTCPeerConnection.prototype.getLocalStreams=function(){return this._localStreams||(this._localStreams=[]),this._localStreams}),!("addStream"in e.RTCPeerConnection.prototype)){var t=e.RTCPeerConnection.prototype.addTrack;e.RTCPeerConnection.prototype.addStream=function(e){var r=this;this._localStreams||(this._localStreams=[]),this._localStreams.includes(e)||this._localStreams.push(e),e.getAudioTracks().forEach(function(o){return t.call(r,o,e)}),e.getVideoTracks().forEach(function(o){return t.call(r,o,e)})},e.RTCPeerConnection.prototype.addTrack=function(e){for(var r=this,o=arguments.length,n=new Array(o>1?o-1:0),i=1;i<o;i++)n[i-1]=arguments[i];return n&&n.forEach(function(e){r._localStreams?r._localStreams.includes(e)||r._localStreams.push(e):r._localStreams=[e]}),t.apply(this,arguments)}}"removeStream"in e.RTCPeerConnection.prototype||(e.RTCPeerConnection.prototype.removeStream=function(e){var t=this;this._localStreams||(this._localStreams=[]);var r=this._localStreams.indexOf(e);if(-1!==r){this._localStreams.splice(r,1);var o=e.getTracks();this.getSenders().forEach(function(e){o.includes(e.track)&&t.removeTrack(e)})}})}}function i(e){if("object"===o(e)&&e.RTCPeerConnection&&("getRemoteStreams"in e.RTCPeerConnection.prototype||(e.RTCPeerConnection.prototype.getRemoteStreams=function(){return this._remoteStreams?this._remoteStreams:[]}),!("onaddstream"in e.RTCPeerConnection.prototype))){Object.defineProperty(e.RTCPeerConnection.prototype,"onaddstream",{get:function(){return this._onaddstream},set:function(e){var t=this;this._onaddstream&&(this.removeEventListener("addstream",this._onaddstream),this.removeEventListener("track",this._onaddstreampoly)),this.addEventListener("addstream",this._onaddstream=e),this.addEventListener("track",this._onaddstreampoly=function(e){e.streams.forEach(function(e){if(t._remoteStreams||(t._remoteStreams=[]),!t._remoteStreams.includes(e)){t._remoteStreams.push(e);var r=new Event("addstream");r.stream=e,t.dispatchEvent(r)}})})}});var t=e.RTCPeerConnection.prototype.setRemoteDescription;e.RTCPeerConnection.prototype.setRemoteDescription=function(){var e=this;return this._onaddstreampoly||this.addEventListener("track",this._onaddstreampoly=function(t){t.streams.forEach(function(t){if(e._remoteStreams||(e._remoteStreams=[]),!(e._remoteStreams.indexOf(t)>=0)){e._remoteStreams.push(t);var r=new Event("addstream");r.stream=t,e.dispatchEvent(r)}})}),t.apply(e,arguments)}}}function a(e){if("object"===o(e)&&e.RTCPeerConnection){var t=e.RTCPeerConnection.prototype,r=t.createOffer,n=t.createAnswer,i=t.setLocalDescription,a=t.setRemoteDescription,c=t.addIceCandidate;t.createOffer=function(e,t){var o=arguments.length>=2?arguments[2]:arguments[0],n=r.apply(this,[o]);return t?(n.then(e,t),Promise.resolve()):n},t.createAnswer=function(e,t){var r=arguments.length>=2?arguments[2]:arguments[0],o=n.apply(this,[r]);return t?(o.then(e,t),Promise.resolve()):o};var s=function(e,t,r){var o=i.apply(this,[e]);return r?(o.then(t,r),Promise.resolve()):o};t.setLocalDescription=s,s=function(e,t,r){var o=a.apply(this,[e]);return r?(o.then(t,r),Promise.resolve()):o},t.setRemoteDescription=s,s=function(e,t,r){var o=c.apply(this,[e]);return r?(o.then(t,r),Promise.resolve()):o},t.addIceCandidate=s}}function c(e){var t=e&&e.navigator;if(t.mediaDevices&&t.mediaDevices.getUserMedia){var r=t.mediaDevices,o=r.getUserMedia.bind(r);t.mediaDevices.getUserMedia=function(e){return o(s(e))}}!t.getUserMedia&&t.mediaDevices&&t.mediaDevices.getUserMedia&&(t.getUserMedia=function(e,r,o){t.mediaDevices.getUserMedia(e).then(r,o)}.bind(t))}function s(t){return t&&void 0!==t.video?Object.assign({},t,{video:e.compactObject(t.video)}):t}function d(t){if(t.RTCPeerConnection){var r=t.RTCPeerConnection;t.RTCPeerConnection=function(t,o){if(t&&t.iceServers){for(var n=[],i=0;i<t.iceServers.length;i++){var a=t.iceServers[i];!a.hasOwnProperty("urls")&&a.hasOwnProperty("url")?(e.deprecated("RTCIceServer.url","RTCIceServer.urls"),(a=JSON.parse(JSON.stringify(a))).urls=a.url,delete a.url,n.push(a)):n.push(t.iceServers[i])}t.iceServers=n}return new r(t,o)},t.RTCPeerConnection.prototype=r.prototype,"generateCertificate"in r&&Object.defineProperty(t.RTCPeerConnection,"generateCertificate",{get:function(){return r.generateCertificate}})}}function f(e){"object"===o(e)&&e.RTCTrackEvent&&"receiver"in e.RTCTrackEvent.prototype&&!("transceiver"in e.RTCTrackEvent.prototype)&&Object.defineProperty(e.RTCTrackEvent.prototype,"transceiver",{get:function(){return{receiver:this.receiver}}})}function p(e){var t=e.RTCPeerConnection.prototype.createOffer;e.RTCPeerConnection.prototype.createOffer=function(e){if(e){void 0!==e.offerToReceiveAudio&&(e.offerToReceiveAudio=!!e.offerToReceiveAudio);var r=this.getTransceivers().find(function(e){return"audio"===e.receiver.track.kind});!1===e.offerToReceiveAudio&&r?"sendrecv"===r.direction?r.setDirection?r.setDirection("sendonly"):r.direction="sendonly":"recvonly"===r.direction&&(r.setDirection?r.setDirection("inactive"):r.direction="inactive"):!0!==e.offerToReceiveAudio||r||this.addTransceiver("audio"),void 0!==e.offerToReceiveVideo&&(e.offerToReceiveVideo=!!e.offerToReceiveVideo);var o=this.getTransceivers().find(function(e){return"video"===e.receiver.track.kind});!1===e.offerToReceiveVideo&&o?"sendrecv"===o.direction?o.setDirection?o.setDirection("sendonly"):o.direction="sendonly":"recvonly"===o.direction&&(o.setDirection?o.setDirection("inactive"):o.direction="inactive"):!0!==e.offerToReceiveVideo||o||this.addTransceiver("video")}return t.apply(this,arguments)}}function u(e){"object"!==o(e)||e.AudioContext||(e.AudioContext=e.webkitAudioContext)}
},{"../utils":"iSxC"}],"GOQK":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.shimRTCIceCandidate=a,exports.shimMaxMessageSize=c,exports.shimSendThrowTypeError=s,exports.shimConnectionState=p,exports.removeExtmapAllowMixed=d,exports.shimAddIceCandidateNullOrEmpty=u;var e=r(require("sdp")),t=o(require("./utils"));function n(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return n=function(){return e},e}function o(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var t=n();if(t&&t.has(e))return t.get(e);var o={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){var a=r?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(o,i,a):o[i]=e[i]}return o.default=e,t&&t.set(e,o),o}function r(e){return e&&e.__esModule?e:{default:e}}function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function a(n){if(n.RTCIceCandidate&&!(n.RTCIceCandidate&&"foundation"in n.RTCIceCandidate.prototype)){var o=n.RTCIceCandidate;n.RTCIceCandidate=function(t){if("object"===i(t)&&t.candidate&&0===t.candidate.indexOf("a=")&&((t=JSON.parse(JSON.stringify(t))).candidate=t.candidate.substr(2)),t.candidate&&t.candidate.length){var n=new o(t),r=e.default.parseCandidate(t.candidate),a=Object.assign(n,r);return a.toJSON=function(){return{candidate:a.candidate,sdpMid:a.sdpMid,sdpMLineIndex:a.sdpMLineIndex,usernameFragment:a.usernameFragment}},a}return new o(t)},n.RTCIceCandidate.prototype=o.prototype,t.wrapPeerConnectionEvent(n,"icecandidate",function(e){return e.candidate&&Object.defineProperty(e,"candidate",{value:new n.RTCIceCandidate(e.candidate),writable:"false"}),e})}}function c(t,n){if(t.RTCPeerConnection){"sctp"in t.RTCPeerConnection.prototype||Object.defineProperty(t.RTCPeerConnection.prototype,"sctp",{get:function(){return void 0===this._sctp?null:this._sctp}});var o=t.RTCPeerConnection.prototype.setRemoteDescription;t.RTCPeerConnection.prototype.setRemoteDescription=function(){if(this._sctp=null,"chrome"===n.browser&&n.version>=76){var{sdpSemantics:t}=this.getConfiguration();"plan-b"===t&&Object.defineProperty(this,"sctp",{get:function(){return void 0===this._sctp?null:this._sctp},enumerable:!0,configurable:!0})}if(function(t){if(!t||!t.sdp)return!1;var n=e.default.splitSections(t.sdp);return n.shift(),n.some(function(t){var n=e.default.parseMLine(t);return n&&"application"===n.kind&&-1!==n.protocol.indexOf("SCTP")})}(arguments[0])){var r,i=function(e){var t=e.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);if(null===t||t.length<2)return-1;var n=parseInt(t[1],10);return n!=n?-1:n}(arguments[0]),a=(p=i,d=65536,"firefox"===n.browser&&(d=n.version<57?-1===p?16384:2147483637:n.version<60?57===n.version?65535:65536:2147483637),d),c=function(t,o){var r=65536;"firefox"===n.browser&&57===n.version&&(r=65535);var i=e.default.matchPrefix(t.sdp,"a=max-message-size:");return i.length>0?r=parseInt(i[0].substr(19),10):"firefox"===n.browser&&-1!==o&&(r=2147483637),r}(arguments[0],i);r=0===a&&0===c?Number.POSITIVE_INFINITY:0===a||0===c?Math.max(a,c):Math.min(a,c);var s={};Object.defineProperty(s,"maxMessageSize",{get:function(){return r}}),this._sctp=s}var p,d;return o.apply(this,arguments)}}}function s(e){if(e.RTCPeerConnection&&"createDataChannel"in e.RTCPeerConnection.prototype){var n=e.RTCPeerConnection.prototype.createDataChannel;e.RTCPeerConnection.prototype.createDataChannel=function(){var e=n.apply(this,arguments);return o(e,this),e},t.wrapPeerConnectionEvent(e,"datachannel",function(e){return o(e.channel,e.target),e})}function o(e,t){var n=e.send;e.send=function(){var o=arguments[0],r=o.length||o.size||o.byteLength;if("open"===e.readyState&&t.sctp&&r>t.sctp.maxMessageSize)throw new TypeError("Message too large (can send a maximum of "+t.sctp.maxMessageSize+" bytes)");return n.apply(e,arguments)}}}function p(e){if(e.RTCPeerConnection&&!("connectionState"in e.RTCPeerConnection.prototype)){var t=e.RTCPeerConnection.prototype;Object.defineProperty(t,"connectionState",{get:function(){return{completed:"connected",checking:"connecting"}[this.iceConnectionState]||this.iceConnectionState},enumerable:!0,configurable:!0}),Object.defineProperty(t,"onconnectionstatechange",{get:function(){return this._onconnectionstatechange||null},set:function(e){this._onconnectionstatechange&&(this.removeEventListener("connectionstatechange",this._onconnectionstatechange),delete this._onconnectionstatechange),e&&this.addEventListener("connectionstatechange",this._onconnectionstatechange=e)},enumerable:!0,configurable:!0}),["setLocalDescription","setRemoteDescription"].forEach(function(e){var n=t[e];t[e]=function(){return this._connectionstatechangepoly||(this._connectionstatechangepoly=function(e){var t=e.target;if(t._lastConnectionState!==t.connectionState){t._lastConnectionState=t.connectionState;var n=new Event("connectionstatechange",e);t.dispatchEvent(n)}return e},this.addEventListener("iceconnectionstatechange",this._connectionstatechangepoly)),n.apply(this,arguments)}})}}function d(e,t){if(e.RTCPeerConnection&&!("chrome"===t.browser&&t.version>=71||"safari"===t.browser&&t.version>=605)){var n=e.RTCPeerConnection.prototype.setRemoteDescription;e.RTCPeerConnection.prototype.setRemoteDescription=function(t){if(t&&t.sdp&&-1!==t.sdp.indexOf("\na=extmap-allow-mixed")){var o=t.sdp.split("\n").filter(function(e){return"a=extmap-allow-mixed"!==e.trim()}).join("\n");e.RTCSessionDescription&&t instanceof e.RTCSessionDescription?arguments[0]=new e.RTCSessionDescription({type:t.type,sdp:o}):t.sdp=o}return n.apply(this,arguments)}}}function u(e,t){if(e.RTCPeerConnection&&e.RTCPeerConnection.prototype){var n=e.RTCPeerConnection.prototype.addIceCandidate;n&&0!==n.length&&(e.RTCPeerConnection.prototype.addIceCandidate=function(){return arguments[0]?("chrome"===t.browser&&t.version<78||"firefox"===t.browser&&t.version<68||"safari"===t.browser)&&arguments[0]&&""===arguments[0].candidate?Promise.resolve():n.apply(this,arguments):(arguments[1]&&arguments[1].apply(null),Promise.resolve())})}}
},{"sdp":"YHvh","./utils":"iSxC"}],"KtlG":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.adapterFactory=o;var e=m(require("./utils")),i=m(require("./chrome/chrome_shim")),r=m(require("./edge/edge_shim")),s=m(require("./firefox/firefox_shim")),t=m(require("./safari/safari_shim")),a=m(require("./common_shim"));function n(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return n=function(){return e},e}function m(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var i=n();if(i&&i.has(e))return i.get(e);var r={},s=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var t in e)if(Object.prototype.hasOwnProperty.call(e,t)){var a=s?Object.getOwnPropertyDescriptor(e,t):null;a&&(a.get||a.set)?Object.defineProperty(r,t,a):r[t]=e[t]}return r.default=e,i&&i.set(e,r),r}function o(){var{window:n}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},m=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{shimChrome:!0,shimFirefox:!0,shimEdge:!0,shimSafari:!0},o=e.log,h=e.detectBrowser(n),d={browserDetails:h,commonShim:a,extractVersion:e.extractVersion,disableLog:e.disableLog,disableWarnings:e.disableWarnings};switch(h.browser){case"chrome":if(!i||!i.shimPeerConnection||!m.shimChrome)return o("Chrome shim is not included in this adapter release."),d;if(null===h.version)return o("Chrome shim can not determine version, not shimming."),d;o("adapter.js shimming chrome."),d.browserShim=i,a.shimAddIceCandidateNullOrEmpty(n,h),i.shimGetUserMedia(n,h),i.shimMediaStream(n,h),i.shimPeerConnection(n,h),i.shimOnTrack(n,h),i.shimAddTrackRemoveTrack(n,h),i.shimGetSendersWithDtmf(n,h),i.shimGetStats(n,h),i.shimSenderReceiverGetStats(n,h),i.fixNegotiationNeeded(n,h),a.shimRTCIceCandidate(n,h),a.shimConnectionState(n,h),a.shimMaxMessageSize(n,h),a.shimSendThrowTypeError(n,h),a.removeExtmapAllowMixed(n,h);break;case"firefox":if(!s||!s.shimPeerConnection||!m.shimFirefox)return o("Firefox shim is not included in this adapter release."),d;o("adapter.js shimming firefox."),d.browserShim=s,a.shimAddIceCandidateNullOrEmpty(n,h),s.shimGetUserMedia(n,h),s.shimPeerConnection(n,h),s.shimOnTrack(n,h),s.shimRemoveStream(n,h),s.shimSenderGetStats(n,h),s.shimReceiverGetStats(n,h),s.shimRTCDataChannel(n,h),s.shimAddTransceiver(n,h),s.shimGetParameters(n,h),s.shimCreateOffer(n,h),s.shimCreateAnswer(n,h),a.shimRTCIceCandidate(n,h),a.shimConnectionState(n,h),a.shimMaxMessageSize(n,h),a.shimSendThrowTypeError(n,h);break;case"edge":if(!r||!r.shimPeerConnection||!m.shimEdge)return o("MS edge shim is not included in this adapter release."),d;o("adapter.js shimming edge."),d.browserShim=r,r.shimGetUserMedia(n,h),r.shimGetDisplayMedia(n,h),r.shimPeerConnection(n,h),r.shimReplaceTrack(n,h),a.shimMaxMessageSize(n,h),a.shimSendThrowTypeError(n,h);break;case"safari":if(!t||!m.shimSafari)return o("Safari shim is not included in this adapter release."),d;o("adapter.js shimming safari."),d.browserShim=t,a.shimAddIceCandidateNullOrEmpty(n,h),t.shimRTCIceServerUrls(n,h),t.shimCreateOfferLegacy(n,h),t.shimCallbacksAPI(n,h),t.shimLocalStreamsAPI(n,h),t.shimRemoteStreamsAPI(n,h),t.shimTrackEventTransceiver(n,h),t.shimGetUserMedia(n,h),t.shimAudioContext(n,h),a.shimRTCIceCandidate(n,h),a.shimMaxMessageSize(n,h),a.shimSendThrowTypeError(n,h),a.removeExtmapAllowMixed(n,h);break;default:o("Unsupported browser!")}return d}
},{"./utils":"iSxC","./chrome/chrome_shim":"uI5X","./edge/edge_shim":"XRic","./firefox/firefox_shim":"Fzdr","./safari/safari_shim":"t1lL","./common_shim":"GOQK"}],"tI1X":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=require("./adapter_factory.js"),t=(0,e.adapterFactory)({window:"undefined"==typeof window?void 0:window}),d=t;exports.default=d;
},{"./adapter_factory.js":"KtlG"}],"sXtV":[function(require,module,exports) {
"use strict";var e=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.webRTCAdapter=void 0;var t=e(require("webrtc-adapter"));exports.webRTCAdapter=t.default;
},{"webrtc-adapter":"tI1X"}],"I31f":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Supports=void 0;var r=require("./adapter");exports.Supports=new(function(){function e(){this.isIOS=["iPad","iPhone","iPod"].includes(navigator.platform),this.supportedBrowsers=["firefox","chrome","safari"],this.minFirefoxVersion=59,this.minChromeVersion=72,this.minSafariVersion=605}return e.prototype.isWebRTCSupported=function(){return"undefined"!=typeof RTCPeerConnection},e.prototype.isBrowserSupported=function(){var r=this.getBrowser(),e=this.getVersion();return!!this.supportedBrowsers.includes(r)&&("chrome"===r?e>=this.minChromeVersion:"firefox"===r?e>=this.minFirefoxVersion:"safari"===r&&(!this.isIOS&&e>=this.minSafariVersion))},e.prototype.getBrowser=function(){return r.webRTCAdapter.browserDetails.browser},e.prototype.getVersion=function(){return r.webRTCAdapter.browserDetails.version||0},e.prototype.isUnifiedPlanSupported=function(){var e,i=this.getBrowser(),t=r.webRTCAdapter.browserDetails.version||0;if("chrome"===i&&t<72)return!1;if("firefox"===i&&t>=59)return!0;if(!(window.RTCRtpTransceiver&&"currentDirection"in RTCRtpTransceiver.prototype))return!1;var o=!1;try{(e=new RTCPeerConnection).addTransceiver("audio"),o=!0}catch(s){}finally{e&&e.close()}return o},e.prototype.toString=function(){return"Supports: \n    browser:"+this.getBrowser()+" \n    version:"+this.getVersion()+" \n    isIOS:"+this.isIOS+" \n    isWebRTCSupported:"+this.isWebRTCSupported()+" \n    isBrowserSupported:"+this.isBrowserSupported()+" \n    isUnifiedPlanSupported:"+this.isUnifiedPlanSupported()},e}());
},{"./adapter":"sXtV"}],"BHXf":[function(require,module,exports) {
"use strict";var e=this&&this.__createBinding||(Object.create?function(e,t,r,o){void 0===o&&(o=r),Object.defineProperty(e,o,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,o){void 0===o&&(o=r),e[o]=t[r]}),t=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),r=this&&this.__importStar||function(r){if(r&&r.__esModule)return r;var o={};if(null!=r)for(var n in r)"default"!==n&&Object.prototype.hasOwnProperty.call(r,n)&&e(o,r,n);return t(o,r),o};Object.defineProperty(exports,"__esModule",{value:!0}),exports.util=void 0;var o=r(require("peerjs-js-binarypack")),n=require("./supports"),i={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"turn:0.peerjs.com:3478",username:"peerjs",credential:"peerjsp"}],sdpSemantics:"unified-plan"};exports.util=new(function(){function e(){this.CLOUD_HOST="0.peerjs.com",this.CLOUD_PORT=443,this.chunkedBrowsers={Chrome:1,chrome:1},this.chunkedMTU=16300,this.defaultConfig=i,this.browser=n.Supports.getBrowser(),this.browserVersion=n.Supports.getVersion(),this.supports=function(){var e,t={browser:n.Supports.isBrowserSupported(),webRTC:n.Supports.isWebRTCSupported(),audioVideo:!1,data:!1,binaryBlob:!1,reliable:!1};if(!t.webRTC)return t;try{e=new RTCPeerConnection(i),t.audioVideo=!0;var r=void 0;try{r=e.createDataChannel("_PEERJSTEST",{ordered:!0}),t.data=!0,t.reliable=!!r.ordered;try{r.binaryType="blob",t.binaryBlob=!n.Supports.isIOS}catch(o){}}catch(o){}finally{r&&r.close()}}catch(o){}finally{e&&e.close()}return t}(),this.pack=o.pack,this.unpack=o.unpack,this._dataCount=1}return e.prototype.noop=function(){},e.prototype.validateId=function(e){return!e||/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(e)},e.prototype.chunk=function(e){for(var t=[],r=e.size,o=Math.ceil(r/exports.util.chunkedMTU),n=0,i=0;i<r;){var a=Math.min(r,i+exports.util.chunkedMTU),u=e.slice(i,a),s={__peerData:this._dataCount,n:n,data:u,total:o};t.push(s),i=a,n++}return this._dataCount++,t},e.prototype.blobToArrayBuffer=function(e,t){var r=new FileReader;return r.onload=function(e){e.target&&t(e.target.result)},r.readAsArrayBuffer(e),r},e.prototype.binaryStringToArrayBuffer=function(e){for(var t=new Uint8Array(e.length),r=0;r<e.length;r++)t[r]=255&e.charCodeAt(r);return t.buffer},e.prototype.randomToken=function(){return Math.random().toString(36).substr(2)},e.prototype.isSecure=function(){return"https:"===location.protocol},e}());
},{"peerjs-js-binarypack":"kdPp","./supports":"I31f"}],"JJlS":[function(require,module,exports) {
"use strict";var e=Object.prototype.hasOwnProperty,t="~";function n(){}function r(e,t,n){this.fn=e,this.context=t,this.once=n||!1}function o(e,n,o,s,i){if("function"!=typeof o)throw new TypeError("The listener must be a function");var c=new r(o,s||e,i),f=t?t+n:n;return e._events[f]?e._events[f].fn?e._events[f]=[e._events[f],c]:e._events[f].push(c):(e._events[f]=c,e._eventsCount++),e}function s(e,t){0==--e._eventsCount?e._events=new n:delete e._events[t]}function i(){this._events=new n,this._eventsCount=0}Object.create&&(n.prototype=Object.create(null),(new n).__proto__||(t=!1)),i.prototype.eventNames=function(){var n,r,o=[];if(0===this._eventsCount)return o;for(r in n=this._events)e.call(n,r)&&o.push(t?r.slice(1):r);return Object.getOwnPropertySymbols?o.concat(Object.getOwnPropertySymbols(n)):o},i.prototype.listeners=function(e){var n=t?t+e:e,r=this._events[n];if(!r)return[];if(r.fn)return[r.fn];for(var o=0,s=r.length,i=new Array(s);o<s;o++)i[o]=r[o].fn;return i},i.prototype.listenerCount=function(e){var n=t?t+e:e,r=this._events[n];return r?r.fn?1:r.length:0},i.prototype.emit=function(e,n,r,o,s,i){var c=t?t+e:e;if(!this._events[c])return!1;var f,u,a=this._events[c],l=arguments.length;if(a.fn){switch(a.once&&this.removeListener(e,a.fn,void 0,!0),l){case 1:return a.fn.call(a.context),!0;case 2:return a.fn.call(a.context,n),!0;case 3:return a.fn.call(a.context,n,r),!0;case 4:return a.fn.call(a.context,n,r,o),!0;case 5:return a.fn.call(a.context,n,r,o,s),!0;case 6:return a.fn.call(a.context,n,r,o,s,i),!0}for(u=1,f=new Array(l-1);u<l;u++)f[u-1]=arguments[u];a.fn.apply(a.context,f)}else{var v,h=a.length;for(u=0;u<h;u++)switch(a[u].once&&this.removeListener(e,a[u].fn,void 0,!0),l){case 1:a[u].fn.call(a[u].context);break;case 2:a[u].fn.call(a[u].context,n);break;case 3:a[u].fn.call(a[u].context,n,r);break;case 4:a[u].fn.call(a[u].context,n,r,o);break;default:if(!f)for(v=1,f=new Array(l-1);v<l;v++)f[v-1]=arguments[v];a[u].fn.apply(a[u].context,f)}}return!0},i.prototype.on=function(e,t,n){return o(this,e,t,n,!1)},i.prototype.once=function(e,t,n){return o(this,e,t,n,!0)},i.prototype.removeListener=function(e,n,r,o){var i=t?t+e:e;if(!this._events[i])return this;if(!n)return s(this,i),this;var c=this._events[i];if(c.fn)c.fn!==n||o&&!c.once||r&&c.context!==r||s(this,i);else{for(var f=0,u=[],a=c.length;f<a;f++)(c[f].fn!==n||o&&!c[f].once||r&&c[f].context!==r)&&u.push(c[f]);u.length?this._events[i]=1===u.length?u[0]:u:s(this,i)}return this},i.prototype.removeAllListeners=function(e){var r;return e?(r=t?t+e:e,this._events[r]&&s(this,r)):(this._events=new n,this._eventsCount=0),this},i.prototype.off=i.prototype.removeListener,i.prototype.addListener=i.prototype.on,i.prefixed=t,i.EventEmitter=i,"undefined"!=typeof module&&(module.exports=i);
},{}],"WOs9":[function(require,module,exports) {
"use strict";var r=this&&this.__read||function(r,e){var o="function"==typeof Symbol&&r[Symbol.iterator];if(!o)return r;var t,n,l=o.call(r),i=[];try{for(;(void 0===e||e-- >0)&&!(t=l.next()).done;)i.push(t.value)}catch(s){n={error:s}}finally{try{t&&!t.done&&(o=l.return)&&o.call(l)}finally{if(n)throw n.error}}return i},e=this&&this.__spreadArray||function(r,e){for(var o=0,t=e.length,n=r.length;o<t;o++,n++)r[n]=e[o];return r};Object.defineProperty(exports,"__esModule",{value:!0}),exports.LogLevel=void 0;var o,t="PeerJS: ";!function(r){r[r.Disabled=0]="Disabled",r[r.Errors=1]="Errors",r[r.Warnings=2]="Warnings",r[r.All=3]="All"}(o=exports.LogLevel||(exports.LogLevel={}));var n=function(){function n(){this._logLevel=o.Disabled}return Object.defineProperty(n.prototype,"logLevel",{get:function(){return this._logLevel},set:function(r){this._logLevel=r},enumerable:!1,configurable:!0}),n.prototype.log=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];this._logLevel>=o.All&&this._print.apply(this,e([o.All],r(t)))},n.prototype.warn=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];this._logLevel>=o.Warnings&&this._print.apply(this,e([o.Warnings],r(t)))},n.prototype.error=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];this._logLevel>=o.Errors&&this._print.apply(this,e([o.Errors],r(t)))},n.prototype.setLogFunction=function(r){this._print=r},n.prototype._print=function(n){for(var l=[],i=1;i<arguments.length;i++)l[i-1]=arguments[i];var s=e([t],r(l));for(var a in s)s[a]instanceof Error&&(s[a]="("+s[a].name+") "+s[a].message);n>=o.All?console.log.apply(console,e([],r(s))):n>=o.Warnings?console.warn.apply(console,e(["WARNING"],r(s))):n>=o.Errors&&console.error.apply(console,e(["ERROR"],r(s)))},n}();exports.default=new n;
},{}],"ZRYf":[function(require,module,exports) {
"use strict";var e,r,o,n,t,a,i;Object.defineProperty(exports,"__esModule",{value:!0}),exports.ServerMessageType=exports.SocketEventType=exports.SerializationType=exports.PeerErrorType=exports.PeerEventType=exports.ConnectionType=exports.ConnectionEventType=void 0,function(e){e.Open="open",e.Stream="stream",e.Data="data",e.Close="close",e.Error="error",e.IceStateChanged="iceStateChanged"}(e=exports.ConnectionEventType||(exports.ConnectionEventType={})),function(e){e.Data="data",e.Media="media"}(r=exports.ConnectionType||(exports.ConnectionType={})),function(e){e.Open="open",e.Close="close",e.Connection="connection",e.Call="call",e.Disconnected="disconnected",e.Error="error"}(o=exports.PeerEventType||(exports.PeerEventType={})),function(e){e.BrowserIncompatible="browser-incompatible",e.Disconnected="disconnected",e.InvalidID="invalid-id",e.InvalidKey="invalid-key",e.Network="network",e.PeerUnavailable="peer-unavailable",e.SslUnavailable="ssl-unavailable",e.ServerError="server-error",e.SocketError="socket-error",e.SocketClosed="socket-closed",e.UnavailableID="unavailable-id",e.WebRTC="webrtc"}(n=exports.PeerErrorType||(exports.PeerErrorType={})),function(e){e.Binary="binary",e.BinaryUTF8="binary-utf8",e.JSON="json"}(t=exports.SerializationType||(exports.SerializationType={})),function(e){e.Message="message",e.Disconnected="disconnected",e.Error="error",e.Close="close"}(a=exports.SocketEventType||(exports.SocketEventType={})),function(e){e.Heartbeat="HEARTBEAT",e.Candidate="CANDIDATE",e.Offer="OFFER",e.Answer="ANSWER",e.Open="OPEN",e.Error="ERROR",e.IdTaken="ID-TAKEN",e.InvalidKey="INVALID-KEY",e.Leave="LEAVE",e.Expire="EXPIRE"}(i=exports.ServerMessageType||(exports.ServerMessageType={}));
},{}],"wJlv":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(t,n)};return function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function o(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(o.prototype=n.prototype,new o)}}(),t=this&&this.__read||function(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var o,s,r=n.call(e),i=[];try{for(;(void 0===t||t-- >0)&&!(o=r.next()).done;)i.push(o.value)}catch(c){s={error:c}}finally{try{o&&!o.done&&(n=r.return)&&n.call(r)}finally{if(s)throw s.error}}return i},n=this&&this.__spreadArray||function(e,t){for(var n=0,o=t.length,s=e.length;n<o;n++,s++)e[s]=t[n];return e},o=this&&this.__values||function(e){var t="function"==typeof Symbol&&Symbol.iterator,n=t&&e[t],o=0;if(n)return n.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&o>=e.length&&(e=void 0),{value:e&&e[o++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},s=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Socket=void 0;var r=require("eventemitter3"),i=s(require("./logger")),c=require("./enums"),a=function(s){function r(e,t,n,o,r,i){void 0===i&&(i=5e3);var c=s.call(this)||this;c.pingInterval=i,c._disconnected=!0,c._messagesQueue=[];var a=e?"wss://":"ws://";return c._baseUrl=a+t+":"+n+o+"peerjs?key="+r,c}return e(r,s),r.prototype.start=function(e,t){var n=this;this._id=e;var o=this._baseUrl+"&id="+e+"&token="+t;!this._socket&&this._disconnected&&(this._socket=new WebSocket(o),this._disconnected=!1,this._socket.onmessage=function(e){var t;try{t=JSON.parse(e.data),i.default.log("Server message received:",t)}catch(o){return void i.default.log("Invalid server message",e.data)}n.emit(c.SocketEventType.Message,t)},this._socket.onclose=function(e){n._disconnected||(i.default.log("Socket closed.",e),n._cleanup(),n._disconnected=!0,n.emit(c.SocketEventType.Disconnected))},this._socket.onopen=function(){n._disconnected||(n._sendQueuedMessages(),i.default.log("Socket open"),n._scheduleHeartbeat())})},r.prototype._scheduleHeartbeat=function(){var e=this;this._wsPingTimer=setTimeout(function(){e._sendHeartbeat()},this.pingInterval)},r.prototype._sendHeartbeat=function(){if(this._wsOpen()){var e=JSON.stringify({type:c.ServerMessageType.Heartbeat});this._socket.send(e),this._scheduleHeartbeat()}else i.default.log("Cannot send heartbeat, because socket closed")},r.prototype._wsOpen=function(){return!!this._socket&&1===this._socket.readyState},r.prototype._sendQueuedMessages=function(){var e,s,r=n([],t(this._messagesQueue));this._messagesQueue=[];try{for(var i=o(r),c=i.next();!c.done;c=i.next()){var a=c.value;this.send(a)}}catch(u){e={error:u}}finally{try{c&&!c.done&&(s=i.return)&&s.call(i)}finally{if(e)throw e.error}}},r.prototype.send=function(e){if(!this._disconnected)if(this._id)if(e.type){if(this._wsOpen()){var t=JSON.stringify(e);this._socket.send(t)}}else this.emit(c.SocketEventType.Error,"Invalid message");else this._messagesQueue.push(e)},r.prototype.close=function(){this._disconnected||(this._cleanup(),this._disconnected=!0)},r.prototype._cleanup=function(){this._socket&&(this._socket.onopen=this._socket.onmessage=this._socket.onclose=null,this._socket.close(),this._socket=void 0),clearTimeout(this._wsPingTimer)},r}(r.EventEmitter);exports.Socket=a;
},{"eventemitter3":"JJlS","./logger":"WOs9","./enums":"ZRYf"}],"HCdX":[function(require,module,exports) {
"use strict";var e=this&&this.__assign||function(){return(e=Object.assign||function(e){for(var n,t=1,o=arguments.length;t<o;t++)for(var i in n=arguments[t])Object.prototype.hasOwnProperty.call(n,i)&&(e[i]=n[i]);return e}).apply(this,arguments)},n=this&&this.__awaiter||function(e,n,t,o){return new(t||(t=Promise))(function(i,r){function c(e){try{s(o.next(e))}catch(n){r(n)}}function a(e){try{s(o.throw(e))}catch(n){r(n)}}function s(e){var n;e.done?i(e.value):(n=e.value,n instanceof t?n:new t(function(e){e(n)})).then(c,a)}s((o=o.apply(e,n||[])).next())})},t=this&&this.__generator||function(e,n){var t,o,i,r,c={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return r={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(r[Symbol.iterator]=function(){return this}),r;function a(r){return function(a){return function(r){if(t)throw new TypeError("Generator is already executing.");for(;c;)try{if(t=1,o&&(i=2&r[0]?o.return:r[0]?o.throw||((i=o.return)&&i.call(o),0):o.next)&&!(i=i.call(o,r[1])).done)return i;switch(o=0,i&&(r=[2&r[0],i.value]),r[0]){case 0:case 1:i=r;break;case 4:return c.label++,{value:r[1],done:!1};case 5:c.label++,o=r[1],r=[0];continue;case 7:r=c.ops.pop(),c.trys.pop();continue;default:if(!(i=(i=c.trys).length>0&&i[i.length-1])&&(6===r[0]||2===r[0])){c=0;continue}if(3===r[0]&&(!i||r[1]>i[0]&&r[1]<i[3])){c.label=r[1];break}if(6===r[0]&&c.label<i[1]){c.label=i[1],i=r;break}if(i&&c.label<i[2]){c.label=i[2],c.ops.push(r);break}i[2]&&c.ops.pop(),c.trys.pop();continue}r=n.call(e,c)}catch(a){r=[6,a],o=0}finally{t=i=0}if(5&r[0])throw r[1];return{value:r[0]?r[1]:void 0,done:!0}}([r,a])}}},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Negotiator=void 0;var i=require("./util"),r=o(require("./logger")),c=require("./enums"),a=function(){function o(e){this.connection=e}return o.prototype.startConnection=function(e){var n=this._startPeerConnection();if(this.connection.peerConnection=n,this.connection.type===c.ConnectionType.Media&&e._stream&&this._addTracksToConnection(e._stream,n),e.originator){if(this.connection.type===c.ConnectionType.Data){var t=this.connection,o={ordered:!!e.reliable},i=n.createDataChannel(t.label,o);t.initialize(i)}this._makeOffer()}else this.handleSDP("OFFER",e.sdp)},o.prototype._startPeerConnection=function(){r.default.log("Creating RTCPeerConnection.");var e=new RTCPeerConnection(this.connection.provider.options.config);return this._setupListeners(e),e},o.prototype._setupListeners=function(e){var n=this,t=this.connection.peer,o=this.connection.connectionId,a=this.connection.type,s=this.connection.provider;r.default.log("Listening for ICE candidates."),e.onicecandidate=function(e){e.candidate&&e.candidate.candidate&&(r.default.log("Received ICE candidates for "+t+":",e.candidate),s.socket.send({type:c.ServerMessageType.Candidate,payload:{candidate:e.candidate,type:a,connectionId:o},dst:t}))},e.oniceconnectionstatechange=function(){switch(e.iceConnectionState){case"failed":r.default.log("iceConnectionState is failed, closing connections to "+t),n.connection.emit(c.ConnectionEventType.Error,new Error("Negotiation of connection to "+t+" failed.")),n.connection.close();break;case"closed":r.default.log("iceConnectionState is closed, closing connections to "+t),n.connection.emit(c.ConnectionEventType.Error,new Error("Connection to "+t+" closed.")),n.connection.close();break;case"disconnected":r.default.log("iceConnectionState changed to disconnected on the connection with "+t);break;case"completed":e.onicecandidate=i.util.noop}n.connection.emit(c.ConnectionEventType.IceStateChanged,e.iceConnectionState)},r.default.log("Listening for data channel"),e.ondatachannel=function(e){r.default.log("Received data channel");var n=e.channel;s.getConnection(t,o).initialize(n)},r.default.log("Listening for remote stream"),e.ontrack=function(e){r.default.log("Received remote stream");var i=e.streams[0],a=s.getConnection(t,o);if(a.type===c.ConnectionType.Media){var d=a;n._addStreamToMediaConnection(i,d)}}},o.prototype.cleanup=function(){r.default.log("Cleaning up PeerConnection to "+this.connection.peer);var e=this.connection.peerConnection;if(e){this.connection.peerConnection=null,e.onicecandidate=e.oniceconnectionstatechange=e.ondatachannel=e.ontrack=function(){};var n="closed"!==e.signalingState,t=!1;if(this.connection.type===c.ConnectionType.Data){var o=this.connection.dataChannel;o&&(t=!!o.readyState&&"closed"!==o.readyState)}(n||t)&&e.close()}},o.prototype._makeOffer=function(){return n(this,void 0,Promise,function(){var n,o,a,s,d,l,u;return t(this,function(t){switch(t.label){case 0:n=this.connection.peerConnection,o=this.connection.provider,t.label=1;case 1:return t.trys.push([1,7,,8]),[4,n.createOffer(this.connection.options.constraints)];case 2:a=t.sent(),r.default.log("Created offer."),this.connection.options.sdpTransform&&"function"==typeof this.connection.options.sdpTransform&&(a.sdp=this.connection.options.sdpTransform(a.sdp)||a.sdp),t.label=3;case 3:return t.trys.push([3,5,,6]),[4,n.setLocalDescription(a)];case 4:return t.sent(),r.default.log("Set localDescription:",a,"for:"+this.connection.peer),s={sdp:a,type:this.connection.type,connectionId:this.connection.connectionId,metadata:this.connection.metadata,browser:i.util.browser},this.connection.type===c.ConnectionType.Data&&(d=this.connection,s=e(e({},s),{label:d.label,reliable:d.reliable,serialization:d.serialization})),o.socket.send({type:c.ServerMessageType.Offer,payload:s,dst:this.connection.peer}),[3,6];case 5:return"OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"!=(l=t.sent())&&(o.emitError(c.PeerErrorType.WebRTC,l),r.default.log("Failed to setLocalDescription, ",l)),[3,6];case 6:return[3,8];case 7:return u=t.sent(),o.emitError(c.PeerErrorType.WebRTC,u),r.default.log("Failed to createOffer, ",u),[3,8];case 8:return[2]}})})},o.prototype._makeAnswer=function(){return n(this,void 0,Promise,function(){var e,n,o,a,s;return t(this,function(t){switch(t.label){case 0:e=this.connection.peerConnection,n=this.connection.provider,t.label=1;case 1:return t.trys.push([1,7,,8]),[4,e.createAnswer()];case 2:o=t.sent(),r.default.log("Created answer."),this.connection.options.sdpTransform&&"function"==typeof this.connection.options.sdpTransform&&(o.sdp=this.connection.options.sdpTransform(o.sdp)||o.sdp),t.label=3;case 3:return t.trys.push([3,5,,6]),[4,e.setLocalDescription(o)];case 4:return t.sent(),r.default.log("Set localDescription:",o,"for:"+this.connection.peer),n.socket.send({type:c.ServerMessageType.Answer,payload:{sdp:o,type:this.connection.type,connectionId:this.connection.connectionId,browser:i.util.browser},dst:this.connection.peer}),[3,6];case 5:return a=t.sent(),n.emitError(c.PeerErrorType.WebRTC,a),r.default.log("Failed to setLocalDescription, ",a),[3,6];case 6:return[3,8];case 7:return s=t.sent(),n.emitError(c.PeerErrorType.WebRTC,s),r.default.log("Failed to create answer, ",s),[3,8];case 8:return[2]}})})},o.prototype.handleSDP=function(e,o){return n(this,void 0,Promise,function(){var n,i,a,s;return t(this,function(t){switch(t.label){case 0:o=new RTCSessionDescription(o),n=this.connection.peerConnection,i=this.connection.provider,r.default.log("Setting remote description",o),a=this,t.label=1;case 1:return t.trys.push([1,5,,6]),[4,n.setRemoteDescription(o)];case 2:return t.sent(),r.default.log("Set remoteDescription:"+e+" for:"+this.connection.peer),"OFFER"!==e?[3,4]:[4,a._makeAnswer()];case 3:t.sent(),t.label=4;case 4:return[3,6];case 5:return s=t.sent(),i.emitError(c.PeerErrorType.WebRTC,s),r.default.log("Failed to setRemoteDescription, ",s),[3,6];case 6:return[2]}})})},o.prototype.handleCandidate=function(e){return n(this,void 0,Promise,function(){var n,o,i,a,s,d;return t(this,function(t){switch(t.label){case 0:r.default.log("handleCandidate:",e),n=e.candidate,o=e.sdpMLineIndex,i=e.sdpMid,a=this.connection.peerConnection,s=this.connection.provider,t.label=1;case 1:return t.trys.push([1,3,,4]),[4,a.addIceCandidate(new RTCIceCandidate({sdpMid:i,sdpMLineIndex:o,candidate:n}))];case 2:return t.sent(),r.default.log("Added ICE candidate for:"+this.connection.peer),[3,4];case 3:return d=t.sent(),s.emitError(c.PeerErrorType.WebRTC,d),r.default.log("Failed to handleCandidate, ",d),[3,4];case 4:return[2]}})})},o.prototype._addTracksToConnection=function(e,n){if(r.default.log("add tracks from stream "+e.id+" to peer connection"),!n.addTrack)return r.default.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");e.getTracks().forEach(function(t){n.addTrack(t,e)})},o.prototype._addStreamToMediaConnection=function(e,n){r.default.log("add stream "+e.id+" to media connection "+n.connectionId),n.addStream(e)},o}();exports.Negotiator=a;
},{"./util":"BHXf","./logger":"WOs9","./enums":"ZRYf"}],"tQFK":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,n){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])})(e,n)};return function(e,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function o(){this.constructor=e}t(e,n),e.prototype=null===n?Object.create(n):(o.prototype=n.prototype,new o)}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.BaseConnection=void 0;var e=require("eventemitter3"),n=function(e){function n(t,n,o){var r=e.call(this)||this;return r.peer=t,r.provider=n,r.options=o,r._open=!1,r.metadata=o.metadata,r}return t(n,e),Object.defineProperty(n.prototype,"open",{get:function(){return this._open},enumerable:!1,configurable:!0}),n}(e.EventEmitter);exports.BaseConnection=n;
},{"eventemitter3":"JJlS"}],"dbHP":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(t,o){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])})(t,o)};return function(t,o){if("function"!=typeof o&&null!==o)throw new TypeError("Class extends value "+String(o)+" is not a constructor or null");function r(){this.constructor=t}e(t,o),t.prototype=null===o?Object.create(o):(r.prototype=o.prototype,new r)}}(),t=this&&this.__assign||function(){return(t=Object.assign||function(e){for(var t,o=1,r=arguments.length;o<r;o++)for(var n in t=arguments[o])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)},o=this&&this.__values||function(e){var t="function"==typeof Symbol&&Symbol.iterator,o=t&&e[t],r=0;if(o)return o.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&r>=e.length&&(e=void 0),{value:e&&e[r++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.MediaConnection=void 0;var n=require("./util"),i=r(require("./logger")),a=require("./negotiator"),s=require("./enums"),l=require("./baseconnection"),c=function(r){function l(e,t,o){var i=r.call(this,e,t,o)||this;return i._localStream=i.options._stream,i.connectionId=i.options.connectionId||l.ID_PREFIX+n.util.randomToken(),i._negotiator=new a.Negotiator(i),i._localStream&&i._negotiator.startConnection({_stream:i._localStream,originator:!0}),i}return e(l,r),Object.defineProperty(l.prototype,"type",{get:function(){return s.ConnectionType.Media},enumerable:!1,configurable:!0}),Object.defineProperty(l.prototype,"localStream",{get:function(){return this._localStream},enumerable:!1,configurable:!0}),Object.defineProperty(l.prototype,"remoteStream",{get:function(){return this._remoteStream},enumerable:!1,configurable:!0}),l.prototype.addStream=function(e){i.default.log("Receiving stream",e),this._remoteStream=e,r.prototype.emit.call(this,s.ConnectionEventType.Stream,e)},l.prototype.handleMessage=function(e){var t=e.type,o=e.payload;switch(e.type){case s.ServerMessageType.Answer:this._negotiator.handleSDP(t,o.sdp),this._open=!0;break;case s.ServerMessageType.Candidate:this._negotiator.handleCandidate(o.candidate);break;default:i.default.warn("Unrecognized message type:"+t+" from peer:"+this.peer)}},l.prototype.answer=function(e,r){var n,a;if(void 0===r&&(r={}),this._localStream)i.default.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");else{this._localStream=e,r&&r.sdpTransform&&(this.options.sdpTransform=r.sdpTransform),this._negotiator.startConnection(t(t({},this.options._payload),{_stream:e}));var s=this.provider._getMessages(this.connectionId);try{for(var l=o(s),c=l.next();!c.done;c=l.next()){var p=c.value;this.handleMessage(p)}}catch(u){n={error:u}}finally{try{c&&!c.done&&(a=l.return)&&a.call(l)}finally{if(n)throw n.error}}this._open=!0}},l.prototype.close=function(){this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this._localStream=null,this._remoteStream=null,this.provider&&(this.provider._removeConnection(this),this.provider=null),this.options&&this.options._stream&&(this.options._stream=null),this.open&&(this._open=!1,r.prototype.emit.call(this,s.ConnectionEventType.Close))},l.ID_PREFIX="mc_",l}(l.BaseConnection);exports.MediaConnection=c;
},{"./util":"BHXf","./logger":"WOs9","./negotiator":"HCdX","./enums":"ZRYf","./baseconnection":"tQFK"}],"GGp6":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(t,r){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])})(t,r)};return function(t,r){if("function"!=typeof r&&null!==r)throw new TypeError("Class extends value "+String(r)+" is not a constructor or null");function o(){this.constructor=t}e(t,r),t.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}}(),t=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.EncodingQueue=void 0;var r=require("eventemitter3"),o=t(require("./logger")),n=function(t){function r(){var e=t.call(this)||this;return e.fileReader=new FileReader,e._queue=[],e._processing=!1,e.fileReader.onload=function(t){e._processing=!1,t.target&&e.emit("done",t.target.result),e.doNextTask()},e.fileReader.onerror=function(t){o.default.error("EncodingQueue error:",t),e._processing=!1,e.destroy(),e.emit("error",t)},e}return e(r,t),Object.defineProperty(r.prototype,"queue",{get:function(){return this._queue},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"size",{get:function(){return this.queue.length},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"processing",{get:function(){return this._processing},enumerable:!1,configurable:!0}),r.prototype.enque=function(e){this.queue.push(e),this.processing||this.doNextTask()},r.prototype.destroy=function(){this.fileReader.abort(),this._queue=[]},r.prototype.doNextTask=function(){0!==this.size&&(this.processing||(this._processing=!0,this.fileReader.readAsArrayBuffer(this.queue.shift())))},r}(r.EventEmitter);exports.EncodingQueue=n;
},{"eventemitter3":"JJlS","./logger":"WOs9"}],"GBTQ":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(t,n)};return function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function i(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(i.prototype=n.prototype,new i)}}(),t=this&&this.__values||function(e){var t="function"==typeof Symbol&&Symbol.iterator,n=t&&e[t],i=0;if(n)return n.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&i>=e.length&&(e=void 0),{value:e&&e[i++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},n=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.DataConnection=void 0;var i=require("./util"),o=n(require("./logger")),r=require("./negotiator"),a=require("./enums"),s=require("./baseconnection"),u=require("./encodingQueue"),l=function(n){function s(e,t,l){var f=n.call(this,e,t,l)||this;return f.stringify=JSON.stringify,f.parse=JSON.parse,f._buffer=[],f._bufferSize=0,f._buffering=!1,f._chunkedData={},f._encodingQueue=new u.EncodingQueue,f.connectionId=f.options.connectionId||s.ID_PREFIX+i.util.randomToken(),f.label=f.options.label||f.connectionId,f.serialization=f.options.serialization||a.SerializationType.Binary,f.reliable=!!f.options.reliable,f._encodingQueue.on("done",function(e){f._bufferedSend(e)}),f._encodingQueue.on("error",function(){o.default.error("DC#"+f.connectionId+": Error occured in encoding from blob to arraybuffer, close DC"),f.close()}),f._negotiator=new r.Negotiator(f),f._negotiator.startConnection(f.options._payload||{originator:!0}),f}return e(s,n),Object.defineProperty(s.prototype,"type",{get:function(){return a.ConnectionType.Data},enumerable:!1,configurable:!0}),Object.defineProperty(s.prototype,"dataChannel",{get:function(){return this._dc},enumerable:!1,configurable:!0}),Object.defineProperty(s.prototype,"bufferSize",{get:function(){return this._bufferSize},enumerable:!1,configurable:!0}),s.prototype.initialize=function(e){this._dc=e,this._configureDataChannel()},s.prototype._configureDataChannel=function(){var e=this;i.util.supports.binaryBlob&&!i.util.supports.reliable||(this.dataChannel.binaryType="arraybuffer"),this.dataChannel.onopen=function(){o.default.log("DC#"+e.connectionId+" dc connection success"),e._open=!0,e.emit(a.ConnectionEventType.Open)},this.dataChannel.onmessage=function(t){o.default.log("DC#"+e.connectionId+" dc onmessage:",t.data),e._handleDataMessage(t)},this.dataChannel.onclose=function(){o.default.log("DC#"+e.connectionId+" dc closed for:",e.peer),e.close()}},s.prototype._handleDataMessage=function(e){var t=this,o=e.data,r=o.constructor,s=o;if(this.serialization===a.SerializationType.Binary||this.serialization===a.SerializationType.BinaryUTF8){if(r===Blob)return void i.util.blobToArrayBuffer(o,function(e){var n=i.util.unpack(e);t.emit(a.ConnectionEventType.Data,n)});if(r===ArrayBuffer)s=i.util.unpack(o);else if(r===String){var u=i.util.binaryStringToArrayBuffer(o);s=i.util.unpack(u)}}else this.serialization===a.SerializationType.JSON&&(s=this.parse(o));s.__peerData?this._handleChunk(s):n.prototype.emit.call(this,a.ConnectionEventType.Data,s)},s.prototype._handleChunk=function(e){var t=e.__peerData,n=this._chunkedData[t]||{data:[],count:0,total:e.total};if(n.data[e.n]=e.data,n.count++,this._chunkedData[t]=n,n.total===n.count){delete this._chunkedData[t];var i=new Blob(n.data);this._handleDataMessage({data:i})}},s.prototype.close=function(){this._buffer=[],this._bufferSize=0,this._chunkedData={},this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this.provider&&(this.provider._removeConnection(this),this.provider=null),this.dataChannel&&(this.dataChannel.onopen=null,this.dataChannel.onmessage=null,this.dataChannel.onclose=null,this._dc=null),this._encodingQueue&&(this._encodingQueue.destroy(),this._encodingQueue.removeAllListeners(),this._encodingQueue=null),this.open&&(this._open=!1,n.prototype.emit.call(this,a.ConnectionEventType.Close))},s.prototype.send=function(e,t){if(this.open)if(this.serialization===a.SerializationType.JSON)this._bufferedSend(this.stringify(e));else if(this.serialization===a.SerializationType.Binary||this.serialization===a.SerializationType.BinaryUTF8){var o=i.util.pack(e);if(!t&&o.size>i.util.chunkedMTU)return void this._sendChunks(o);i.util.supports.binaryBlob?this._bufferedSend(o):this._encodingQueue.enque(o)}else this._bufferedSend(e);else n.prototype.emit.call(this,a.ConnectionEventType.Error,new Error("Connection is not open. You should listen for the `open` event before sending messages."))},s.prototype._bufferedSend=function(e){!this._buffering&&this._trySend(e)||(this._buffer.push(e),this._bufferSize=this._buffer.length)},s.prototype._trySend=function(e){var t=this;if(!this.open)return!1;if(this.dataChannel.bufferedAmount>s.MAX_BUFFERED_AMOUNT)return this._buffering=!0,setTimeout(function(){t._buffering=!1,t._tryBuffer()},50),!1;try{this.dataChannel.send(e)}catch(n){return o.default.error("DC#:"+this.connectionId+" Error when sending:",n),this._buffering=!0,this.close(),!1}return!0},s.prototype._tryBuffer=function(){if(this.open&&0!==this._buffer.length){var e=this._buffer[0];this._trySend(e)&&(this._buffer.shift(),this._bufferSize=this._buffer.length,this._tryBuffer())}},s.prototype._sendChunks=function(e){var n,r,a=i.util.chunk(e);o.default.log("DC#"+this.connectionId+" Try to send "+a.length+" chunks...");try{for(var s=t(a),u=s.next();!u.done;u=s.next()){var l=u.value;this.send(l,!0)}}catch(f){n={error:f}}finally{try{u&&!u.done&&(r=s.return)&&r.call(s)}finally{if(n)throw n.error}}},s.prototype.handleMessage=function(e){var t=e.payload;switch(e.type){case a.ServerMessageType.Answer:this._negotiator.handleSDP(e.type,t.sdp);break;case a.ServerMessageType.Candidate:this._negotiator.handleCandidate(t.candidate);break;default:o.default.warn("Unrecognized message type:",e.type,"from peer:",this.peer)}},s.ID_PREFIX="dc_",s.MAX_BUFFERED_AMOUNT=8388608,s}(s.BaseConnection);exports.DataConnection=l;
},{"./util":"BHXf","./logger":"WOs9","./negotiator":"HCdX","./enums":"ZRYf","./baseconnection":"tQFK","./encodingQueue":"GGp6"}],"in7L":[function(require,module,exports) {
"use strict";var t=this&&this.__awaiter||function(t,e,r,o){return new(r||(r=Promise))(function(n,s){function i(t){try{a(o.next(t))}catch(e){s(e)}}function u(t){try{a(o.throw(t))}catch(e){s(e)}}function a(t){var e;t.done?n(t.value):(e=t.value,e instanceof r?e:new r(function(t){t(e)})).then(i,u)}a((o=o.apply(t,e||[])).next())})},e=this&&this.__generator||function(t,e){var r,o,n,s,i={label:0,sent:function(){if(1&n[0])throw n[1];return n[1]},trys:[],ops:[]};return s={next:u(0),throw:u(1),return:u(2)},"function"==typeof Symbol&&(s[Symbol.iterator]=function(){return this}),s;function u(s){return function(u){return function(s){if(r)throw new TypeError("Generator is already executing.");for(;i;)try{if(r=1,o&&(n=2&s[0]?o.return:s[0]?o.throw||((n=o.return)&&n.call(o),0):o.next)&&!(n=n.call(o,s[1])).done)return n;switch(o=0,n&&(s=[2&s[0],n.value]),s[0]){case 0:case 1:n=s;break;case 4:return i.label++,{value:s[1],done:!1};case 5:i.label++,o=s[1],s=[0];continue;case 7:s=i.ops.pop(),i.trys.pop();continue;default:if(!(n=(n=i.trys).length>0&&n[n.length-1])&&(6===s[0]||2===s[0])){i=0;continue}if(3===s[0]&&(!n||s[1]>n[0]&&s[1]<n[3])){i.label=s[1];break}if(6===s[0]&&i.label<n[1]){i.label=n[1],n=s;break}if(n&&i.label<n[2]){i.label=n[2],i.ops.push(s);break}n[2]&&i.ops.pop(),i.trys.pop();continue}s=e.call(t,i)}catch(u){s=[6,u],o=0}finally{r=n=0}if(5&s[0])throw s[1];return{value:s[0]?s[1]:void 0,done:!0}}([s,u])}}},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.API=void 0;var o=require("./util"),n=r(require("./logger")),s=function(){function r(t){this._options=t}return r.prototype._buildUrl=function(t){var e=(this._options.secure?"https://":"http://")+this._options.host+":"+this._options.port+this._options.path+this._options.key+"/"+t;return e+="?ts="+(new Date).getTime()+Math.random()},r.prototype.retrieveId=function(){return t(this,void 0,Promise,function(){var t,r,s,i;return e(this,function(e){switch(e.label){case 0:t=this._buildUrl("id"),e.label=1;case 1:return e.trys.push([1,3,,4]),[4,fetch(t)];case 2:if(200!==(r=e.sent()).status)throw new Error("Error. Status:"+r.status);return[2,r.text()];case 3:throw s=e.sent(),n.default.error("Error retrieving ID",s),i="","/"===this._options.path&&this._options.host!==o.util.CLOUD_HOST&&(i=" If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer."),new Error("Could not get an ID from the server."+i);case 4:return[2]}})})},r.prototype.listAllPeers=function(){return t(this,void 0,Promise,function(){var t,r,s,i;return e(this,function(e){switch(e.label){case 0:t=this._buildUrl("peers"),e.label=1;case 1:return e.trys.push([1,3,,4]),[4,fetch(t)];case 2:if(200!==(r=e.sent()).status){if(401===r.status)throw s="",s=this._options.host===o.util.CLOUD_HOST?"It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.":"You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.",new Error("It doesn't look like you have permission to list peers IDs. "+s);throw new Error("Error. Status:"+r.status)}return[2,r.json()];case 3:throw i=e.sent(),n.default.error("Error retrieving list peers",i),new Error("Could not get list peers from the server."+i);case 4:return[2]}})})},r}();exports.API=s;
},{"./util":"BHXf","./logger":"WOs9"}],"Hxpd":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(t,n){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(t,n)};return function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}(),t=this&&this.__assign||function(){return(t=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)},n=this&&this.__values||function(e){var t="function"==typeof Symbol&&Symbol.iterator,n=t&&e[t],r=0;if(n)return n.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&r>=e.length&&(e=void 0),{value:e&&e[r++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},r=this&&this.__read||function(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var r,o,i=n.call(e),s=[];try{for(;(void 0===t||t-- >0)&&!(r=i.next()).done;)s.push(r.value)}catch(a){o={error:a}}finally{try{r&&!r.done&&(n=i.return)&&n.call(i)}finally{if(o)throw o.error}}return s},o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Peer=void 0;var i=require("eventemitter3"),s=require("./util"),a=o(require("./logger")),c=require("./socket"),l=require("./mediaconnection"),u=require("./dataconnection"),d=require("./enums"),p=require("./api"),h=function(){return function(){}}(),f=function(o){function i(e,n){var r,c=o.call(this)||this;return c._id=null,c._lastServerId=null,c._destroyed=!1,c._disconnected=!1,c._open=!1,c._connections=new Map,c._lostMessages=new Map,e&&e.constructor==Object?n=e:e&&(r=e.toString()),n=t({debug:0,host:s.util.CLOUD_HOST,port:s.util.CLOUD_PORT,path:"/",key:i.DEFAULT_KEY,token:s.util.randomToken(),config:s.util.defaultConfig},n),c._options=n,"/"===c._options.host&&(c._options.host=window.location.hostname),c._options.path&&("/"!==c._options.path[0]&&(c._options.path="/"+c._options.path),"/"!==c._options.path[c._options.path.length-1]&&(c._options.path+="/")),void 0===c._options.secure&&c._options.host!==s.util.CLOUD_HOST?c._options.secure=s.util.isSecure():c._options.host==s.util.CLOUD_HOST&&(c._options.secure=!0),c._options.logFunction&&a.default.setLogFunction(c._options.logFunction),a.default.logLevel=c._options.debug||0,c._api=new p.API(n),c._socket=c._createServerConnection(),s.util.supports.audioVideo||s.util.supports.data?r&&!s.util.validateId(r)?(c._delayedAbort(d.PeerErrorType.InvalidID,'ID "'+r+'" is invalid'),c):(r?c._initialize(r):c._api.retrieveId().then(function(e){return c._initialize(e)}).catch(function(e){return c._abort(d.PeerErrorType.ServerError,e)}),c):(c._delayedAbort(d.PeerErrorType.BrowserIncompatible,"The current browser does not support WebRTC"),c)}return e(i,o),Object.defineProperty(i.prototype,"id",{get:function(){return this._id},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"options",{get:function(){return this._options},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"open",{get:function(){return this._open},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"socket",{get:function(){return this._socket},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"connections",{get:function(){var e,t,o=Object.create(null);try{for(var i=n(this._connections),s=i.next();!s.done;s=i.next()){var a=r(s.value,2),c=a[0],l=a[1];o[c]=l}}catch(u){e={error:u}}finally{try{s&&!s.done&&(t=i.return)&&t.call(i)}finally{if(e)throw e.error}}return o},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"destroyed",{get:function(){return this._destroyed},enumerable:!1,configurable:!0}),Object.defineProperty(i.prototype,"disconnected",{get:function(){return this._disconnected},enumerable:!1,configurable:!0}),i.prototype._createServerConnection=function(){var e=this,t=new c.Socket(this._options.secure,this._options.host,this._options.port,this._options.path,this._options.key,this._options.pingInterval);return t.on(d.SocketEventType.Message,function(t){e._handleMessage(t)}),t.on(d.SocketEventType.Error,function(t){e._abort(d.PeerErrorType.SocketError,t)}),t.on(d.SocketEventType.Disconnected,function(){e.disconnected||(e.emitError(d.PeerErrorType.Network,"Lost connection to server."),e.disconnect())}),t.on(d.SocketEventType.Close,function(){e.disconnected||e._abort(d.PeerErrorType.SocketClosed,"Underlying socket is already closed.")}),t},i.prototype._initialize=function(e){this._id=e,this.socket.start(e,this._options.token)},i.prototype._handleMessage=function(e){var t,r,o=e.type,i=e.payload,s=e.src;switch(o){case d.ServerMessageType.Open:this._lastServerId=this.id,this._open=!0,this.emit(d.PeerEventType.Open,this.id);break;case d.ServerMessageType.Error:this._abort(d.PeerErrorType.ServerError,i.msg);break;case d.ServerMessageType.IdTaken:this._abort(d.PeerErrorType.UnavailableID,'ID "'+this.id+'" is taken');break;case d.ServerMessageType.InvalidKey:this._abort(d.PeerErrorType.InvalidKey,'API KEY "'+this._options.key+'" is invalid');break;case d.ServerMessageType.Leave:a.default.log("Received leave message from "+s),this._cleanupPeer(s),this._connections.delete(s);break;case d.ServerMessageType.Expire:this.emitError(d.PeerErrorType.PeerUnavailable,"Could not connect to peer "+s);break;case d.ServerMessageType.Offer:var c=i.connectionId;if((_=this.getConnection(s,c))&&(_.close(),a.default.warn("Offer received for existing Connection ID:"+c)),i.type===d.ConnectionType.Media)_=new l.MediaConnection(s,this,{connectionId:c,_payload:i,metadata:i.metadata}),this._addConnection(s,_),this.emit(d.PeerEventType.Call,_);else{if(i.type!==d.ConnectionType.Data)return void a.default.warn("Received malformed connection type:"+i.type);_=new u.DataConnection(s,this,{connectionId:c,_payload:i,metadata:i.metadata,label:i.label,serialization:i.serialization,reliable:i.reliable}),this._addConnection(s,_),this.emit(d.PeerEventType.Connection,_)}var p=this._getMessages(c);try{for(var h=n(p),f=h.next();!f.done;f=h.next()){var y=f.value;_.handleMessage(y)}}catch(v){t={error:v}}finally{try{f&&!f.done&&(r=h.return)&&r.call(h)}finally{if(t)throw t.error}}break;default:if(!i)return void a.default.warn("You received a malformed message from "+s+" of type "+o);var _;c=i.connectionId;(_=this.getConnection(s,c))&&_.peerConnection?_.handleMessage(e):c?this._storeMessage(c,e):a.default.warn("You received an unrecognized message:",e)}},i.prototype._storeMessage=function(e,t){this._lostMessages.has(e)||this._lostMessages.set(e,[]),this._lostMessages.get(e).push(t)},i.prototype._getMessages=function(e){var t=this._lostMessages.get(e);return t?(this._lostMessages.delete(e),t):[]},i.prototype.connect=function(e,t){if(void 0===t&&(t={}),this.disconnected)return a.default.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available."),void this.emitError(d.PeerErrorType.Disconnected,"Cannot connect to new Peer after disconnecting from server.");var n=new u.DataConnection(e,this,t);return this._addConnection(e,n),n},i.prototype.call=function(e,t,n){if(void 0===n&&(n={}),this.disconnected)return a.default.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect."),void this.emitError(d.PeerErrorType.Disconnected,"Cannot connect to new Peer after disconnecting from server.");if(t){n._stream=t;var r=new l.MediaConnection(e,this,n);return this._addConnection(e,r),r}a.default.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.")},i.prototype._addConnection=function(e,t){a.default.log("add connection "+t.type+":"+t.connectionId+" to peerId:"+e),this._connections.has(e)||this._connections.set(e,[]),this._connections.get(e).push(t)},i.prototype._removeConnection=function(e){var t=this._connections.get(e.peer);if(t){var n=t.indexOf(e);-1!==n&&t.splice(n,1)}this._lostMessages.delete(e.connectionId)},i.prototype.getConnection=function(e,t){var r,o,i=this._connections.get(e);if(!i)return null;try{for(var s=n(i),a=s.next();!a.done;a=s.next()){var c=a.value;if(c.connectionId===t)return c}}catch(l){r={error:l}}finally{try{a&&!a.done&&(o=s.return)&&o.call(s)}finally{if(r)throw r.error}}return null},i.prototype._delayedAbort=function(e,t){var n=this;setTimeout(function(){n._abort(e,t)},0)},i.prototype._abort=function(e,t){a.default.error("Aborting!"),this.emitError(e,t),this._lastServerId?this.disconnect():this.destroy()},i.prototype.emitError=function(e,t){var n;a.default.error("Error:",t),(n="string"==typeof t?new Error(t):t).type=e,this.emit(d.PeerEventType.Error,n)},i.prototype.destroy=function(){this.destroyed||(a.default.log("Destroy peer with ID:"+this.id),this.disconnect(),this._cleanup(),this._destroyed=!0,this.emit(d.PeerEventType.Close))},i.prototype._cleanup=function(){var e,t;try{for(var r=n(this._connections.keys()),o=r.next();!o.done;o=r.next()){var i=o.value;this._cleanupPeer(i),this._connections.delete(i)}}catch(s){e={error:s}}finally{try{o&&!o.done&&(t=r.return)&&t.call(r)}finally{if(e)throw e.error}}this.socket.removeAllListeners()},i.prototype._cleanupPeer=function(e){var t,r,o=this._connections.get(e);if(o)try{for(var i=n(o),s=i.next();!s.done;s=i.next()){s.value.close()}}catch(a){t={error:a}}finally{try{s&&!s.done&&(r=i.return)&&r.call(i)}finally{if(t)throw t.error}}},i.prototype.disconnect=function(){if(!this.disconnected){var e=this.id;a.default.log("Disconnect peer with ID:"+e),this._disconnected=!0,this._open=!1,this.socket.close(),this._lastServerId=e,this._id=null,this.emit(d.PeerEventType.Disconnected,e)}},i.prototype.reconnect=function(){if(this.disconnected&&!this.destroyed)a.default.log("Attempting reconnection to server with ID "+this._lastServerId),this._disconnected=!1,this._initialize(this._lastServerId);else{if(this.destroyed)throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");if(this.disconnected||this.open)throw new Error("Peer "+this.id+" cannot reconnect because it is not disconnected from the server!");a.default.error("In a hurry? We're still trying to make the initial connection!")}},i.prototype.listAllPeers=function(e){var t=this;void 0===e&&(e=function(e){}),this._api.listAllPeers().then(function(t){return e(t)}).catch(function(e){return t._abort(d.PeerErrorType.ServerError,e)})},i.DEFAULT_KEY="peerjs",i}(i.EventEmitter);exports.Peer=f;
},{"eventemitter3":"JJlS","./util":"BHXf","./logger":"WOs9","./socket":"wJlv","./mediaconnection":"dbHP","./dataconnection":"GBTQ","./enums":"ZRYf","./api":"in7L"}],"iTK6":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.peerjs=void 0;var e=require("./util"),r=require("./peer");exports.peerjs={Peer:r.Peer,util:e.util},exports.default=r.Peer,window.peerjs=exports.peerjs,window.Peer=r.Peer;
},{"./util":"BHXf","./peer":"Hxpd"}]},{},["iTK6"], null)
//# sourceMappingURL=peerjs.min.js.map

/*!
 * VisualEditor DataModel rebase document state class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * DataModel rebase document state
 *
 * @class
 *
 * @constructor
 */
ve.dm.RebaseDocState = function VeDmRebaseDocState() {
	/**
	 * @property {ve.dm.Change} history History as one big change
	 */
	this.history = new ve.dm.Change();

	/**
	 * @property {Map.<number, Object>} authors Information about each author
	 */
	this.authors = new Map();
};

/* Inheritance */

OO.initClass( ve.dm.RebaseDocState );

/* Static Methods */

/**
 * Get new empty author data object
 *
 * @return {Object} New empty author data object
 * @return {string} return.name
 * @return {string} return.color
 * @return {number} return.rejections Number of unacknowledged rejections
 * @return {ve.dm.Change|null} return.continueBase Continue base
 * @return {string} return.token Secret token for usurping sessions
 * @return {boolean} return.active Whether the author is active
 */
ve.dm.RebaseDocState.static.newAuthorData = function () {
	return {
		name: '',
		color: '',
		rejections: 0,
		continueBase: null,
		// TODO use cryptographic randomness here and convert to hex
		token: Math.random().toString(),
		active: true
	};
};

/* Methods */

ve.dm.RebaseDocState.prototype.getActiveAuthors = function () {
	const result = {};
	this.authors.forEach( function ( authorData, authorId ) {
		if ( authorData.active ) {
			result[ authorId ] = {
				name: authorData.name,
				color: authorData.color
			};
		}
	} );
	return result;
};

ve.dm.RebaseDocState.prototype.clearHistory = function () {
	this.history = new ve.dm.Change();
	this.authors.forEach( function ( authorData ) {
		authorData.continueBase = null;
	} );
};

/*!
 * VisualEditor DataModel rebase server class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * DataModel rebase server
 *
 * @class
 *
 * @constructor
 * @param {Function} [logCallback]
 */
ve.dm.RebaseServer = function VeDmRebaseServer( logCallback ) {
	this.stateForDoc = new Map();
	this.logEvent = logCallback || function () {};
};

OO.initClass( ve.dm.RebaseServer );

/* Methods */

/**
 * Get the state of a document by name.
 *
 * @param {string} doc Name of a document
 * @return {ve.dm.RebaseDocState} Document state
 */
ve.dm.RebaseServer.prototype.getDocState = function ( doc ) {
	if ( !this.stateForDoc.has( doc ) ) {
		this.stateForDoc.set( doc, new ve.dm.RebaseDocState() );
	}
	return this.stateForDoc.get( doc );
};

/**
 * Update document history
 *
 * @param {string} doc Name of a document
 * @param {number|null} authorId Author ID
 * @param {ve.dm.Change} [newHistory] New history to append
 * @param {Object} [authorDataChanges] New values for author data (modified keys only)
 */
ve.dm.RebaseServer.prototype.updateDocState = function updateDocState( doc, authorId, newHistory, authorDataChanges ) {
	const state = this.getDocState( doc );
	if ( newHistory ) {
		state.history.push( newHistory );
	}
	if ( !authorId ) {
		return;
	}
	let authorData = state.authors.get( authorId );
	if ( !authorData ) {
		authorData = state.constructor.static.newAuthorData();
		state.authors.set( authorId, authorData );
	}
	if ( authorDataChanges ) {
		for ( const key in authorData ) {
			if ( authorDataChanges[ key ] !== undefined ) {
				authorData[ key ] = authorDataChanges[ key ];
			}
		}
	}
};

/**
 * Forget all history for a document
 *
 * @param {string} doc Name of a document
 */
ve.dm.RebaseServer.prototype.clearDocState = function clearDocState( doc ) {
	const state = this.stateForDoc.get( doc );
	if ( !state ) {
		return;
	}
	state.clearHistory();
};

/**
 * Attempt to rebase and apply a change to a document.
 *
 * The change can be a new change, or a continued change. A continuated change means one that
 * follows on immediately from the author's last submitted change, other than possibly being
 * rebased onto some more recent committed history.
 *
 * @param {string} doc Document name
 * @param {number} authorId Author ID
 * @param {number} backtrack How many transactions are backtracked from the previous submission
 * @param {ve.dm.Change} change Change to apply
 * @return {ve.dm.Change} Accepted change (or initial segment thereof), as rebased
 */
ve.dm.RebaseServer.prototype.applyChange = function applyChange( doc, authorId, backtrack, change ) {
	const state = this.getDocState( doc ),
		authorData = state.authors.get( authorId );

	let appliedChange;

	let base = ( authorData && authorData.continueBase ) || change.truncate( 0 );
	let rejections = ( authorData && authorData.rejections ) || 0;
	if ( rejections > backtrack ) {
		// Follow-on does not fully acknowledge outstanding conflicts: reject entirely
		rejections = rejections - backtrack + change.transactions.length;
		this.updateDocState( doc, authorId, null, { rejections: rejections } );
		// FIXME argh this publishes an empty change, which is not what we want
		appliedChange = state.history.truncate( 0 );
	} else if ( rejections < backtrack ) {
		throw new Error( 'Backtrack=' + backtrack + ' > ' + rejections + '=rejections' );
	} else {
		if ( change.start > base.start ) {
			// Remote has rebased some committed changes into its history since base was built.
			// They are guaranteed to be equivalent to the start of base. See mathematical
			// docs for proof (Cuius rei demonstrationem mirabilem sane deteximus hanc marginis
			// exiguitas non caperet).
			base = base.mostRecent( change.start );
		}
		base = base.concat( state.history.mostRecent( base.start + base.getLength() ) );

		const result = ve.dm.Change.static.rebaseUncommittedChange( base, change );
		rejections = result.rejected ? result.rejected.getLength() : 0;
		this.updateDocState( doc, authorId, result.rebased, {
			rejections: rejections,
			continueBase: result.transposedHistory
		} );
		appliedChange = result.rebased;
	}
	this.logEvent( {
		type: 'applyChange',
		doc: doc,
		authorId: authorId,
		incoming: change,
		applied: appliedChange,
		backtrack: backtrack,
		rejections: rejections
	} );
	return appliedChange;
};

/*!
 * VisualEditor document store class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * @constructor
 * @param {Object} storageClient MongoClient-like object; passed as a parameter for testing purposes
 * @param {string} dbName Database name
 * @param {Object} logger Logger class
 * @param {Function} logger.logServerEvent Stringify object argument to log, adding timestamp and server ID properties
 */
ve.dm.DocumentStore = function VeDmDocumentStore( storageClient, dbName, logger ) {
	this.storageClient = storageClient;
	this.dbName = dbName;
	this.logger = logger;
	this.db = null;
	this.collection = null;
	this.startForDoc = new Map();
	this.serverId = null;
};

/**
 * @return {Promise} Resolves when connected
 */
ve.dm.DocumentStore.prototype.connect = function () {
	const documentStore = this;
	return this.storageClient.connect().then( function ( client ) {
		const db = client.db( documentStore.dbName );
		documentStore.logger.logServerEvent( { type: 'DocumentStore#connected', dbName: documentStore.dbName }, 'info' );
		documentStore.db = db;
		documentStore.collection = db.collection( 'vedocstore' );
		return documentStore.collection.findOneAndUpdate(
			{ config: 'options' },
			{ $setOnInsert: { serverId: Math.random().toString( 36 ).slice( 2 ) } },
			{ upsert: true, returnDocument: 'after' }
		);
	} ).then( function ( result ) {
		documentStore.serverId = result.value.serverId;
	} );
};

/**
 * @return {Promise} Drops the entire database
 */
ve.dm.DocumentStore.prototype.dropDatabase = function () {
	this.logger.logServerEvent( { type: 'DocumentStore#dropDatabase', dbName: this.dbName }, 'info' );
	return this.db.dropDatabase();
};

/**
 * Load a document from storage (creating as empty if absent)
 *
 * @param {string} docName Name of the document
 * @return {Promise} Confirmed document history as a ve.dm.Change
 */
ve.dm.DocumentStore.prototype.load = function ( docName ) {
	const documentStore = this;
	return this.collection.findOneAndUpdate(
		{ docName: docName },
		{ $setOnInsert: { start: 0, transactions: [], stores: [] } },
		{ upsert: true, returnDocument: 'after' }
	).then( function ( result ) {
		const length = result.value.transactions.length || 0;
		documentStore.logger.logServerEvent( { type: 'DocumentStore#loaded', docName: docName, length: length } );
		documentStore.startForDoc.set( docName, result.value.start + length );
		return ve.dm.Change.static.deserialize( {
			start: 0,
			transactions: result.value.transactions,
			stores: result.value.stores,
			selections: {}
		}, true );
	} );
};

/**
 * Save a new change to storage
 *
 * @param {string} docName Name of the document
 * @param {ve.dm.Change} change The new change
 * @return {Promise} Resolves when saved
 */
ve.dm.DocumentStore.prototype.onNewChange = function ( docName, change ) {
	const documentStore = this,
		serializedChange = change.serialize( true ),
		expectedStart = this.startForDoc.get( docName ) || 0;

	if ( expectedStart !== serializedChange.start ) {
		return Promise.reject( 'Unmatched starts:', expectedStart, serializedChange.start );
	}
	this.startForDoc.set( docName, serializedChange.start + serializedChange.transactions.length );
	return this.collection.updateOne(
		{ docName: docName },
		{
			$push: {
				transactions: { $each: serializedChange.transactions },
				stores: { $each: serializedChange.stores || serializedChange.transactions.map( function () {
					return null;
				} ) }
			}
		}
	).then( function () {
		documentStore.logger.logServerEvent( {
			type: 'DocumentStore#onNewChange',
			docName: docName,
			start: serializedChange.start,
			length: serializedChange.transactions.length
		} );
	} );
};

ve.dm.DocumentStore.prototype.onClose = function () {
	this.logger.logServerEvent( { type: 'DocumentStore#onClose' }, 'info' );
	this.storageClient.close();
};

/*!
 * VisualEditor DataModel protocol server class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * Protocol server
 *
 * Handles the abstract protocol without knowing the specific transport
 *
 * @param {ve.dm.DocumentStore} documentStore The persistent storage
 * @param {Object} logger Logger class
 * @param {Function} logger.getRelativeTimestmap Return the number of ms since the logger started
 * @param {Function} logger.logEvent Stringify object argument to log
 * @param {Function} logger.logServerEvent Stringify object argument to log, adding timestamp and server ID properties
 */
ve.dm.ProtocolServer = function VeDmProtocolServer( documentStore, logger ) {
	this.logger = logger;
	this.rebaseServer = new ve.dm.RebaseServer();
	this.lastAuthorForDoc = new Map();
	this.loadingForDoc = new Map();
	this.documentStore = documentStore;
	this.logger.logServerEvent( { type: 'restart' }, 'info' );
};

OO.initClass( ve.dm.ProtocolServer );

ve.dm.ProtocolServer.static.palette = [
	'1f77b4', 'ff7f0e', '2ca02c', 'd62728', '9467bd',
	'8c564b', 'e377c2', '7f7f7f', 'bcbd22', '17becf',
	'aec7e8', 'ffbb78', '98df8a', 'ff9896', 'c5b0d5',
	'c49c94', 'f7b6d2', 'c7c7c7', 'dbdb8d', '9edae5'
];

/**
 * If the document is not loaded, load from storage (creating as empty if absent)
 *
 * @param {string} docName Name of the document
 * @return {Promise} Resolves when loaded
 */
ve.dm.ProtocolServer.prototype.ensureLoaded = function ( docName ) {
	const documentStore = this,
		rebaseServer = this.rebaseServer;

	let loading = this.loadingForDoc.get( docName );

	if ( loading ) {
		return loading;
	}
	this.logger.logServerEvent( { type: 'ProtocolServer#load', docName: docName } );
	loading = this.documentStore.load( docName ).then( function ( change ) {
		documentStore.logger.logServerEvent( {
			type: 'ProtocolServer#loaded',
			docName: docName,
			length: change.getLength()
		} );
		rebaseServer.updateDocState( docName, null, change );
	} );
	this.loadingForDoc.set( docName, loading );
	return loading;
};

/**
 * Check the client's credentials, and return a connection context object
 *
 * If the client is not recognised and authenticated, a new client ID and token are assigned.
 *
 * @param {string} docName The document name
 * @param {number|null} authorId The author ID, if any
 * @param {number|null} token The secret token, if any
 *
 * @return {Object} The connection context
 */
ve.dm.ProtocolServer.prototype.authenticate = function ( docName, authorId, token ) {
	const state = this.rebaseServer.stateForDoc.get( docName ),
		authorData = state && state.authors.get( authorId );

	if ( !authorData || token !== authorData.token ) {
		authorId = 1 + ( this.lastAuthorForDoc.get( docName ) || 0 );
		this.lastAuthorForDoc.set( docName, authorId );
		token = Math.random().toString( 36 ).slice( 2 );
	}
	const context = {
		serverId: this.documentStore.serverId,
		docName: docName,
		authorId: authorId
	};
	this.logger.logServerEvent( {
		type: 'newClient',
		doc: docName,
		authorId: context.authorId
	} );
	return context;
};

/**
 * Add an event to the log
 *
 * @param {Object} context The connection context
 * @param {Object} event Event data
 */
ve.dm.ProtocolServer.prototype.onLogEvent = function ( context, event ) {
	const ob = {};
	ob.recvTimestamp = this.logger.getRelativeTimestamp();
	ob.clientId = context.authorId;
	ob.doc = context.docName;
	for ( const key in event ) {
		ob[ key ] = event[ key ];
	}
	this.logger.logEvent( ob );
};

/**
 * Setup author on the server and send initialization events
 *
 * @param {Object} context The connection context
 * @param {number} startHeight The height of the common history
 */
ve.dm.ProtocolServer.prototype.welcomeClient = function ( context, startHeight ) {
	const docName = context.docName,
		serverId = context.serverId,
		authorId = context.authorId;

	this.rebaseServer.updateDocState( docName, authorId, null, {
		// TODO: i18n
		name: 'User ' + authorId,
		color: this.constructor.static.palette[
			authorId % this.constructor.static.palette.length
		],
		active: true
	} );

	const state = this.rebaseServer.getDocState( docName );
	const authorData = state.authors.get( authorId );

	context.sendAuthor( 'registered', {
		serverId: serverId,
		authorId: authorId,
		token: authorData.token
	} );
	context.broadcast( 'authorChange', {
		authorId: authorId,
		authorData: {
			name: authorData.name,
			color: authorData.color
		}
	} );
	// HACK Catch the client up on the current state by sending it the entire history
	// Ideally we'd be able to initialize the client using HTML, but that's hard, see
	// comments in the /raw handler. Keeping an updated linmod on the server could be
	// feasible if TransactionProcessor was modified to have a "don't sync, just apply"
	// mode and ve.dm.Document was faked with { data: …, metadata: …, store: … }
	context.sendAuthor( 'initDoc', {
		history: state.history.mostRecent( startHeight ).serialize( true ),
		authors: state.getActiveAuthors()
	} );
};

/**
 * Try to apply a received change, and broadcast the successful portion as rebased
 *
 * @param {Object} context The connection context
 * @param {Object} data The change data
 */
ve.dm.ProtocolServer.prototype.onSubmitChange = function ( context, data ) {
	const change = ve.dm.Change.static.deserialize( data.change, true );
	const applied = this.rebaseServer.applyChange( context.docName, context.authorId, data.backtrack, change );
	if ( !applied.isEmpty() ) {
		this.documentStore.onNewChange( context.docName, applied );
		context.broadcast( 'newChange', applied.serialize( true ) );
	}
};

/**
 * Apply and broadcast an author change
 *
 * @param {Object} context The connection context
 * @param {string} newData The new author data
 */
ve.dm.ProtocolServer.prototype.onChangeAuthor = function ( context, newData ) {
	this.rebaseServer.updateDocState( context.docName, context.authorId, null, {
		name: newData.name,
		color: newData.color
	} );
	context.broadcast( 'authorChange', {
		authorId: context.authorId,
		authorData: {
			name: newData.name,
			color: newData.color
		}
	} );
	this.logger.logServerEvent( {
		type: 'authorChange',
		doc: context.docName,
		authorId: context.authorId,
		authorData: {
			name: newData.name,
			color: newData.color
		}
	} );
};

/**
 * Apply and broadcast a disconnection (which may be temporary)
 *
 * @param {Object} context The connection context
 */
ve.dm.ProtocolServer.prototype.onDisconnect = function ( context ) {
	this.rebaseServer.updateDocState( context.docName, context.authorId, null, {
		active: false,
		continueBase: null,
		rejections: null
	} );
	context.broadcast( 'authorDisconnect', context.authorId );
	this.logger.logServerEvent( {
		type: 'disconnect',
		doc: context.docName,
		authorId: context.authorId
	} );
};

/*!
 * VisualEditor DataModel PeerJS transport server class.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

'use strict';

/**
 * Transport server for Socket IO transport
 *
 * @constructor
 * @param {number} startHeight Length of shared completeHistory
 */
ve.dm.PeerTransportServer = function VeDmPeerTransportServer( startHeight ) {
	const startTimestamp = Date.now();
	this.startHeight = startHeight;
	this.protocolServer = new ve.dm.ProtocolServer(
		{
			startHeight: startHeight,
			serverId: 'server123',
			load: function () {
				return Promise.resolve(
					ve.dm.Change.static.deserialize( { transactions: [] } )
				);
			},
			onNewChange: function () {
				return Promise.resolve();
			}
		},
		{
			logServerEvent: ( x ) => console.log( x ),
			logEvent: ( x ) => console.log( x ),
			getRelativeTimestamp: () => Date.now() - startTimestamp
		}
	);
	this.connections = [];
};

OO.initClass( ve.dm.PeerTransportServer );

/**
 * Generic connection handler
 *
 * @param {Object} conn The connection
 */
ve.dm.PeerTransportServer.prototype.onConnection = function ( conn ) {
	const context = this.protocolServer.authenticate( 'doc123', null, null ),
		connections = this.connections,
		server = this.protocolServer,
		startHeight = this.startHeight;

	connections.push( conn );

	context.broadcast = function ( type, data ) {
		console.log( 'PeerTransportServer broadcast', type, data );
		var serialized = ve.serialize( data );
		connections.forEach( function ( connection ) {
			connection.send( { type: type, data: serialized } );
		} );
	};
	context.sendAuthor = function ( type, data ) {
		console.log( 'PeerTransportServer sendAuthor', type, data );
		var serialized = ve.serialize( data );
		conn.send( { type: type, data: serialized } );
	};
	conn.on( 'data', function ( data ) {
		const type = data.type;
		if ( type === 'submitChange' ) {
			server.onSubmitChange( context, data.data );
		} else if ( type === 'changeAuthor' ) {
			server.onChangeAuthor( context, data.data );
		} else if ( type === 'disconnect' ) {
			server.onDisconnect( context, data.data );
		} else if ( type === 'logEvent' ) {
			console.log( 'logEvent', data.data );
		} else {
			throw new Error( 'Unknown type "' + type + '"' );
		}
	} );
	conn.on( 'open', function () {
		server.welcomeClient( context, startHeight );
	} );
};

/*!
 * VisualEditor DataModel rebase client class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/**
 * DataModel rebase client
 *
 * @class
 */
ve.dm.RebaseClient = function VeDmRebaseClient() {
	/**
	 * @property {number} authorId Author ID
	 */
	this.authorId = null;

	/**
	 * @property {number} commitLength Offset up to which we know we have no differences with the server
	 */
	this.commitLength = 0;

	/**
	 * @property {number} sentLength Offset up to which we have no unsent changes
	 */
	this.sentLength = 0;

	/**
	 * @property {number} backtrack Number of transactions backtracked (i.e. rejected) since the last send
	 */
	this.backtrack = 0;
};

/* Inheritance */

OO.initClass( ve.dm.RebaseClient );

/* Abstract methods */

/**
 * @abstract
 * @param {number} start Start point for the change
 * @param {boolean} toSubmit If true, mark current selection as sent
 * @return {ve.dm.Change} The change since start in the client's local history
 */
ve.dm.RebaseClient.prototype.getChangeSince = null;

/**
 * @abstract
 * @param {number} backtrack Number of rejected changes backtracked immediately before this change
 * @param {ve.dm.Change} change The change to send
 */
ve.dm.RebaseClient.prototype.sendChange = null;

/**
 * Apply a change to the surface, and add it to the history
 *
 * @abstract
 * @param {ve.dm.Change} change The change to apply
 */
ve.dm.RebaseClient.prototype.applyChange = null;

/**
 * Unapply a change from the surface, and remove it from the history
 *
 * @abstract
 * @param {ve.dm.Change} change The change to unapply
 */
ve.dm.RebaseClient.prototype.unapplyChange = null;

/**
 * Add a change to history, without applying it to the surface
 *
 * @abstract
 * @param {ve.dm.Change} change The change to add
 */
ve.dm.RebaseClient.prototype.addToHistory = null;

/**
 * Remove a change from history, without unapplying it to the surface
 *
 * @abstract
 * @param {ve.dm.Change} change The change to remove
 */
ve.dm.RebaseClient.prototype.removeFromHistory = null;

/**
 * Add an event to the log. Default implementation does nothing; subclasses should override this
 * if they want to collect logs.
 *
 * @param {Object} event Event data
 */
ve.dm.RebaseClient.prototype.logEvent = function () {};

/* Methods */

/**
 * @return {number} Author ID
 */
ve.dm.RebaseClient.prototype.getAuthorId = function () {
	return this.authorId;
};

/**
 * @param {number} authorId Author ID
 */
ve.dm.RebaseClient.prototype.setAuthorId = function ( authorId ) {
	this.authorId = authorId;
};

/**
 * Submit all outstanding changes
 *
 * This will submit all transactions that exist in local history but have not been broadcast
 * by the server.
 */
ve.dm.RebaseClient.prototype.submitChange = function () {
	var change = this.getChangeSince( this.sentLength, true );
	if ( change.isEmpty() ) {
		return;
	}
	// logEvent before sendChange, for the case where the log entry is sent to the server
	// over the same tunnel as the change, so that there's no way the server will log
	// receiving the change before it receives the submitChange message.
	this.logEvent( {
		type: 'submitChange',
		change: change,
		backtrack: this.backtrack
	} );
	this.sendChange( this.backtrack, change );
	this.backtrack = 0;
	this.sentLength += change.getLength();
};

/**
 * Accept a committed change from the server
 *
 * If the committed change is by the local author, then it is already applied to the document
 * and at the correct point in history: just move the commitLength pointer.
 *
 * If the commited change is by a different author, then:
 * - Rebase local uncommitted changes over the committed change
 * - If there is a rejected tail, then apply its inverse to the document
 * - Apply the rebase-transposed committed change to the document
 * - Rewrite history to have the committed change followed by rebased uncommitted changes
 *
 * @param {ve.dm.Change} change The committed change from the server
 */
ve.dm.RebaseClient.prototype.acceptChange = function ( change ) {
	var authorId = change.firstAuthorId(),
		logResult = {};
	if ( !authorId ) {
		return;
	}

	var result;
	var unsent = this.getChangeSince( this.sentLength, false );
	if (
		authorId !== this.getAuthorId() ||
		change.start + change.getLength() > this.sentLength
	) {
		var uncommitted = this.getChangeSince( this.commitLength, false );
		result = ve.dm.Change.static.rebaseUncommittedChange( change, uncommitted );
		if ( result.rejected ) {
			// Undo rejected tail, and mark unsent and backtracked if necessary
			this.unapplyChange( result.rejected );
			uncommitted = uncommitted.truncate( result.rejected.start - uncommitted.start );
			if ( this.sentLength > result.rejected.start ) {
				this.backtrack += this.sentLength - result.rejected.start;
			}
			this.sentLength = result.rejected.start;
		}
		// We are already right by definition about our own selection
		delete result.transposedHistory.selections[ this.getAuthorId() ];
		this.applyChange( result.transposedHistory );
		// Rewrite history
		this.removeFromHistory( result.transposedHistory );
		this.removeFromHistory( uncommitted );
		this.addToHistory( change );
		this.addToHistory( result.rebased );

		this.sentLength += change.getLength();
	}
	this.commitLength += change.getLength();

	// Only log the result if it's "interesting", i.e. we rebased or rejected something of nonzero length
	if ( result ) {
		if ( result.rebased.getLength() > 0 || result.rejected ) {
			logResult.rebased = result.rebased;
			logResult.transposedHistory = result.transposedHistory;
		}
		if ( result.rejected ) {
			logResult.rejected = result.rejected;
		}
	}
	if ( unsent.getLength() > 0 ) {
		logResult.unsent = unsent;
	}
	this.logEvent( ve.extendObject( {
		type: 'acceptChange',
		authorId: authorId,
		change: [ change.start, change.getLength() ]
	}, logResult ) );
};

/*!
 * VisualEditor DataModel SurfaceSynchronizer class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Map */

/**
 * DataModel surface synchronizer.
 *
 * @class
 * @mixins OO.EventEmitter
 * @mixins ve.dm.RebaseClient
 *
 * @constructor
 * @param {ve.dm.Surface} surface Surface model to synchronize
 * @param {string} documentId Document ID
 * @param {Object} [config] Configuration options
 * @cfg {string} [server] IO server
 * @cfg {string} [defaultName] Default username
 */
ve.dm.SurfaceSynchronizer = function VeDmSurfaceSynchronizer( surface, documentId, config ) {
	config = config || {};

	// Mixin constructors
	OO.EventEmitter.call( this );
	ve.dm.RebaseClient.call( this );

	// Properties
	this.surface = surface;
	this.doc = surface.documentModel;
	this.store = this.doc.getStore();
	this.authors = {};
	this.authorSelections = {};
	this.documentId = documentId;

	// Whether the document has been initialized
	this.initialized = false;
	// Whether we are currently synchronizing the model
	this.applying = false;
	this.token = null;
	this.serverId = null;
	this.loadSessionKey();
	this.paused = false;

	// SocketIO events
	if ( !config.peerConnection ) {
		throw new Error( 'Expected config.peerConnection' );
	}
	var conn = this.conn = {
		peerConnection: config.peerConnection,
		handlers: new Map(),
		on: function ( type, handler ) {
			if ( !this.handlers.has( type ) ) {
				this.handlers.set( type, [] );
			}
			this.handlers.get( type ).push( handler );
		},
		send: function ( type, data ) {
			console.log( 'peerConnection send', type, data );
			this.peerConnection.send( { type: type, data: ve.serialize( data ) } );
		},
		disconnect: function () {
			this.peerConnection.close();
		}
	};
	this.conn.peerConnection.on( 'data', function ( data ) {
		var type = data.type;
		if ( typeof type !== 'string' ) {
			throw new Error( 'Expected .type in <' + data + '>' );
		}
		console.log( 'peerConnection on', type, data.data );
		( conn.handlers.get( type ) || [] ).forEach( function ( handler ) {
			handler( data.data );
		} );
	} );

	this.conn.on( 'registered', this.onRegistered.bind( this ) );
	this.conn.on( 'initDoc', this.onInitDoc.bind( this ) );
	this.conn.on( 'newChange', this.onNewChange.bind( this ) );
	this.conn.on( 'authorChange', this.onAuthorChange.bind( this ) );
	this.conn.on( 'authorDisconnect', this.onAuthorDisconnect.bind( this ) );

	var authorData = ve.init.platform.sessionStorage.getObject( 've-collab-author' );
	if ( authorData ) {
		this.changeAuthor( authorData );
	} else if ( config.defaultName ) {
		this.changeAuthor( { name: config.defaultName } );
	}

	// Events
	this.surface.connect( this, {
		history: 'onSurfaceHistory',
		select: 'onSurfaceSelect'
	} );

	this.submitChangeThrottled = ve.debounce( ve.throttle( this.submitChange.bind( this ), 250 ), 0 );
};

/* Inheritance */

OO.mixinClass( ve.dm.SurfaceSynchronizer, OO.EventEmitter );
OO.mixinClass( ve.dm.SurfaceSynchronizer, ve.dm.RebaseClient );

/* Events */

/**
 * @event authorSelect
 * @param {number} authorId The author whose selection has changed
 */

/**
 * @event authorChange
 * @param {number} authorId The author whose data has changed
 */

/**
 * @event wrongDoc
 */

/**
 * @event initDoc
 * @param {Error} error Error, if there was a problem initializing the document
 */

/**
 * @event disconnect
 */

/**
 * @event pause
 * The synchronizer is paused or resumes
 */

/* Methods */

/**
 * Destroy the synchronizer
 */
ve.dm.SurfaceSynchronizer.prototype.destroy = function () {
	this.conn.disconnect();
	this.doc.disconnect( this );
	this.surface.disconnect( this );
	this.initialized = false;
};

/**
 * Pause sending/receiving changes
 */
ve.dm.SurfaceSynchronizer.prototype.pauseChanges = function () {
	if ( this.paused ) {
		return;
	}
	this.paused = true;
	this.queuedChanges = [];
	this.emit( 'pause' );
};

/**
 * Resume sending/receiving changes
 */
ve.dm.SurfaceSynchronizer.prototype.resumeChanges = function () {
	if ( !this.paused ) {
		return;
	}
	this.applying = true;
	try {
		// Don't cache length, as it's not inconceivable acceptChange could
		// cause another change to arrive in some weird setup
		for ( var i = 0; i < this.queuedChanges.length; i++ ) {
			this.acceptChange( this.queuedChanges[ i ] );
		}
	} finally {
		this.applying = false;
	}
	this.paused = false;
	// Schedule submission of unsent local changes, if any
	this.submitChangeThrottled();
	this.emit( 'pause' );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.getChangeSince = function ( start, toSubmit ) {
	var change = this.doc.getChangeSince( start ),
		selection = this.surface.getSelection();
	if ( !selection.equals( this.lastSubmittedSelection ) ) {
		change.selections[ this.getAuthorId() ] = selection;
		if ( toSubmit ) {
			this.lastSubmittedSelection = selection;
		}
	}
	return change;
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.submitChange = function () {
	// Prevent submission before initialization is complete
	if ( !this.initialized ) {
		return;
	}
	// Parent method
	ve.dm.RebaseClient.prototype.submitChange.apply( this, arguments );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.sendChange = function ( backtrack, change ) {
	this.conn.send( 'submitChange', {
		backtrack: this.backtrack,
		change: change.serialize()
	} );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.applyChange = function ( change ) {
	// Author selections are superseded by change.selections, so no need to translate them
	for ( var authorId in change.selections ) {
		authorId = +authorId;
		delete this.authorSelections[ authorId ];
	}
	change.applyTo( this.surface );
	// HACK: After applyTo(), the selections are wrong and applying them could crash.
	// The only reason this doesn't happen is because everything that tries to do that uses setTimeout().
	// Translate the selections that aren't going to be overwritten by change.selections
	this.applyNewSelections( this.authorSelections, change );
	// Apply the overwrites from change.selections
	this.applyNewSelections( change.selections );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.unapplyChange = function ( change ) {
	change.unapplyTo( this.surface );
	// Translate all selections for what we just unapplied
	// HACK: After unapplyTo(), the selections are wrong and applying them could crash.
	// The only reason this doesn't happen is because everything that tries to do that uses setTimeout().
	this.applyNewSelections( this.authorSelections, change.reversed() );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.addToHistory = function ( change ) {
	change.addToHistory( this.doc );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.removeFromHistory = function ( change ) {
	change.removeFromHistory( this.doc );
};

/**
 * @inheritdoc
 */
ve.dm.SurfaceSynchronizer.prototype.logEvent = function ( event ) {
	if ( !this.initialized ) {
		// Do not log before initialization is complete; this prevents us from logging the entire
		// document history during initialization
		return;
	}
	this.conn.send( 'logEvent', ve.extendObject( { sendTimestamp: Date.now() }, event ) );
};

/**
 * Respond to transactions happening on the document. Ignores transactions applied by
 * SurfaceSynchronizer itself.
 */
ve.dm.SurfaceSynchronizer.prototype.onSurfaceHistory = function () {
	if ( this.applying || !this.initialized || this.paused ) {
		// Ignore our own synchronization or initialization transactions
		return;
	}
	var change = this.getChangeSince( this.sentLength, true );
	var authorId = this.authorId;
	// HACK annotate transactions with authorship information
	// This relies on being able to access the transaction object by reference;
	// we should probably set the author deeper in dm.Surface or dm.Document instead.
	change.transactions.forEach( function ( tx ) {
		tx.authorId = authorId;
	} );
	// TODO deal with staged transactions somehow
	this.applyNewSelections( this.authorSelections, change );
	this.submitChangeThrottled();
};

/**
 * Respond to selection changes.
 */
ve.dm.SurfaceSynchronizer.prototype.onSurfaceSelect = function () {
	if ( this.paused ) {
		return;
	}
	this.submitChangeThrottled();
};

/**
 * Translate incoming selections by change, then apply them and fire authorSelect
 *
 * @param {Object} newSelections Each author (key) maps to a new incoming ve.dm.Selection
 * @param {ve.dm.Change|ve.dm.Transaction} [changeOrTx] Object to translate over, if any
 * @fires authorSelect
 */
ve.dm.SurfaceSynchronizer.prototype.applyNewSelections = function ( newSelections, changeOrTx ) {
	var change = changeOrTx instanceof ve.dm.Change ? changeOrTx : null,
		tx = changeOrTx instanceof ve.dm.Transaction ? changeOrTx : null;
	for ( var authorId in newSelections ) {
		authorId = +authorId;
		if ( authorId === this.authorId ) {
			continue;
		}
		var translatedSelection;
		if ( change ) {
			translatedSelection = newSelections[ authorId ].translateByChange( change, authorId );
		} else if ( tx ) {
			translatedSelection = newSelections[ authorId ].translateByTransactionWithAuthor( tx, authorId );
		} else {
			translatedSelection = newSelections[ authorId ];
		}
		if ( !translatedSelection.equals( this.authorSelections[ authorId ] ) ) {
			// This works correctly even if newSelections === this.authorSelections
			this.authorSelections[ authorId ] = translatedSelection;
			this.emit( 'authorSelect', authorId );
		}
	}
};

/**
 * Get author data object
 *
 * @param {number} [authorId] Author ID, defaults to current author
 * @return {Object} Author object, containing 'name' and 'color'
 */
ve.dm.SurfaceSynchronizer.prototype.getAuthorData = function ( authorId ) {
	if ( authorId === undefined ) {
		authorId = this.getAuthorId();
	}
	return this.authors[ authorId ];
};

ve.dm.SurfaceSynchronizer.prototype.onAuthorChange = function ( data ) {
	this.authors[ data.authorId ] = data.authorData;
	this.emit( 'authorChange', data.authorId );

	if ( data.authorId === this.getAuthorId() ) {
		ve.init.platform.sessionStorage.setObject( 've-collab-author', data.authorData );
	}
};

ve.dm.SurfaceSynchronizer.prototype.changeAuthor = function ( data ) {
	this.conn.send( 'changeAuthor', ve.extendObject( {}, this.getAuthorData( this.getAuthorId() ), data ) );
};

ve.dm.SurfaceSynchronizer.prototype.onAuthorDisconnect = function ( authorId ) {
	delete this.authors[ authorId ];
	delete this.authorSelections[ authorId ];
	this.emit( 'authorDisconnect', authorId );
};

/**
 * Respond to a "registered" event from the server
 *
 * @param {Object} data
 * @param {number} data.authorId The author ID allocated by the server
 * @param {string} data.token
 * @fires wrongDoc
 */
ve.dm.SurfaceSynchronizer.prototype.onRegistered = function ( data ) {
	if ( this.serverId && this.serverId !== data.serverId ) {
		this.conn.disconnect();
		this.emit( 'wrongDoc' );
		return;
	}
	this.serverId = data.serverId;
	this.setAuthorId( data.authorId );
	this.surface.setAuthorId( this.authorId );
	this.token = data.token;
	this.saveSessionKey();
};

ve.dm.SurfaceSynchronizer.prototype.saveSessionKey = function () {
	ve.init.platform.sessionStorage.setObject( 'visualeditor-session-key', {
		serverId: this.serverId,
		docName: this.documentId,
		authorId: this.getAuthorId(),
		token: this.token
	} );
};

ve.dm.SurfaceSynchronizer.prototype.loadSessionKey = function () {
	var data = ve.init.platform.sessionStorage.getObject( 'visualeditor-session-key' );
	if ( data && data.docName === this.documentId ) {
		this.serverId = data.serverId;
		this.setAuthorId( data.authorId );
		this.token = data.token;
	}
};

/**
 * Respond to an initDoc event from the server, catching us up on the prior history of the document.
 *
 * @param {Object} data
 * @param {Object} data.history Serialized change representing the server's history
 * @param {Object} data.authors Object mapping author IDs to author data objects (name/color)
 * @fires initDoc
 */
ve.dm.SurfaceSynchronizer.prototype.onInitDoc = function ( data ) {
	if ( this.initialized ) {
		// Ignore attempt to initialize a second time
		return;
	}
	for ( var authorId in data.authors ) {
		this.onAuthorChange( {
			authorId: +authorId,
			authorData: data.authors[ authorId ]
		} );
	}
	try {
		var history = ve.dm.Change.static.deserialize( data.history );
		this.acceptChange( history );
	} catch ( e ) {
		this.conn.disconnect();
		this.emit( 'initDoc', e );
		return;
	}
	this.emit( 'initDoc' );

	// Mark ourselves as initialized and retry any prevented submissions
	this.initialized = true;
	this.submitChangeThrottled();
};

/**
 * Respond to a newChange event from the server, signalling a newly committed change
 *
 * If the commited change is by another author, then:
 * - Rebase uncommitted changes over the committed change
 * - If there is a rebase rejection, then apply its inverse to the document
 * - Apply the rebase-transposed committed change to the document
 * - Rewrite history to have the committed change followed by rebased uncommitted changes
 *
 * If the committed change is by the local author, then it is already applied to the document
 * and at the correct point in the history: just move the commit pointer.
 *
 * @param {Object} serializedChange Serialized ve.dm.Change that the server has applied
 */
ve.dm.SurfaceSynchronizer.prototype.onNewChange = function ( serializedChange ) {
	var change = ve.dm.Change.static.deserialize( serializedChange );
	if ( this.paused ) {
		this.queuedChanges.push( change );
		return;
	}
	// Make sure we don't attempt to submit any of the transactions we commit while manipulating
	// the state of the document
	this.applying = true;
	try {
		this.acceptChange( change );
	} finally {
		this.applying = false;
	}
	// Schedule submission of unsent local changes, if any
	this.submitChangeThrottled();
};

ve.dm.SurfaceSynchronizer.prototype.onDisconnect = function () {
	this.initialized = false;
	this.emit( 'disconnect' );
};

/*!
 * VisualEditor UserInterface AuthorItemWidget class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
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
	this.name = null;
	this.color = null;

	this.$color = $( '<div>' ).addClass( 've-ui-authorItemWidget-color' );
	this.$element.append( this.$color );

	if ( this.editable ) {
		this.input = new OO.ui.TextInputWidget( {
			classes: [ 've-ui-authorItemWidget-nameInput' ],
			placeholder: ve.msg( 'visualeditor-rebase-client-author-name' )
		} );
		// Re-emit change events
		this.input.on( 'change', this.emit.bind( this, 'change' ) );

		this.colorPicker = new CP( this.$color[ 0 ] );
		this.colorPicker.on( 'change', function ( color ) {
			item.color = color;
			item.$color.css( 'background-color', '#' + color );
		} );
		this.colorPicker.on( 'exit', function () {
			if ( item.color !== null ) {
				item.emit( 'changeColor', item.color );
			}
		} );

		this.colorPicker.picker.classList.add( 've-ui-authorItemWidget-colorPicker' );
		this.colorPicker.fit = function () {
			this.picker.style.left = item.$element[ 0 ].offsetLeft + 'px';
			this.picker.style.top = item.$element[ 0 ].offsetTop + 'px';
			$overlay[ 0 ].appendChild( this.picker );
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
 * Focus the widget, if possible
 */
ve.ui.AuthorItemWidget.prototype.focus = function () {
	if ( this.editable ) {
		this.input.focus();
	}
};

/**
 * Get the user's name
 *
 * @return {string} User's name
 */
ve.ui.AuthorItemWidget.prototype.getName = function () {
	if ( this.editable ) {
		return this.input.getValue();
	} else {
		return this.name;
	}
};

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
	var authorData = this.synchronizer.getAuthorData( this.authorId );
	this.name = authorData.name;
	this.color = authorData.color;
	this.$color.css( 'background-color', '#' + this.color );

	if ( this.editable ) {
		this.input.setValue( this.name );
		this.colorPicker.set( '#' + this.color );
	} else {
		// TODO: Handle empty names with a message
		this.setLabel( this.name || '…' );
	}
};

/*!
 * VisualEditor UserInterface AuthorListPopupTool class.
 *
 * @copyright 2011-2020 VisualEditor Team and others; see http://ve.mit-license.org
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * UserInterface AuthorListPopupTool
 *
 * @class
 * @extends OO.ui.PopupTool
 *
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config]
 */
ve.ui.AuthorListPopupTool = function VeUiAuthorListPopupTool( toolGroup, config ) {
	this.$authorList = $( '<div>' );

	// Parent constructor
	ve.ui.AuthorListPopupTool.super.call( this, toolGroup, ve.extendObject( {
		popup: {
			classes: [ 've-ui-authorListWidget-listPopup' ],
			$content: this.$authorList,
			padded: true,
			align: 'backwards'
		}
	}, config ) );

	// Events
	this.toolbar.connect( this, { surfaceChange: 'onSurfaceChange' } );

	this.$element.addClass( 've-ui-authorListPopupTool' );
};

/* Inheritance */

OO.inheritClass( ve.ui.AuthorListPopupTool, OO.ui.PopupTool );

/* Methods */

/**
 * Handle surfaceChange event fromt the toolbar
 *
 * @param {ve.dm.Surface|null} oldSurface Old surface
 * @param {ve.dm.Surface|null} newSurface New surface
 */
ve.ui.AuthorListPopupTool.prototype.onSurfaceChange = function ( oldSurface, newSurface ) {
	// TODO: Disconnect oldSurface. Currently in the CollabTarget life-cycle the surface is never changed.
	this.setup( newSurface );
};

/**
 * @inheritdoc
 */
ve.ui.AuthorListPopupTool.prototype.onPopupToggle = function ( visible ) {
	// Parent method
	ve.ui.AuthorListPopupTool.super.prototype.onPopupToggle.apply( this, arguments );

	if ( visible ) {
		this.selfItem.focus();
	}
};

/**
 * Setup the popup which a specific surface
 *
 * @param {ve.ui.Surface} surface
 */
ve.ui.AuthorListPopupTool.prototype.setup = function ( surface ) {
	this.oldName = '';
	this.updatingName = false;
	this.synchronizer = surface.getModel().synchronizer;
	this.authorItems = {};

	this.surface = surface;

	if ( !this.synchronizer ) {
		this.setDisabled( true );
		return;
	}

	// TODO: Unbind from an existing surface if one is set

	this.changeNameDebounced = ve.debounce( this.changeName.bind( this ), 250 );

	this.selfItem = new ve.ui.AuthorItemWidget(
		this.synchronizer,
		this.popup.$element,
		{ editable: true, authorId: this.synchronizer.getAuthorId() }
	);
	this.$authorList.prepend( this.selfItem.$element );
	this.selfItem.connect( this, {
		change: 'onSelfItemChange',
		changeColor: 'onSelfItemChangeColor'
	} );

	this.synchronizer.connect( this, {
		authorChange: 'onSynchronizerAuthorUpdate',
		authorDisconnect: 'onSynchronizerAuthorDisconnect'
	} );

	for ( var authorId in this.synchronizer.authors ) {
		this.onSynchronizerAuthorUpdate( +authorId );
	}
};

/**
 * Handle change events from the user's authorItem
 *
 * @param {string} value
 */
ve.ui.AuthorListPopupTool.prototype.onSelfItemChange = function () {
	if ( !this.updatingName ) {
		this.changeNameDebounced();
	}
};

/**
 * Handle change color events from the user's authorItem
 *
 * @param {string} color
 */
ve.ui.AuthorListPopupTool.prototype.onSelfItemChangeColor = function ( color ) {
	this.synchronizer.changeAuthor( { color: color } );
};

/**
 * Notify the server of a name change
 */
ve.ui.AuthorListPopupTool.prototype.changeName = function () {
	this.synchronizer.changeAuthor( { name: this.selfItem.getName() } );
};

/**
 * Update the user count
 */
ve.ui.AuthorListPopupTool.prototype.updateAuthorCount = function () {
	this.setTitle( ( Object.keys( this.authorItems ).length + 1 ).toString() );
};

/**
 * Called when the synchronizer receives a remote author selection or name change
 *
 * @param {number} authorId The author ID
 */
ve.ui.AuthorListPopupTool.prototype.onSynchronizerAuthorUpdate = function ( authorId ) {
	var authorItem = this.authorItems[ authorId ];

	if ( authorId !== this.synchronizer.getAuthorId() ) {
		if ( !authorItem ) {
			authorItem = new ve.ui.AuthorItemWidget( this.synchronizer, this.popup.$element, { authorId: authorId } );
			this.authorItems[ authorId ] = authorItem;
			this.updateAuthorCount();
			this.$authorList.append( authorItem.$element );
		} else {
			authorItem.update();
		}
	} else {
		// Don't update nameInput if the author is still changing it
		if ( this.selfItem.getName() === this.oldName ) {
			// Don't send this "new" name back to the server
			this.updatingName = true;
			try {
				this.selfItem.setAuthorId( this.synchronizer.getAuthorId() );
				this.selfItem.update();
			} finally {
				this.updatingName = false;
			}
		}
	}
	this.oldName = this.synchronizer.getAuthorData( authorId ).name;
};

/**
 * Called when the synchronizer receives a remote author disconnect
 *
 * @param {number} authorId The author ID
 */
ve.ui.AuthorListPopupTool.prototype.onSynchronizerAuthorDisconnect = function ( authorId ) {
	var authorItem = this.authorItems[ authorId ];
	if ( authorItem ) {
		authorItem.$element.remove();
		delete this.authorItems[ authorId ];
		this.updateAuthorCount();
	}
};

/* Static Properties */

ve.ui.AuthorListPopupTool.static.name = 'authorList';
ve.ui.AuthorListPopupTool.static.group = 'utility';
ve.ui.AuthorListPopupTool.static.icon = 'userAvatar';
ve.ui.AuthorListPopupTool.static.title = '1';
ve.ui.AuthorListPopupTool.static.autoAddToCatchall = false;
ve.ui.AuthorListPopupTool.static.autoAddToGroup = false;
ve.ui.AuthorListPopupTool.static.displayBothIconAndLabel = true;

/* Registration */

ve.ui.toolFactory.register( ve.ui.AuthorListPopupTool );

/*!
 * VisualEditor fake PeerJS class.
 *
 * For convenient debugging. Create two FakePeers in one browser window. Then a single
 * debugger can see all the communication within its call stack.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Map */
/* global Promise */

ve.FakePeer = function veFakePeer() {
	this.id = 'p' + this.constructor.static.peers.length;
	this.constructor.static.peers.push( this );
	this.connections = [];
	this.handlers = new Map();
	Promise.resolve( this.id ).then( this.callHandlers.bind( this, 'open' ) );
};

/* Initialization */

OO.initClass( ve.FakePeer );

/* Static properties */

ve.FakePeer.static.peers = [];

ve.FakePeer.static.test = function ( fake ) {
	function mkPeer() {
		if ( fake ) {
			return new ve.FakePeer();
		} else {
			return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
		}
	}
	window.p0 = mkPeer();
	p0.on( 'open', function ( p0Id ) {
		console.log( 'p0open', p0Id );
		window.p1 = mkPeer();
		p1.on( 'open', function ( id ) {
			console.log( 'p1open', id );
			window.conn1 = p1.connect( p0Id );
			conn1.on( 'open', function () {
				console.log( 'conn1open' );
			} );
			conn1.on( 'data', function ( data ) {
				console.log( 'conn1data', data );
			} );
		} );
	} );
	p0.on( 'connection', function ( conn0 ) {
		console.log( 'p0conn' );
		window.conn0 = conn0;
		conn0.on( 'open', function () {
			console.log( 'conn0open' );
			conn0.send( 'hello' );
		} );
		conn0.on( 'data', function ( data ) {
			console.log( 'conn0data', data );
		} );
	} );
};

/* Methods */

ve.FakePeer.prototype.on = function ( ev, f ) {
	var handlers = this.handlers.get( ev );
	if ( !handlers ) {
		handlers = [];
		this.handlers.set( ev, handlers );
	}
	handlers.push( f );
};

ve.FakePeer.prototype.callHandlers = function ( type ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	console.log( 've.FakePeer', this.id, type, args );
	( this.handlers.get( type ) || [] ).forEach( function ( handler ) {
		handler.apply( null, args );
	} );
};

ve.FakePeer.prototype.connect = function ( id ) {
	var peer = this.constructor.static.peers.filter( function ( peer ) {
		return peer.id === id;
	} )[ 0 ];
	if ( !peer ) {
		throw new Error( 'Unknown id: ' + id );
	}
	var thisConn = new ve.FakePeerConnection( peer.id + '-' + this.id, peer );
	var peerConn = new ve.FakePeerConnection( this.id + '-' + peer.id, this );
	thisConn.other = peerConn;
	peerConn.other = thisConn;
	this.connections.push( thisConn );
	peer.connections.push( peerConn );
	Promise.resolve( peerConn ).then( peer.callHandlers.bind( peer, 'connection' ) );
	Promise.resolve( thisConn.id ).then( thisConn.callHandlers.bind( thisConn, 'open' ) );
	Promise.resolve( peerConn.id ).then( peerConn.callHandlers.bind( peerConn, 'open' ) );
	return thisConn;
};

ve.FakePeerConnection = function VeFakePeerConnection( id, peer ) {
	this.id = id;
	this.peer = peer;
	this.other = null;
	this.handlers = new Map();
};

OO.initClass( ve.FakePeerConnection );

ve.FakePeerConnection.prototype.on = function ( ev, f ) {
	var handlers = this.handlers.get( ev );
	if ( !handlers ) {
		handlers = [];
		this.handlers.set( ev, handlers );
	}
	handlers.push( f );
};

ve.FakePeerConnection.prototype.callHandlers = function ( type ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	console.log( 've.FakePeerConnection', this.id, type, args );
	( this.handlers.get( type ) || [] ).forEach( function ( handler ) {
		handler.apply( null, args );
	} );
};

ve.FakePeerConnection.prototype.setOther = function ( other ) {
	this.other = other;
	Promise.resolve( this.id ).then( this.callHandlers.bind( this, 'open' ) );
};

ve.FakePeerConnection.prototype.send = function ( data ) {
	Promise.resolve( data ).then( this.other.callHandlers.bind( this.other, 'data' ) );
};

/*!
 * VisualEditor PeerJS extensions.
 *
 * @copyright 2011-2022 VisualEditor Team and others; see http://ve.mit-license.org
 */

/* global Peer */

/**
 * Recursively serialize objects into plain data.
 *
 * Non-plain objects must have a .serialize or .toJSON method.
 *
 * @param {Object|Array} value The value to serialize
 * @return {Object|Array} The serialized version
 */
ve.serialize = function ( value ) {
	if ( Array.isArray( value ) ) {
		return value.map( function ( item ) {
			return ve.serialize( item );
		} );
	} else if ( value === null || typeof value !== 'object' ) {
		return value;
	} else if ( value.constructor === Object ) {
		var serialized = {};
		for ( var property in value ) {
			serialized[ property ] = ve.serialize( value[ property ] );
		}
		return serialized;
	} else if ( typeof value.serialize === 'function' ) {
		return ve.serialize( value.serialize() );
	} else if ( typeof value.toJSON === 'function' ) {
		return ve.serialize( value.toJSON() );
	}
	throw new Error( 'Cannot serialize ' + value );
};


ve.dm.Surface.prototype.newPeer = function () {
	// To use the public PeerJS server:
	return new Peer();
	// To use a local PeerJS server:
	// return new Peer( undefined, { host: 'localhost', port: 9000, path: '/myapp' } );
	// To use a ve.FakePeer (for debugging):
	// return new ve.FakePeer();
};

ve.dm.Surface.prototype.initPeerServer = function () {
	var surface = this;

	ve.dm.peerServer = new ve.dm.PeerTransportServer( this.documentModel.completeHistory.getLength() );
	if ( this.documentModel.completeHistory.transactions.length > 0 ) {
		this.documentModel.completeHistory.transactions[ 0 ].authorId = 1;
	}
	ve.dm.peerServer.protocolServer.rebaseServer.updateDocState(
		'doc123',
		1,
		ve.dm.Change.static.deserialize(
			this.documentModel.completeHistory.serialize(),
			true
		),
		this.documentModel.completeHistory,
		{}
	);
	ve.dm.peerServer.peer = this.newPeer();
	ve.dm.peerServer.peer.on( 'open', function ( id ) {
		/* eslint-disable-next-line no-console */
		console.log( 'Open, Now in another browser window, do:\nve.init.target.surface.model.initPeerClient( \'' + id + '\' );' );
		surface.initPeerClient( id );
	} );
	ve.dm.peerServer.peer.on( 'connection', function ( conn ) {
		ve.dm.peerServer.onConnection( conn );
	} );
};

ve.dm.Surface.prototype.initPeerClient = function ( serverId ) {
	var surface = this,
		peerClient = this.newPeer();
	if ( surface.documentModel.completeHistory.transactions.length > 0 ) {
		surface.documentModel.completeHistory.transactions[ 0 ].authorId = 1;
	}
	peerClient.on( 'open', function ( /* id */ ) {
		var conn = peerClient.connect( serverId );
		conn.on( 'open', function () {
			surface.createSynchronizer( 'foo', { peerConnection: conn } );
			surface.synchronizer.commitLength = surface.documentModel.completeHistory.getLength();
			surface.synchronizer.sentLength = surface.documentModel.completeHistory.getLength();
		} );
	} );
};

ve.collab = function () {
	OO.ui.prompt(
		'Enter collab session to join (blank to start a new one)',
		{
			textInput: { placeholder: '[session-id-goes-here]' },
			size: 'medium'
		}
	).then( function( id ) {
		if ( id === null ) {
			return;
		}
		if ( id !== '' ) {
			ve.init.target.surface.model.initPeerClient( id );
			return;
		} else {
			ve.init.target.surface.model.initPeerServer();
			ve.dm.peerServer.peer.on( 'open', function ( id ) {
				OO.ui.alert( 'Share this sesion ID: ' + id, { size: 'medium' } );
			} );
		}
	} );
};

} () );
