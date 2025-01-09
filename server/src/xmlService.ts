import { create } from "xmlbuilder2";

interface GeoJSONType {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: Record<string, any> | null;
}

export const createGMLFeature = (geoJSON: GeoJSONType, color: string) => {
  const xml = create({ version: "1.0", encoding: "UTF-8" })
    .ele("wfs:Transaction", {
      "xmlns:wfs": "http://www.opengis.net/wfs",
      "xmlns:gml": "http://www.opengis.net/gml",
      "xmlns:feature": "http://localhost/g",
      service: "WFS",
      version: "1.0.0",
    })
    .ele("wfs:Insert")
    .ele("feature:polygon_features")
    .ele("feature:geom")
    .ele("gml:Polygon", { srsName: "EPSG:32636" })
    .ele("gml:outerBoundaryIs")
    .ele("gml:LinearRing")
    .ele("gml:coordinates")
    .txt(
      geoJSON.geometry.coordinates[0].map((coord) => coord.join(",")).join(" ")
    )
    .up()
    .up()
    .up()
    .up()
    .up()
    .ele("feature:name")
    .txt("naomi")
    .up()
    .ele("feature:color")
    .txt(color)
    .up()
    .ele("feature:is_deleted")
    .txt("false")
    .up()
    .up()
    .end({ prettyPrint: true });

  return xml;
};

export const updateGMLFeature = (feature: any) => {
  const coordinates = feature.values_.geometry.flatCoordinates
    .reduce((result: string, value: string, index: number) => {
      const separator = index % 2 === 0 ? "," : " ";
      return result + value + separator;
    }, "")
    .trim();

  const xml = create({ version: "1.0", encoding: "UTF-8" })
    .ele("wfs:Transaction", {
      "xmlns:wfs": "http://www.opengis.net/wfs",
      "xmlns:gml": "http://www.opengis.net/gml",
      "xmlns:feature": "http://localhost/g",
      "xmlns:ogc": "http://www.opengis.net/ogc",
      service: "WFS",
      version: "1.0.0",
    })
    .ele("wfs:Update", { typeName: "cris:polygon_features" })
    .ele("wfs:Property")
    .ele("wfs:Name")
    .txt("color")
    .up()
    .ele("wfs:Value")
    .txt(feature.values_.color)
    .up()
    .up()
    .ele("wfs:Property")
    .ele("wfs:Name")
    .txt("geom")
    .up()
    .ele("wfs:Value")
    .ele("gml:Polygon", {
      srsName: "EPSG:32636",
    })
    .ele("gml:outerBoundaryIs")
    .ele("gml:LinearRing")
    .ele("gml:coordinates")
    .txt(coordinates)
    .up()
    .up()
    .up()
    .up()
    .up()
    .up()
    .ele("ogc:Filter")
    .ele("ogc:FeatureId", { fid: feature.id_ })
    .up()
    .end({ prettyPrint: true });

  return xml;
};

export const deleteGMLFeature = (id: string) => {
  const xml = create({ version: "1.0", encoding: "UTF-8" })
    .ele("wfs:Transaction", {
      "xmlns:wfs": "http://www.opengis.net/wfs",
      "xmlns:gml": "http://www.opengis.net/gml",
      "xmlns:feature": "http://localhost/g",
      "xmlns:ogc": "http://www.opengis.net/ogc",
      service: "WFS",
      version: "1.0.0",
    })
    .ele("wfs:Update", { typeName: "cris:polygon_features" })
    .ele("wfs:Property")
    .ele("wfs:Name")
    .txt("is_deleted")
    .up()
    .ele("wfs:Value")
    .txt("true")
    .up()
    .up()
    .ele("ogc:Filter")
    .ele("ogc:FeatureId", { fid: id })
    .up()
    .end({ prettyPrint: true });

  return xml;
};
