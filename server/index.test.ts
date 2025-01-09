import request from "supertest";
import app from "./src/index";
import { deleteGMLFeature } from "./src/xmlService";
import axios from "axios";

describe("delete query", () => {
  it("with mock", async () => {
    const mockDeleteGMLFeature = jest.spyOn(
      require("./src/xmlService"),
      "deleteGMLFeature"
    );
    const mockFeatureId = "feature123";

    const mockTransactionXML =
      '<?xmlversion="1.0"encoding="UTF-8"?><wfs:Transactionxmlns:wfs="http://www.opengis.net/wfs"xmlns:gml="http://www.opengis.net/gml"xmlns:feature="http://localhost/g"xmlns:ogc="http://www.opengis.net/ogc"service="WFS"version="1.0.0"><wfs:UpdatetypeName="cris:polygon_features"><wfs:Property><wfs:Name>is_deleted</wfs:Name><wfs:Value>true</wfs:Value></wfs:Property><ogc:Filter><ogc:FeatureIdfid="polygon_features.1"/></ogc:Filter></wfs:Update></wfs:Transaction>';
    mockDeleteGMLFeature.mockReturnValue(mockTransactionXML);

    // axios.post.mockResolvedValueOnce({ status: 200 });

    const response = await request(app)
      .post("/delete")
      .send({ id: mockFeatureId });

    expect(mockDeleteGMLFeature).toHaveBeenCalledWith(mockFeatureId);
    expect(response.status).toBe(200);
    expect(response.body).toBe(true);
  });

  it("return 200", async () => {
    const response = await request(app)
      .post("/delete")
      .send({ id: "polygon_features.32" });
    expect(response.status).toBe(200);
  });

  it("call deleteGMLFeature", async () => {
    const id = "polygon_features.1";
    const returnedValue = deleteGMLFeature(id);

    const EXPECTED = `<?xml version="1.0" encoding="UTF-8"?>
            <wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:feature="http://localhost/g" xmlns:ogc="http://www.opengis.net/ogc" service="WFS" version="1.0.0">
                <wfs:Update typeName="cris:polygon_features">
                    <wfs:Property>
                        <wfs:Name>is_deleted</wfs:Name>
                        <wfs:Value>true</wfs:Value>
                    </wfs:Property>
                     <ogc:Filter>
                        <ogc:FeatureId fid="${id}"/>
                    </ogc:Filter>
                </wfs:Update>
            </wfs:Transaction>`;

    const builderString = returnedValue.toString();
    const normalize = (str: string) => str.replace(/\s+/g, "");

    expect(normalize(builderString)).toBe(normalize(EXPECTED));
  });
});
