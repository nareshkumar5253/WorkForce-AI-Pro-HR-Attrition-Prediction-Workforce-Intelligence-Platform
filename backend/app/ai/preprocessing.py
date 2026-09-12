import re

import numpy as np
import pandas as pd


TARGET_COLUMN = "Attrition"


# ============================================================
# COLUMN NAME NORMALIZATION
# ============================================================

def normalize_column_name(column_name: str) -> str:
    """
    Convert dataset column names into consistent names.

    Examples:
        "Job Sat."          -> "job_sat"
        "Years @ Company"   -> "years_at_company"
        "Distance (km)"     -> "distance_km"
        "Monthly Income"    -> "monthly_income"
        "Work-Life"         -> "work_life"
    """

    column_name = str(
        column_name
    ).strip().lower()

    # Handle @ before removing special characters
    column_name = column_name.replace(
        "@",
        " at ",
    )

    # Handle &
    column_name = column_name.replace(
        "&",
        " and ",
    )

    # Replace all non-alphanumeric characters
    column_name = re.sub(
        r"[^a-z0-9]+",
        "_",
        column_name,
    )

    # Remove duplicate underscores
    column_name = re.sub(
        r"_+",
        "_",
        column_name,
    )

    return column_name.strip("_")


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

def clean_column_names(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Normalize all dataframe column names.
    """

    dataframe = df.copy()

    dataframe.columns = [
        normalize_column_name(column)
        for column in dataframe.columns
    ]

    return dataframe


# ============================================================
# FIND TARGET COLUMN
# ============================================================

def find_target_column(
    df: pd.DataFrame,
) -> str:
    """
    Find the Attrition target column regardless of
    capitalization or formatting differences.
    """

    for column in df.columns:

        normalized = normalize_column_name(
            column
        )

        if normalized == "attrition":
            return column

    raise ValueError(
        "Attrition target column was not found in the dataset."
    )


# ============================================================
# BASIC DATAFRAME CLEANING
# ============================================================

def clean_dataframe(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Clean dataframe and normalize column names.

    IMPORTANT:
    Column normalization is performed here so both
    training and prediction use exactly the same
    column naming convention.
    """

    dataframe = df.copy()

    # --------------------------------------------------------
    # Normalize column names
    # --------------------------------------------------------

    dataframe = clean_column_names(
        dataframe
    )

    # --------------------------------------------------------
    # Remove completely empty rows
    # --------------------------------------------------------

    dataframe = dataframe.dropna(
        how="all"
    )

    # --------------------------------------------------------
    # Remove completely empty columns
    # --------------------------------------------------------

    dataframe = dataframe.dropna(
        axis=1,
        how="all",
    )

    # --------------------------------------------------------
    # Remove duplicate rows
    # --------------------------------------------------------

    dataframe = dataframe.drop_duplicates()

    # --------------------------------------------------------
    # Strip whitespace from string values
    # --------------------------------------------------------

    for column in dataframe.select_dtypes(
        include=["object"]
    ).columns:

        dataframe[column] = (
            dataframe[column]
            .astype(str)
            .str.strip()
        )

    return dataframe


# ============================================================
# CONVERT TARGET TO BINARY
# ============================================================

def convert_target_to_binary(
    series: pd.Series,
) -> pd.Series:
    """
    Convert common Attrition values into binary values.

    Positive:
        Yes / Y / 1 / True / Left / Attrition -> 1

    Negative:
        No / N / 0 / False / Stay / Stayed -> 0
    """

    def convert_value(value):

        if pd.isna(value):
            return np.nan

        value = str(
            value
        ).strip().lower()

        if value in {
            "yes",
            "y",
            "1",
            "true",
            "left",
            "attrition",
        }:
            return 1

        if value in {
            "no",
            "n",
            "0",
            "false",
            "stay",
            "stayed",
        }:
            return 0

        return np.nan

    return series.apply(
        convert_value
    )


# ============================================================
# PREPARE DATASET
# ============================================================

def prepare_dataset(
    df: pd.DataFrame,
):
    """
    Complete preprocessing pipeline.

    Returns:
        feature_df  -> cleaned feature dataframe
        y           -> binary target
        target_col  -> target column name
    """

    # --------------------------------------------------------
    # Clean dataframe
    # --------------------------------------------------------

    dataframe = clean_dataframe(
        df
    )

    # --------------------------------------------------------
    # Find target
    # --------------------------------------------------------

    target_col = find_target_column(
        dataframe
    )

    # --------------------------------------------------------
    # Convert target to binary
    # --------------------------------------------------------

    dataframe[target_col] = (
        convert_target_to_binary(
            dataframe[target_col]
        )
    )

    # --------------------------------------------------------
    # Remove rows where target is unknown
    # --------------------------------------------------------

    dataframe = dataframe.dropna(
        subset=[target_col]
    )

    # --------------------------------------------------------
    # Target
    # --------------------------------------------------------

    y = dataframe[
        target_col
    ].astype(int)

    # --------------------------------------------------------
    # Features
    # --------------------------------------------------------

    feature_df = dataframe.drop(
        columns=[target_col]
    )

    # --------------------------------------------------------
    # Remove identifier columns
    # --------------------------------------------------------

    identifier_columns = []

    for column in feature_df.columns:

        normalized = normalize_column_name(
            column
        )

        if normalized in {
            "no",
            "employee_id",
            "employee_number",
            "employee_code",
            "id",
        }:
            identifier_columns.append(
                column
            )

    if identifier_columns:

        feature_df = feature_df.drop(
            columns=identifier_columns
        )

    # --------------------------------------------------------
    # Convert numeric-looking object columns
    # --------------------------------------------------------

    for column in feature_df.columns:

        if feature_df[column].dtype == "object":

            converted = pd.to_numeric(
                feature_df[column],
                errors="coerce",
            )

            non_null_original = (
                feature_df[column]
                .notna()
                .sum()
            )

            non_null_converted = (
                converted.notna()
                .sum()
            )

            if (
                non_null_original > 0
                and
                (
                    non_null_converted
                    / non_null_original
                ) >= 0.8
            ):
                feature_df[column] = (
                    converted
                )

    # --------------------------------------------------------
    # Fill numerical missing values
    # --------------------------------------------------------

    numerical_columns = (
        feature_df
        .select_dtypes(
            include=np.number
        )
        .columns
    )

    for column in numerical_columns:

        median_value = (
            feature_df[column]
            .median()
        )

        if pd.isna(
            median_value
        ):
            median_value = 0

        feature_df[column] = (
            feature_df[column]
            .fillna(
                median_value
            )
        )

    # --------------------------------------------------------
    # Fill categorical missing values
    # --------------------------------------------------------

    categorical_columns = (
        feature_df
        .select_dtypes(
            include=[
                "object",
                "category",
            ]
        )
        .columns
    )

    for column in categorical_columns:

        mode = (
            feature_df[column]
            .mode()
        )

        fill_value = (
            mode.iloc[0]
            if not mode.empty
            else "Unknown"
        )

        feature_df[column] = (
            feature_df[column]
            .fillna(
                fill_value
            )
        )

    return (
        feature_df,
        y,
        target_col,
    )