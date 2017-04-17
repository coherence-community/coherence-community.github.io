/**
 * Generates the Coherence Releases RSS Feed XML document from the product JSON document
 *
 * To run this file you need Node.js installed. Refer to https://nodejs.org/download/
 *
 * Once you have Node.js installed you can run this and pass two arguments:
 *
 * - the products.json file
 * - the xml feed file to create (typically releases.xml)
 */

var generateReleasesModule = (function () {

    // private
    var inputFile  = '';
    var outputFile = '';

    var fs = require('fs');

    function doConversion() {
       fs.stat(outputFile, function(error, stauts) {
           if (!error) {
               console.log('Output file ' + outputFile + ' already exists, please remove it');
           }
           else {
               console.log("converting file " + inputFile + ' to ' + outputFile);

               fs.readFile(inputFile, 'utf8', function(error, data) {
                   if (error) {
                       console.log('Unable to read file ' + inputFile + ' : ' + error.message);
                   }
                   else {
                       outputXML(data);
                   }
               });
           }
       } );
    }

    // create a JavaScript Date based on a reverse formatted string date (YYYY-MM-DD)
    function asDate(reverseDateStrign) {
        var dateParts = reverseDateStrign.split('-');
        return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    }

    // generate feed XML
    function outputXML(data) {
        try {
            // create an array of release downloads based on product releases and patches
            var releases = [];

            JSON.parse(data).forEach(function(product) {
                // add each product itself as a release
                releases.push({
                    "date": asDate(product.date),
                    "identity": product.version,
                    "name": product.name + " " + product.version,
                    "url": product.productUrl
                });

                product.platforms.forEach(function(platform) {
                    // add all of the product patches as release downloads
                    if (platform.patches) {
                        platform.patches.forEach(function (patch) {
                            // add the patch as a release download
                            releases.push({
                                "date": asDate(patch.date),
                                "identity": patch.number,
                                "name": product.name + " " + platform.name + " " + patch.version,
                                "url": "https://updates.oracle.com/Orion/PatchDetails/process_form?patch_num=" + patch.number
                            });
                        });
                    }
                });
            });

            // sort the release downloads by date
            releases.sort(function(x, y) {
                return y.date - x.date;
            });

            // generate an RSS feed xml document based on the release downloads
            var xmlFeed = '<?xml version="1.0"?>\n' +
                '<rss version="2.0">\n' +
                '  <channel>\n' +
                '    <title>Coherence Releases Feed</title>\n' +
                '    <description>Coherence Releases</description>\n' +
                '    <pubDate>' + new Date().toUTCString() + '</pubDate>\n' +
                '    <generator>https://coherence-community.github.io/</generator>\n';

            releases.forEach(function(release) {
                xmlFeed += '    <item>\n' +
                           '      <title>' + release.name + '</title>\n' +
                           '      <link>' + release.url + '</link>\n' +
                           '      <guid isPermaLink="false">' + release.identity + '</guid>\n' +
                           '      <pubDate>' + release.date.toUTCString() + '</pubDate>\n' +
                           '    </item>\n';
            });

            xmlFeed += '  </channel>\n</rss>';

            fs.writeFile(outputFile, xmlFeed, function(error) {
                if (error) {
                    console.log('Error writing to file ' + outputFile + ' : ' + error.message);
                }
                else {
                    console.log('Output written to ' + outputFile);
                }
            });

            }
        catch(err) {
           console.log('Error processing file ' + inputFile + ' ' + err.message);
        }
    }

    // public
    return {
        convertFile: function(input, output) {
            inputFile  = input;
            outputFile = output;
            if (inputFile == '' || outputFile == '') {
                console.log('You must supply both inputFile and outputFile');
            }
            else {
                // validate files
                fs.stat(inputFile, function(error, status) {
                    if (error) {
                        console.log('File ' + inputFile + ' was not able to be read');
                        return;
                    }
                    else {
                        doConversion();
                    }
                });
            }
        }
    }

})();

if (process.argv.length != 4) {
    console.log('You must supply both inputFile and outputFile');
    console.log('Usage: ' + process.argv[0] + ' generate-releases-rss.js ../json/products.json ../rss/releases.xml');
}
else {
    generateReleasesModule.convertFile(process.argv[2], process.argv[3]);
}