import os
import pickle
from datetime import datetime

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ai.feature_engineering import (
    add_engineered_features,
    get_feature_summary,
)
from app.ai.preprocessing import (
    clean_dataframe,
    prepare_dataset,
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_DIR = "ml_models"

LOGISTIC_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "attrition_logistic_regression.pkl",
)

RANDOM_FOREST_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "attrition_random_forest.pkl",
)

BEST_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "attrition_best_model.pkl",
)


# ============================================================
# PREPROCESSOR
# ============================================================

def build_preprocessor(X: pd.DataFrame):
    """
    Build preprocessing pipeline for numerical
    and categorical features.
    """

    numerical_features = (
        X.select_dtypes(
            include=["number"]
        )
        .columns
        .tolist()
    )

    categorical_features = (
        X.select_dtypes(
            include=[
                "object",
                "category",
                "bool",
            ]
        )
        .columns
        .tolist()
    )

    numerical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                ),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                ),
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    transformers = []

    if numerical_features:
        transformers.append(
            (
                "numerical",
                numerical_pipeline,
                numerical_features,
            )
        )

    if categorical_features:
        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            )
        )

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    return preprocessor


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    model,
    X_test,
    y_test,
):
    """
    Calculate classification metrics.
    """

    predictions = model.predict(
        X_test
    )

    if hasattr(
        model,
        "predict_proba",
    ):
        probabilities = model.predict_proba(
            X_test
        )[:, 1]
    else:
        probabilities = predictions

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    try:
        roc_auc = roc_auc_score(
            y_test,
            probabilities,
        )
    except ValueError:
        roc_auc = 0.0

    return {
        "accuracy": round(
            float(accuracy),
            4,
        ),
        "precision": round(
            float(precision),
            4,
        ),
        "recall": round(
            float(recall),
            4,
        ),
        "f1_score": round(
            float(f1),
            4,
        ),
        "roc_auc": round(
            float(roc_auc),
            4,
        ),
    }


# ============================================================
# TRAIN ATTRITION MODELS
# ============================================================

def train_attrition_models(
    dataframe: pd.DataFrame,
):
    """
    Train Logistic Regression and Random Forest
    models and automatically select the best model.
    """

    os.makedirs(
        MODEL_DIR,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Prepare dataset
    # --------------------------------------------------------

    X, y, target_column = prepare_dataset(
        dataframe
    )

    # --------------------------------------------------------
    # Feature engineering
    # --------------------------------------------------------

    X = add_engineered_features(
        X
    )

    feature_summary = get_feature_summary(
        X
    )

    # --------------------------------------------------------
    # Validate target
    # --------------------------------------------------------

    unique_classes = sorted(
        y.unique().tolist()
    )

    if len(unique_classes) < 2:
        raise ValueError(
            "Attrition dataset must contain both "
            "positive and negative target classes."
        )

    # --------------------------------------------------------
    # Train / test split
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y,
        )
    )

    # --------------------------------------------------------
    # Logistic Regression preprocessor
    # --------------------------------------------------------

    logistic_preprocessor = build_preprocessor(
        X_train
    )

    # --------------------------------------------------------
    # Logistic Regression pipeline
    # --------------------------------------------------------

    logistic_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                logistic_preprocessor,
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    logistic_pipeline.fit(
        X_train,
        y_train,
    )

    logistic_metrics = calculate_metrics(
        logistic_pipeline,
        X_test,
        y_test,
    )

    # --------------------------------------------------------
    # Random Forest preprocessor
    # --------------------------------------------------------

    rf_preprocessor = build_preprocessor(
        X_train
    )

    # --------------------------------------------------------
    # Random Forest pipeline
    # --------------------------------------------------------

    random_forest_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                rf_preprocessor,
            ),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=300,
                    max_depth=10,
                    min_samples_split=2,
                    min_samples_leaf=1,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    random_forest_pipeline.fit(
        X_train,
        y_train,
    )

    random_forest_metrics = calculate_metrics(
        random_forest_pipeline,
        X_test,
        y_test,
    )

    # --------------------------------------------------------
    # Select best model using F1 score
    # --------------------------------------------------------

    model_scores = {
        "Logistic Regression": (
            logistic_metrics["f1_score"]
        ),
        "Random Forest": (
            random_forest_metrics["f1_score"]
        ),
    }

    best_model_name = max(
        model_scores,
        key=model_scores.get,
    )

    if best_model_name == "Logistic Regression":

        best_model = logistic_pipeline

        best_metrics = logistic_metrics

        best_preprocessor = logistic_preprocessor

    else:

        best_model = random_forest_pipeline

        best_metrics = random_forest_metrics

        best_preprocessor = rf_preprocessor

    # --------------------------------------------------------
    # Save Logistic Regression
    # --------------------------------------------------------

    logistic_package = {
        "model": logistic_pipeline,
        "preprocessor": logistic_preprocessor,
        "model_name": "Logistic Regression",
        "target_column": target_column,
        "feature_columns": X.columns.tolist(),
        "feature_summary": feature_summary,
        "metrics": logistic_metrics,
        "trained_at": datetime.utcnow(),
    }

    with open(
        LOGISTIC_MODEL_PATH,
        "wb",
    ) as model_file:

        pickle.dump(
            logistic_package,
            model_file,
        )

    # --------------------------------------------------------
    # Save Random Forest
    # --------------------------------------------------------

    random_forest_package = {
        "model": random_forest_pipeline,
        "preprocessor": rf_preprocessor,
        "model_name": "Random Forest",
        "target_column": target_column,
        "feature_columns": X.columns.tolist(),
        "feature_summary": feature_summary,
        "metrics": random_forest_metrics,
        "trained_at": datetime.utcnow(),
    }

    with open(
        RANDOM_FOREST_MODEL_PATH,
        "wb",
    ) as model_file:

        pickle.dump(
            random_forest_package,
            model_file,
        )

    # --------------------------------------------------------
    # Save best model
    # --------------------------------------------------------

    trained_at = datetime.utcnow()

    model_package = {
        "model": best_model,
        "preprocessor": best_preprocessor,
        "model_name": best_model_name,
        "target_column": target_column,
        "feature_columns": X.columns.tolist(),
        "feature_summary": feature_summary,
        "metrics": best_metrics,
        "trained_at": trained_at,
    }

    with open(
        BEST_MODEL_PATH,
        "wb",
    ) as model_file:

        pickle.dump(
            model_package,
            model_file,
        )

    # --------------------------------------------------------
    # Return training result
    # --------------------------------------------------------

    return {
        "success": True,
        "target_column": target_column,
        "total_rows": len(dataframe),
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "total_features": len(
            X.columns
        ),
        "feature_summary": feature_summary,
        "models": {
            "logistic_regression": (
                logistic_metrics
            ),
            "random_forest": (
                random_forest_metrics
            ),
        },
        "best_model": best_model_name,
        "best_model_metrics": best_metrics,
        "model_path": BEST_MODEL_PATH,
    }


# ============================================================
# LOAD BEST MODEL
# ============================================================

def load_best_model():
    """
    Load the saved best attrition model.
    """

    if not os.path.exists(
        BEST_MODEL_PATH
    ):
        raise FileNotFoundError(
            "No trained attrition model found. "
            "Train the model first."
        )

    with open(
        BEST_MODEL_PATH,
        "rb",
    ) as model_file:

        return pickle.load(
            model_file
        )


# ============================================================
# PREDICT ATTRITION
# ============================================================

def predict_attrition(
    employee_data: dict,
):
    """
    Predict attrition for a single employee.

    Uses the same preprocessing and feature engineering
    pipeline that was used during model training.
    """

    # --------------------------------------------------------
    # Check model
    # --------------------------------------------------------

    if not os.path.exists(
        BEST_MODEL_PATH
    ):
        raise FileNotFoundError(
            "Trained attrition model not found. "
            "Please train the model first."
        )

    # --------------------------------------------------------
    # Load model package
    # --------------------------------------------------------

    package = load_best_model()

    model = package["model"]

    model_name = package["model_name"]

    trained_at = package.get(
        "trained_at"
    )

    feature_columns = package[
        "feature_columns"
    ]

    # --------------------------------------------------------
    # Convert employee data to DataFrame
    # --------------------------------------------------------

    dataframe = pd.DataFrame(
        [employee_data]
    )

    # --------------------------------------------------------
    # Apply same preprocessing
    # --------------------------------------------------------

    dataframe = clean_dataframe(
        dataframe
    )

    # --------------------------------------------------------
    # Apply same feature engineering
    # --------------------------------------------------------

    dataframe = add_engineered_features(
        dataframe
    )

    # --------------------------------------------------------
    # Validate required features
    # --------------------------------------------------------

    missing_columns = set(
        feature_columns
    ) - set(
        dataframe.columns
    )

    if missing_columns:

        raise ValueError(
            f"columns are missing: {missing_columns}"
        )

    # --------------------------------------------------------
    # Keep exact training features
    # --------------------------------------------------------

    dataframe = dataframe[
        feature_columns
    ]

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # The saved model is already a Pipeline.
    # The Pipeline contains:
    #
    #     preprocessor
    #     classifier
    #
    # Therefore we DO NOT manually call
    # preprocessor.transform().
    # --------------------------------------------------------

    prediction = int(
        model.predict(
            dataframe
        )[0]
    )

    # --------------------------------------------------------
    # Attrition probability
    # --------------------------------------------------------

    if hasattr(
        model,
        "predict_proba",
    ):

        probabilities = model.predict_proba(
            dataframe
        )[0]

        attrition_probability = float(
            probabilities[1] * 100
        )

    else:

        attrition_probability = (
            100.0
            if prediction == 1
            else 0.0
        )

    # --------------------------------------------------------
    # Return prediction
    # --------------------------------------------------------

    return {
        "prediction": prediction,
        "attrition_probability": round(
            attrition_probability,
            2,
        ),
        "model_name": model_name,
        "trained_at": trained_at,
    }