"use strict";

var File = require("vinyl");
var through = require("through2");

describe("gulp-es3ify", function () {
    var es3ify = require("../index.js");

    function testIO (fixture, expected) {
        return function () {
            var actualStream = es3ify();
            actualStream.write(new File({
                path: "foo",
                contents: new Buffer(fixture),
            }));

            var expectedStream = es3ify();
            expectedStream.write(new File({
                path: "foo",
                contents: new Buffer(expected),
            }));

            process.nextTick(function () {
                actualStream.end();
                expectedStream.end();
            });

            return actualStream.should.produce.sameFilesAs(expectedStream);
        };
    }

    it("should quote property keys", testIO(
        "x = {dynamic: 0, static: 17};",
        "x = {dynamic: 0, \"static\": 17};"
    ));

    it("should quote member properties", testIO(
        "x.dynamic++; x.static++;",
        "x.dynamic++; x[\"static\"]++;"
    ));

    it("should remove trailing commas in arrays", testIO(
        "[2, 3, 4,]",
        "[2, 3, 4]"
    ));

    it("should keep comments near a trailing comma", testIO(
        "[2, 3, 4 /* = 2^2 */,// = 6 - 2\n]",
        "[2, 3, 4 /* = 2^2 */// = 6 - 2\n]"
    ));

    it("should remove trailing commas in objects", testIO(
        "({x: 3, y: 4,})",
        "({x: 3, y: 4})"
    ));

    it("should transform everything at once", testIO(
        "({a:2,\tfor :[2,,3,],}\n.class)",
        "({a:2,\t\"for\" :[2,,3]}[\n\"class\"])"
    ));

    it("should pass through empty files", function (callback) {
        var stream = es3ify();

        stream.on("data", function (file) {
            file.path.should.equal("foo");
            callback();
        });

        stream.write(new File({ path: "foo" }));
    });

    it("should throw when streaming is attempted", function () {
        void function () {
            var stream = es3ify();
            stream.write(new File({
                path: "foo",
                contents: through(),
            }));
        }.should.throw();
    });
});
