/*
Create and Render map on div with zoom and center
*/
class OLMap {
  //Constructor accepts html div id, zoom level and center coordinaes
  constructor(map_div, zoom, center) {
    this.map = new ol.Map({
      target: map_div,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat(center),
        zoom: zoom
      })
    });
  }
}

// Defining Style
let staticStyle = new ol.style.Style({
  // Line and Polygon Style
  stroke: new ol.style.Stroke({
    color: '#0e97fa',
    width: 4
  }),
  fill: new ol.style.Fill({
    color: 'rgba(0, 153, 255, 0.2)'
  }),  
});


/*
Create Vector Layer
*/
class VectorLayer{
  //Constructor accepts title of vector layer and map object
  constructor(title, map) {
    this.layer = new ol.layer.Vector({
      title: title,      
      source: new ol.source.Vector({
        projection:map.getView().projection
      }),
      style: staticStyle
    })
  }
}


/*
Create a Draw interaction for LineString and Polygon
*/
class Draw {  
  //Constructor accepts geometry type, map object and vector layer
  constructor(type, map, vector_layer, hole) {
    this.map = map;
    this.vector_layer = vector_layer;
    this.features = [];
    
    //Draw feature
    this.draw = new ol.interaction.Draw({
        type: type,
        stopClick: true,
        source: vector_layer.getSource()
    });

    

    if (hole == "hole") {
      this.draw.on('drawstart', this.onDrawStart);
      this.draw.on('drawend', this.onDrawEnd);
    }    
    this.map.addInteraction(this.draw);   
  }

  /*
  This function will be called when you start drawing
  */
  onDrawStart = (e) => { 
    vector_layer.getSource().forEachFeatureIntersectingExtent(e.feature.getGeometry().getExtent(), (f) => {
      this.intersected = f;
    });    
    if (!this.intersected) {
      alert('No Feature Found to draw holes')
      e.target.abortDrawing();
      return;
    }
    this.coords_lenth = this.intersected.getGeometry().getCoordinates().length;

    //Binding onGeomChange function with drawing feature
    e.feature.getGeometry().on('change', this.onGeomChange);
  }

  /*
  This function will called when ever there will be a change in geometry like increase in length, area, position,
  */
  onGeomChange = (e) => {
    let linear_ring = new ol.geom.LinearRing(e.target.getCoordinates()[0]);
    let coordinates = this.intersected.getGeometry().getCoordinates();
    let geom = new ol.geom.Polygon(coordinates.slice(0, this.coords_lenth));
    geom.appendLinearRing(linear_ring);
    this.intersected.setGeometry(geom);
  }

  /*
  This function will be called when you start drawing
  */
  onDrawEnd =(e) => {
    setTimeout(() => {
      vector_layer.getSource().removeFeature(e.feature);
    }, 5);    
    this.intersected = undefined;
  }
}


//Create map and vector layer
let map = new OLMap('map', 9, [-96.6345990807462, 32.81890764151014]).map;
let vector_layer = new VectorLayer('Temp Layer', map).layer
map.addLayer(vector_layer);


//Add Interaction to map depending on your selection
let draw = null;
let btnClick = (e) => {
  removeInteractions();
  let geomType = e.srcElement.attributes.geomtype.nodeValue;
  //Create interaction
  if (geomType == "PolygonHole") {
    draw = new Draw("Polygon", map, vector_layer, "hole");  
  } else {
    draw = new Draw(geomType, map, vector_layer);
  }  
}


//Draw Hole in Polygon



//Remove map interactions except default interactions
let removeInteractions = () => {
  let extra_interactions = map.getInteractions().getArray().slice(9);
  let len = extra_interactions.length;
  for (let i in extra_interactions) {
    map.removeInteraction(extra_interactions[i]);
  }  
}


//Clear vector features and overlays and remove any interaction
let clear = () => {
  removeInteractions();
  map.getOverlays().clear();
  vector_layer.getSource().clear();
}

//Bind methods to click events of buttons
let poly = document.getElementById('btn1');
poly.onclick = btnClick;

let polyholes = document.getElementById('btn2');
polyholes.onclick = btnClick;

let clearGraphics = document.getElementById('btn3');
clearGraphics.onclick = clear;


