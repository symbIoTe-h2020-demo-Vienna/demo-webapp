var map, featureList, boroughSearch = [], theaterSearch = [], museumSearch = [];

var sensorsMarkers = Array();
var sensorsName = Array();
var platformsName = Array();
var owners = Array();
var coordinates = Array();
var obsProperties = Array();
var locations = Array();


var search = Array();

var test1 = ['http://161.53.19.121:8080/openiotRAP/Sensors?%24format=json', 'http://enviro5.ait.ac.at:8080/openUwedat-oData/DemoService.svc/Sensors?%24format=json'];

var total = 0;

var table;

var properties = {1:'SO2', 5:'PM10', 7:'O3', 8:'NO2', 10:'CO', 38:'NO', 53:'Pressure', 54:'Temperature', 58:'Relative humidity', 6001:'PM2.5', };

$(window).resize(function() {
  sizeLayerControl();
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

/* Basemap Layers */
var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
});
var usgsImagery = L.layerGroup([L.tileLayer("http://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 15,
}), L.tileLayer.wms("http://raster.nationalmap.gov/arcgis/services/Orthoimagery/USGS_EROS_Ortho_SCALE/ImageServer/WMSServer?", {
  minZoom: 16,
  maxZoom: 19,
  layers: "0",
  format: 'image/jpeg',
  transparent: true,
  attribution: "Aerial Imagery courtesy USGS"
})]);

map = L.map("map", {
  zoom: 4,
  center: [47.079069, 16.189928],
  layers: [cartoLight],
  zoomControl: false,
  attributionControl: false
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  // div.innerHTML = "<span class='hidden-xs'>Developed by <a href='http://bryanmcbride.com'>bryanmcbride.com</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

// ----- FUNCTIONS -----

function expandMap (){
  if(document.getElementById('map').style.height == '85%'){
    var height = '50%';
    document.getElementById("expandButton").value="Expand Map";
  }else{
    var height = '85%';
    document.getElementById("expandButton").value="Reduce Map";
  }
  $('#map').animate({
    height: height
  }, 500, function() {
  });

  var bounds = new L.LatLngBounds(coordinates);
  map.fitBounds(bounds);
}

//  Handle the click in a row that opens a modal with ths historic of the sensor of the clicked line
function handleClickRow(e){
  var table = document.getElementById("historicTable");

  var table = $('#historicTable').DataTable();
  var rows = table.rows().remove().draw();

  var row_url = "http://symbiote.man.poznan.pl/coreInterfaceApi/search/resource_url?resourceIds="+e.target.parentNode.id;

  $("#loading").show();

  $.ajax({
        url: row_url,
        type: "GET",
        dataType: "json",
        cache: false,
        success: function(data){
          var name = e.target.parentNode.getAttribute('identification');
          console.log(data[e.target.parentNode.id]);
          object_url = data[e.target.parentNode.id]+"/Observations";
          $.ajax({
                url: object_url,
                type: "GET",
                dataType: "json",
                cache: false,
                success: function(data){
                  $("#loading").hide();

                  for (var i = 0; i < data.value.length; i++){

                    var dateTime = data.value[i].ResultTime.replace("T", " ").replace("Z", " ");
                    var date = dateTime.split(" ")[0];
                    var time = dateTime.split(" ")[1];
                    var measurementValue = data.value[i].ObservationValue.Value;
                    var unit = data.value[i].ObservationValue.UnitOfMeasurement
                    var feature = data.value[i].Location.name;
                    try{
                      var observedProperty = properties[data.value[i].ObservationValue.ObservedProperty.match(/\d+/)[0]];
                    }
                    catch(err){
                      var observedProperty = data.value[i].ObservationValue.ObservedProperty;
                    }

                    measurementValue = Math.round(measurementValue * 100)/100;

                    var table = $('#historicTable').DataTable();
                    var row = table
                    .row.add( [ date, time, measurementValue, observedProperty, unit, feature ] )
                    .draw()
                    .node();
                  }
                  $('#infoSensorModal').modal('show');
                   $('#infoSensorModalTitle').text(name  + " historic data")

                },
                error:function(){
                  $("#loading").hide();
                  // Error code goes here.
                  $('#errorModal').modal('show');
                }
            });
        },
        error:function(){
          $("#loading").hide();
          // Error code goes here.
          $('#errorModal').modal('show');
        }
    });
}

// Remove data (sensors) from previous search
function deleteSensor(){
  for (var i = 0; i < sensorsMarkers.length; i++){
    map.removeLayer(sensorsMarkers[i]);
  }
}

// Get the sensors
function getSensors(){
  function parseSensor(data) {
    $('#searchModal').modal('hide');

    var marker = L.marker([data.locationLatitude, data.locationLongitude]).addTo(map);

    var currentCoordinates = Array();
    currentCoordinates.push(data.locationLatitude);
    currentCoordinates.push(data.locationLongitude);
    coordinates.push(currentCoordinates);

    // var bounds = new L.LatLngBounds(coordinates);
    // map.fitBounds(bounds);

    sensorsMarkers.push(marker);
    sensorsName.push(data.name);
    platformsName.push(data.platformName);
    owners.push(data.owner);
    obsProperties.push(data.observedProperties);
    locations.push(data.locationName);

    marker.on('click', function(e) {
      var content = "<table class='table table-striped' cellspacing='0' <thead> <th>Longitude</th> <th>Latitude</th> </thead> <tbody> <tr> <td>" + e.latlng.lng + " </td> <td>" + e.latlng.lat + " </td> </tr></tbody></table> <p></p>"
      content += "<table class='table table-hover table-striped' cellspacing='0'> <thead> <th>Sensor</th> <th>Platform</th> <th> Observed Properties </th> <th> Owner </th> <th> Location </th> </thead> <tbody> ";

      for (i = 0; i < sensorsMarkers.length; i++){
        if(sensorsMarkers[i]._latlng.lat  == e.latlng.lat && sensorsMarkers[i]._latlng.lng  == e.latlng.lng){
          content += "<tr><td>" + sensorsName[i] + "</td>" + "<td>" + platformsName[i] + "</td>" + "<td>" + obsProperties[i] + "</td>"+ "<td>" + owners[i] + "</td><td>"+ locations[i] + "</td></tr>"
        }
      }
      content += "</tbody></table> <p></p>"
      var popup = L.popup({maxHeight:500, maxWidth:800})
       .setLatLng(e.latlng)
       .setContent(content)
       .openOn(map);
    });

    var table = $('#sensorsTable').DataTable();
    var row = table
    .row.add( [data.name, data.locationLongitude, data.locationLatitude, data.locationAltitude, data.platformName, data.observedProperties, data.owner, data.locationName] )
    .draw()
    .node();
    //
    row.setAttribute("id", data.id);
    row.setAttribute("identification", data.name);
    row.setAttribute("class", "clickable-row");
    row.addEventListener('click', handleClickRow);
  };

  $(document).ajaxStop(function() {
    // LAST AJAX CALL Finishes
    $("#loading").hide();

    // var bounds = new L.LatLngBounds(coordinates);
    // map.fitBounds(bounds);


  });
  var url = 'http://symbiote.man.poznan.pl/coreInterfaceApi/search/query';
  if ($('#platform_name').val())
    search.push("platform_name="+$('#platform_name').val())

  if ($('#owner').val())
    search.push("owner="+$('#owner').val())

  if ($('#name').val())
    search.push("name="+$('#name').val())

  if ($('#id').val())
    search.push("id="+$('#id').val())

  if ($('#description').val())
    search.push("description="+$('#description').val())

  if ($('#location_name').val())
    search.push("location_name="+$('#location_name').val())

  if ($('#latitude').val())
    search.push("location_lat="+$('#latitude').val())

  if ($('#longitude').val())
    search.push("location_long="+$('#longitude').val())

  if ($('#distance').val())
    search.push("max_distance="+$('#distance').val())

  if ($('#property').val())
    search.push("observed_property="+$('#property').val())

  if (search.length != 0){
    url += "?"
    for (var i = 0; i <search.length; i++){
      url += search[i];
      if(i != search.length-1)
        url += "&"
    }
  }

  $("#loading").show();
  $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        cache: false,
        success: function(data){
          if(data.length > 0){
            search = [];

            $('#map').animate({
              height: '50%'
            }, 500, function() {
              document.getElementById("expandButton").value="Expand Map";
            });
            document.getElementById("errorFooter").style.display = "none";

            document.getElementById("sensorsContent").style.display = "initial";
            document.getElementById("expandButton").style.display = "initial";

            $.each(data, function( index, each ) {
              parseSensor(each);
            });
          }
          else{
            search = [];

            $('#searchModal').modal('show');

            document.getElementById("errorFooter").style.display = "initial";
            document.getElementById("errorSearch").innerHTML="The search did not return any results."
            //
            document.getElementById("sensorsContent").style.display = "none";
            document.getElementById("expandButton").style.display = "none";

            $('#map').animate({
              height: '85%'
            }, 500, function() {

            });
          }
        },
        error:function(){
          // TODO add error message
          search = [];

          $('#searchModal').modal('show');

          document.getElementById("errorFooter").style.display = "initial";
          document.getElementById("errorSearch").innerHTML="It was not possible to proceed with the search. Please try again."
          //
          document.getElementById("sensorsContent").style.display = "none";
          document.getElementById("expandButton").style.display = "none";

          $('#map').animate({
            height: '85%'
          }, 500, function() {

          });
        }
    });
}

// ----- EVENT LISTENERS -----

// Show modal for search
searchTopBar.addEventListener('click', function() {
  $('#searchModal').modal('show');

  document.getElementById("errorFooter").style.display = "none";
  document.getElementById("errorSearch").innerHTML=""
}, false);


// Submit model search
searchModalButton.addEventListener('click', function() {
  document.getElementById("sensorsContent").style.display = "none";
  document.getElementById("expandButton").style.display = "none";

  var table = $('#sensorsTable').DataTable();

  var rows = table.rows().remove().draw();

  map.setView([47.079069, 16.189928], 4);

  $('#map').animate({
    height: '85%'
  }, 1000, function() {
    // Animation complete.
  });

  deleteSensor();
  sensorsMarkers = [];
  sensorsName = [];
  platformsName = [];
  coordinates = [];
  obsProperties = [];
  locations = [];

  getSensors();
}, false);


// ----- DOCUMENT READY -----
$(document).on("ready", function () {
  $("#loading").hide();

  $('#searchModal').modal('show');

  var searchButton = document.getElementById('searchButton');
  var searchTopBar = document.getElementById('searchTopBar');
  var searchModalButton = document.getElementById('searchModalButton');

});
// Leaflet patch to make layer control scrollable on touch browsers
// var container = $(".leaflet-control-layers")[0];
// if (!L.Browser.touch) {
//   L.DomEvent
//   .disableClickPropagation(container)
//   .disableScrollPropagation(container);
// } else {
//   L.DomEvent.disableClickPropagation(container);
// }
