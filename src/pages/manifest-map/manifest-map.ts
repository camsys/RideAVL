import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  MarkerCluster,
  Environment,
  ILatLng,
  MyLocation,
  MyLocationOptions,
  LocationService,
  BaseArrayClass
} from '@ionic-native/google-maps';

/**
 * Generated class for the ManifestPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// Models
import { Run } from '../../models/run';
import { Itinerary } from '../../models/itinerary';

// Pages
import { RunsPage } from '../runs/runs';
import { ManifestPage } from '../manifest/manifest';
import { ItineraryPage } from '../itinerary/itinerary';

// Providers
import { GlobalProvider } from '../../providers/global/global';
import { RunProvider } from '../../providers/run/run';
import { ManifestProvider } from '../../providers/manifest/manifest';

// Environment
import { environment } from '../../app/environment';

@IonicPage()
@Component({
  selector: 'page-manifest-map',
  templateUrl: 'manifest-map.html',
})
export class ManifestMapPage {
  dataLoaded: Boolean = false;
  itineraries: Itinerary[] = [];
  activeItin: Itinerary = new Itinerary();
  nextItin: Itinerary = new Itinerary();
  currentTime: Date = new Date();
  run: Run = {} as Run;

  map: GoogleMap;
  bounds: ILatLng[];
  vehicleLat: number;
  vehicleLng: number;
  vehicleWatcher: any;
  
  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public events: Events,
              public global: GlobalProvider,
              public runProvider: RunProvider,
              private geolocation: Geolocation,
              private manifestProvider: ManifestProvider) {

              if(this.navParams.data.run) {
                this.run = this.navParams.data.run;
              }

              if(this.navParams.data.itineraries) {
                this.itineraries = this.navParams.data.itineraries;
                if(this.itineraries.length > 0) {
                  this.dataLoaded = true;
                }
              }
              
              setInterval(() => this.currentTime = new Date(), 500);
              setInterval(() => this.updateETA(), global.gpsInterval * 1000);
  }

  ionViewDidLoad() {
    this.loadMap();
    this.requestManifest();
  }

  loadMap() {
    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': environment.GOOGLE_MAPS_KEY,
      'API_KEY_FOR_BROWSER_DEBUG': environment.GOOGLE_MAPS_KEY
    });

    // Create a map after the view is loaded.
    // (platform is already ready in app.component.ts)
    this.map = GoogleMaps.create('map_canvas', {
      camera: {
        target: {
          lat: this.global.mapCenterLat,
          lng: this.global.mapCenterLng
        },
        zoom: this.global.mapZoom,
        tilt: this.global.mapTilt
      }
    });

  }

  // draw itin stops on map
  renderItinsOnMap() {
    let stops = [];
    let canvas: any = document.getElementById('hidden_canvas');
    //canvas.width = 38;
    //canvas.height = 38;
    let context: any = canvas.getContext('2d');
    let idx = 0;
    this.itineraries.forEach(itin => {
      if(itin && itin.address) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        let styleData = {
          size: 24,
          x: 0,
          y: 0,
          borderWidth: 1,
          labelColor: 'white',
          label: idx,
          fillColor: itin.mapIconColor(),
          strokeColor: 'white'
        };

        this.drawMarker(context, styleData);
        console.log(canvas.toDataURL());
        stops.push({
          position: {
            lat: itin.address.latitude,
            lng: itin.address.longitude
          },
          title: itin.label(),
          snippet: itin.mapSnippetInfo(),
          icon: canvas.toDataURL()
        });

        idx ++;
      }
    });

    let stop_locs: BaseArrayClass<any> = new BaseArrayClass<any>(stops);

    this.bounds = stop_locs.map((data: any, idx: number) => {
      return data.position;
    });

    // zoom to bounds
    this.resetBounds();

    stop_locs.forEach((data: any) => {
      data.disableAutoPan = true;
      data.styles = {
        'font-size': 'larger',
        'font-weight': 'bold'
      };

      let marker: Marker = this.map.addMarkerSync(data);
      marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(this.onMarkerClick);
      marker.on(GoogleMapsEvent.INFO_CLICK).subscribe(this.onMarkerClick);
    });
    
  }

  onMarkerClick() {
    console.log('clicked');
  }

  resetBounds() {
    this.map.moveCamera({
      target: this.bounds
    });
  }

  locateVehicle() {
    let options: MyLocationOptions = {
      enableHighAccuracy: true
    };

    LocationService.getMyLocation(options).then((location: MyLocation) => {
      console.log(location);
      let loc_data = location.latLng;
      this.vehicleLat = loc_data.lat;
      this.vehicleLng = loc_data.lng;

      this.drawVehicleIcon();
    });
  }

  trackDriver() {
    let posOptions = {
      timeout: 30 * 1000, 
      enableHighAccuracy: true
    };

    this.vehicleWatcher = this.geolocation.watchPosition(posOptions)
      .filter((p: any) => p.code === undefined)
      .subscribe((position: Geoposition) => {
        let loc_data = position.coords;
        this.vehicleLat = loc_data.latitude;
        this.vehicleLng = loc_data.longitude;

        this.drawVehicleIcon();
      });
  }

  ionViewWillLoad() {
    this.events.unsubscribe("manifest:reload");
    this.events.subscribe("manifest:reload", () => {
      // reload run
      this.runProvider.getRun(this.run.id)
                      .subscribe((run) => {
                        this.run = run;
                        if(!this.run.id) {
                          this.events.publish("app:notification", "Run was removed by dispatcher.");
                          this.loadRunList();
                        }
                      });

      // reload itins
      this.manifestProvider.getItineraries(this.run.id)
                      .subscribe((itins) => {
                        this.loadItins(itins);
                      });
    });
  }

  ionViewDidUnload() {
    this.events.unsubscribe("manifest:reload");
    if(this.vehicleWatcher) {
      this.vehicleWatcher.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.setActiveItin();
  }

  doRefresh(refresher) {
    this.manifestProvider.getItineraries(this.run.id)
                      .subscribe((itins) => {
                        this.loadItins(itins);
                        refresher.complete();
                      });
  }

  loadRunList() {
    this.navCtrl.setRoot(RunsPage);
  }


  // apply calculated eta_diff in all incomplete itins
  updateETA() {
    if(!this.itineraries) {
      return;
    }

    this.global.updateManifestETA(this.itineraries);
  }

  requestManifest() {
    if(!this.dataLoaded) {
      this.manifestProvider.getItineraries(this.run.id)
                          .subscribe((itins) => this.loadItins(itins));
    }
  }

  loadItins(itins: Itinerary[]) {
    this.dataLoaded = true;
    this.itineraries = itins || [];
    this.setActiveItin();

    this.renderItinsOnMap();
  }

  setActiveItin() {
    this.activeItin = this.itineraries.find(r => !r.finished()) || (new Itinerary());
  }

  loadItin(itin: Itinerary) {
    this.navCtrl.setRoot(ItineraryPage, { itin: itin, run: this.run, active: (this.activeItin == itin), itins: this.itineraries, fromPage: 'manifest-map'});
  }

  // Show the info of next/in_progress itin
  getNextItinTitle() {
    if(this.activeItin.in_progress()) {
      return "In Progress: " + this.activeItin.label();
    } else if(this.activeItin.pending()) {
      return "Next: " + this.activeItin.label();
    } 
  }

  loadManifest() {
    this.navCtrl.setRoot(ManifestPage, {run: this.run});
  }

  // vehicle icon
  drawVehicleIcon() {
    if(!this.vehicleLat || !this.vehicleLng) {
      return;
    }

    let locData = {
      position: {lat: this.vehicleLat, lng: this.vehicleLng},
      title: "Vehicle current location"
    };

    this.map.addMarkerSync(locData);

    this.map.moveCamera({
      target: {lat: this.vehicleLat, lng: this.vehicleLng}
    });
  }

  // address marker
  drawMarker(context, style) {
    let highlight, highlightThickness, inner;
    style.width = style.size;
    style.height = style.size * 1.5;
    context.lineWidth = 1.2;
    this.markerPin(context, style.x, style.y, style.width, style.height, style.fillColor, style.strokeColor);
      
    context.font = "bold 16px Arial";
    context.fillStyle = style.labelColor;
    let label = style.label;
    let labelX = 7;
    if(label && label.length > 1) {
      labelX = 4;
    }
    context.fillText(label, labelX, 18);
  }

  markerPin(context, x, y, width, height, fill, stroke) {
    let center, shadow, shadowGradient;
    // Center points
    center = {
      x: x + width / 2,
      y: y + height / 2
    };
    context.beginPath();
    // Shadow is one 6th of the width and one 8th of the height
    shadow = {
      width: width / 2,
      height: width / 2
    };
    shadow.start = {
      x: center.x - shadow.width / 2,
      y: y + height - shadow.height
    };
    shadowGradient = context.createRadialGradient(shadow.start.x + shadow.width / 2, shadow.start.y + shadow.height / 2, 0, shadow.start.x + shadow.width / 2, shadow.start.y + shadow.height / 2, shadow.width / 2);
    shadowGradient.addColorStop(0, 'rgba(0,0,0,.3)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.setTransform(1, 0, 0, 0.5, 0, 0);
    context.translate(0, y + height + shadow.height / 2);
    context.fillStyle = shadowGradient;
    context.fillRect(shadow.start.x, shadow.start.y, shadow.width, shadow.height);
    context.fill();
    context.closePath();
    context.setTransform(1, 0, 0, 1, 0, 0);
    // Top arc
    context.beginPath();
    context.arc(center.x, y + height / 3, width / 2, Math.PI, 0, false);
    // Right bend
    context.bezierCurveTo(x + width, y + (height / 3) + height / 4, center.x + width / 3, center.y, center.x, y + height);
    // Left bend
    context.moveTo(x, y + height / 3);
    context.bezierCurveTo(x, y + (height / 3) + height / 4, center.x - width / 3, center.y, center.x, y + height);
    
    if (fill) {
      context.fillStyle = fill;
      context.fill();
    }

    if (stroke) {
      context.strokeStyle = stroke;
      context.stroke();
    }
  }

}
