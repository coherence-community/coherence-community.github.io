/**
 * Define the community module (without dependencies) as a closure
 */
(function(){
    var app = angular.module('community', []);

    app.controller('CoherenceController', ['$http', function($http) {

        // define 'self' as a means of referring to this controller in other scopes
        var self = this;

        // initially empty so the page can render while we download/process the products in the background
        this.products = [];
        this.releases = [];
        this.articles = [];   

        // asynchronously fetch and process the products json document
        $http.get('json/products.json').success(function(data) {

            // remember the products
            self.products = data;

            // derive all of the releases (major and patches) for all platforms
            self.products.forEach(function(product) {

                // add the product as a release
                self.releases.push({
                    "date": product.date,
                    "name": product.name + " " + product.version,
                    "url" : product.productUrl
                });

                // add all of the platform patches as releases
                product.platforms.forEach(function(platform) {
                    if (platform.patches)
                    {
                        platform.patches.forEach(function(patch) {
                            self.releases.push({
                                "date": patch.date,
                                "name": product.name + " " + platform.name + " " + patch.version,
                                "url" : "https://updates.oracle.com/Orion/PatchDetails/process_form?patch_num=" + patch.number
                            });
                        });
                    }
                });
            });
        });

        // asynchronously fetch and process the RSS feed articles
        var feedURL = "https://feeds.feedblitz.com/oraclecoherence&x=1";
        var url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(feedURL) + "&format=json&diagnostics=true&callback=JSON_CALLBACK";

        $http.jsonp(url).success(function(response) {
            response.items.forEach(function(item) {
                self.articles.push({
                    "date"  : item.pubDate,
                    "title" : item.title,
                    "url"   : item.link
                });
            });
        });
    }]);
})();