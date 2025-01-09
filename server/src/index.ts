import express, { urlencoded, json } from "express";
import axios from "axios";
import cors from "cors";
import {
  createGMLFeature,
  deleteGMLFeature,
  updateGMLFeature,
} from "./xmlService.ts";

const port = 8000;
const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors());

interface GeoJSON {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: Record<string, any> | null;
}

const geoServerWFSUrl = "http://localhost:8080/geoserver/wfs?";

app.get("/polygons", async (req, res) => {
  const params = {
    SERVICE: "WFS",
    VERSION: "2.0.0",
    REQUEST: "GetFeature",
    TYPENAME: "polygon_features",
    OUTPUTFORMAT: "application/json",
    CQL_FILTER: "is_deleted = false",
  };

  try {
    const response = await axios.get(geoServerWFSUrl, { params });
    res.json(response.data);
  } catch (error) {
    console.error("Error querying GeoServer WFS:", error);
    res.status(500).send("Error querying GeoServer");
  }
});

app.post("/create", async (req, res) => {
  const geoJSON: GeoJSON = req.body.geoJSON;
  const color: string = req.body.color;

  const wktGeometry = `POLYGON((${geoJSON.geometry.coordinates[0]
    .map((coord: number[]) => coord.join(" "))
    .join(", ")}))`;

  const wfsQuery = `${geoServerWFSUrl}service=WFS&version=2.0.0&request=GetFeature&typeName=bbb&outputFormat=application/json&CQL_FILTER=INTERSECTS(geom,${wktGeometry})`;
  const { data } = await axios.get(wfsQuery);
  const features = data.features;

  if (features.length > 0) {
    res.status(400).json({ error: "BADZONES INTERSECTION" });
  } else {
    const payload = createGMLFeature(geoJSON, color);

    try {
      const response = await axios.post(geoServerWFSUrl, payload, {
        auth: { username: "admin", password: "geoserver" },
        headers: { "Content-Type": "application/xml" },
        params: {
          SERVICE: "WFS",
          VERSION: "2.0.0",
          REQUEST: "Transaction",
          TRANSACTIONTYPE: "Insert",
          TYPENAME: "cris:polygon_features",
        },
      });

      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create feature" });
    }
  }
});

app.post("/update", async (req, res) => {
  const coordinates = req.body.feature.values_.geometry.flatCoordinates
    .reduce((result: string, value: number, index: number) => {
      const separator = index % 2 === 0 ? " " : ",";
      return result + value + separator;
    }, "")
    .trim()
    .slice(0, -1);

  const wfsQuery = `${geoServerWFSUrl}service=WFS&version=2.0.0&request=GetFeature&typeName=bbb&outputFormat=application/json&CQL_FILTER=INTERSECTS(geom,POLYGON((${coordinates})))`;

  const { data } = await axios.get(wfsQuery);
  const features = data.features;

  if (features.length > 0) {
    res.status(400).json({ error: "BADZONES INTERSECTION" });
  } else {
    const transactionXML = updateGMLFeature(req.body.feature);

    await axios
      .post("http://localhost:8080/geoserver/wfs", transactionXML, {
        auth: { username: "admin", password: "geoserver" },
        headers: { "Content-Type": "application/xml" },
        params: {
          SERVICE: "WFS",
          VERSION: "2.0.0",
          REQUEST: "Transaction",
          TYPENAME: "cris:polygon_features",
        },
      })
      .catch((error) => {
        console.error("Error saving features:", error);
      });

    res.json(true);
  }
});

app.post("/delete", async (req, res) => {
  const transactionXML = deleteGMLFeature(req.body.id);

  await axios
    .post("http://localhost:8080/geoserver/wfs", transactionXML, {
      auth: { username: "admin", password: "geoserver" },
      headers: { "Content-Type": "application/xml" },
      params: {
        SERVICE: "WFS",
        VERSION: "2.0.0",
        REQUEST: "Transaction",
        TYPENAME: "cris:polygon_features",
      },
    })
    .catch((error) => {
      console.error("Error saving features:", error);
    });

  res.status(200).json(true);
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});

export default app;
