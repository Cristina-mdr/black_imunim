import { describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios");
const resetMap = vi.fn();

const updatePolygon = async () => {
  const polygonToUpdate = editedPolygon;
  polygonToUpdate.set("color", editedPolygonColor);

  try {
    await axios
      .post("http://localhost:8000/update", { feature: polygonToUpdate })
      .then(() => resetMap());
  } catch (error) {
    console.log(error);
  }
};

const editedPolygon = {
  set: vi.fn(),
};

let editedPolygonColor = "blue";

describe("updating polygon flow", () => {

  it(" update query", async () => {
    //axios.post.mockResolvedValueOnce({ data: true });

    await updatePolygon();

    expect(editedPolygon.set).toHaveBeenCalledWith("color", "blue");
    expect(axios.post).toHaveBeenCalledWith("http://localhost:8000/update", {
      feature: editedPolygon,
    });
    expect(resetMap).toHaveBeenCalledTimes(1);
  });

});
