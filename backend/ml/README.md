# Zoo Sentinel ML API

This is an independent FastAPI adapter for the trained Zoo Sentinel Random Forest model. It does not train a model, create a dataset, or alter the existing Express risk engine.

## Install

From the repository root, create or activate a Python environment and install the service dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ml\requirements.txt
```

If `.venv` already exists, activate it and run only the install command.

## Run

```powershell
python -m uvicorn ml.main:app --reload --port 8001
```

The service listens at `http://127.0.0.1:8001`.

- Health: `http://127.0.0.1:8001/health`
- Swagger UI: `http://127.0.0.1:8001/docs`
- Prediction: `POST http://127.0.0.1:8001/predict`

Until a trained model is configured, `/predict` returns HTTP 503 with `ML model not configured yet`. This is intentional and prevents an unverified result from being presented as ML output.

## Model integration handoff

Set `MODEL_PATH` to the teammate's trained `.joblib` file, for example:

```powershell
$env:MODEL_PATH = "C:\path\to\trained_model.joblib"
```

Then replace `predict_with_model` in `ml/model_service.py` with the teammate's exact feature-engineering and Random Forest prediction pipeline. The received JSON fields are passed without renaming or adding columns. No feature names, feature count, preprocessing, labels, or prediction values are defined by this adapter.

The Express-side helper is `server/ml-service.ts`. It is available for a future authenticated Express route or an existing server workflow; no current frontend route is changed or automatically redirected to the Python service.
