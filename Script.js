var map = L.map('map').setView([26.5,88.7],14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  edit:{ featureGroup: drawnItems }
});
map.addControl(drawControl);

var speciesList = [];

fetch("YOUR_WEBAPP_URL")
.then(res => res.json())
.then(data => speciesList = data);

document.getElementById('polygonUpload').addEventListener('change', function(e){
  var reader = new FileReader();
  reader.onload = function(evt){
    var kml = new DOMParser().parseFromString(evt.target.result,'text/xml');
    var geojson = toGeoJSON.kml(kml);
    L.geoJSON(geojson,{style:{color:'blue'}}).addTo(map);
    map.fitBounds(L.geoJSON(geojson).getBounds());
  };
  reader.readAsText(e.target.files[0]);
});

map.on(L.Draw.Event.CREATED,function(e){

  var layer = e.layer;
  drawnItems.addLayer(layer);

  var options="";
  speciesList.forEach(sp=>{
    options += `<option value="${sp}">${sp}</option>`;
  });

  var content = `
  <select class="species">${options}</select>
  <input type="number" class="count" placeholder="Enter Count">
  <button onclick="saveBlock(this)">Save</button>
  `;

  layer.bindPopup(content).openPopup();
});

function saveBlock(btn){
  var popup = btn.parentElement;
  var species = popup.querySelector('.species').value;
  var count = popup.querySelector('.count').value;

  var layer = drawnItems.getLayers().slice(-1)[0];

  layer.feature = {
    type:"Feature",
    properties:{ Species:species, Count:count }
  };

  alert("Saved");
}

function submitToDrive(){

  var district = document.getElementById("district").value;
  var lpc = document.getElementById("lpc").value;

  var blocks = [];

  drawnItems.eachLayer(function(layer){
    var coords = layer.getLatLngs()[0].map(c=>[c.lng,c.lat]);
    blocks.push({
      Species: layer.feature.properties.Species,
      Count: layer.feature.properties.Count,
      coordinates: coords
    });
  });

  fetch("https://script.google.com/macros/s/AKfycbyRppD1EEEBKW30g94wkOaH8ImATQDDbhluL9TibAQf-L72MZt5xhF2hGDfKTwiMXZiTQ/exec",{
    method:"POST",
    body: JSON.stringify({
      district:district,
      lpc:lpc,
      blocks:blocks
    })
  })
  .then(res=>res.text())
  .then(msg=>alert(msg));
}

