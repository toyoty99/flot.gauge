module.exports = function (grunt) {
    var pkg = grunt.file.readJSON("package.json");
    grunt.initConfig({
        clean: [
            "jquery.flot.gauge.js",
            "jquery.flot.gauge.min.js",
            "dest/*.js",
            "doc/*"
        ],
        ect: {
            nodebug: {
                src: "src/jquery.flot.gauge.ect",
                dest: "dest/jquery.flot.gauge.nodebug.js",
                variables: {
                    debug: "nodebug",
                    version: pkg.version
                }
            },
            debug: {
                src: "src/jquery.flot.gauge.ect",
                dest: "dest/jquery.flot.gauge.debug.js",
                variables: {
                    debug: "debug",
                    version: pkg.version
                }
            }
        },
        removelogging: {
            dist: {
                src: "dest/jquery.flot.gauge.nodebug.js",
                dest: "dest/jquery.flot.gauge.nodebug.js",
                options: {
                    namespace: ["logger"],
                    methods: ["log", "debugLayout", "debugCellLayout"]
                }
            }
        },
        copy: {
            main: {
                files: [
                    {
                        src: "dest/jquery.flot.gauge.debug.js",
                        dest: "jquery.flot.gauge.js"
                    }
                ]
            }
        },
        yuidoc: {
            compile: {
                name: pkg.name,
                description: pkg.description,
                version: pkg.version,
                url: pkg.homepage,
                options: {
                    paths: ".",
                    exclude: "src,dest",
                    outdir: "doc/"
                }
            }
        },
        uglify: {
            dist: {
                files: {
                    "jquery.flot.gauge.min.js": "dest/jquery.flot.gauge.nodebug.js"
                },
                options: {
                    sourceMap: true,
                    sourceMapName: "jquery.flot.gauge.min.map",
                    sourceMapIncludeSources: true,
                    preserveComments: "some"
                }
            }
        }
    });

    for (var taskName in pkg.devDependencies) {
        if (taskName.substring(0, 6) == "grunt-") {
            console.log("loadNpmTasks: ", taskName);
            grunt.loadNpmTasks(taskName);
        }
    }
    grunt.registerTask("default", [
        "clean",
        "ect",
        "removelogging",
        "copy",
        "yuidoc",
        "uglify"
    ]);
};