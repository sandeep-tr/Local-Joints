//-- constants
var currentLat = 32.75, currentLong = -97.13;
var defaultZoom = 16;
var maxResultSize = 10;
var googleMapsBaseURL = 'https://maps.googleapis.com/maps/api/geocode/json?'
var numberMarkerBaseURL = 'http://chart.apis.google.com/chart?';
var dummyImageBaseURL = 'http://placehold.it/100x100&text=';

var map;
var geocoder;
var markers=[];

/*This function is called on initialization, after load. Creates
map in UI and the marker */
function initialize() {
	
	var latlongCordinates = new google.maps.LatLng(currentLat, currentLong);
	var mapOptions = {
		zoom: defaultZoom,
		center: latlongCordinates
	}
	map = new google.maps.Map(document.getElementById('mapArea'), mapOptions);
	
	var marker = new google.maps.Marker({
		position: latlongCordinates,
		map: map,
		title: "My Location!",
		animation: google.maps.Animation.DROP
	});

	geocoder = new google.maps.Geocoder();
}

google.maps.event.addDomListener(window, 'load', initialize);

/*Function sends query from search box to Yelp API,
retrieves response and calls displayResults function to 
build UI*/
function sendRequest () {
	
	clearBusinessMarkers();
	var xhr = new XMLHttpRequest();
	var searchValue = document.getElementById("searchBox").value;
	if(searchValue === ''){
	   alert('Please enter a value to search.');
	   return;
	}
	
	var encodedSearchValue = encodeURI(searchValue);
	var northEastBound = map.getBounds().getNorthEast();
	var southWestBound = map.getBounds().getSouthWest()
	var bounds = southWestBound.lat() + ',' + southWestBound.lng() + '|'  + northEastBound.lat() + ',' + northEastBound.lng();
	var searchURL = "proxy.php?term=" + encodedSearchValue;
		searchURL += "&bounds=" + bounds + "&limit=" + maxResultSize;
		
	xhr.open("GET", searchURL);
	xhr.setRequestHeader("Accept","application/json");
	xhr.onreadystatechange = function () {
	   if (this.readyState == 4) {
		  var json = JSON.parse(this.responseText);
		  displayResults(json);
	   }
	};
	xhr.send(null);
}

/*Displays formatted response from Yelp search API*/
function displayResults(searchData){

	var outputEl = document.getElementById('resultArea');
	var mapAreaEl = document.getElementById('mapArea');
	var businesses = searchData.businesses;
	var businessImageURL;
	var businessList = '<table cellspacing="0" cellpadding="0" border="0"><tbody>';
	var counter = 0;
	if(searchData.total < 1){
		businessList += '<tr><td class="rowTemplate"><b>No matching results found!</b></td></tr>';
	}
	
	businesses.forEach(function(business){
		if(typeof business.image_url === "undefined"){
			businessImageURL = dummyImageBaseURL + business.name;
		}
		else{
			businessImageURL = business.image_url;
		}
		businessList += '<tr><td class="rowTemplate"><p><b>'+ (++counter) +'.</b></p><img class="float" src="'+ businessImageURL +'"/>';
		businessList += '<a href="'+ business.url +'" target="_blank" class="title">'+ business.name +'</a>';
		businessList += '<br/><img src="'+ business.rating_img_url +'"/>';
		businessList += '<br/><p><b>Snippet: </b>' + business.snippet_text + '</p></td></tr>';
		
		geoCodeAddress(business);
	});
	businessList += '</tbody></table>';
	
	if(mapAreaEl.className.indexOf("leftFloat") === -1){
		mapAreaEl.className = mapAreaEl.className + " leftFloat";	
	}
	outputEl.innerHTML = businessList;
}

/*Function converts address string retrieved from 
Yelp API to coordinates using Google maps Geocoder*/
function geoCodeAddress(business){
	
	var addressString = business.name + ', ';
	var displayAddress = business.location.display_address;
	var counter = 0;
	displayAddress.forEach(function(part){
		addressString += part;
		if(++counter < displayAddress.length){
			addressString += ', '
		}
	});
	geocoder.geocode( { 'address': addressString}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			markBusinessInMap(business, results[0].geometry.location)
		}
	});
}

/*Function used to mark a business on the map based
on the coordinates passed*/
function markBusinessInMap(business, businessCoordinates){
	
	var label = markers.length + 1;
	var marker = new google.maps.Marker({
		position: businessCoordinates,
		map: map,
		icon: numberMarkerBaseURL + 'chst=d_map_pin_letter&chld=' + label + '|FE6256|000000',
		title: business.name,
		animation: google.maps.Animation.DROP
	});
	markers.push(marker);	
}

/*Utility function used to clear all business markers 
from the map*/
function clearBusinessMarkers(){
	
	var marker;
	while(markers.length > 0){
		marker = markers.pop();
		marker.setMap(null);
	}
}

