import { useEffect, useRef, useState } from "react";
import "./App.css";
import "ol/ol.css";
import Map from "ol/Map.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";
import View from "ol/View.js";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
} from "@mui/material";
import { Draw, Modify } from "ol/interaction";
import axios from "axios";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { FeatureLike } from "ol/Feature";
import { TileWMS } from "ol/source";
import { Coordinate } from "ol/coordinate";
import BaseLayer from "ol/layer/Base";
import { deletePolygon, updatePolygon } from "./dbService";

const GEOSERVER_URL = "http://localhost:8080/geoserver/wms";

function App() {
  const mapIns = useRef<Map | undefined>(undefined);

  const [polygonColor, setPolygonColor] = useState<string>("#e41a1c");
  const [error, setError] = useState<string>("");
  const [editedPolygonColor, setEditedPolygonColor] =
    useState<string>("#e41a1c");
  const [editedPolygon, setEditedPolygon] = useState<Feature<Geometry> | null>(
    null
  );
  const isCreateModeRef = useRef(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [featureLayer, setFeatureLayer] = useState<VectorLayer<
    VectorSource<FeatureLike>,
    FeatureLike
  > | null>(null);

  useEffect(() => {
    if (!mapIns.current) {
      const wmsSource = new TileWMS({
        url: GEOSERVER_URL,
        params: {
          LAYERS: "cris:polygon_features",
          TILED: true,
          FORMAT: "image/png",
          TRANSPARENT: true,
          CQL_FILTER: "is_deleted = false",
        },
        serverType: "geoserver",
      });

      const bbbSource = new TileWMS({
        url: GEOSERVER_URL,
        params: {
          LAYERS: "cris:bbb",
          TILED: true,
          FORMAT: "image/png",
          TRANSPARENT: true,
        },
        serverType: "geoserver",
      });

      const map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          new TileLayer({
            source: wmsSource,
          }),
          new TileLayer({
            source: bbbSource,
          }),
        ],
        view: new View({
          center: [671178, 3477234],
          zoom: 8,
          projection: "EPSG:32636",
        }),
      });

      map.on("dblclick", async (event) => {
        if (!isCreateModeRef.current && !editedPolygon) {
          const coordinate: Coordinate = event.coordinate;
          const viewResolution: number | undefined = map
            .getView()
            .getResolution();

          if (viewResolution) {
            const wmsUrl = wmsSource.getFeatureInfoUrl(
              coordinate,
              viewResolution,
              "EPSG:32636",
              {
                INFO_FORMAT: "application/json",
              }
            );

            if (wmsUrl) {
              try {
                const { data } = await axios.get(wmsUrl);
                if (data.features && data.features.length > 0) {
                  setIsEditMode(true);

                  const format = new GeoJSON();
                  const olFeature = format.readFeature(data.features[0], {
                    dataProjection: "EPSG:32636",
                    featureProjection: "EPSG:32636",
                  });

                  setEditedPolygonColor(data.features[0].properties.color);
                  setEditedPolygon(olFeature as Feature<Geometry>);

                  const polygonVectorSource = new VectorSource({
                    features: [olFeature as FeatureLike],
                  });

                  const editedFeatureLayer = new VectorLayer({
                    source: polygonVectorSource,
                    style: new Style({
                      stroke: new Stroke({
                        color: "blue",
                        width: 2,
                      }),
                      fill: new Fill({
                        color: "blue",
                      }),
                    }),
                  });

                  map.addLayer(editedFeatureLayer);
                  setFeatureLayer(editedFeatureLayer);

                  const modify = new Modify({
                    source: polygonVectorSource as VectorSource<
                      Feature<Geometry>
                    >,
                  });
                  map.addInteraction(modify);

                  modify.on("modifyend", (event) => {
                    setEditedPolygon(event.features.getArray()[0]);
                  });
                }
              } catch (error) {
                console.error(error);
              }
            }
          }
        }
      });

      mapIns.current = map;
    }
  }, []);

  const createPolygon = () => {
    isCreateModeRef.current = true;

    const draw = new Draw({
      source: new VectorSource(),
      type: "Polygon",
    });

    draw.on("drawend", (event) => {
      const format = new GeoJSON();
      const geoJSON = format.writeFeatureObject(event.feature);

      if (geoJSON.geometry && geoJSON.geometry.coordinates) {
        axios
          .post(
            "http://localhost:8000/create",
            { geoJSON: geoJSON, color: polygonColor },
            {
              headers: { "Content-Type": "application/json" },
            }
          )
          .catch((error) => {
            if (error.response.data.error === "BADZONES INTERSECTION")
              setError("וואלה נחתך עם אזורים מסוכנים");
          });
      }

      mapIns.current?.removeInteraction(draw);
      isCreateModeRef.current = false;
    });

    mapIns.current?.addInteraction(draw);
  };

  const resetMap = (): void => {
    const interactions = mapIns.current?.getInteractions();
    interactions?.clear();
    mapIns.current?.removeLayer(featureLayer as BaseLayer);
    setIsEditMode(false);
  };

  return (
    <div
      style={{
        position: "static",
        width: "100%",
        height: "100%,",
        overflow: "hidden",
      }}
    >
      <div
        id="map"
        style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
      >
        <Container
          sx={{
            position: "absolute",
            top: "1%",
            right: "2%",
            zIndex: 2000,
            display: "flex",
            backgroundColor: "beige",
            padding: "10px",
            flexDirection: "column",
            width: "20%",
            borderRadius: "5px",
          }}
        >
          <RadioGroup
            sx={{ flexDirection: "row", direction: "rtl" }}
            value={polygonColor}
            onChange={(e) => {
              setPolygonColor(e.target.value);
            }}
          >
            <FormControlLabel
              value={"#e41a1c"}
              control={<Radio />}
              label="אדום"
            />
            <FormControlLabel
              value={"#377eb8"}
              control={<Radio />}
              label="כחול"
            />
          </RadioGroup>
          <Button
            data-testid="create-polygon-btn"
            onClick={createPolygon}
            variant="contained"
            sx={{ margin: "5px" }}
          >
            צור פוליגון
          </Button>
        </Container>
        {isEditMode && (
          <Container
            sx={{
              position: "absolute",
              bottom: "4%",
              right: "2%",
              zIndex: 2000,
              display: "flex",
              backgroundColor: "beige",
              padding: "10px",
              flexDirection: "column",
              width: "30%",
              borderRadius: "5px",
            }}
          >
            <RadioGroup
              sx={{ flexDirection: "row", direction: "rtl" }}
              value={editedPolygonColor}
              onChange={(e) => {
                setEditedPolygonColor(e.target.value);
              }}
            >
              <FormControlLabel
                value={"#e41a1c"}
                control={<Radio />}
                label="אדום"
              />
              <FormControlLabel
                value={"#377eb8"}
                control={<Radio />}
                label="כחול"
              />
            </RadioGroup>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
              }}
            >
              <Button
                variant="contained"
                sx={{ margin: "5px", backgroundColor: "red", width: "40%" }}
                onClick={() => {
                  const id = editedPolygon?.getId();
                  if (id) deletePolygon(id, setError);
                  resetMap();
                }}
              >
                מחק
              </Button>
              <Button
                variant="contained"
                sx={{ margin: "5px", backgroundColor: "green", width: "40%" }}
                onClick={() => {
                  if (editedPolygon)
                    updatePolygon(editedPolygon, editedPolygonColor, setError);
                  resetMap();
                }}
              >
                עדכן
              </Button>
            </Box>
          </Container>
        )}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert onClose={() => setError("")} severity="error" variant="filled">
            {error}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default App;
