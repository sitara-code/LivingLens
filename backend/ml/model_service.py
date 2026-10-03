import os
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


class ModelUnavailableError(Exception):
    """Raised when the configured model cannot be used."""


class ModelPredictionError(Exception):
    """Raised when the configured model fails during prediction."""


class ModelService:
    def __init__(self, model_path: str | None = None) -> None:
        configured_path = model_path or os.getenv("MODEL_PATH")
        self.model_path = Path(configured_path).expanduser() if configured_path else None
        self._model: Any | None = None

    def _load_model(self) -> Any:
        if self.model_path is None:
            raise ModelUnavailableError("ML model not configured yet")

        if not self.model_path.is_file():
            raise ModelUnavailableError("Configured ML model file was not found")

        if self._model is None:
            try:
                self._model = joblib.load(self.model_path)
            except Exception as exc:
                raise ModelUnavailableError("Configured ML model could not be loaded") from exc

        return self._model

    def predict(self, payload: dict[str, Any]) -> Any:
        model = self._load_model()
        try:
            return predict_with_model(model, payload)
        except ModelUnavailableError:
            raise
        except Exception as exc:
            raise ModelPredictionError("ML model prediction failed") from exc


def predict_with_model(model: Any, payload: dict[str, Any]) -> Any:
    """Run the model against the received payload without changing its fields.

    Replace this function with the teammate's exact feature-engineering and
    Random Forest prediction pipeline when the trained model is integrated.
    """
    input_frame = pd.DataFrame([payload])
    prediction = model.predict(input_frame)
    return prediction.tolist() if hasattr(prediction, "tolist") else prediction


model_service = ModelService()
