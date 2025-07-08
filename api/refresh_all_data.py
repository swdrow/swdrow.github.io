# refresh_all_data.py
# Run all update jobs to refresh Redis cache for API startup
from app.tasks import (
    update_weather_data_job,
    update_water_data_job,
    update_forecast_scores_job,
    update_short_term_forecast_job,
    update_noaa_stageflow_job,
    update_extended_weather_data_job,
    update_extended_forecast_scores_job
)

def main():
    print("\n=== Refreshing all RowCast API data in Redis ===")
    update_weather_data_job()
    update_water_data_job()
    update_forecast_scores_job()
    update_short_term_forecast_job()
    update_noaa_stageflow_job()
    update_extended_weather_data_job()
    update_extended_forecast_scores_job()
    print("=== All data refreshed! ===\n")

if __name__ == "__main__":
    main()
