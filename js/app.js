// Initial locations to be displayed on the map
var initial_locations = [
    {
        name: 'St David\'s Hall',
        lat: 51.480072,
        lng: -3.176810
    },
    {
        name: 'National Museum Cardiff',
        lat: 51.485538,
        lng: -3.177095
    },
    {
        name: 'Cardiff University',
        lat: 51.487680,
        lng: -3.179007
    },
    {
        name: 'Doctor Who Experience',
        lat: 51.459581,
        lng: -3.160565
    },
    {
        name: 'IKEA',
        lat: 51.462682,
        lng: -3.188887
    },
    {
        name: 'Castle Works',
        lat: 51.470568,
        lng: -3.157978
    },
    {
        name: 'Celsa Manufacturing, UK',
        lat: 51.478975,
        lng: -3.138676
    },
    {
        name: 'Wales Millennium Centre',
        lat: 51.464819,
        lng: -3.163374
    }
];

// Foursquare object to make API calls
var Foursquare = {
    client_id: "QI5OKZDK4BE0HO4L03UZ5WCVXA4ZZJSSWUFZMLNLFUZ2BMOY",
    client_secret: "SVFFAS4G3GOCZNPELDWPBTPKEPKA5OJE545D4CUXBGIGGFSV",

    foursquare_url: function(name, lat, lng) {
        return "https://api.foursquare.com/v2/venues/search?ll=" + lat + "," + lng + "&client_id=" +
			Foursquare.client_id + "&client_secret=" + Foursquare.client_secret + "&v=20160118&query=" + name;
    },

	getInfoWindow: function(marker) {
    	var info = {};
        // Send an API call to foursquare and handle the response
        $.getJSON(Foursquare.foursquare_url(marker.name, marker.lat, marker.lng)).done(function(data) {
            // Get the first result
            var venue = data.response.venues[0];
            // Create an object with useful info
            info = {
                name: venue.name,
                address: venue.location.address,
                city: venue.location.city,
                postal: venue.location.postalCode,
                category: venue.categories.name,
                phone: venue.contact.formattedPhone,
                website: venue.url
            };
			// Set marker info window using this info
            marker.setInfoWindow(info);
        }).fail(function() {
            console.log("Foursquare API call failed.");
            return "";
        });
	}
};

// Marker object
var Marker = function(location, timeout) {
	var self = this;
	self.lat = location.lat;
	self.lng = location.lng;
    self.name = location.name;

    // Create the marker but don't place on map
    self.marker = new google.maps.Marker({
        position: location,
        name: location['name'],
        animation: google.maps.Animation.DROP
    });

    // Creates html info window using given info
    self.setInfoWindow = function(info) {
    	var html = "";
    	for (var key in info) {
    		// Make sure info is defined
    		if (typeof info[key] === 'undefined')
    			continue;
            html += "<div>" + info[key] + "</div>";
        }

    	self.info_window = new google.maps.InfoWindow({
            content: html,
            maxWidth: 500
        });
	};

    // Get location info from foursquare
    Foursquare.getInfoWindow(self);

	// Place marker on a map
	self.setMap = function(map, delay) {
		// After a delay
        setTimeout(function() {
            self.marker.setMap(map);
        }, delay);
        self.map = map;
	};

	// Open info window
    // Reference: https://developers.google.com/maps/documentation/javascript/markers
	self.openInfo = function() {
		if (!self.map)
			return;
		self.info_window.open(self.map, self.marker);
	};

	// Close info window
	self.closeInfo = function() {
		self.info_window.close();
	};

	// Play animation
    // Reference: https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple-max
	self.toggleAnimation = function() {
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
		// Stop after 2 bounces
        setTimeout(function() {
            self.marker.setAnimation(null);
		}, 1400);
	};

	// Open info and play animation
	self.clicked = function() {
        // Open info window
        self.openInfo();
        // Toggle animation
        self.toggleAnimation();
	};

	// On click toggle info window + animation
	self.marker.addListener('click', function() {
		self.clicked();
	});
};

// Our ViewModel
var ViewModel = function() {
	var self = this;
	self.search = ko.observable("");
    self.markers = [];

	/*
	 Map and Marker reference:
	 Reference: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
	 */

	// Initialize the map
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: {lat: 51.481615, lng: -3.179219}
	});

	// Create a marker for each location
	for (var i = 0; i < initial_locations.length; i++) {
        self.markers.push(new Marker(initial_locations[i], i * 200));
	}

	// Place the markers on the map
    for (i = 0; i < self.markers.length; i++) {
		self.markers[i].setMap(self.map, i * 200);
    }

    // Filtered array with only markers that match the search
    self.filtered_markers = ko.computed(function() {
        var string = self.search().toLowerCase();
        var filtered = [];
        // If no search, return all markers
        if (!string) {
            filtered = self.markers;
        }
        else {
            // Else filter based on search
            self.markers.forEach(function(marker) {
                if (marker.name.toLowerCase().search(string) >= 0)
                    filtered.push(marker);
            });
        }
        // Handle marker visibility before returning the result
        // If results were filtered first hide all
        if (self.markers.length != filtered.length) {
            self.markers.forEach(function(marker) {
                marker.setMap(null, 0);
            });
        }
        // Then display only filtered markers
        filtered.forEach(function(marker) {
            marker.setMap(self.map, 0);
        });
        return filtered;
    });

	// Bind menu icon to menu toggle
	$('.menu-icon').on('click', function(el) {
		$('#side-menu').toggleClass('hidden');
	});
};

function initMap() {
    ko.applyBindings(new ViewModel());
}
