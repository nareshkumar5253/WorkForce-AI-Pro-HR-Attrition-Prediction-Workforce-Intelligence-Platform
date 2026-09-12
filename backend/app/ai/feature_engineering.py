import pandas as pd

from app.ai.preprocessing import (
    normalize_column_name,
)


def add_engineered_features(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Create useful HR attrition features
    when the required source columns exist.
    """

    dataframe = df.copy()

    normalized_columns = {
        column: normalize_column_name(column)
        for column in dataframe.columns
    }

    reverse_mapping = {
        normalized: original
        for original, normalized
        in normalized_columns.items()
    }

    # --------------------------------------------------
    # Overtime Risk
    # --------------------------------------------------

    overtime_column = reverse_mapping.get(
        "overtime"
    )

    if overtime_column:

        dataframe["overtime_risk"] = (
            dataframe[overtime_column]
            .astype(str)
            .str.strip()
            .str.lower()
            .map(
                {
                    "yes": 1,
                    "y": 1,
                    "true": 1,
                    "1": 1,
                    "no": 0,
                    "n": 0,
                    "false": 0,
                    "0": 0,
                }
            )
            .fillna(0)
        )

    # --------------------------------------------------
    # Years at Company
    # --------------------------------------------------

    years_column = reverse_mapping.get(
        "years_company"
    )

    if years_column:

        dataframe["company_tenure_group"] = (
            pd.cut(
                pd.to_numeric(
                    dataframe[years_column],
                    errors="coerce",
                ),
                bins=[
                    -1,
                    2,
                    5,
                    10,
                    float("inf"),
                ],
                labels=[
                    "New",
                    "Developing",
                    "Experienced",
                    "Veteran",
                ],
            )
            .astype(str)
        )

    # --------------------------------------------------
    # Job Satisfaction Risk
    # --------------------------------------------------

    satisfaction_column = (
        reverse_mapping.get(
            "job_sat"
        )
    )

    if satisfaction_column:

        satisfaction = pd.to_numeric(
            dataframe[satisfaction_column],
            errors="coerce",
        )

        dataframe["low_job_satisfaction"] = (
            satisfaction
            .le(2)
            .astype(int)
        )

    # --------------------------------------------------
    # Work-Life Balance Risk
    # --------------------------------------------------

    worklife_column = (
        reverse_mapping.get(
            "work_life"
        )
    )

    if worklife_column:

        worklife = pd.to_numeric(
            dataframe[worklife_column],
            errors="coerce",
        )

        dataframe["poor_work_life_balance"] = (
            worklife
            .le(2)
            .astype(int)
        )

    # --------------------------------------------------
    # Performance Risk
    # --------------------------------------------------

    performance_column = (
        reverse_mapping.get(
            "performance"
        )
    )

    if performance_column:

        performance = pd.to_numeric(
            dataframe[performance_column],
            errors="coerce",
        )

        dataframe["low_performance"] = (
            performance
            .le(2)
            .astype(int)
        )

    # --------------------------------------------------
    # Income / Tenure relationship
    # --------------------------------------------------

    income_column = (
        reverse_mapping.get(
            "monthly_income"
        )
    )

    if (
        income_column
        and years_column
    ):

        income = pd.to_numeric(
            dataframe[income_column],
            errors="coerce",
        )

        tenure = pd.to_numeric(
            dataframe[years_column],
            errors="coerce",
        )

        dataframe["income_per_year"] = (
            income
            / (tenure + 1)
        )

    return dataframe


def get_feature_summary(
    df: pd.DataFrame,
):
    """
    Return a summary of numerical
    and categorical features.
    """

    numerical_features = (
        df.select_dtypes(
            include=["number"]
        )
        .columns
        .tolist()
    )

    categorical_features = (
        df.select_dtypes(
            include=[
                "object",
                "category",
            ]
        )
        .columns
        .tolist()
    )

    return {
        "total_features": len(
            df.columns
        ),
        "numerical_features": (
            numerical_features
        ),
        "categorical_features": (
            categorical_features
        ),
    }