/*global module:false*/
module.exports = function(grunt) {

    var SPACE_NAME = 'cogs';
    var EXT_JS = '.js';
    var EXT_JS_MIN = '.min' + EXT_JS;
    var FILE_NAME_OUT_MAX = SPACE_NAME + EXT_JS;
    var FILE_NAME_OUT_MIN = SPACE_NAME + EXT_JS_MIN;
    var FILE_NAME_ENTRY = 'cogs';

    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-bumpup");
    grunt.loadNpmTasks("grunt-tagrelease");

    grunt.config.init({
        requirejs : {
            dist : {
                options : {
                    baseUrl: './src',
                    name: '../node_modules/almond/almond',
                    include: FILE_NAME_ENTRY,
                    out: FILE_NAME_OUT_MAX,
                    wrap: {
                        start: 
                            "(function() { \n" + 
                            "var global = new Function('return this')();" + 
                            "var parentDefine = global.define || (function(factory){ " + 
                                "var ret = factory();" +
                                "typeof module != 'undefined' && (module.exports = ret) ||" +
                                "(global." + SPACE_NAME + " = ret); }) ;",
                        end: 
                            "parentDefine(function() { return require('" + SPACE_NAME + "'); }); \n" + 
                            "}());"
                    },
                    optimize : "none"
                }
            }
        },
        uglify : {
            options : {
                banner : '/* http://github.com/normanzb/ */',
            },
            dist : {
                src : [ FILE_NAME_OUT_MAX ],
                dest : FILE_NAME_OUT_MIN
            }
        },
        bumpup: {
            files: ['package.json', 'bower.json']
        },
        tagrelease: {
            file: 'package.json',
            commit:  true,
            message: 'Release %version%',
            prefix:  '',
            annotate: false
        }
    });

    grunt.registerTask("dist", "requirejs:dist uglify".split(' '));
    grunt.registerTask("default", "dist".split(' '));
    grunt.registerTask("release", function (type) {
        
        if (type != null && type != false){
            grunt.task.run('bumpup:' + type);
            grunt.task.run('tagrelease');
        }

        grunt.task.run('dist');
    });
};