from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .model_service import ModelPredictionError, ModelUnavailableError, model_service


app = FastAPI(
    title="Zoo Sentinel ML API",
    description="Model adapter for the Zoo Sentinel Random Forest integration.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Invalid prediction request",
            "details": exc.errors(),
        },
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "Zoo Sentinel ML API"}


@app.post("/predict")
def predict(request: dict[str, Any]) -> dict[str, Any]:
    if not request:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": "Invalid prediction request: JSON object must not be empty",
            },
        )

    try:
        prediction = model_service.predict(request)
    except ModelUnavailableError as exc:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": str(exc)},
        )
    except ModelPredictionError:
        return JSONResponse(
            status_code=502,
            content={"success": False, "error": "ML model prediction failed"},
        )

    return {"success": True, "prediction": prediction}
