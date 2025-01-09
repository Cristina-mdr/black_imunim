import axios from "axios";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

export const updatePolygon = async (
  editedPolygon: Feature<Geometry>,
  editedPolygonColor: string,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  const polygonToUpdate = editedPolygon;
  polygonToUpdate.set("color", editedPolygonColor);

  await axios
    .post("http://localhost:8000/update", {
      feature: polygonToUpdate,
    })
    .catch((error) => {
      if (error.response.data.error === "BADZONES INTERSECTION")
        setError("וואלה נחתך עם אזורים מסוכנים");
    });
};

export const deletePolygon = async (
  id: string | number,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  await axios.post("http://localhost:8000/delete", { id: id }).catch(() => {
    setError("יש שגיאההה");
  });
};
