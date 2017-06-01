var File = require('vinyl');
var mapStream = require('map-stream');

function createCodeStream(code, type) {
    var buf = new Buffer(code);
    var file = new File({
        contents: buf,
        path: 'current-file.' + type,
        stat: {
            size: buf.length
        }
    });

    return mapStream(function (chunk, cb) {
        cb(null, file);
    });
};

exports.createCodeStream = createCodeStream;
